/**
 * Story clock: held moments (pauses) INSIDE a scene without breaking its choreography.
 *
 * Rule CAM-14 (director, 2026-11-21): scenes give the audience time to feel. A pause is a 1 to 2 s hold
 * between two narration sentences: the voice stops and the STORY action waits, while LIFE goes on
 * (breathing, blinks, glances, ambient sound, a slow camera push).
 *
 * How it works (see scripts/build_ep02_timing.js, PAUSES, and docs/PIPELINE_DECISIONS.md TIM-PAUSE-01):
 *   - The timing generator cuts the voice clip at the sentence silence, makes the scene longer by the pause
 *     and shifts every later clip, cue and scene. It exports EP02_PAUSES { sceneId, atStory, frames,
 *     startFrame }, where atStory is the scene-local frame in the scene's ORIGINAL authored timing.
 *   - A scene keeps its hard-coded keys in authored ("story") frames and reads two clocks:
 *       const { f, lifeF, pause } = useStory("02_fox_and_bagha_dog");
 *       f      story frame: runs like the old local frame, but holds at atStory during each pause and is
 *              (real local - earlier pause frames) after it. Drive choreography, story camera keys and
 *              lip sync with f.
 *       lifeF  the real local frame (useCurrentFrame). Pass it to the rigs (Puppet, BabyThakur, SeatedChild
 *              lifeF prop) for breathing, blinks and idle sway so characters stay alive inside a pause.
 *       pause  pauseState: { inPause, index, t 0..1, frames, elapsed } to animate a reaction, a slow push or a
 *              sound inside the pause.
 *   - Narration-tied keys: cueLocalStory(snippet, sceneId) gives a subtitle phrase's start and end in story
 *     frames (CAM-13: camera keys follow the narration, not hard-coded frames).
 *   - Clip windows: clipSpan(original) gives an original voice clip's first-part start and last-part end
 *     (absolute real frames) even when the clip has been cut into NAME_p1..NAME_pN.
 *
 * With no pauses in a scene, f === lifeF and every helper returns what the old code did.
 *
 * Episode 3 (added 2026-11-21, STO-17; scripts/build_ep03_timing.js, EP03_PAUSES / EP03_CLIP_PARTS): the same
 * helpers with a "3" suffix, bound to Episode 3's timing. The unsuffixed exports stay Episode 2's.
 *       const { f, lifeF, pause } = useStory3("02_flowers_on_own_feet");
 *       cueLocalStory3(snippet, sceneId), clipSpan3(original), clipLocalStory3(original, sceneId),
 *       pausesFor3(sceneId), absToStory3(absFrame, sceneId); or EP03_CLOCK for all of them.
 *   Scene 02's open pause holds story frame 0 during its first 24 real frames, which include the 18-frame
 *   cross-dissolve from scene 01: drive scene 02's own fade-in from lifeF, not from f.
 * Episode 4 (added 2026-11-21; scripts/build_ep04_timing.js, EP04_PAUSES / EP04_CLIP_PARTS; the approved pause
 * table STO-19 went in on 2026-11-22): the same helpers with a "4" suffix (useStory4, cueLocalStory4, clipSpan4,
 * clipLocalStory4, pausesFor4, absToStory4) or EP04_CLOCK. Episode 4 also has ACTION GAPS (EP04_GAPS, TIM-GAP-01):
 * picture time with no narration in which the story clock KEEPS RUNNING (scene 03: AG1 at the open, AG2 between
 * "ধুপ! ধুপ কই?" and "ঠাকুরমশায়,"). Story frames include the gaps, so f runs straight through them; key the gap's
 * action on f with gapState4(sceneId, f) (or useStory4(sceneId).gap): { inGap, index, t, frames, elapsed,
 * fromStory, beat }, beat = the named sub-step (AG2: a_dhoop, b_ask, c_inside, d_drink) with its own t / elapsed.
 * gapsFor4(sceneId) lists a scene's gaps. Chapter breaks (black, no scene mounted) are EP04_BREAKS in
 * ../episode04/timing; breakState4(absFrame) says whether an absolute frame is inside one.
 * Any other episode: makeStoryClock({ scenes, pauses, cues, audio, clipParts }) from its generated timing.
 */
