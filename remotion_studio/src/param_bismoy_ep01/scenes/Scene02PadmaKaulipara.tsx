import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash } from "../../cinematic/core/anim";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { LipSyncVideo } from "../LipSyncVideo";
import { KineticPlate } from "../KineticPlate";

const SCENE_ID = "02_padma_kaulipara_warning";

/**
 * Series 2 · Episode 1 · Scene 02 — Kaulipara Ancestral Home on the Padma at Dawn (1380 frames = 57.5s @ 24fps).
 * Re-cut with Broadcast Multi-Angle TV Camera:
 *   - Clamped zoom values (maximum 1.02x - 1.20x) on 4K master plates ensuring zero blur or raster degradation.
 *   - 14 distinct cinematic shots: Panoramic river establishers, native riverbank boats, Baidik brick house,
 *     intimate Tulsi Mancha diya close-up, violent earth tremor & water spurt eruption, dynamic medium
 *     and close-up dialogue angles with living JoyVASA lip-sync + organic breathing, shocked villager reverse, and wide evacuation pull-back.
 *   - Dedicated physical acting plates: Wife pointing in terror at bubbling fissure, villager palms raised in disbelief.
 */

type Media =
  | "village_aerial"
  | "village_boats"
  | "house_exterior"
  | "tulsi_macro"
  | "wife_idle"
  | "spurt_wide"
  | "wife_speak_wide"
  | "wife_cu_02b"
  | "wife_point_speak"
  | "villager_cu_02c"
  | "villager_disbelief"
  | "spurt_macro"
  | "wife_cu_02d"
  | "padma_erosion"
  | "migration_evac";

interface Shot {
  from: number;
  to: number;
  media: Media;
  focus: [number, number];
  target: [number, number];
  zoom: [number, number];
  dissolve?: number;
  note: string;
}

const TULSI_DIYA: [number, number] = [760, 670];
const WIFE_FACE: [number, number] = [960, 380];
const VILLAGER_FACE: [number, number] = [960, 420];

