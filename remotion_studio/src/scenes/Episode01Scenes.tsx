import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera25D, CameraOffset, ParallaxPlane } from "../components/Camera25D";
import { BengalCourtyardAndFlora, BengalSky, PadmaRiver, WeatherVFX } from "../components/BengalNature";
import { BabyThakurRig, CharacterRig, Emotion, Gesture, LittleGoatRig, RiggedCharacterId, headPosition } from "../components/CharacterRig";
import { AtmosphereHaze, CinematicFrame, GodRays, useSvgId } from "../components/Cinematic";
import { DawnFlowersSet, IndoorRoomSet, KaliMandapSet } from "../components/SceneSets";
import { SourceAttribution } from "../components/SourceAttribution";
import { CameraKeyframe, CharacterId, SceneTiming } from "../types/studio";
import { clamp, lerp, progress } from "../lib/motion";
import { MOOD_LIGHT, MoodContext, tintMatrix } from "../lib/mood";
import { speakerEnergy } from "../lib/speech";

/* ------------------------------------------------------------------ */
/* Scene direction (data)                                              */
/* ------------------------------------------------------------------ */

type CastMember =
  | {
      kind: "rig";
      id: RiggedCharacterId;
      x: number;
      y: number;
      flipX?: boolean;
      gesture?: Gesture;
      emotion?: Emotion;
      voice?: CharacterId;
      voiceScale?: number;
      /** Optional 0..1 fractional window within the speaker clip (for 2-speaker turn-taking). */
      voiceWindow?: [number, number];
    }
  | { kind: "baby"; x: number; y: number; scale?: number }
  | { kind: "goat"; x: number; y: number; toX?: number };

interface Direction {
  camera: CameraKeyframe[];
  sky: boolean;
  river?: { steamship: boolean };
  courtyard?: { diyas: boolean };
  setPiece?: "mandap" | "indoor" | "flowers";
  vfx: "rain" | "sparkles" | "fireflies" | "petals" | "none";
  cast: CastMember[];
  /** 0 = never reframe on speakers; 1 = full medium close-up on each speaker. */
  speakerFocus: number;
  handheld?: number;
  /** Plane the lens is focused on (1.0 = characters). */
  focusDepth?: number;
}

const rig = (id: RiggedCharacterId, x: number, y: number, extra: Partial<Omit<Extract<CastMember, { kind: "rig" }>, "kind" | "id" | "x" | "y">> = {}): CastMember => ({
  kind: "rig",
  id,
  x,
  y,
  ...extra,
});

