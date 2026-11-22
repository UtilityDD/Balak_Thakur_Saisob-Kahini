#!/usr/bin/env node
/**
 * Builds Episode 5 ("কচ্ছপ খেলা ও গাভী রক্ষা": the tortoise play at the Krishnanagar kachari, book ch. 8; the cow
 * and the cucumber vine in the banana grove, book ch. 9) from its scene manifest, voice durations and Bengali SRT.
 * Written 2026-11-22 as a copy of scripts/build_ep04_timing.js (TIM-EP04-01): same intro, source card, outro,
 * sentence-silence cutting into _pN parts, PAUSES, action GAPS and chapter BREAKS. The tables hold the director's
 * approved plan (STO-20, 2026-11-22: 03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/
 * Ep05_Shots_and_Pauses_DRAFT.md, "Notes for whoever codes this"): 6 pauses (9.5 s), 2 action gaps in scene 02 (5 s),
 * 1 chapter break (1 s) after scene 01. New for Episode 5: the "end" action-gap kind (AG2) and caption control
 * (PHRASE_SPLITS, PHRASE_ANCHORS: phrase starts pinned to the voice).
 * Voice clips go on the absolute timeline (EP05_AUDIO); each manifest scene becomes one visual scene. Writes
 * remotion_studio/src/episode05/timing.ts and subtitles.ts (frames at 24 fps). Story scenes: 01_tortoise_play,
 * 02_banana_grove_cow_rescue; then the outro 99 (series template, no pauses, no gaps).
 *
 * VOICES: public/audio/ep05 holds the Normalized_48k clips from 03_Episodes/<EP>/02_Audio/Voice_WAVs/Normalized_48k
 * (48 kHz, already trimmed: their lengths match audio_durations.json and the SRT; the 24 kHz WAVs one folder up are
 * the untrimmed raw takes), LINEAR gain only (2026-11-22): every clip already met -16 LUFS +-0.5 at -1.5 dBTP, so they
 * are byte copies (pre-level copies in _original_levels/); 00a_Source_Attribution.wav is Episode 4's levelled card
 * (identical to Episodes 3 and 4). The SRT's cues match these clips' lengths exactly (6 cues for 6 clips, 0.45 s gaps).
 *
 * SILENCES: every run writes scripts/ep05_silences.txt: for every voice clip, its silences (silencedetect -45 dB /
 * 0.12 s on the played file, start and length in the clip's own seconds), which are lead / trail room tone and which
 * are interior candidates, and the subtitle phrase ending nearest each candidate. Put "after" pauses and gaps at
 * those true silences (or name one with clip + silence).
 *
 * SOURCE CARD (as Episode 3): 00a_Source_Attribution.wav at cues[0].end + 0.3 s; every later clip and cue moves
 * later by SOURCE_DUR + 0.5 s. Scene 00b_source_attribution spans it.
 *
 * NEXT-EPISODE GLIMPSE: the manifest has no 98 scene, and Episode 5's outro narration carries the
 * "আসছে পরের পর্ব" teaser (Episode 6, "জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী") well inside its 24.9 s, so the
 * glimpse (TTL-10a) is a layer inside the outro and there is no extra 98 segment (NEXT_EPISODE_FRAMES = 0; set it > 0
 * to append one as Episode 3 does).
 *
 * PAUSES INSIDE SCENES (rule CAM-14; mechanism of scripts/build_ep02_timing.js / build_ep03_timing.js, see
 * docs/PIPELINE_DECISIONS.md TIM-PAUSE-01/02/03). No table yet (see above).
 * A pause is a held moment between two narration sentences INSIDE a scene: the voice stops, the story action
 * waits, life (breathing, blinks, ambient sound) goes on. Entry kinds:
 *   after: "<snippet>"  between two sentences: the one subtitle phrase of `scene` containing the snippet; the
 *                       generator cuts the voice clip at the middle of the nearest sentence silence (ffmpeg
 *                       silencedetect -45 dB / 0.12 s on the played file in public/audio/ep05; it must lie within
 *                       PAUSE_TOL 0.5 s of the phrase end, else the run stops listing the nearest silences), or
 *                       holds at the silent gap between two clips (no cut; the story holds 0.3 s after the speech
 *                       ends, or mid-gap if shorter).
 *   clip + silence      optional override for an "after" pause whose subtitle estimate does not line up with the
 *                       voice: silence [a, b] in the ORIGINAL clip's seconds (from silencedetect).
 *   at: "open"          before the scene's first line: the story holds at atStory 0, the scene's start stays, its
 *                       narration, cues and everything after move later.
 *   at: "end"           after the scene's last line: the story holds on the last frame the scene shows ALONE
 *                       (atStory = min(authored length, next scene's authored start) - 1).
 * One clip can carry several cuts: its parts are NAME_p1.wav .. NAME_pN.wav beside the original (cut at the
 * middle of the silence, 5 ms fades, no level change, same sample rate, mono 16-bit). The original WAV is never
 * written; stale NAME_pK.wav files from earlier runs are deleted. Every cut is checked (RMS below -45 dB and peak
 * below -38 dB within +-30 ms) and the parts' samples must sum to the original. Everything after a hold point
 * (later parts, later clips, cues, scenes) moves later by the pause; the scene grows by it. A cue that carries a
 * pause cut has its phrases re-spread by character count between the real cut points.
 *   afterGap: true      (with "after" or "open") the pause holds at the END of the action gap that sits at the same
 *                       hold point, instead of before it (Episode 4 scene 03: P1 hold 1.0 s, AG2 7.5 s running,
 *                       P2 hold 1.0 s afterGap).
 *
 * ACTION GAPS (new kind, 2026-11-22, TIM-GAP-01). Picture time with NO narration in which the story clock KEEPS
 * RUNNING (unlike a pause), for book events the narration does not tell (Episode 4 scene 03: Thakurma leaving the
 * shrine; Balak handing in the dhoop and drinking the coconut water). GAPS entries take the
 * same "open" / "after" (+ clip, silence) kinds as PAUSES and find their hold point the same way (cuts included).
 * A gap lengthens the scene's AUTHORED (story) timeline at that point, as an Episode 2 INSERTS lead does: every clip
 * part, cue and pause after it (and every later scene) moves later by it, and `f` from useStory5 runs straight
 * through it. Story frames of a scene with gaps therefore INCLUDE them (cueLocalStory5 already returns them). Optional
 * `beats` [{ id, sec }] name sub-steps of a gap (their lengths must sum to the gap; the last absorbs rounding).
 * Order at one hold point: pauses, then the gap, then afterGap pauses.
 *
 * CHAPTER BREAKS (CAM-10, 2026-11-22). BREAKS [{ after, sec }]: `sec` of timeline after scene `after` in which no
 * scene is mounted (Episode05.tsx, a later round, draws black and places the chime). The scene before is cut to the frames it
 * shows alone (its 1 s TAIL no longer overlaps the next scene) plus its pauses, so at these joins nothing
 * cross-dissolves: scene `after` ends, the break runs, the next scene starts (its fade-in runs on lifeF, as it
 * plays inside an open pause or an action gap).
 *
 * SPEAKERS (voice script + book.xlsx rows for ch. 8 and 9, 2026-11-22; STO-18). A voice ID borrowed from a
 * character does not prove that character speaks (Episode 3, STO-17a), so each line was checked against the book:
 *   02b_Haricharan.wav    হরিচরণ  (book ch. 9: হরিচরণ with a bamboo, "গরুটা কোন দিকে গেছে দেখেছিস?" and
 *                                  "তাড়াতাড়ি বল কোন দিকে গেছে?". The voice ID is 10_Grumpy_Relative; the book does
 *                                  not call him a relative, only হরিচরণ, whom the boy addresses as হরিচরণদা.)
 *   02c_Thakur_Truth.wav  বীরু    (book ch. 9: the boy, "দেখলেও বলবো না, ... আমি ওর খবর বলতে পারবো না।")
 * The other clips are narration (00_Intro, 01a, 02a, 99). No recording disagrees with the book on who speaks.
 *
 * Exports for scene code (helpers in src/episode/storyClock.ts: useStory5, cueLocalStory5, clipSpan5 ...):
 *   EP05_PAUSES      { sceneId, atStory, frames, startFrame }: atStory is the scene-local STORY frame (the scene's
 *                    original authored timing) where the story clock holds; startFrame is the absolute real frame.
 *   EP05_CLIP_PARTS  original file -> its played parts { file, startFrame, frames } (uncut clips: one part).
 *   EP05_GAPS        { sceneId, fromStory, frames, startFrame, beats: [{ id, fromStory, frames }] }: fromStory is the
 *                    scene-local story frame where the gap begins (story frames run through it); startFrame is the
 *                    absolute real frame. Helpers gapsFor5 / gapState5, and useStory5(...).gap.
 *   EP05_BREAKS      { after, next, frames, startFrame }: the chapter break's absolute real frames
 *                    [startFrame, startFrame + frames); next starts exactly at its end.
 *
 * Checks (they stop the run): every cut in silence (RMS < -45 dB, peak < -38 dB) and the parts sum to the original;
 * no caption and no speech inside a pause or a gap; captions and clips do not overlap; scenes in order; at each
 * break the scene before ends at the break and the next starts at its end.
 * NO_PAUSES=1 OUT_DIR=<dir> writes the timing without pauses, gaps and breaks (and without cutting) to <dir>.
 */
