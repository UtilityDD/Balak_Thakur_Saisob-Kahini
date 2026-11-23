import React from "react";
import { Audio, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SeriesSubtitles } from "../../episode/SeriesSubtitles";
import { clipSpan3, cueLocalStory3, pausesFor3, storyToReal } from "../../episode/storyClock";
import { EP03_CUES } from "../../episode03/subtitles";
import { EP03_AUDIO, EP03_SCENES, EP03_TOTAL_FRAMES } from "../../episode03/timing";
import { GhibliWashTransition } from "../core/GhibliWashTransition";
import { GhibliScene00bSource } from "./scenes/GhibliScene00bSource";
import { GhibliScene00Intro } from "./scenes/GhibliScene00Intro";
import { GhibliScene01DawnGarden } from "./scenes/GhibliScene01DawnGarden";
import { GhibliScene02TulsiCourtyard } from "./scenes/GhibliScene02TulsiCourtyard";
import { GhibliScene98NextEpisode } from "./scenes/GhibliScene98Ep4Glimpse";
import { GhibliScene99Outro } from "./scenes/GhibliScene99Outro";

/**
 * Separate Ghibli Sketch Test Composition for Episode 3 (3,259 frames, 24 fps, 1920x1080).
 * Keeps 100% of Episode 3's approved timing, pauses, voice clips, SFX, Indian classical score,
 * subtitles, and character rigs unchanged, while routing every scene through the Ghibli sketch scenes.
 */

const sceneById = (id: string) => {
  const s = EP03_SCENES.find((x) => x.sceneId === id);
  if (!s) throw new Error(`Episode03Ghibli: unknown scene ${id}`);
  return s;
};
const sceneStart = (id: string): number => sceneById(id).startFrame;
const sceneEnd = (id: string) => {
  const s = sceneById(id);
  return s.startFrame + s.durationFrames;
};

const S01 = "01_sharad_flower_gathering";
const S02 = "02_flowers_on_own_feet";
const OUTRO = "99_closing_sequential_outro";

const S01_FADE_IN = 14;
const SOURCE_CARD_END = sceneStart(S01) + S01_FADE_IN;

const GhibliSourceAttributionScene: React.FC = () => {
  const frames = SOURCE_CARD_END - sceneStart("00b_source_attribution");
  return <GhibliScene00bSource frames={frames} />;
};

const S02_DISSOLVE = 18;
const S02_OWN_FADE = 10;

const OUTRO_TAIL = sceneEnd("98_next_episode") - sceneEnd(OUTRO);

const SCENE_TAIL: Record<string, number> = {
  "00b_source_attribution": SOURCE_CARD_END - sceneEnd("00b_source_attribution"),
  [S01]: Math.max(0, sceneStart(S02) + S02_DISSOLVE - sceneEnd(S01)),
  [OUTRO]: OUTRO_TAIL,
};
const SCENE_DISSOLVE_IN: Record<string, number> = { [S02]: S02_DISSOLVE };

const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, f / frames));
  const opacity = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