const DIRECTION: Record<string, (d: number) => Direction> = {
  "01_medinimondal_village": (d) => ({
    // 4-beat establishing shot with rack focus: Padma steamship (0.35) -> Baidik Bari (0.65)
    camera: [
      { frame: 0, x: -110, y: -65, zoom: 1.14, focusDepth: 0.35 },
      { frame: Math.round(d * 0.28), x: -55, y: 8, zoom: 1.04, focusDepth: 0.35, ease: "inOutCubic" },
      { frame: Math.round(d * 0.62), x: 35, y: -6, zoom: 1.02, focusDepth: 0.65, ease: "inOutSine" },
      { frame: d, x: 105, y: -18, zoom: 1.11, focusDepth: 0.65, ease: "inOutCubic" },
    ],
    sky: true,
    river: { steamship: true },
    courtyard: { diyas: false },
    vfx: "petals",
    cast: [],
    speakerFocus: 0,
    focusDepth: 0.65,
  }),
  "02_diwali_celebration": (d) => ({
    camera: [
      { frame: 0, x: -70, y: 12, zoom: 1.0 },
      { frame: Math.round(d * 0.5), x: 10, y: -4, zoom: 1.05, ease: "inOutSine" },
      { frame: d, x: 65, y: -10, zoom: 1.09, ease: "inOutCubic" },
    ],
    sky: true,
    courtyard: { diyas: true },
    vfx: "fireflies",
    cast: [
      rig("babukaka", 720, 690, { gesture: "sparkler", emotion: "joyful" }),
      // Turn-taking banter: Gopal speaks first 52% of 02b_Scene2_Kids.wav, Rama replies in last 48%
      rig("gopal", 1010, 745, { flipX: true, gesture: "sparkler", emotion: "joyful", voiceWindow: [0, 0.52] }),
      rig("rama", 1190, 735, { flipX: true, gesture: "wave", emotion: "joyful", voice: "gopal", voiceScale: 1.0, voiceWindow: [0.52, 1.0] }),
    ],
    speakerFocus: 0.85,
  }),
  "03_quiet_arrival": (d) => ({
    // Reverent slow push-in toward the newborn.
    camera: [
      { frame: 0, x: -20, y: 16, zoom: 1.0, focusDepth: 0.85 },
      { frame: Math.round(d * 0.55), x: 0, y: 22, zoom: 1.1, focusDepth: 1.0, ease: "inOutSine" },
      { frame: d, x: 0, y: 32, zoom: 1.22, focusDepth: 1.0, ease: "inOutCubic" },
    ],
    sky: true,
    courtyard: { diyas: true },
    vfx: "sparkles",
    cast: [
      rig("charu", 780, 690, { gesture: "platter", emotion: "worried" }),
      rig("manorama_devi", 1080, 690, { flipX: true, gesture: "bless", emotion: "serene" }),
      rig("bhagabati_thakur", 1380, 700, { flipX: true, emotion: "worried" }),
      { kind: "baby", x: 960, y: 775, scale: 1.15 },
    ],
    speakerFocus: 0.7,
    handheld: 0.6,
  }),
  "04_seven_uludhwani": (d) => ({
    camera: [
      { frame: 0, x: -35, y: 0, zoom: 1.0 },
      { frame: Math.min(76, d), x: 0, y: -12, zoom: 1.14, ease: "outCubic" },
      { frame: d, x: 0, y: -16, zoom: 1.18 },
    ],
    sky: true,
    courtyard: { diyas: true },
    setPiece: "mandap",
    vfx: "sparkles",
    cast: [rig("bhagabati_thakur", 920, 695, { gesture: "bell", emotion: "amazed" })],
    speakerFocus: 0.6,
    handheld: 0.3,
  }),
  "05_rain_flashback_and_mystic": (d) => ({
    camera: [
      { frame: 0, x: 40, y: 0, zoom: 1.02 },
      { frame: Math.round(d * 0.48), x: -55, y: -6, zoom: 1.08, ease: "inOutCubic" },
      { frame: d, x: 30, y: -10, zoom: 1.06, ease: "inOutSine" },
    ],
    sky: true,
    courtyard: { diyas: false },
    setPiece: "indoor",
    vfx: "rain",
    cast: [
      rig("pagol_mystic", 620, 700, { gesture: "bless", emotion: "ecstatic" }),
      rig("sundar_thakur", 1040, 700, { flipX: true, gesture: "scroll", emotion: "amazed" }),
      rig("charu", 1290, 705, { flipX: true, emotion: "serene" }),
      rig("manorama_devi", 1480, 705, { flipX: true, emotion: "serene" }),
    ],
    speakerFocus: 0.9,
    handheld: 1.35,
  }),
  "06_thakurma_joy": (d) => ({
    camera: [
      { frame: 0, x: 30, y: 0, zoom: 1.02 },
      { frame: d, x: -24, y: -12, zoom: 1.12, ease: "inOutCubic" },
    ],
    sky: true,
    courtyard: { diyas: true },
    setPiece: "indoor",
    vfx: "sparkles",
    cast: [
      rig("grumpy_relative", 640, 705, { emotion: "grumpy" }),
      rig("thakurma", 1100, 700, { flipX: true, gesture: "wave", emotion: "joyful" }),
      { kind: "baby", x: 900, y: 785 },
    ],
    speakerFocus: 0.85,
  }),
  "07_flowers_and_little_goat": (d) => ({
    camera: [
      { frame: 0, x: -55, y: 0, zoom: 1.0 },
      { frame: Math.round(d * 0.55), x: 15, y: -6, zoom: 1.05, ease: "inOutSine" },
      { frame: d, x: 55, y: -12, zoom: 1.09, ease: "inOutCubic" },
    ],
    sky: true,
    river: { steamship: false },
    courtyard: { diyas: false },
    setPiece: "flowers",
    vfx: "petals",
    cast: [
      rig("sundar_thakur", 740, 690, { gesture: "namaskar", emotion: "serene" }),
      { kind: "baby", x: 1020, y: 795 },
      { kind: "goat", x: 1360, toX: 1125, y: 810 },
    ],
    speakerFocus: 0.7,
  }),
  "08_closing_moral_outro": (d) => ({
    // 3-beat closing crane pull-out & rack focus from glowing newborn to Padma sunrise
    camera: [
      { frame: 0, x: 0, y: 34, zoom: 1.24, focusDepth: 1.0 },
      { frame: Math.round(d * 0.45), x: -24, y: 6, zoom: 1.1, focusDepth: 0.65, ease: "inOutSine" },
      { frame: d, x: 18, y: -24, zoom: 1.0, focusDepth: 0.35, ease: "inOutCubic" },
    ],
    sky: true,
    river: { steamship: true },
    courtyard: { diyas: false },
    vfx: "sparkles",
    cast: [{ kind: "baby", x: 960, y: 440, scale: 1.4 }],
    speakerFocus: 0,
    focusDepth: 0.9,
  }),
};

