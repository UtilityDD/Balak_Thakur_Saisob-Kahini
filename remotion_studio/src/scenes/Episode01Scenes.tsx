import React from "react";
import { Scene00Intro } from "../cinematic/scenes/Scene00Intro";
import { Scene01Village } from "../cinematic/scenes/Scene01Village";
import { Scene04Ulu } from "../cinematic/scenes/Scene04Ulu";
import { Scene05Rain } from "../cinematic/scenes/Scene05Rain";
import { Scene06Thakurma } from "../cinematic/scenes/Scene06Thakurma";
import { Scene07Flowers } from "../cinematic/scenes/Scene07Flowers";
import { Scene08Closing } from "../cinematic/scenes/Scene08Closing";
import { Easing, interpolate, useCurrentFrame } from "remotion";
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
import {
  ClosingMoralAndNextPreview,
  DawnGreetingVFX,
  DiwaliCourtyardExtras,
  Episode01TitleCrest,
  HoroscopeConstellationVFX,
  MandapAndUludhwani,
  MedinimondalVillageLayers,
  NaivedyaOfferingThali,
  SacredArrivalAura,
} from "../components/StoryVignettes";
import { CharacterId, SceneTiming } from "../types/studio";
import { Scene02Diwali } from "../cinematic/scenes/Scene02Diwali";
import { Scene03Arrival } from "../cinematic/scenes/Scene03Arrival";

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

/** Handles the two-speaker kids clip (02b_Scene2_Kids.wav): Gopal first 52%, Rama second 48% */
function getKidsSplitRms(
  scene: SceneTiming,
  localFrame: number,
  kid: "gopal" | "rama"
): number {
  const clip = scene.clips.find((c) => c.file === "02b_Scene2_Kids.wav");
  if (!clip) return 0;
  const rel = localFrame - clip.offsetFrame;
  if (rel < 0 || rel >= clip.rmsEnvelope.length) return 0;
  const split = Math.round(clip.frames * 0.52);
  if (kid === "gopal") return rel < split ? clip.rmsEnvelope[rel] : 0;
  return rel >= split ? clip.rmsEnvelope[rel] : 0;
}

