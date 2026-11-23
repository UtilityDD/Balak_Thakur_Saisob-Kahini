#!/usr/bin/env node
/**
 * Builds Episode 6 ("জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী": the elder brother saved from the father's beating, book
 * ch. 10; the playmates' treasurer and the ten-rupee note, book ch. 12, with ch. 11 summarised in one clause) from its
 * scene manifest, voice durations and Bengali SRT. Written 2026-11-22 as a copy of scripts/build_ep05_timing.js: same
 * intro, source card, outro, sentence-silence cutting into _pN parts, PAUSES, action GAPS (with the "end" kind),
 * chapter BREAKS and caption control (PHRASE_SPLITS, PHRASE_ANCHORS: phrase starts pinned to the voice). The tables
 * hold the director's approved plan (STO-21, 2026-11-22, recommended answers, default length: 03_Episodes/
 * Episode_06_Rescuing_Brother_and_Playmates/01_Script_and_Storyboard/Ep06_Shots_and_Pauses_DRAFT.md, "Notes for
 * whoever codes this"): 6 pauses (8.5 s), 2 action gaps (S01 end AG1+AG2 4.0 s, S02 AG3 2.5 s), 1 chapter break
 * (1 s) after scene 01. IMMERSIVE RE-CUT (STO-22a, 2026-11-23, Ep06_Immersive_Recut_PLAN.md): 7 pauses (14.5 s), 5 action
 * gaps (+ S01 open W1 3.0 s, S02 open W2 2.5 s replacing the open pause, S02 L1 2.0 s at P2's point), the same break.
 * A run also checks TIM-EP06-01: every PHRASE_ANCHORS phrase starts within 1 frame of its voice after all shifts.
 * Voice clips go on the absolute timeline (EP06_AUDIO); each manifest scene becomes one visual scene. Writes
 * remotion_studio/src/episode06/timing.ts and subtitles.ts (frames at 24 fps). Story scenes: 01_saving_elder_brother,
 * 02_treasurer_and_ten_rupees; then the outro 99 (series template, no pauses, no gaps).
 *
 * VOICES: public/audio/ep06 holds the Normalized_48k clips from 03_Episodes/<EP>/02_Audio/Voice_WAVs/Normalized_48k,
 * levelled 2026-11-22 with scripts/normalize_audio.py --episode (two-pass loudnorm, -16 LUFS / -1.5 dBTP, 48 kHz
 * mono 16-bit, lengths KEPT; originals in Voice_WAVs/_original_levels/). Unlike Episode 5's trimmed clips these are the
 * full takes: their lengths equal the raw 24 kHz WAVs and audio_durations.json. loudnorm fell back to dynamic mode on
 * all six (-15.9 to -16.6 LUFS, -1.5 dBTP, as Episode 2's). 00a_Source_Attribution.wav is Episode 5's levelled card
 * (identical to Episodes 3 to 5). The SRT's cues were timed on the earlier TRIMMED clips (each cue 0.12 to 0.27 s
 * shorter than its clip now; the length check allows 0.3 s): a cue starts where its clip starts, so the voice begins
 * after the clip's lead room tone, and PHRASE_ANCHORS pin the phrase starts the character-share estimate misplaces.
 *
 * SILENCES: every run writes scripts/ep06_silences.txt: for every voice clip, its silences (silencedetect -45 dB /
 * 0.12 s on the played file, start and length in the clip's own seconds), which are lead / trail room tone and which
 * are interior candidates, and the subtitle phrase ending nearest each candidate. Put "after" pauses and gaps at
 * those true silences (or name one with clip + silence).
 *
 * SOURCE CARD (as Episode 3): 00a_Source_Attribution.wav at cues[0].end + 0.3 s; every later clip and cue moves
 * later by SOURCE_DUR + 0.5 s. Scene 00b_source_attribution spans it.
 *
 * NEXT-EPISODE GLIMPSE: the manifest has no 98 scene, and Episode 6's outro narration carries the
 * "আসছে পরের পর্ব" teaser (Episode 7, "লববাবুর পাঠশালা") well inside its 24.0 s, so the
 * glimpse (TTL-10a) is a layer inside the outro and there is no extra 98 segment (NEXT_EPISODE_FRAMES = 0; set it > 0
 * to append one as Episode 3 does).
 *
 * PAUSES INSIDE SCENES (rule CAM-14; mechanism of scripts/build_ep02_timing.js / build_ep03_timing.js, see
 * docs/PIPELINE_DECISIONS.md TIM-PAUSE-01/02/03). The table below is the approved plan (STO-21).
 * A pause is a held moment between two narration sentences INSIDE a scene: the voice stops, the story action
 * waits, life (breathing, blinks, ambient sound) goes on. Entry kinds:
 *   after: "<snippet>"  between two sentences: the one subtitle phrase of `scene` containing the snippet; the
 *                       generator cuts the voice clip at the middle of the nearest sentence silence (ffmpeg
 *                       silencedetect -45 dB / 0.12 s on the played file in public/audio/ep06; it must lie within
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
 * part, cue and pause after it (and every later scene) moves later by it, and `f` from useStory6 runs straight
 * through it. Story frames of a scene with gaps therefore INCLUDE them (cueLocalStory6 already returns them). Optional
 * `beats` [{ id, sec }] name sub-steps of a gap (their lengths must sum to the gap; the last absorbs rounding).
 * Order at one hold point: pauses, then the gap, then afterGap pauses.
 *
 * CHAPTER BREAKS (CAM-10, 2026-11-22). BREAKS [{ after, sec }]: `sec` of timeline after scene `after` in which no
 * scene is mounted (Episode06.tsx, a later round, draws black and places the chime). The scene before is cut to the frames it
 * shows alone (its 1 s TAIL no longer overlaps the next scene) plus its pauses, so at these joins nothing
 * cross-dissolves: scene `after` ends, the break runs, the next scene starts (its fade-in runs on lifeF, as it
 * plays inside an open pause or an action gap).
 *
 * SPEAKERS (voice script + the plan's book check, book.xlsx rows 16 and 18, 2026-11-22; STO-18). A voice ID borrowed
 * from a character does not prove that character speaks (Episode 3, STO-17a), so each line was checked against the book:
 *   01b_Young_Thakur_Forgive.wav  বীরু  (book ch. 10: the boy to his father, "যাও বাবা, আমি বলব না ..."; voice ID
 *                                        12_Balak_Thakur_Child)
 * The other clips are narration (00_Intro, 01a, 02a, 02b, 99): the father's question, the elder's plea and the
 * friend's whisper are told by the narrator, not voiced. No recording disagrees with the book on who speaks.
 *
 * Exports for scene code (helpers in src/episode/storyClock.ts: useStory6, cueLocalStory6, clipSpan6 ...):
 *   EP06_PAUSES      { sceneId, atStory, frames, startFrame }: atStory is the scene-local STORY frame (the scene's
 *                    original authored timing) where the story clock holds; startFrame is the absolute real frame.
 *   EP06_CLIP_PARTS  original file -> its played parts { file, startFrame, frames } (uncut clips: one part).
 *   EP06_GAPS        { sceneId, fromStory, frames, startFrame, beats: [{ id, fromStory, frames }] }: fromStory is the
 *                    scene-local story frame where the gap begins (story frames run through it); startFrame is the
 *                    absolute real frame. Helpers gapsFor6 / gapState6, and useStory6(...).gap.
 *   EP06_BREAKS      { after, next, frames, startFrame }: the chapter break's absolute real frames
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
const epDir = path.join(root, "03_Episodes", "Episode_06_Rescuing_Brother_and_Playmates");
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(outRoot, "remotion_studio", "src", "episode06");
const VOICE_DIR = path.join(outRoot, "remotion_studio", "public", "audio", "ep06");
const NO_PAUSES = process.env.NO_PAUSES === "1";
const FPS = 24;
const MAX_CHARS = 36;
const TAIL = 1; // seconds a scene lingers past its last narration

/*
 * PAUSES inside scenes: the director's approved table (STO-21, 2026-11-22; plan 03_Episodes/
 * Episode_06_Rescuing_Brother_and_Playmates/01_Script_and_Storyboard/Ep06_Shots_and_Pauses_DRAFT.md, "Notes for
 * whoever codes this", recommended answers, default length, not the fuller version): 6 pauses, 8.5 s; no pauses in
 * the outro 99. The cuts in 01a and 02a sit at the silences measured (-45 dB / 0.12 s) on the final levelled files in
 * public/audio/ep06 (scripts/ep06_silences.txt), named for certainty; the plan's values (-38 dB on the raw takes) were
 * 01a [6.992, 7.998], [11.403, 12.431] and 02a [16.760, 17.204]. 02a's silence is listed as two adjacent runs
 * (16.776-17.013, 17.013-17.177); the named span covers both (cut at its middle, 16.977 s).
 * Shape: { scene: S01, after: "<unique phrase snippet>", sec: 1.5, note: "..." },
 *        { scene, at: "open" | "end", sec, note }, optional clip + silence: [a, b] for an "after" entry,
 *        optional afterGap: true (hold at the end of the action gap at the same point).
 */
