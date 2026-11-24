import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker } from "../../cinematic/core/anim";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { Rain } from "../../cinematic/sets/S05_Sets";
import { LipSyncVideo } from "../LipSyncVideo";
import { KineticPlate } from "../KineticPlate";

const SCENE_ID = "03_pagol_monsoon_omen";

/**
 * Series 2 · Episode 1 · Scene 03 — Manasa Puja Monsoon Evening at Baidik Bari (1246 frames = 51.9s @ 24fps).
 *
 * Re-cut with Broadcast Multi-Angle TV Camera:
 *   - 4K Master Monsoon plate (`plate_3a_baidik_monsoon.jpg`) with zero blur or pixelation.
 *   - Clamped zoom values (1.00x - 1.18x max).
 *   - Dedicated physical acting plate: Ecstatic Pagol with arms thrown to monsoon heavens (`plate_3b_pagol_arms_raised.jpg`)
 *     featuring living breathing kinematics, drenched monsoon hair, and dynamic lightning response.
 *   - Dialogue lip-sync with living 0.25Hz chest breathing for Charushila and the Pagol.
 *
 * Voice (scene-local frames): 03a narrator 12..601 · 03b Pagol 617..895 · 03c Charu 911..1211.
 */

type Media = "ext" | "charuIdle" | "charuIdleReact" | "pagol" | "pagol_arms_raised" | "charuSpeak";
type Kind = "ext" | "charu" | "pagol";

interface Shot {
  from: number;
  to: number;
  media: Media;
  /** Point in the 1920×1080 plate to frame on, and where on screen it should sit. */
  focus: [number, number];
  target: [number, number];
  /** Zoom at the start and end of the shot (1 = full plate). Keep ≤ 1.8: the sources are 1080p. */
  zoom: [number, number];
  /** Cross-dissolve in from the previous shot, in frames (0 = hard cut). */
  dissolve?: number;
  /** Rain overlay for this framing. */
  rain: "heavy" | "light" | "none";
  note: string;
}

const CHARU_FACE: [number, number] = [980, 320];
const PAGOL_FACE: [number, number] = [1020, 320];

// Cut points come from pauses in the voice track (see header).
const SHOTS: Shot[] = [
  { from: 0, to: 110, media: "ext", focus: [960, 540], target: [960, 540], zoom: [1.0, 1.05], rain: "heavy", note: "Wide: Baidik Bari in the monsoon" },
  { from: 110, to: 215, media: "ext", focus: [1480, 800], target: [1060, 560], zoom: [1.12, 1.18], rain: "heavy", note: "Insert: lit tulsi mancha in the rain" },
  { from: 215, to: 297, media: "ext", focus: [380, 600], target: [760, 560], zoom: [1.14, 1.08], rain: "heavy", note: "Medium: lamp-lit arched veranda (pull back)" },
  { from: 297, to: 392, media: "charuIdle", focus: CHARU_FACE, target: [960, 360], zoom: [1.0, 1.06], dissolve: 14, rain: "light", note: "Medium: Charushila on the veranda" },
  { from: 392, to: 499, media: "charuIdle", focus: CHARU_FACE, target: [960, 380], zoom: [1.08, 1.15], rain: "none", note: "Close-up: Charushila, the three dreams" },
  { from: 499, to: 615, media: "ext", focus: [1700, 300], target: [960, 470], zoom: [1.08, 1.14], rain: "heavy", note: "Insert: dark garden thrashing in the storm" },
  { from: 615, to: 661, media: "pagol", focus: [960, 540], target: [960, 540], zoom: [1.0, 1.04], rain: "heavy", note: "Lightning — wide: the Pagol appears" },
  { from: 661, to: 724, media: "pagol", focus: PAGOL_FACE, target: [960, 420], zoom: [1.06, 1.12], rain: "heavy", note: "Close-up push: the Pagol speaks" },
  { from: 724, to: 804, media: "pagol_arms_raised", focus: [960, 480], target: [960, 480], zoom: [1.02, 1.08], rain: "heavy", note: "Acting Cut: Pagol throws arms to the sky in ecstatic prophecy" },
  { from: 804, to: 908, media: "charuIdleReact", focus: CHARU_FACE, target: [640, 450], zoom: [1.08, 1.14], rain: "light", note: "Reaction: Charushila on the left, rainy courtyard behind (Pagol V.O.)" },
  { from: 908, to: 1014, media: "charuSpeak", focus: CHARU_FACE, target: [960, 380], zoom: [1.04, 1.10], rain: "light", note: "Medium: Charushila speaks" },
  { from: 1014, to: 1071, media: "charuSpeak", focus: [700, 300], target: [800, 470], zoom: [1.08, 1.14], rain: "none", note: "Angle: past the hanging lamp" },
  { from: 1071, to: 1130, media: "ext", focus: [560, 920], target: [960, 700], zoom: [1.10, 1.16], rain: "heavy", note: "Insert: empty lamp-lit veranda in the rain (Charu V.O.)" },
  { from: 1130, to: 1246, media: "charuSpeak", focus: CHARU_FACE, target: [960, 420], zoom: [1.08, 1.18], rain: "none", note: "Close-up push: 'something wondrous is coming'" },
];

