import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, EASE, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { DivineCatchlight, Motes } from "../divine/Divine";
import { BN_FONT, ensureBanglaFont } from "../fonts";
import { Bokeh, Diya, GlowDefs } from "../fx/Fx";
import { CueSubtitles } from "../Scene02Demo";
import { AmavasyaSky, FarBank, ForegroundPalms, NearVillage, PadmaNight } from "../sets/Exteriors";

/**
 * Episode 1 · Scene 00 — Title card.
 * "ছোটদের বালক ঠাকুরের গল্প। পর্ব এক: যে রাতে ঢাক থেমে গেল।"
 * Kali-puja night over the Padma, diyas waking along the bank; a dhak beats in silhouette
 * and falls still on the episode title. Divine hint only (Level 0→1): one soft star of light
 * settles over "ঠাকুর".
 */

export const SCENE00 = EPISODE_01_SCENES.find((s) => s.sceneId === "00_intro")!;

// title is shown as animated type, so no subtitle band on this card
export const SCENE00_CUES: { from: number; to: number; who: string; text: string }[] = [];

// voice timing (narrator RMS pauses): line 1 3–63, "পর্ব এক" 79–98, title 108–168
const L1 = 3;
const L2 = 79;
const L3 = 108;
const DHAK_STILL = 150; // the dhak falls silent on the title