import { useCurrentFrame } from "remotion";
import { EP02_AUDIO, EP02_CLIP_PARTS, EP02_PAUSES, EP02_SCENES } from "../episode02/timing";
import { EP02_CUES } from "../episode02/subtitles";
import { EP03_AUDIO, EP03_CLIP_PARTS, EP03_PAUSES, EP03_SCENES } from "../episode03/timing";
import { EP03_CUES } from "../episode03/subtitles";
import { EP04_AUDIO, EP04_BREAKS, EP04_CLIP_PARTS, EP04_GAPS, EP04_PAUSES, EP04_SCENES } from "../episode04/timing";
import type { Ep04Break, Ep04Gap } from "../episode04/timing";
import { EP04_CUES } from "../episode04/subtitles";
import { EP05_AUDIO, EP05_BREAKS, EP05_CLIP_PARTS, EP05_GAPS, EP05_PAUSES, EP05_SCENES } from "../episode05/timing";
import type { Ep05Gap } from "../episode05/timing";
import { EP05_CUES } from "../episode05/subtitles";

/* ------------------------------------------------------------------ */
/* Generic helpers (any episode): they take the pause list of one scene */
/* ------------------------------------------------------------------ */

/** One pause of a scene: the story clock holds at authored local frame `atStory` for `frames`. */
export interface StoryPause {
  atStory: number;
  frames: number;
}

export interface PauseState {
  /** True while the story clock is held. */
  inPause: boolean;
  /** Index of the current pause in the scene's pauses (sorted by atStory), or -1 outside a pause. */
  index: number;
  /** Progress through the current pause, 0..1 (0 outside a pause). */
  t: number;
  /** Length of the current pause in frames (0 outside a pause). */
  frames: number;
  /** Frames since the current pause began (0 outside a pause). */
  elapsed: number;
}

const byStory = <P extends StoryPause>(pauses: readonly P[]): P[] => [...pauses].sort((a, b) => a.atStory - b.atStory);

/** Authored (story) local frame for a real local frame: holds at atStory during a pause, minus the pauses after. */
export function storyFrame(realLocal: number, pausesForScene: readonly StoryPause[]): number {
  let held = 0;
  for (const p of byStory(pausesForScene)) {
    const start = p.atStory + held; // real local frame where this pause begins
    if (realLocal < start) break;
    if (realLocal < start + p.frames) return p.atStory;
    held += p.frames;
  }
  return realLocal - held;
}

/** Real local frame where a story frame plays (for a frame equal to a pause's atStory: where that pause begins). */
export function storyToReal(story: number, pausesForScene: readonly StoryPause[]): number {
  let held = 0;
  for (const p of byStory(pausesForScene)) {
    if (story <= p.atStory) break;
    held += p.frames;
  }
  return story + held;
}

/** Whether a real local frame is inside a pause, which one, and how far through it. */
export function pauseState(realLocal: number, pausesForScene: readonly StoryPause[]): PauseState {
  let held = 0;
  const sorted = byStory(pausesForScene);
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const start = p.atStory + held;
    if (realLocal < start) break;
    if (realLocal < start + p.frames) {
      const elapsed = realLocal - start;
      return { inPause: true, index: i, t: p.frames > 0 ? elapsed / p.frames : 0, frames: p.frames, elapsed };
    }
    held += p.frames;
  }
  return { inPause: false, index: -1, t: 0, frames: 0, elapsed: 0 };
}

/** One action gap of a scene: story frames [fromStory, fromStory + frames) with no narration; the story keeps running. */
export interface StoryGap {
  fromStory: number;
  frames: number;
  beats?: readonly { id: string; fromStory: number; frames: number }[];
}

export interface GapBeatState {
  /** The beat's id (e.g. "a_dhoop"). */
  id: string;
  /** Index of the beat inside its gap. */
  index: number;
  /** Progress through the beat, 0..1. */
  t: number;
  /** Length of the beat in frames. */
  frames: number;
  /** Story frames since the beat began. */
  elapsed: number;
}

