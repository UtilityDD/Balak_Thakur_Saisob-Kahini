import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SeriesSubtitles } from "../../episode/SeriesSubtitles";
import { pausesFor5, storyToReal } from "../../episode/storyClock";
import { EP05_AUDIO, EP05_BREAKS, EP05_GAPS, EP05_SCENES, EP05_TOTAL_FRAMES, type Ep05Break } from "../../episode05/timing";
import { EP05_CUES } from "../../episode05/subtitles";
import * as S01Module from "../../episode05/scenes/Scene01TortoisePlay";
import * as S02Module from "../../episode05/scenes/Scene02BananaGroveCowRescue";
import { GhibliWashTransition } from "../core/GhibliWashTransition";
import { GhibliScene00Intro } from "../episode03/scenes/GhibliScene00Intro";
import { GhibliScene00bSource } from "../episode03/scenes/GhibliScene00bSource";
import { GhibliScene01TortoisePlay } from "./scenes/GhibliScene01TortoisePlay";
import { GhibliScene02BananaGroveCowRescue } from "./scenes/GhibliScene02BananaGroveCowRescue";
import { GhibliScene99OutroEp05 } from "./scenes/GhibliScene99Outro";

/**
 * Separate Studio Ghibli Watercolor + Sepia-Ink Composition for Episode 5
 * ("পর্ব পাঁচ — কচ্ছপ খেলা ও গাভী রক্ষা", 2,849 frames @ 24 fps, 1920x1080).
 *
 * Preserves 100% of Episode 5's approved timing, pauses, action gaps, chapter break,
 * voice narration, SFX, Indian classical music cue sheet (M1..M16), and subtitles unchanged,
 * while routing all scenes through the hand-drawn Ghibli watercolor + sepia-ink set pipeline.
 */

const BREAKS = EP05_BREAKS;

const sceneById = (id: string) => {
  const s = EP05_SCENES.find((x) => x.sceneId === id);
  if (!s) throw new Error(`Episode05Ghibli: unknown scene ${id}`);
  return s;
};
const sceneStart = (id: string): number => sceneById(id).startFrame;
const sceneEnd = (id: string) => {
  const s = sceneById(id);
  return s.startFrame + s.durationFrames;
};

const SOURCE = "00b_source_attribution";
const S01 = "01_tortoise_play";
const S02 = "02_banana_grove_cow_rescue";
const OUTRO = "99_closing_sequential_outro";

const storyReal = (sceneId: string, story: number): number => storyToReal(story, pausesFor5(sceneId));

const pauseWindow = (sceneId: string, index: number): { start: number; end: number; frames: number } | undefined => {
  const p = pausesFor5(sceneId)[index];
  if (!p) return undefined;
  const start = p.startFrame - sceneStart(sceneId);
  return { start, end: start + p.frames, frames: p.frames };
};

const breakAfter = (sceneId: string): Ep05Break | undefined => BREAKS.find((b) => b.after === sceneId);

const phraseLocal = (sceneId: string, snippet: string): number | undefined => {
  const i = EP05_SCENES.findIndex((s) => s.sceneId === sceneId);
  const s = EP05_SCENES[i];
  const next = EP05_SCENES[i + 1];
  if (!s) return undefined;
  const end = Math.min(s.startFrame + s.durationFrames, next ? next.startFrame : Infinity);
  const c = EP05_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  return c ? c.from - s.startFrame : undefined;
};

const GATE_RAMP = 5;
const storyRunning = (sceneId: string, absFrame: number): number => {
  let g = 1;
  for (const p of pausesFor5(sceneId)) {
    const a = p.startFrame;
    const b = p.startFrame + p.frames;
    const d = absFrame < a ? a - absFrame : absFrame > b ? absFrame - b : 0;
    g = Math.min(g, Math.min(1, d / GATE_RAMP));
  }
  return g;
};

const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