/** Animated word: rises, un-blurs and fades in (whole words keep Bangla conjuncts shaped). */
const Word: React.FC<{ f: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, children, style }) => {
  const t = clamp((f - at) / 14);
  const e = EASE.out(t);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: e,
        transform: `translateY(${(1 - e) * 26}px) scale(${0.92 + e * 0.08})`,
        filter: `blur(${(1 - e) * 8}px)`,
        marginRight: "0.28em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Dhak in silhouette with kash-feather plume; beats until `still`, then rests. */
const DhakSilhouette: React.FC<{ f: number; x: number; y: number; s: number; still: number }> = ({ f, x, y, s, still }) => {
  const beating = f < still;
  const hit = beating ? Math.pow(Math.abs(Math.sin(f * 0.42)), 8) : 0;
  const stickA = beating ? -30 + Math.sin(f * 0.84) * 22 : -60;
  const stickB = beating ? 210 + Math.sin(f * 0.84 + 2.4) * 18 : 235;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* beat rings */}
      {beating && <ellipse cx={0} cy={0} rx={150 + hit * 40} ry={110 + hit * 30} fill="none" stroke="#ffb860" strokeWidth={3} opacity={hit * 0.45} />}
      <g transform="rotate(-14)">
        <ellipse cx={-120} cy={0} rx={34} ry={86} fill="#120a10" />
        <path d="M -120 -86 Q 0 -108 120 -86 L 120 86 Q 0 108 -120 86 Z" fill="#160c12" />
        <ellipse cx={120} cy={0} rx={34} ry={86} fill="#1c1018" />
        <path d="M -120 -86 Q 0 -108 120 -86" stroke="#ffb860" strokeWidth={3} fill="none" opacity={0.55} />
        {/* kash plume */}
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={i}
            d="M 0 -98 Q 16 -180 4 -250"
            stroke="#1a1016"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${-60 + i * 10 + Math.sin(f * 0.05 + i) * 3})`}
          />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={`r${i}`}
            d="M 0 -98 Q 16 -180 4 -250"
            stroke="#ffcf87"
            strokeWidth={1.6}
            fill="none"
            opacity={0.35}
            transform={`rotate(${-60 + i * 10 + Math.sin(f * 0.05 + i) * 3})`}
          />
        ))}
      </g>
      {/* sticks */}
      <line x1={140} y1={-40} x2={140 + Math.cos((stickA * Math.PI) / 180) * 110} y2={-40 + Math.sin((stickA * Math.PI) / 180) * 110} stroke="#120a10" strokeWidth={8} strokeLinecap="round" />
      <line x1={170} y1={30} x2={170 + Math.cos((stickB * Math.PI) / 180) * 100} y2={30 + Math.sin((stickB * Math.PI) / 180) * 100} stroke="#120a10" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

export const Scene00Intro: React.FC<{ scene: SceneTiming }> = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const wave = track(f, [
    [0, 0.15],
    [120, 1, "inOut"],
  ]);
  const cam = {
    x: track(f, [
      [0, -60],
      [178, 60],
    ]),
    y: track(f, [
      [0, -120],
      [178, -20, "inOut"],
    ]),
    zoom: track(f, [
      [0, 1.02],
      [178, 1.14],
    ]),
    focus: 0.7,
    dof: 3.2,
  };
  const out = clamp((178 - f) / 12);
  const starIn = clamp((f - 40) / 30);
  const titleGlow = 0.5 + 0.5 * Math.sin(f * 0.08);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      <Stage cam={cam} opacity={clamp(f / 12) * out}>
        <Layer depth={0.04}>
          <GlowDefs />
          <AmavasyaSky f={f} horizonGlow={0.3 + wave * 0.6} />
        </Layer>
        <Layer depth={0.3}>
          <GlowDefs />
          <FarBank f={f} wave={wave} />
        </Layer>
        <Layer depth={0.45}>
          <GlowDefs />
          <PadmaNight f={f} wave={wave} />
        </Layer>
        <Layer depth={0.7}>
          <GlowDefs />
          <NearVillage f={f} wave={wave} puja={clamp((f - 30) / 60)} />
        </Layer>
        <Layer depth={1.1}>
          <GlowDefs />
          {[160, 340, 1580, 1760].map((x, i) => (
            <Diya key={x} x={x} y={1010 + (i % 2) * 12} s={2.2} f={f} seed={i + 5} />
          ))}
        </Layer>
        <Layer depth={1.3}>
          <ForegroundPalms f={f} />
          <DhakSilhouette f={f} x={1640} y={930} s={1.25} still={DHAK_STILL} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={16} seed={3} />
        </Layer>
        <Grade warmth={0.3} vignette={0.7} bloomAt={[50, 46]} />
      </Stage>

      {/* title block */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: BN_FONT,
          opacity: out,
          textAlign: "center",
        }}
      >
        {/* dark soft halo behind the type */}
        <div
          style={{
            position: "absolute",
            top: -60,
            width: 1300,
            height: 560,
            background: "radial-gradient(ellipse at 50% 45%, rgba(10,6,14,0.62) 0%, rgba(10,6,14,0.25) 55%, rgba(10,6,14,0) 75%)",
          }}
        />
        <div style={{ position: "relative", fontSize: 52, fontWeight: 600, color: "#ffe7ae", letterSpacing: 1 }}>
          <Word f={f} at={L1}>ছোটদের</Word>
        </div>
        <div
          style={{
            position: "relative",
            fontSize: 132,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#fff4d6",
            textShadow: `0 0 ${18 + titleGlow * 14}px rgba(255,200,110,0.65), 0 4px 0 #7a3a10, 0 8px 24px rgba(0,0,0,0.6)`,
          }}
        >
          <Word f={f} at={L1 + 8}>বালক</Word>
          <Word f={f} at={L1 + 18}>
            <span style={{ position: "relative" }}>
              ঠাকুরের
              {/* the one divine hint: a soft star settles over "ঠাকুর" */}
              <svg width={80} height={80} viewBox="-40 -40 80 80" style={{ position: "absolute", left: "78%", top: -22, opacity: starIn, overflow: "visible" }}>
                <circle r={34} fill="#fff4d6" opacity={0.25 + 0.1 * Math.sin(f * 0.1)} style={{ filter: "blur(8px)" }} />
                <DivineCatchlight x={0} y={0} r={16 + starIn * 6} f={f} />
              </svg>
            </span>
          </Word>
          <Word f={f} at={L1 + 30}>গল্প</Word>
        </div>
        {/* ornamental divider */}
        <svg width={620} height={40} viewBox="-310 -20 620 40" style={{ position: "relative", margin: "6px 0 10px", opacity: clamp((f - 50) / 16) }}>
          <line x1={-300 * clamp((f - 50) / 22)} y1={0} x2={300 * clamp((f - 50) / 22)} y2={0} stroke="#e8b45a" strokeWidth={2} />
          <circle r={7} fill="#ffcf87" />
          <circle cx={-24} r={3.5} fill="#ffcf87" />
          <circle cx={24} r={3.5} fill="#ffcf87" />
        </svg>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28 }}>
          <Word f={f} at={L2}>
            <span
              style={{
                display: "inline-block",
                fontSize: 46,
                fontWeight: 700,
                color: "#3a1606",
                background: "linear-gradient(180deg, #ffe08a, #e8a43a)",
                borderRadius: 40,
                padding: "2px 30px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
              }}
            >
              পর্ব এক
            </span>
          </Word>
        </div>
        <div style={{ position: "relative", marginTop: 14, fontSize: 76, fontWeight: 700, color: "#ffd98a", textShadow: "0 3px 0 #5a2408, 0 6px 22px rgba(0,0,0,0.6)" }}>
          <Word f={f} at={L3}>যে</Word>
          <Word f={f} at={L3 + 6}>রাতে</Word>
          <Word f={f} at={L3 + 13}>ঢাক</Word>
          <Word f={f} at={L3 + 20}>থেমে</Word>
          <Word f={f} at={L3 + 27}>গেল</Word>
        </div>
      </div>

      {/* motes drifting up through the title */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: out * 0.8, mixBlendMode: "screen" }}>
        <Motes f={f} x={960} y={560} n={14} spread={700} rise={-260} seed={7} o={0.7} />
      </svg>
    </div>
  );
};

/** Sound bed (no voices): bansuri theme, chimes on the title beats; theme dips as the dhak falls still. */
export const Scene00SoundBed: React.FC<{ scene: SceneTiming }> = () => (
  <>
    <Audio
      src={staticFile("audio/music/Theme_Intro_Bansuri.wav")}
      volume={(fr) => interpolate(fr, [0, 10, DHAK_STILL - 4, DHAK_STILL + 6, 164, 178], [0, 0.3, 0.3, 0.16, 0.16, 0], { extrapolateRight: "clamp" })}
    />
    {[L1 + 8, L2, L3].map((at) => (
      <Sequence key={at} from={at} durationInFrames={40} layout="none">
        <Audio src={staticFile("audio/sfx/chime_pop.wav")} volume={0.35} />
      </Sequence>
    ))}
  </>
);

export const Scene00Demo: React.FC = () => {
  const scene = SCENE00;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene00Intro scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene00SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE00_CUES} />
    </div>
  );
};