const GhibliScene02Dissolving: React.FC = () => {
  const f = useCurrentFrame();
  const active = f < S02_DISSOLVE;
  const mapped = Math.round(S02_OWN_FADE + (f * (S02_DISSOLVE - S02_OWN_FADE)) / S02_DISSOLVE);
  return (
    <Freeze frame={active ? mapped : f} active={active}>
      <GhibliScene02TulsiCourtyard />
    </Freeze>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  "00_intro": GhibliScene00Intro,
  "00b_source_attribution": GhibliSourceAttributionScene,
  [S01]: GhibliScene01DawnGarden,
  [S02]: GhibliScene02Dissolving,
  [OUTRO]: GhibliScene99Outro,
  "98_next_episode": GhibliScene98NextEpisode,
};

/* ------------------------------------------------------------------ */
/* Timeline anchors, ducking, beds, SFX, and music (identical to Ep3)  */
/* ------------------------------------------------------------------ */

const storyReal = (sceneId: string, story: number): number => storyToReal(story, pausesFor3(sceneId));

const pauseWindow = (sceneId: string, index: number): { start: number; end: number; frames: number } => {
  const p = pausesFor3(sceneId)[index];
  if (!p) throw new Error(`Episode03Ghibli: scene ${sceneId} has no pause ${index}`);
  const start = p.startFrame - sceneStart(sceneId);
  return { start, end: start + p.frames, frames: p.frames };
};

const phraseLocal = (sceneId: string, snippet: string): number | undefined => {
  const i = EP03_SCENES.findIndex((s) => s.sceneId === sceneId);
  const s = EP03_SCENES[i];
  const next = EP03_SCENES[i + 1];
  if (!s) return undefined;
  const end = Math.min(s.startFrame + s.durationFrames, next ? next.startFrame : Infinity);
  const c = EP03_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  return c ? c.from - s.startFrame : undefined;
};

const GATE_RAMP = 5;
const storyRunning = (sceneId: string, absFrame: number): number => {
  let g = 1;
  for (const p of pausesFor3(sceneId)) {
    const a = p.startFrame;
    const b = p.startFrame + p.frames;
    const d = absFrame < a ? a - absFrame : absFrame > b ? absFrame - b : 0;
    g = Math.min(g, Math.min(1, d / GATE_RAMP));
  }
  return g;
};

const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

const DUCK_RAMP = 10;
const DUCK_MERGE = 20;
const SPEECH: [number, number][] = (() => {
  const spans = EP03_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < DUCK_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();
const speechAmount = (frame: number): number => {
  let amt = 0;
  for (const [a, b] of SPEECH) {
    if (frame < a - DUCK_RAMP) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - DUCK_RAMP)) / DUCK_RAMP;
    else if (frame <= b + DUCK_RAMP) t = 1 - (frame - b) / DUCK_RAMP;
    amt = Math.max(amt, ease(t));
  }
  return amt;
};
const ducked = (open: number, under: number, frame: number) => open + (under - open) * speechAmount(frame);

interface BedLayer {
  file: string;
  under: number;
  open: number;
  pauseOpen?: Record<number, number>;
  out?: { from: number; frames: number };
}
interface Bed {
  name: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  pauseScene?: string;
  layers: BedLayer[];
}

const MOTIF_IN = sceneStart(S02) + (phraseLocal(S02, "গাছ কেটে") ?? storyReal(S02, 905));

const BEDS: Bed[] = [
  {
    name: "intro",
    from: 0,
    to: sceneStart(S01) + 24,
    fadeIn: 1,
    fadeOut: 24,
    layers: [{ file: "music/Theme_Intro_Bansuri.wav", under: 0.08, open: 0.14 }],
  },
  {
    name: "01 dawn garden",
    from: sceneStart(S01),
    to: sceneStart(S02) + S02_DISSOLVE,
    fadeIn: 24,
    fadeOut: S02_DISSOLVE,
    pauseScene: S01,
    layers: [
      { file: "ambient/dawn_birds_temple.wav", under: 0.1, open: 0.22, pauseOpen: { 2: 0.2 } },
      { file: "sfx/ep02/wind_soft.wav", under: 0.1, open: 0.15 },
    ],
  },
  {
    name: "02 tulsi courtyard",
    from: sceneStart(S02),
    to: sceneEnd(S02),
    fadeIn: S02_DISSOLVE,
    fadeOut: Math.max(1, sceneEnd(S02) - sceneStart(OUTRO)),
    pauseScene: S02,
    layers: [
      { file: "sfx/ep02/birds_village.wav", under: 0.1, open: 0.2, pauseOpen: { 1: 0.18, 2: 0.18, 3: 0.18, 6: 0.18, 8: 0.15 } },
      { file: "sfx/ep02/wind_soft.wav", under: 0.06, open: 0.08, pauseOpen: { 4: 0.12, 7: 0.12 } },
    ],
  },
  {
    name: "outro",
    from: sceneStart(OUTRO),
    to: EP03_TOTAL_FRAMES,
    fadeIn: 24,
    fadeOut: 36,
    layers: [
      { file: "ep02/deep/deep_padma_river_day.wav", under: 0.16, open: 0.25 },
      { file: "music/Theme_Intro_Bansuri.wav", under: 0.08, open: 0.14 },
    ],
  },
];

const openAt = (bed: Bed, layer: BedLayer, abs: number): number => {
  if (!layer.pauseOpen || !bed.pauseScene) return layer.open;
  let v = layer.open;
  for (const [k, lvl] of Object.entries(layer.pauseOpen)) {
    const w = pauseWindow(bed.pauseScene, Number(k));
    const a = sceneStart(bed.pauseScene) + w.start;
    const b = sceneStart(bed.pauseScene) + w.end;
    const d = abs < a ? a - abs : abs > b ? abs - b : 0;
    if (d < DUCK_RAMP) v = lvl + (layer.open - lvl) * ease(d / DUCK_RAMP);
  }
  return v;
};
const bedLayerVolume = (bed: Bed, layer: BedLayer) => (f: number) => {
  const abs = bed.from + f;
  const len = bed.to - bed.from;
  const edge = Math.max(0, Math.min(1, f / bed.fadeIn, (len - f) / bed.fadeOut));
  const out = layer.out ? 1 - ease((abs - layer.out.from) / layer.out.frames) : 1;
  return ducked(openAt(bed, layer, abs), layer.under, abs) * edge * out;
};

const SFX_SECONDS: Record<string, number> = {
  cloth_rustle: 1.2,
  paper_rustle: 1,
  water_splash: 1,
  chime_pop: 1.2,
  soft_magical_shimmer: 2.5,
  river_water: 4,
  girls_giggle: 1.2,
  water_pour: 2.98,
};
interface SfxSound {
  file: string;
  volume: number;
  loopFrames?: number;
  fadeIn?: number;
  fadeOut?: number;
  gate?: boolean;
  rate?: number;
}
interface SfxCue extends SfxSound {
  scene: string;
  at: number;
  cue?: string;
}

const GIGGLE = "sfx/ep03/girls_giggle";
const POUR = "sfx/ep03/water_pour";
const PICK = "paper_rustle";

const cueStory2 = (snippet: string, fallback: number): number => cueLocalStory3(snippet, S02)?.from ?? fallback;
const B2 = (() => {
  const pour = cueStory2("তুলসীতলায়", 94) + 4;
  const placeEnd = pausesFor3(S02)[1]?.atStory ?? 268;
  const pick = (k: number) => placeEnd - 3 * 32 + 32 * k + 11;
  return { pour, leaf: pour + 67, picks: [pick(0), pick(1), pick(2)], bow: cueStory2("আর নিজেই", 268) + 20, lastBow: cueStory2("গাছ কেটে", 908) + 46 };
})();

const SFX_CUES: SfxCue[] = [
  { scene: S01, cue: "শিউলি", at: 38, file: PICK, volume: 0.15 },
  { scene: S01, cue: "বাড়ির মেয়েরা", at: 18, file: "cloth_rustle", volume: 0.15 },
  { scene: S01, cue: "বাড়ির মেয়েরা", at: 52, file: PICK, volume: 0.15 },
  { scene: S01, cue: "জবা আর ঝুমকো", at: 42, file: PICK, volume: 0.15 },
  { scene: S01, cue: "জবা আর ঝুমকো", at: 56, file: PICK, volume: 0.15 },
  { scene: S02, cue: "হঠাৎ সবাই", at: 7, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, cue: "হঠাৎ সবাই", at: 30, file: "footsteps_floor", volume: 0.15, loopFrames: 80, fadeIn: 12, fadeOut: 22 },
  { scene: S02, at: B2.pour - 1, file: POUR, volume: 0.3, loopFrames: 40, fadeIn: 3, fadeOut: 12 },
  { scene: S02, at: B2.leaf - 1, file: PICK, volume: 0.15 },
  ...B2.picks.map((p): SfxCue => ({ scene: S02, at: p - 1, file: PICK, volume: 0.15 })),
  { scene: S02, at: B2.bow, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, cue: "ওমা", at: -2, file: "cloth_rustle", volume: 0.18 },
  { scene: S02, cue: "দেখিস", at: 0, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, at: B2.lastBow, file: "cloth_rustle", volume: 0.15 },
];

interface PauseCue extends SfxSound {
  scene: string;
  pause: number;
  at: number;
  fromEnd?: boolean;
}
const PAUSE_CUES: PauseCue[] = [
  { scene: S01, pause: 0, at: 0, file: "sfx/river_water", volume: 0.18, loopFrames: 60, fadeIn: 8, fadeOut: 24 },
  { scene: S02, pause: 1, at: -5, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, pause: 2, at: 2, file: "sfx/soft_magical_shimmer", volume: 0.15 },
  { scene: S02, pause: 3, at: 4, file: GIGGLE, volume: 0.65, rate: 1.06 },
  { scene: S02, pause: 3, at: 8, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, pause: 5, at: 4, file: GIGGLE, volume: 0.95 },
  { scene: S02, pause: 5, at: 11, file: GIGGLE, volume: 0.78, rate: 1.08 },
  { scene: S02, pause: 5, at: 6, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, pause: 7, at: 0, file: GIGGLE, volume: 0.58, rate: 1.04 },
];

interface PlacedSfx extends SfxSound {
  from: number;
  frames?: number;
  gateScene?: string;
}
const placeScene = (c: SfxCue): PlacedSfx | null => {
  const start = sceneStart(c.scene);
  if (c.cue !== undefined) {
    const p = phraseLocal(c.scene, c.cue);
    if (p === undefined) return null;
    return { ...c, from: start + p + c.at, frames: c.loopFrames, gateScene: c.gate ? c.scene : undefined };
  }
  const a = storyReal(c.scene, c.at);
  const frames = c.loopFrames !== undefined ? storyReal(c.scene, c.at + c.loopFrames) - a : undefined;
  return { ...c, from: start + a, frames, gateScene: c.gate ? c.scene : undefined };
};
const placePause = (c: PauseCue): PlacedSfx => {
  const w = pauseWindow(c.scene, c.pause);
  return { ...c, from: sceneStart(c.scene) + (c.fromEnd ? w.end : w.start) + c.at, frames: c.loopFrames, gateScene: c.gate ? c.scene : undefined };
};
const PLACED_SFX: PlacedSfx[] = [
  { file: "sfx/chime_pop", volume: 0.4, from: 0 },
  { file: "sfx/soft_magical_shimmer", volume: 0.4, from: sceneStart(OUTRO) },
  ...SFX_CUES.map(placeScene).filter((c): c is PlacedSfx => c !== null),
  ...PAUSE_CUES.map(placePause),
].filter((c) => c.frames === undefined || c.frames > 0);
const sfxSrc = (file: string) => staticFile(file.includes("/") ? `audio/${file}.wav` : `audio/sfx/ep02/${file}.wav`);
const sfxSeconds = (file: string) => SFX_SECONDS[file.split("/").pop() ?? file] ?? 2;

const loopVolume = (vol: number, frames: number, fadeIn?: number, fadeOut?: number) => (f: number) => {
  const def = Math.max(1, Math.min(8, Math.floor(frames / 4)));
  const fi = Math.max(1, fadeIn ?? def);
  const fo = Math.max(1, fadeOut ?? def);
  return vol * Math.max(0, Math.min(1, f / fi, (frames - f) / fo));
};
const cueVolume = (c: PlacedSfx) => {
  const base = c.frames !== undefined ? loopVolume(c.volume, c.frames, c.fadeIn, c.fadeOut) : () => c.volume;
  const gs = c.gateScene;
  return gs ? (f: number) => base(f) * storyRunning(gs, c.from + f) : base;
};

interface MusicFile {
  lufs: number;
  seconds: number;
  loop: boolean;
}
const MUSIC_LIB: Record<string, MusicFile> = {
  "music/Village_Peace_Loop": { lufs: -8.5, seconds: 15.2, loop: true },
  "music/Warm_Family_Flute": { lufs: -8.1, seconds: 13.2, loop: true },
  "music/Divine_Motif": { lufs: -15.0, seconds: 36, loop: false },
  "music/ep05/tanpura_drone": { lufs: -24.0, seconds: 33.714, loop: true },
  "music/ep05/tanpura_drone_low": { lufs: -28.0, seconds: 33.714, loop: true },
  "music/ep05/tanpura_drone_cs": { lufs: -24.0, seconds: 31.825, loop: true },
  "music/ep05/play_plucks": { lufs: -24.0, seconds: 8.211, loop: true },
  "music/ep05/tabla_soft": { lufs: -24.0, seconds: 9.87, loop: true },
  "music/ep05/cheeky_pluck_1": { lufs: -20.0, seconds: 2.511, loop: false },
  "music/ep05/cheeky_pluck_3": { lufs: -20.0, seconds: 1.382, loop: false },
  "music/ep05/bansuri_compassion": { lufs: -20.0, seconds: 9.529, loop: false },
};
const MUSIC_LOOP_MAX = 0.25;
const MUSIC_HIT_MAX = 0.45;

interface MusicCue {
  beat: string;
  file: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  under: number;
  open: number;
  pause?: { scene: string; index: number; lufs: number }[];
  shape?: [number, number][];
  hit?: boolean;
}

const lufsToVol = (target: number, file: string) => Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -12)) / 20);
const dbGain = (db: number) => Math.pow(10, db / 20);
const musicSeconds = (file: string) => MUSIC_LIB[file]?.seconds ?? 2;

