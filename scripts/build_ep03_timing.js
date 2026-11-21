#!/usr/bin/env node
/**
 * Builds Episode 3 timing from its scene manifest, voice durations and Bengali SRT.
 * Voice clips go on the absolute timeline (EP03_AUDIO); each manifest scene becomes one visual scene.
 * Writes remotion_studio/src/episode03/timing.ts and subtitles.ts (frames at 24 fps).
 *
 * PAUSES INSIDE SCENES (added 2026-11-21, rule CAM-14, approved table STO-17; ported from
 * scripts/build_ep02_timing.js, see docs/PIPELINE_DECISIONS.md TIM-PAUSE-01/02/03).
 * A pause is a held moment between two narration sentences INSIDE a scene: the voice stops, the story action
 * waits, life (breathing, blinks, ambient sound) goes on. Entry kinds:
 *   after: "<snippet>"  between two sentences: the one subtitle phrase of `scene` containing the snippet; the
 *                       generator cuts the voice clip at the middle of the nearest sentence silence (ffmpeg
 *                       silencedetect -45 dB / 0.12 s on the played file in public/audio/ep03; it must lie within
 *                       PAUSE_TOL 0.5 s of the phrase end, else the run stops listing the nearest silences), or
 *                       holds at the silent gap between two clips (no cut; the story holds 0.3 s after the speech
 *                       ends, or mid-gap if shorter).
 *   clip + silence      optional override for an "after" pause whose subtitle estimate does not line up with the
 *                       voice: silence [a, b] in the ORIGINAL clip's seconds (from silencedetect).
 *   at: "open"          before the scene's first line: the story holds at atStory 0, the scene's start stays, its
 *                       narration, cues and everything after move later (exactly as Episode 2).
 *   at: "end"           after the scene's last line: the story holds on the last frame the scene shows ALONE
 *                       (atStory = min(authored length, next scene's authored start) - 1). Episode 2's scenes never
 *                       overlap, so there this is the last authored frame (Episode 2's rule); in Episode 3 the next
 *                       scene starts 13 f before this scene's authored end (01 -> 02 cross-dissolve, 02 -> outro),
 *                       so the hold sits just before that overlap: the whole pause is on screen, then the authored
 *                       overlap frames play unchanged under the next scene's entrance.
 * One clip can carry several cuts: its parts are NAME_p1.wav .. NAME_pN.wav beside the original (cut at the
 * middle of the silence, 5 ms fades, no level change, same sample rate, mono 16-bit). The original WAV is never
 * written; stale NAME_pK.wav files from earlier runs are deleted. Every cut is checked (RMS below -45 dB and peak
 * below -38 dB within +-30 ms) and the parts' samples must sum to the original. Everything after a hold point
 * (later parts, later clips, cues, scenes) moves later by the pause; the scene grows by it. A cue (one clip's
 * subtitle text) that carries a pause cut has its phrases re-spread by character count between the real cut
 * points, so captions follow the voice parts and no caption runs into a pause.
 *
 * THE APPROVED PAUSE TABLE (director 2026-11-21, STO-17, Ep03_Shots_and_Pauses_DRAFT.md): 12 pauses, 16.5 s
 * (396 f); NO pauses in the outro (99) or the next-episode glimpse (98), which stay as the series template.
 *   01 dawn garden     after "শরতের মিষ্টি ভোর।" 1.5 | "আকাশ-বাতাস ভরে উঠেছে।" 1.0 | end 1.5          (01a cuts)
 *   02A flowers/feet   open 1.0 | "নিজের পায়ে দিচ্ছে," 1.0 (02a cut, named silence 11.081-11.312 s: the estimate
 *                      is 0.54 s early) | "নিজেকে প্রণাম করছে!" 2.0 (clip boundary 02a/02b)
 *   02B the scolding   "একি কাণ্ড!" 1.0 | "দিচ্ছিস কেন রে?" 1.5 (02b cuts) | "ভগবান শাপ দেবেন!" 1.5 (boundary 02b/02c)
 *   02C Balak answers  "আমি বেশ টের পাই।" 1.0 | "কিছু বোঝেও না!" 1.5 (02c cuts) | end 2.0
 * (02A, 02B and 02C are beats of the one scene 02_flowers_on_own_feet, so that scene carries nine pauses.)
 * Note for Episode03.tsx: scene 02's open pause holds the story at frame 0 during its first 24 real frames, which
 * include the 18-frame cross-dissolve; scene 02 must drive its own fade-in from lifeF (not the story frame).
 *
 * SPEAKERS (STO-17): 02b_Girls_Tease.wav is Charu's voice (voice script speaker 05_Charu): caption চারুশীলা.
 *
 * Exports for scene code (helpers in src/episode/storyClock.ts: useStory3, cueLocalStory3, clipSpan3 ...):
 *   EP03_PAUSES      { sceneId, atStory, frames, startFrame }: atStory is the scene-local STORY frame (the scene's
 *                    original authored timing) where the story clock holds; startFrame is the absolute real frame.
 *   EP03_CLIP_PARTS  original file -> its played parts { file, startFrame, frames } (uncut clips: one part).
 *
 * Checks: NO_PAUSES=1 OUT_DIR=<dir> writes the timing without pauses (and without cutting) to <dir>, to compare
 * the scene and cue frames with the previous generator's output.
 */