const S01 = "01_saving_elder_brother";
const S02 = "02_treasurer_and_ten_rupees";
/*
 * IMMERSIVE RE-CUT (STO-22a, approved 2026-11-23; plan 01_Script_and_Storyboard/Ep06_Immersive_Recut_PLAN.md, section 4
 * and the Time columns): S01 P2 1.0 -> 2.0 s (C1), P3 1.5 -> 3.0 s (G1); S02's open pause replaced by the open action
 * gap W2 (GAPS), new mid pause T1 after "বিশ্বাস করত!" (02a sentence silence 9.838-10.419; the breath 10.419-10.621 and
 * the short run 10.621-10.788 follow and open the next sentence), P2 1.5 -> 2.0 s (D2), new mid pause R1 in 02b after
 * "দু'আনা দিলেন—" (silence 3.929-4.537), P3 2.0 -> 3.5 s (G2). Delivered cut: 2,978 f; re-cut: 3,302 f.
 */
const PAUSES = [
  { scene: S01, after: "শব্দ শুনে।", sec: 1.5, clip: "01a_Narrator_Brother.wav", silence: [7.032, 7.994], note: "P1: Balak alone, hurt; the khadam clacks come nearer" },
  { scene: S01, after: "কোথায়—", sec: 2.0, clip: "01a_Narrator_Brother.wav", silence: [11.506, 12.424], note: "P2 + C1: Balak's choice as a point-of-view sequence (brother's eyes, father's face, push in on Balak)" },
  { scene: S01, at: "end", sec: 3.0, note: "P3 + G1 (after AG1, AG2): afterglow on the veranda edge, sparrow; glow beat 1; then CB1" },
  { scene: S02, after: "বিশ্বাস করত!", sec: 1.5, clip: "02a_Narrator_Friends.wav", silence: [9.838, 10.419], note: "T1: the treasury in close-up (hands, gamchha, marbles)" },
  { scene: S02, after: "রাখতে দিলে,", sec: 2.0, clip: "02a_Narrator_Friends.wav", silence: [16.776, 17.177], note: "P2 + D2: the dilemma made visible (three looks); L1 runs after it" },
  { scene: S02, after: "দু'আনা দিলেন—", sec: 1.0, clip: "02b_Narrator_Lozenges.wav", silence: [3.929, 4.537], note: "R1: reactions (dada's eyebrows, boudi's smile, the culprit's red ears)" },
  { scene: S02, at: "end", sec: 3.5, note: "P3 + G2: afterglow, the boys on the fallen log at sunset; glow beat 2" },
];
/*
 * ACTION GAPS: picture time with no narration in which the story clock keeps running (TIM-GAP-01, header).
 * Shape: { scene, at: "open" | "end", sec } or { scene, after: "<snippet>", sec }, optional beats [{ id, sec }], note.
 * at: "end" (as Episode 5's AG2) holds at the scene's end-pause point (its last solo story frame); there the gap runs
 * FIRST and the end pause holds after it (S01: AG1+AG2, then P3).
 */