export interface GapState {
  /** True while the story frame lies inside an action gap. */
  inGap: boolean;
  /** Index of the current gap in the scene's gaps (sorted by fromStory), or -1 outside a gap. */
  index: number;
  /** Progress through the current gap, 0..1 (0 outside a gap). */
  t: number;
  /** Length of the current gap in frames (0 outside a gap). */
  frames: number;
  /** Story frames since the current gap began (0 outside a gap). */
  elapsed: number;
  /** Story frame where the current gap begins (-1 outside a gap). */
  fromStory: number;
  /** The named beat of the gap at this frame, or null (no beats, or outside a gap). */
  beat: GapBeatState | null;
}

const NO_GAP: GapState = { inGap: false, index: -1, t: 0, frames: 0, elapsed: 0, fromStory: -1, beat: null };

/** Whether a STORY frame (f from useStory) lies inside one of the scene's action gaps, and where in it. */
export function gapState(story: number, gapsForScene: readonly StoryGap[]): GapState {
  const sorted = [...gapsForScene].sort((a, b) => a.fromStory - b.fromStory);
  for (let i = 0; i < sorted.length; i++) {
    const g = sorted[i];
    if (story < g.fromStory || story >= g.fromStory + g.frames) continue;
    const elapsed = story - g.fromStory;
    let beat: GapBeatState | null = null;
    const beats = g.beats ?? [];
    for (let k = 0; k < beats.length; k++) {
      const b = beats[k];
      if (story >= b.fromStory && story < b.fromStory + b.frames) {
        const be = story - b.fromStory;
        beat = { id: b.id, index: k, t: b.frames > 0 ? be / b.frames : 0, frames: b.frames, elapsed: be };
        break;
      }
    }
    return { inGap: true, index: i, t: g.frames > 0 ? elapsed / g.frames : 0, frames: g.frames, elapsed, fromStory: g.fromStory, beat };
  }
  return NO_GAP;
}

/* ------------------------------------------------------------------ */
/* Episode bindings: build them from an episode's generated timing      */
/* ------------------------------------------------------------------ */

interface SceneRow {
  sceneId: string;
  startFrame: number;
  durationFrames: number;
}
interface PauseRow extends StoryPause {
  sceneId: string;
  startFrame: number;
}
interface ClipRow {
  file: string;
  startFrame: number;
  frames: number;
}
interface CueRow {
  from: number;
  to: number;
  text: string;
}
export interface ClipSpan {
  /** Absolute real frame where the clip's first part starts. */
  startFrame: number;
  /** Absolute real frame where the clip's last part ends. */
  endFrame: number;
  /** endFrame - startFrame (includes any pauses inside the clip). */
  frames: number;
  /** The played parts (one for an uncut clip). */
  parts: ClipRow[];
}