const fs = require("fs");
const path = require("path");
const { execSync, execFileSync, spawnSync } = require("child_process");

const root = process.env.REPO_ROOT || "C:/Dipankar/Balak_Thakur_AI_Studio";
const outRoot = path.resolve(__dirname, "..");
const epDir = path.join(root, "03_Episodes", "Episode_03_Five_Year_Old_Wisdom");
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(outRoot, "remotion_studio", "src", "episode03");
const VOICE_DIR = path.join(outRoot, "remotion_studio", "public", "audio", "ep03");
const NO_PAUSES = process.env.NO_PAUSES === "1";
const FPS = 24;
const MAX_CHARS = 36;
const TAIL = 1; // seconds a scene lingers past its last narration

/*
 * PAUSES inside scenes: the director-approved table (2026-11-21, STO-17; no pauses in 99 or 98).
 */
const PAUSES = [
  // 01 dawn garden (4.0 s)
  { scene: "01_sharad_flower_gathering", after: "শরতের মিষ্টি ভোর।", sec: 1.5, note: "P1 held wide: kaash bends in the breeze, shiuli falls, the women pick on" },
  { scene: "01_sharad_flower_gathering", after: "আকাশ-বাতাস ভরে উঠেছে।", sec: 1.0, note: "P2 the push has landed: Tuni smells the shiuli sprig, Sarala glances across" },
  { scene: "01_sharad_flower_gathering", at: "end", sec: 1.5, note: "P3 close on the brimming baskets, Mina and Rekha smile; then the dissolve" },
  // 02A the flowers on his own feet (4.0 s)
  { scene: "02_flowers_on_own_feet", at: "open", sec: 1.0, note: "02A P1 held wide: Balak seated at the tulsi-tala, breathing; the women chat" },
  // The caption estimate puts this phrase end at 10.54 s, 0.54 s before the silence: name it (original-clip seconds).
  { scene: "02_flowers_on_own_feet", after: "নিজের পায়ে দিচ্ছে,", sec: 1.0, clip: "02a_Narrator_Tulsi.wav", silence: [11.081, 11.312], note: "02A P2 he looks down at the three hibiscus on his feet, faint smile" },
  { scene: "02_flowers_on_own_feet", after: "নিজেকে প্রণাম করছে!", sec: 2.0, note: "02A P3 his head rises from the bow; glow brightens gently (key beat 1); Charu's steps" },
  // 02B the scolding, Charu speaking (4.0 s)
  { scene: "02_flowers_on_own_feet", after: "একি কাণ্ড!", sec: 1.0, note: "02B P1 Charu's hand at her mouth comes down; the girls turn their heads" },
  { scene: "02_flowers_on_own_feet", after: "দিচ্ছিস কেন রে?", sec: 1.5, note: "02B P2 Balak looks down at the flowers and back up, unbothered; Charu waits" },
  { scene: "02_flowers_on_own_feet", after: "ভগবান শাপ দেবেন!", sec: 1.5, note: "02B P3 the girls giggle behind their hands; Charu waits for his answer" },
  // 02C Balak's answer (4.5 s)
  { scene: "02_flowers_on_own_feet", after: "আমি বেশ টের পাই।", sec: 1.0, note: "02C P1 palms at his chest, a soft look across at Charu, a slow blink" },
  { scene: "02_flowers_on_own_feet", after: "কিছু বোঝেও না!", sec: 1.5, note: "02C P2 the reverse holds: the girls' giggles fade, Charu's brow softens" },
  { scene: "02_flowers_on_own_feet", at: "end", sec: 2.0, note: "02C P3 the push has landed on his face; glow brightens gently (key beat 2); Divine_Motif" },
];
const PAUSE_TOL = 0.5; // seconds: the cut silence must lie this close to the phrase end
const BOUNDARY_HOLD = 0.3; // s: at a clip boundary the story holds this long after the speech ends (or mid-gap)
const NO_PAUSE_SCENES = ["99_closing_sequential_outro", "98_next_episode"]; // the series template (no pauses)

