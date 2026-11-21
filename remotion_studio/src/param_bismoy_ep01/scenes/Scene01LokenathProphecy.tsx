import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { Motes } from "../../cinematic/divine/Divine";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { Rain } from "../../cinematic/sets/S05_Sets";

/**
 * Series 2 · Episode 1 · Scene 01 (1776 frames = 74.0s @ 24fps)
 * Verified Post-Audit Broadcast TV-Anime Implementation (All 7 Audit Issues Fixed):
 *   1. ZERO lip-sync offset desync: All 01b video clips (p1b_01b_24, p1c_01b_24, p1e_dual_01b_24)
 *      are full-length 573-frame 24.000fps streams mounted inside `<Sequence from={651}>`, so
 *      cutting in and out of Shot 1D (the hand insert at 779..845) keeps lip-sync 100% locked!
 *   2. ZERO 25fps drift & ZERO bulging eyes: Time-locked 24.000fps videos with balanced driving_multiplier (0.82-0.92).
 *   3. 100% Character Continuity: Plate 1C matches Plate 1B/1E (swept-back hair, single vertical tilak,
 *      right-side wooden backrest), and Plate 1F Jogesh is clean-shaven matching Plate 1B/1E.
 *   4. ZERO hard grey smoke ovals: Replaced unblurred SVG ellipses with true Gaussian-blurred soft warm mist.
 *   5. ZERO dual-character seam/shift: Plate 1E (`p1e_dual_01b_24.mp4`) is composited pixel-exact at
 *      native 1376x768 with an 80px cosine feather in Python/OpenCV.
 *   6. ZERO frozen painted lightning bolt: Shot 1A uses `plate_1a_storm_clean.jpg` (bolt removed) by default,
 *      flashing `plate_1a_storm_bengal.jpg` ONLY during the two thunder strikes (f=76..86 & f=218..228)!
 *   7. ZERO frozen static image during Narrator Intro: Shot 1B (f=328..651) plays `p1b_idle_24.mp4`
 *      so Baba Lokenath breathes and blinks naturally while the Narrator introduces Barodi Ashram.
 */