const S01_FADE_IN = 14;
const SOURCE_CARD_END = sceneStart(S01) + S01_FADE_IN;
const GhibliEp05Intro: React.FC = () => (
  <GhibliScene00Intro episodeLabel="পর্ব পাঁচ" episodeName="কচ্ছপ খেলা ও গাভী রক্ষা" />
);
const GhibliSourceAttributionScene: React.FC = () => (
  <GhibliScene00bSource frames={SOURCE_CARD_END - sceneStart(SOURCE)} />
);

const CB_FADE_OUT = 18;
const CB_FADE_IN = 30;
const CB_CHIME_AT = 6;
const SERIES_FADE_OUT = 20;

const SCENE_FADE: Record<string, { in?: number; out?: number; fadeToSceneEnd?: boolean }> = {
  [S01]: { out: CB_FADE_OUT },
  [S02]: { in: CB_FADE_IN, out: SERIES_FADE_OUT, fadeToSceneEnd: true },
};
const S02_OUTRO_OVERLAP = Math.max(1, sceneEnd(S02) - sceneStart(OUTRO));

const BlackFade: React.FC<{ fadeIn?: number; fadeOut?: number; outEnd: number; children: React.ReactNode }> = ({ fadeIn, fadeOut, outEnd, children }) => {
  const f = useCurrentFrame();
  let v = 1;
  if (fadeIn) v = Math.min(v, ease(f / fadeIn));
  if (fadeOut) v = Math.min(v, ease((outEnd - f) / fadeOut));
  return (
    <AbsoluteFill>
      {children}
      {v < 1 && <AbsoluteFill style={{ background: "#000", opacity: 1 - v }} />}
    </AbsoluteFill>
  );
};

const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const opacity = ease(f / frames);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

const SCENE_DISSOLVE_IN: Record<string, number> = { [S01]: S01_FADE_IN, [OUTRO]: S02_OUTRO_OVERLAP };
const SCENE_TAIL: Record<string, number> = {
  [SOURCE]: SOURCE_CARD_END - sceneEnd(SOURCE),
};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  "00_intro": GhibliEp05Intro,
  [SOURCE]: GhibliSourceAttributionScene,
  [S01]: GhibliScene01TortoisePlay,
  [S02]: GhibliScene02BananaGroveCowRescue,
  [OUTRO]: GhibliScene99OutroEp05,
};

const DUCK_RAMP = 10;
const DUCK_MERGE = 20;
const OPEN_CAP = 0.25;
const SPEECH: [number, number][] = (() => {
  const spans = EP05_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < DUCK_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();
const speechAmount = (frame: number, ramp = DUCK_RAMP): number => {
  let amt = 0;
  for (const [a, b] of SPEECH) {
    if (frame < a - ramp) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - ramp)) / ramp;
    else if (frame <= b + ramp) t = 1 - (frame - b) / ramp;
    amt = Math.max(amt, ease(t));
  }
  return amt;
};
const ducked = (open: number, under: number, frame: number, ramp = DUCK_RAMP) => {
  const o = Math.min(OPEN_CAP, open);
  return o + (Math.min(o, under) - o) * speechAmount(frame, ramp);
};

