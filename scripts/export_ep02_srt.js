#!/usr/bin/env node
/**
 * Export an episode's final, as-rendered subtitles to an SRT file.
 *
 * Reads remotion_studio/src/episodeNN/subtitles.ts (EPNN_CUES) and timing.ts (EPNN_SCENES, EPNN_FPS,
 * EPNN_TOTAL_FRAMES) next to this script, applies the same filter as EpisodeNN.tsx (the intro title page
 * shows no captions: only cues from the start of the second scene on), and writes an SRT with speaker
 * prefixes ("ঠাকুরমা: ...") for character lines. Narrator cues (empty speaker or "কথক") get no prefix,
 * matching SeriesSubtitles, which shows no chip for the narrator.
 *
 * Usage: node scripts/export_ep02_srt.js [episodeNumber=2] [outPath]
 * Default output: $REPO_ROOT/03_Episodes/Episode_NN_*\/04_Video_Assembly/Subtitles_SRT/<folder>_bn_final.srt
 * (REPO_ROOT defaults to C:/Dipankar/Balak_Thakur_AI_Studio). UTF-8, CRLF line endings.
 */
const fs = require("fs");
const path = require("path");

const epNum = parseInt(process.argv[2] || "2", 10);
if (!Number.isInteger(epNum) || epNum < 1) {
  console.error("Usage: node scripts/export_ep02_srt.js [episodeNumber] [outPath]");
  process.exit(1);
}
const NN = String(epNum).padStart(2, "0");
const REPO_ROOT = process.env.REPO_ROOT || "C:/Dipankar/Balak_Thakur_AI_Studio";
const srcDir = path.join(__dirname, "..", "remotion_studio", "src", `episode${NN}`);
const NARRATOR = "কথক";

const subsTs = fs.readFileSync(path.join(srcDir, "subtitles.ts"), "utf8");
const timingTs = fs.readFileSync(path.join(srcDir, "timing.ts"), "utf8");

// --- parse cues: { from: N, to: N, text: "...", speaker: "..." } (JSON-style string literals) ---
const STR = '"(?:[^"\\\\]|\\\\.)*"';
const cueRe = new RegExp(
  `\\{\\s*from:\\s*(\\d+),\\s*to:\\s*(\\d+),\\s*text:\\s*(${STR}),\\s*speaker:\\s*(${STR})\\s*,?\\s*\\}`,
  "g",
);
const allCues = [...subsTs.matchAll(cueRe)].map((m) => ({
  from: +m[1],
  to: +m[2],
  text: JSON.parse(m[3]),
  speaker: JSON.parse(m[4]),
}));
const rawCount = (subsTs.match(/\{\s*from:\s*\d/g) || []).length;
if (!allCues.length || allCues.length !== rawCount) {
  console.error(`Parsed ${allCues.length} cues but found ${rawCount} cue objects in subtitles.ts`);
  process.exit(1);
}

// --- parse timing ---
const num = (re, what) => {
  const m = timingTs.match(re);
  if (!m) throw new Error(`timing.ts: ${what} not found`);
  return +m[1];
};
const fps = num(new RegExp(`EP${NN}_FPS\\s*=\\s*(\\d+)`), "FPS");
const totalFrames = num(new RegExp(`EP${NN}_TOTAL_FRAMES\\s*=\\s*(\\d+)`), "TOTAL_FRAMES");
const scenesBlock = timingTs.match(new RegExp(`EP${NN}_SCENES[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
if (!scenesBlock) throw new Error("timing.ts: SCENES not found");
const starts = [...scenesBlock[1].matchAll(/startFrame:\s*(\d+)/g)].map((m) => +m[1]);
if (starts.length < 2) throw new Error("timing.ts: fewer than two scenes");

// Same filter as EpisodeNN.tsx: cues.filter((c) => c.from >= EPNN_SCENES[1].startFrame)
const cues = allCues.filter((c) => c.from >= starts[1]);

// --- checks ---
const errors = [];
cues.forEach((c, i) => {
  if (c.to <= c.from) errors.push(`cue ${i + 1}: end ${c.to} <= start ${c.from}`);
  if (i > 0 && c.from < cues[i - 1].to) errors.push(`cue ${i + 1}: overlaps previous (${c.from} < ${cues[i - 1].to})`);
  if (i > 0 && c.from < cues[i - 1].from) errors.push(`cue ${i + 1}: start not increasing`);
});
if (cues.length && cues[cues.length - 1].to > totalFrames)
  errors.push(`last cue ends at ${cues[cues.length - 1].to} > total frames ${totalFrames}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// --- write SRT ---
const srtTime = (frame) => {
  const ms = Math.round((frame * 1000) / fps);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const blocks = cues.map((c, i) => {
  const sp = c.speaker && c.speaker !== NARRATOR ? `${c.speaker}: ` : "";
  return `${i + 1}\r\n${srtTime(c.from)} --> ${srtTime(c.to)}\r\n${sp}${c.text}\r\n`;
});

let outPath = process.argv[3];
if (!outPath) {
  const epRoot = path.join(REPO_ROOT, "03_Episodes");
  const folder = fs.readdirSync(epRoot).find((d) => d.startsWith(`Episode_${NN}_`));
  if (!folder) throw new Error(`No Episode_${NN}_* folder in ${epRoot}`);
  outPath = path.join(epRoot, folder, "04_Video_Assembly", "Subtitles_SRT", `${folder}_bn_final.srt`);
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, blocks.join("\r\n"), "utf8");

const last = cues[cues.length - 1];
console.log(`Wrote ${outPath}`);
console.log(`Cues: ${cues.length} (of ${allCues.length}; filtered from frame ${starts[1]})`);
console.log(`Last cue ends: ${srtTime(last.to)} (frame ${last.to}); episode length ${srtTime(totalFrames)} (${totalFrames} frames)`);