const GAPS = [
  {
    scene: S01, at: "open", sec: 3.0, note: "W1 (re-cut): the world before the words, before \"একদিন…\"",
    beats: [
      { id: "a_lane_walk", sec: 1.75 }, // the two boys walk home along the lane with slates; hen and chicks cross
      { id: "b_courtyard_plates", sec: 1.25 }, // the courtyard: kitchen smoke, two empty brass plates; the elder flops down, impatient
    ],
  },
  {
    scene: S01, at: "end", sec: 4.0, note: "AG1+AG2 (after 01b, the scene's last line, before P3)",
    beats: [
      { id: "a_father_leaves", sec: 2.0 }, // the father throws up a hand, shakes his head, clacks out through the fence gap
      { id: "b_brother_comes_out", sec: 2.0 }, // the elder edges out, sheepish before Balak, then grins and runs off
    ],
  },
  {
    scene: S02, at: "open", sec: 2.5, note: "W2 (re-cut, replaces the 1.0 s open pause): kite, goat, woman with the pot, the field; the fade-in from CB1 plays over it",
    beats: [
      { id: "a_world", sec: 2.5 },
    ],
  },
  {
    // L1 (re-cut): at P2's hold point; the pause holds first, then this gap runs (order at one point: pauses, then the gap)
    scene: S02, after: "রাখতে দিলে,", sec: 2.0, clip: "02a_Narrator_Friends.wav", silence: [16.776, 17.177], note: "L1: the চুপিচুপি walk to the friend's house, before \"ঠাকুর চুপিচুপি\"",
    beats: [
      { id: "a_lane_walk", sec: 1.0 }, // Balak walks down the lane, the folded note to his chest
      { id: "b_haystack_duck", sec: 1.0 }, // he ducks behind a haystack as the culprit crosses far ahead, then hurries on
    ],
  },
  {
    scene: S02, after: "ফিরিয়ে দিয়ে এলেন।", sec: 2.5, note: "AG3 (clip boundary 02a/02b): the friend asks for the note back",
    beats: [
      { id: "a_friend_returns", sec: 1.5 }, // the friend returns with three boys, palm out; Balak, hand on head, empty palms
      { id: "b_friend_stalks_off", sec: 1.0 }, // the friend's face falls; he stamps a foot and stalks off home
    ],
  },
];
/* CHAPTER BREAKS (CAM-10): black, no scene mounted, after the scene's end pause; no cross-dissolve at these joins. */
const BREAKS = [
  { after: S01, sec: 1.0 }, // CB1: fade to black over P3's last 18 f, 8 f black with chime_pop, scene 02 fades in on lifeF
];
/*
 * CAPTION PHRASES (approved plan, "Captions"). PHRASE_SPLITS replaces the automatic phrase split of one clip's cue
 * (the phrases must rebuild the cue text). PHRASE_ANCHORS pins a phrase's START to the voice (seconds in the clip's
 * own time, from the measured word starts), so no caption leads its voice; the phrases between two anchors are spread
 * by character count as usual (the same re-spread as at a pause cut).
 */