interface BedLayer {
  file: string;
  under: number;
  open: number;
  pauseOpen?: Record<number, number>;
  inFrom?: { from: number; frames: number };
  outAt?: { from: number; frames: number };
  gate?: (abs: number) => number;
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

const BED_TAIL = 6;
const bedEnd = (sceneId: string): number => {
  const b = breakAfter(sceneId);
  if (b) return b.startFrame + BED_TAIL;
  if (SCENE_FADE[sceneId]?.fadeToSceneEnd) return sceneEnd(sceneId) + BED_TAIL;
  const i = EP05_SCENES.findIndex((s) => s.sceneId === sceneId);
  const next = EP05_SCENES[i + 1];
  return Math.min(sceneEnd(sceneId), next ? next.startFrame : Infinity) + BED_TAIL;
};

const sceneTime = (mod: unknown, obj: string, key: string): number | undefined => {
  const o = (mod as Record<string, unknown>)[obj];
  const v = o && typeof o === "object" ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
};

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
    name: "01 compound",
    from: sceneStart(S01),
    to: bedEnd(S01),
    fadeIn: 24,
    fadeOut: CB_FADE_OUT + BED_TAIL,
    pauseScene: S01,
    layers: [{ file: "sfx/ep02/birds_village.wav", under: 0.1, open: 0.2, pauseOpen: { 1: 0.12 } }],
  },
  {
    name: "02 grove",
    from: sceneStart(S02),
    to: bedEnd(S02),
    fadeIn: CB_FADE_IN,
    fadeOut: SERIES_FADE_OUT + BED_TAIL,
    pauseScene: S02,
    layers: [
      { file: "sfx/ep02/birds_village.wav", under: 0.08, open: 0.18, pauseOpen: { 1: 0.15 } },
      { file: "sfx/ep02/wind_soft.wav", under: 0.08, open: 0.12 },
      { file: "sfx/ep05/banana_leaves.wav", under: 0.06, open: 0.1 },
    ],
  },
  {
    name: "outro",
    from: sceneStart(OUTRO),
    to: EP05_TOTAL_FRAMES,
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
    if (!w) continue;
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
  const late = layer.inFrom ? ease((abs - layer.inFrom.from) / layer.inFrom.frames) : 1;
  const early = layer.outAt ? 1 - ease((abs - layer.outAt.from) / layer.outAt.frames) : 1;
  const gate = layer.gate ? layer.gate(abs) : 1;
  return ducked(openAt(bed, layer, abs), layer.under, abs) * edge * late * early * gate;
};

const SFX_SECONDS: Record<string, number> = {
  cloth_rustle: 1.2, clay_thud: 1.5, sand_pat: 3, footsteps_floor: 3, footsteps_mud: 3, cow_moo: 2.5, cow_bell: 2,
  hooves_soft: 4, whoosh_soft: 1.2, scuffle: 1.8, door_creak: 1.8, birds_village: 6, wind_soft: 6,
  chime_pop: 1.2, soft_magical_shimmer: 2.5, temple_bell_drop: 2.2, river_water: 4,
  shell_scrape: 1.45, vine_tear: 1.8, cow_munch: 3.2, bamboo_thump: 0.4, cow_breath: 1.2, banana_leaves: 15,
};
const SFX_FOLDER: Record<string, string> = {
  shell_scrape: "sfx/ep05", vine_tear: "sfx/ep05", cow_munch: "sfx/ep05", bamboo_thump: "sfx/ep05", cow_breath: "sfx/ep05",
  banana_leaves: "sfx/ep05", chime_pop: "sfx", soft_magical_shimmer: "sfx", temple_bell_drop: "sfx", river_water: "sfx",
};
const SFX_MAX: Record<string, number> = { cow_munch: 0.12 };
const ONE_SHOT_MAX = 0.45;
const LOOP_MAX = 0.25;

