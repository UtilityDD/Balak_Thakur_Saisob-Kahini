#!/usr/bin/env node
/**
 * Timing generator for the Ghibli Episode 5 conversation-led rewrite (STO-23; composition `Episode05GhibliRewrite`).
 * Written 2026-11-26 from the DRAFT blueprint
 *   03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/Episode_05_FULL_PRODUCTION_BLUEPRINT.md
 * (sections 4, 5, 7, 10). Episode 4 Ghibli's timing.ts / subtitles.ts are the shape it mirrors.
 *
 * RE-RUN (from the worktree root, Git Bash) every time voices land or change, or lines.json changes:
 *     python scripts/prepare_ep05g_voices.py      # copies + levels the WAVs, writes audio_durations.json
 *     node scripts/build_ep05g_timing.js          # this script
 *   then re-bundle before stills (REN-BUNDLE-01). The scene code reads only spans and cues, so it follows the new lengths.
 *
 * INPUTS
 *   remotion_studio/src/ghibli_pipeline/episode05_rewrite/lines.json   every line (file, scene, speaker, text, estSec) and
 *       the scene layout: per scene an ordered `items` list of lines, pauses (P1..P11), action gaps (AG1..AG14); the chapter
 *       break CB1 is its own scene; intro, source card and outro are scenes with one line each.
 *   remotion_studio/public/audio/ep05_ghibli_rewrite/audio_durations.json   measured clips (written by the prepare script).
 *       A line whose WAV is not there yet falls back to its blueprint estimate (estSec) and is marked `estimated: true`
 *       (EP05R_ESTIMATED_FILES); its captions are then timed by characters only.
 *
 * LAYOUT (24 fps; all frame numbers integers)
 *   - Scenes are laid end to end. A scene opens with `open` frames (default: 0 if its first item is an action gap, else
 *     layout.storyOpenFrames), then its items in order, then `tail` frames; `minFrames` pads short scenes (intro).
 *   - Line after line: layout.lineGapFrames (layout.speakerChangeGapFrames when the speaker changes). A pause starts
 *     layout.pauseAfterLineFrames after the line it follows, an action gap layout.gapAfterLineFrames after it; a line that
 *     follows a pause or gap starts right at its end. Pause / gap / line lengths: round(sec * 24) or the clip's frames.
 *   - Every item's `after` names the line or beat it must follow; a mismatch is reported (the order in `items` wins).
 *
 * OUTPUTS (GENERATED: never edit by hand)
 *   remotion_studio/src/ghibli_pipeline/episode05_rewrite/timing.ts
 *       EP05R_TOTAL_FRAMES, EP05R_SCENES {sceneId, kind, startFrame, durationFrames}, EP05R_AUDIO {file, sceneId, startFrame,
 *       localStart, frames, role, speaker, inner, estimated}, EP05R_BEATS (pauses, gaps, the chapter break), EP05R_SPANS
 *       (scene-local windows by key: line file names, "P3", "AG10_the_cow", "open", "tail"), EP05R_RMS (per-frame voice
 *       envelopes) and the helpers ep05rScene, ep05rSpan, ep05rAbs, ep05rLine, ep05rRms, ep05rSpeakRms, ep05rRoleRms,
 *       ep05rTalking.
 *   remotion_studio/src/ghibli_pipeline/episode05_rewrite/subtitles.ts
 *       EP05R_CUES {from, to, text, speaker, file} (absolute frames) with TTL-14 one-line captions, plus ep05rCueLocal and
 *       ep05rPhraseLocal (scene-local frame of a narration phrase, for camera keys tied to cues: CAM-13).
 *
 * CAPTIONS (TTL-14: always one line, split at natural breaks)
 *   Each line's text is split at its `<short pause>` marks (real silences), then any piece longer than captions.maxChars
 *   (44) is split again at the best natural break: danda / ! / ? first, then a dash, then a comma, then a word boundary,
 *   the split closest to the middle. Split frames: the proportional position (characters plus a little weight for each
 *   pause) is moved to the middle of the quietest run of the clip's RMS envelope nearby. Every piece lasts at least
 *   captions.minPieceFrames (18); a shorter piece is merged with a neighbour when the two fit on one line, else its
 *   boundary is moved. The intro and the source card have no captions (`caption: false`, the title page shows none).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EP_DIR = path.join(ROOT, "remotion_studio", "src", "ghibli_pipeline", "episode05_rewrite");
const LINES_JSON = path.join(EP_DIR, "lines.json");
const DURATIONS_JSON = path.join(ROOT, "remotion_studio", "public", "audio", "ep05_ghibli_rewrite", "audio_durations.json");
const OUT_TIMING = path.join(EP_DIR, "timing.ts");
const OUT_SUBS = path.join(EP_DIR, "subtitles.ts");

const doc = JSON.parse(fs.readFileSync(LINES_JSON, "utf8"));
const FPS = doc.fps || 24;
const LAY = Object.assign(
  {
    lineGapFrames: 10,
    speakerChangeGapFrames: 12,
    gapAfterLineFrames: 6,
    pauseAfterLineFrames: 0,
    storyOpenFrames: 12,
    storyTailFrames: 12,
  },
  doc.layout || {},
);
const CAP = Object.assign({ maxChars: 44, minPieceFrames: 18, pauseMarker: "<short pause>" }, doc.captions || {});

let measured = {};
if (fs.existsSync(DURATIONS_JSON)) {
  measured = JSON.parse(fs.readFileSync(DURATIONS_JSON, "utf8"));
} else {
  console.warn(`NOTE: ${path.relative(ROOT, DURATIONS_JSON)} not found: every line uses its estimate.`);
}

const warnings = [];
const warn = (m) => {
  warnings.push(m);
  console.warn("WARN " + m);
};

/* ------------------------------------------------------------------ */
/* Lines                                                               */
/* ------------------------------------------------------------------ */