const fs = require("fs");
const path = require("path");
const { execSync, execFileSync, spawnSync } = require("child_process");

const root = process.env.REPO_ROOT || "C:/Dipankar/Balak_Thakur_AI_Studio";
const outRoot = path.resolve(__dirname, "..");
const epDir = path.join(root, "03_Episodes", "Episode_05_Tortoise_and_Gentle_Cow");
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(outRoot, "remotion_studio", "src", "episode05");
const VOICE_DIR = path.join(outRoot, "remotion_studio", "public", "audio", "ep05");
const NO_PAUSES = process.env.NO_PAUSES === "1";
const FPS = 24;
const MAX_CHARS = 36;
const TAIL = 1; // seconds a scene lingers past its last narration

/*
 * PAUSES inside scenes: the director's approved table (STO-20, 2026-11-22; plan 03_Episodes/
 * Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/Ep05_Shots_and_Pauses_DRAFT.md, "Notes for whoever
 * codes this"): 6 pauses, 9.5 s; no pauses in the outro 99. The two cuts in 01a sit at the silences measured on the
 * final linear-levelled files (scripts/ep05_silences.txt), named for certainty.
 * Shape: { scene: S01, after: "<unique phrase snippet>", sec: 1.5, note: "..." },
 *        { scene, at: "open" | "end", sec, note }, optional clip + silence: [a, b] for an "after" entry,
 *        optional afterGap: true (hold at the end of the action gap at the same point).
 */
const S01 = "01_tortoise_play";
const S02 = "02_banana_grove_cow_rescue";
const PAUSES = [
  { scene: S01, after: "খেলা করছিল।", sec: 1.5, clip: "01a_Narrator_Tortoise.wav", silence: [5.878, 6.460], note: "P1: Balak rolls a tortoise over and rights it" },
  { scene: S01, after: "কামড়ে ধরল!", sec: 1.0, clip: "01a_Narrator_Tortoise.wav", silence: [9.630, 10.051], note: "P2: the bite held; Balak amused and calm" },
  { scene: S01, at: "end", sec: 2.0, note: "P3: the unmarked hand (glow beat 1); then chapter break 1" },
  { scene: S02, at: "open", sec: 1.0, note: "P1: fade in from black on the grove" },
  { scene: S02, after: "কোন দিকে গেছে?", sec: 2.0, note: "P2 (clip boundary 02b/02c): Balak's dilemma" },
  { scene: S02, at: "end", sec: 2.0, note: "P3 (after AG2): the cow comes to Balak; glow beat 2" },
];
/*
 * ACTION GAPS: picture time with no narration in which the story clock keeps running (TIM-GAP-01, header).
 * Shape: { scene, at: "open" | "end", sec } or { scene, after: "<snippet>", sec }, optional beats [{ id, sec }], note.
 * at: "end" (new for Episode 5) holds at the scene's end-pause point (its last solo story frame); there the gap runs
 * FIRST and the end pause holds after it (the same order as afterGap at a mid point).
 */
const GAPS = [
  {
    scene: S02, after: "মারতে ছুটে এল।", sec: 2.5, note: "AG1 (clip boundary 02a/02b): the cow hides; Haricharan arrives",
    beats: [
      { id: "a_cow_hides", sec: 1.5 }, // the cow slips behind the banana plants as Balak watches
      { id: "b_haricharan_arrives", sec: 1.0 }, // Haricharan bursts in with the bamboo pole
    ],
  },
  {
    scene: S02, at: "end", sec: 2.5, note: "AG2 (after the scene's last line, before P3): Haricharan storms off, angrier",
    beats: [{ id: "a_haricharan_leaves", sec: 2.5 }],
  },
];
/* CHAPTER BREAKS (CAM-10): black, no scene mounted, after the scene's end pause; no cross-dissolve at these joins. */
const BREAKS = [
  { after: S01, sec: 1.0 },
];
/*
 * CAPTION PHRASES (approved plan, "Captions"). PHRASE_SPLITS replaces the automatic phrase split of one clip's cue
 * (the phrases must rebuild the cue text). PHRASE_ANCHORS pins a phrase's START to the voice (seconds in the clip's
 * own time, from the measured word starts), so no caption leads its voice; the phrases between two anchors are spread
 * by character count as usual (the same re-spread as at a pause cut).
 */
const PHRASE_SPLITS = {
  "02a_Narrator_Cow.wav": ["ছয় বছরের বীরু তখন কলাবাগিচায়", "চুপচাপ বসে থাকতে ভালোবাসত।", "একদিন শশা গাছ খেয়ে ফেলায়", "হরিচরণ বাঁশ হাতে গরুটিকে মারতে ছুটে এল।"],
};
// The two 02a anchors at 7.13 and 9.32 s are the plan's; the others pin every phrase whose voice starts right after a
// measured silence (silence end, scripts/ep05_silences.txt), so those captions do not lead the voice either.
// At a pause cut the anchor replaces the cut as the phrase start (the caption before still ends at the cut).
const PHRASE_ANCHORS = [
  { clip: "01a_Narrator_Tortoise.wav", startsWith: "ছোট্ট বীরু", at: 3.10 }, // silence 2.870-3.096
  { clip: "01a_Narrator_Tortoise.wav", startsWith: "হঠাৎ", at: 6.46 }, // P1 silence 5.878-6.460
  { clip: "01a_Narrator_Tortoise.wav", startsWith: "সবাই", at: 10.05 }, // P2 silence 9.630-10.051
  { clip: "01a_Narrator_Tortoise.wav", startsWith: "কিন্তু", at: 12.88 }, // silence 12.713-12.876
  { clip: "01a_Narrator_Tortoise.wav", startsWith: "আর কচ্ছপও", at: 16.53 }, // silence 16.142-16.529
  { clip: "02a_Narrator_Cow.wav", startsWith: "চুপচাপ", at: 3.50 }, // word start (plan's measured list)
  { clip: "02a_Narrator_Cow.wav", startsWith: "একদিন", at: 7.13 }, // the voice resumes after the 1.8 s quiet (plan)
  { clip: "02a_Narrator_Cow.wav", startsWith: "হরিচরণ", at: 9.32 }, // after the 0.1 s gap at 9.23-9.32 s (plan)
  { clip: "02b_Haricharan.wav", startsWith: "তাড়াতাড়ি", at: 1.14 }, // silence 1.020-1.140
  { clip: "02b_Haricharan.wav", startsWith: "গরুটা", at: 1.90 }, // word start (plan's measured list)
  { clip: "02c_Thakur_Truth.wav", startsWith: "বলে দিলে", at: 2.24 }, // silence 1.892-2.235
  { clip: "02c_Thakur_Truth.wav", startsWith: "ওর খিদে", at: 4.88 }, // silence 4.361-4.877
  { clip: "02c_Thakur_Truth.wav", startsWith: "ও কি আর", at: 7.28 }, // silence 7.068-7.280
  { clip: "02c_Thakur_Truth.wav", startsWith: "আমি ওর খবর", at: 10.35 }, // silence 10.116-10.346
];
const PAUSE_TOL = 0.5; // seconds: the cut silence must lie this close to the phrase end
const BOUNDARY_HOLD = 0.3; // s: at a clip boundary the story holds this long after the speech ends (or mid-gap)
const NO_PAUSE_SCENES = ["99_closing_sequential_outro", "98_next_episode"]; // the series template (no pauses)

