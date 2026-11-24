import React from "react";
import { SeriesSubtitles } from "../episode/SeriesSubtitles";
import { clipSpan3, cueLocalStory3, pausesFor3, storyToReal } from "../episode/storyClock";
import { Audio, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EP03_AUDIO, EP03_SCENES, EP03_TOTAL_FRAMES } from "./timing";
import { EP03_CUES } from "./subtitles";
import { Scene00Intro } from "./scenes/Scene00Intro";
import { Scene01SharadFlowerGathering } from "./scenes/Scene01SharadFlowerGathering";
import { Scene02FlowersOnOwnFeet } from "./scenes/Scene02FlowersOnOwnFeet";
import { Scene99ClosingSequentialOutro } from "./scenes/Scene99ClosingSequentialOutro";
import { Scene98NextEpisode } from "./scenes/Scene98NextEpisode";
import { SourceCard } from "../episode/SourceCard";

const sceneById = (id: string) => {
  const s = EP03_SCENES.find((x) => x.sceneId === id);
  if (!s) throw new Error(`Episode03: unknown scene ${id}`);
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

/** Scene 01 fades in from the background over its first 14 frames (its Stage opacity). */
const S01_FADE_IN = 14;
/**
 * Source card -> scene 01: the card keeps drawing through the timing gap and its 24-frame fade-out ends only
 * when scene 01 has fully faded in on top of it, so there is no black frame between them.
 */
const SOURCE_CARD_END = sceneStart(S01) + S01_FADE_IN;

/** Source attribution card (Bengali and English), shown right after the title line. */
const SOURCE_BN = "‘শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী’ (জননী শ্রীচারুশীলা দেবী ও ছোট মাসীমা শ্রীসরলা দেবীর স্মৃতিকথা অবলম্বনে)";
const SOURCE_EN = "Based on \"Sri Sri Balak Brahmachari's Childhood Stories\" (accounts of Mother Charushila Devi, Sarala Devi & eyewitnesses)";
const SourceAttributionScene: React.FC = () => {
  const frames = SOURCE_CARD_END - sceneStart("00b_source_attribution");
  return <SourceCard bn={SOURCE_BN} en={SOURCE_EN} frames={frames} />;
};

/**
 * Scene 01 -> 02 cross-dissolve. Scene 02 fades in from opacity 0 on top of scene 01 over S02_DISSOLVE frames,
 * while scene 01 keeps drawing underneath (it runs a few frames past its own length to cover the dissolve).
 * Scene 02 has its own 10-frame fade-in from a dark backing (S02_OWN_FADE), which would make the blend dip to
 * dark; during the dissolve its clock is gently remapped from local S02_OWN_FADE up to S02_DISSOLVE (a short
 * slow-motion run), so the picture that dissolves in is already fully lit. From local S02_DISSOLVE on it plays
 * at normal speed on its own frames.
 * With the STO-17 pauses, scene 02 opens on a 24-frame open pause (story clock held at 0), which covers the whole
 * dissolve: the remap only slows the REAL clock (lifeF: breathing, blinks, the diya) for these 18 frames, and the
 * story starts on time at the end of the pause. Its mapped frame meets the real frame at 18, so there is no jump.
 */
const S02_DISSOLVE = 18;
const S02_OWN_FADE = 10;

/**
 * Scene 99 (outro) carries the next-episode segment (98) too: the outro background keeps drawing under it, and
 * the soft next-episode glimpse lives inside the outro scene (TTL-10a), so the 98 segment draws nothing itself.
 */
const OUTRO_TAIL = sceneEnd("98_next_episode") - sceneEnd(OUTRO);

/** Extra frames a scene's picture keeps rendering past its own length. A timing gap to the next scene always
 * wins when it is longer, so no black frame ever shows between scenes. */
const SCENE_TAIL: Record<string, number> = {
  "00b_source_attribution": SOURCE_CARD_END - sceneEnd("00b_source_attribution"),
  [S01]: Math.max(0, sceneStart(S02) + S02_DISSOLVE - sceneEnd(S01)),
  [OUTRO]: OUTRO_TAIL,
};
/** Scenes whose picture fades in from opacity 0 over the scene drawn underneath. */
const SCENE_DISSOLVE_IN: Record<string, number> = { [S02]: S02_DISSOLVE };

/** Fades its children in from opacity 0 (a gentle sine ease), for a cross-dissolve over the scene below. */
const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, f / frames));
  const opacity = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

/** Scene 02 with its first S02_DISSOLVE frames remapped to start past its own fade-in (see above). */
const Scene02Dissolving: React.FC = () => {
  const f = useCurrentFrame();
  const active = f < S02_DISSOLVE;
  const mapped = Math.round(S02_OWN_FADE + (f * (S02_DISSOLVE - S02_OWN_FADE)) / S02_DISSOLVE);
  return (
    <Freeze frame={active ? mapped : f} active={active}>
      <Scene02FlowersOnOwnFeet />
    </Freeze>
  );
};