const phraseAbs = (scene: string, snippet: string, fallbackLocal: number) => sceneStart(scene) + (phraseLocal(scene, snippet) ?? fallbackLocal);
const pauseAbs = (scene: string, index: number) => {
  const w = pauseWindow(scene, index);
  return { start: sceneStart(scene) + w.start, end: sceneStart(scene) + w.end };
};
const A01 = { start: sceneStart(S01), end: sceneStart(S02) + S02_DISSOLVE };
const A02 = {
  start: sceneStart(S02),
  pour: sceneStart(S02) + storyReal(S02, B2.pour),
  ownFeetP: pauseAbs(S02, 1),
  aarNijei: phraseAbs(S02, "আর নিজেই", 316),
  pranamP: pauseAbs(S02, 2),
  oma: phraseAbs(S02, "ওমা", 429),
  omaP: pauseAbs(S02, 3),
  tui: phraseAbs(S02, "তুই ঠাকুরের", 500),
  heldP: pauseAbs(S02, 5),
  balak: clipSpan3("02c_Toddler_Thakur.wav")?.startFrame ?? sceneStart(S02) + 789,
  amarPaye: phraseAbs(S02, "আমার পায়ে", 848),
  murtiP: pauseAbs(S02, 7),
  gachVoice: MOTIF_IN + 17,
  endP: pauseAbs(S02, 8),
};
const OMA_CUT = A02.oma - 1;
const MOTIF_AT = A02.gachVoice - 6;
const BANSURI_FRAMES = Math.floor(musicSeconds("music/ep05/bansuri_compassion") * 24);
const BANSURI_AT = Math.max(A02.amarPaye + 16, A02.murtiP.start + 18 - BANSURI_FRAMES);
const DRONE = { under: -44, open: -37 };