const probeDur = (file) => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();
const durations = JSON.parse(fs.readFileSync(path.join(epDir, "02_Audio", "Voice_WAVs", "audio_durations.json"), "utf8"));
const srt = fs.readFileSync(path.join(epDir, "04_Video_Assembly", "Subtitles_SRT", "Episode_05_Tortoise_and_Gentle_Cow_bn.srt"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(epDir, "01_Script_and_Storyboard", "scenes_manifest.json"), "utf8"));

const toSec = (t) => {
  const [h, m, rest] = t.trim().split(":");
  const [s, ms] = rest.split(",");
  return +h * 3600 + +m * 60 + +s + +ms / 1000;
};
const cues = srt.replace(/\r/g, "").trim().split(/\n\n+/).map((block) => {
  const lines = block.split("\n");
  const [a, b] = lines[1].split(" --> ");
  return { start: toSec(a), end: toSec(b), text: lines.slice(2).join(" ") };
});

const clipFiles = manifest.scenes.flatMap((s) => s.audio_files || []);
if (clipFiles.length !== cues.length) throw new Error(`clips ${clipFiles.length} != cues ${cues.length}`);
const clips = clipFiles.map((file, i) => ({ file, cue: i, start: cues[i].start, end: cues[i].end, dur: durations[file].duration_sec }));
clips.forEach((c) => {
  if (Math.abs(c.end - c.start - c.dur) > 0.3) throw new Error(`${c.file}: cue ${c.end - c.start}s vs clip ${c.dur}s`);
});

const SOURCE_FILE = "00a_Source_Attribution.wav";
const SOURCE_DUR = probeDur(path.join(root, "02_Shared_Assets", "Templates", SOURCE_FILE));
const SOURCE_AT = cues[0].end + 0.3;
const SHIFT = SOURCE_DUR + 0.5;
for (let i = 1; i < cues.length; i++) { cues[i].start += SHIFT; cues[i].end += SHIFT; }
clips.forEach((c, i) => { if (i >= 1) { c.start += SHIFT; c.end += SHIFT; } });
// one visual scene per manifest scene, spanning its clips
let cursor = 0;
const visual = manifest.scenes.map((s) => {
  const n = (s.audio_files || []).length;
  const mine = clips.slice(cursor, cursor + n);
  cursor += n;
  const start = n ? mine[0].start : 0;
  const end = n ? mine[mine.length - 1].end + TAIL : start + 4;
  const component = "Scene" + s.scene_id.replace(/^(\d+)_?/, "$1_").split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return { id: s.scene_id, component, start, end };
});

visual[0].end = SOURCE_AT;
visual.splice(1, 0, { id: "00b_source_attribution", component: "SourceCard", start: SOURCE_AT, end: SOURCE_AT + SOURCE_DUR + 0.3 });
// No separate next-episode segment for Episode 5: the glimpse (Episode 6) is a layer inside the outro (header).
const NEXT_EPISODE_FRAMES = 0;
if (NEXT_EPISODE_FRAMES > 0) {
  const lastEnd = Math.max(...visual.map((v) => v.end));
  visual.push({ id: "98_next_episode", component: "Scene98NextEpisode", start: lastEnd, end: lastEnd + NEXT_EPISODE_FRAMES / FPS });
}
const f = (sec) => Math.round(sec * FPS);
// ---- frames before the pauses (the timing the scene files were built on) ----
const scenes0 = visual.map((v) => ({ ...v, startFrame: f(v.start), durationFrames: f(v.end) - f(v.start) }));
const sceneById = Object.fromEntries(scenes0.map((s) => [s.id, s]));
// a pre-pause absolute frame belongs to the last voiced story scene (01 on, not 98) that starts at or before it
const voicedScenes = scenes0.slice(2).filter((s) => s.id !== "98_next_episode");
const sceneAt = (frame) => {
  let id = null;
  for (const s of voicedScenes) if (s.startFrame <= frame) id = s.id;
  return id;
};

// ---- speakers (checked against the voice script and book.xlsx; see the header) ----
const SPEAKER_BY_FILE = {
  "02b_Haricharan.wav": "হরিচরণ",
  "02c_Thakur_Truth.wav": "বীরু",
};
const speakerFor = (file) => {
  if (SPEAKER_BY_FILE[file] !== undefined) return SPEAKER_BY_FILE[file];
  if (/Narrator|Intro|Outro|Sequential/i.test(file)) return "";
  throw new Error(`no speaker for ${file}: add it to SPEAKER_BY_FILE`);
};
// short subtitle phrases, timed by character share within each cue
function splitPhrases(text) {
  const parts = text.split(/(?<=[।!?,—])\s*/).map((p) => p.trim()).filter(Boolean);
  // a short opening address ("মা,") joins the next part instead of flashing alone for a few frames
  if (parts.length > 1 && parts[0].length < 8) parts.splice(0, 2, parts[0] + " " + parts[1]);
  const pieces = [];
  for (const p of parts) {
    if (p.length <= MAX_CHARS) { pieces.push(p); continue; }
    let line = "";
    for (const w of p.split(/\s+/)) {
      const candidate = (line + " " + w).trim();
      if (candidate.length > MAX_CHARS && line) { pieces.push(line); line = w; } else { line = candidate; }
    }
    if (line) pieces.push(line);
  }
  const merged = [];
  for (const p of pieces) {
    if (merged.length && p.length < 8) merged[merged.length - 1] += " " + p;
    else merged.push(p);
  }
  return merged;
}
let seq = 0;
const allPhrases = [];
cues.forEach((c, ci) => {
  const override = PHRASE_SPLITS[clipFiles[ci]];
  if (override && override.join("").replace(/\s+/g, "") !== c.text.replace(/\s+/g, "")) throw new Error(`PHRASE_SPLITS ${clipFiles[ci]}: the phrases do not rebuild the cue text`);
  const pieces = override || splitPhrases(c.text);
  const total = pieces.reduce((a, p) => a + p.length, 0) || 1;
  let acc = 0;
  for (const p of pieces) {
    const from = c.start + ((c.end - c.start) * acc) / total;
    acc += p.length;
    const to = c.start + ((c.end - c.start) * acc) / total;
    allPhrases.push({ from, to, text: p, speaker: speakerFor(clipFiles[ci] || ""), scene: sceneAt(f(from)), seq: seq++, cueKey: `main:${ci}`, cueFrom: c.start, cueTo: c.end });
  }
});
// phrase starts pinned to the voice (PHRASE_ANCHORS): { cueKey, afterSeq, t } like a pause cut, re-spread below
const captionAnchors = PHRASE_ANCHORS.map((a) => {
  const ci = clipFiles.indexOf(a.clip);
  if (ci < 0) throw new Error(`PHRASE_ANCHORS: unknown clip ${a.clip}`);
  const mine = allPhrases.filter((q) => q.cueKey === `main:${ci}`);
  const hits = mine.filter((q) => q.text.startsWith(a.startsWith));
  if (hits.length !== 1 || hits[0] === mine[0]) throw new Error(`PHRASE_ANCHORS ${a.clip} "${a.startsWith}": needs exactly one phrase starting so, not the cue's first`);
  if (!(a.at > 0 && a.at < clips[ci].dur)) throw new Error(`PHRASE_ANCHORS ${a.clip} "${a.startsWith}": ${a.at} s lies outside the clip`);
  return { cueKey: `main:${ci}`, afterSeq: hits[0].seq - 1, t: clips[ci].start + a.at };
});