// Broadcast TV Pacing Rule: Maximum hold on any single shot/angle ≤ 4.2s (~100 frames)
const SHOTS: Shot[] = [
  // 1. Wide aerial establishing pan across prosperous Kaulipara on the golden Padma at dawn (4.8s)
  { from: 0, to: 115, media: "village_aerial", focus: [960, 540], target: [960, 540], zoom: [1.0, 1.05], note: "Wide: Kaulipara on Padma at dawn" },
  // 2. Medium tracking shot across the Padma riverbank, fishing nouka boats, and palms (4.8s)
  { from: 115, to: 230, media: "village_boats", focus: [960, 540], target: [960, 540], zoom: [1.02, 1.07], dissolve: 14, note: "Medium: Riverbank & nouka boats" },
  // 3. Cut to prosperous Baidik ancestral brick house & courtyard (4.6s)
  { from: 230, to: 340, media: "house_exterior", focus: [960, 540], target: [960, 540], zoom: [1.02, 1.07], dissolve: 14, note: "Medium: Baidik ancestral house" },
  // 4. Intimate macro insert on the sacred Tulsi Mancha, clay diya glowing warmly in morning dew (4.2s)
  { from: 340, to: 440, media: "tulsi_macro", focus: TULSI_DIYA, target: [960, 540], zoom: [1.12, 1.18], dissolve: 12, note: "Insert: Sacred Tulsi Mancha & diya" },
  // 5. Serene wide courtyard stillness as she bows at Tulsi Mancha before the omen (4.2s)
  { from: 440, to: 540, media: "wife_idle", focus: [960, 540], target: [960, 540], zoom: [1.01, 1.06], dissolve: 12, note: "Wide: Wife bows in serenity before omen" },
  // 6. SUDDEN EARTH TREMOR & WATER SPURT! Ground shudders violently, water jet shoots up (5.5s)
  { from: 540, to: 672, media: "spurt_wide", focus: [960, 600], target: [960, 540], zoom: [1.06, 1.14], note: "Tremor: Sudden fissure & water eruption" },
  // 7. Wide Courtyard as Harnath's wife begins urgent warning ("ওগো, শিগগির এসো!") (3.5s)
  { from: 672, to: 755, media: "wife_speak_wide", focus: [960, 540], target: [960, 540], zoom: [1.02, 1.07], note: "Wide: Wife begins urgent warning" },
  // 8. Close-Up: Wife speaks in alarm ("দেখো, মাটির ফাটল দিয়ে...") (3.1s)
  { from: 755, to: 830, media: "wife_cu_02b", focus: WIFE_FACE, target: [960, 420], zoom: [1.02, 1.08], note: "Close-Up: Wife speaks with fear & alarm" },
  // 9. Acting Cut: Wife points at river fissure AND SPEAKS with full neural lip-sync ("কীর্তিনাশা পদ্মা তলা দিয়ে পুরো গ্রাম খেয়ে ফেলেছে—কাউলীপাড়া আর বাঁচবে না!") (4.9s)
  { from: 830, to: 948, media: "wife_point_speak", focus: [960, 460], target: [960, 460], zoom: [1.02, 1.08], note: "Acting Cut: Wife points at fissure and speaks with neural lip-sync" },
  // 10. Shocked elderly Kaulipara villager speaking ("কী বলছেন মা ঠাকরুন?...") (3.6s)
  { from: 948, to: 1035, media: "villager_cu_02c", focus: VILLAGER_FACE, target: [960, 430], zoom: [1.02, 1.08], note: "Reverse: Shocked villager cries in disbelief" },
  // 11. Acting Cut: Villager palms raised in shock & disbelief ("আটটা পোস্ট অফিস, চব্বিশটা টোল—এত বড় গ্রাম পদ্মায় ভেঙে যাবে?") (3.7s)
  { from: 1035, to: 1125, media: "villager_disbelief", focus: VILLAGER_FACE, target: [960, 420], zoom: [1.04, 1.10], note: "Acting Cut: Villager palms raised in shock & disbelief" },
  // 12. Urgent insert cut to the spurting Padma fracture widening the cracked red earth (2.1s)
  { from: 1125, to: 1175, media: "spurt_macro", focus: [960, 660], target: [960, 560], zoom: [1.10, 1.16], note: "Insert: Padma water bubbling violently" },
  // 13. Close-Up on Harnath's wife commanding evacuation ("এক মুহূর্ত দেরি কোরো না! যে যা পারো নিয়ে এখনই নিরাপদ জায়গায় সরে চলো—") (2.9s)
  { from: 1175, to: 1245, media: "wife_cu_02d", focus: WIFE_FACE, target: [960, 420], zoom: [1.02, 1.08], note: "Close-Up: Wife decisively commands evacuation" },
  // 14. Dramatic Active Padma Riverbank Erosion: Clay banks crashing into roaring waters (2.5s)
  { from: 1245, to: 1305, media: "padma_erosion", focus: [960, 540], target: [960, 540], zoom: [1.04, 1.12], note: "Erosion: Padma riverbank actively crumbling into waves" },
  // 15. The Grand Evacuation Migration: Long trail of families, bullock carts & belongings moving to safe land (3.1s)
  { from: 1305, to: 1380, media: "migration_evac", focus: [960, 540], target: [960, 540], zoom: [1.05, 1.01], dissolve: 14, note: "Migration: Villagers and bullock carts migrating to safety" },
];

/** Translate so `focus` lands on `target` at zoom `s`, clamped so the plate covers the 1920x1080 canvas. */
const framing = (focus: [number, number], target: [number, number], s: number) => {
  const tx = Math.min(0, Math.max(1920 * (1 - s), target[0] - s * focus[0]));
  const ty = Math.min(0, Math.max(1080 * (1 - s), target[1] - s * focus[1]));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
};