const LINES = new Map();
for (const ln of doc.lines) {
  if (LINES.has(ln.file)) throw new Error(`lines.json: duplicate file ${ln.file}`);
  const m = measured[ln.file];
  const ok = m && typeof m === "object" && Number(m.frames) > 0;
  const frames = ok ? Number(m.frames) : Math.ceil(Number(ln.estSec) * FPS);
  const env = ok && Array.isArray(m.rms_envelope) ? m.rms_envelope.map(Number) : null;
  LINES.set(ln.file, { ...ln, frames, env, estimated: !ok });
}
for (const k of Object.keys(measured)) {
  if (!k.startsWith("_") && !LINES.has(k)) warn(`audio_durations.json lists ${k}, which lines.json does not name`);
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const scenesOut = [];
const audioOut = [];
const beatsOut = [];
const spansOut = {};
const usedLines = new Set();
let cursor = 0;

for (const sc of doc.scenes) {
  const spans = {};
  const startFrame = cursor;
  if (sc.kind === "break") {
    const frames = Number(sc.frames || 29);
    spans.CB1 = { from: 0, to: frames, frames };
    beatsOut.push({ name: sc.beatName || "CB1", kind: "break", sceneId: sc.sceneId, startFrame, localStart: 0, frames, after: null });
    scenesOut.push({ sceneId: sc.sceneId, kind: sc.kind, startFrame, durationFrames: frames });
    spansOut[sc.sceneId] = spans;
    cursor += frames;
    continue;
  }
  const items = sc.items || [];
  const firstIsBeat = items.length > 0 && !items[0].line;
  let local = sc.open !== undefined ? Number(sc.open) : firstIsBeat ? 0 : LAY.storyOpenFrames;
  if (local > 0) spans.open = { from: 0, to: local, frames: local };
  let prev = null; // { type: "line"|"beat", name, speaker }
  for (const it of items) {
    if (it.line) {
      const ln = LINES.get(it.line);
      if (!ln) throw new Error(`scene ${sc.sceneId}: unknown line ${it.line}`);
      if (usedLines.has(it.line)) throw new Error(`line ${it.line} is placed twice`);
      usedLines.add(it.line);
      if (ln.sceneId !== sc.sceneId) warn(`${it.line}: lines.json sceneId ${ln.sceneId} but placed in ${sc.sceneId}`);
      if (prev && prev.type === "line") {
        local += it.gapBefore !== undefined ? Number(it.gapBefore) : prev.speaker === ln.speaker ? LAY.lineGapFrames : LAY.speakerChangeGapFrames;
      } else if (it.gapBefore !== undefined) {
        local += Number(it.gapBefore);
      }
      const w = { from: local, to: local + ln.frames, frames: ln.frames };
      spans[ln.file] = w;
      audioOut.push({
        file: ln.file,
        sceneId: sc.sceneId,
        startFrame: startFrame + w.from,
        localStart: w.from,
        frames: ln.frames,
        role: ln.role,
        speaker: ln.speaker,
        inner: !!ln.inner,
        estimated: ln.estimated,
      });
      local = w.to;
      prev = { type: "line", name: ln.file, speaker: ln.speaker };
    } else if (it.pause || it.gap) {
      const name = it.pause || it.gap;
      const kind = it.pause ? "pause" : "gap";
      const want = it.after === undefined ? undefined : it.after;
      const prevName = prev ? prev.name : null;
      if (want !== undefined && want !== prevName) warn(`${sc.sceneId} ${name}: after "${want}" but it follows "${prevName}" (order wins)`);
      if (prev && prev.type === "line") local += kind === "pause" ? LAY.pauseAfterLineFrames : LAY.gapAfterLineFrames;
      const frames = Math.max(1, Math.round(Number(it.sec) * FPS));
      if (spans[name]) throw new Error(`${sc.sceneId}: duplicate beat ${name}`);
      spans[name] = { from: local, to: local + frames, frames };
      beatsOut.push({ name, kind, sceneId: sc.sceneId, startFrame: startFrame + local, localStart: local, frames, after: prevName, note: it.note || "" });
      local += frames;
      prev = { type: "beat", name, speaker: null };
    } else {
      throw new Error(`${sc.sceneId}: item without line/pause/gap: ${JSON.stringify(it)}`);
    }
  }
  const tail = sc.tail !== undefined ? Number(sc.tail) : LAY.storyTailFrames;
  if (tail > 0) spans.tail = { from: local, to: local + tail, frames: tail };
  let dur = local + tail;
  if (sc.minFrames && dur < sc.minFrames) {
    if (spans.tail) {
      spans.tail.to += sc.minFrames - dur;
      spans.tail.frames = spans.tail.to - spans.tail.from;
    }
    dur = sc.minFrames;
  }
  scenesOut.push({ sceneId: sc.sceneId, kind: sc.kind, startFrame, durationFrames: dur });
  spansOut[sc.sceneId] = spans;
  cursor += dur;
}
for (const f of LINES.keys()) if (!usedLines.has(f)) warn(`line ${f} is in lines.json but not placed in any scene`);
const TOTAL = cursor;

/* ------------------------------------------------------------------ */
/* Captions (TTL-14)                                                   */
/* ------------------------------------------------------------------ */

const clen = (s) => Array.from(s).length;
const CLOSERS = new Set(["'", "’", '"', "”", ")"]);

/** Candidate break positions (index after which to cut) with priorities: 3 sentence end, 2 dash, 1 comma, 0 space. */
const breakCandidates = (chars) => {
  const out = [];
  for (let i = 0; i < chars.length - 1; i++) {
    const c = chars[i];
    let pri = -1;
    if (c === "।" || c === "!" || c === "?") pri = 3;
    else if (c === "—" || c === "–") pri = 2;
    else if (c === "," || c === ";" || c === ":") pri = 1;
    else if (c === " ") pri = 0;
    if (pri < 0) continue;
    // keep "?!" / "!'" together: cut after the last of a run of punctuation and closing quotes
    let j = i;
    if (pri > 0) {
      while (j + 1 < chars.length && (chars[j + 1] === "!" || chars[j + 1] === "?" || CLOSERS.has(chars[j + 1]))) j++;
    }
    out.push({ at: pri === 0 ? i : j + 1, pri, punctGap: pri === 3 ? 2 : pri >= 1 ? 1 : 0 });
  }
  return out;
};

/** Split one string into pieces of at most `max` characters at the best natural breaks. */
const splitPiece = (text, max) => {
  const t = text.trim();
  if (clen(t) <= max) return [{ text: t, gapUnits: 0 }];
  const chars = Array.from(t);
  const cands = breakCandidates(chars)
    .map((c) => {
      const left = chars.slice(0, c.at).join("").trim();
      const right = chars.slice(c.at).join("").trim();
      return { ...c, left, right, ll: clen(left), rl: clen(right) };
    })
    .filter((c) => c.ll >= 4 && c.rl >= 4);
  if (!cands.length) return [{ text: t, gapUnits: 0 }];
  const mid = chars.length / 2;
  const fits = cands.filter((c) => c.ll <= max && c.rl <= max);
  const pool = fits.length ? fits : cands;
  const best = pool.reduce((a, b) => {
    if (b.pri !== a.pri) {
      // a stronger break wins unless it is badly unbalanced (one side under a quarter of the line)
      const bal = (c) => Math.min(c.ll, c.rl) / chars.length;
      if (b.pri > a.pri && bal(b) >= 0.22) return b;
      if (a.pri > b.pri && bal(a) >= 0.22) return a;
    }
    return Math.abs(b.at - mid) < Math.abs(a.at - mid) ? b : a;
  });
  const L = splitPiece(best.left, max);
  const R = splitPiece(best.right, max);
  R[0].gapUnits = best.punctGap;
  return [...L, ...R];
};

const PAUSE_UNITS = 5; // a <short pause> (about 0.45 s) in characters of speech

/** Pieces of a line's text, each with the speech-time weight of the gap before it. */
const piecesOfLine = (text) => {
  const parts = text
    .split(CAP.pauseMarker)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out = [];
  parts.forEach((p, i) => {
    const sub = splitPiece(p, CAP.maxChars);
    sub[0].gapUnits = i === 0 ? 0 : PAUSE_UNITS;
    out.push(...sub);
  });
  return out;
};

const smoothEnv = (env) => env.map((v, i) => (v + (env[i - 1] ?? v) + (env[i + 1] ?? v)) / 3);

/** Frame (clip-local) for a split: the middle of the quietest run near `target`. */
const quietNear = (env, target, lo, hi) => {
  if (!env) return Math.round(target);
  const s = smoothEnv(env);
  let best = -1;
  let bestScore = Infinity;
  for (let i = Math.max(lo, 1); i <= Math.min(hi, s.length - 2); i++) {
    const score = s[i] + 0.004 * Math.abs(i - target);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0) return Math.round(target);
  const floor = s[best] + 0.02;
  let a = best;
  let b = best;
  while (a - 1 >= lo && s[a - 1] <= floor) a--;
  while (b + 1 <= hi && s[b + 1] <= floor) b++;
  return Math.round((a + b) / 2);
};

const cues = [];
for (const a of audioOut) {
  const ln = LINES.get(a.file);
  if (ln.caption === false) continue;
  const F = ln.frames;
  const env = ln.env;
  let vs = 0;
  let ve = F;
  if (env) {
    const TH = 0.08;
    const first = env.findIndex((v) => v > TH);
    let last = -1;
    for (let i = env.length - 1; i >= 0; i--)
      if (env[i] > TH) {
        last = i;
        break;
      }
    if (first >= 0 && last > first) {
      vs = Math.max(0, first - 1);
      ve = Math.min(F, last + 2);
    }
  }
  let pieces = piecesOfLine(ln.text);
  // proportional targets in speech units, moved to the quietest frame nearby
  const solve = (ps) => {
    const units = ps.map((p, i) => (i === 0 ? 0 : p.gapUnits) + clen(p.text));
    const total = units.reduce((x, y) => x + y, 0) || 1;
    const bounds = [vs];
    let cum = 0;
    for (let i = 1; i < ps.length; i++) {
      cum += clen(ps[i - 1].text);
      const tgtUnits = cum + ps[i].gapUnits / 2;
      cum += ps[i].gapUnits;
      const target = vs + (tgtUnits / total) * (ve - vs);
      const W = Math.max(8, Math.round(0.12 * (ve - vs)));
      const lo = Math.max(bounds[i - 1] + 1, Math.round(target - W));
      const hi = Math.min(ve - 1, Math.round(target + W));
      bounds.push(hi > lo ? quietNear(env, target, lo, hi) : Math.round(target));
    }
    bounds.push(Math.min(F, ve + 6));
    return bounds;
  };
  let bounds = solve(pieces);
  // MIN piece length: merge a short piece into a neighbour when the two fit on one line, else move the boundary
  for (let guard = 0; guard < 50; guard++) {
    let k = -1;
    for (let i = 0; i < pieces.length; i++) if (bounds[i + 1] - bounds[i] < CAP.minPieceFrames) k = i;
    if (k < 0 || pieces.length === 1) break;
    const lenOf = (i) => bounds[i + 1] - bounds[i];
    const canL = k > 0 && clen(pieces[k - 1].text) + 1 + clen(pieces[k].text) <= CAP.maxChars;
    const canR = k < pieces.length - 1 && clen(pieces[k].text) + 1 + clen(pieces[k + 1].text) <= CAP.maxChars;
    if (canL || canR) {
      const j = canL && canR ? (lenOf(k - 1) <= lenOf(k + 1) ? k - 1 : k) : canL ? k - 1 : k;
      const merged = { text: `${pieces[j].text} ${pieces[j + 1].text}`, gapUnits: pieces[j].gapUnits };
      pieces = [...pieces.slice(0, j), merged, ...pieces.slice(j + 2)];
      bounds = [...bounds.slice(0, j + 1), ...bounds.slice(j + 2)];
      continue;
    }
    // steal from the longer neighbour
    const need = CAP.minPieceFrames - lenOf(k);
    if (k < pieces.length - 1 && (k === 0 || lenOf(k + 1) >= lenOf(k - 1)) && lenOf(k + 1) - need >= CAP.minPieceFrames) bounds[k + 1] += need;
    else if (k > 0 && lenOf(k - 1) - need >= CAP.minPieceFrames) bounds[k] -= need;
    else {
      warn(`${a.file}: caption piece "${pieces[k].text}" is only ${lenOf(k)} f and cannot be lengthened`);
      break;
    }
  }
  pieces.forEach((p, i) => {
    if (clen(p.text) > CAP.maxChars) warn(`${a.file}: caption piece over ${CAP.maxChars} chars (${clen(p.text)}): ${p.text}`);
    cues.push({ from: a.startFrame + bounds[i], to: a.startFrame + bounds[i + 1], text: p.text, speaker: ln.speaker, file: a.file });
  });
}
cues.sort((x, y) => x.from - y.from);
for (let i = 0; i + 1 < cues.length; i++) if (cues[i].to > cues[i + 1].from) cues[i].to = cues[i + 1].from;

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

const estimatedFiles = audioOut.filter((a) => a.estimated).map((a) => a.file);
const source = estimatedFiles.length === 0 ? "measured" : estimatedFiles.length === audioOut.length ? "estimated" : "mixed";
const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const HEADER = `// GENERATED by scripts/build_ep05g_timing.js — do not edit. Re-run: python scripts/prepare_ep05g_voices.py && node scripts/build_ep05g_timing.js
// Ghibli Episode 5 rewrite (STO-23). Source: lines.json + public/audio/ep05_ghibli_rewrite/audio_durations.json. Built ${stamp}.
// Timing source: ${source} (${audioOut.length - estimatedFiles.length} of ${audioOut.length} clips measured${estimatedFiles.length ? `; ${estimatedFiles.length} on blueprint estimates` : ""}).
`;

const J = (v) => JSON.stringify(v);
const rmsObj = {};
for (const a of audioOut) {
  const ln = LINES.get(a.file);
  if (ln.env) rmsObj[a.file] = ln.env;
}

const timingTs = `${HEADER}
export interface Ep05RSceneSpan {
  sceneId: string;
  kind: string;
  startFrame: number;
  durationFrames: number;
}
export interface Ep05RAudioEvent {
  file: string;
  sceneId: string;
  startFrame: number;
  localStart: number;
  frames: number;
  /** narrator | charu | surendra | balak | binoy | haricharan | clerkSenior | clerkJunior */
  role: string;
  /** caption chip as SeriesSubtitles shows it */
  speaker: string;
  /** Balak's inner voice (mouth closed) */
  inner: boolean;
  /** true while the WAV is missing: the length is the blueprint estimate and the clip must not be played */
  estimated: boolean;
}
export interface Ep05RWindow {
  from: number;
  to: number;
  frames: number;
}
export interface Ep05RBeat {
  name: string;
  kind: "pause" | "gap" | "break";
  sceneId: string;
  startFrame: number;
  localStart: number;
  frames: number;
  after: string | null;
  note?: string;
}

export const EP05R_FPS = ${FPS};
export const EP05R_TOTAL_FRAMES = ${TOTAL};
export const EP05R_TIMING_SOURCE: "measured" | "estimated" | "mixed" = ${J(source)};
/** Clips still on blueprint estimates (WAV missing when the generator ran). */
export const EP05R_ESTIMATED_FILES: readonly string[] = ${J(estimatedFiles)};

export const EP05R_SCENES: readonly Ep05RSceneSpan[] = [
${scenesOut.map((s) => `  ${J(s)},`).join("\n")}
];

export const EP05R_AUDIO: readonly Ep05RAudioEvent[] = [
${audioOut.map((a) => `  ${J(a)},`).join("\n")}
];

/** Pauses (P1..P11), action gaps (AG1..AG14) and the chapter break, absolute and scene-local. */
export const EP05R_BEATS: readonly Ep05RBeat[] = [
${beatsOut.map((b) => `  ${J(b)},`).join("\n")}
];

/** Scene-local windows by key: line file names ("02c_Charu_NoMark.wav"), beats ("P3", "AG10_the_cow"), "open", "tail". */
export const EP05R_SPANS: Record<string, Record<string, Ep05RWindow>> = {
${Object.entries(spansOut)
  .map(([sid, w]) => `  ${J(sid)}: {\n${Object.entries(w).map(([k, v]) => `    ${J(k)}: ${J(v)},`).join("\n")}\n  },`)
  .join("\n")}
};

/** Per-frame voice envelopes (0..1, peak = 1) of the measured clips. */
export const EP05R_RMS: Record<string, readonly number[]> = {
${Object.entries(rmsObj).map(([k, v]) => `  ${J(k)}: ${J(v)},`).join("\n")}
};

export const ep05rScene = (sceneId: string): Ep05RSceneSpan =>
  EP05R_SCENES.find((s) => s.sceneId === sceneId) ?? { sceneId, kind: "missing", startFrame: 0, durationFrames: 1 };

/** Scene-local window of a line file or a beat; a missing key gives { 0, 1, 1 } (never throws). */
export const ep05rSpan = (sceneId: string, key: string): Ep05RWindow => EP05R_SPANS[sceneId]?.[key] ?? { from: 0, to: 1, frames: 1 };

/** Absolute window of a line file or a beat in a scene. */
export const ep05rAbs = (sceneId: string, key: string): Ep05RWindow => {
  const b = ep05rScene(sceneId).startFrame;
  const w = ep05rSpan(sceneId, key);
  return { from: b + w.from, to: b + w.to, frames: w.frames };
};

/** Absolute window of a line, wherever it sits. */
export const ep05rLine = (file: string): Ep05RWindow => {
  const a = EP05R_AUDIO.find((x) => x.file === file);
  return a ? { from: a.startFrame, to: a.startFrame + a.frames, frames: a.frames } : { from: 0, to: 1, frames: 1 };
};

/** Voice envelope of one clip at a scene-local frame (0 outside it or while the clip is still an estimate). */
export const ep05rRms = (sceneId: string, file: string, localFrame: number): number => {
  const w = EP05R_SPANS[sceneId]?.[file];
  if (!w || localFrame < w.from || localFrame >= w.to) return 0;
  const env = EP05R_RMS[file];
  if (!env) return 0;
  return env[Math.min(env.length - 1, Math.max(0, Math.floor(localFrame - w.from)))] ?? 0;
};

export const ep05rSpeakRms = (sceneId: string, files: readonly string[], localFrame: number): number => {
  let m = 0;
  for (const f of files) m = Math.max(m, ep05rRms(sceneId, f, localFrame));
  return m;
};

/** Mouth envelope of a role in a scene (inner-voice lines excluded: the mouth stays closed). */
export const ep05rRoleRms = (sceneId: string, role: string, localFrame: number): number => {
  let m = 0;
  for (const a of EP05R_AUDIO) if (a.sceneId === sceneId && a.role === role && !a.inner) m = Math.max(m, ep05rRms(sceneId, a.file, localFrame));
  return m;
};

/** True while a role has a spoken (not inner) line at this scene-local frame; works on estimates too. */
export const ep05rTalking = (sceneId: string, role: string, localFrame: number): boolean =>
  EP05R_AUDIO.some((a) => a.sceneId === sceneId && a.role === role && !a.inner && localFrame >= a.localStart && localFrame < a.localStart + a.frames);
`;

const subsTs = `${HEADER}
import type { SubtitleCue } from "../../episode/SeriesSubtitles";
import { ep05rScene } from "./timing";

export interface Ep05RCue extends SubtitleCue {
  speaker: string;
  /** the voice clip this caption belongs to */
  file: string;
}

/** TTL-14 one-line captions (absolute frames). The intro and the source card have none. */
export const EP05R_CUES: Ep05RCue[] = [
${cues.map((c) => `  ${J(c)},`).join("\n")}
];

/** Scene-local window of the first caption in a scene containing \`snippet\`. */
export const ep05rCueLocal = (sceneId: string, snippet: string): { from: number; to: number } | undefined => {
  const s = ep05rScene(sceneId);
  const end = s.startFrame + s.durationFrames;
  const c = EP05R_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  return c ? { from: c.from - s.startFrame, to: c.to - s.startFrame } : undefined;
};

/** Scene-local frame where a phrase starts (proportional inside its caption), or \`fallback\`. For camera keys (CAM-13). */
export const ep05rPhraseLocal = (sceneId: string, snippet: string, fallback: number): number => {
  const s = ep05rScene(sceneId);
  const end = s.startFrame + s.durationFrames;
  const c = EP05R_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  if (!c) return fallback;
  const at = Array.from(c.text.slice(0, c.text.indexOf(snippet))).length / Math.max(1, Array.from(c.text).length);
  return Math.round(c.from - s.startFrame + at * (c.to - c.from));
};
`;

fs.writeFileSync(OUT_TIMING, timingTs, "utf8");
fs.writeFileSync(OUT_SUBS, subsTs, "utf8");

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const sec = (f) => (f / FPS).toFixed(1);
console.log(`\nEpisode 5 rewrite: ${TOTAL} frames (${Math.floor(TOTAL / FPS / 60)}:${(TOTAL / FPS % 60).toFixed(1).padStart(4, "0")}), timing ${source}`);
for (const s of scenesOut) console.log(`  ${s.sceneId.padEnd(32)} ${String(s.startFrame).padStart(5)}  ${String(s.durationFrames).padStart(5)} f  ${sec(s.durationFrames).padStart(6)} s`);
console.log(`  ${audioOut.length} clips (${estimatedFiles.length} estimated), ${beatsOut.length} beats, ${cues.length} captions`);
const longest = cues.reduce((m, c) => Math.max(m, clen(c.text)), 0);
const shortest = cues.reduce((m, c) => Math.min(m, c.to - c.from), Infinity);
console.log(`  longest caption ${longest} chars, shortest ${shortest} f`);
if (estimatedFiles.length) console.log(`  estimated: ${estimatedFiles.join(", ")}`);
console.log(`Wrote ${path.relative(ROOT, OUT_TIMING)} and ${path.relative(ROOT, OUT_SUBS)}`);
if (warnings.length) console.log(`${warnings.length} warning(s) above.`);
