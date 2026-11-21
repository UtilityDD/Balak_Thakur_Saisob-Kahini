#!/usr/bin/env node
/**
 * Builds Episode 4 ("শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক": the clay Shiva and the doll, the Gobinda at the pond and
 * Thakurma's words, the coconut water) from its scene manifest, voice durations and Bengali SRT. Written 2026-11-21
 * (TIM-EP04-01, replacing a hand-built timing.ts); the director's approved pause table, the action gaps and the
 * chapter breaks went in on 2026-11-22 (STO-19, plan: 03_Episodes/Episode_04_Idols_and_Coconut_Water/
 * 01_Script_and_Storyboard/Ep04_Shots_and_Pauses_DRAFT.md, "Notes for whoever codes this"; TIM-GAP-01).
 * Pause mechanics are those of scripts/build_ep03_timing.js. Voice clips go on the absolute timeline (EP04_AUDIO);
 * each manifest scene becomes one visual scene. Writes remotion_studio/src/episode04/timing.ts and subtitles.ts
 * (frames at 24 fps). Story scenes: 01_clay_shiva_and_doll, 02_gobinda_pond_and_thakurma,
 * 03_coconut_water_abhishek; then the outro 99 (series template, no pauses, no gaps).
 *
 * VOICES: public/audio/ep04 holds the Normalized_48k clips from 03_Episodes/<EP>/02_Audio/Voice_WAVs/Normalized_48k
 * plus 00a_Source_Attribution.wav, levelled to -16 LUFS / -1.5 dBTP (two-pass linear loudnorm, lengths unchanged;
 * pre-level copies in _original_levels/, the raw WAVs that were there before in _original_levels/raw_previous/).
 * The SRT's cues match these clips' lengths exactly (8 cues for 8 clips, 0.45 s gaps).
 *
 * SOURCE CARD (as Episode 3): 00a_Source_Attribution.wav at cues[0].end + 0.3 s; every later clip and cue moves
 * later by SOURCE_DUR + 0.5 s. Scene 00b_source_attribution spans it.
 *
 * NEXT-EPISODE GLIMPSE: the manifest has no 98 scene, and Episode 4's outro narration carries the
 * "আসছে পরের পর্ব" teaser well inside its 25.8 s, so the glimpse (TTL-10a) is a layer inside the outro and there is
 * no extra 98 segment (NEXT_EPISODE_FRAMES = 0; set it > 0 to append one as Episode 3 does).
 *
 * PAUSES INSIDE SCENES (rule CAM-14; mechanism of scripts/build_ep02_timing.js / build_ep03_timing.js, see
 * docs/PIPELINE_DECISIONS.md TIM-PAUSE-01/02/03). The approved table (STO-19): 9 pauses, 14.0 s.
 * A pause is a held moment between two narration sentences INSIDE a scene: the voice stops, the story action
 * waits, life (breathing, blinks, ambient sound) goes on. Entry kinds:
 *   after: "<snippet>"  between two sentences: the one subtitle phrase of `scene` containing the snippet; the
 *                       generator cuts the voice clip at the middle of the nearest sentence silence (ffmpeg
 *                       silencedetect -45 dB / 0.12 s on the played file in public/audio/ep04; it must lie within
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
 *                       hold point, instead of before it. Scene 03's boundary 03a/03b runs: P1 hold 1.0 s, AG2
 *                       7.5 s running, P2 hold 1.0 s (afterGap), then 03b.
 *
 * ACTION GAPS (new kind, 2026-11-22, TIM-GAP-01). Picture time with NO narration in which the story clock KEEPS
 * RUNNING (unlike a pause), for book events the narration does not tell (scene 03: Thakurma leaving the shrine;
 * Balak handing in the dhoop, asking by gesture, going in and drinking the coconut water). GAPS entries take the
 * same "open" / "after" (+ clip, silence) kinds as PAUSES and find their hold point the same way (cuts included).
 * A gap lengthens the scene's AUTHORED (story) timeline at that point, as an Episode 2 INSERTS lead does: every clip
 * part, cue and pause after it (and every later scene) moves later by it, and `f` from useStory4 runs straight
 * through it. Story frames of scene 03 therefore INCLUDE its gaps (cueLocalStory4 already returns them). Optional
 * `beats` [{ id, sec }] name sub-steps of a gap (their lengths must sum to the gap; the last absorbs rounding).
 * Order at one hold point: pauses, then the gap, then afterGap pauses.
 *
 * CHAPTER BREAKS (CAM-10, 2026-11-22). BREAKS [{ after, sec }]: `sec` of timeline after scene `after` in which no
 * scene is mounted (Episode04.tsx draws black and places the chime). The scene before is cut to the frames it
 * shows alone (its 1 s TAIL no longer overlaps the next scene) plus its pauses, so at these joins nothing
 * cross-dissolves: scene `after` ends, the break runs, the next scene starts (its fade-in runs on lifeF, as it
 * plays inside an open pause or an action gap).
 *
 * SPEAKERS (voice script + book.xlsx, 2026-11-21). A voice ID borrowed from a character does not prove that
 * character speaks (Episode 3, STO-17a), so each line was checked against the book:
 *   01b_Toddler_Thakur_Clay.wav  বীরু          (book ch. 6: the boy answers his mother about the clay Shiva)
 *   02b_Thakurma_Blessing.wav    ঠাকুরমা       (book ch. 6: "ঠাকুমা বললেন, তোরা কালাপাহাড়ই বলিস ...")
 *   03a_Bhagabati_Dhoop.wav      পুরোহিত ঠাকুর (book ch. 7: "পুরোহিত ঠাকুর 'ধুপ' 'ধুপ' বলে চীৎকার করে উঠলেন". The
 *                                voice ID is Bhagabati Thakur's; the book does not name this priest. In ch. 2 the
 *                                family priest is Bhagabati, so he is plausible: DOUBTFUL, the director to confirm.)
 *   03b_Toddler_Coconut.wav      বীরু          (book ch. 7: the boy to the priest, "ঠাকুর মশায়, ...")
 *
 * Exports for scene code (helpers in src/episode/storyClock.ts: useStory4, cueLocalStory4, clipSpan4 ...):
 *   EP04_PAUSES      { sceneId, atStory, frames, startFrame }: atStory is the scene-local STORY frame (the scene's
 *                    original authored timing) where the story clock holds; startFrame is the absolute real frame.
 *   EP04_CLIP_PARTS  original file -> its played parts { file, startFrame, frames } (uncut clips: one part).
 *   EP04_GAPS        { sceneId, fromStory, frames, startFrame, beats: [{ id, fromStory, frames }] }: fromStory is the
 *                    scene-local story frame where the gap begins (story frames run through it); startFrame is the
 *                    absolute real frame. Helpers gapsFor4 / gapState4, and useStory4(...).gap.
 *   EP04_BREAKS      { after, next, frames, startFrame }: the chapter break's absolute real frames
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
const epDir = path.join(root, "03_Episodes", "Episode_04_Idols_and_Coconut_Water");
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(outRoot, "remotion_studio", "src", "episode04");
const VOICE_DIR = path.join(outRoot, "remotion_studio", "public", "audio", "ep04");
const NO_PAUSES = process.env.NO_PAUSES === "1";
const FPS = 24;
const MAX_CHARS = 36;
const TAIL = 1; // seconds a scene lingers past its last narration

/*
 * PAUSES inside scenes: the director's approved table (STO-19, 2026-11-22; no pauses in the outro 99).
 * Shape: { scene: "01_clay_shiva_and_doll", after: "<unique phrase snippet>", sec: 1.5, note: "..." },
 *        { scene, at: "open" | "end", sec, note }, optional clip + silence: [a, b] for an "after" entry,
 *        optional afterGap: true (hold at the end of the action gap at the same point).
 */
