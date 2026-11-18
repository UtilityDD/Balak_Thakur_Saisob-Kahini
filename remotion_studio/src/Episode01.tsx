import React from "react";
import { Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "./cinematic/audio/Mix";
import { CinematicSubtitles } from "./components/CinematicSubtitles";
import { CueSubtitles, SCENE02, SCENE02_CUES } from "./cinematic/Scene02Demo";
import { SCENE03, SCENE03_CUES, Scene03SoundBed } from "./cinematic/scenes/Scene03Arrival";
import { SCENE00, SCENE00_CUES, Scene00SoundBed } from "./cinematic/scenes/Scene00Intro";
import { SCENE01, SCENE01_CUES, Scene01SoundBed } from "./cinematic/scenes/Scene01Village";
import { SCENE04, SCENE04_CUES, Scene04SoundBed } from "./cinematic/scenes/Scene04Ulu";
import { SCENE05, SCENE05_CUES, Scene05SoundBed } from "./cinematic/scenes/Scene05Rain";
import { SCENE06, SCENE06_CUES, Scene06SoundBed } from "./cinematic/scenes/Scene06Thakurma";
import { SCENE07, SCENE07_CUES, Scene07SoundBed } from "./cinematic/scenes/Scene07Flowers";
import { SCENE08, SCENE08_CUES, Scene08SoundBed } from "./cinematic/scenes/Scene08Closing";
import { SceneTiming } from "./types/studio";

/**
 * Re-staged cinematic scenes: word-timed subtitle cues, full-frame rendering and (where given)
 * their own sound bed replacing the generic ambient / music / sfx buses.
 */
const CUE_SCENES: { scene: SceneTiming; cues: { from: number; to: number; who: string; text: string }[]; bed?: React.FC<{ scene: SceneTiming }> }[] = [
  { scene: SCENE00, cues: SCENE00_CUES, bed: Scene00SoundBed },
  { scene: SCENE01, cues: SCENE01_CUES, bed: Scene01SoundBed },
  { scene: SCENE02, cues: SCENE02_CUES },
  { scene: SCENE03, cues: SCENE03_CUES, bed: Scene03SoundBed },
  { scene: SCENE04, cues: SCENE04_CUES, bed: Scene04SoundBed },
  { scene: SCENE05, cues: SCENE05_CUES, bed: Scene05SoundBed },
  { scene: SCENE06, cues: SCENE06_CUES, bed: Scene06SoundBed },
  { scene: SCENE07, cues: SCENE07_CUES, bed: Scene07SoundBed },
  { scene: SCENE08, cues: SCENE08_CUES, bed: Scene08SoundBed },
];
const stagedOf = (id: string) => CUE_SCENES.find((c) => c.scene.sceneId === id);
import { EPISODE_01_SCENES } from "./data/episode01Data";
import { SceneRenderer } from "./scenes/Episode01Scenes";

export const Episode01: React.FC = () => {
  const frame = useCurrentFrame();

  // Find active clip at current frame
  let activeClip: {
    subtitleBn: string;
    speaker: (typeof EPISODE_01_SCENES)[number]["clips"][number]["speaker"];
    file: string;
    relFrame: number;
    frames: number;
  } | null = null;

  for (const sc of EPISODE_01_SCENES) {
    if (frame >= sc.startFrame && frame < sc.startFrame + sc.durationFrames) {
      const local = frame - sc.startFrame;
      for (const clip of sc.clips) {
        if (local >= clip.offsetFrame && local < clip.offsetFrame + clip.frames) {
          activeClip = {
            subtitleBn: clip.subtitleBn,
            speaker: clip.speaker,
            file: clip.file,
            relFrame: local - clip.offsetFrame,
            frames: clip.frames,
          };
          break;
        }
      }
      break;
    }
  }

  const activeCueScene = CUE_SCENES.find(
    ({ scene, cues }) => cues.length > 0 && frame >= scene.startFrame && frame < scene.startFrame + scene.durationFrames,
  );

  return (
    <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
      {EPISODE_01_SCENES.map((scene) => (
        <Sequence
          key={scene.sceneId}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
          style={stagedOf(scene.sceneId) ? undefined : { scale: 0.477 }}
        >
          <SceneRenderer scene={scene} />

          {/* Bus 1: Normalized 48kHz Bengali Voiceover */}
          {scene.clips.map((clip) => (
            <Sequence
              key={clip.file}
              from={clip.offsetFrame}
              durationInFrames={clip.frames}
            >
              <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1.0} />
            </Sequence>
          ))}

          <DuckProvider scene={scene}>
          {/* Re-staged scenes: their own sound bed replaces buses 2–4 */}
          {(() => {
            const Bed = stagedOf(scene.sceneId)?.bed;
            return Bed ? <Bed scene={scene} /> : null;
          })()}

          {/* Bus 2: Procedural Ambient Bed (NumPy/SciPy) */}
          {!stagedOf(scene.sceneId)?.bed && scene.ambientBed && !scene.ambientBed.startsWith("NONE") && (
            <Audio
              src={staticFile(`audio/ambient/${scene.ambientBed}`)}
              volume={0.22}
              loop
            />
          )}

          {/* Bus 3: Procedural Music Loop (NumPy/SciPy) */}
          {!stagedOf(scene.sceneId)?.bed && scene.musicCue && !scene.musicCue.startsWith("NONE") && (
            <Audio
              src={staticFile(`audio/music/${scene.musicCue}`)}
              volume={0.16}
              loop
            />
          )}

          {/* Bus 4: Procedural Foley SFX (NumPy/SciPy) */}
          {!stagedOf(scene.sceneId)?.bed && scene.sfx.map((sfxFile, idx) => (
            <Sequence key={`${sfxFile}-${idx}`} from={idx * 36} durationInFrames={120}>
              <Audio src={staticFile(`audio/sfx/${sfxFile}`)} volume={0.42} />
            </Sequence>
          ))}
          </DuckProvider>
        </Sequence>
      ))}

      {/* Re-staged scenes use word-timed cues (e.g. correct Gopal / Rama / Gopal turns in 02) */}
      {activeCueScene && <CueSubtitles cues={activeCueScene.cues} offset={activeCueScene.scene.startFrame} />}

      {/* Cinematic Chunked Bengali Subtitle Overlay with Speaker Badge */}
      {activeClip && !activeCueScene && !EPISODE_01_SCENES.some((sc) => stagedOf(sc.sceneId) && frame >= sc.startFrame && frame < sc.startFrame + sc.durationFrames) && (
        <CinematicSubtitles
          subtitleBn={activeClip.subtitleBn}
          speaker={activeClip.speaker}
          clipFile={activeClip.file}
          relFrame={activeClip.relFrame}
          clipFrames={activeClip.frames}
        />
      )}
    </div>
  );
};