export function makeStoryClock(data: {
  scenes: readonly SceneRow[];
  pauses: readonly PauseRow[];
  cues: readonly CueRow[];
  audio: readonly ClipRow[];
  clipParts: Readonly<Record<string, readonly ClipRow[]>>;
}) {
  const pauseCache: Record<string, PauseRow[]> = {};
  /** The pauses of one scene, sorted by atStory. */
  const pausesFor = (sceneId: string): PauseRow[] =>
    (pauseCache[sceneId] ??= byStory(data.pauses.filter((p) => p.sceneId === sceneId)));
  const sceneOf = (sceneId: string) => data.scenes.find((s) => s.sceneId === sceneId);

  /** Story frame of an absolute real frame, in a scene's authored local timing. */
  const absToStory = (absFrame: number, sceneId: string): number =>
    storyFrame(absFrame - (sceneOf(sceneId)?.startFrame ?? 0), pausesFor(sceneId));

  /**
   * Start and end (story frames, scene-local) of the first subtitle phrase of `sceneId` whose text contains
   * `cueSnippet`. Undefined when no phrase of that scene matches.
   */
  const cueLocalStory = (cueSnippet: string, sceneId: string): { from: number; to: number } | undefined => {
    const i = data.scenes.findIndex((s) => s.sceneId === sceneId);
    if (i < 0) return undefined;
    const s = data.scenes[i];
    const next = data.scenes[i + 1];
    const end = Math.min(s.startFrame + s.durationFrames, next ? next.startFrame : Infinity);
    const c = data.cues.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(cueSnippet));
    if (!c) return undefined;
    const pauses = pausesFor(sceneId);
    return { from: storyFrame(c.from - s.startFrame, pauses), to: storyFrame(c.to - s.startFrame, pauses) };
  };

  /** An original voice clip's window (absolute real frames), even when it has been cut into parts. */
  const clipSpan = (original: string): ClipSpan | undefined => {
    const row = data.audio.find((a) => a.file === original);
    const parts = data.clipParts[original] ?? (row ? [row] : undefined);
    if (!parts || !parts.length) return undefined;
    const startFrame = Math.min(...parts.map((p) => p.startFrame));
    const endFrame = Math.max(...parts.map((p) => p.startFrame + p.frames));
    return { startFrame, endFrame, frames: endFrame - startFrame, parts: [...parts] };
  };

  /** An original voice clip's window in a scene's story frames (scene-local). */
  const clipLocalStory = (original: string, sceneId: string): { from: number; to: number } | undefined => {
    const span = clipSpan(original);
    if (!span) return undefined;
    return { from: absToStory(span.startFrame, sceneId), to: absToStory(span.endFrame, sceneId) };
  };

  /**
   * React hook for a scene component: f = story frame (choreography), lifeF = real local frame (breathing,
   * blinks, idle life; pass to the rigs' lifeF prop), pause = the pause state at this frame.
   */
  const useStory = (sceneId: string): { f: number; lifeF: number; pause: PauseState } => {
    const lifeF = useCurrentFrame();
    const pauses = pausesFor(sceneId);
    return { f: storyFrame(lifeF, pauses), lifeF, pause: pauseState(lifeF, pauses) };
  };

  return { pausesFor, absToStory, cueLocalStory, clipSpan, clipLocalStory, useStory };
}

/* Episode 2 */
const EP02_CLOCK = makeStoryClock({
  scenes: EP02_SCENES,
  pauses: EP02_PAUSES,
  cues: EP02_CUES,
  audio: EP02_AUDIO,
  clipParts: EP02_CLIP_PARTS,
});
/** Episode 2: the pauses of one scene, sorted by atStory. */
export const pausesFor = EP02_CLOCK.pausesFor;
/** Episode 2: story frame (scene-local, authored timing) of an absolute real frame. */
export const absToStory = EP02_CLOCK.absToStory;
/** Episode 2: a subtitle phrase's start and end in the scene's story frames. */
export const cueLocalStory = EP02_CLOCK.cueLocalStory;
/** Episode 2: an original voice clip's whole window in absolute real frames (first part start, last part end). */
export const clipSpan = EP02_CLOCK.clipSpan;
/** Episode 2: an original voice clip's window in a scene's story frames. */
export const clipLocalStory = EP02_CLOCK.clipLocalStory;
/** Episode 2 scene hook: { f: story frame, lifeF: real local frame, pause: PauseState }. */
export const useStory = EP02_CLOCK.useStory;

/* Episode 3 (STO-17 pauses; the unsuffixed exports above stay Episode 2's) */
export const EP03_CLOCK = makeStoryClock({
  scenes: EP03_SCENES,
  pauses: EP03_PAUSES,
  cues: EP03_CUES,
  audio: EP03_AUDIO,
  clipParts: EP03_CLIP_PARTS,
});
/** Episode 3: the pauses of one scene, sorted by atStory. */
export const pausesFor3 = EP03_CLOCK.pausesFor;
/** Episode 3: story frame (scene-local, authored timing) of an absolute real frame. */
export const absToStory3 = EP03_CLOCK.absToStory;
/** Episode 3: a subtitle phrase's start and end in the scene's story frames. */
export const cueLocalStory3 = EP03_CLOCK.cueLocalStory;
/** Episode 3: an original voice clip's whole window in absolute real frames (first part start, last part end). */
export const clipSpan3 = EP03_CLOCK.clipSpan;
/** Episode 3: an original voice clip's window in a scene's story frames. */
export const clipLocalStory3 = EP03_CLOCK.clipLocalStory;
/** Episode 3 scene hook: { f: story frame, lifeF: real local frame, pause: PauseState }. */
export const useStory3 = EP03_CLOCK.useStory;