const MUSIC_CUES: MusicCue[] = [
  { beat: "M1", file: "music/Village_Peace_Loop", from: A01.start, to: A01.end, fadeIn: 24, fadeOut: S02_DISSOLVE, under: -37, open: -31, pause: [{ scene: S01, index: 2, lufs: -30 }] },
  { beat: "M1-M4", file: "music/ep05/tanpura_drone", from: A01.start, to: A02.tui + 18, fadeIn: 30, fadeOut: 30, ...DRONE, pause: [{ scene: S02, index: 2, lufs: -36 }] },
  {
    beat: "M2",
    file: "music/Warm_Family_Flute",
    from: A02.start,
    to: A02.oma - 6,
    fadeIn: S02_DISSOLVE,
    fadeOut: 30,
    under: -38,
    open: -31,
    pause: [{ scene: S02, index: 2, lufs: -30 }],
    shape: [[A02.pour - 10, 0], [A02.pour + 12, -5], [A02.aarNijei, -5], [A02.aarNijei + 24, 0]],
  },
  { beat: "M3", file: "music/ep05/play_plucks", from: A02.pour - 6, to: A02.aarNijei + 10, fadeIn: 18, fadeOut: 16, under: -41, open: -37, pause: [{ scene: S02, index: 1, lufs: -36 }] },
  { beat: "M5", file: "music/ep05/cheeky_pluck_1", from: OMA_CUT, to: A02.omaP.start + 4, fadeIn: 1, fadeOut: 10, under: -38, open: -38, hit: true },
  { beat: "M5", file: "music/ep05/cheeky_pluck_3", from: A02.omaP.start - 2, to: A02.tui + 6, fadeIn: 1, fadeOut: 8, under: -37, open: -37, hit: true },
  { beat: "M6", file: "music/ep05/tanpura_drone_low", from: A02.tui - 12, to: A02.balak + 18, fadeIn: 30, fadeOut: 30, under: -44, open: -41, pause: [{ scene: S02, index: 5, lufs: -40 }] },
  { beat: "M6", file: "music/ep05/tabla_soft", from: A02.tui - 4, to: A02.heldP.start + 8, fadeIn: 30, fadeOut: 12, under: -43, open: -39, pause: [{ scene: S02, index: 4, lufs: -38 }] },
  { beat: "M7", file: "music/ep05/tanpura_drone", from: A02.balak - 12, to: MOTIF_AT, fadeIn: 36, fadeOut: 24, ...DRONE, pause: [{ scene: S02, index: 6, lufs: -36 }, { scene: S02, index: 7, lufs: -36 }] },
  { beat: "M7", file: "music/ep05/bansuri_compassion", from: BANSURI_AT, to: BANSURI_AT + BANSURI_FRAMES, fadeIn: 30, fadeOut: 20, under: -40, open: -34, pause: [{ scene: S02, index: 6, lufs: -33 }, { scene: S02, index: 7, lufs: -33 }] },
  { beat: "M8", file: "music/Divine_Motif", from: MOTIF_AT, to: A02.endP.end + 24, fadeIn: 36, fadeOut: 30, under: -36, open: -30, pause: [{ scene: S02, index: 8, lufs: -30 }] },
  { beat: "M8", file: "music/ep05/tanpura_drone_cs", from: MOTIF_AT, to: A02.endP.end + 24, fadeIn: 36, fadeOut: 30, ...DRONE, pause: [{ scene: S02, index: 8, lufs: -36 }] },
];