/* ------------------------------------------------------------------ */
/* Virtual cinematographer                                             */
/* ------------------------------------------------------------------ */

type Rig = Extract<CastMember, { kind: "rig" }>;
const voiceOf = (m: Rig): CharacterId => m.voice ?? m.id;

const LEAD = 8; // camera starts moving slightly before the line (anticipation)
const MOVE = 26;

/** Who (if anyone in frame) holds the shot for each clip, in order. */
const shotTargets = (scene: SceneTiming, cast: CastMember[]) =>
  scene.clips.map((clip) => {
    const m = cast.find((c): c is Rig => c.kind === "rig" && c.id === clip.speaker && !c.voice);
    return { start: clip.offsetFrame, member: m ?? null };
  });

const shotOffset = (m: Rig | null, strength: number): CameraOffset => {
  if (!m || strength <= 0) return { x: 0, y: 0, zoom: 1 };
  const head = headPosition(m.id, m.x, m.y);
  return {
    // Frame the speaker slightly off-centre, leaving "looking room" in front of them.
    x: clamp((head.x - 960 + (m.flipX ? -70 : 70)) * strength * 0.75, -240, 240),
    y: clamp((head.y - 470) * strength * 0.6, -60, 120),
    zoom: 1 + 0.2 * strength,
  };
};

const blendOffsets = (a: CameraOffset, b: CameraOffset, t: number): CameraOffset => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)),
});

const cameraOffsetAt = (scene: SceneTiming, cast: CastMember[], f: number, strength: number): CameraOffset => {
  const shots = shotTargets(scene, cast);
  let i = -1;
  for (let k = 0; k < shots.length; k++) if (shots[k].start - LEAD <= f) i = k;
  if (i < 0) return shotOffset(null, strength);
  const prev = i > 0 ? shotOffset(shots[i - 1].member, strength) : shotOffset(null, strength);
  const cur = shotOffset(shots[i].member, strength);
  return blendOffsets(prev, cur, progress(f, shots[i].start - LEAD, MOVE, "inOutCubic"));
};