const probeDur = (file) => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();
const durations = JSON.parse(fs.readFileSync(path.join(epDir, "02_Audio", "Voice_WAVs", "audio_durations.json"), "utf8"));
const srt = fs.readFileSync(path.join(epDir, "04_Video_Assembly", "Subtitles_SRT", "Episode_03_Five_Year_Old_Wisdom_bn.srt"), "utf8");
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
// The next-episode glimpse (Episode 4) plays for 168 frames right after the outro. It has no narration clip,
// so it is not in the manifest; keep it here so a rebuild does not drop it.
const NEXT_EPISODE_FRAMES = 168;
{
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

// ---- speakers (STO-17: the scolding voice 02b is Charu's; the file name says "Girls") ----
const SPEAKER_BY_FILE = { "02b_Girls_Tease.wav": "চারুশীলা" };
const speakerFor = (file) => {
  if (SPEAKER_BY_FILE[file] !== undefined) return SPEAKER_BY_FILE[file];
  if (/Narrator|Intro|Outro|Sequential|Motki/i.test(file)) return "";
  if (/Charu/i.test(file)) return "চারুশীলা";
  if (/Babukaka/i.test(file)) return "বাবুকাকা";
  if (/Girls|Tease/i.test(file)) return "মেয়েরা";
  if (/Toddler/i.test(file)) return "বীরু";
  return "কথক";
};
// short subtitle phrases, timed by character share within each cue
function splitPhrases(text) {
  const parts = text.split(/(?<=[।!?,—])\s*/).map((p) => p.trim()).filter(Boolean);
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

// ---- pauses inside scenes: find the hold point (pre-pause frame) and the cut it needs ----
const pauseReport = [];
const pauseAnchors = []; // { cueKey, afterSeq, t }: a pause cut inside a cue (seconds)
const pauses = (NO_PAUSES ? [] : PAUSES).map((p, idx) => {
  const kind = p.at === "open" || p.at === "end" ? p.at : "after";
  const label = `PAUSES[${idx}] (${p.scene}, ${kind === "after" ? `after "${p.after}"` : kind})`;
  const sc = sceneById[p.scene];
  if (NO_PAUSE_SCENES.includes(p.scene)) throw new Error(`${label}: the outro and the next-episode glimpse take no pauses`);
  if (!sc || !voicedScenes.includes(sc)) throw new Error(`${label}: unknown story scene ${p.scene}`);
  if (!(p.sec > 0)) throw new Error(`${label}: sec must be > 0`);
  if (p.at !== undefined && kind === "after") throw new Error(`${label}: at must be "open" or "end"`);
  const frames = Math.round(p.sec * FPS);
  const scenePhrases = allPhrases.filter((q) => q.scene === p.scene);
  if (kind === "open") {
    pauseReport.push(`${label}: holds at story frame 0 (before "${scenePhrases[0]?.text ?? ""}") for ${frames} f`);
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
    pauseAnchors.push({ cueKey: ph.cueKey, afterSeq: ph.seq, t: best.v.t + cutSample / sr });
    where = `cut ${best.v.file} at ${(cutSample / sr).toFixed(3)} s (${best.named ? "named " : ""}silence ${best.s.a.toFixed(3)}-${best.s.b.toFixed(3)} s)`;
  } else {
    const speechEnd = best.A;
    const mid = Number.isFinite(best.B) ? Math.min((best.A + best.B) / 2, speechEnd + BOUNDARY_HOLD) : Math.min(speechEnd + BOUNDARY_HOLD, best.v.t + best.v.dur);
    holdFrame = best.next ? Math.min(f(mid), f(best.next.t)) : f(mid);
    where = `clip boundary after ${best.v.file}${best.next ? " before " + best.next.file : ""} (no cut, speech ends ${speechEnd.toFixed(2)} s)`;
  }
  const atStory = holdFrame - sc.startFrame;
  if (atStory < 0 || atStory > sc.durationFrames) throw new Error(`${label}: hold point ${atStory} lies outside the scene (0..${sc.durationFrames})`);
  pauseReport.push(`${label}: phrase ends ${t.toFixed(2)} s, ${where}, holds at story frame ${atStory} for ${frames} f`);
  return { sceneId: p.scene, kind, holdFrame, atStory, frames, seq: ph.seq, phrase: ph.text, note: p.note };
});
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

// ---- shifts: each scene's pauses push every later scene; inside a scene, everything after the hold point ----
const pauseFramesOf = {};
for (const p of pauses) pauseFramesOf[p.sceneId] = (pauseFramesOf[p.sceneId] || 0) + p.frames;
let cum = 0;
const shiftOf = {};
scenes0.forEach((s) => { shiftOf[s.id] = cum; cum += pauseFramesOf[s.id] || 0; });
const TOTAL_PAUSE = cum;
const shiftAt = (frame) => {
  const id = sceneAt(frame);
  return id ? shiftOf[id] : 0;
};
const pauseShiftAudio = (scene, pre) => pauses.filter((p) => p.sceneId === scene && (p.kind === "open" || (p.kind !== "end" && pre >= p.holdFrame))).reduce((a, p) => a + p.frames, 0);
const pauseShiftCue = (scene, s) => pauses.filter((p) => p.sceneId === scene && s > p.seq).reduce((a, p) => a + p.frames, 0);

const scenes = scenes0.map((s) => ({ ...s, startFrame: s.startFrame + shiftOf[s.id], durationFrames: s.durationFrames + (pauseFramesOf[s.id] || 0) }));
const pauseRows = [];
for (const s of scenes) {
  let before = 0;
  for (const p of pauses.filter((x) => x.sceneId === s.id).sort((x, y) => x.atStory - y.atStory)) {
    pauseRows.push({ sceneId: s.id, atStory: p.atStory, frames: p.frames, startFrame: s.startFrame + p.atStory + before, phrase: p.phrase, kind: p.kind });
    before += p.frames;
  }
}

const audioRows = voice.map((v) => {
  const pre = f(v.t);
  const scene = sceneAt(pre);
  return { file: v.file, original: v.original || v.file, startFrame: pre + shiftAt(pre) + pauseShiftAudio(scene, pre), frames: Math.round(v.dur * FPS) };
});
audioRows.sort((a, b) => a.startFrame - b.startFrame);

const cueRows = allPhrases.map((p) => {
  let from = f(p.from);
  let to = f(p.to);
  // keep a phrase before a pause from running into it, and a phrase after a pause from starting inside it
  for (const q of pauses) {
    if (q.sceneId !== p.scene) continue;
    if (p.seq > q.seq) { from = Math.max(from, q.holdFrame); to = Math.max(to, from); }
    else to = Math.max(from, Math.min(to, q.holdFrame));
  }
  const sh = (p.scene ? shiftOf[p.scene] : shiftAt(f(p.from))) + pauseShiftCue(p.scene, p.seq);
  return { from: from + sh, to: to + sh, text: p.text, speaker: p.speaker };
}).sort((a, b) => a.from - b.from);

// ---- checks ----
const totalEnd = Math.max(...scenes.map((v) => v.startFrame + v.durationFrames));
{
  const errs = [];
  for (const c of cueRows) {
    if (c.to <= c.from) errs.push(`caption "${c.text}" has no length (${c.from}-${c.to})`);
    for (const p of pauseRows) if (c.from < p.startFrame + p.frames && c.to > p.startFrame) errs.push(`caption "${c.text}" (${c.from}-${c.to}) runs into the pause of ${p.sceneId} at ${p.startFrame} (+${p.frames})`);
  }
  cueRows.forEach((c, i) => { if (i && c.from < cueRows[i - 1].to) errs.push(`caption "${c.text}" overlaps the previous one`); });
  for (const a of audioRows) {
    // SPEECH must not play inside a pause: a clip's lead and trail room tone (silencedetect) may run into it, and a
    // part ending at a cut may round 1 frame into it
    const sil = a.file === SOURCE_FILE ? [] : silencesOf(a.file);
    const lead = sil.find((s) => s.a < 0.02);
    const trail = sil.find((s) => s.b > a.frames / FPS - 0.05);
    const speechFrom = a.startFrame + (lead ? Math.floor(lead.b * FPS) : 0);
    const speechTo = a.startFrame + (trail ? Math.ceil(trail.a * FPS) : a.frames);
    for (const p of pauseRows) if (speechFrom < p.startFrame + p.frames - 1 && speechTo > p.startFrame + 1) errs.push(`voice ${a.file} (speech ${speechFrom}-${speechTo}) plays inside the pause of ${p.sceneId} at ${p.startFrame} (+${p.frames})`);
  }
  audioRows.forEach((a, i) => { if (i && a.startFrame < audioRows[i - 1].startFrame + audioRows[i - 1].frames - 1) errs.push(`voice ${a.file} overlaps ${audioRows[i - 1].file}`); });
  if (errs.length) throw new Error("timing checks failed:\n  " + errs.join("\n  "));
}

// ---- write timing.ts ----
const out = ["// AUTO-GENERATED by scripts/build_ep03_timing.js. Do not edit by hand."];
out.push(`export const EP03_FPS = ${FPS};`);
out.push("export interface Ep03Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }");
out.push("export const EP03_SCENES: Ep03Scene[] = [");
for (const v of scenes) out.push(`  { sceneId: ${JSON.stringify(v.id)}, component: ${JSON.stringify(v.component)}, startFrame: ${v.startFrame}, durationFrames: ${v.durationFrames} },`);
out.push("];");
out.push(`export const EP03_TOTAL_FRAMES = ${totalEnd};`);
out.push("export interface Ep03Audio { file: string; startFrame: number; frames: number }");
out.push("export const EP03_AUDIO: Ep03Audio[] = [");
for (const r of audioRows) out.push(`  { file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} },`);
out.push("];");
out.push("/**");
out.push(" * The played parts of each original voice clip (a clip cut at an in-scene pause has several, NAME_p1..NAME_pN;");
out.push(" * an uncut clip has one part, identical to its EP03_AUDIO row).");
out.push(" * Use clipSpan3(original) from src/episode/storyClock.ts for an original clip's whole window.");
out.push(" */");
out.push("export interface Ep03ClipPart { file: string; startFrame: number; frames: number }");
out.push("export const EP03_CLIP_PARTS: Record<string, Ep03ClipPart[]> = {");
for (const o of [...new Set(audioRows.map((r) => r.original))]) {
  const rows = audioRows.filter((r) => r.original === o).map((r) => `{ file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} }`);
  out.push(`  ${JSON.stringify(o)}: [${rows.join(", ")}],`);
}
out.push("};");
out.push("/**");
out.push(" * Held moments inside scenes (PAUSES in the generator, rule CAM-14, table STO-17). The story clock of scene");
out.push(" * `sceneId` holds at its authored local frame `atStory` for `frames`; `startFrame` is the absolute real frame");
out.push(" * where the pause begins. Use useStory3 / cueLocalStory3 / pausesFor3 from src/episode/storyClock.ts.");
out.push(" */");
out.push("export interface Ep03Pause { sceneId: string; atStory: number; frames: number; startFrame: number }");
if (!pauseRows.length) out.push("export const EP03_PAUSES: Ep03Pause[] = [];");
else {
  out.push("export const EP03_PAUSES: Ep03Pause[] = [");
  for (const p of pauseRows) out.push(`  { sceneId: ${JSON.stringify(p.sceneId)}, atStory: ${p.atStory}, frames: ${p.frames}, startFrame: ${p.startFrame} },`);
  out.push("];");
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "timing.ts"), out.join("\n") + "\n", "utf8");

const subs = ["// AUTO-GENERATED by scripts/build_ep03_timing.js. Do not edit by hand.", "export const EP03_CUES: { from: number; to: number; text: string; speaker: string }[] = ["];
for (const c of cueRows) subs.push(`  { from: ${c.from}, to: ${c.to}, text: ${JSON.stringify(c.text)}, speaker: ${JSON.stringify(c.speaker)} },`);
subs.push("];");
fs.writeFileSync(path.join(outDir, "subtitles.ts"), subs.join("\n") + "\n", "utf8");

// scene files that look a cut clip up by its exact file name must switch to clipSpan3(original)
const srcDir = path.join(outRoot, "remotion_studio", "src", "episode03");
const cutOriginals = [...new Set(voice.filter((v) => v.original).map((v) => v.original))];
for (const file of fs.readdirSync(srcDir, { recursive: true })) {
  if (!/\.tsx?$/.test(file) || /^(timing|subtitles)\.ts$/.test(path.basename(file))) continue;
  const src = fs.readFileSync(path.join(srcDir, file), "utf8");
  for (const o of cutOriginals) {
    if (src.includes(`"${o}"`)) console.warn(`WARNING: ${file} looks up "${o}" by name, but that clip is now cut into parts: use clipSpan3("${o}") / EP03_CLIP_PARTS.`);
  }
}

console.log("cuts:");
if (!cutReport.length) console.log("  (none)");
cutReport.forEach((l) => console.log("  " + l));
console.log("pauses:");
if (!pauseReport.length) console.log("  (none)");
pauseReport.forEach((l) => console.log("  " + l));
console.log("re-spread phrases (moved more than 2 f):");
respreadReport.forEach((l) => console.log("  " + l));
console.log("pause table (scene | after | kind | atStory | absolute start | frames):");
for (const r of pauseRows) console.log(`  ${r.sceneId.padEnd(28)} | ${r.phrase} | ${r.kind} | ${r.atStory} | ${r.startFrame} | ${r.frames}`);
console.log("total pauses:", pauseRows.length, "|", pauseRows.reduce((a, r) => a + r.frames, 0), "f");
console.log("visual scenes:");
for (const v of scenes) console.log(`  ${v.id.padEnd(30)} ${v.component.padEnd(28)} start ${v.startFrame}  frames ${v.durationFrames}`);
console.log("total frames:", totalEnd, `(pauses ${TOTAL_PAUSE} f)`, "| audio clips:", audioRows.length, "| subtitle phrases:", cueRows.length);
