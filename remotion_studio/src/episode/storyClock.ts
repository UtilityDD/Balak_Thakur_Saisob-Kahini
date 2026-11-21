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
 * Any other episode: makeStoryClock({ scenes, pauses, cues, audio, clipParts }) from its generated timing.
 */
import { useCurrentFrame } from "remotion";
import { EP02_AUDIO, EP02_CLIP_PARTS, EP02_PAUSES, EP02_SCENES } from "../episode02/timing";
import { EP02_CUES } from "../episode02/subtitles";
import { EP03_AUDIO, EP03_CLIP_PARTS, EP03_PAUSES, EP03_SCENES } from "../episode03/timing";
import { EP03_CUES } from "../episode03/subtitles";

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