/** Where a listener looks: the current speaker, else the scene's point of interest. */
const lookTargetAt = (scene: SceneTiming, cast: CastMember[], self: Rig, f: number): number | undefined => {
  const poi = cast.find((c) => c.kind === "baby");
  const others = cast.filter((c): c is Rig => c.kind === "rig" && c !== self);
  const targetFor = (speaker: CharacterId | null): number | undefined => {
    if (speaker && speaker === voiceOf(self)) {
      // The speaker addresses the group (or the baby).
      if (poi) return poi.x;
      return others.length ? others.reduce((s, o) => s + o.x, 0) / others.length : undefined;
    }
    const sp = cast.find((c): c is Rig => c.kind === "rig" && c.id === speaker);
    if (sp) return sp.x;
    return poi ? poi.x : undefined;
  };
  let i = -1;
  for (let k = 0; k < scene.clips.length; k++) if (scene.clips[k].offsetFrame - 4 <= f) i = k;
  const cur = targetFor(i >= 0 ? scene.clips[i].speaker : null);
  const prev = targetFor(i > 0 ? scene.clips[i - 1].speaker : null);
  if (i < 0 || cur === undefined || prev === undefined) return cur;
  return lerp(prev, cur, progress(f, scene.clips[i].offsetFrame - 4, 12, "inOutSine"));
};

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */

const Stage: React.FC<{ scene: SceneTiming; cast: CastMember[]; f: number; sceneFrozen?: boolean }> = ({
  scene,
  cast,
  f,
  sceneFrozen = false,
}) => {
  const light = MOOD_LIGHT[scene.lighting];
  const tintId = useSvgId("ambient");
  const rigs = cast.filter((c): c is Rig => c.kind === "rig");

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" overflow="visible">
      <defs>
        <filter id={tintId} x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix type="matrix" values={tintMatrix(light.ambient, light.ambientStrength)} />
        </filter>
      </defs>
      {cast.map((c, i) => (c.kind === "baby" ? <BabyThakurRig key={`b${i}`} x={c.x} y={c.y} scale={c.scale} /> : null))}
      <g filter={`url(#${tintId})`}>
        {cast.map((c, i) => {
          if (c.kind !== "goat") return null;
          const gx = c.toX !== undefined ? lerp(c.x, c.toX, progress(f, Math.round(scene.durationFrames * 0.25), Math.round(scene.durationFrames * 0.55), "inOutSine")) : c.x;
          return <LittleGoatRig key={`g${i}`} x={gx} y={c.y} />;
        })}
        {rigs
          .slice()
          .sort((a, b) => a.y - b.y)
          .map((m) => {
            const v = voiceOf(m);
            const scale = m.voiceScale ?? 1;
            let inWindow = true;
            if (m.voiceWindow) {
              const clip = scene.clips.find((cl) => cl.speaker === v);
              if (clip) {
                const rel = (f - clip.offsetFrame) / Math.max(1, clip.frames);
                inWindow = rel >= m.voiceWindow[0] && rel <= m.voiceWindow[1];
              }
            }
            const e = inWindow ? speakerEnergy(scene, f, v) * scale : 0;
            const ePrev = inWindow ? speakerEnergy(scene, f - 4, v) * scale : 0;
            return (
              <CharacterRig
                key={m.id}
                id={m.id}
                x={m.x}
                y={m.y}
                flipX={m.flipX}
                gesture={m.gesture}
                emotion={m.emotion}
                frozen={sceneFrozen}
                rms={e}
                emphasis={clamp((e - ePrev) * 2.2, 0, 1)}
                lookAtX={lookTargetAt(scene, cast, m, f)}
              />
            );
          })}
      </g>
    </svg>
  );
};