const MUSIC_PLACED = MUSIC_CUES.filter((c) => MUSIC_LIB[c.file] !== undefined && c.to > c.from);

const cueOpenLufs = (c: MusicCue, abs: number): number => {
  let v = c.open;
  for (const p of c.pause ?? []) {
    const { start: a, end: b } = pauseAbs(p.scene, p.index);
    const d = abs < a ? a - abs : abs > b ? abs - b : 0;
    if (d < DUCK_RAMP) v = p.lufs + (c.open - p.lufs) * ease(d / DUCK_RAMP);
  }
  return v;
};
const shapeDb = (shape: [number, number][] | undefined, abs: number): number => {
  if (!shape || shape.length === 0) return 0;
  if (abs <= shape[0][0]) return shape[0][1];
  for (let i = 1; i < shape.length; i++) {
    const [x1, y1] = shape[i];
    const [x0, y0] = shape[i - 1];
    if (abs <= x1) return y0 + ((y1 - y0) * (abs - x0)) / Math.max(1, x1 - x0);
  }
  return shape[shape.length - 1][1];
};
const cueFrames = (c: MusicCue): number => {
  const lib = MUSIC_LIB[c.file];
  const win = c.to - c.from;
  return lib && !lib.loop ? Math.max(1, Math.min(win, Math.floor(lib.seconds * 24))) : win;
};
const musicVolume = (c: MusicCue) => {
  const len = cueFrames(c);
  return (f: number) => {
    const abs = c.from + f;
    const edge = ease(Math.min(f / Math.max(1, c.fadeIn), (len - f) / Math.max(1, c.fadeOut)));
    const shape = dbGain(shapeDb(c.shape, abs));
    if (c.hit) return Math.min(MUSIC_HIT_MAX, lufsToVol(c.open, c.file)) * edge * shape;
    const open = Math.min(MUSIC_LOOP_MAX, lufsToVol(cueOpenLufs(c, abs), c.file));
    const under = Math.min(open, lufsToVol(c.under, c.file));
    return ducked(open, under, abs) * edge * shape;
  };
};