const normSfx = (file: string): string => {
  let p = file.replace(/\\/g, "/").replace(/^\/?(public\/)?audio\//, "").replace(/\.wav$/i, "");
  if (/^ep0\d\//.test(p) && !p.startsWith("ep02/deep")) p = `sfx/${p}`;
  if (!p.includes("/")) p = `${SFX_FOLDER[p] ?? "sfx/ep02"}/${p}`;
  return p;
};
const sfxName = (file: string) => file.split("/").pop() ?? file;
const sfxSrc = (file: string) => staticFile(`audio/${file}.wav`);
const sfxSeconds = (file: string) => SFX_SECONDS[sfxName(file)] ?? 2;

interface SfxSound {
  file: string;
  volume: number;
  loopFrames?: number;
  fadeIn?: number;
  fadeOut?: number;
  gate?: boolean;
  rate?: number;
}
interface SceneEvent {
  id?: string;
  f: number;
  file: string;
  volume: number;
  real?: boolean;
  clock?: string;
  loopFrames?: number;
  frames?: number;
  dur?: number;
  fadeIn?: number;
  fadeOut?: number;
  rate?: number;
  gate?: boolean;
}
const asEvent = (e: unknown): SceneEvent | null => {
  if (!e || typeof e !== "object") return null;
  const o = e as Record<string, unknown>;
  const f = [o.f, o.at, o.frame].find((v) => typeof v === "number") as number | undefined;
  const file = [o.file, o.src].find((v) => typeof v === "string") as string | undefined;
  const volume = [o.volume, o.vol].find((v) => typeof v === "number") as number | undefined;
  if (f === undefined || file === undefined || volume === undefined) return null;
  return { ...(o as Partial<SceneEvent>), f, file, volume };
};
const readEvents = (mod: unknown, name: string): SceneEvent[] => {
  const v = (mod as Record<string, unknown>)[name];
  if (v === undefined || v === null) return [];
  const out: SceneEvent[] = [];
  const visit = (x: unknown, key?: string) => {
    if (Array.isArray(x)) {
      x.forEach((y) => visit(y));
      return;
    }
    const ev = asEvent(x);
    if (ev) out.push(key && !ev.id ? { ...ev, id: key } : ev);
    else if (x && typeof x === "object") Object.entries(x as Record<string, unknown>).forEach(([k, y]) => visit(y, k));
  };
  visit(v);
  return out;
};
const S01_EVENTS = readEvents(S01Module, "S01_EVENTS");
const S02_EVENTS = readEvents(S02Module, "S02_EVENTS");

interface PlacedSfx extends SfxSound { from: number; frames?: number; gateScene?: string }
const SCENE_EVENT_CLOCK: Record<string, "real" | "story"> = { [S01]: "real", [S02]: "real" };
const CUT_FADE = 12;
const LOOP_FILES = new Set(["banana_leaves", "birds_village", "wind_soft"]);
const placeEvent = (scene: string, e: SceneEvent): PlacedSfx => {
  const file = normSfx(e.file);
  const loop = e.loopFrames ?? e.frames ?? e.dur;
  const isLoop = loop !== undefined && loop > 0;
  const cap = Math.min(SFX_MAX[sfxName(file)] ?? 1, isLoop ? LOOP_MAX : ONE_SHOT_MAX);
  const clock = e.real === true ? "real" : e.clock === "real" || e.clock === "story" ? e.clock : SCENE_EVENT_CLOCK[scene] ?? "story";
  const real = clock === "real";
  const start = sceneStart(scene);
  const a = real ? e.f : storyReal(scene, e.f);
  let frames = isLoop ? (real ? (loop as number) : storyReal(scene, e.f + (loop as number)) - a) : undefined;
  let fadeIn = e.fadeIn;
  let fadeOut = e.fadeOut;
  const until = bedEnd(scene) - (start + a);
  const natural = frames ?? Math.ceil((sfxSeconds(file) * 24) / (e.rate ?? 1));
  if (natural > until) {
    if (frames === undefined) fadeIn = fadeIn ?? (LOOP_FILES.has(sfxName(file)) ? CUT_FADE : 1);
    frames = Math.max(0, until);
    fadeOut = Math.min(CUT_FADE, Math.max(1, Math.floor(frames / 2)));
  }
  return {
    file,
    volume: Math.min(cap, e.volume),
    fadeIn,
    fadeOut,
    rate: e.rate,
    from: start + a,
    frames,
    loopFrames: frames,
    gateScene: e.gate ? scene : undefined,
  };
};

const BREAK_CHIMES: PlacedSfx[] = BREAKS.map((b) => ({ file: "sfx/chime_pop", volume: 0.18, from: b.startFrame + CB_CHIME_AT }));
const PLACED_SFX: PlacedSfx[] = [
  { file: "sfx/chime_pop", volume: 0.4, from: 0 },
  { file: "sfx/soft_magical_shimmer", volume: 0.4, from: sceneStart(OUTRO) },
  ...BREAK_CHIMES,
  ...S01_EVENTS.map((e) => placeEvent(S01, e)),
  ...S02_EVENTS.map((e) => placeEvent(S02, e)),
].filter((c) => c.from >= 0 && c.from < EP05_TOTAL_FRAMES && (c.frames === undefined || c.frames > 0));

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
  "music/ep05/drum_pulse": { lufs: -24.0, seconds: 6.0, loop: true },
  "music/ep05/drum_pulse_fast": { lufs: -24.0, seconds: 4.0, loop: true },
  "music/ep05/drum_pulse_hot": { lufs: -17.0, seconds: 6.0, loop: true },
  "music/ep05/drum_pulse_fast_hot": { lufs: -17.0, seconds: 4.0, loop: true },
  "music/ep05/tanpura_drone_low_hot": { lufs: -21.0, seconds: 33.714, loop: true },
  "music/ep05/tension_rise": { lufs: -20.0, seconds: 1.3, loop: false },
  "music/ep05/drum_hit_low": { lufs: -20.0, seconds: 2.6, loop: false },
  "music/ep05/tabla_run": { lufs: -20.1, seconds: 2.694, loop: false },
  "music/ep05/cheeky_pluck_1": { lufs: -20.0, seconds: 2.511, loop: false },
  "music/ep05/cheeky_pluck_2": { lufs: -20.0, seconds: 2.405, loop: false },
  "music/ep05/cheeky_pluck_3": { lufs: -20.0, seconds: 1.382, loop: false },
  "music/ep05/bansuri_relief": { lufs: -20.0, seconds: 12.311, loop: false },
  "music/ep05/bansuri_compassion": { lufs: -20.0, seconds: 9.529, loop: false },
};

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
  duckRamp?: number;
  rate?: number;
}