const kindOf = (m: Media): Kind => (m === "ext" ? "ext" : m === "charuSpeak" || m === "charuIdle" || m === "charuIdleReact" ? "charu" : "pagol");

/** Translate so `focus` lands on `target` at zoom `s`, clamped so the plate always covers the frame. */
const framing = (focus: [number, number], target: [number, number], s: number) => {
  const tx = Math.min(0, Math.max(1920 * (1 - s), target[0] - s * focus[0]));
  const ty = Math.min(0, Math.max(1080 * (1 - s), target[1] - s * focus[1]));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
};

const MediaLayer: React.FC<{ media: Media; flash: number }> = ({ media, flash }) => {
  const fill: React.CSSProperties = { width: 1920, height: 1080, objectFit: "cover" };
  const lit = flash > 0.02 ? `brightness(${1 + flash * 0.42})` : undefined;
  switch (media) {
    case "ext":
      return <Img src={staticFile("images/s2_ep01/4k/plate_3a_baidik_monsoon_grand.jpg")} style={{ ...fill, filter: lit }} />;
    case "charuIdle":
      // Same time base as the original cut, so the idle clip plays through 297..615 continuously.
      return (
        <Sequence from={290} durationInFrames={330} layout="none">
          <OffthreadVideo src={staticFile("video/s2_ep01/p3c_charu_idle_24.mp4")} muted style={fill} />
        </Sequence>
      );
    case "charuIdleReact":
      return (
        <Sequence from={804} durationInFrames={104} layout="none">
          <OffthreadVideo src={staticFile("video/s2_ep01/p3c_charu_idle_24.mp4")} muted style={fill} />
        </Sequence>
      );
    case "pagol":
      return (
        <LipSyncVideo src="video/s2_ep01/p3b_pagol_03b_24.mp4" voice="03b_Pagol_Omen.wav" scene={SCENE_ID} style={{ filter: lit }} />
      );
    case "pagol_arms_raised":
      return (
        <KineticPlate
          src="images/s2_ep01/plate_3b_pagol_arms_raised.jpg"
          breathSpeed={0.4}
          breathAmp={4.5}
          swayAmp={3.5}
          eyes={{ left: [938, 385], right: [994, 386], rx: 16, ry: 5, color: "#2d1b11" }}
          style={{ filter: lit }}
        />
      );
    case "charuSpeak":
      return <LipSyncVideo src="video/s2_ep01/p3c_charu_03c_24.mp4" voice="03c_Charu_Wonder.wav" scene={SCENE_ID} />;
  }
};