const PHRASE_SPLITS = {
  "01a_Narrator_Brother.wav": ["একদিন বড় ভাই অকারণে ছোট ভাইকে মেরে", "লুকিয়ে পড়ল বাবার পায়ের শব্দ শুনে।", "বাবা এসে জিজ্ঞেস করলেন বড় ছেলে কোথায়—", "কিন্তু পিঠের ব্যথা নিয়েও", "ছোট্ট ঠাকুর দাদাকে বাঁচিয়ে দিলেন!"],
  "02a_Narrator_Friends.wav": ["খেলার সাথীরা তাঁকে ভোলাভালা ভেবে", "প্রায়ই ঠকাত—", "কিন্তু দামি জিনিস বা টাকা রাখতে হলে", "সবাই তাঁকেই বিশ্বাস করত!", "একদিন এক বন্ধু দাদার পকেট থেকে", "দশ টাকা চুরি করে", "তাঁর কাছে রাখতে দিলে,", "ঠাকুর চুপিচুপি সেই টাকা বৌদিকে", "ফিরিয়ে দিয়ে এলেন।"],
  "02b_Narrator_Lozenges.wav": ["সত্য প্রকাশ হতেই বৌদি খুশি হয়ে", "তাঁকে দু'আনা দিলেন—", "আর দয়ালু ঠাকুর সেই দু'আনা দিয়ে", "সব বন্ধুদেরই মিষ্টি লজেন্স", "কিনে খাওয়ালেন!"],
};
// Phrase starts measured on the played files (scripts/ep06_silences.txt: silencedetect -45 dB / 0.12 s, plus -32 dB
// and a -45 dB / 0.04 s scan where the first finds no gap; words mapped to speech runs by sentence order and syllable count,
// 2026-11-22). Every phrase that starts right after a silence is pinned to the silence's end. The cues' timing came
// from the earlier trimmed clips, so a cue's FIRST phrase is pinned too (Episode 6 addition: an anchor on the cue's
// first phrase moves that phrase's start, i.e. it skips the clip's lead room tone). At a pause cut the anchor replaces
// the cut as the phrase start (the caption before still ends at the cut).
const PHRASE_ANCHORS = [
  { clip: "01a_Narrator_Brother.wav", startsWith: "একদিন বড় ভাই", at: 0.33 }, // lead 0.000-0.333
  { clip: "01a_Narrator_Brother.wav", startsWith: "লুকিয়ে পড়ল", at: 4.48 }, // silence 3.969-4.388, 4.392-4.476 (40 ms scan)
  { clip: "01a_Narrator_Brother.wav", startsWith: "বাবা এসে", at: 7.99 }, // P1 silence 7.032-7.994
  { clip: "01a_Narrator_Brother.wav", startsWith: "কিন্তু পিঠের", at: 12.42 }, // P2 silence 11.506-12.424
  { clip: "01b_Young_Thakur_Forgive.wav", startsWith: "যাও বাবা", at: 0.24 }, // lead 0.072-0.243
  { clip: "01b_Young_Thakur_Forgive.wav", startsWith: "আমি বলব না", at: 1.43 }, // silence 1.296-1.425
  { clip: "01b_Young_Thakur_Forgive.wav", startsWith: "বললে তো", at: 2.95 }, // silence 2.615-2.954
  { clip: "02a_Narrator_Friends.wav", startsWith: "খেলার সাথীরা", at: 0.36 }, // lead 0.000-0.355
  { clip: "02a_Narrator_Friends.wav", startsWith: "প্রায়ই ঠকাত", at: 3.10 }, // silence 2.964-3.099
  { clip: "02a_Narrator_Friends.wav", startsWith: "কিন্তু দামি", at: 4.54 }, // silences 4.127-4.302, 4.418-4.542
  { clip: "02a_Narrator_Friends.wav", startsWith: "সবাই তাঁকেই", at: 8.02 }, // 40 ms scan: 7.970-8.015 (by syllable count)
  { clip: "02a_Narrator_Friends.wav", startsWith: "একদিন এক বন্ধু", at: 10.79 }, // silence 9.838-10.419, breath, 10.621-10.788
  { clip: "02a_Narrator_Friends.wav", startsWith: "দশ টাকা", at: 13.80 }, // 40 ms scan: 13.687-13.804 (by syllable count; confirm by ear)
  { clip: "02a_Narrator_Friends.wav", startsWith: "ঠাকুর চুপিচুপি", at: 17.18 }, // P2 silence 16.776-17.177
  { clip: "02b_Narrator_Lozenges.wav", startsWith: "সত্য প্রকাশ", at: 0.21 }, // lead 0.000-0.212
  { clip: "02b_Narrator_Lozenges.wav", startsWith: "তাঁকে দু", at: 2.79 }, // 40 ms scan: 2.707-2.792 (by syllable count)
  { clip: "02b_Narrator_Lozenges.wav", startsWith: "আর দয়ালু", at: 4.63 }, // silence 3.929-4.537, 4.566-4.633 (40 ms scan)
  { clip: "02b_Narrator_Lozenges.wav", startsWith: "সব বন্ধুদেরই", at: 6.45 }, // -32 dB gap 6.303-6.446
  { clip: "02b_Narrator_Lozenges.wav", startsWith: "কিনে", at: 8.84 }, // 40 ms scan: 8.782-8.835 (by syllable count)
  { clip: "99_Outro_Sequential.wav", startsWith: "ক্ষমা,", at: 0.26 }, // lead 0.000-0.258
  { clip: "99_Outro_Sequential.wav", startsWith: "এই তিন গুণ", at: 4.91 }, // silence 4.371-4.914
  { clip: "99_Outro_Sequential.wav", startsWith: "ছোটদের বালক", at: 9.50 }, // silence 8.816-9.498
  { clip: "99_Outro_Sequential.wav", startsWith: "আসছে পরের", at: 11.43 }, // silence 11.213-11.431
  { clip: "99_Outro_Sequential.wav", startsWith: "শুরু হচ্ছে", at: 15.08 }, // silence 14.888-15.080 (-32 dB: 14.868-15.162)
  { clip: "99_Outro_Sequential.wav", startsWith: "কড়া পণ্ডিত", at: 17.91 }, // silences 17.179-17.549-17.912
  { clip: "99_Outro_Sequential.wav", startsWith: "কী করলেন", at: 20.51 }, // silence 20.366-20.513
  { clip: "99_Outro_Sequential.wav", startsWith: "দেখুন পরের", at: 22.27 }, // silence 21.939-22.268
];
const PAUSE_TOL = 0.5; // seconds: the cut silence must lie this close to the phrase end
const BOUNDARY_HOLD = 0.3; // s: at a clip boundary the story holds this long after the speech ends (or mid-gap)
const NO_PAUSE_SCENES = ["99_closing_sequential_outro", "98_next_episode"]; // the series template (no pauses)

