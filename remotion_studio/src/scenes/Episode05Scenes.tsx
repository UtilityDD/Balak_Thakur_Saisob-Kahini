import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera25D, ParallaxPlane } from "../components/Camera25D";
import { CharacterId, SceneTiming } from "../types/studio";

/** Returns the live 0..1 RMS energy for a speaking character at the scene's local frame */
function getSpeakerRms(scene: SceneTiming, localFrame: number, target: CharacterId): number {
  for (const clip of scene.clips) {
    if (clip.speaker !== target) continue;
    const rel = localFrame - clip.offsetFrame;
    if (rel >= 0 && rel < clip.rmsEnvelope.length) {
      return clip.rmsEnvelope[rel];
    }
  }
  return 0;
}

/** Divine golden aura exclusively for Balak Thakur (Sri Sri Thakur Anukulchandra) */
export const GhibliBalakAura: React.FC<{ size?: number; intensity?: number }> = ({
  size = 280,
  intensity = 1.0,
}) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.08) * 0.15 + 0.85;
  const rotate = (frame * 0.3) % 360;

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255, 235, 140, ${0.48 * intensity * pulse}) 0%, rgba(255, 195, 55, ${0.25 * intensity * pulse}) 45%, rgba(255, 160, 20, ${0.1 * intensity * pulse}) 70%, transparent 100%)`,
        filter: "blur(18px)",
        transform: `rotate(${rotate}deg) scale(${pulse})`,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
};

/**
 * 5-Plane Cinematic Scene Renderer for Episode 5
 * (The Tortoise and the Gentle Cow)
 */
export const Episode05SceneRenderer: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.durationFrames;

  // Active character RMS values
  const balakRms = getSpeakerRms(scene, frame, "baby_thakur");
  const hariRms = getSpeakerRms(scene, frame, "grumpy_relative");
  const binoyRms = getSpeakerRms(scene, frame, "gopal");
  const muhuriRms = getSpeakerRms(scene, frame, "babukaka");

  // Subtle natural character breathing
  const balakBreatheY = Math.sin(frame * 0.06) * 3;
  const hariBreatheY = Math.sin(frame * 0.09) * 4;
  const cowChewX = Math.sin(frame * 0.07) * 2;
  const cowChewY = Math.cos(frame * 0.07) * 2;

  switch (scene.sceneId) {
    /* -----------------------------------------------------------
     * SCENE 1: PROLOGUE - KRISHNANAGAR KACHARI BARI COURTYARD
     * ----------------------------------------------------------- */
    case "01_kachari_morning": {
      const pop = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -45, y: -10, zoom: 1.0 },
            { frame: d, x: 45, y: 10, zoom: 1.07 },
          ]}
          breathingAmplitude={2.2}
        >
          {/* L1: Deep Sky & Morning Sun */}
          <ParallaxPlane parallaxFactor={0.12} zIndex={1}>
            <div
              style={{
                width: 1920,
                height: 1080,
                background: "radial-gradient(circle at 75% 25%, #ffe6a7 0%, #ffd166 28%, #a2d2ff 65%, #64b5f6 100%)",
              }}
            />
          </ParallaxPlane>

          {/* L2: Kachari Courtyard Ghibli Background */}
          <ParallaxPlane parallaxFactor={0.28} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_kachari_courtyard.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
              }}
            />
          </ParallaxPlane>

          {/* L3: Midground Veranda Arch & Balustrade */}
          <ParallaxPlane parallaxFactor={0.62} zIndex={3}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                pointerEvents: "none",
              }}
            >
              {/* Soft sunlight rays overlay */}
              <div
                style={{
                  position: "absolute",
                  top: -80,
                  right: 180,
                  width: 600,
                  height: 1200,
                  background: "linear-gradient(135deg, rgba(255,245,210,0.22) 0%, rgba(255,230,160,0.08) 50%, transparent 80%)",
                  transform: "rotate(-24deg)",
                  filter: "blur(24px)",
                }}
              />
            </div>
          </ParallaxPlane>

          {/* L4: Primary Stage - Title Cards & Clerks */}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            {frame < 240 && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${0.85 + 0.15 * pop})`,
                  fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    color: "#fff8e7",
                    fontWeight: 700,
                    textShadow: "0 4px 18px rgba(0,0,0,0.45)",
                    letterSpacing: 2,
                  }}
                >
                  ছোটদের বালক ঠাকুরের গল্প
                </div>
                <div
                  style={{
                    fontSize: 74,
                    color: "#fff",
                    fontWeight: 900,
                    marginTop: 14,
                    textShadow: "0 4px 0 #d97706, 0 8px 30px rgba(0,0,0,0.55)",
                  }}
                >
                  পর্ব পাঁচ: কচ্ছপ খেলা ও গাভী রক্ষা
                </div>
              </div>
            )}
          </ParallaxPlane>

          {/* L5: Foreground Parallax Canopy & Dust Motes */}
          <ParallaxPlane parallaxFactor={1.5} zIndex={5}>
            <Img
              src={staticFile("visuals/ep05/ep05_fg_kash_reeds_leaves.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                objectFit: "cover",
                pointerEvents: "none",
                opacity: 0.85,
                filter: "blur(3px)",
              }}
            />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    /* -----------------------------------------------------------
     * SCENE 2: THE DISCOVERY (HARICHARAN CHARGING TOWARDS GARDEN)
     * ----------------------------------------------------------- */
    case "02_cucumber_theft_discovery": {
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -140, y: 0, zoom: 1.0 },
            { frame: d, x: 120, y: -15, zoom: 1.06 },
          ]}
          breathingAmplitude={2.6}
        >
          {/* L1: Tropical Sky */}
          <ParallaxPlane parallaxFactor={0.12} zIndex={1}>
            <div
              style={{
                width: 1920,
                height: 1080,
                background: "linear-gradient(to bottom, #72b01d 0%, #a7c957 35%, #f2e8cf 75%, #e9edc9 100%)",
              }}
            />
          </ParallaxPlane>

          {/* L2: Banana Grove & Garden Ghibli Background */}
          <ParallaxPlane parallaxFactor={0.3} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_banana_grove_cucumber_garden.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
              }}
            />
          </ParallaxPlane>

          {/* L3: Midground Bamboo Fence & Trellis */}
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <div
              style={{
                position: "absolute",
                bottom: 120,
                left: 100,
                width: 1720,
                height: 400,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {/* Trellis element */}
              <Img
                src={staticFile("visuals/ep05/ep05_cutout_cucumber_trellis.png")}
                style={{
                  height: 380,
                  objectFit: "contain",
                  opacity: 0.95,
                }}
              />
            </div>
          </ParallaxPlane>

          {/* L4: Character Action Plane */}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            {/* The Gentle Cow grazing quietly on the right */}
            <div
              style={{
                position: "absolute",
                right: 280,
                bottom: 230,
                transform: `translate(${cowChewX}px, ${cowChewY}px) scale(${1 + Math.sin(frame * 0.05) * 0.015})`,
              }}
            >
              <Img
                src={staticFile("visuals/ep05/ep05_prop_gentle_cow.png")}
                style={{
                  height: 480,
                  objectFit: "contain",
                  filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.35))",
                }}
              />
            </div>

            {/* Haricharan rushing in with angry strides */}
            {(() => {
              const chargeProgress = interpolate(frame, [0, d * 0.45], [0, 1], { extrapolateRight: "clamp" });
              const strideX = interpolate(chargeProgress, [0, 1], [-350, 0]);
              // Vertical step bounce during active running
              const strideBounce = chargeProgress < 1.0 ? Math.abs(Math.sin(frame * 0.28)) * 12 : 0;
              const chargeTilt = chargeProgress < 1.0 ? -4 : 0;
              return (
                <div
                  style={{
                    position: "absolute",
                    left: 240,
                    bottom: 230,
                    transform: `translate(${strideX}px, ${hariBreatheY - strideBounce + hariRms * 14}px) rotate(${chargeTilt}deg)`,
                  }}
                >
                  <Img
                    src={staticFile("visuals/ep05/ep05_prop_haricharan_angry.png")}
                    style={{
                      height: 520,
                      objectFit: "contain",
                      filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.4))",
                      transform: `scale(${1 + hariRms * 0.03})`,
                    }}
                  />
                </div>
              );
            })()}
          </ParallaxPlane>

          {/* L5: Foreground Leaves Bokeh */}
          <ParallaxPlane parallaxFactor={1.52} zIndex={5}>
            <Img
              src={staticFile("visuals/ep05/ep05_fg_kash_reeds_leaves.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                objectFit: "cover",
                pointerEvents: "none",
                opacity: 0.95,
                filter: "blur(2px)",
                transform: `translateX(${Math.sin(frame * 0.05) * 8}px)`,
              }}
            />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    /* -----------------------------------------------------------
     * SCENE 3: THE DRAMATIC STANDOFF (SHOT / REVERSE SHOT CUTS)
     * ----------------------------------------------------------- */
    case "03_haricharan_standoff": {
      // Dynamic dialogue-driven shot / reverse-shot camera choreography:
      // Shot 1 (0 to 35): Opening Wide Two-Shot (Establishing wide standoff)
      // Shot 2 (36 to 190): Hari Furious Shouting Close-up (Focus on Haricharan with stick)
      // Shot 3 (190 to 340): Balak Calm Standoff React Shot (Balak standing fearless)
      // Shot 4 (340 to 505): Balak Heroic Refusal ("না, কিছুতেই বলব না!" with radiant aura flare)
      // Shot 5 (505 to 680): Hari Shouting Reaction 1 ("কী বললি? পেটাব না তো পুজো করব?")
      // Shot 6 (680 to 910): Balak Moral Explanation ("ওর পেটে খিদে পেয়েছিল...")
      // Shot 7 (910 to 1095): Hari Stunned Reaction (Stick wavering)
      // Shot 8 (1095 to 1460): Balak Final Stand Climax (Dramatic push on Balak)
      // Shot 9 (1460 to 1851): Resolution Wide Two-Shot (Hari softened, stick down, cow safe)

      let targetCamX = 0;
      let targetCamZoom = 1.05;

      if (frame >= 36 && frame < 190) {
        // Shot 2: Hari Close-up
        targetCamX = -230;
        targetCamZoom = 1.28;
      } else if (frame >= 190 && frame < 340) {
        // Shot 3: Balak React Shot
        targetCamX = 210;
        targetCamZoom = 1.28;
      } else if (frame >= 340 && frame < 505) {
        // Shot 4: Balak Heroic Refusal
        targetCamX = 200;
        targetCamZoom = 1.32;
      } else if (frame >= 505 && frame < 680) {
        // Shot 5: Hari Shouting Reaction 1
        targetCamX = -220;
        targetCamZoom = 1.26;
      } else if (frame >= 680 && frame < 910) {
        // Shot 6: Balak Moral Explanation
        targetCamX = 180;
        targetCamZoom = 1.26;
      } else if (frame >= 910 && frame < 1095) {
        // Shot 7: Hari Stunned Reaction
        targetCamX = -180;
        targetCamZoom = 1.22;
      } else if (frame >= 1095 && frame < 1460) {
        // Shot 8: Balak Final Stand Climax
        targetCamX = 170;
        targetCamZoom = interpolate(frame, [1095, 1460], [1.24, 1.35]);
      } else {
        // Shot 1 (0 to 35) & Shot 9 (1460 to 1851): Wide Two-Shot
        targetCamX = 0;
        targetCamZoom = 1.05;
      }

      const isHariDefeated = frame >= 1460;

      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: targetCamX, y: 0, zoom: targetCamZoom },
            { frame: d, x: targetCamX, y: 0, zoom: targetCamZoom },
          ]}
          breathingAmplitude={2.0}
        >
          {/* L1: Deep Sky & Atmosphere */}
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <div
              style={{
                width: 1920,
                height: 1080,
                background: "linear-gradient(135deg, #fefae0 0%, #dda15e 40%, #bc6c25 100%)",
              }}
            />
          </ParallaxPlane>

          {/* L2: Banana Grove Background */}
          <ParallaxPlane parallaxFactor={0.32} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_banana_grove_cucumber_garden.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
              }}
            />
          </ParallaxPlane>

          {/* L3: Broken Cucumber Trellis */}
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <div style={{ position: "absolute", bottom: 130, left: 160 }}>
              <Img
                src={staticFile("visuals/ep05/ep05_cutout_cucumber_trellis.png")}
                style={{ height: 360, objectFit: "contain" }}
              />
            </div>
          </ParallaxPlane>

          {/* L4: Primary Confrontation Characters */}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            {/* The Gentle Cow (Behind Balak) */}
            <div
              style={{
                position: "absolute",
                right: 280,
                bottom: 240,
                transform: `translate(${cowChewX}px, ${cowChewY}px) scale(${1 + Math.sin(frame * 0.05) * 0.012})`,
              }}
            >
              <Img
                src={staticFile("visuals/ep05/ep05_prop_gentle_cow.png")}
                style={{
                  height: 510,
                  objectFit: "contain",
                  filter: "drop-shadow(0 16px 26px rgba(0,0,0,0.35))",
                }}
              />
            </div>

            {/* Balak Thakur (Standing between Haricharan and Cow) */}
            <div
              style={{
                position: "absolute",
                right: 640,
                bottom: 230,
                transform: `translateY(${balakBreatheY}px) rotate(${Math.sin(frame * 0.15) * (balakRms * 2.2)}deg)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Sacred Divine Aura pulsing around Balak */}
              <div style={{ position: "absolute", top: 120 }}>
                <GhibliBalakAura
                  size={frame >= 340 && frame < 505 ? 440 : 380}
                  intensity={frame >= 340 && frame < 505 ? 1.8 : balakRms > 0.05 ? 1.4 : 1.0}
                />
              </div>

              <Img
                src={staticFile("visuals/ep05/ep05_prop_balak_thakur_standoff.png")}
                style={{
                  height: 490,
                  objectFit: "contain",
                  filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.38))",
                  transform: `scale(${1 + balakRms * 0.04})`,
                  zIndex: 2,
                }}
              />
            </div>

            {/* Haricharan (Furious -> Defeated Transition) */}
            <div
              style={{
                position: "absolute",
                left: 260,
                bottom: 230,
                transform: `translateY(${hariBreatheY}px) rotate(${!isHariDefeated ? Math.sin(frame * 0.35) * (hariRms * 2.8) : 0}deg)`,
              }}
            >
              {!isHariDefeated ? (
                <Img
                  src={staticFile("visuals/ep05/ep05_prop_haricharan_angry.png")}
                  style={{
                    height: 540,
                    objectFit: "contain",
                    filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.42))",
                    transform: `scale(${1 + hariRms * 0.03})`,
                  }}
                />
              ) : (
                <Img
                  src={staticFile("visuals/ep05/ep05_prop_haricharan_softened.png")}
                  style={{
                    height: 520,
                    objectFit: "contain",
                    filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.35))",
                    transform: `translateY(${interpolate(frame, [1460, 1520], [0, 8], { extrapolateRight: "clamp" })}px)`,
                  }}
                />
              )}
            </div>
          </ParallaxPlane>

          {/* L5: Foreground Dramatic Overhanging Leaves */}
          <ParallaxPlane parallaxFactor={1.55} zIndex={5}>
            <Img
              src={staticFile("visuals/ep05/ep05_fg_kash_reeds_leaves.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                objectFit: "cover",
                pointerEvents: "none",
                opacity: 0.96,
                filter: "blur(2.2px)",
                transform: `translate(${Math.sin(frame * 0.04) * 6}px, ${Math.cos(frame * 0.03) * 4}px)`,
              }}
            />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    /* -----------------------------------------------------------
     * SCENE 4: COURTYARD OF TORTOISES (BINOY PANIC & BALAK JOY)
     * ----------------------------------------------------------- */
    case "04_tortoise_rescue": {
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: 0, y: -20, zoom: 1.02 },
            { frame: d, x: 0, y: 15, zoom: 1.08 },
          ]}
          breathingAmplitude={2.4}
        >
          {/* L1 & L2: Kachari Courtyard */}
          <ParallaxPlane parallaxFactor={0.25} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_kachari_courtyard.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
              }}
            />
          </ParallaxPlane>

          {/* L4: River Tortoises on Courtyard Ground */}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            {/* The Crawling Tortoises */}
            <div
              style={{
                position: "absolute",
                bottom: 230,
                left: 680,
                transform: `translate(${Math.sin(frame * 0.025) * 14}px, ${Math.abs(Math.sin(frame * 0.08)) * 3}px)`,
              }}
            >
              <Img
                src={staticFile("visuals/ep05/ep05_prop_tortoises_cluster.png")}
                style={{
                  height: 280,
                  objectFit: "contain",
                  filter: "drop-shadow(0 14px 20px rgba(0,0,0,0.4))",
                }}
              />
            </div>

            {/* Balak Thakur Crouching Playfully */}
            <div
              style={{
                position: "absolute",
                bottom: 230,
                left: 450,
                transform: `translateY(${balakBreatheY}px) rotate(${Math.sin(frame * 0.05) * 1.5 + balakRms * 1.8}deg)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "absolute", top: 80 }}>
                <GhibliBalakAura size={340} intensity={1.1} />
              </div>
              <Img
                src={staticFile("visuals/ep05/ep05_prop_balak_thakur_joyful.png")}
                style={{
                  height: 440,
                  objectFit: "contain",
                  filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.36))",
                  zIndex: 2,
                }}
              />
            </div>
          </ParallaxPlane>

          {/* L5: Foreground Depth Arch Framing & Overhanging Leaves */}
          <ParallaxPlane parallaxFactor={1.48} zIndex={5}>
            <Img
              src={staticFile("visuals/ep05/ep05_fg_kash_reeds_leaves.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                objectFit: "cover",
                pointerEvents: "none",
                opacity: 0.9,
                filter: "blur(2.4px)",
                transform: `translateX(${Math.sin(frame * 0.04) * 6}px)`,
              }}
            />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    /* -----------------------------------------------------------
     * SCENE 5: PADMA RIVER TWILIGHT (SACRED RETREAT & SUNSET)
     * ----------------------------------------------------------- */
    case "05_padma_twilight": {
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -70, y: 0, zoom: 1.0 },
            { frame: d, x: 70, y: -10, zoom: 1.07 },
          ]}
          breathingAmplitude={1.8}
        >
          {/* L1 & L2: Padma River Twilight Background */}
          <ParallaxPlane parallaxFactor={0.2} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_padma_twilight.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
              }}
            />
          </ParallaxPlane>

          {/* L3: River Ripples & Drifting Boat */}
          <ParallaxPlane parallaxFactor={0.55} zIndex={3}>
            <div
              style={{
                position: "absolute",
                bottom: 340,
                right: interpolate(frame, [0, d], [380, 520]),
                opacity: 0.88,
              }}
            >
              {/* Traditional Dinghy Silhouette drifting */}
              <div
                style={{
                  width: 140,
                  height: 45,
                  backgroundColor: "rgba(35, 22, 18, 0.8)",
                  borderRadius: "0 0 70px 70px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          </ParallaxPlane>

          {/* L4: Balak Thakur Serene Silhouette at Shore */}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <div
              style={{
                position: "absolute",
                bottom: 220,
                left: 360,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "absolute", top: 80 }}>
                <GhibliBalakAura size={380} intensity={1.3} />
              </div>
              <Img
                src={staticFile("visuals/ep05/ep05_prop_balak_thakur_standoff.png")}
                style={{
                  height: 470,
                  objectFit: "contain",
                  filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.45))",
                  zIndex: 2,
                }}
              />
            </div>
          </ParallaxPlane>

          {/* L5: Swaying Kash Phul Reeds in Extreme Foreground Bokeh */}
          <ParallaxPlane parallaxFactor={1.52} zIndex={5}>
            <Img
              src={staticFile("visuals/ep05/ep05_fg_kash_reeds_leaves.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                objectFit: "cover",
                pointerEvents: "none",
                opacity: 0.88,
                filter: "blur(3px)",
                transform: `translateX(${Math.sin(frame * 0.03) * 10}px)`,
              }}
            />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    /* -----------------------------------------------------------
     * SCENE 6 & 7: EPILOGUE & CLOSING WISDOM REFLECTION
     * ----------------------------------------------------------- */
    default: {
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: 0, y: 0, zoom: 1.0 },
            { frame: d, x: 0, y: 0, zoom: 1.05 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.2} zIndex={2}>
            <Img
              src={staticFile("visuals/ep05/ep05_bg_padma_twilight.png")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
                filter: "brightness(0.85)",
              }}
            />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
                textAlign: "center",
                color: "#fff8e7",
                padding: "0 180px",
              }}
            >
              <div style={{ fontSize: 36, color: "#ffd166", fontWeight: 700, marginBottom: 16 }}>
                পরম বিস্ময় — শ্রীশ্রীঠাকুর অনুকূলচন্দ্র
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.5, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>
                "ভালোবাসা দিয়ে যা জয় করা যায়, লাঠি বা ভয় দিয়ে তা কখনো পাওয়া যায় না।"
              </div>
            </div>
          </ParallaxPlane>
        </Camera25D>
      );
    }
  }
};