const lufsToVol = (target: number, file: string) => Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -12)) / 20);
const dbGain = (db: number) => Math.pow(10, db / 20);

const at01 = (key: string, fallback: number) => sceneStart(S01) + (sceneTime(S01Module, "S01_TIMES", key) ?? fallback);
const at02 = (key: string, fallback: number) => sceneStart(S02) + (sceneTime(S02Module, "S02_TIMES", key) ?? fallback);
const phraseAbs = (scene: string, snippet: string, fallbackLocal: number) => sceneStart(scene) + (phraseLocal(scene, snippet) ?? fallbackLocal);
const eventAbs = (scene: string, events: SceneEvent[], id: string, fallbackLocal: number, end = false): number => {
  const e = events.find((x) => x.id === id);
  if (!e) return sceneStart(scene) + fallbackLocal;
  const real = (SCENE_EVENT_CLOCK[scene] ?? "story") === "real";
  const a = real ? e.f : storyReal(scene, e.f);
  return sceneStart(scene) + a + (end ? e.loopFrames ?? e.frames ?? 0 : 0);
};
const gapStart = (scene: string, kind: "open" | "after" | "end", fallback: number) =>
  EP05_GAPS.find((g) => g.sceneId === scene && g.kind === kind)?.startFrame ?? fallback;
const pauseStartAbs = (scene: string, index: number, fallback: number) => {
  const w = pauseWindow(scene, index);
  return w ? sceneStart(scene) + w.start : fallback;
};

