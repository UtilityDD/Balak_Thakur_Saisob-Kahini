import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, flicker, track } from "../cinematic/core/anim";
import { Motes } from "../cinematic/divine/Divine";
import { Glow, GlowDefs } from "../cinematic/fx/Fx";
import { SeriesSubtitles } from "../episode/SeriesSubtitles";

/**
 * 12.5-Second Broadcast TV Anime + Dual-Character RTX 4060 JoyVASA Demo (300 frames @ 24fps)
 * 4-Shot TV Anime Camera Choreography:
 *   Shot 1 (0..92):    Medium-Wide Establishing Push-In on Plate A (Baba Lokenath speaking)
 *   Shot 2 (92..130):  Dramatic TV Anime Close-Up Cut on Baba Lokenath's face & expressive lips/eyes
 *   Shot 3 (130..235): Dynamic Pan + Push-In on Plate B with BOTH Baba Lokenath (speaking) AND
 *                      Jogesh Chowdhury (blinking & reacting in awe) animated simultaneously!
 *   Shot 4 (235..300): Tight Emotional Reaction Close-Up on Jogesh's face & cupped hands!
 */

export const PAINTED_DEMO_FRAMES = 300;
const SHOT_B_START = 130;

const DEMO_CUES = [
  { from: 6, to: 128, text: "যোগেশ, আজ আমি তোকে মন্ত্রদীক্ষা দেব না।", speaker: "লোকনাথ ব্রহ্মচারী" },
  { from: 132, to: 288, text: "এই গেরুয়া কাপড়খানি সযত্নে রেখে দে।", speaker: "লোকনাথ ব্রহ্মচারী" },
];

export const ParamBismoyPaintedDemo: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 11);
  const isShotB = f >= SHOT_B_START;

  // Dynamic 4-shot TV Anime camera choreography
  let camScale = 1.04;
  let camX = 0;
  let camY = 0;

  if (f < 92) {
    // Shot 1: Medium-Wide Establishing Push-In on Plate A
    camScale = track(f, [[0, 1.02], [92, 1.15]]);
    camX = track(f, [[0, 22], [92, -18]]);
    camY = track(f, [[0, -6], [92, 18]]);
  } else if (f < SHOT_B_START) {
    // Shot 2: Dramatic TV Anime Close-Up on Baba Lokenath's face!
    camScale = track(f, [[92, 1.58], [SHOT_B_START, 1.66]]);
    camX = track(f, [[92, 115], [SHOT_B_START, 125]]);
    camY = track(f, [[92, 235], [SHOT_B_START, 245]]);
  } else if (f < 235) {
    // Shot 3: Dynamic Pan + Push-In across Plate B (BOTH characters animated!)
    camScale = track(f, [[SHOT_B_START, 1.05], [235, 1.2]]);
    camX = track(f, [[SHOT_B_START, 48], [235, -36]]);
    camY = track(f, [[SHOT_B_START, 0], [235, 22]]);
  } else {
    // Shot 4: Emotional Reaction Close-Up on Jogesh's animated face & cupped hands!
    camScale = track(f, [[235, 1.48], [PAINTED_DEMO_FRAMES, 1.56]]);
    camX = track(f, [[235, -310], [PAINTED_DEMO_FRAMES, -335]]);
    camY = track(f, [[235, 130], [PAINTED_DEMO_FRAMES, 140]]);
  }

  const lantern = isShotB ? { x: 230, y: 280 } : { x: 370, y: 295 };
  const diya = isShotB ? { x: 1152, y: 810 } : { x: 1086, y: 940 };

  const fadeIn = clamp(f / 12);
  const fadeOut = clamp((PAINTED_DEMO_FRAMES - f) / 16);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0814", opacity: Math.min(fadeIn, fadeOut) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
          transformOrigin: "50% 48%",
        }}
      >
        {/* Shots 1 & 2 (0..130): Expressive JoyVASA Baba Lokenath on Plate A */}
        <Sequence from={0} durationInFrames={SHOT_B_START}>
          <OffthreadVideo
            src={staticFile("video/s2_ep01/plate_a_lokenath_lap_lokenath_partA.mp4")}
            muted
            style={{ width: 1920, height: 1080, objectFit: "cover" }}
          />
        </Sequence>

        {/* Shots 3 & 4 (130..300): Dual-Character Composite on Plate B (Baba Lokenath + Jogesh BOTH animated!) */}
        <Sequence from={SHOT_B_START} durationInFrames={PAINTED_DEMO_FRAMES - SHOT_B_START}>
          <OffthreadVideo
            src={staticFile("video/s2_ep01/plate_b_lokenath_handover_lokenath_partB.mp4")}
            // Clip is generated from the full 01b WAV (frame 0 = start of the line), which plays from demo frame 0,
            // so part B must start SHOT_B_START frames into the clip to stay on the words.
            trimBefore={SHOT_B_START}
            muted
            style={{ width: 1920, height: 1080, objectFit: "cover" }}
          />
          {/* Right 48% overlaid with animated listening Jogesh (feathered mask along the vertical wall pillar) */}
          <div
            style={{
              position: "absolute",
              left: "52%",
              top: 0,
              width: "48%",
              height: "100%",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 100%)",
            }}
          >
            <OffthreadVideo
              src={staticFile("video/s2_ep01/plate_b_jogesh_half_jogesh_listen.mp4")}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </Sequence>

        {/* Atmospheric lantern/diya flicker, ochre cloth shimmer & drifting golden motes */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <GlowDefs />
          <Glow x={lantern.x} y={lantern.y} r={240} kind="warm" o={0.26 * fl} />
          <Glow x={diya.x} y={diya.y} r={160} kind="warm" o={0.3 * fl} />
          {isShotB && <Glow x={1035} y={515} r={180} kind="warm" o={0.28 + 0.12 * Math.sin(f * 0.18)} />}
          <Motes f={f} x={920} y={480} n={22} spread={700} seed={33} />
        </svg>
      </div>

      {/* Cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 48%, transparent 56%, rgba(8, 5, 16, 0.46) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Full 48kHz studio Bengali voiceover + ducked crickets & sacred night ambient (no burned-in subtitle text) */}
      <Sequence from={0} durationInFrames={PAINTED_DEMO_FRAMES}>
        <Audio src={staticFile("audio/s2_ep01/01b_Lokenath_Prophecy.wav")} volume={1} />
        <Audio src={staticFile("audio/ep02/deep/deep_bengal_night_crickets.wav")} loop volume={0.22} />
        <Audio src={staticFile("audio/music/Sacred_Night_Ambient.wav")} loop volume={0.1} />
      </Sequence>
    </AbsoluteFill>
  );
};