const probeDur = (file) => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();
const durations = JSON.parse(fs.readFileSync(path.join(epDir, "02_Audio", "Voice_WAVs", "audio_durations.json"), "utf8"));
const srt = fs.readFileSync(path.join(epDir, "04_Video_Assembly", "Subtitles_SRT", "Episode_06_Rescuing_Brother_and_Playmates_bn.srt"), "utf8");
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
const SOURCE_DUR = probeDur(path.join(VOICE_DIR, SOURCE_FILE)); // the played card (Episode 5's levelled copy, 18.6 s)
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
// No separate next-episode segment for Episode 6: the glimpse (Episode 7) is a layer inside the outro (header).
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
  "01b_Young_Thakur_Forgive.wav": "বীরু",
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
// phrase starts pinned to the voice (PHRASE_ANCHORS): { cueKey, afterSeq, t } like a pause cut, re-spread below.
// An anchor on a cue's FIRST phrase (Episode 6) goes to firstAnchors: that cue's phrases are spread from it, not
// from the cue start (the clip's lead room tone shows no caption).
const firstAnchors = {}; // cueKey -> seconds
const captionAnchors = [];
for (const a of PHRASE_ANCHORS) {
  const ci = clipFiles.indexOf(a.clip);
  if (ci < 0) throw new Error(`PHRASE_ANCHORS: unknown clip ${a.clip}`);
  const mine = allPhrases.filter((q) => q.cueKey === `main:${ci}`);
  const hits = mine.filter((q) => q.text.startsWith(a.startsWith));
  if (hits.length !== 1) throw new Error(`PHRASE_ANCHORS ${a.clip} "${a.startsWith}": needs exactly one phrase starting so`);
  if (!(a.at > 0 && a.at < clips[ci].dur)) throw new Error(`PHRASE_ANCHORS ${a.clip} "${a.startsWith}": ${a.at} s lies outside the clip`);
  const t = clips[ci].start + a.at;
  if (hits[0] === mine[0]) {
    if (!(t < cues[ci].end)) throw new Error(`PHRASE_ANCHORS ${a.clip} "${a.startsWith}": ${a.at} s lies after the cue end`);
    firstAnchors[`main:${ci}`] = t;
  } else captionAnchors.push({ cueKey: `main:${ci}`, afterSeq: hits[0].seq - 1, t });
}

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
  // (as Episode 5: an action gap may also take "end": it runs at the end-pause point, before any end pause)
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
for (const key of [...new Set([...allAnchors.map((a) => a.cueKey), ...Object.keys(firstAnchors)])]) {
  const list = allPhrases.filter((q) => q.cueKey === key).sort((x, y) => x.seq - y.seq);
  const anchors = allAnchors.filter((a) => a.cueKey === key).map((a) => ({ idx: list.findIndex((q) => q.seq === a.afterSeq), t: a.t }));
  anchors.sort((x, y) => x.t - y.t);
  anchors.push({ idx: list.length - 1, t: list[0].cueTo });
  let i = 0;
  let segStart = firstAnchors[key] ?? list[0].cueFrom;
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
  return { from: from + sh, to: to + sh, text: p.text, speaker: p.speaker, scene: p.scene, seq: p.seq };
}).sort((a, b) => a.from - b.from);

