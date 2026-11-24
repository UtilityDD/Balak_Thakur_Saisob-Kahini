import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "./audio/Mix";
import { EPISODE_01_SCENES } from "../data/episode01Data";
import { BN_FONT } from "./fonts";
import { Scene02Diwali } from "./scenes/Scene02Diwali";

export const SCENE02 = EPISODE_01_SCENES.find((s) => s.sceneId === "02_diwali_celebration")!;

/** Subtitle cues aligned to measured pauses in 02a/02b/02c (scene-local frames). */
export const SCENE02_CUES: Array<{ from: number; to: number; who: string; text: string }> = [
  { from: 0, to: 72, who: "কথক", text: "আজ কার্তিক মাসের অমাবস্যা—" },
  { from: 75, to: 147, who: "কথক", text: "সারা দেশে দীপাবলির উৎসব," },
  { from: 150, to: 216, who: "কথক", text: "আর বৈদিক বাড়িতে কালীপূজো!" },
  { from: 222, to: 363, who: "কথক", text: "রাত যত গভীর হচ্ছে, বাইরের প্রদীপগুলো যেন নিভু নিভু হয়ে আসছে—" },
  { from: 367, to: 456, who: "কথক", text: "কিন্তু বৈদিক বাড়িতে তখন আনন্দের শেষ নেই!" },
  { from: 462, to: 579, who: "কথক", text: "বৈঠকখানায় কেদারকাকার মজার গল্প শুনে সবাই অবাক।" },
  { from: 583, to: 660, who: "কথক", text: "ওদিকে ঢাকীর ছোট্ট ছেলে দুইখা" },
  { from: 660, to: 768, who: "কথক", text: "কাঁসরের উল্টো পিঠে গুড়-মুড়ি খেতে গিয়ে বিষম খেয়ে একাকার!" },
  { from: 777, to: 918, who: "কথক", text: "আর ভেতর-বাড়িতে বাবুকাকাকে ঘিরে চলছিল বাজি পোড়ানো আর মিষ্টি খুনসুটি।" },
  { from: 928, to: 1010, who: "গোপাল", text: "এই রমা, তুই মধুর বাজি নিচ্ছিস কেন রে?" },
  { from: 1012, to: 1052, who: "রমা", text: "কোথায় নিচ্ছি!" },
  { from: 1054, to: 1092, who: "গোপাল", text: "মিথ্যে বলিস না!" },
  { from: 1096, to: 1156, who: "বাবুকাকা", text: "আরে, ঝগড়া কোরো না।" },
  { from: 1157, to: 1214, who: "বাবুকাকা", text: "এই নাও, দু’জনেই আরও বাজি নাও—" },
  { from: 1215, to: 1264, who: "বাবুকাকা", text: "মিলেমিশে আনন্দ করো!" },
];

export const CueSubtitles: React.FC<{ cues: typeof SCENE02_CUES; offset?: number }> = ({ cues, offset = 0 }) => {
  const f = useCurrentFrame() - offset;
  const c = cues.find((q) => f >= q.from && f < q.to);
  if (!c) return null;
  const o = interpolate(f, [c.from, c.from + 5, c.to - 5, c.to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(f, [c.from, c.from + 7], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isNarr = c.who === "কথক";
  return (
    <>
      {/* soft cinematic band so text reads on any background without heavy outlines */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 250,
          background: "linear-gradient(to top, rgba(8,4,10,0.72) 0%, rgba(8,4,10,0.45) 45%, rgba(8,4,10,0) 100%)",
          opacity: o,
          zIndex: 49,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          bottom: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: o,
          transform: `translateY(${y}px)`,
          fontFamily: BN_FONT,
          zIndex: 50,
        }}
      >
        {!isNarr && (
          <div
            style={{
              marginBottom: 2,
              padding: "4px 22px 0px",
              borderRadius: 999,
              background: "linear-gradient(180deg, #ffd977, #ffae3d)",
              color: "#3a1a04",
              fontSize: 26,
              lineHeight: 1.45,
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            {c.who}
          </div>
        )}
        <div
          style={{
            color: isNarr ? "#fff6e4" : "#ffffff",
            fontSize: isNarr ? 44 : 48,
            lineHeight: 1.55,
            textAlign: "center",
            fontWeight: isNarr ? 500 : 600,
            letterSpacing: 0.2,
            textShadow: "0 2px 2px rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.6)",
            maxWidth: 1500,
            textWrap: "balance",
          }}
        >
          {c.text}
        </div>
      </div>
    </>
  );
};

/** Standalone demo render of the re-staged Scene 02 with all four audio buses. */
export const Scene02Demo: React.FC = () => {
  const scene = SCENE02;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene02Diwali scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
      <Audio src={staticFile(`audio/ambient/${scene.ambientBed}`)} volume={0.2} loop />
      <Audio
        src={staticFile(`audio/music/${scene.musicCue}`)}
        loop
        volume={(f) => interpolate(f, [0, 30, 1230, 1267], [0, 0.15, 0.15, 0], { extrapolateRight: "clamp" })}
      />
      {[400, 790, 806, 1222].map((at) => (
        <Sequence key={at} from={at} durationInFrames={90} layout="none">
          <Audio src={staticFile("audio/sfx/sparkler_crackle.wav")} volume={0.35} />
        </Sequence>
      ))}
      </DuckProvider>
      <CueSubtitles cues={SCENE02_CUES} />
    </div>
  );
};