const A01 = {
  start: sceneStart(S01),
  playLine: phraseAbs(S01, "ছোট্ট বীরু", 74),
  hathat: phraseAbs(S01, "হঠাৎ", 191),
  strike: at01("strike", 195),
  bite: eventAbs(S01, S01_EVENTS, "bite", 198),
  sabai: phraseAbs(S01, "সবাই", 301),
  kneel: at01("kneel", 364),
  dag: at01("dag", 426),
  end: bedEnd(S01),
};
const TENSION_RISE_FRAMES = Math.round(1.3 * 24);
const REACH = Math.min(A01.hathat - 24, A01.bite - TENSION_RISE_FRAMES);
const A02 = {
  start: sceneStart(S02),
  vine: [1, 2, 3].map((i) => eventAbs(S02, S02_EVENTS, `vine_tear_${i}`, 185 + 16 * i)),
  burst: at02("haricharanBurst", 260),
  doorBang: eventAbs(S02, S02_EVENTS, "door_bang", 260),
  hide: eventAbs(S02, S02_EVENTS, "cow_trot", 366, true),
  ag1: gapStart(S02, "after", sceneStart(S02) + 334),
  eiBiru: phraseAbs(S02, "এই বীরু", 407),
  okiAr: phraseAbs(S02, "ও কি আর", 720),
  ag2: gapStart(S02, "end", sceneStart(S02) + 863),
  stomp: eventAbs(S02, S02_EVENTS, "hc_stomp", 864),
  p3: pauseStartAbs(S02, 2, sceneStart(S02) + 923),
  motifEnd: sceneEnd(S02) + 30,
};

const DRONE = { under: -44, open: -37 };

const MUSIC_CUES: MusicCue[] = [
  { beat: "M1", file: "music/Village_Peace_Loop", from: A01.start, to: REACH + 12, fadeIn: 24, fadeOut: 18, under: -38, open: -31,
    shape: [[A01.playLine - 6, 0], [A01.playLine + 12, -5]] },
  { beat: "M1", file: "music/ep05/tanpura_drone", from: A01.start, to: REACH + 12, fadeIn: 30, fadeOut: 18, ...DRONE },
  { beat: "M2", file: "music/ep05/play_plucks", from: A01.playLine - 6, to: REACH + 10, fadeIn: 18, fadeOut: 14, under: -40, open: -37,
    pause: [{ scene: S01, index: 0, lufs: -36 }] },
  { beat: "M2", file: "music/ep05/tabla_soft", from: A01.playLine, to: REACH + 10, fadeIn: 18, fadeOut: 14, under: -43, open: -39,
    pause: [{ scene: S01, index: 0, lufs: -38 }] },
  { beat: "M3a", file: "music/ep05/tension_rise", from: A01.bite - TENSION_RISE_FRAMES, to: A01.bite + 3, fadeIn: 2, fadeOut: 3, under: -31, open: -31, hit: true },
  { beat: "M3", file: "music/ep05/drum_hit_low", from: A01.bite - 1, to: A01.bite + 48, fadeIn: 1, fadeOut: 8, under: -27, open: -27, hit: true },
  { beat: "M3-M5", file: "music/ep05/tanpura_drone_low_hot", from: A01.strike, to: A01.kneel + 4, fadeIn: 14, fadeOut: 4, under: -40, open: -34,
    pause: [{ scene: S01, index: 1, lufs: -33 }], duckRamp: 4 },
  { beat: "M4", file: "music/ep05/drum_pulse_hot", from: A01.strike + 12, to: A01.sabai + 4, fadeIn: 16, fadeOut: 10, under: -37, open: -32,
    pause: [{ scene: S01, index: 1, lufs: -31 }], duckRamp: 4 },
  { beat: "M5", file: "music/ep05/drum_pulse_fast_hot", from: A01.sabai - 6, to: A01.kneel + 4, fadeIn: 8, fadeOut: 4, under: -36, open: -31,
    shape: [[A01.sabai - 6, -3], [A01.kneel, 0]] },
  { beat: "M5", file: "music/ep05/tabla_run", from: Math.max(A01.sabai, A01.kneel + 2 - Math.round(2.694 * 24)), to: A01.kneel + 4, fadeIn: 3, fadeOut: 4, under: -34, open: -34, hit: true,
    shape: [[A01.sabai, -3], [A01.kneel, 0]] },
  { beat: "M6-M7", file: "music/ep05/bansuri_relief", from: A01.dag - 10, to: A01.end, fadeIn: 20, fadeOut: CB_FADE_OUT + BED_TAIL, under: -37, open: -32,
    pause: [{ scene: S01, index: 2, lufs: -32 }] },
  { beat: "M7", file: "music/ep05/tanpura_drone", from: A01.dag, to: A01.end, fadeIn: 30, fadeOut: CB_FADE_OUT + BED_TAIL, ...DRONE },

  { beat: "M8", file: "music/Warm_Family_Flute", from: A02.start, to: A02.burst + 24, fadeIn: CB_FADE_IN, fadeOut: 30, under: -38, open: -31 },
  { beat: "M8", file: "music/ep05/tanpura_drone", from: A02.start, to: A02.burst + 14, fadeIn: CB_FADE_IN, fadeOut: 20, ...DRONE },
  ...A02.vine.map((v, i): MusicCue => ({
    beat: "M9", file: `music/ep05/cheeky_pluck_${i + 1}`, from: v - 1, to: A02.burst + 2,
    fadeIn: 1, fadeOut: 6, under: -36, open: -36, hit: true,
  })),
  { beat: "M10", file: "music/ep05/drum_hit_low", from: A02.doorBang - 1, to: A02.doorBang + 48, fadeIn: 1, fadeOut: 8, under: -30, open: -30, hit: true },
  { beat: "M10", file: "music/ep05/drum_pulse_fast", from: A02.doorBang + 2, to: A02.ag1 + 6, fadeIn: 6, fadeOut: 12, under: -40, open: -37 },
  { beat: "M11", file: "music/ep05/drum_pulse", from: A02.ag1 - 6, to: A02.hide + 4, fadeIn: 12, fadeOut: 24, under: -40, open: -37,
    shape: [[A02.ag1 + 6, 0], [A02.ag1 + 22, -5]] },
  { beat: "M12-M13", file: "music/ep05/tanpura_drone_low_hot", from: A02.eiBiru - 6, to: A02.okiAr + 30, fadeIn: 18, fadeOut: 36, under: -41, open: -36,
    pause: [{ scene: S02, index: 1, lufs: -33 }] },
  { beat: "M14", file: "music/ep05/bansuri_compassion", from: A02.okiAr - 8, to: A02.ag2 + 8, fadeIn: 30, fadeOut: 14, under: -40, open: -34 },
  { beat: "M15", file: "music/ep05/drum_hit_low", from: A02.stomp + 8, to: A02.stomp + 56, fadeIn: 1, fadeOut: 10, under: -32, open: -32, hit: true, rate: 0.8 },
  { beat: "M16", file: "music/Divine_Motif", from: A02.p3 - 6, to: A02.motifEnd, fadeIn: 24, fadeOut: 42, under: -38, open: -30 },
  { beat: "M16", file: "music/ep05/tanpura_drone_cs", from: A02.p3 - 6, to: A02.motifEnd, fadeIn: 24, fadeOut: 42, ...DRONE },
];