const S01 = "01_clay_shiva_and_doll";
const S02 = "02_gobinda_pond_and_thakurma";
const S03 = "03_coconut_water_abhishek";
const PAUSES = [
  // the caption estimate ends at 5.04 s, 0.70 s from the sentence silence (beyond PAUSE_TOL): the silence is named
  { scene: S01, after: "গড়ে পূজো করতেন।", sec: 1.0, clip: "01a_Narrator_Shiva.wav", silence: [3.988, 4.701], note: "P1: Charu rings her bell, lays a flower; Balak watches" },
  { scene: S01, after: "কাঠের পুতুল!", sec: 2.0, note: "P2 (clip boundary 01a/01b): Charu looks up at the tap, no Shiva, the doll" },
  { scene: S01, at: "end", sec: 1.0, note: "P3: Balak smiles up; Charu, palm to forehead; then chapter break 1" },
  { scene: S02, at: "open", sec: 1.0, note: "P1: fade in from black on the pond wide, a mandar flower drops" },
  { scene: S02, after: "গোবিন্দ উদ্ধার করলেন।", sec: 3.0, note: "P2 (clip boundary 02a/02b): the hand-over settles, 36 f dissolve to the courtyard" },
  { scene: S02, at: "end", sec: 2.0, note: "P3: the episode's one glow beat on Balak; then chapter break 2" },
  { scene: S03, after: "ধুপ! ধুপ কই?", sec: 1.0, note: "P1 (clip boundary 03a/03b, before AG2): nobody answers" },
  { scene: S03, after: "ধুপ! ধুপ কই?", sec: 1.0, afterGap: true, note: "P2 (end of AG2, before ঠাকুরমশায়): Balak content, the fopra in the empty bowl" },
  { scene: S03, at: "end", sec: 2.0, note: "P3: the priest reddens; Balak smiles innocently; series fade into the outro" },
];
/*
 * ACTION GAPS: picture time with no narration in which the story clock keeps running (TIM-GAP-01, header).
 * Shape: { scene, at: "open", sec } or { scene, after: "<snippet>", sec }, optional beats [{ id, sec }], note.
 */
