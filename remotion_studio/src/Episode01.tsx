import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EPISODE_01_SCENES } from "./data/episode01Data";
import { SceneRenderer } from "./scenes/Episode01Scenes";

export const Episode01: React.FC = () => {
  const frame = useCurrentFrame();

  // Find active subtitle at current frame
  let activeSub = "";
  for (const sc of EPISODE_01_SCENES) {
    if (frame >= sc.startFrame && frame < sc.startFrame + sc.durationFrames) {
      const local = frame - sc.startFrame;
      for (const clip of sc.clips) {
        if (local >= clip.offsetFrame && local < clip.offsetFrame + clip.frames) {
          activeSub = clip.subtitleBn;
          break;
        }
      }
      break;
    }
  }

  return (
    <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
      {EPISODE_01_SCENES.map((scene) => (
        <Sequence
          key={scene.sceneId}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
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

          {/* Bus 2: Procedural Ambient Bed (NumPy/SciPy) */}
          {scene.ambientBed && !scene.ambientBed.startsWith("NONE") && (
            <Audio
              src={staticFile(`audio/ambient/${scene.ambientBed}`)}
              volume={0.22}
              loop
            />
          )}

          {/* Bus 3: Procedural Music Loop (NumPy/SciPy) */}
          {scene.musicCue && !scene.musicCue.startsWith("NONE") && (
            <Audio
              src={staticFile(`audio/music/${scene.musicCue}`)}
              volume={0.16}
              loop
            />
          )}

          {/* Bus 4: Procedural Foley SFX (NumPy/SciPy) */}
          {scene.sfx.map((sfxFile, idx) => (
            <Sequence key={`${sfxFile}-${idx}`} from={idx * 36} durationInFrames={120}>
              <Audio src={staticFile(`audio/sfx/${sfxFile}`)} volume={0.42} />
            </Sequence>
          ))}
        </Sequence>
      ))}

      {/* Cinematic Bengali Subtitle Overlay */}
      {activeSub && (
        <div
          style={{
            position: "absolute",
            bottom: 42,
            left: 140,
            right: 140,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(10, 8, 24, 0.72)",
              color: "#fff8e8",
              padding: "14px 28px",
              borderRadius: 12,
              fontSize: 32,
              lineHeight: 1.45,
              fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            {activeSub}
          </div>
        </div>
      )}
    </div>
  );
};