const MUSIC_PLACED = MUSIC_CUES.filter((c) => MUSIC_LIB[c.file] !== undefined && c.to > c.from);

const cueOpenLufs = (c: MusicCue, abs: number): number => {
  let v = c.open;
  for (const p of c.pause ?? []) {
    const w = pauseWindow(p.scene, p.index);
    if (!w) continue;
    const a = sceneStart(p.scene) + w.start;
    const b = sceneStart(p.scene) + w.end;
    const d = abs < a ? a - abs : abs > b ? abs - b : 0;
    const r = c.duckRamp ?? DUCK_RAMP;
    if (d < r) v = p.lufs + (c.open - p.lufs) * ease(d / r);
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
  return lib && !lib.loop ? Math.max(1, Math.min(win, Math.floor((lib.seconds * 24) / (c.rate ?? 1)))) : win;
};
const musicVolume = (c: MusicCue) => {
  const len = cueFrames(c);
  return (f: number) => {
    const abs = c.from + f;
    const edge = Math.max(0, Math.min(1, f / Math.max(1, c.fadeIn), (len - f) / Math.max(1, c.fadeOut)));
    const shape = dbGain(shapeDb(c.shape, abs));
    if (c.hit) return Math.min(ONE_SHOT_MAX, lufsToVol(c.open, c.file)) * edge * shape;
    return ducked(lufsToVol(cueOpenLufs(c, abs), c.file), lufsToVol(c.under, c.file), abs, c.duckRamp ?? DUCK_RAMP) * edge * shape;
  };
};

export const Episode05Ghibli: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#000" }}>
    {EP05_SCENES.map((scene, i) => {
      const SceneComponent = SCENE_COMPONENTS[scene.sceneId];
      if (!SceneComponent) return null;
      const next = EP05_SCENES[i + 1];
      const hasBreak = breakAfter(scene.sceneId) !== undefined;
      const gap = next && !hasBreak ? Math.max(0, next.startFrame - (scene.startFrame + scene.durationFrames)) : 0;
      const tail = Math.max(hasBreak ? 0 : SCENE_TAIL[scene.sceneId] ?? 0, gap);
      const dissolveIn = SCENE_DISSOLVE_IN[scene.sceneId];
      const fade = SCENE_FADE[scene.sceneId];
      const outEnd =
        next && !fade?.fadeToSceneEnd ? Math.min(scene.durationFrames, next.startFrame - scene.startFrame) : scene.durationFrames;
      let body: React.ReactNode = <SceneComponent />;
      if (fade) body = <BlackFade fadeIn={fade.in} fadeOut={fade.out} outEnd={outEnd}>{body}</BlackFade>;
      if (dissolveIn) body = <DissolveIn frames={dissolveIn}>{body}</DissolveIn>;
      return (
        <Sequence key={scene.sceneId} from={scene.startFrame} durationInFrames={scene.durationFrames + tail}>
          {body}
        </Sequence>
      );
    })}
    {BREAKS.map((b) => (
      <Sequence key={`break-${b.after}`} from={b.startFrame} durationInFrames={b.frames}>
        <AbsoluteFill style={{ background: "#000" }} />
      </Sequence>
    ))}
    {/* Phase 5 (Item 20): Soft hand-painted watercolor wash transitions at major scene handoffs */}
    <Sequence from={Math.max(0, sceneStart(S01) - 10)} durationInFrames={24}>
      <GhibliWashTransition durationFrames={24} />
    </Sequence>
    <Sequence from={Math.max(0, sceneStart(OUTRO) - 12)} durationInFrames={26}>
      <GhibliWashTransition durationFrames={26} />
    </Sequence>
    {BEDS.map((bed) =>
      bed.layers.map((layer) => (
        <Sequence key={`bed-${bed.name}-${layer.file}`} from={bed.from} durationInFrames={Math.max(1, bed.to - bed.from)} layout="none">
          <Audio src={staticFile(`audio/${layer.file}`)} loop volume={bedLayerVolume(bed, layer)} />
        </Sequence>
      )),
    )}
    {MUSIC_PLACED.map((c, k) => (
      <Sequence key={`music-${k}-${c.beat}-${c.file}`} from={c.from} durationInFrames={cueFrames(c)} layout="none">
        <Audio src={staticFile(`audio/${c.file}.wav`)} loop={MUSIC_LIB[c.file].loop && !c.hit} volume={musicVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
    {PLACED_SFX.map((c, k) => (
      <Sequence key={`sfx-${k}-${c.file}-${c.from}`} from={c.from} durationInFrames={c.frames ?? Math.ceil((sfxSeconds(c.file) * 24) / (c.rate ?? 1))} layout="none">
        <Audio src={sfxSrc(c.file)} loop={c.frames !== undefined} volume={cueVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
    {EP05_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep05/${a.file}`)} volume={1} />
      </Sequence>
    ))}
    <SeriesSubtitles cues={EP05_CUES.filter((c) => c.from >= EP05_SCENES[1].startFrame)} />
  </div>
);