const GAPS = [
  { scene: S03, at: "open", sec: 2.5, note: "AG1: Thakurma steps out of the shrine and goes in; Balak alone on the veranda" },
  {
    scene: S03, after: "ধুপ! ধুপ কই?", sec: 7.5, note: "AG2: the dhoop, the asking, inside, the drink",
    beats: [
      { id: "a_dhoop", sec: 3.0 }, // Balak hands the dhoop-dani in; the priest takes it without looking, nods twice
      { id: "b_ask", sec: 1.5 }, // Balak points inside (asking to sit); the priest nods again
      { id: "c_inside", sec: 1.0 }, // time cut: Balak seated inside, his eyes stop on the stone bowl and the fopra
      { id: "d_drink", sec: 2.0 }, // the priest absorbed in the rite; Balak drinks it all in one draught, sets the bowl back
    ],
  },
];
/* CHAPTER BREAKS (CAM-10): black, no scene mounted, after the scene's end pause; no cross-dissolve at these joins. */
const BREAKS = [
  { after: S01, sec: 1.0 },
  { after: S02, sec: 1.0 },
];
const PAUSE_TOL = 0.5; // seconds: the cut silence must lie this close to the phrase end
const BOUNDARY_HOLD = 0.3; // s: at a clip boundary the story holds this long after the speech ends (or mid-gap)
const NO_PAUSE_SCENES = ["99_closing_sequential_outro", "98_next_episode"]; // the series template (no pauses)