// ---- checks ----
const anchorReport = [];
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
  // TIM-EP06-01: every PHRASE_ANCHORS phrase starts within 1 frame of its voice after all pauses, gaps and breaks
  for (const a of PHRASE_ANCHORS) {
    const ci = clipFiles.indexOf(a.clip);
    const ph = allPhrases.find((q) => q.cueKey === `main:${ci}` && q.text.startsWith(a.startsWith));
    const row = cueRows.find((c) => c.seq === ph.seq);
    const parts = voice.filter((v) => (v.original || v.file) === a.clip);
    let off = 0;
    let part = null;
    for (const v of parts) { if (a.at >= off && a.at < off + v.dur) { part = v; break; } off += v.dur; }
    const prow = part && audioRows.find((r) => r.file === part.file);
    if (!prow) { errs.push(`anchor ${a.clip} "${a.startsWith}": no played part holds ${a.at} s`); continue; }
    const voiceFrame = prow.startFrame + (a.at - off) * FPS;
    anchorReport.push(`${a.clip.padEnd(30)} "${a.startsWith}" voice ${voiceFrame.toFixed(1)} caption ${row.from} (${(row.from - voiceFrame).toFixed(1)} f)`);
    if (Math.abs(row.from - voiceFrame) > 1) errs.push(`anchor ${a.clip} "${a.startsWith}": caption starts at ${row.from}, voice at ${voiceFrame.toFixed(1)} (more than 1 frame apart)`);
  }
  if (errs.length) throw new Error("timing checks failed:\n  " + errs.join("\n  "));
}