export const Scene03PagolMonsoonBaidikBari: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 15);

  // Lightning strikes & damped thunder camera-shake
  const strikes = [95, 235, 618, 760];
  let stormFlash = 0;
  let shakeX = 0;
  let shakeY = 0;
  let shakeRot = 0;
  for (const s of strikes) {
    const d = f - s;
    if (d >= 0 && d <= 14) stormFlash = Math.max(stormFlash, d <= 2 ? 1.0 : Math.pow(clamp(1 - (d - 2) / 11), 2));
    if (d >= 1 && d <= 26) {
      const env = Math.exp(-d * 0.16);
      shakeX += Math.sin(d * 2.5 + s) * 12 * env;
      shakeY += Math.cos(d * 2.9 + s) * 8 * env;
      shakeRot += Math.sin(d * 2.1) * 0.4 * env;
    }
  }

  const idx = Math.max(0, SHOTS.findIndex((s) => f >= s.from && f < s.to));
  const shot = SHOTS[idx];
  const kind = kindOf(shot.media);
  const isWet = kind !== "charu" || shot.rain === "heavy";
  // Flash only reads on exterior / Pagol framings.
  const flash = isWet ? stormFlash : stormFlash * 0.25;

  // Shots on screen now: the current one, plus the previous one while the current dissolves in.
  const visible: { shot: Shot; opacity: number }[] = [];
  if (shot.dissolve && f < shot.from + shot.dissolve && idx > 0) visible.push({ shot: SHOTS[idx - 1], opacity: 1 });
  visible.push({ shot, opacity: shot.dissolve ? EASE.inOut(clamp((f - shot.from) / shot.dissolve)) : 1 });

  // Small overscan so the thunder shake never shows an edge.
  const outer = `translate(${shakeX}px, ${shakeY}px) scale(1.03) rotate(${shakeRot}deg)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0a18", overflow: "hidden" }}>
      {/* PLANE 1: framed plate / lip-sync video */}
      <div style={{ position: "absolute", inset: 0, transform: outer, transformOrigin: "50% 50%" }}>
        {visible.map(({ shot: s, opacity }) => {
          const t = clamp((f - s.from) / Math.max(1, s.to - s.from));
          const zoom = s.zoom[0] + (s.zoom[1] - s.zoom[0]) * EASE.inOut(t);
          return (
            <AbsoluteFill key={s.from} style={{ opacity }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 1920,
                  height: 1080,
                  transformOrigin: "0 0",
                  transform: framing(s.focus, s.target, zoom),
                }}
              >
                <MediaLayer media={s.media} flash={flash} />
                {kindOf(s.media) === "charu" && (
                  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <GlowDefs />
                    {/* Hanging brass lamp above Charushila (plate position) */}
                    <Glow x={530} y={240} r={230} kind="warm" o={0.24 * fl} />
                  </svg>
                )}
              </div>
            </AbsoluteFill>
          );
        })}

        {/* Screen-space rain & lightning, matched to the framing */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {shot.rain === "heavy" && <Rain f={f} n={150} wind={-0.3} o={0.6} area={[-200, -100, 2320, 1280]} />}
          {shot.rain === "light" && <Rain f={f} n={60} wind={-0.3} o={0.3} area={[1250, -100, 720, 1280]} />}
          {flash > 0.02 && <rect x={0} y={0} width={1920} height={1080} fill="#dcecff" opacity={flash * 0.26} />}
        </svg>
      </div>

      {/* PLANE 2: mid-foreground mist, near rain, dream motes (Charu framings) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        <defs>
          <filter id="s2-sc03-mist-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="s2-sc03-dream-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        {[0, 1].map((i) => (
          <ellipse
            key={`sc03-mist-${i}`}
            cx={420 + i * 980 + Math.sin(f * 0.02 + i * 2) * 150 + shakeX * 1.38}
            cy={860 + i * 55 + shakeY * 1.38}
            rx={580}
            ry={72}
            fill={isWet ? "#8ca6c4" : "#d4b48c"}
            opacity={0.12}
            filter="url(#s2-sc03-mist-blur)"
          />
        ))}
        {shot.rain === "heavy" && <Rain f={f + 43} n={110} wind={-0.36} o={0.46} area={[-240, -120, 2400, 1320]} />}
        {/* Three golden dream-vision motes while the narrator tells of Charushila's dreams */}
        {f >= 297 && f < 499 &&
          [0, 1, 2].map((k) => {
            const pulse = 0.35 + 0.55 * Math.sin(f * 0.07 + k * 2.0) ** 2;
            return (
              <g key={`dream-orb-${k}`} opacity={pulse}>
                <circle cx={220 + k * 145 + Math.sin(f * 0.03 + k * 2.1) * 28} cy={260 + k * 150 + Math.cos(f * 0.025 + k * 1.7) * 24} r={18} fill="#ffbe55" filter="url(#s2-sc03-dream-glow)" />
                <circle cx={220 + k * 145 + Math.sin(f * 0.03 + k * 2.1) * 28} cy={260 + k * 150 + Math.cos(f * 0.025 + k * 1.7) * 24} r={4} fill="#fff6dc" />
              </g>
            );
          })}
      </svg>

      {/* PLANE 3: blurred foreground silhouette — only on wider framings, where it reads as depth */}
      {(shot.zoom[0] < 1.3 || shot.media === "ext") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transform: `translate(${shakeX * 1.75}px, ${shakeY * 1.75}px)`,
            filter: "blur(8px)",
          }}
        >
          {kind === "ext" ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {[0, 1, 2].map((i) => {
                const whip = Math.sin(f * 0.22 + i * 1.4) * 14;
                return (
                  <path
                    key={`sc03-palm-l-${i}`}
                    d={`M -140 ${70 + i * 130} Q ${130 + whip} ${30 + i * 120 + whip} ${290 + whip} ${135 + i * 135 + whip} Q ${110 + whip} ${130 + i * 130} -140 ${155 + i * 130} Z`}
                    fill="#060b12"
                    opacity={0.82}
                  />
                );
              })}
            </svg>
          ) : (
            <div
              style={{
                position: "absolute",
                left: -110,
                top: -50,
                width: 160,
                height: 1180,
                background: "linear-gradient(90deg, rgba(10,7,18,0.9) 0%, rgba(24,16,38,0.45) 70%, transparent 100%)",
              }}
            />
          )}
        </div>
      )}

      {/* Soft cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 56%, rgba(6, 4, 14, 0.46) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* FOLEY: monsoon rain bed, louder on exterior framings; thunder on the strikes */}
      <Sequence from={0} durationInFrames={1246}>
        <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} loop volume={(lf) => (kindOf((SHOTS.find((s) => lf >= s.from && lf < s.to) ?? SHOTS[0]).media) === "charu" ? 0.17 : 0.26)} />
      </Sequence>
      <Sequence from={95} durationInFrames={110}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={618} durationInFrames={120}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.38} />
      </Sequence>
    </AbsoluteFill>
  );
};