// ---- voice clips: lengths from the played files (as Episode 2: no word tail is cut off) ----
clips.splice(1, 0, { file: SOURCE_FILE, start: SOURCE_AT, end: SOURCE_AT + SOURCE_DUR, dur: SOURCE_DUR });
clips.forEach((c) => { if (c.file !== SOURCE_FILE) c.dur = probeDur(path.join(VOICE_DIR, c.file)); });
let voice = clips.map((c) => ({ file: c.file, t: c.start, dur: c.dur, cueKey: c.cue === undefined ? null : `main:${c.cue}` }));

function detectSilences(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "silencedetect=n=-45dB:d=0.12", "-f", "null", "-"], { encoding: "utf8" });
  const txt = (r.stderr || "") + (r.stdout || "");
  const starts = [...txt.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...txt.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  // (adjacent silences are NOT merged: the few ms between them can be a click)
  return starts.map((a, i) => ({ a, b: ends[i] ?? probeDur(file) }));
}
/** Mean (RMS) and peak level (dBFS) of `file` in [sec - half, sec + half]: a cut must sit below -45 dB RMS. */
function levelAt(file, sec, half = 0.03) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `atrim=start=${Math.max(0, sec - half).toFixed(4)}:end=${(sec + half).toFixed(4)},volumedetect`, "-f", "null", "-"], { encoding: "utf8" });
  const txt = (r.stderr || "") + (r.stdout || "");
  const num = (re) => { const m = re.exec(txt); return !m ? NaN : m[1] === "-inf" ? -Infinity : +m[1]; };
  return { rms: num(/mean_volume: (-?[\d.]+|-inf) dB/), peak: num(/max_volume: (-?[\d.]+|-inf) dB/) };
}
const samplesOf = (file) => +execSync(`ffprobe -v error -select_streams a:0 -show_entries stream=duration_ts -of csv=p=0 "${file}"`).toString().trim();
const rateCache = {};
const srOf = (file) => (rateCache[file] ??= +execSync(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "${path.join(VOICE_DIR, file)}"`).toString().trim());
const silenceCache = {};
const silencesOf = (file) => (silenceCache[file] ??= detectSilences(path.join(VOICE_DIR, file)));
// cut points per original clip file: { sample, kind: "pause" }
const cutsOf = {};
const addCut = (file, cut) => {
  const list = (cutsOf[file] ??= []);
  if (!list.some((c) => Math.abs(c.sample - cut.sample) < srOf(file) * 0.01)) list.push(cut);
};

// ---- pauses and action gaps inside scenes: find the hold point (pre-pause frame) and the cut it needs ----
// (hold points are found on the original authored timeline; gaps are folded into the story frames afterwards)
const pauseReport = [];
const pauseAnchors = []; // { cueKey, afterSeq, t }: a pause or gap cut inside a cue (seconds)
function resolveHold(p, idx, table) {
  const isGap = table === "GAPS";
  const kind = p.at === "open" || p.at === "end" ? p.at : "after";
  const label = `${table}[${idx}] (${p.scene}, ${kind === "after" ? `after "${p.after}"` : kind}${p.afterGap ? ", afterGap" : ""})`;
  const sc = sceneById[p.scene];
  if (NO_PAUSE_SCENES.includes(p.scene)) throw new Error(`${label}: the outro and the next-episode glimpse take no pauses or gaps`);
  if (!sc || !voicedScenes.includes(sc)) throw new Error(`${label}: unknown story scene ${p.scene}`);
  if (!(p.sec > 0)) throw new Error(`${label}: sec must be > 0`);
  if (p.at !== undefined && kind === "after") throw new Error(`${label}: at must be "open" or "end"`);
  // (Episode 5: an action gap may also take "end": it runs at the end-pause point, before any end pause)
  if (isGap && p.afterGap) throw new Error(`${label}: afterGap belongs to PAUSES entries`);
  if (p.afterGap && kind === "end") throw new Error(`${label}: afterGap needs "open" or "after"`);
  const frames = Math.round(p.sec * FPS);
  const scenePhrases = allPhrases.filter((q) => q.scene === p.scene);
  if (kind === "open") {
    pauseReport.push(`${label}: ${isGap ? "gap opens" : "holds"} at story frame 0 (before "${scenePhrases[0]?.text ?? ""}") for ${frames} f`);
    return { sceneId: p.scene, kind, holdFrame: sc.startFrame, atStory: 0, frames, seq: -1, phrase: "(open) " + (scenePhrases[0]?.text ?? ""), note: p.note };
  }
  if (kind === "end") {
    // the story holds on the last frame the scene shows alone (before the next scene's authored start)
    const next = scenes0[scenes0.indexOf(sc) + 1];
    const solo = next ? Math.min(sc.durationFrames, next.startFrame - sc.startFrame) : sc.durationFrames;
    const atStory = solo - 1;
    const holdFrame = sc.startFrame + atStory;
    for (const v of voice) {
      if (sceneAt(f(v.t)) === p.scene && f(v.t) + Math.round(v.dur * FPS) > holdFrame + 1) throw new Error(`${label}: ${v.file} still plays at the end hold (frame ${holdFrame})`);
    }
    const last = scenePhrases[scenePhrases.length - 1];
    pauseReport.push(`${label}: holds at story frame ${atStory} (last solo frame of ${sc.durationFrames}, after "${last?.text ?? ""}") for ${frames} f`);
    return { sceneId: p.scene, kind, holdFrame, atStory, frames, seq: Infinity, phrase: "(end) " + (last?.text ?? ""), note: p.note };
  }
  const hits = scenePhrases.filter((q) => q.text.includes(p.after));
  if (hits.length !== 1) {
    const list = scenePhrases.map((q) => `    "${q.text}"`).join("\n");
    throw new Error(`${label}: ${hits.length ? "snippet matches " + hits.length + " phrases, make it unique" : "no phrase of this scene contains the snippet"}. Phrases of ${p.scene}:\n${list}`);
  }
  const ph = hits[0];
  const t = ph.to; // phrase end (estimate), seconds
  const group = [...voice].sort((x, y) => x.t - y.t);
  const leadOf = (v) => silencesOf(v.file).find((s) => s.a < 0.02);
  const trailOf = (v) => silencesOf(v.file).find((s) => s.b > v.dur - 0.02);
  const distTo = (A, B) => (t < A ? A - t : t > B ? t - B : 0);
  const cands = [];
  group.forEach((v, i) => {
    const next = group[i + 1];
    if (v.t > t + 3 || (v.t + v.dur < t - 3 && !(next && next.t > t - 3))) return;
    const lead = leadOf(v);
    const trail = trailOf(v);
    for (const s of silencesOf(v.file)) {
      if (s === lead || s === trail) continue;
      cands.push({ kind: "cut", v, s, A: v.t + s.a, B: v.t + s.b, dist: distTo(v.t + s.a, v.t + s.b) });
    }
    const A = v.t + (trail ? trail.a : v.dur);
    const nextLead = next ? leadOf(next) : null;
    const B = next ? next.t + (nextLead ? nextLead.b : 0) : Infinity;
    if (B >= A) cands.push({ kind: "boundary", v, next, A, B, dist: distTo(A, B) });
  });
  cands.sort((x, y) => x.dist - y.dist);
  let best = cands[0];
  if (p.silence) {
    const v = group.find((x) => x.file === p.clip);
    if (!v) throw new Error(`${label}: clip ${p.clip} not found`);
    const [a, b] = p.silence;
    if (!(a > 0 && b > a && b < v.dur)) throw new Error(`${label}: silence ${a}-${b} s lies outside ${p.clip} (0-${v.dur.toFixed(2)} s)`);
    const d = distTo(v.t + a, v.t + b);
    if (d > 1.5) throw new Error(`${label}: named silence is ${d.toFixed(2)} s from the phrase end estimate: check the snippet`);
    best = { kind: "cut", v, s: { a, b }, A: v.t + a, B: v.t + b, dist: d, named: true };
  }
  if (!best || (best.dist > PAUSE_TOL && !best.named)) {
    const near = cands.slice(0, 4).map((c) => `    ${c.kind} ${c.v.file} ${c.A.toFixed(2)}-${Number.isFinite(c.B) ? c.B.toFixed(2) : "end"} s (off by ${c.dist.toFixed(2)} s)`).join("\n");
    throw new Error(`${label}: no sentence silence within ${PAUSE_TOL} s of the phrase end ${t.toFixed(2)} s. Nearest:\n${near}`);
  }
  let holdFrame;
  let where;
  if (best.kind === "cut") {
    const sr = srOf(best.v.file);
    const cutSample = Math.round(((best.s.a + best.s.b) / 2) * sr);
    if (ph.cueKey !== best.v.cueKey) throw new Error(`${label}: the cut clip ${best.v.file} is not the phrase's own clip`);
    addCut(best.v.file, { sample: cutSample, kind: "pause" });
    holdFrame = f(best.v.t + cutSample / sr);
    const tCut = best.v.t + cutSample / sr;
    if (!pauseAnchors.some((a) => a.cueKey === ph.cueKey && Math.abs(a.t - tCut) < 1e-6)) pauseAnchors.push({ cueKey: ph.cueKey, afterSeq: ph.seq, t: tCut });
    where = `cut ${best.v.file} at ${(cutSample / sr).toFixed(3)} s (${best.named ? "named " : ""}silence ${best.s.a.toFixed(3)}-${best.s.b.toFixed(3)} s)`;
  } else {
    const speechEnd = best.A;
    const mid = Number.isFinite(best.B) ? Math.min((best.A + best.B) / 2, speechEnd + BOUNDARY_HOLD) : Math.min(speechEnd + BOUNDARY_HOLD, best.v.t + best.v.dur);
    holdFrame = best.next ? Math.min(f(mid), f(best.next.t)) : f(mid);
    where = `clip boundary after ${best.v.file}${best.next ? " before " + best.next.file : ""} (no cut, speech ends ${speechEnd.toFixed(2)} s)`;
  }
  const atStory = holdFrame - sc.startFrame;
  if (atStory < 0 || atStory > sc.durationFrames) throw new Error(`${label}: hold point ${atStory} lies outside the scene (0..${sc.durationFrames})`);
  pauseReport.push(`${label}: phrase ends ${t.toFixed(2)} s, ${where}, ${isGap ? "gap opens" : "holds"} at pre-gap story frame ${atStory} for ${frames} f`);
  return { sceneId: p.scene, kind, holdFrame, atStory, frames, seq: ph.seq, phrase: ph.text, note: p.note };
}
const pauses = (NO_PAUSES ? [] : PAUSES).map((p, i) => ({ ...resolveHold(p, i, "PAUSES"), afterGap: !!p.afterGap }));
const gaps = (NO_PAUSES ? [] : GAPS).map((g, i) => {
  const r = resolveHold(g, i, "GAPS");
  // named beats inside the gap (frames sum to the gap; the last absorbs rounding)
  const beats = [];
  if (g.beats && g.beats.length) {
    let acc = 0;
    g.beats.forEach((b, k) => {
      if (!(b.sec > 0) || !b.id) throw new Error(`GAPS[${i}] beat ${k}: needs an id and sec > 0`);
      const fr = k === g.beats.length - 1 ? r.frames - acc : Math.round(b.sec * FPS);
      beats.push({ id: b.id, offset: acc, frames: fr });
      acc += fr;
    });
    const secSum = g.beats.reduce((a, b) => a + b.sec, 0);
    if (Math.abs(secSum - g.sec) > 1e-6 || beats.some((b) => b.frames <= 0)) throw new Error(`GAPS[${i}]: beats sum to ${secSum} s, the gap is ${g.sec} s`);
  }
  return { ...r, beats };
});
// order of the events at one scene: by hold point; at the same point: pauses, then the gap, then afterGap pauses
// (an end pause comes after everything, including an "end" action gap: gap first, then the end pause)
const orderHold = (e) => (e.kind === "end" ? Infinity : e.holdFrame);
const gapComesBefore = (g, e) => {
  if (g.sceneId !== e.sceneId || g === e) return false;
  const hg = orderHold(g);
  const he = orderHold(e);
  if (hg !== he) return hg < he;
  if (e.isGap) return gaps.indexOf(g) < gaps.indexOf(e);
  if (g.kind === "end") return true;
  return !!e.afterGap;
};
gaps.forEach((g) => { g.isGap = true; });
for (const p of pauses.filter((x) => x.afterGap)) {
  if (!gaps.some((g) => g.sceneId === p.sceneId && g.holdFrame === p.holdFrame && g.kind === p.kind)) throw new Error(`afterGap pause of ${p.sceneId} ("${p.phrase}"): no action gap at its hold point`);
}
// story (authored) frames include the gaps: shift every pause and gap by the gaps before it in its scene
const gapFramesBefore = (e) => gaps.filter((g) => gapComesBefore(g, e)).reduce((a, g) => a + g.frames, 0);
for (const e of [...pauses, ...gaps]) e.atStoryPre = e.atStory;
for (const e of [...pauses, ...gaps]) e.atStory = e.atStoryPre + gapFramesBefore(e);
{
  const seen = new Set();
  for (const p of pauses) {
    const k = `${p.sceneId}@${p.atStory}`;
    if (seen.has(k)) throw new Error(`two pauses of ${p.sceneId} hold at story frame ${p.atStory}`);
    seen.add(k);
  }
}