const probeDur = (file) => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();
const durations = JSON.parse(fs.readFileSync(path.join(epDir, "02_Audio", "Voice_WAVs", "audio_durations.json"), "utf8"));
const srt = fs.readFileSync(path.join(epDir, "04_Video_Assembly", "Subtitles_SRT", "Episode_04_Idols_and_Coconut_Water_bn.srt"), "utf8");
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
// No separate next-episode segment for Episode 4: the glimpse (Episode 5) is a layer inside the outro (header).
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
  "01b_Toddler_Thakur_Clay.wav": "বীরু",
  "02b_Thakurma_Blessing.wav": "ঠাকুরমা",
  "03a_Bhagabati_Dhoop.wav": "পুরোহিত ঠাকুর", // doubtful: Bhagabati's voice ID; the book says only "পুরোহিত ঠাকুর"
  "03b_Toddler_Coconut.wav": "বীরু",
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
  const pieces = splitPhrases(c.text);
  const total = pieces.reduce((a, p) => a + p.length, 0) || 1;
  let acc = 0;
  for (const p of pieces) {
    const from = c.start + ((c.end - c.start) * acc) / total;
    acc += p.length;
    const to = c.start + ((c.end - c.start) * acc) / total;
    allPhrases.push({ from, to, text: p, speaker: speakerFor(clipFiles[ci] || ""), scene: sceneAt(f(from)), seq: seq++, cueKey: `main:${ci}`, cueFrom: c.start, cueTo: c.end });
  }
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
  if (isGap && kind === "end") throw new Error(`${label}: an action gap takes "open" or "after" (lengthen the end pause or TAIL instead)`);
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
// (an end pause comes after everything)
const orderHold = (e) => (e.kind === "end" ? Infinity : e.holdFrame);
const gapComesBefore = (g, e) => {
  if (g.sceneId !== e.sceneId || g === e) return false;
  const hg = orderHold(g);
  const he = orderHold(e);
  if (hg !== he) return hg < he;
  if (e.isGap) return gaps.indexOf(g) < gaps.indexOf(e);
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

// ---- re-spread the phrases of every cue that carries a pause cut between the real cut points ----
const respreadReport = [];
for (const key of [...new Set(pauseAnchors.map((a) => a.cueKey))]) {
  const list = allPhrases.filter((q) => q.cueKey === key).sort((x, y) => x.seq - y.seq);
  const anchors = pauseAnchors.filter((a) => a.cueKey === key).map((a) => ({ idx: list.findIndex((q) => q.seq === a.afterSeq), t: a.t }));
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
const out = ["// AUTO-GENERATED by scripts/build_ep04_timing.js. Do not edit by hand."];
out.push(`export const EP04_FPS = ${FPS};`);
out.push("export interface Ep04Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }");
out.push("export const EP04_SCENES: Ep04Scene[] = [");
for (const v of scenes) out.push(`  { sceneId: ${JSON.stringify(v.id)}, component: ${JSON.stringify(v.component)}, startFrame: ${v.startFrame}, durationFrames: ${v.durationFrames} },`);
out.push("];");
out.push(`export const EP04_TOTAL_FRAMES = ${totalEnd};`);
out.push("export interface Ep04Audio { file: string; startFrame: number; frames: number }");
out.push("export const EP04_AUDIO: Ep04Audio[] = [");
for (const r of audioRows) out.push(`  { file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} },`);
out.push("];");
out.push("/**");
out.push(" * The played parts of each original voice clip (a clip cut at an in-scene pause has several, NAME_p1..NAME_pN;");
out.push(" * an uncut clip has one part, identical to its EP04_AUDIO row).");
out.push(" * Use clipSpan4(original) from src/episode/storyClock.ts for an original clip's whole window.");
out.push(" */");
out.push("export interface Ep04ClipPart { file: string; startFrame: number; frames: number }");
out.push("export const EP04_CLIP_PARTS: Record<string, Ep04ClipPart[]> = {");
for (const o of [...new Set(audioRows.map((r) => r.original))]) {
  const rows = audioRows.filter((r) => r.original === o).map((r) => `{ file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} }`);
  out.push(`  ${JSON.stringify(o)}: [${rows.join(", ")}],`);
}
out.push("};");
out.push("/**");
out.push(" * Held moments inside scenes (PAUSES in the generator, rule CAM-14, the approved table STO-19). The story clock of");
out.push(" * scene `sceneId` holds at its local story frame `atStory` for `frames`; `startFrame` is the absolute real frame");
out.push(" * where the pause begins. Story frames include the scene's action gaps (EP04_GAPS).");
out.push(" * Use useStory4 / cueLocalStory4 / pausesFor4 from src/episode/storyClock.ts.");
out.push(" */");
out.push("export interface Ep04Pause { sceneId: string; atStory: number; frames: number; startFrame: number }");
if (!pauseRows.length) out.push("export const EP04_PAUSES: Ep04Pause[] = [];");
else {
  out.push("export const EP04_PAUSES: Ep04Pause[] = [");
  for (const p of pauseRows) out.push(`  { sceneId: ${JSON.stringify(p.sceneId)}, atStory: ${p.atStory}, frames: ${p.frames}, startFrame: ${p.startFrame} },`);
  out.push("];");
}
out.push("/**");
out.push(" * Action gaps (GAPS in the generator, TIM-GAP-01): picture time with no narration in which the story clock KEEPS");
out.push(" * RUNNING. Scene-local story frames [fromStory, fromStory + frames) are the gap; startFrame is its absolute real");
out.push(" * start. `beats` name its sub-steps in story frames. Use gapsFor4 / gapState4 or useStory4(...).gap.");
out.push(" */");
out.push("export interface Ep04GapBeat { id: string; fromStory: number; frames: number }");
out.push("export interface Ep04Gap { sceneId: string; fromStory: number; frames: number; startFrame: number; beats: Ep04GapBeat[] }");
if (!gapRows.length) out.push("export const EP04_GAPS: Ep04Gap[] = [];");
else {
  out.push("export const EP04_GAPS: Ep04Gap[] = [");
  for (const g of gapRows) out.push(`  { sceneId: ${JSON.stringify(g.sceneId)}, fromStory: ${g.fromStory}, frames: ${g.frames}, startFrame: ${g.startFrame}, beats: [${g.beats.map((b) => `{ id: ${JSON.stringify(b.id)}, fromStory: ${b.fromStory}, frames: ${b.frames} }`).join(", ")}] },`);
  out.push("];");
}
out.push("/**");
out.push(" * Chapter breaks (CAM-10): absolute real frames [startFrame, startFrame + frames) after scene `after`, in which no");
out.push(" * scene is mounted (draw black, place the chime). `after` ends at startFrame and `next` starts at its end: no");
out.push(" * cross-dissolve at these joins.");
out.push(" */");
out.push("export interface Ep04Break { after: string; next: string; frames: number; startFrame: number }");
if (!breakRows.length) out.push("export const EP04_BREAKS: Ep04Break[] = [];");
else {
  out.push("export const EP04_BREAKS: Ep04Break[] = [");
  for (const b of breakRows) out.push(`  { after: ${JSON.stringify(b.after)}, next: ${JSON.stringify(b.next)}, frames: ${b.frames}, startFrame: ${b.startFrame} },`);
  out.push("];");
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "timing.ts"), out.join("\n") + "\n", "utf8");

const subs = ["// AUTO-GENERATED by scripts/build_ep04_timing.js. Do not edit by hand.", "export const EP04_CUES: { from: number; to: number; text: string; speaker: string }[] = ["];
for (const c of cueRows) subs.push(`  { from: ${c.from}, to: ${c.to}, text: ${JSON.stringify(c.text)}, speaker: ${JSON.stringify(c.speaker)} },`);
subs.push("];");
fs.writeFileSync(path.join(outDir, "subtitles.ts"), subs.join("\n") + "\n", "utf8");

// scene files that look a cut clip up by its exact file name must switch to clipSpan4(original)
const srcDir = path.join(outRoot, "remotion_studio", "src", "episode04");
const cutOriginals = [...new Set(voice.filter((v) => v.original).map((v) => v.original))];
for (const file of fs.readdirSync(srcDir, { recursive: true })) {
  if (!/\.tsx?$/.test(file) || /^(timing|subtitles)\.ts$/.test(path.basename(file))) continue;
  const src = fs.readFileSync(path.join(srcDir, file), "utf8");
  for (const o of cutOriginals) {
    if (src.includes(`"${o}"`)) console.warn(`WARNING: ${file} looks up "${o}" by name, but that clip is now cut into parts: use clipSpan4("${o}") / EP04_CLIP_PARTS.`);
  }
}

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