/* Episode 4 (scripts/build_ep04_timing.js; STO-19 pauses, action gaps, chapter breaks; Episode 2 and 3 exports above
   unchanged) */
export const EP04_CLOCK = makeStoryClock({
  scenes: EP04_SCENES,
  pauses: EP04_PAUSES,
  cues: EP04_CUES,
  audio: EP04_AUDIO,
  clipParts: EP04_CLIP_PARTS,
});
/** Episode 4: the pauses of one scene, sorted by atStory. */
export const pausesFor4 = EP04_CLOCK.pausesFor;
/** Episode 4: story frame (scene-local, authored timing) of an absolute real frame. */
export const absToStory4 = EP04_CLOCK.absToStory;
/** Episode 4: a subtitle phrase's start and end in the scene's story frames. */
export const cueLocalStory4 = EP04_CLOCK.cueLocalStory;
/** Episode 4: an original voice clip's whole window in absolute real frames (first part start, last part end). */
export const clipSpan4 = EP04_CLOCK.clipSpan;
/** Episode 4: an original voice clip's window in a scene's story frames. */
export const clipLocalStory4 = EP04_CLOCK.clipLocalStory;
const gapCache4: Record<string, Ep04Gap[]> = {};
/** Episode 4: the action gaps of one scene (story frames, sorted by fromStory). */
export const gapsFor4 = (sceneId: string): Ep04Gap[] =>
  (gapCache4[sceneId] ??= EP04_GAPS.filter((g) => g.sceneId === sceneId).sort((a, b) => a.fromStory - b.fromStory));
/** Episode 4: whether story frame `f` of a scene lies inside an action gap (and which beat). */
export const gapState4 = (sceneId: string, f: number): GapState => gapState(f, gapsFor4(sceneId));
/**
 * Episode 4 scene hook: { f: story frame (runs through action gaps, holds in pauses), lifeF: real local frame,
 * pause: PauseState, gap: GapState }.
 */
export const useStory4 = (sceneId: string): { f: number; lifeF: number; pause: PauseState; gap: GapState } => {
  const s = EP04_CLOCK.useStory(sceneId);
  return { ...s, gap: gapState4(sceneId, s.f) };
};
export interface BreakState {
  /** True while the absolute frame lies inside a chapter break (black, no scene mounted). */
  inBreak: boolean;
  /** The break at this frame, or null. */
  brk: Ep04Break | null;
  /** Progress through the break, 0..1 (0 outside). */
  t: number;
  /** Frames since the break began (0 outside). */
  elapsed: number;
}
/** Episode 4: whether an ABSOLUTE frame lies inside a chapter break (EP04_BREAKS). */
export const breakState4 = (absFrame: number): BreakState => {
  const b = EP04_BREAKS.find((x) => absFrame >= x.startFrame && absFrame < x.startFrame + x.frames);
  if (!b) return { inBreak: false, brk: null, t: 0, elapsed: 0 };
  const elapsed = absFrame - b.startFrame;
  return { inBreak: true, brk: b, t: b.frames > 0 ? elapsed / b.frames : 0, elapsed };
};

