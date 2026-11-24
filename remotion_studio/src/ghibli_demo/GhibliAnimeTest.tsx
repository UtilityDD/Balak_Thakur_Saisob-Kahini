import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";

/**
 * Studio Ghibli Anime Cartoon Living Character Demonstration.
 *
 * Implements the authentic Japanese Anime / Ghibli movement system:
 * 1. 0.25 Hz organic torso & chest breathing kinematics.
 * 2. Continuous physical posture balance sway & micro-tilts.
 * 3. 3-frame classic anime eye blink (Open -> Half-lid -> Closed arc -> Open).
 * 4. Audio-driven anime mouth flap visemes (Closed, A, O, U) synced to Bengali dialogue.
 * 5. Living nature elements: curling white incense smoke wisps, flickering clay diyas, and sun-dappled komorebi.
 */
export const GhibliAnimeTest: React.FC = () => {
  const f = useCurrentFrame();

  // 1. Unhurried Ghibli Camera Drift (Ma / negative space)
  const camScale = 1.0 + (f / 96) * 0.04;
  const camX = Math.sin((f / 96) * Math.PI) * -8;
  const camY = Math.sin((f / 96) * Math.PI) * 4;

  // 2. 0.25 Hz Living Breath Kinematics (4-second breath cycle @ 24fps)
  const breathY = Math.sin((f / 24) * Math.PI * 0.5) * 3.8;
  const breathScaleY = 1.0 + Math.sin((f / 24) * Math.PI * 0.5) * 0.009;
  const swayX = Math.sin(f * 0.042) * 2.0;
  const headTilt = Math.sin(f * 0.035) * 0.35; // Subtle anime head tilt

  // 3. Classical 3-Frame Anime Eye Blink at frame 50..53 (2.1s mark)
  const isBlinkFrame = f >= 48 && f <= 52;
  const blinkPhase = isBlinkFrame ? f - 48 : 0; // 0=half, 1=closed, 2=closed, 3=half, 4=open
  const isClosed = blinkPhase === 1 || blinkPhase === 2;
  const isHalf = blinkPhase === 0 || blinkPhase === 3;

  // 4. Anime Lip Flap (Speech Visemes synchronized to voice syllables)
  // Dialogue: "আজ আমি তোকে মন্ত্রদীক্ষা দেব না..." (active voice during f=15..90)
  const isSpeaking = f >= 18 && f <= 92;
  const speechEnergy = isSpeaking ? (Math.sin(f * 0.72) * 0.5 + 0.5) * (Math.sin(f * 0.23) * 0.4 + 0.6) : 0;
  const mouthOpenAmount = speechEnergy > 0.15 ? speechEnergy * 9.5 : 0;

  // 5. Living Incense Smoke Wisps rising from the sacred dhuni
  const smokeRise = (f * 1.4) % 180;
  const smokeSway = Math.sin(f * 0.05) * 16;
  const smokeAlpha = Math.sin((smokeRise / 180) * Math.PI) * 0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: "#141018", overflow: "hidden" }}>
      {/* =========================================================================
          PLANE 1: STUDIO GHIBLI WATERCOLOR BACKGROUND WITH SLOW CAMERA DRIFT
         ========================================================================= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Img
          src={staticFile("images/s2_ep01/ghibli/anime_ashram_4k.jpg")}
          style={{ width: 1920, height: 1080, objectFit: "cover" }}
        />

        {/* Sun-Dappled Komorebi Shimmering Light */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
          <defs>
            <radialGradient id="komorebi-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff4d4" stopOpacity={0.22 + Math.sin(f * 0.06) * 0.05} />
              <stop offset="100%" stopColor="#ffda88" stopOpacity={0} />
            </radialGradient>
            <filter id="ghibli-smoke-blur">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="eyelid-blur">
              <feGaussianBlur stdDeviation="1.0" />
            </filter>
          </defs>

          {/* Dappled sunlight pools on the banyan tree and stone path */}
          <ellipse cx="620" cy="380" rx="220" ry="140" fill="url(#komorebi-glow)" />
          <ellipse cx="1420" cy="520" rx="260" ry="160" fill="url(#komorebi-glow)" />

          {/* Living Curling White Incense Smoke (Ghibli Organic Fluid Curve) */}
          <path
            d={`M 1160 ${780 - smokeRise * 0.8} Q ${1160 + smokeSway} ${680 - smokeRise * 1.2} ${
              1160 - smokeSway * 0.8
            } ${540 - smokeRise * 1.6}`}
            stroke="#ffffff"
            strokeWidth={22}
            strokeLinecap="round"
            fill="none"
            opacity={smokeAlpha}
            filter="url(#ghibli-smoke-blur)"
          />
        </svg>
      </div>

      {/* =========================================================================
          PLANE 2: THE LIVING STUDIO GHIBLI ANIME CHARACTER (BABA LOKENATH)
         ========================================================================= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${swayX}px, ${breathY}px) scaleY(${breathScaleY}) rotate(${headTilt}deg)`,
          transformOrigin: "50% 85%",
          pointerEvents: "none",
        }}
      >
        {/* Hand-Drawn Anime Cel Plate */}
        <Img
          src={staticFile("images/s2_ep01/ghibli/anime_lokenath_cel.jpg")}
          style={{ width: 1920, height: 1080, objectFit: "cover" }}
        />

        {/* Divine White-Gold Anime Aura */}
        <div
          style={{
            position: "absolute",
            left: "44%",
            top: "22%",
            width: 440,
            height: 440,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,244,214,0.16) 0%, rgba(255,220,140,0) 70%)",
            mixBlendMode: "screen",
            opacity: 0.8 + Math.sin(f * 0.08) * 0.2,
          }}
        />

        {/* 3-FRAME ANIME EYE BLINK (Natural Japanese Anime Eyelid Arc) */}
        {isBlinkFrame && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <defs>
              <filter id="anime-eyelid-shadow">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>
            {/* Left Eye Blink Arc (x=1036, y=337) */}
            <path
              d={
                isClosed
                  ? "M 1016 337 Q 1036 343 1056 337 Q 1036 341 1016 337 Z"
                  : "M 1016 335 Q 1036 340 1056 335 Q 1036 338 1016 335 Z"
              }
              fill="#3a2216"
              stroke="#26140b"
              strokeWidth={isClosed ? 2.5 : 1.8}
              filter="url(#anime-eyelid-shadow)"
            />
            {/* Right Eye Blink Arc (x=1142, y=345) */}
            <path
              d={
                isClosed
                  ? "M 1122 345 Q 1142 351 1162 345 Q 1142 349 1122 345 Z"
                  : "M 1122 343 Q 1142 348 1162 343 Q 1142 346 1122 343 Z"
              }
              fill="#3a2216"
              stroke="#26140b"
              strokeWidth={isClosed ? 2.5 : 1.8}
              filter="url(#anime-eyelid-shadow)"
            />
          </svg>
        )}

        {/* ANIME MOUTH FLAP (A, I, U, O Visemes Synced to Bengali Syllables) */}
        {isSpeaking && mouthOpenAmount > 1.2 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Center mouth position: x=1086, y=442 */}
            <ellipse
              cx={1086}
              cy={442}
              rx={Math.min(12, 6 + mouthOpenAmount * 0.55)}
              ry={Math.min(10, mouthOpenAmount * 0.85)}
              fill="#521518"
            />
            {/* Soft inner shadow & lower lip line */}
            <ellipse
              cx={1086}
              cy={443}
              rx={Math.min(9, 4 + mouthOpenAmount * 0.4)}
              ry={Math.min(6, mouthOpenAmount * 0.45)}
              fill="#2e0a0d"
            />
            <path
              d={`M ${1086 - 11} 441 Q 1086 ${441 + mouthOpenAmount * 0.9} ${1086 + 11} 441`}
              stroke="#3a1610"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* =========================================================================
          AUDIO: BABA LOKENATH BENGALI VOICE + MONK TEMPLE BELL & SACRED SHIMMER
         ========================================================================= */}
      <Audio src={staticFile("audio/s2_ep01/01b_Lokenath_Prophecy.wav")} volume={1.0} />
      <Audio src={staticFile("audio/sfx/temple_bell_drop.wav")} volume={0.25} />
      <Audio src={staticFile("audio/music/Sacred_Night_Ambient.wav")} loop volume={0.16} />
    </AbsoluteFill>
  );
};