// ---- re-spread the phrases of every cue that carries a pause cut or a caption anchor between the real points ----
const respreadReport = [];
// a caption anchor at the same phrase boundary as a pause cut wins (it must not lie before the cut)
for (const c of captionAnchors) {
  const a = pauseAnchors.find((x) => x.cueKey === c.cueKey && x.afterSeq === c.afterSeq);
  if (a && c.t < a.t - 1e-6) throw new Error(`caption anchor at ${c.t.toFixed(3)} s lies before the pause cut at ${a.t.toFixed(3)} s`);
}
const allAnchors = [...captionAnchors, ...pauseAnchors.filter((a) => !captionAnchors.some((c) => c.cueKey === a.cueKey && c.afterSeq === a.afterSeq))];
for (const key of [...new Set(allAnchors.map((a) => a.cueKey))]) {
  const list = allPhrases.filter((q) => q.cueKey === key).sort((x, y) => x.seq - y.seq);
  const anchors = allAnchors.filter((a) => a.cueKey === key).map((a) => ({ idx: list.findIndex((q) => q.seq === a.afterSeq), t: a.t }));
  anchors.sort((x, y) => x.t - y.t);
  anchors.push({ idx: list.length - 1, t: list[0].cueTo });
  let i = 0;
  let segStart = list[0].cueFrom;
  for (const an of anchors) {
    if (an.idx < i || an.t <= segStart) throw new Error(`re-spread ${key}: anchors out of order at phrase ${an.idx} (${an.t.toFixed(2)} s)`);
    const seg = list.slice(i, an.idx + 1);
    const total = seg.reduce((a, q) => a + q.text.length, 0) || 1;
    let acc = 0;
    for (const q of seg) {
      const old = [q.from, q.to];
      q.from = segStart + ((an.t - segStart) * acc) / total;
      acc += q.text.length;
      q.to = segStart + ((an.t - segStart) * acc) / total;
      if (Math.abs(f(q.from) - f(old[0])) > 2 || Math.abs(f(q.to) - f(old[1])) > 2) respreadReport.push(`"${q.text}" ${f(old[0])}-${f(old[1])} -> ${f(q.from)}-${f(q.to)} (pre-shift frames)`);
    }
    i = an.idx + 1;
    segStart = an.t;
  }
}