/** Scene components by sceneId. Each scene reads its own local frame via useCurrentFrame(). */
const SCENE_COMPONENTS: Record<string, React.FC> = {
  "00_intro": Scene00Intro,
  "00b_source_attribution": SourceAttributionScene,
  [S01]: Scene01SharadFlowerGathering,
  [S02]: Scene02Dissolving,
  [OUTRO]: Scene99ClosingSequentialOutro,
  "98_next_episode": Scene98NextEpisode,
};

/* ------------------------------------------------------------------ */
/* Timeline anchors: story frames, pauses, narration phrases            */
/* ------------------------------------------------------------------ */

/**
 * Story frame -> real local frame of a scene (rule CAM-14 pauses, EP03_PAUSES). Story frames are the scene's
 * authored local frames (the plan's `f` and "voice ≈" values): real = story + the frames of every pause of that
 * scene whose atStory is BEFORE it. A cue exactly at a pause's atStory plays at the pause start.
 */
const storyReal = (sceneId: string, story: number): number => storyToReal(story, pausesFor3(sceneId));

/** Pause `index` (0-based, sorted by atStory) of a scene, as a real local window. */
const pauseWindow = (sceneId: string, index: number): { start: number; end: number; frames: number } => {
  const p = pausesFor3(sceneId)[index];
  if (!p) throw new Error(`Episode03: scene ${sceneId} has no pause ${index}`);
  const start = p.startFrame - sceneStart(sceneId);
  return { start, end: start + p.frames, frames: p.frames };
};

/** Real local frame where the first subtitle phrase of a scene containing `snippet` starts (undefined if none). */
const phraseLocal = (sceneId: string, snippet: string): number | undefined => {
  const i = EP03_SCENES.findIndex((s) => s.sceneId === sceneId);
  const s = EP03_SCENES[i];
  const next = EP03_SCENES[i + 1];
  if (!s) return undefined;
  const end = Math.min(s.startFrame + s.durationFrames, next ? next.startFrame : Infinity);
  const c = EP03_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  return c ? c.from - s.startFrame : undefined;
};

/** 0 while the scene's story clock is held (inside one of its pauses), 1 otherwise, with short ramps. */
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

/* ------------------------------------------------------------------ */
/* Ducking                                                             */
/* ------------------------------------------------------------------ */

/**
 * Ambient ducking, as Episode 2: a voice clip (EP03_AUDIO) counts as speech from its start to its end; gaps
 * shorter than DUCK_MERGE stay ducked so a bed never pumps between two lines. DUCK_MERGE is 20 (Episode 2: 24)
 * so every 24-frame pause of the STO-17 plan still opens (02A P2 sits in a 23-frame gap between two clip parts).
 * The level moves over DUCK_RAMP frames with a sine ease, reaching the ducked level as the voice starts.
 */
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
/** 1 while a voice is speaking, 0 in a pause, eased in between. */
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
/** A level that sits at `open` in the quiet and at `under` under a voice. */
const ducked = (open: number, under: number, frame: number) => open + (under - open) * speechAmount(frame);

/* ------------------------------------------------------------------ */
/* Sound beds                                                          */
/* ------------------------------------------------------------------ */

/**
 * Bed layers (plan "Sound beds this plan needs", STO-17 answer 8). Each layer loops for its bed's window at
 * `under` under a voice and `open` in the quiet; `pauseOpen` overrides the open level inside one pause of
 * `pauseScene` (the levels named in the plan's Pauses tables). Levels (AUD-02, AUD-03, STO-16 answer 9): no bed
 * above 0.25 in a pause. `out` fades a layer to silence from an absolute frame.
 * AUD-07 (2026-11-22): the scenes' music (Village_Peace_Loop, Warm_Family_Flute, the Divine_Motif) moved out of the
 * beds into MUSIC_CUES below (the cue sheet); the beds keep the ambience. The intro and outro beds are the series
 * template and keep their music.
 */
interface BedLayer {
  file: string;
  under: number;
  open: number;
  pauseOpen?: Record<number, number>;
  out?: { from: number; frames: number };
}
interface Bed {
  name: string;
  from: number; // absolute
  to: number; // absolute (exclusive)
  fadeIn: number;
  fadeOut: number;
  pauseScene?: string;
  layers: BedLayer[];
}

/** The Divine_Motif enters softly on "গাছ কেটে" (Balak's last line, STO-17; MUSIC_CUES M8). */
const MOTIF_IN = sceneStart(S02) + (phraseLocal(S02, "গাছ কেটে") ?? storyReal(S02, 905));