const MediaLayer: React.FC<{ media: Media }> = ({ media }) => {
  const fill: React.CSSProperties = { width: 1920, height: 1080, objectFit: "cover" };
  switch (media) {
    case "village_aerial":
      return <Img src={staticFile("images/s2_ep01/4k/plate_2a0_kaulipara_village.jpg")} style={fill} />;
    case "village_boats":
      // Uses dedicated native riverbank plate in 4K instead of cropping the aerial view
      return <Img src={staticFile("images/s2_ep01/4k/plate_2a_kaulipara_dawn.jpg")} style={fill} />;
    case "house_exterior":
    case "tulsi_macro":
      return <Img src={staticFile("images/s2_ep01/4k/plate_2a_house_tulsi_pan.jpg")} style={fill} />;
    case "wife_idle":
      return (
        <Sequence from={440} durationInFrames={120} layout="none">
          <OffthreadVideo src={staticFile("video/s2_ep01/p2a_wife_idle_24.mp4")} muted style={fill} />
        </Sequence>
      );
    case "spurt_wide":
    case "spurt_macro":
      return (
        <Sequence from={540} durationInFrames={140} layout="none">
          <OffthreadVideo src={staticFile("video/s2_ep01/p2a_wife_idle_24.mp4")} muted style={fill} />
        </Sequence>
      );
    case "wife_speak_wide":
      return <LipSyncVideo src="video/s2_ep01/p2a_wife_02b_24.mp4" voice="02b_Harnath_Wife.wav" scene={SCENE_ID} />;
    case "wife_cu_02b":
      return <LipSyncVideo src="video/s2_ep01/p2b_wife_02b_24.mp4" voice="02b_Harnath_Wife.wav" scene={SCENE_ID} />;
    case "wife_point_speak":
      return <LipSyncVideo src="video/s2_ep01/p2b_wife_point_02b_24.mp4" voice="02b_Harnath_Wife.wav" scene={SCENE_ID} />;
    case "villager_cu_02c":
      return <LipSyncVideo src="video/s2_ep01/p2c_villager_02c_24.mp4" voice="02c_Villager_Shock.wav" scene={SCENE_ID} />;
    case "villager_disbelief":
      return (
        <KineticPlate
          src="images/s2_ep01/plate_2c_villager_disbelief.jpg"
          breathSpeed={0.36}
          breathAmp={4.0}
          swayAmp={3.0}
          eyes={{ left: [935, 365], right: [1025, 368], rx: 18, ry: 5, color: "#361f14" }}
        />
      );
    case "wife_cu_02d":
      return <LipSyncVideo src="video/s2_ep01/p2b_wife_02d_24.mp4" voice="02d_Harnath_Wife_Lead.wav" scene={SCENE_ID} />;
    case "padma_erosion":
      return (
        <Img
          src={staticFile("images/s2_ep01/4k/plate_1a2_storm_boat.jpg")}
          style={{ ...fill, filter: "contrast(1.15) saturate(1.2)" }}
        />
      );
    case "migration_evac":
      return (
        <KineticPlate
          src="images/s2_ep01/4k/plate_2f_kaulipara_migration.jpg"
          breathSpeed={0.22}
          breathAmp={2.5}
          swayAmp={1.8}
        />
      );
  }
};