// ---- cut the clips: NAME_p1 .. NAME_pN beside the original (the original is never written) ----
const FADE = 0.005;
const cutFiles = new Set();
const cutReport = [];
for (let i = 0; i < voice.length; i++) {
  const v = voice[i];
  const cuts = (cutsOf[v.file] || []).sort((x, y) => x.sample - y.sample);
  if (!cuts.length) continue;
  const src = path.join(VOICE_DIR, v.file);
  const sr = srOf(v.file);
  const enc = ["-c:a", "pcm_s16le", "-ar", String(sr), "-ac", "1"];
  const stem = v.file.replace(/\.wav$/, "");
  const bounds = [{ sample: 0 }, ...cuts, null];
  const parts = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    const s0 = bounds[k].sample;
    const s1 = bounds[k + 1] ? bounds[k + 1].sample : null;
    const af = [];
    if (s0 === 0) af.push(`atrim=end_sample=${s1}`);
    else af.push(s1 === null ? `atrim=start_sample=${s0}` : `atrim=start_sample=${s0}:end_sample=${s1}`, "asetpts=PTS-STARTPTS", `afade=t=in:st=0:d=${FADE}`);
    if (s1 !== null) af.push(`afade=t=out:st=${((s1 - s0) / sr - FADE).toFixed(6)}:d=${FADE}`);
    const name = `${stem}_p${k + 1}.wav`;
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-af", af.join(","), ...enc, path.join(VOICE_DIR, name)]);
    parts.push({ file: name, original: v.file, t: v.t + s0 / sr, dur: probeDur(path.join(VOICE_DIR, name)), cueKey: v.cueKey });
    cutFiles.add(name);
  }
  cutReport.push(`${v.file}: ${parts.map((p) => `${p.file} ${p.dur.toFixed(3)} s`).join(" + ")} (original ${v.dur.toFixed(3)} s)`);
  const total = parts.reduce((a, p) => a + samplesOf(path.join(VOICE_DIR, p.file)), 0);
  const orig = samplesOf(src);
  if (total !== orig) throw new Error(`${v.file}: parts sum to ${total} samples, original has ${orig}`);
  cutReport.push(`  parts sum to the original: ${total} samples`);
  for (const c of cuts) {
    const { rms, peak } = levelAt(src, c.sample / sr);
    cutReport.push(`  cut ${(c.sample / sr).toFixed(3)} s: RMS ${rms} dB, peak ${peak} dB`);
    if (!(rms < -45 && peak < -38)) throw new Error(`${v.file}: the cut at ${(c.sample / sr).toFixed(3)} s is not in silence (RMS ${rms} dB, peak ${peak} dB)`);
  }
  voice.splice(i, 1, ...parts);
  i += parts.length - 1;
}
if (!NO_PAUSES) {
  // delete stale NAME_pK.wav files from earlier runs (only names this generator makes)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const originals = [...new Set(voice.map((v) => v.original || v.file))];
  for (const file of fs.readdirSync(VOICE_DIR)) {
    for (const o of originals) {
      if (new RegExp(`^${esc(o.replace(/\.wav$/, ""))}_p\\d+\\.wav$`).test(file) && !cutFiles.has(file)) {
        fs.unlinkSync(path.join(VOICE_DIR, file));
        cutReport.push(`deleted stale ${file}`);
      }
    }
  }
}

// ---- shifts: each scene's pauses, gaps and break push every later scene; inside a scene, everything after the hold
// point ----
const pauseFramesOf = {};
for (const p of pauses) pauseFramesOf[p.sceneId] = (pauseFramesOf[p.sceneId] || 0) + p.frames;
const gapFramesOf = {};
for (const g of gaps) gapFramesOf[g.sceneId] = (gapFramesOf[g.sceneId] || 0) + g.frames;
const breakAfter = {};
for (const b of NO_PAUSES ? [] : BREAKS) {
  const i = scenes0.findIndex((s) => s.id === b.after);
  if (i < 0 || !voicedScenes.includes(scenes0[i])) throw new Error(`break after unknown story scene ${b.after}`);
  if (!scenes0[i + 1]) throw new Error(`break after ${b.after}: no next scene`);
  if (!(b.sec > 0)) throw new Error(`break after ${b.after}: sec must be > 0`);
  breakAfter[b.after] = Math.round(b.sec * FPS);
}
// a scene followed by a break shows only its solo frames (no TAIL overlap into the next scene: no cross-dissolve)
const soloFrames = (s) => {
  const next = scenes0[scenes0.indexOf(s) + 1];
  return next ? Math.min(s.durationFrames, next.startFrame - s.startFrame) : s.durationFrames;
};
let cum = 0;
const shiftOf = {};
scenes0.forEach((s) => { shiftOf[s.id] = cum; cum += (pauseFramesOf[s.id] || 0) + (gapFramesOf[s.id] || 0) + (breakAfter[s.id] || 0); });
const TOTAL_PAUSE = pauses.reduce((a, p) => a + p.frames, 0);
const TOTAL_GAP = gaps.reduce((a, g) => a + g.frames, 0);
const TOTAL_BREAK = Object.values(breakAfter).reduce((a, x) => a + x, 0);
const shiftAt = (frame) => {
  const id = sceneAt(frame);
  return id ? shiftOf[id] : 0;
};
// a clip part moves by every pause and gap of its scene at or before its pre-pause frame (open: all; end: none);
// a phrase moves by every pause and gap that follows an earlier phrase (open seq -1, end seq Infinity)
const holdsOf = (scene) => [...pauses, ...gaps].filter((p) => p.sceneId === scene);
const pauseShiftAudio = (scene, pre) => holdsOf(scene).filter((p) => p.kind === "open" || (p.kind !== "end" && pre >= p.holdFrame)).reduce((a, p) => a + p.frames, 0);
const pauseShiftCue = (scene, s) => holdsOf(scene).filter((p) => s > p.seq).reduce((a, p) => a + p.frames, 0);

const scenes = scenes0.map((s) => ({
  ...s,
  startFrame: s.startFrame + shiftOf[s.id],
  durationFrames: (breakAfter[s.id] ? soloFrames(s) : s.durationFrames) + (pauseFramesOf[s.id] || 0) + (gapFramesOf[s.id] || 0),
}));
const sceneReal = Object.fromEntries(scenes.map((s) => [s.id, s]));
const pauseRows = [];
for (const s of scenes) {
  let before = 0;
  for (const p of pauses.filter((x) => x.sceneId === s.id).sort((x, y) => x.atStory - y.atStory)) {
    pauseRows.push({ sceneId: s.id, atStory: p.atStory, frames: p.frames, startFrame: s.startFrame + p.atStory + before, phrase: p.phrase, kind: p.kind + (p.afterGap ? " afterGap" : "") });
    before += p.frames;
  }
}
// a gap's real start: its story start plus the pauses that hold at or before it (a pause at the same hold point
// holds first; an afterGap pause sits at the gap's end, so it is not counted)
const gapRows = gaps.map((g) => {
  const s = sceneReal[g.sceneId];
  const held = pauses.filter((p) => p.sceneId === g.sceneId && p.atStory <= g.atStory).reduce((a, p) => a + p.frames, 0);
  return { sceneId: g.sceneId, fromStory: g.atStory, frames: g.frames, startFrame: s.startFrame + g.atStory + held, phrase: g.phrase, kind: g.kind, beats: g.beats.map((b) => ({ id: b.id, fromStory: g.atStory + b.offset, frames: b.frames })) };
}).sort((a, b) => a.startFrame - b.startFrame);
const breakRows = Object.entries(breakAfter).map(([after, frames]) => {
  const i = scenes.findIndex((s) => s.id === after);
  return { after, next: scenes[i + 1].id, frames, startFrame: scenes[i].startFrame + scenes[i].durationFrames };
});

const audioRows = voice.map((v) => {
  const pre = f(v.t);
  const scene = sceneAt(pre);
  return { file: v.file, original: v.original || v.file, startFrame: pre + shiftAt(pre) + pauseShiftAudio(scene, pre), frames: Math.round(v.dur * FPS) };
});
audioRows.sort((a, b) => a.startFrame - b.startFrame);

const cueRows = allPhrases.map((p) => {
  let from = f(p.from);
  let to = f(p.to);
  // keep a phrase before a pause or gap from running into it, and a phrase after one from starting inside it
  for (const q of holdsOf(p.scene)) {
    if (p.seq > q.seq) { from = Math.max(from, q.holdFrame); to = Math.max(to, from); }
    else to = Math.max(from, Math.min(to, q.holdFrame));
  }
  const sh = (p.scene ? shiftOf[p.scene] : shiftAt(f(p.from))) + pauseShiftCue(p.scene, p.seq);
  return { from: from + sh, to: to + sh, text: p.text, speaker: p.speaker, scene: p.scene };
}).sort((a, b) => a.from - b.from);