export const Episode03Ghibli: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
    {EP03_SCENES.map((scene, i) => {
      const SceneComponent = SCENE_COMPONENTS[scene.sceneId];
      const next = EP03_SCENES[i + 1];
      const gap = next ? Math.max(0, next.startFrame - (scene.startFrame + scene.durationFrames)) : 0;
      const tail = Math.max(SCENE_TAIL[scene.sceneId] ?? 0, gap);
      const dissolveIn = SCENE_DISSOLVE_IN[scene.sceneId];
      return (
        <Sequence key={scene.sceneId} from={scene.startFrame} durationInFrames={scene.durationFrames + tail}>
          {dissolveIn ? (
            <DissolveIn frames={dissolveIn}>
              <SceneComponent />
            </DissolveIn>
          ) : (
            <SceneComponent />
          )}
        </Sequence>
      );
    })}
    {/* Phase 5 (Item 20): Hand-painted watercolor wash dissolve between Sharad Dawn (S01) and Vedic Courtyard (S02) */}
    <Sequence from={Math.max(0, sceneStart(S02) - 8)} durationInFrames={28}>
      <GhibliWashTransition durationFrames={28} />
    </Sequence>
    {BEDS.map((bed) =>
      bed.layers.map((layer) => (
        <Sequence key={`bed-${bed.name}-${layer.file}`} from={bed.from} durationInFrames={bed.to - bed.from} layout="none">
          <Audio src={staticFile(`audio/${layer.file}`)} loop volume={bedLayerVolume(bed, layer)} />
        </Sequence>
      )),
    )}
    {MUSIC_PLACED.map((c, k) => (
      <Sequence key={`music-${k}-${c.beat}-${c.file}`} from={c.from} durationInFrames={cueFrames(c)} layout="none">
        <Audio src={staticFile(`audio/${c.file}.wav`)} loop={MUSIC_LIB[c.file].loop && !c.hit} volume={musicVolume(c)} />
      </Sequence>
    ))}
    {PLACED_SFX.map((c, k) => (
      <Sequence key={`sfx-${k}-${c.file}-${c.from}`} from={c.from} durationInFrames={c.frames ?? Math.ceil((sfxSeconds(c.file) * 24) / (c.rate ?? 1))} layout="none">
        <Audio src={sfxSrc(c.file)} loop={c.frames !== undefined} volume={cueVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
    {EP03_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep03/${a.file}`)} volume={1} />
      </Sequence>
    ))}
    <SeriesSubtitles cues={EP03_CUES.filter((c) => c.from >= EP03_SCENES[1].startFrame)} />
  </div>
);