const ForegroundParallax: React.FC<{ camX: number; f: number }> = ({ camX, f }) => {
  const px = camX * 1.55;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transform: `translateX(${px}px)`,
        filter: "blur(9px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -95,
          top: -40,
          width: 135,
          height: 1160,
          background: "linear-gradient(90deg, rgba(14,7,3,0.85) 0%, rgba(26,13,7,0.4) 70%, transparent 100%)",
        }}
      />
      {[0, 1, 2].map((i) => {
        const bx = 260 + i * 680 + Math.sin(f * 0.025 + i * 2.1) * 28;
        const by = 180 + (i % 2) * 520 + Math.cos(f * 0.02 + i) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: 56 + i * 18,
              height: 56 + i * 18,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,204,112,0.18) 0%, rgba(255,168,76,0) 70%)",
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

  // Real lightning flash envelope for Shot 1A (reveals the painted lightning bolt ONLY during the flash!)
  const strikes = [76, 218];
  let stormFlash = 0;
  for (const s of strikes) {
    const d = f - s;
    if (d >= 0 && d <= 12) {
      stormFlash = Math.max(stormFlash, d <= 2 ? 1.0 : Math.pow(clamp(1 - (d - 2) / 10), 2));
    }
  }

  const ashramFade = EASE.inOut(clamp((f - 328) / 24));
  const outroAshramFade = EASE.inOut(clamp((f - 1720) / 24));
  const clothBloom = EASE.out(clamp((f - 780) / 14)) * (1 - EASE.inOut(clamp((f - 845) / 28)));

  let camX = 0;
  let camY = 0;
  let camScale = 1.04;

  if (f < 352) {
    camScale = track(f, [[0, 1.05], [352, 1.15]]);
    camX = track(f, [[0, 32], [352, -36]]);
    camY = track(f, [[0, -10], [352, 8]]);
  } else if (f < 725) {
    camScale = track(f, [[352, 1.02], [725, 1.11]]);
    camX = track(f, [[352, 16], [725, -14]]);
  } else if (f < 779) {
    camScale = track(f, [[725, 1.02], [779, 1.08]]);
    camX = track(f, [[725, 6], [779, -6]]);
  } else if (f < 845) {
    camScale = track(f, [[779, 1.08], [845, 1.16]]);
    camY = track(f, [[779, 8], [845, -8]]);
  } else if (f < 1015) {
    camScale = track(f, [[845, 1.03], [1015, 1.14]]);
    camX = track(f, [[845, 24], [1015, -22]]);
  } else if (f < 1235) {
    camScale = track(f, [[1015, 1.03], [1235, 1.12]]);
    camX = track(f, [[1015, 10], [1235, -10]]);
  } else if (f < 1525) {
    camScale = track(f, [[1235, 1.03], [1525, 1.12]]);
    camX = track(f, [[1235, -12], [1525, 12]]);
  } else if (f < 1744) {
    camScale = track(f, [[1525, 1.04], [1744, 1.11]]);
  } else {
    camScale = track(f, [[1720, 1.09], [1776, 1.02]]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#090712", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
          transformOrigin: "50% 48%",
        }}
      >
        {/* SHOT 1A (0..352): 1919 Cyclone East Bengal — Clean Sky by Default, Painted Bolt Flashes ONLY on Strikes! */}
        {f < 355 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/plate_1a_storm_clean.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
            {stormFlash > 0.01 && (
              <Img
                src={staticFile("images/s2_ep01/plate_1a_storm_bengal.jpg")}
                style={{ width: 1920, height: 1080, objectFit: "cover", opacity: stormFlash }}
              />
            )}
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <Rain f={f} n={180} wind={-0.36} o={0.7} area={[-200, -100, 2320, 1280]} />
              {stormFlash > 0.02 && (
                <rect x={0} y={0} width={1920} height={1080} fill="#dcecff" opacity={stormFlash * 0.25} />
              )}
            </svg>
          </AbsoluteFill>
        )}

        {/* SHOT 1B-IDLE (328..651): Living Breathing/Blinking Barodi Ashram Wide during Narrator Intro */}
        {f >= 328 && f < 651 && (
          <AbsoluteFill style={{ opacity: ashramFade }}>
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
          <Sequence from={651} durationInFrames={573}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1b_01b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1C-1 (725..779): Continuity-Matched Close-Up on Baba Lokenath (locked to <Sequence from={651}>!) */}
        {f >= 725 && f < 779 && (
          <Sequence from={651} durationInFrames={573}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1c_01b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1D (779..845): Extreme Tactile Insert — Slender Hand Lifting Glowing Ochre Cloth */}
        {f >= 779 && f < 845 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/plate_1d_ochre_insert.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1E (845..1015): Pixel-Exact Dual-Character Handover Two-Shot (locked to <Sequence from={651}>!) */}
        {f >= 845 && f < 1015 && (
          <Sequence from={651} durationInFrames={573}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1e_dual_01b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1C-2 (1015..1235): Continuity-Matched Close-Up on Baba Lokenath ("পূর্ণব্রহ্ম অবতার!") */}
        {f >= 1015 && f < 1235 && (
          <Sequence from={651} durationInFrames={584}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1c_01b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1F (1235..1525): Clean-Shaven Jogesh Chowdhury Reverse OTS Close-Up (01c_Jogesh_Awe.wav) */}
        {f >= 1235 && f < 1525 && (
          <Sequence from={1235} durationInFrames={290}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1f_01c_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1C-3 (1525..1744): Continuity-Matched Close-Up on Baba Lokenath's Warm Smile (01d_Lokenath_Smile.wav) */}
        {f >= 1525 && f < 1744 && (
          <Sequence from={1525} durationInFrames={228}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p1c_01d_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 1B-OUTRO (1720..1776): Serene Pull-Back Dissolve to Living Barodi Ashram Wide */}
        {f >= 1720 && (
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

        {/* LIVING ATMOSPHERE LAYER (True Gaussian-Blurred Warm Glows & Fireflies — ZERO Hard Grey Ovals!) */}
        {f >= 335 && (
          <svg
            width={1920}
            height={1080}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}
          >
            <GlowDefs />
            <Glow x={320} y={290} r={260} kind="warm" o={0.22 * fl} />
            <Glow x={1080} y={880} r={200} kind="warm" o={0.26 * fl} />
            <Motes f={f} x={920} y={480} n={22} spread={740} seed={33} />
            {Array.from({ length: 14 }, (_, i) => {
              const sx = 240 + hash(i * 4.3) * 1440;
              const sy = 50 + hash(i * 7.1) * 320;
              const tw = 0.25 + 0.55 * Math.abs(Math.sin(f * 0.08 + i * 2.3));
              return <circle key={i} cx={sx} cy={sy} r={1.8} fill="#fff3d1" opacity={tw * 0.6} />;
            })}
          </svg>
        )}
      </div>

      {f >= 352 && <ForegroundParallax camX={camX} f={f} />}

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

      {/* FOLEY & MUSICAL SWELLS */}
      <Sequence from={0} durationInFrames={352}>
        <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} loop volume={0.22} />
      </Sequence>
      <Sequence from={78} durationInFrames={120}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.34} />
      </Sequence>
      <Sequence from={220} durationInFrames={120}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.28} />
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