// ---- checks ----
const totalEnd = Math.max(...scenes.map((v) => v.startFrame + v.durationFrames));
{
  const errs = [];
  const holdRows = [...pauseRows.map((p) => ({ ...p, what: "pause" })), ...gapRows.map((g) => ({ ...g, what: "action gap" }))];
  for (const c of cueRows) {
    if (c.to <= c.from) errs.push(`caption "${c.text}" has no length (${c.from}-${c.to})`);
    for (const p of holdRows) if (c.from < p.startFrame + p.frames && c.to > p.startFrame) errs.push(`caption "${c.text}" (${c.from}-${c.to}) runs into the ${p.what} of ${p.sceneId} at ${p.startFrame} (+${p.frames})`);
  }
  cueRows.forEach((c, i) => { if (i && c.from < cueRows[i - 1].to) errs.push(`caption "${c.text}" overlaps the previous one`); });
  for (const a of audioRows) {
    // SPEECH must not play inside a pause or gap: a clip's lead and trail room tone (silencedetect) may run into it,
    // and a part ending at a cut may round 1 frame into it
    const sil = a.file === SOURCE_FILE ? [] : silencesOf(a.file);
    const lead = sil.find((s) => s.a < 0.02);
    const trail = sil.find((s) => s.b > a.frames / FPS - 0.05);
    const speechFrom = a.startFrame + (lead ? Math.floor(lead.b * FPS) : 0);
    const speechTo = a.startFrame + (trail ? Math.ceil(trail.a * FPS) : a.frames);
    for (const p of holdRows) if (speechFrom < p.startFrame + p.frames - 1 && speechTo > p.startFrame + 1) errs.push(`voice ${a.file} (speech ${speechFrom}-${speechTo}) plays inside the ${p.what} of ${p.sceneId} at ${p.startFrame} (+${p.frames})`);
  }
  audioRows.forEach((a, i) => { if (i && a.startFrame < audioRows[i - 1].startFrame + audioRows[i - 1].frames - 1) errs.push(`voice ${a.file} overlaps ${audioRows[i - 1].file}`); });
  scenes.forEach((s, i) => { if (i && s.startFrame <= scenes[i - 1].startFrame) errs.push(`scene ${s.id} starts at ${s.startFrame}, not after ${scenes[i - 1].id}`); });
  for (const p of holdRows) {
    const s = sceneReal[p.sceneId];
    if (p.startFrame < s.startFrame || p.startFrame + p.frames > s.startFrame + s.durationFrames) errs.push(`${p.what} of ${p.sceneId} at ${p.startFrame} (+${p.frames}) lies outside the scene (${s.startFrame}-${s.startFrame + s.durationFrames})`);
  }
  for (const b of breakRows) {
    const next = sceneReal[b.next];
    if (next.startFrame !== b.startFrame + b.frames) errs.push(`break after ${b.after}: ${b.next} starts at ${next.startFrame}, expected ${b.startFrame + b.frames} (no overlap at a chapter break)`);
    for (const c of cueRows) if (c.from < b.startFrame + b.frames && c.to > b.startFrame) errs.push(`caption "${c.text}" runs into the break after ${b.after}`);
    for (const a of audioRows) if (a.startFrame < b.startFrame + b.frames && a.startFrame + a.frames > b.startFrame + 1) errs.push(`voice ${a.file} plays inside the break after ${b.after}`);
  }
  // every cue lies inside its own scene's real window
  for (const c of cueRows) {
    if (!c.scene) continue;
    const s = sceneReal[c.scene];
    if (c.from < s.startFrame || c.to > s.startFrame + s.durationFrames) errs.push(`caption "${c.text}" (${c.from}-${c.to}) lies outside ${c.scene} (${s.startFrame}-${s.startFrame + s.durationFrames})`);
  }
  if (errs.length) throw new Error("timing checks failed:\n  " + errs.join("\n  "));
}

// ---- write timing.ts ----
const out = ["// AUTO-GENERATED by scripts/build_ep05_timing.js. Do not edit by hand."];
out.push(`export const EP05_FPS = ${FPS};`);
out.push("export interface Ep05Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }");
out.push("export const EP05_SCENES: Ep05Scene[] = [");
for (const v of scenes) out.push(`  { sceneId: ${JSON.stringify(v.id)}, component: ${JSON.stringify(v.component)}, startFrame: ${v.startFrame}, durationFrames: ${v.durationFrames} },`);
out.push("];");
out.push(`export const EP05_TOTAL_FRAMES = ${totalEnd};`);
out.push("export interface Ep05Audio { file: string; startFrame: number; frames: number }");
out.push("export const EP05_AUDIO: Ep05Audio[] = [");
for (const r of audioRows) out.push(`  { file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} },`);
out.push("];");
out.push("/**");
out.push(" * The played parts of each original voice clip (a clip cut at an in-scene pause has several, NAME_p1..NAME_pN;");
out.push(" * an uncut clip has one part, identical to its EP05_AUDIO row).");
out.push(" * Use clipSpan5(original) from src/episode/storyClock.ts for an original clip's whole window.");
out.push(" */");
out.push("export interface Ep05ClipPart { file: string; startFrame: number; frames: number }");
out.push("export const EP05_CLIP_PARTS: Record<string, Ep05ClipPart[]> = {");
for (const o of [...new Set(audioRows.map((r) => r.original))]) {
  const rows = audioRows.filter((r) => r.original === o).map((r) => `{ file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} }`);
  out.push(`  ${JSON.stringify(o)}: [${rows.join(", ")}],`);
}
out.push("};");
out.push("/**");
out.push(" * Held moments inside scenes (PAUSES in the generator, rule CAM-14, the approved table STO-20). The story clock of");
out.push(" * scene `sceneId` holds at its local story frame `atStory` for `frames`; `startFrame` is the absolute real frame");
out.push(" * where the pause begins. Story frames include the scene's action gaps (EP05_GAPS).");
out.push(" * Use useStory5 / cueLocalStory5 / pausesFor5 from src/episode/storyClock.ts.");
out.push(" */");
out.push("export interface Ep05Pause { sceneId: string; atStory: number; frames: number; startFrame: number }");
if (!pauseRows.length) out.push("export const EP05_PAUSES: Ep05Pause[] = [];");
else {
  out.push("export const EP05_PAUSES: Ep05Pause[] = [");
  for (const p of pauseRows) out.push(`  { sceneId: ${JSON.stringify(p.sceneId)}, atStory: ${p.atStory}, frames: ${p.frames}, startFrame: ${p.startFrame} },`);
  out.push("];");
}
out.push("/**");
out.push(" * Action gaps (GAPS in the generator, TIM-GAP-01): picture time with no narration in which the story clock KEEPS");
out.push(" * RUNNING. Scene-local story frames [fromStory, fromStory + frames) are the gap; startFrame is its absolute real");
out.push(" * start. `beats` name its sub-steps in story frames. `kind`: \"open\" (before the first line), \"after\" (between");
out.push(" * two lines) or \"end\" (after the last line: it runs first, then the scene's end pause holds). Use gapsFor5 / gapState5");
out.push(" * or useStory5(...).gap.");
out.push(" */");
out.push("export interface Ep05GapBeat { id: string; fromStory: number; frames: number }");
out.push("export interface Ep05Gap { sceneId: string; kind: \"open\" | \"after\" | \"end\"; fromStory: number; frames: number; startFrame: number; beats: Ep05GapBeat[] }");
if (!gapRows.length) out.push("export const EP05_GAPS: Ep05Gap[] = [];");
else {
  out.push("export const EP05_GAPS: Ep05Gap[] = [");
  for (const g of gapRows) out.push(`  { sceneId: ${JSON.stringify(g.sceneId)}, kind: ${JSON.stringify(g.kind)}, fromStory: ${g.fromStory}, frames: ${g.frames}, startFrame: ${g.startFrame}, beats: [${g.beats.map((b) => `{ id: ${JSON.stringify(b.id)}, fromStory: ${b.fromStory}, frames: ${b.frames} }`).join(", ")}] },`);
  out.push("];");
}
out.push("/**");
out.push(" * Chapter breaks (CAM-10): absolute real frames [startFrame, startFrame + frames) after scene `after`, in which no");
out.push(" * scene is mounted (draw black, place the chime). `after` ends at startFrame and `next` starts at its end: no");
out.push(" * cross-dissolve at these joins.");
out.push(" */");
out.push("export interface Ep05Break { after: string; next: string; frames: number; startFrame: number }");
if (!breakRows.length) out.push("export const EP05_BREAKS: Ep05Break[] = [];");
else {
  out.push("export const EP05_BREAKS: Ep05Break[] = [");
  for (const b of breakRows) out.push(`  { after: ${JSON.stringify(b.after)}, next: ${JSON.stringify(b.next)}, frames: ${b.frames}, startFrame: ${b.startFrame} },`);
  out.push("];");
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "timing.ts"), out.join("\n") + "\n", "utf8");