// ---- write timing.ts ----
const out = ["// AUTO-GENERATED by scripts/build_ep06_timing.js. Do not edit by hand."];
out.push(`export const EP06_FPS = ${FPS};`);
out.push("export interface Ep06Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }");
out.push("export const EP06_SCENES: Ep06Scene[] = [");
for (const v of scenes) out.push(`  { sceneId: ${JSON.stringify(v.id)}, component: ${JSON.stringify(v.component)}, startFrame: ${v.startFrame}, durationFrames: ${v.durationFrames} },`);
out.push("];");
out.push(`export const EP06_TOTAL_FRAMES = ${totalEnd};`);
out.push("export interface Ep06Audio { file: string; startFrame: number; frames: number }");
out.push("export const EP06_AUDIO: Ep06Audio[] = [");
for (const r of audioRows) out.push(`  { file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} },`);
out.push("];");
out.push("/**");
out.push(" * The played parts of each original voice clip (a clip cut at an in-scene pause has several, NAME_p1..NAME_pN;");
out.push(" * an uncut clip has one part, identical to its EP06_AUDIO row).");
out.push(" * Use clipSpan6(original) from src/episode/storyClock.ts for an original clip's whole window.");
out.push(" */");
out.push("export interface Ep06ClipPart { file: string; startFrame: number; frames: number }");
out.push("export const EP06_CLIP_PARTS: Record<string, Ep06ClipPart[]> = {");
for (const o of [...new Set(audioRows.map((r) => r.original))]) {
  const rows = audioRows.filter((r) => r.original === o).map((r) => `{ file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} }`);
  out.push(`  ${JSON.stringify(o)}: [${rows.join(", ")}],`);
}
out.push("};");
out.push("/**");
out.push(" * Held moments inside scenes (PAUSES in the generator, rule CAM-14, the approved table STO-21). The story clock of");
out.push(" * scene `sceneId` holds at its local story frame `atStory` for `frames`; `startFrame` is the absolute real frame");
out.push(" * where the pause begins. Story frames include the scene's action gaps (EP06_GAPS).");
out.push(" * Use useStory6 / cueLocalStory6 / pausesFor6 from src/episode/storyClock.ts.");
out.push(" */");
out.push("export interface Ep06Pause { sceneId: string; atStory: number; frames: number; startFrame: number }");
if (!pauseRows.length) out.push("export const EP06_PAUSES: Ep06Pause[] = [];");
else {
  out.push("export const EP06_PAUSES: Ep06Pause[] = [");
  for (const p of pauseRows) out.push(`  { sceneId: ${JSON.stringify(p.sceneId)}, atStory: ${p.atStory}, frames: ${p.frames}, startFrame: ${p.startFrame} },`);
  out.push("];");
}
out.push("/**");
out.push(" * Action gaps (GAPS in the generator, TIM-GAP-01): picture time with no narration in which the story clock KEEPS");
out.push(" * RUNNING. Scene-local story frames [fromStory, fromStory + frames) are the gap; startFrame is its absolute real");
out.push(" * start. `beats` name its sub-steps in story frames. `kind`: \"open\" (before the first line), \"after\" (between");
out.push(" * two lines) or \"end\" (after the last line: it runs first, then the scene's end pause holds). Use gapsFor6 / gapState6");
out.push(" * or useStory6(...).gap.");
out.push(" */");
out.push("export interface Ep06GapBeat { id: string; fromStory: number; frames: number }");
out.push("export interface Ep06Gap { sceneId: string; kind: \"open\" | \"after\" | \"end\"; fromStory: number; frames: number; startFrame: number; beats: Ep06GapBeat[] }");
if (!gapRows.length) out.push("export const EP06_GAPS: Ep06Gap[] = [];");
else {
  out.push("export const EP06_GAPS: Ep06Gap[] = [");
  for (const g of gapRows) out.push(`  { sceneId: ${JSON.stringify(g.sceneId)}, kind: ${JSON.stringify(g.kind)}, fromStory: ${g.fromStory}, frames: ${g.frames}, startFrame: ${g.startFrame}, beats: [${g.beats.map((b) => `{ id: ${JSON.stringify(b.id)}, fromStory: ${b.fromStory}, frames: ${b.frames} }`).join(", ")}] },`);
  out.push("];");
}
out.push("/**");
out.push(" * Chapter breaks (CAM-10): absolute real frames [startFrame, startFrame + frames) after scene `after`, in which no");
out.push(" * scene is mounted (draw black, place the chime). `after` ends at startFrame and `next` starts at its end: no");
out.push(" * cross-dissolve at these joins.");
out.push(" */");
out.push("export interface Ep06Break { after: string; next: string; frames: number; startFrame: number }");
if (!breakRows.length) out.push("export const EP06_BREAKS: Ep06Break[] = [];");
else {
  out.push("export const EP06_BREAKS: Ep06Break[] = [");
  for (const b of breakRows) out.push(`  { after: ${JSON.stringify(b.after)}, next: ${JSON.stringify(b.next)}, frames: ${b.frames}, startFrame: ${b.startFrame} },`);
  out.push("];");
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "timing.ts"), out.join("\n") + "\n", "utf8");