const BEDS: Bed[] = [
  // Intro and source card: the series template's Theme_Intro_Bansuri (Episode 2's level: 0.14 open, 0.08 under a
  // voice), one continuous pass over both (Episode 2 restarts it at the card), fading out as scene 01 fades in.
  {
    name: "intro",
    from: 0,
    to: sceneStart(S01) + 24,
    fadeIn: 1,
    fadeOut: 24,
    layers: [{ file: "music/Theme_Intro_Bansuri.wav", under: 0.08, open: 0.14 }],
  },
  // 01 the autumn dawn garden: dawn birds, the river breeze in the kaash (the music is MUSIC_CUES M1). P1 birds
  // 0.22, P2 wind 0.15, P3 birds 0.20. Fades out over the cross-dissolve into 02.
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
  // 02 the tulsi courtyard (the Vedic house, STO-18): day birds (STO-17 default), a soft breeze that stirs the
  // tulsi (0.12 in 02B P2 and 02C P2); the music is MUSIC_CUES M2 to M8. Pause indices: 0 = 02A P1 (open),
  // 1 = 02A P2, 2 = 02A P3, 3-5 = 02B P1-P3, 6-8 = 02C P1-P3. Fades in over the dissolve, out as the outro starts.
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
  // Outro (99) and the next-episode glimpse (98): the series template (Episode 2's outro bed), one pass to the end.
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

/** The open level of a layer at an absolute frame: its pause override inside that pause, ramped at the edges. */
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

/* ------------------------------------------------------------------ */
/* Sound effects                                                       */
/* ------------------------------------------------------------------ */

/**
 * One-shots play for their own length (SFX_SECONDS); loops (loopFrames set) repeat with a short fade at each end
 * (fadeIn / fadeOut override it). `gate` silences a loop while its scene's story clock is held. Volumes 0.15 to
 * 0.45, loops 0.25 or below. `file` is a name in audio/sfx/ep02, or a path under audio/ when it has a slash.
 */
const SFX_SECONDS: Record<string, number> = {
  cloth_rustle: 1.2, paper_rustle: 1, water_splash: 1, chime_pop: 1.2, soft_magical_shimmer: 2.5, river_water: 4,
  girls_giggle: 1.2, water_pour: 2.98,
};
interface SfxSound {
  file: string;
  volume: number;
  loopFrames?: number;
  fadeIn?: number;
  fadeOut?: number;
  gate?: boolean;
  /** Playback rate (default 1): 1.08 makes the one giggle recording read as a second, younger girl. */
  rate?: number;
}
/**
 * A scene cue. Without `cue`, `at` is a STORY frame (the plan's `f` / "voice ≈" frames, before pauses) and a
 * loop's `loopFrames` are story frames. With `cue`, the sound starts `at` real frames after the start of the
 * scene's narration phrase containing that text (loopFrames real).
 */
interface SfxCue extends SfxSound { scene: string; at: number; cue?: string }

/** Ep03 recordings (public/audio/sfx/ep03, credits in its README). */
const GIGGLE = "sfx/ep03/girls_giggle";
const POUR = "sfx/ep03/water_pour";
/**
 * No flower-pick recording exists: a soft leaf rustle (sfx/ep02/paper_rustle at 0.15) stands in for a flower or a
 * leaf being picked and dropped into a basket.
 */
const PICK = "paper_rustle";

/**
 * Story frames of Balak's beats in scene 02, derived exactly as Scene02FlowersOnOwnFeet derives them (rebuilt
 * 2026-11-21), so the sounds follow the picture if the timing changes: the pour starts 4 frames into
 * "তুলসীতলায়" (POUR_AT, water from +2 to +34), the hand closes on the fallen leaf at POUR_AT + 67, the three hibiscus
 * are picked 11 frames into each 32-frame placement ending at 02A P2 (183, 215, 247 today; laid 12 frames later
 * after the arc), the bow 20 frames after "আর নিজেই" (BOW_AT), and the last small bow 46 frames after "গাছ কেটে".
 */
const cueStory2 = (snippet: string, fallback: number): number => cueLocalStory3(snippet, S02)?.from ?? fallback;
const B2 = (() => {
  const pour = cueStory2("তুলসীতলায়", 94) + 4;
  const placeEnd = pausesFor3(S02)[1]?.atStory ?? 268;
  const pick = (k: number) => placeEnd - 3 * 32 + 32 * k + 11;
  return { pour, leaf: pour + 67, picks: [pick(0), pick(1), pick(2)], bow: cueStory2("আর নিজেই", 268) + 20, lastBow: cueStory2("গাছ কেটে", 908) + 46 };
})();

/**
 * Scene cues, re-anchored to the rebuilt scenes (2026-11-21). Scene 01 acts on its REAL clock from the narration
 * phrases (its T beats: phrase start + the measured voice lag), so its cues are phrase-relative; scene 02's
 * Balak acts on the story clock (B2), and its women and the girls on the real clock from the phrases (V beats).
 * STO-17a (2026-11-22): the GIRLS scold him (the eldest girl speaks, the others crowd round); Charu is not in
 * scene 02, so no cue here follows her.
 * A pose key with `in: n` starts moving n frames before its frame: the sounds start with the motion.
 */
const SFX_CUES: SfxCue[] = [
  // 01 Dawn garden. Tuni's hand closes on the fallen shiuli (T.l2 + 20 to + 34 = "শিউলি" + 31 to + 45). Line 3: a sari
  // rustle on the women's row, Sarala drops her jaba into her sajhi (release T.l3 + 36 = phrase + 53). Line 4, the
  // push to the hands: Mina's and Rekha's flowers dropped into their baskets (releases phrase + 43 and + 57).
  { scene: S01, cue: "শিউলি", at: 38, file: PICK, volume: 0.15 },
  { scene: S01, cue: "বাড়ির মেয়েরা", at: 18, file: "cloth_rustle", volume: 0.15 },
  { scene: S01, cue: "বাড়ির মেয়েরা", at: 52, file: PICK, volume: 0.15 },
  { scene: S01, cue: "জবা আর ঝুমকো", at: 42, file: PICK, volume: 0.15 },
  { scene: S01, cue: "জবা আর ঝুমকো", at: 56, file: PICK, volume: 0.15 },

  // 02A. "হঠাৎ সবাই": the women's heads turn to him (Sarala's turn starts at V.sabai - 8 = phrase + 6), a soft sari
  // rustle. The pour (B2.pour, the sound 1 frame ahead), cut to 40 story frames so it ends before the leaf reach;
  // the leaf; one soft rustle as the fingers close on each hibiscus in the dala (laid on his feet after each arc);
  // his cloth as he bows (প্রণাম). STO-17a: the three girls set off toward him 28 frames into "হঠাৎ সবাই" (the
  // scene's WALK_A = V.sabai + 14) and ease into their half-circle at his left over about 90 frames: their soft
  // steps on the courtyard earth (the footsteps used for this courtyard in Episode 2), eased in and out with the
  // walk and gone under the pour.
  { scene: S02, cue: "হঠাৎ সবাই", at: 7, file: "cloth_rustle", volume: 0.15 },
  { scene: S02, cue: "হঠাৎ সবাই", at: 30, file: "footsteps_floor", volume: 0.15, loopFrames: 80, fadeIn: 12, fadeOut: 22 },
  { scene: S02, at: B2.pour - 1, file: POUR, volume: 0.3, loopFrames: 40, fadeIn: 3, fadeOut: 12 },
  { scene: S02, at: B2.leaf - 1, file: PICK, volume: 0.15 },
  ...B2.picks.map((p): SfxCue => ({ scene: S02, at: p - 1, file: PICK, volume: 0.15 })),
  { scene: S02, at: B2.bow, file: "cloth_rustle", volume: 0.15 },
  // 02B. "ওমা": the eldest girl's hand flies to her cheek (key V.oma + 4, in 12 = phrase - 2), a sari rustle with
  // the motion. "দেখিস": her forefinger comes up as she leans in and the others lean in round him (key V.dekhis + 2,
  // in 10 = phrase + 0).
  { scene: S02, cue: "ওমা", at: -2, file: "cloth_rustle", volume: 0.18 },
  { scene: S02, cue: "দেখিস", at: 0, file: "cloth_rustle", volume: 0.15 },
  // 02C. "রাগ করতাম না": his palms join with a small bow of the head (B2.lastBow).
  { scene: S02, at: B2.lastBow, file: "cloth_rustle", volume: 0.15 },
];

/**
 * Sounds in the pauses (EP03_PAUSES, rule CAM-14): the sound column of the approved Pauses tables
 * (Ep03_Shots_and_Pauses_DRAFT.md, STO-17). The bed levels named there (birds 0.18 / 0.20 / 0.22, wind 0.12 /
 * 0.15, the music rising) are the beds' pauseOpen levels above; this list holds the sounds added on top.
 * `pause` is the scene's pause index (sorted by atStory); `at` is real frames from the pause start, or from its
 * end when `fromEnd` is set (negative values start before it).
 */
interface PauseCue extends SfxSound { scene: string; pause: number; at: number; fromEnd?: boolean }
const PAUSE_CUES: PauseCue[] = [
  // 01 P1 "…শরতের মিষ্টি ভোর।": the river glints beyond the kaash (river_water 0.18, eased out under line 2)
  { scene: S01, pause: 0, at: 0, file: "sfx/river_water", volume: 0.18, loopFrames: 60, fadeIn: 8, fadeOut: 24 },
  // 01 P2 "…আকাশ-বাতাস ভরে উঠেছে।": the breeze (bed 0.15) and birds; no extra sound. 01 P3 (end): the music rises
  // to 0.15, birds 0.20 (beds); no extra sound.
  // 02A P1 (open): birds rise to 0.20, the flute 0.14 (beds); no extra sound.
  // 02A P2 "…নিজের পায়ে দিচ্ছে,": his hand settles back on his knee after the third flower (the hand-back phase of
  // the last placement ends exactly as the pause begins)
  { scene: S02, pause: 1, at: -5, file: "cloth_rustle", volume: 0.15 },
  // 02A P3 "…নিজেই নিজেকে প্রণাম করছে!": the soft shimmer as his glow lifts (key beat 1); the girls, already round
  // him (they walked over on "হঠাৎ সবাই"), only exchange a glance: no steps here any more (STO-17a).
  { scene: S02, pause: 2, at: 2, file: "sfx/soft_magical_shimmer", volume: 0.15 },
  // 02B P1 "ওমা, একি কাণ্ড!": the first soft giggle as the other two lean in round him, a hand to the mouth (the
  // middle girl's giggle window starts at P1 + 4), and the eldest girl's hand coming down from her cheek (P1 + 8)
  { scene: S02, pause: 3, at: 4, file: GIGGLE, volume: 0.2, rate: 1.06 },
  { scene: S02, pause: 3, at: 8, file: "cloth_rustle", volume: 0.15 },
  // 02B P2 "…নিজের পায়ে দিচ্ছিস কেন রে?": the tulsi leaves stir (wind 0.12, bed); no extra sound.
  // 02B P3 "…ভগবান শাপ দেবেন!": the two followers giggle behind their hands (girls_giggle; the second a touch
  // quicker and higher, for the youngest), and a rustle as the eldest girl's finger comes down and she waits for
  // his answer; all of it ends before Balak's line.
  // (on the giggle windows in the scene: the middle girl from P3 + 4, the youngest from P3 + 11; the eldest's
  // finger comes down from P3 + 0 over 16 frames)
  { scene: S02, pause: 5, at: 4, file: GIGGLE, volume: 0.4 },
  { scene: S02, pause: 5, at: 11, file: GIGGLE, volume: 0.3, rate: 1.08 },
  { scene: S02, pause: 5, at: 6, file: "cloth_rustle", volume: 0.15 },
  // 02C P1 "…আমি বেশ টের পাই।": birds 0.18 only (bed).
  // 02C P2 "…কিছু বোঝেও না!": the middle girl's last giggle (window P2 + 0 to + 12) fades as the girls glance at
  // each other, unsure; the tulsi stirs (wind 0.12)
  { scene: S02, pause: 7, at: 0, file: GIGGLE, volume: 0.18, rate: 1.04 },
  // 02C P3 (end): the Divine_Motif (DIVINE_MOTIF below), birds 0.15 (bed).
];

/** A sound placed on the absolute timeline: start, real length, and the scene whose pauses gate it. */
interface PlacedSfx extends SfxSound { from: number; frames?: number; gateScene?: string }
const placeScene = (c: SfxCue): PlacedSfx | null => {
  const start = sceneStart(c.scene);
  if (c.cue !== undefined) {
    const p = phraseLocal(c.scene, c.cue);
    if (p === undefined) {
      console.warn(`Episode03: no phrase "${c.cue}" in ${c.scene}; cue ${c.file} skipped`);
      return null;
    }
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
/** Every sound cue on the absolute timeline. The intro chime is the series template (Episode 2's intro bed sfx). */
const PLACED_SFX: PlacedSfx[] = [
  { file: "sfx/chime_pop", volume: 0.4, from: 0 },
  { file: "sfx/soft_magical_shimmer", volume: 0.4, from: sceneStart(OUTRO) }, // the outro template's shimmer
  ...SFX_CUES.map(placeScene).filter((c): c is PlacedSfx => c !== null),
  ...PAUSE_CUES.map(placePause),
].filter((c) => c.frames === undefined || c.frames > 0);
const sfxSrc = (file: string) => staticFile(file.includes("/") ? `audio/${file}.wav` : `audio/sfx/ep02/${file}.wav`);
const sfxSeconds = (file: string) => SFX_SECONDS[file.split("/").pop() ?? file] ?? 2;

/** Loop volume with a fade in and out, so a loop never starts or stops with a click. */
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

/* ------------------------------------------------------------------ */
/* Music (AUD-07): the cue sheet, beat by beat                           */
/* ------------------------------------------------------------------ */

/**
 * Cue sheet: 03_Episodes/Episode_03_Five_Year_Old_Wisdom/02_Audio/Ep03_Music_Cue_Sheet.md (beats M1 to M8, 2026-11-22;
 * modelled on Episode 5's MUSIC_CUES). The Episode 5 recordings (public/audio/music/ep05, README there: Sa = C, the
 * tanpura_drone_cs in C# for under the Divine_Motif) with the series music. Every beat is a row of MUSIC_CUES, anchored
 * to narration phrases (phraseLocal), voice clips (clipSpan3), Balak's beats (B2) and the pauses, never hard frames.
 *
 * LEVELS are LOUDNESS TARGETS (LUFS), turned into a volume per file from its measured unit-gain loudness (MUSIC_LIB,
 * ffmpeg ebur128 integrated). With the voices at -16 LUFS, music under a voice sits 18 to 24 dB lower (about -34 to
 * -40) and rises in the quiet to 12 to 16 dB lower (about -28 to -32); the tanpura drones sit lower still, a floor.
 * Looped cues never exceed volume 0.25 (AUD-03), one-shots 0.45 (AUD-02). Every looped cue ducks under every voice
 * (the same SPEECH / speechAmount as the beds) and rises in the pauses (AUD-06). Two drones a semitone apart (C and
 * C#) never overlap: the C tanpura is out before the C# one comes in with the Divine_Motif.
 */
interface MusicFile {
  /** Integrated loudness at volume 1 (LUFS). */
  lufs: number;
  seconds: number;
  /** Loops seamlessly (a bed); otherwise it plays once from the cue's start. */
  loop: boolean;
}
const MUSIC_LIB: Record<string, MusicFile> = {
  // series music (measured 2026-11-22)
  "music/Village_Peace_Loop": { lufs: -8.5, seconds: 15.2, loop: true },
  "music/Warm_Family_Flute": { lufs: -8.1, seconds: 13.2, loop: true },
  "music/Divine_Motif": { lufs: -15.0, seconds: 36, loop: false },
  // music/ep05 (real recordings; loops levelled to -24 LUFS, the low drone to -28, one-shots to -20)
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

/** One beat's layer. `under` / `open` / pause levels are LUFS targets (see above); `shape` is a gain curve in dB. */
interface MusicCue {
  beat: string;
  file: string;
  from: number; // absolute
  to: number; // absolute (exclusive)
  fadeIn: number;
  fadeOut: number;
  under: number;
  open: number;
  /** Open level inside a pause of `scene` (index sorted by atStory), ramped over DUCK_RAMP. */
  pause?: { scene: string; index: number; lufs: number }[];
  /** Keyframes [absolute frame, dB], linear, held before the first and after the last (a dip under another layer). */
  shape?: [number, number][];
  /** A one-shot accent: played once at `open`, not ducked. */
  hit?: boolean;
}

const lufsToVol = (target: number, file: string) => Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -12)) / 20);
const dbGain = (db: number) => Math.pow(10, db / 20);
const musicSeconds = (file: string) => MUSIC_LIB[file]?.seconds ?? 2;

/** Absolute anchors: narration phrases, voice clips, Balak's beats, pauses (each with a fallback). */
const phraseAbs = (scene: string, snippet: string, fallbackLocal: number) => sceneStart(scene) + (phraseLocal(scene, snippet) ?? fallbackLocal);
const pauseAbs = (scene: string, index: number) => {
  const w = pauseWindow(scene, index);
  return { start: sceneStart(scene) + w.start, end: sceneStart(scene) + w.end };
};
const A01 = {
  start: sceneStart(S01),
  /** scene 01's sound ends over the cross-dissolve into 02 */
  end: sceneStart(S02) + S02_DISSOLVE,
};
const A02 = {
  start: sceneStart(S02),
  /** the pour starts 4 story frames into "তুলসীতলায়" (B2.pour) */
  pour: sceneStart(S02) + storyReal(S02, B2.pour),
  ownFeetP: pauseAbs(S02, 1), // 02A P2, the three flowers on his feet
  aarNijei: phraseAbs(S02, "আর নিজেই", 316),
  pranamP: pauseAbs(S02, 2), // 02A P3, glow beat 1
  oma: phraseAbs(S02, "ওমা", 429),
  omaP: pauseAbs(S02, 3), // 02B P1
  tui: phraseAbs(S02, "তুই ঠাকুরের", 500),
  heldP: pauseAbs(S02, 5), // 02B P3, the held pause before his answer
  balak: clipSpan3("02c_Toddler_Thakur.wav")?.startFrame ?? sceneStart(S02) + 789,
  amarPaye: phraseAbs(S02, "আমার পায়ে", 848),
  murtiP: pauseAbs(S02, 7), // 02C P2, the girls glance at each other, unsure
  /** "গাছ কেটে" as heard: the phrase start + the voice lag the scene measured (its V.gach = phrase + 17); his glow
   * (beat 2) starts lifting 4 frames before it */
  gachVoice: MOTIF_IN + 17,
  endP: pauseAbs(S02, 8), // 02C P3 (end)
};
/** The cut to the eldest girl's close-up (the scene's ELDEST_MCU at V.oma - 7 = the "ওমা" phrase start - 1). */
const OMA_CUT = A02.oma - 1;
/** The Divine_Motif and the C# tanpura come in with the glow, 6 frames before "গাছ কেটে" is heard. */
const MOTIF_AT = A02.gachVoice - 6;
/** bansuri_compassion (9.53 s) is placed so its last note settles on Sa about 18 frames into 02C P2, but never
 * starts before "আমার" is heard (the scene's V.amar = phrase + 20; it fades in from 4 frames before). */
const BANSURI_FRAMES = Math.floor(musicSeconds("music/ep05/bansuri_compassion") * 24);
const BANSURI_AT = Math.max(A02.amarPaye + 16, A02.murtiP.start + 18 - BANSURI_FRAMES);

/** Tanpura drone levels: a quiet floor under the melody (-37 is 0.22 of the -24 LUFS loop, under the 0.25 cap). */
const DRONE = { under: -44, open: -37 };

const MUSIC_CUES: MusicCue[] = [
  /* ---------- Scene 01: the autumn dawn, the flower gathering ---------- */
  // M1 calm dawn: Village_Peace_Loop over the soft tanpura (C); the loop rises in the end pause (P3) and fades over the
  // cross-dissolve, where the tanpura carries straight on into the courtyard (one drone from the dawn to the scolding)
  { beat: "M1", file: "music/Village_Peace_Loop", from: A01.start, to: A01.end, fadeIn: 24, fadeOut: S02_DISSOLVE, under: -37, open: -31,
    pause: [{ scene: S01, index: 2, lufs: -30 }] },
  { beat: "M1-M4", file: "music/ep05/tanpura_drone", from: A01.start, to: A02.tui + 18, fadeIn: 30, fadeOut: 30, ...DRONE,
    pause: [{ scene: S02, index: 2, lufs: -36 }] },

  /* ---------- Scene 02A: the ritual at the tulsi ---------- */
  // M2 a child at peace: Warm_Family_Flute fades in over the dissolve and the open pause; it dips 5 dB under the M3
  // plucks and comes back for the pranam pause; it bows out just before "ওমা"
  { beat: "M2", file: "music/Warm_Family_Flute", from: A02.start, to: A02.oma - 6, fadeIn: S02_DISSOLVE, fadeOut: 30, under: -38, open: -31,
    pause: [{ scene: S02, index: 2, lufs: -30 }],
    shape: [[A02.pour - 10, 0], [A02.pour + 12, -5], [A02.aarNijei, -5], [A02.aarNijei + 24, 0]] },
  // M3 innocent ritual: light, tender swarmandal plucks from the pour through the three flowers laid on his own feet,
  // brightest in 02A P2 as he looks down at them; they fall away on "আর নিজেই" (the bow is still)
  { beat: "M3", file: "music/ep05/play_plucks", from: A02.pour - 6, to: A02.aarNijei + 10, fadeIn: 18, fadeOut: 16, under: -41, open: -37,
    pause: [{ scene: S02, index: 1, lufs: -36 }] },
  // M4 the pranam (glow beat 1): the flute and the tanpura bloom a little in 02A P3 (rows above); the shimmer is an SFX

  /* ---------- Scene 02B: the girls scold him (light, never scary) ---------- */
  // M5 cheeky: a quick swarmandal flurry on the cut to the eldest girl's surprise ("ওমা"), and four whimsical notes
  // with the first giggle in 02B P1; gone by "তুই"
  { beat: "M5", file: "music/ep05/cheeky_pluck_1", from: OMA_CUT, to: A02.omaP.start + 4, fadeIn: 1, fadeOut: 10, under: -38, open: -38, hit: true },
  { beat: "M5", file: "music/ep05/cheeky_pluck_3", from: A02.omaP.start - 2, to: A02.tui + 6, fadeIn: 1, fadeOut: 8, under: -37, open: -37, hit: true },
  // M6 stern: from "তুই ঠাকুরের ফুল…" the tanpura darkens (the low drone crossfades in) and a soft tabla figure walks
  // under the scolding; the tabla stops as 02B P3 begins, leaving the low drone alone in the held pause (the giggles
  // are SFX); the low drone gives way to the warm tanpura as Balak starts to answer
  { beat: "M6", file: "music/ep05/tanpura_drone_low", from: A02.tui - 12, to: A02.balak + 18, fadeIn: 30, fadeOut: 30, under: -44, open: -41,
    pause: [{ scene: S02, index: 5, lufs: -40 }] },
  { beat: "M6", file: "music/ep05/tabla_soft", from: A02.tui - 4, to: A02.heldP.start + 8, fadeIn: 30, fadeOut: 12, under: -43, open: -39,
    pause: [{ scene: S02, index: 4, lufs: -38 }] },

  /* ---------- Scene 02C: Balak's calm, wise answer ---------- */
  // M7 compassion: the warm tanpura (C) returns under his first words; a tender bansuri swells in softly under
  // "আমার পায়ে ফুল দিলে…", rises in 02C P1 and settles on Sa in 02C P2; the tanpura is out by "গাছ কেটে"
  { beat: "M7", file: "music/ep05/tanpura_drone", from: A02.balak - 12, to: MOTIF_AT, fadeIn: 36, fadeOut: 24, ...DRONE,
    pause: [{ scene: S02, index: 6, lufs: -36 }, { scene: S02, index: 7, lufs: -36 }] },
  { beat: "M7", file: "music/ep05/bansuri_compassion", from: BANSURI_AT, to: BANSURI_AT + BANSURI_FRAMES, fadeIn: 30, fadeOut: 20, under: -40, open: -34,
    pause: [{ scene: S02, index: 6, lufs: -33 }, { scene: S02, index: 7, lufs: -33 }] },
  // M8 grace (glow beat 2, STO-17 answer 4): the Divine_Motif (C#) over the C# tanpura enters softly on "গাছ কেটে",
  // rises in the end pause and fades out over the first second of the outro, under the outro's own music
  { beat: "M8", file: "music/Divine_Motif", from: MOTIF_AT, to: A02.endP.end + 24, fadeIn: 36, fadeOut: 30, under: -36, open: -30,
    pause: [{ scene: S02, index: 8, lufs: -30 }] },
  { beat: "M8", file: "music/ep05/tanpura_drone_cs", from: MOTIF_AT, to: A02.endP.end + 24, fadeIn: 36, fadeOut: 30, ...DRONE,
    pause: [{ scene: S02, index: 8, lufs: -36 }] },
];

/** Cues whose file is known, with a window of at least one frame. */
const MUSIC_PLACED = MUSIC_CUES.filter((c) => MUSIC_LIB[c.file] !== undefined && c.to > c.from);

/** The open target of a cue at an absolute frame: its pause override inside that pause, ramped at the edges. */
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
/** A cue's play length: its window, or a non-looping file's own length if shorter. */
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

export const Episode03: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
    {EP03_SCENES.map((scene, i) => {
      const SceneComponent = SCENE_COMPONENTS[scene.sceneId];
      // A scene keeps drawing until the next one starts (tail = max(SCENE_TAIL, gap)), so a timing gap never
      // shows a black flash.
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
    {/* Sound beds: they rise in the pauses and duck under the voices */}
    {BEDS.map((bed) =>
      bed.layers.map((layer) => (
        <Sequence key={`bed-${bed.name}-${layer.file}`} from={bed.from} durationInFrames={bed.to - bed.from} layout="none">
          <Audio src={staticFile(`audio/${layer.file}`)} loop volume={bedLayerVolume(bed, layer)} />
        </Sequence>
      )),
    )}
    {/* Music (MUSIC_CUES, the cue sheet M1 to M8): every looped beat ducks under the voices and rises in the pauses */}
    {MUSIC_PLACED.map((c, k) => (
      <Sequence key={`music-${k}-${c.beat}-${c.file}`} from={c.from} durationInFrames={cueFrames(c)} layout="none">
        <Audio src={staticFile(`audio/${c.file}.wav`)} loop={MUSIC_LIB[c.file].loop && !c.hit} volume={musicVolume(c)} />
      </Sequence>
    ))}
    {/* Sound effects at the scene events and in the pauses */}
    {PLACED_SFX.map((c, k) => (
      <Sequence key={`sfx-${k}-${c.file}-${c.from}`} from={c.from} durationInFrames={c.frames ?? Math.ceil((sfxSeconds(c.file) * 24) / (c.rate ?? 1))} layout="none">
        <Audio src={sfxSrc(c.file)} loop={c.frames !== undefined} volume={cueVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
    {/* Narration clips (EP03_AUDIO; a clip cut at a pause plays as NAME_p1, NAME_p2, ...) */}
    {EP03_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep03/${a.file}`)} volume={1} />
      </Sequence>
    ))}
    {/* The intro title page carries no narration captions; captions start with the source card. */}
    <SeriesSubtitles cues={EP03_CUES.filter((c) => c.from >= EP03_SCENES[1].startFrame)} />
  </div>
);