const subs = ["// AUTO-GENERATED by scripts/build_ep05_timing.js. Do not edit by hand.", "export const EP05_CUES: { from: number; to: number; text: string; speaker: string }[] = ["];
for (const c of cueRows) subs.push(`  { from: ${c.from}, to: ${c.to}, text: ${JSON.stringify(c.text)}, speaker: ${JSON.stringify(c.speaker)} },`);
subs.push("];");
fs.writeFileSync(path.join(outDir, "subtitles.ts"), subs.join("\n") + "\n", "utf8");

// ---- check the subtitles against the source SRT: each cue's phrases rebuild its text, inside its own window ----
{
  const errs = [];
  const srtCues = srt.replace(/\r/g, "").trim().split(/\n\n+/).map((block) => block.split("\n").slice(2).join(" "));
  const norm = (t) => t.replace(/\s+/g, "");
  cues.forEach((c, ci) => {
    const mine = allPhrases.filter((q) => q.cueKey === `main:${ci}`);
    if (norm(mine.map((q) => q.text).join(" ")) !== norm(srtCues[ci])) errs.push(`cue ${ci + 1}: phrases do not rebuild the SRT text`);
    if (mine.some((q) => q.from < c.start - 1e-6 || q.to > c.end + 1e-6)) errs.push(`cue ${ci + 1}: a phrase lies outside the cue window`);
  });
  if (errs.length) throw new Error("subtitle check against the SRT failed: " + errs.join("; "));
}

// ---- the sentence-silence list (scripts/ep05_silences.txt): where pauses and gaps can sit ----
{
  const SENTENCE_MIN = 0.2; // s: interior silences at least this long are listed as sentence-silence candidates
  const lines = [
    "# Episode 5 voice clips: silences (ffmpeg silencedetect -45 dB / 0.12 s) on the played, levelled files in",
    "# remotion_studio/public/audio/ep05. Written by scripts/build_ep05_timing.js on every run; do not edit by hand.",
    "# Times are in the clip's OWN seconds (use them as `silence: [a, b]` with `clip` in a PAUSES / GAPS entry).",
    "# lead / trail = room tone at the clip's start / end (a pause there is a clip-boundary hold, no cut).",
    `# SENTENCE = interior silence >= ${SENTENCE_MIN} s (a cut candidate); short = a breath or word gap (not for a cut).`,
    "# 'near' = the subtitle phrase whose estimated end (character share of the cue) is closest to the silence,",
    "# and how far its estimated end is from the silence (the generator accepts <= 0.5 s, PAUSE_TOL, else name it).",
    "# 'abs' = the silence's middle on the timeline WITHOUT pauses (seconds, frame at 24 fps).",
    "",
  ];
  for (const c of clips) {
    const dur = c.dur;
    const sil = c.file === SOURCE_FILE ? detectSilences(path.join(VOICE_DIR, SOURCE_FILE)) : silencesOf(c.file);
    const mine = c.cue === undefined ? [] : allPhrases.filter((q) => q.cueKey === `main:${c.cue}`);
    lines.push(`${c.file}  (${dur.toFixed(3)} s; on the timeline at ${c.start.toFixed(3)} s = frame ${f(c.start)})`);
    if (!sil.length) lines.push("  (no silences)");
    for (const s of sil) {
      const len = s.b - s.a;
      const kind = s.a < 0.02 ? "lead" : s.b > dur - 0.02 ? "trail" : len >= SENTENCE_MIN ? "SENTENCE" : "short";
      let near = "";
      if (mine.length && kind !== "lead") {
        const mid = c.start + (s.a + s.b) / 2;
        const best = mine.map((q) => ({ q, d: q.to < c.start + s.a ? c.start + s.a - q.to : q.to > c.start + s.b ? q.to - (c.start + s.b) : 0 })).sort((x, y) => x.d - y.d)[0];
        near = `  near "${best.q.text}" (estimate ${best.d === 0 ? "inside" : best.d.toFixed(2) + " s off"}) abs ${mid.toFixed(2)} s f${f(mid)}`;
      }
      lines.push(`  ${kind.padEnd(8)} start ${s.a.toFixed(3)}  len ${len.toFixed(3)}  [${s.a.toFixed(3)}, ${s.b.toFixed(3)}]${near}`);
    }
    if (mine.length) {
      lines.push("  phrases (estimated, clip seconds):");
      for (const q of mine) lines.push(`    ${(q.from - c.start).toFixed(2)}-${(q.to - c.start).toFixed(2)}  ${q.speaker ? q.speaker + ": " : ""}${q.text}`);
    }
    lines.push("");
  }
  fs.writeFileSync(path.join(__dirname, "ep05_silences.txt"), lines.join("\n") + "\n", "utf8");
}

// scene files that look a cut clip up by its exact file name must switch to clipSpan5(original)
const srcDir = path.join(outRoot, "remotion_studio", "src", "episode05");
const cutOriginals = [...new Set(voice.filter((v) => v.original).map((v) => v.original))];
for (const file of fs.existsSync(srcDir) ? fs.readdirSync(srcDir, { recursive: true }) : []) {
  if (!/\.tsx?$/.test(file) || /^(timing|subtitles)\.ts$/.test(path.basename(file))) continue;
  const src = fs.readFileSync(path.join(srcDir, file), "utf8");
  for (const o of cutOriginals) {
    if (src.includes(`"${o}"`)) console.warn(`WARNING: ${file} looks up "${o}" by name, but that clip is now cut into parts: use clipSpan5("${o}") / EP05_CLIP_PARTS.`);
  }
}

console.log("silences: scripts/ep05_silences.txt");
console.log("cuts:");
if (!cutReport.length) console.log("  (none)");
cutReport.forEach((l) => console.log("  " + l));
console.log("pauses and gaps (hold points):");
if (!pauseReport.length) console.log("  (none)");
pauseReport.forEach((l) => console.log("  " + l));
console.log("re-spread phrases (moved more than 2 f):");
respreadReport.forEach((l) => console.log("  " + l));
console.log("pause table (scene | after | kind | atStory | absolute start | frames):");
for (const r of pauseRows) console.log(`  ${r.sceneId.padEnd(28)} | ${r.phrase} | ${r.kind} | ${r.atStory} | ${r.startFrame} | ${r.frames}`);
console.log("total pauses:", pauseRows.length, "|", TOTAL_PAUSE, "f");
console.log("action gaps (scene | after | kind | fromStory | absolute start | frames | beats):");
for (const g of gapRows) console.log(`  ${g.sceneId.padEnd(28)} | ${g.phrase} | ${g.kind} | ${g.fromStory} | ${g.startFrame} | ${g.frames} | ${g.beats.map((b) => `${b.id}@${b.fromStory}+${b.frames}`).join(" ") || "-"}`);
console.log("chapter breaks (after -> next | absolute start | frames):");
for (const b of breakRows) console.log(`  ${b.after} -> ${b.next} | ${b.startFrame} | ${b.frames}`);
console.log("visual scenes:");
for (const v of scenes) console.log(`  ${v.id.padEnd(30)} ${v.component.padEnd(30)} start ${v.startFrame}  frames ${v.durationFrames}  end ${v.startFrame + v.durationFrames}`);
console.log("total frames:", totalEnd, `(${(totalEnd / FPS).toFixed(2)} s; pauses ${TOTAL_PAUSE} f, gaps ${TOTAL_GAP} f, breaks ${TOTAL_BREAK} f)`, "| audio clips:", audioRows.length, "| subtitle phrases:", cueRows.length);