export const SceneRenderer: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const d = scene.durationFrames;

  switch (scene.sceneId) {
    case "00_intro":
      return <Scene00Intro scene={scene} />;

    case "00_intro_legacy":
      return (
        <Camera25D
          warmthOverlay={0.45}
          vignetteIntensity={0.22}
          keyframes={[
            { frame: 0, x: 0, y: 0, zoom: 1.0 },
            { frame: d, x: 0, y: 0, zoom: 1.06 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="bright_orange_flat" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship={false} showBoats={false} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <Episode01TitleCrest />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "01_medinimondal_village":
      return <Scene01Village scene={scene} />;

    case "01_medinimondal_village_legacy":
      return (
        <Camera25D
          warmthOverlay={0.35}
          keyframes={[
            { frame: 0, x: -78, y: 4, zoom: 1.0 },
            { frame: Math.round(d * 0.5), x: 0, y: -4, zoom: 1.05 },
            { frame: d, x: 78, y: -10, zoom: 1.08 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="golden_daytime" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="golden_daytime" showSteamship showBoats />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="golden_daytime" showAlpona={false} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.95} zIndex={4}>
            <MedinimondalVillageLayers />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="petals" />
          </ParallaxPlane>
        </Camera25D>
      );

    case "02_diwali_celebration":
      // Re-staged cinematic version (6 shots, every spoken beat visualised)
      return <Scene02Diwali scene={scene} />;

    case "02_diwali_celebration_legacy": {
      const gopalRms = getKidsSplitRms(scene, frame, "gopal");
      const ramaRms = getKidsSplitRms(scene, frame, "rama");
      const babukakaRms = getSpeakerRms(scene, frame, "babukaka");
      const charactersOpacity = interpolate(frame, [740, 810], [0.55, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      return (
        <Camera25D
          warmthOverlay={0.4}
          keyframes={[
            { frame: 0, x: -58, y: 10, zoom: 1.0 },
            { frame: 760, x: 32, y: -6, zoom: 1.05 },
            { frame: d, x: 55, y: -10, zoom: 1.1 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="deep_indigo_warm_diyas" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="deep_indigo_warm_diyas" showDiyas showMandap />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.95} zIndex={4}>
            <DiwaliCourtyardExtras />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" opacity={charactersOpacity}>
              <CharacterRig
                id="babukaka"
                x={720}
                y={695}
                rms={babukakaRms}
                gesture={babukakaRms > 0.06 ? "bless" : "sparkler"}
                emotion="happy"
                eyeLookX={1}
              />
              <CharacterRig
                id="gopal"
                x={1010}
                y={748}
                flipX
                rms={gopalRms}
                gesture={gopalRms > 0.06 ? "wave" : "sparkler"}
                emotion={gopalRms > 0.06 ? "amazed" : "happy"}
                eyeLookX={-1}
              />
              <CharacterRig
                id="rama"
                x={1200}
                y={738}
                flipX
                rms={ramaRms}
                gesture={ramaRms > 0.06 ? "wave" : "sparkler"}
                emotion="happy"
                eyeLookX={-1}
              />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="fireflies" />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "03_quiet_arrival":
      // Re-staged with the divine visual language (Level 3 birth)
      return <Scene03Arrival scene={scene} />;

    case "03_quiet_arrival_legacy": {
      const callActive = frame < 115;
      const birthProgress = interpolate(frame, [380, 460], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      const manoramaEntered = frame >= 600;
      const manoramaX = interpolate(frame, [590, 680], [1340, 1080], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });

      return (
        <Camera25D
          warmthOverlay={0.5}
          keyframes={[
            { frame: 0, x: 0, y: 14, zoom: 1.0 },
            { frame: d, x: 0, y: -14, zoom: 1.14 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="sacred_midnight_glow" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="sacred_midnight_glow" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <SacredArrivalAura callActive={callActive} birthProgress={birthProgress} />
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="charu"
                x={770}
                y={695}
                rms={getSpeakerRms(scene, frame, "charu")}
                gesture={frame < 400 ? "platter" : "idle"}
                emotion={frame >= 910 ? "worried" : "serene"}
                eyeLookX={1}
              />
              {manoramaEntered && (
                <CharacterRig
                  id="manorama_devi"
                  x={manoramaX}
                  y={695}
                  flipX
                  gesture={frame >= 675 ? "cradle" : "bless"}
                  emotion="loving"
                  eyeLookX={-1}
                />
              )}
              {birthProgress > 0 && frame < 680 && (
                <BabyThakurRig x={960} y={785} scale={1.12 * birthProgress} />
              )}
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "04_seven_uludhwani":
      return <Scene04Ulu scene={scene} />;

    case "04_seven_uludhwani_legacy": {
      const freezeFrame = 455;
      return (
        <Camera25D
          breathingAmplitude={0.45}
          freezeAtFrame={freezeFrame}
          vignetteIntensity={0.42}
          keyframes={[
            { frame: 0, x: -24, y: 0, zoom: 1.0 },
            { frame: 90, x: 0, y: 0, zoom: 1.08 },
            { frame: d, x: 0, y: 0, zoom: 1.08 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="warm_mandap_lamps" freezeAtFrame={freezeFrame} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora
              mood="warm_mandap_lamps"
              showDiyas
              showMandap
              freezeAtFrame={freezeFrame}
            />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <MandapAndUludhwani freezeAtFrame={freezeFrame} uludhwaniStartFrame={165} />
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="bhagabati_thakur"
                x={920}
                y={695}
                rms={getSpeakerRms(scene, frame, "bhagabati_thakur")}
                gesture="bell"
                emotion={frame >= 170 ? "amazed" : "neutral"}
                freezeAtFrame={freezeFrame}
              />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="incense" freezeAtFrame={freezeFrame} />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "05_rain_flashback_and_mystic":
      return <Scene05Rain scene={scene} />;

    case "05_rain_flashback_and_mystic_legacy": {
      // 0..540: Indoor Manorama & Charu; 540..725: Monsoon Rain Flashback (Pagol); 725..1342: Indoor Sundar & Pagol Return
      const inFlashback = frame >= 520 && frame < 735;
      const flashbackAmount = interpolate(
        frame,
        [500, 550, 700, 745],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const mood = inFlashback ? "cool_slate_rain" : "warm_indoor_amber";
      const sundarAmazed = frame >= 920;
      const pagolReturned = frame >= 1150;

      return (
        <Camera25D
          flashbackAmount={flashbackAmount}
          warmthOverlay={inFlashback ? 0 : 0.38}
          keyframes={[
            { frame: 0, x: -40, y: 0, zoom: 1.0 },
            { frame: 560, x: 0, y: 0, zoom: 1.04 },
            { frame: d, x: 40, y: -10, zoom: 1.07 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood={mood} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood={mood} showDiyas={!inFlashback} />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <HoroscopeConstellationVFX active={!inFlashback && sundarAmazed && frame < 1180} />
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              {(inFlashback || pagolReturned) && (
                <CharacterRig
                  id="pagol_mystic"
                  x={inFlashback ? 860 : 540}
                  y={700}
                  rms={getSpeakerRms(scene, frame, "pagol_mystic")}
                  gesture="bless"
                  emotion="happy"
                  eyeLookX={1}
                />
              )}
              {!inFlashback && (
                <>
                  <CharacterRig
                    id="sundar_thakur"
                    x={1020}
                    y={700}
                    flipX
                    rms={getSpeakerRms(scene, frame, "sundar_thakur")}
                    gesture={frame >= 710 ? "scroll" : "idle"}
                    emotion={sundarAmazed ? "amazed" : "neutral"}
                    eyeLookX={-1}
                  />
                  <CharacterRig
                    id="charu"
                    x={1290}
                    y={705}
                    flipX
                    rms={getSpeakerRms(scene, frame, "charu")}
                    emotion="worried"
                    eyeLookX={-1}
                  />
                  <CharacterRig
                    id="manorama_devi"
                    x={1490}
                    y={705}
                    flipX
                    rms={getSpeakerRms(scene, frame, "manorama_devi")}
                    emotion="loving"
                    gesture="cradle"
                    eyeLookX={-1}
                  />
                </>
              )}
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type={inFlashback ? "rain" : "sparkles"} />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "06_thakurma_joy":
      return <Scene06Thakurma scene={scene} />;

    case "06_thakurma_joy_legacy": {
      const thaliOpacity = interpolate(frame, [1040, 1100], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      return (
        <Camera25D
          warmthOverlay={0.45}
          keyframes={[
            { frame: 0, x: -30, y: 0, zoom: 1.02 },
            { frame: 560, x: 20, y: -6, zoom: 1.08 },
            { frame: d, x: 25, y: -10, zoom: 1.12 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="warm_indoor_amber" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="warm_indoor_amber" showDiyas />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <NaivedyaOfferingThali opacity={thaliOpacity} />
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="grumpy_relative"
                x={620}
                y={705}
                rms={getSpeakerRms(scene, frame, "grumpy_relative")}
                gesture={frame < 240 ? "crossed" : "idle"}
                emotion={frame < 560 ? "grumpy" : "serene"}
                eyeLookX={1}
              />
              <CharacterRig
                id="thakurma"
                x={1110}
                y={700}
                flipX
                rms={getSpeakerRms(scene, frame, "thakurma")}
                gesture={frame >= 560 ? "wave" : "idle"}
                emotion="happy"
                eyeLookX={-1}
              />
              <BabyThakurRig x={895} y={805} scale={1.1} awakeLooking={frame >= 720} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "07_flowers_and_little_goat":
      return <Scene07Flowers scene={scene} />;

    case "07_flowers_and_little_goat_legacy": {
      const goatX = interpolate(frame, [280, 620], [1460, 1170], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      const showHeart = frame >= 600;

      return (
        <Camera25D
          warmthOverlay={0.38}
          keyframes={[
            { frame: 0, x: -45, y: 0, zoom: 1.0 },
            { frame: d, x: 45, y: -10, zoom: 1.08 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship={false} showBoats />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="soft_golden_dawn" showMandap />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <DawnGreetingVFX showHeart={showHeart} />
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <CharacterRig
                id="sundar_thakur"
                x={720}
                y={695}
                rms={getSpeakerRms(scene, frame, "sundar_thakur")}
                gesture="bless"
                emotion="serene"
                eyeLookX={1}
              />
              <BabyThakurRig x={1020} y={795} scale={1.12} awakeLooking />
              <LittleGoatRig x={goatX} y={810} scale={1.08} />
            </svg>
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="petals" />
          </ParallaxPlane>
        </Camera25D>
      );
    }

    case "08_closing_moral_outro":
      return <Scene08Closing scene={scene} />;

    default:
      // 08_closing_moral_outro (legacy)
      return (
        <Camera25D
          warmthOverlay={0.48}
          keyframes={[
            { frame: 0, x: 0, y: -12, zoom: 1.1 },
            { frame: d, x: 0, y: 12, zoom: 1.0 },
          ]}
        >
          <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
            <BengalSky mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
            <PadmaRiver mood="soft_golden_dawn" showSteamship showBoats />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
            <BengalCourtyardAndFlora mood="soft_golden_dawn" />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.0} zIndex={4}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080">
              <BabyThakurRig x={960} y={495} scale={1.45} />
            </svg>
            <ClosingMoralAndNextPreview />
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
            <WeatherVFX type="sparkles" />
          </ParallaxPlane>
        </Camera25D>
      );
  }
};