const subs = ["// AUTO-GENERATED by scripts/build_ep06_timing.js. Do not edit by hand.", "export const EP06_CUES: { from: number; to: number; text: string; speaker: string }[] = ["];
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

// ---- the sentence-silence list (scripts/ep06_silences.txt): where pauses and gaps can sit ----
{
  const SENTENCE_MIN = 0.2; // s: interior silences at least this long are listed as sentence-silence candidates
  const lines = [
    "# Episode 6 voice clips: silences (ffmpeg silencedetect -45 dB / 0.12 s) on the played, levelled files in",
    "# remotion_studio/public/audio/ep06. Written by scripts/build_ep06_timing.js on every run; do not edit by hand.",
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
  fs.writeFileSync(path.join(__dirname, "ep06_silences.txt"), lines.join("\n") + "\n", "utf8");
}

// scene files that look a cut clip up by its exact file name must switch to clipSpan6(original)
const srcDir = path.join(outRoot, "remotion_studio", "src", "episode06");
const cutOriginals = [...new Set(voice.filter((v) => v.original).map((v) => v.original))];
for (const file of fs.existsSync(srcDir) ? fs.readdirSync(srcDir, { recursive: true }) : []) {
  if (!/\.tsx?$/.test(file) || /^(timing|subtitles)\.ts$/.test(path.basename(file))) continue;
  const src = fs.readFileSync(path.join(srcDir, file), "utf8");
  for (const o of cutOriginals) {
    if (src.includes(`"${o}"`)) console.warn(`WARNING: ${file} looks up "${o}" by name, but that clip is now cut into parts: use clipSpan6("${o}") / EP06_CLIP_PARTS.`);
  }
}

console.log("silences: scripts/ep06_silences.txt");
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
console.log("caption anchors (TIM-EP06-01: caption start minus voice start, frames):");
anchorReport.forEach((l) => console.log("  " + l));
console.log("visual scenes:");
for (const v of scenes) console.log(`  ${v.id.padEnd(30)} ${v.component.padEnd(30)} start ${v.startFrame}  frames ${v.durationFrames}  end ${v.startFrame + v.durationFrames}`);
console.log("total frames:", totalEnd, `(${(totalEnd / FPS).toFixed(2)} s; pauses ${TOTAL_PAUSE} f, gaps ${TOTAL_GAP} f, breaks ${TOTAL_BREAK} f)`, "| audio clips:", audioRows.length, "| subtitle phrases:", cueRows.length);
