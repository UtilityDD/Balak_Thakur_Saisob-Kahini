import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera25D, ParallaxPlane } from "../components/Camera25D";
import {
  BengalCourtyardAndFlora,
  BengalSky,
  PadmaRiver,
  WeatherVFX,
} from "../components/BengalNature";
import {
  BabyThakurRig,
  CharacterRig,
  LittleGoatRig,
} from "../components/CharacterRig";
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

export const SceneRenderer: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.durationFrames;

  switch (scene.sceneId) {
    case "00_intro": {
      const pop = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });
      return (
        <Camera25D keyframes={[{ frame: 0, x: 0, y: 0, zoom: 1 }, { frame: d, x: 0, y: 0, zoom: 1.06 }]}>
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="bright_orange_flat" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship={false} />
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
                transform: `scale(${0.8 + 0.2 * pop})`,
                fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 42, color: "#fff8e1", fontWeight: 700, textShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>
                ছোটদের বালক ঠাকুরের গল্প
              </div>
              <div style={{ fontSize: 78, color: "#142850", fontWeight: 900, marginTop: 14, textShadow: "0 4px 0 #ffd166" }}>
                পর্ব ১: যে রাতে ঢাক থেমে গেল
              </div>
            </div>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "01_medinimondal_village":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -75, y: 0, zoom: 1.0 },
            { frame: d, x: 75, y: -12, zoom: 1.07 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="golden_daytime" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="golden_daytime" showSteamship />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="golden_daytime" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="petals" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "02_diwali_celebration":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -55, y: 10, zoom: 1.0 },
            { frame: d, x: 55, y: -8, zoom: 1.08 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="deep_indigo_warm_diyas" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="deep_indigo_warm_diyas" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="babukaka"
                x={720}
                y={690}
                rms={getSpeakerRms(scene, frame, "babukaka")}
                gesture="sparkler"
              />
              <CharacterRig
                id="gopal"
                x={1010}
                y={745}
                flipX
                rms={getSpeakerRms(scene, frame, "gopal")}
                gesture="sparkler"
              />
              <CharacterRig
                id="rama"
                x={1190}
                y={735}
                flipX
                rms={getSpeakerRms(scene, frame, "gopal") * 0.7}
                gesture="wave"
              />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="fireflies" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "03_quiet_arrival":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: 0, y: 15, zoom: 1.0 },
            { frame: d, x: 0, y: -15, zoom: 1.14 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="sacred_midnight_glow" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="sacred_midnight_glow" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig id="charu" x={780} y={690} rms={getSpeakerRms(scene, frame, "charu")} gesture="idle" />
              <CharacterRig id="manorama_devi" x={1080} y={690} flipX gesture="bless" />
              <BabyThakurRig x={960} y={775} scale={1.15} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "04_seven_uludhwani":
      return (
        <Camera25D
          breathingAmplitude={0.4}
          keyframes={[
            { frame: 0, x: -18, y: 0, zoom: 1.0 },
            { frame: Math.min(72, d), x: 0, y: 0, zoom: 1.08 },
            { frame: d, x: 0, y: 0, zoom: 1.08 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="warm_mandap_lamps" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="warm_mandap_lamps" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="bhagabati_thakur"
                x={920}
                y={695}
                rms={getSpeakerRms(scene, frame, "bhagabati_thakur")}
                gesture="bell"
              />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "05_rain_flashback_and_mystic":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -45, y: 0, zoom: 1.0 },
            { frame: d, x: 45, y: -10, zoom: 1.06 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="cool_slate_rain" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="cool_slate_rain" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="pagol_mystic"
                x={620}
                y={700}
                rms={getSpeakerRms(scene, frame, "pagol_mystic")}
                gesture="bless"
              />
              <CharacterRig
                id="sundar_thakur"
                x={1040}
                y={700}
                flipX
                rms={getSpeakerRms(scene, frame, "sundar_thakur")}
              />
              <CharacterRig
                id="charu"
                x={1290}
                y={705}
                flipX
                rms={getSpeakerRms(scene, frame, "charu")}
              />
              <CharacterRig
                id="manorama_devi"
                x={1480}
                y={705}
                flipX
                rms={getSpeakerRms(scene, frame, "manorama_devi")}
              />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="rain" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "06_thakurma_joy":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: 25, y: 0, zoom: 1.02 },
            { frame: d, x: -20, y: -10, zoom: 1.1 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="warm_indoor_amber" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="warm_indoor_amber" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="grumpy_relative"
                x={640}
                y={705}
                rms={getSpeakerRms(scene, frame, "grumpy_relative")}
              />
              <CharacterRig
                id="thakurma"
                x={1100}
                y={700}
                flipX
                rms={getSpeakerRms(scene, frame, "thakurma")}
                gesture="wave"
              />
              <BabyThakurRig x={900} y={800} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "07_flowers_and_little_goat":
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: -40, y: 0, zoom: 1.0 },
            { frame: d, x: 40, y: -10, zoom: 1.07 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship={false} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="sundar_thakur"
                x={740}
                y={690}
                rms={getSpeakerRms(scene, frame, "sundar_thakur")}
                gesture="bless"
              />
              <BabyThakurRig x={1020} y={795} />
              <LittleGoatRig x={1180} y={810} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="petals" />
          </ParallaxPlane>
        </Camera25D>
      );

    default:
      // 08_closing_moral_outro
      return (
        <Camera25D
          keyframes={[
            { frame: 0, x: 0, y: -10, zoom: 1.1 },
            { frame: d, x: 0, y: 10, zoom: 1.0 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <BabyThakurRig x={960} y={440} scale={1.4} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );
  }
};