const TitleCard: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const words = ["পর্ব", "১:", "যে", "রাতে", "ঢাক", "থেমে", "গেল"];
  const subtitlePop = spring({ frame: f, fps, config: { damping: 14, stiffness: 80 } });
  const sweep = progress(f, 40, 50, "inOutCubic");
  const shimmerId = useSvgId("shimmer");

  return (
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
      }}
    >
      {/* Rotating alpana mandala behind the title */}
      <svg width="760" height="760" viewBox="-380 -380 760 760" style={{ position: "absolute", opacity: 0.22 * subtitlePop }}>
        <defs>
          <linearGradient id={shimmerId}>
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${f * 0.2})`}>
          {Array.from({ length: 16 }).map((_, i) => (
            <path key={i} d="M 0 -120 Q 30 -230 0 -340 Q -30 -230 0 -120 Z" fill={`url(#${shimmerId})`} transform={`rotate(${i * 22.5})`} />
          ))}
          <circle r="110" fill="none" stroke="#fff3c4" strokeWidth={6} strokeDasharray="4 14" />
        </g>
      </svg>
      <div
        style={{
          fontSize: 42,
          color: "#fff8e1",
          fontWeight: 700,
          textShadow: "0 4px 16px rgba(0,0,0,0.35)",
          opacity: subtitlePop,
          transform: `translateY(${(1 - subtitlePop) * 20}px)`,
          letterSpacing: 1,
        }}
      >
        ছোটদের বালক ঠাকুরের গল্প
      </div>
      <div style={{ position: "relative", fontSize: 78, fontWeight: 900, marginTop: 14 }}>
        {/* Two identical word rows: the base title, and a copy whose glyphs carry a moving light sweep. */}
        {[false, true].map((isSweep) => (
          <div
            key={String(isSweep)}
            style={{
              display: "flex",
              gap: 22,
              ...(isSweep
                ? {
                    position: "absolute",
                    inset: 0,
                    color: "transparent",
                    backgroundImage: `linear-gradient(105deg, transparent ${sweep * 160 - 40}%, rgba(255,255,255,0.95) ${sweep * 160 - 25}%, transparent ${sweep * 160 - 10}%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    opacity: sweep > 0 && sweep < 1 ? 1 : 0,
                  }
                : {}),
            }}
          >
            {words.map((w, i) => {
              const p = spring({ frame: f - 10 - i * 4, fps, config: { damping: 11, stiffness: 120 } });
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    color: isSweep ? "transparent" : "#142850",
                    textShadow: isSweep ? "none" : "0 4px 0 #ffd166, 0 0 26px rgba(255,246,220,0.9), 0 12px 34px rgba(20,40,80,0.35)",
                    opacity: clamp(p * 1.4, 0, 1),
                    transform: `translateY(${(1 - p) * 60}px) scale(${0.6 + 0.4 * p})`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SceneRenderer: React.FC<{ scene: SceneTiming; frame?: number }> = ({ scene, frame: frameProp }) => {
  const current = useCurrentFrame();
  const f = frameProp ?? current;
  const d = scene.durationFrames;
  const light = MOOD_LIGHT[scene.lighting];

  if (scene.sceneId === "00_intro") {
    return (
      <MoodContext.Provider value={scene.lighting}>
        <CinematicFrame>
          <Camera25D frame={f} handheld={0.5} keyframes={[{ frame: 0, x: 0, y: 0, zoom: 1 }, { frame: d, x: 0, y: -10, zoom: 1.08 }]}>
            <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
              <BengalSky mood="bright_orange_flat" />
            </ParallaxPlane>
            <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
              <PadmaRiver mood="soft_golden_dawn" showSteamship={false} />
            </ParallaxPlane>
            <ParallaxPlane parallaxFactor={0.5} zIndex={3}>
              <AtmosphereHaze />
            </ParallaxPlane>
            <ParallaxPlane parallaxFactor={1.0} zIndex={4} sharp fullBleed={false}>
              <TitleCard f={f} />
              <SourceAttribution variant="intro" />
            </ParallaxPlane>
            <ParallaxPlane parallaxFactor={1.35} zIndex={5}>
              <WeatherVFX type="sparkles" />
            </ParallaxPlane>
          </Camera25D>
        </CinematicFrame>
      </MoodContext.Provider>
    );
  }

  const direct = (DIRECTION[scene.sceneId] ?? DIRECTION["08_closing_moral_outro"])(d);
  const offset = cameraOffsetAt(scene, direct.cast, f, direct.speakerFocus);

  // Scene 04 dramatic freeze right after Bhagabati Thakur's call (04a_Scene4_Bhagabati.wav)
  const freezeFrame = scene.sceneId === "04_seven_uludhwani" ? (scene.clips[0]?.frames ?? 72) + 6 : Infinity;
  const sceneFrozen = f >= freezeFrame;

  // Scene 05: fade indoor room out during the rainy Pagol flashback clip (05c_Pagol_Flashback.wav)
  const fbClip = scene.sceneId === "05_rain_flashback_and_mystic" ? scene.clips.find((c) => c.file.includes("Flashback")) : undefined;
  const isFlashback = fbClip ? f >= fbClip.offsetFrame - 10 && f <= fbClip.offsetFrame + fbClip.frames + 10 : false;
  const indoorOpacity = scene.sceneId === "05_rain_flashback_and_mystic" ? (isFlashback ? 0.15 : 0.96) : 1;

  return (
    <MoodContext.Provider value={scene.lighting}>
      <CinematicFrame>
        <Camera25D frame={f} keyframes={direct.camera} offset={offset} handheld={direct.handheld ?? 1} focusDepth={direct.focusDepth ?? 1}>
          {direct.sky && (
            <ParallaxPlane parallaxFactor={0.15} zIndex={1}>
              <BengalSky mood={scene.lighting} />
            </ParallaxPlane>
          )}
          {light.godRays && (
            <ParallaxPlane parallaxFactor={0.2} zIndex={2} blendMode="screen" sharp>
              <GodRays {...light.godRays} />
            </ParallaxPlane>
          )}
          {direct.river && (
            <ParallaxPlane parallaxFactor={0.35} zIndex={2}>
              <PadmaRiver mood={scene.lighting} showSteamship={direct.river.steamship} />
            </ParallaxPlane>
          )}
          <ParallaxPlane parallaxFactor={0.5} zIndex={3} sharp>
            <AtmosphereHaze />
          </ParallaxPlane>
          {direct.courtyard && (
            <ParallaxPlane parallaxFactor={0.65} zIndex={3}>
              <BengalCourtyardAndFlora mood={scene.lighting} showDiyas={direct.courtyard.diyas} />
            </ParallaxPlane>
          )}
          {direct.setPiece === "mandap" && (
            <ParallaxPlane parallaxFactor={0.78} zIndex={3} fullBleed={false}>
              <KaliMandapSet frozen={sceneFrozen} />
            </ParallaxPlane>
          )}
          {direct.setPiece === "indoor" && (
            <ParallaxPlane parallaxFactor={0.72} zIndex={3} opacity={indoorOpacity}>
              <IndoorRoomSet />
            </ParallaxPlane>
          )}
          {direct.setPiece === "flowers" && (
            <ParallaxPlane parallaxFactor={0.82} zIndex={3} fullBleed={false}>
              <DawnFlowersSet />
            </ParallaxPlane>
          )}
          <ParallaxPlane parallaxFactor={1.0} zIndex={4} fullBleed={false}>
            <Stage scene={scene} cast={direct.cast} f={f} sceneFrozen={sceneFrozen} />
            {(scene.sceneId === "08_closing_moral_outro" || scene.sceneId === "99_closing_sequential_outro") && (
              <SourceAttribution variant="outro" />
            )}
          </ParallaxPlane>
          <ParallaxPlane parallaxFactor={1.35} zIndex={5} fullBleed={false} opacity={scene.sceneId === "05_rain_flashback_and_mystic" && !isFlashback ? 0.2 : 1}>
            <WeatherVFX type={direct.vfx} />
          </ParallaxPlane>
        </Camera25D>
      </CinematicFrame>
    </MoodContext.Provider>
  );
};