/* Episode 5 (added 2026-11-22; scripts/build_ep05_timing.js, EP05_* in ../episode05/timing; the approved table STO-20:
   6 pauses, 2 action gaps, 1 chapter break). The same helpers with a "5" suffix (useStory5, cueLocalStory5, clipSpan5,
   clipLocalStory5, pausesFor5, absToStory5, gapsFor5, gapState5, breakState5) or EP05_CLOCK. Episode 2, 3 and 4
   exports above unchanged.
   Action gaps come in three kinds (Ep05Gap.kind): "open", "after" (scene 02 AG1, at the 02a/02b boundary, beats
   a_cow_hides and b_haricharan_arrives) and, new in Episode 5, "end" (scene 02 AG2, after the scene's last line, beat
   a_haricharan_leaves): an end gap runs FIRST at the scene's end-pause point and the end pause (P3) holds right after
   it, so in scene 02 the story frames run ... last line, AG2 [791, 851), then P3 holds at story 851. Story frames
   include every gap (f runs through them), so gapState5 / useStory5(...).gap report an end gap like any other, with
   its kind; key the gap's action on f and its beats, and the P3 tableau on pause (index 2 of scene 02). */
export const EP05_CLOCK = makeStoryClock({
  scenes: EP05_SCENES,
  pauses: EP05_PAUSES,
  cues: EP05_CUES,
  audio: EP05_AUDIO,
  clipParts: EP05_CLIP_PARTS,
});
/** Episode 5: the pauses of one scene, sorted by atStory. */
export const pausesFor5 = EP05_CLOCK.pausesFor;
/** Episode 5: story frame (scene-local, authored timing) of an absolute real frame. */
export const absToStory5 = EP05_CLOCK.absToStory;
/** Episode 5: a subtitle phrase's start and end in the scene's story frames. */
export const cueLocalStory5 = EP05_CLOCK.cueLocalStory;
/** Episode 5: an original voice clip's whole window in absolute real frames (first part start, last part end). */
export const clipSpan5 = EP05_CLOCK.clipSpan;
/** Episode 5: an original voice clip's window in a scene's story frames. */
export const clipLocalStory5 = EP05_CLOCK.clipLocalStory;
const gapCache5: Record<string, Ep05Gap[]> = {};
/** Episode 5: the action gaps of one scene (story frames, sorted by fromStory; open, after and end kinds). */
export const gapsFor5 = (sceneId: string): Ep05Gap[] =>
  (gapCache5[sceneId] ??= EP05_GAPS.filter((g) => g.sceneId === sceneId).sort((a, b) => a.fromStory - b.fromStory));
/** Episode 5 gap state: the generic GapState plus the current gap's kind ("open" | "after" | "end"; null outside). */
export interface GapState5 extends GapState {
  kind: Ep05Gap["kind"] | null;
}
/** Episode 5: whether story frame `f` of a scene lies inside an action gap (which beat, and the gap's kind). */
export const gapState5 = (sceneId: string, f: number): GapState5 => {
  const gaps = gapsFor5(sceneId);
  const g = gapState(f, gaps);
  return { ...g, kind: g.inGap ? gaps[g.index].kind : null };
};
/**
 * Episode 5 scene hook: { f: story frame (runs through action gaps, end gaps included; holds in pauses), lifeF: real
 * local frame, pause: PauseState, gap: GapState5 }.
 */
export const useStory5 = (sceneId: string): { f: number; lifeF: number; pause: PauseState; gap: GapState5 } => {
  const s = EP05_CLOCK.useStory(sceneId);
  return { ...s, gap: gapState5(sceneId, s.f) };
};
/** Episode 5: whether an ABSOLUTE frame lies inside a chapter break (EP05_BREAKS; same shape as Episode 4's). */
export const breakState5 = (absFrame: number): BreakState => {
  const b = EP05_BREAKS.find((x) => absFrame >= x.startFrame && absFrame < x.startFrame + x.frames);
  if (!b) return { inBreak: false, brk: null, t: 0, elapsed: 0 };
  const elapsed = absFrame - b.startFrame;
  return { inBreak: true, brk: b, t: b.frames > 0 ? elapsed / b.frames : 0, elapsed };
};