export const Scene02PadmaKaulipara: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 19);

  // Subtle earth-tremor camera vibration when subterranean water bursts through crack (f=558..608)
  let tremorX = 0;
  let tremorY = 0;
  if (f >= 558 && f <= 608) {
    const d = f - 558;
    const env = Math.exp(-d * 0.11);
    tremorX = Math.sin(d * 2.7) * 9 * env;
    tremorY = Math.cos(d * 3.1) * 7 * env;
  }

  const idx = Math.max(0, SHOTS.findIndex((s) => f >= s.from && f < s.to));
  const shot = SHOTS[idx];

  // Active shots on screen: current + previous during cross-dissolves
  const visible: { shot: Shot; opacity: number }[] = [];
  if (shot.dissolve && f < shot.from + shot.dissolve && idx > 0) {
    visible.push({ shot: SHOTS[idx - 1], opacity: 1 });
  }
  visible.push({ shot, opacity: shot.dissolve ? EASE.inOut(clamp((f - shot.from) / shot.dissolve)) : 1 });

  const totalX = tremorX;
  const totalY = tremorY;
  const showWaterJet = (f >= 558 && f < 964) || (f >= 1105 && f < 1157);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a120b", overflow: "hidden" }}>
      {/* PLANE 0 (0.45x Parallax): Warm Golden Sunrise Sky Horizon */}
      <div
        style={{
          position: "absolute",
          inset: -60,
          transform: `translate(${totalX * 0.45}px, ${totalY * 0.45}px)`,
          background: "linear-gradient(180deg, #f6c98e 0%, #fae2b8 55%, #8a9e68 100%)",
          pointerEvents: "none",
        }}
      />

      {/* PLANE 1: Virtual Camera Framed Plates & Living 24.000fps Neural Lip-Sync Streams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${totalX}px, ${totalY}px)`,
          transformOrigin: "50% 50%",
        }}
      >
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
                <MediaLayer media={s.media} />

                {/* Tulsi Mancha warm clay diya glow */}
                {(s.media === "tulsi_macro" || s.media === "house_exterior" || s.media === "wife_idle") && (
                  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <GlowDefs />
                    <Glow x={TULSI_DIYA[0]} y={TULSI_DIYA[1]} r={210} kind="warm" o={0.28 * fl} />
                  </svg>
                )}
              </div>
            </AbsoluteFill>
          );
        })}

        {/* Live Animated Water-Spurt Droplets & Spurt Mist */}
        {showWaterJet && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <GlowDefs />
            {Array.from({ length: 22 }, (_, i) => {
              const isMacro = shot.media === "spurt_macro";
              const baseX = isMacro ? 960 : 1052;
              const baseY = isMacro ? 880 : 945;
              const cycle = (f * (4.4 + (i % 5) * 0.55) + i * 17) % 110;
              const spread = ((i % 7) - 3) * (0.5 + cycle * 0.015);
              const dx = baseX + spread * 16 + Math.sin(f * 0.32 + i) * 6;
              const dy = baseY - cycle * 3.3 + 0.02 * cycle * cycle;
              const alpha = Math.sin((cycle / 110) * Math.PI) * 0.88;
              return <circle key={`drop-${i}`} cx={dx} cy={dy} r={2.5 + (i % 3)} fill="#e6f7ff" opacity={alpha} />;
            })}
          </svg>
        )}
      </div>

      {/* PLANE 2 (1.38x Parallax): Golden Morning River Mist & Floating Pollen Motes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `translate(${totalX * 1.38}px, ${totalY * 1.38}px)`,
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

      {/* PLANE 3 (1.75x Parallax, Blurred DOF): Out-of-Focus Foreground Mango/Palm Foliage */}
      {(shot.zoom[0] < 1.15 || shot.media === "village_aerial" || shot.media === "house_exterior" || shot.media === "migration_evac") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transform: `translate(${totalX * 1.75}px, ${totalY * 1.75}px)`,
            transformOrigin: "50% 50%",
            filter: "blur(7px)",
          }}
        >
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
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
      )}

      {/* Soft cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(24, 14, 6, 0.34) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* SCENE FOLEY: Subterranean Padma Water Spurt, Earth Tremor & River Surge */}
      <Sequence from={556} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.34} />
      </Sequence>
      <Sequence from={558} durationInFrames={36}>
        <Audio src={staticFile("audio/sfx/ep02/water_splash.wav")} volume={0.42} />
      </Sequence>
      <Sequence from={1105} durationInFrames={36}>
        <Audio src={staticFile("audio/sfx/ep02/water_splash.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
