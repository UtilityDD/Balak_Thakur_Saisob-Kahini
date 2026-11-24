#!/usr/bin/env node
/**
 * Export a Ghibli-pipeline episode's as-rendered captions to an SRT file.
 *
 * Reads remotion_studio/src/ghibli_pipeline/episodeNN/subtitles.ts (the `EPxxG_CUES` array of
 * {"from","to","text","speaker"} objects — exactly what SeriesSubtitles burns into the picture) and writes an SRT.
 * Character lines get a speaker prefix ("ঠাকুরমা: ..."); narrator cues (empty speaker or "কথক") get none,
 * matching SeriesSubtitles, which shows no chip for the narrator. Frames are 24 fps.
 *
 * Usage: node scripts/export_ghibli_srt.js <episodeNumber> <outPath.srt>
 * Output: UTF-8 with BOM (players show Bengali correctly), CRLF line endings.
 */
const fs = require("fs");
const path = require("path");

const epNum = parseInt(process.argv[2] || "", 10);
const outPath = process.argv[3];
if (!Number.isInteger(epNum) || !outPath) {
  console.error("Usage: node scripts/export_ghibli_srt.js <episodeNumber> <outPath.srt>");
  process.exit(1);
}
const NN = String(epNum).padStart(2, "0");
const FPS = 24;
const NARRATOR = "কথক";
const src = path.join(__dirname, "..", "remotion_studio", "src", "ghibli_pipeline", `episode${NN}`, "subtitles.ts");
const ts = fs.readFileSync(src, "utf8");

const STR = '"(?:[^"\\\\]|\\\\.)*"';
const k = (name) => `"?${name}"?\\s*:\\s*`;
const cueRe = new RegExp(
  `\\{\\s*${k("from")}(\\d+)\\s*,\\s*${k("to")}(\\d+)\\s*,\\s*${k("text")}(${STR})\\s*,\\s*${k("speaker")}(${STR})\\s*,?\\s*\\}`,
  "g",
);
const cues = [...ts.matchAll(cueRe)].map((m) => ({
  from: +m[1],
  to: +m[2],
  text: JSON.parse(m[3]),
  speaker: JSON.parse(m[4]),
}));
if (!cues.length) {
  console.error(`No cues parsed from ${src}`);
  process.exit(1);
}
cues.sort((a, b) => a.from - b.from);

const tc = (frame) => {
  const ms = Math.round((frame / FPS) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};

const problems = [];
const blocks = cues.map((c, i) => {
  if (c.to <= c.from) problems.push(`cue ${i + 1} has no duration (${c.from}-${c.to})`);
  if (i > 0 && c.from < cues[i - 1].to) problems.push(`cue ${i + 1} overlaps the previous one (${c.from} < ${cues[i - 1].to})`);
  const who = c.speaker && c.speaker !== NARRATOR ? `${c.speaker}: ` : "";
  return `${i + 1}\r\n${tc(c.from)} --> ${tc(c.to)}\r\n${who}${c.text}\r\n`;
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, "﻿" + blocks.join("\r\n"), "utf8");
const longest = Math.max(...cues.map((c) => [...c.text].length));
console.log(`${cues.length} cues -> ${outPath} (longest line ${longest} chars)`);
for (const p of problems) console.log(`WARNING: ${p}`);