/* Episode 6 (added 2026-11-22; scripts/build_ep06_timing.js, EP06_* in ../episode06/timing; the approved table STO-21:
   6 pauses, 2 action gaps, 1 chapter break). The same helpers with a "6" suffix (useStory6, cueLocalStory6, clipSpan6,
   clipLocalStory6, pausesFor6, absToStory6, gapsFor6, gapState6, breakState6) or EP06_CLOCK, exactly as Episode 5's.
   Episode 2 to 5 exports above unchanged (this block is appended, its imports with it).
   Action gaps: scene 01 has an "end" gap (AG1+AG2, beats a_father_leaves and b_brother_comes_out) that runs FIRST at
   the scene's end-pause point, then P3 holds right after it, then chapter break 1; scene 02 has an "after" gap (AG3, at
   the 02a/02b boundary, beats a_friend_returns and b_friend_stalks_off). Story frames include every gap (f runs
   through them); key the gap's action on f and its beats (gapState6 / useStory6(...).gap), the P3 tableaux on pause. */
import { EP06_AUDIO, EP06_BREAKS, EP06_CLIP_PARTS, EP06_GAPS, EP06_PAUSES, EP06_SCENES } from "../episode06/timing";
import type { Ep06Gap, Ep06Break } from "../episode06/timing";
import { EP06_CUES } from "../episode06/subtitles";
export const EP06_CLOCK = makeStoryClock({
  scenes: EP06_SCENES,
  pauses: EP06_PAUSES,
  cues: EP06_CUES,
  audio: EP06_AUDIO,
  clipParts: EP06_CLIP_PARTS,
});
/** Episode 6: the pauses of one scene, sorted by atStory. */
export const pausesFor6 = EP06_CLOCK.pausesFor;
/** Episode 6: story frame (scene-local, authored timing) of an absolute real frame. */
export const absToStory6 = EP06_CLOCK.absToStory;
/** Episode 6: a subtitle phrase's start and end in the scene's story frames. */
export const cueLocalStory6 = EP06_CLOCK.cueLocalStory;
/** Episode 6: an original voice clip's whole window in absolute real frames (first part start, last part end). */
export const clipSpan6 = EP06_CLOCK.clipSpan;
/** Episode 6: an original voice clip's window in a scene's story frames. */
export const clipLocalStory6 = EP06_CLOCK.clipLocalStory;
const gapCache6: Record<string, Ep06Gap[]> = {};
/** Episode 6: the action gaps of one scene (story frames, sorted by fromStory; open, after and end kinds). */
export const gapsFor6 = (sceneId: string): Ep06Gap[] =>
  (gapCache6[sceneId] ??= EP06_GAPS.filter((g: Ep06Gap) => g.sceneId === sceneId).sort((a: Ep06Gap, b: Ep06Gap) => a.fromStory - b.fromStory));
/** Episode 6 gap state: the generic GapState plus the current gap's kind ("open" | "after" | "end"; null outside). */
export interface GapState6 extends GapState {
  kind: Ep06Gap["kind"] | null;
}
/** Episode 6: whether story frame `f` of a scene lies inside an action gap (which beat, and the gap's kind). */
export const gapState6 = (sceneId: string, f: number): GapState6 => {
  const gaps = gapsFor6(sceneId);
  const g = gapState(f, gaps);
  return { ...g, kind: g.inGap ? gaps[g.index].kind : null };
};
/**
 * Episode 6 scene hook: { f: story frame (runs through action gaps, end gaps included; holds in pauses), lifeF: real
 * local frame, pause: PauseState, gap: GapState6 }.
 */
export const useStory6 = (sceneId: string): { f: number; lifeF: number; pause: PauseState; gap: GapState6 } => {
  const s = EP06_CLOCK.useStory(sceneId);
  return { ...s, gap: gapState6(sceneId, s.f) };
};
/** Episode 6: whether an ABSOLUTE frame lies inside a chapter break (EP06_BREAKS; same shape as Episode 4's). */
export const breakState6 = (absFrame: number): BreakState => {
  const b = EP06_BREAKS.find((x: Ep06Break) => absFrame >= x.startFrame && absFrame < x.startFrame + x.frames);
  if (!b) return { inBreak: false, brk: null, t: 0, elapsed: 0 };
  const elapsed = absFrame - b.startFrame;
  return { inBreak: true, brk: b, t: b.frames > 0 ? elapsed / b.frames : 0, elapsed };
};
