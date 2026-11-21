#!/usr/bin/env node
/**
 * Builds Episode 2 timing from the scene manifest, voice durations and the Bengali SRT.
 * Voice clips are placed on the absolute timeline (EP02_AUDIO). Visual scenes can split
 * a narration clip at a phrase boundary, so new scenes (rain, father, Ujanchar) get their own time.
 * Writes remotion_studio/src/episode02/timing.ts and subtitles.ts (frames at 24 fps).
 *
 * BREATHS (director's note: let each scene be felt before the next one begins). After a scene's
 * narration the picture holds for a pause before the next scene:
 *
 *   after scene              -> next scene                   pause
 *   01_shashthi_mystery      -> 01c_mother_lap               1.5 s (36 f)
 *   01c_mother_lap           -> 01d_shashthi_rain            2.0 s (48 f)
 *   01d_shashthi_rain        -> 01d2_shashthi_hands_miracle  1.5 s (36 f)
 *   01d2_shashthi_hands_miracle -> 01e_father_letter         1.5 s (36 f)  inserted scene, see INSERTS
 *   (01e_father_letter: its 1.0 s breath was folded into the scene itself on 2026-11-21, end = last line + 2.2 s,
 *    so its authored frames are unchanged; it now cross-dissolves into the journey, see INSERTS and DISSOLVES)
 *   02a_ujanchar             -> 02_fox_and_bagha_dog         2.5 s (60 f)  the forest view lingers
 *   02_fox_and_bagha_dog     -> 03_lemon_tree_goshaap        2.0 s (48 f)
 *   03_lemon_tree_goshaap    -> 04_rice_pot_miracle          3.0 s (72 f)  hold on Charu's wet eyes
 *   04_rice_pot_miracle      -> 99_closing_sequential_outro  2.0 s (48 f)
 *
 * The scene before a boundary gets longer by its pause (everything inside it keeps its frame), and every
 * later scene, voice clip and subtitle cue moves later by the sum of the pauses before it, so each scene
 * keeps exactly its old sync with its own narration. The intro and the source card do not move.
 * Where one voice clip spans a boundary (01a at the lap, 01b at the father, 02a at the fox) it is cut in
 * the silence between sentences nearest to that boundary (ffmpeg silencedetect -45 dB / 0.12 s on the
 * played file in remotion_studio/public/audio/ep02, cut at the middle of the silence, 5 ms fades, no level
 * change, 48 kHz mono 16-bit) into NAME_p1.wav and NAME_p2.wav beside it. The original WAVs are never
 * written. Each pause is exported as EP02_BREATHS (startFrame = next scene start minus the pause) so
 * Episode02.tsx can place the breath sounds.
 *
 * PAUSES INSIDE SCENES (added 2026-11-21, director's rule CAM-14; see docs/PIPELINE_DECISIONS.md TIM-PAUSE-01).
 * A pause is a held moment between two narration sentences INSIDE a scene: the voice stops, the story
 * action waits, life (breathing, blinks, ambient sound) goes on. Entry format:
 *
 *   { scene: "02_fox_and_bagha_dog", after: "<unique snippet of the subtitle phrase the pause follows>",
 *     sec: 1.5, note: "why" }
 *
 * For each pause the generator
 *   1. finds the one subtitle phrase of `scene` whose text contains `after` (error if none or several);
 *   2. takes that phrase's end and looks for the nearest sentence silence in the voice clip playing there
 *      (same silencedetect as the splits), or for the silent gap between two clips (a clip boundary);
 *      the silence must lie within PAUSE_TOL (0.5 s) of the phrase end, else it throws with the nearest
 *      silences listed so the snippet can be moved to a real sentence end;
 *   3. cuts the clip at the middle of that silence (no cut at a clip boundary). One clip can carry
 *      several cuts (scene-boundary SPLITS and pauses together): its parts are NAME_p1.wav .. NAME_pN.wav
 *      (with only one split cut this is exactly the old _p1/_p2). Stale NAME_pK.wav files from earlier
 *      runs that are no longer used are deleted. The original WAV is never written;
 *   4. shifts everything after the hold point later by the pause: later parts of that clip, later clips,
 *      later subtitle phrases, later scenes and their breaths. The scene that holds the pause grows by
 *      the pause; everything before the hold point keeps its frame.
 *
 * Three kinds of pause entry:
 *   after: "<snippet>"  between two sentences, as above.
 *   at: "open"          before the scene's first line: the story clock holds at atStory 0, so the scene's start
 *                       stays and its narration, cues and everything after move later by the pause.
 *   at: "end"           after the scene's whole authored length (its narration, tail and breath): the story clock
 *                       holds on the last authored frame (atStory = authored length - 1), lengthening the hold
 *                       like a breath. The scene's breath row (EP02_BREATHS) keeps its place before it.
 *   clip + silence      optional override for an "after" pause whose subtitle estimate does not line up with
 *                       the voice: silence [a, b] in the ORIGINAL clip's seconds, chosen from silencedetect and
 *                       the sentence order of the text (the level at the cut is still measured and reported).
 * For every cut the generator measures the level within +-30 ms of the cut (RMS below -45 dB and peak below
 * -38 dB, i.e. room tone with no speech; the named fox cut at 18.625 s is RMS -51, peak -41) and checks that the
 * parts' samples sum to the original. Adjacent silences are not merged (the few ms between them can be a click).
 * At a clip boundary (no cut) the story holds 0.3 s after the speech ends, or mid-gap if the gap is shorter. A cue (one voice clip's subtitle text) that carries a pause cut
 * has its phrases re-spread by character count between the real cut points (pause and split cuts), so the
 * phrase before a pause ends at the cut and the phrase after it starts there (captions follow the voice parts).
 *
 * THE APPROVED PAUSE TABLE (director 2026-11-21, STO-16, Ep02_Shots_and_Pauses_DRAFT.md; NO outro pauses):
 * 23 pauses, 36.0 s (864 f):
 *   01 cot row        after "বিরাট বৈদিক বাড়ি।" 1.0 | "শিশুরা শুয়ে থাকে" 1.5 | "সবার চেয়ে আলাদা!" 2.0  (01a cuts)
 *   01c mother's lap  open 1.0 | end 1.5
 *   01d rain outside  open 1.0 | end 1.0
 *   01d2 hands        "বৃষ্টিও থামছে না!" 1.5 (01d2a cut) | "মুষলধারে বাড়ছে!" 1.0 (01d2b cut) | "মানুষের কাজ রে!" 2.0
 *                     (clip boundary 01d2b/01d2c)
 *   01e father        open 1.0 | "চাকরির খবর এল" 3.0 (the news lands; 01b cut) | "কৃষ্ণনগরে।" 2.0 (the farewell)
 *   02a Ujanchar      end 1.5
 *   02 fox            "শেয়াল ঢুকে পড়েছে!" 1.0 | "শেয়ালকে তাড়িয়ে দিল!" 2.0 (02a_Narrator_Fox cuts by override:
 *                     silences 12.02-12.58 and 18.42-18.83 s in the original = 7.43-7.99 and 13.83-14.24 s in _p2)
 *                     | "মিষ্টি হাসছে!" 2.0 (clip boundary 02a/02b)
 *   03 go-saap        "হামাগুড়ি দিতে শিখেছে।" 1.5 | "বড় বড় গো-সাপ।" 1.5 | "হাত বুলিয়ে খেলতেন!" 2.0 (03a cuts)
 *   04 rice pot       open 1.0 | "ছোট্ট শিশুর ওপর!" 2.0 (04a cut) | "আঁচড়ও লাগেনি!" 2.0 (clip boundary 04a/04b)
 *
 * THE JOURNEY (STO-15, 2026-11-21): 02a0_journey_to_ujanchar (Scene02a0Journey, no voice, 11.0 s = 264 f) sits
 * between 01e_father_letter and 02a_ujanchar (INSERTS entry with `after`). 01e keeps its whole authored length
 * plus its three pauses; the journey starts 40 f before 01e ends (01e cross-dissolves into it) and 02a starts
 * 40 f before the journey ends (the journey cross-dissolves into Ujanchar). Ujanchar's line keeps its offset
 * from Ujanchar's start. The overlaps are exported as EP02_DISSOLVES { from, into, frames, startFrame }:
 * `into` starts at startFrame and fades in over `frames` on top of `from`, whose durationFrames already run to
 * startFrame + frames (so Episode02.tsx needs SCENE_DISSOLVE_IN[into] = frames and no SCENE_TAIL for `from`).
 *
 * Exports for scene code (helpers in src/episode/storyClock.ts):
 *   EP02_PAUSES      { sceneId, atStory, frames, startFrame }: atStory is the scene-local STORY frame
 *                    (the scene's original authored timing) where the story clock holds; startFrame is
 *                    the absolute real frame where the pause begins.
 *   EP02_DISSOLVES   the timed cross-dissolves (see THE JOURNEY).
 *   EP02_CLIP_PARTS  original file -> its played parts { file, startFrame, frames } (uncut clips: one part,
 *                    identical to their EP02_AUDIO row). Use clipSpan(original) from storyClock.ts to find
 *                    an original clip's window even after it has been cut.
 * Scenes animate on the story clock (useStory(sceneId).f) and pass the real local frame (lifeF) to the
 * rigs for breathing and blinks, so their hard-coded choreography stays in sync with the narration.
 */
const fs = require("fs");
const path = require("path");

const root = process.env.REPO_ROOT || "C:/Dipankar/Balak_Thakur_AI_Studio";
const outRoot = path.resolve(__dirname, "..");
const epDir = path.join(root, "03_Episodes", "Episode_02_Shashthi_and_GoShaap");
const outDir = path.join(outRoot, "remotion_studio", "src", "episode02");
const FPS = 24;
const MAX_CHARS = 36;
const TAIL = 0.2; // seconds a scene lingers past its narration
const BREATHS = [
  { after: "01_shashthi_mystery", sec: 1.5 },
  { after: "01c_mother_lap", sec: 2.0 },
  { after: "01d_shashthi_rain", sec: 1.5 },
  { after: "01d2_shashthi_hands_miracle", sec: 1.5 }, // the awe settles before the father's news
  // 01e_father_letter: no breath since 2026-11-21 (its 1.0 s is inside the scene, end = last line + 2.2 s; its sounds
  // move into the journey plan). It cross-dissolves into 02a0_journey_to_ujanchar instead.
  { after: "02a_ujanchar", sec: 2.5 },
  { after: "02_fox_and_bagha_dog", sec: 2.0 },
  { after: "03_lemon_tree_goshaap", sec: 3.0 }, // director: hold on Charu's wet, frightened eyes before the chapter break
  { after: "04_rice_pot_miracle", sec: 2.0 },
];
/*
 * PAUSES inside scenes (see the header): the director-approved table (2026-11-21, STO-16; no outro pauses).
 */
const PAUSES = [
  // 01 cot row (4.5 s)
  { scene: "01_shashthi_mystery", after: "বিরাট বৈদিক বাড়ি।", sec: 1.0, note: "P1 held wide of the Vedic house: kitchen smoke, banana leaves stir, a crow crosses" },
  { scene: "01_shashthi_mystery", after: "শিশুরা শুয়ে থাকে", sec: 1.5, note: "P2 the pan has landed: Charu at the cot looks down at the calm baby, babies cry nearby" },
  { scene: "01_shashthi_mystery", after: "সবার চেয়ে আলাদা!", sec: 2.0, note: "P3 the kiss lands, Charu's eyes linger, he gazes up; his glow brightens gently (key beat)" },
  // 01c mother's lap (2.5 s)
  { scene: "01c_mother_lap", at: "open", sec: 1.0, note: "P1 Charu seated, gazing down at him before she reaches; his blink, her breath" },
  { scene: "01c_mother_lap", at: "end", sec: 1.5, note: "P2 close two-shot: she rocks him slowly, smiles down (added to the hold)" },
  // 01d rain outside (2.0 s)
  { scene: "01d_shashthi_rain", at: "open", sec: 1.0, note: "P1 held wide: rain sheets across the decorated gate, garlands swing" },
  { scene: "01d_shashthi_rain", at: "end", sec: 1.0, note: "P2 the empty decorated veranda, puja lamps flickering alone (added to the hold)" },
  // 01d2 hands miracle (4.5 s)
  { scene: "01d2_shashthi_hands_miracle", after: "বৃষ্টিও থামছে না!", sec: 1.5, note: "P1 hold on the pouring window; Thakurma sighs and looks out" },
  { scene: "01d2_shashthi_hands_miracle", after: "মুষলধারে বাড়ছে!", sec: 1.0, note: "P2 MATCH shot holds: hands waving hard, heaviest downpour, one soft flash" },
  { scene: "01d2_shashthi_hands_miracle", after: "এ কি মানুষের কাজ রে!", sec: 2.0, note: "P3 Thakurma's wet eyes, she turns to Surendra; drizzle; his glow brightens (key beat)" },
  // 01e father's letter (6.0 s)
  { scene: "01e_father_letter", at: "open", sec: 1.0, note: "1 Surendra in the doorway looks out at the rain; the peon's umbrella appears" },
  { scene: "01e_father_letter", after: "চাকরির খবর এল", sec: 3.0, note: "4a/4b the news lands: his quiet joy, then he calls the family to the door" },
  { scene: "01e_father_letter", after: "কৃষ্ণনগরে।", sec: 2.0, note: "7 the farewell: the blessing finishes, Charu's last look back, rain easing" },
  // 02a Ujanchar (1.5 s)
  { scene: "02a_ujanchar", at: "end", sec: 1.5, note: "2 birds fly home into the far forest, light dims toward dusk (added to the hold)" },
  // 02 fox and Bagha (5.0 s). The subtitle estimate of this cue is off by up to 0.9 s, so the two cuts name their
  // silences (original-clip seconds; = 7.43-7.99 and 13.83-14.24 s in 02a_Narrator_Fox_p2). Sentence order of the
  // speech runs in _p2: "একদিন ... ব্যস্ত," 0.31-3.26 | "আর" | "ঘর কেটে ... পড়েছে!" -7.43 || "ঠিক তখনই ... দিল!" 7.99-13.83
  // || "মা ছুটে এসে দেখেন—" 14.74-17.12 | "ছোট্ট শিশুটি ... হাসছে!" 17.37-21.64.
  { scene: "02_fox_and_bagha_dog", after: "শেয়াল ঢুকে পড়েছে!", sec: 1.0, clip: "02a_Narrator_Fox.wav", silence: [12.022, 12.579], note: "P1 the fox stops mid-room sniffing; Balak turns and looks at it, calm" },
  { scene: "02_fox_and_bagha_dog", after: "শেয়ালকে তাড়িয়ে দিল!", sec: 2.0, clip: "02a_Narrator_Fox.wav", silence: [18.42, 18.83], note: "P2 Bagha barks at the hole, turns to the baby; cut to Charu in the kitchen, the ladle slips" },
  { scene: "02_fox_and_bagha_dog", after: "মিষ্টি হাসছে!", sec: 2.0, note: "P3 Balak's close-up, Charu's hand to her chest; his glow brightens (key beat)" },
  // 03 go-saap (5.0 s)
  { scene: "03_lemon_tree_goshaap", after: "হামাগুড়ি দিতে শিখেছে।", sec: 1.5, note: "P1 he stops on the sand, sits back, looks around; the camera stops with him" },
  { scene: "03_lemon_tree_goshaap", after: "বড় বড় গো-সাপ।", sec: 1.5, note: "P2 held wide: a slow tongue flick; focus racks briefly to Charu at the door" },
  { scene: "03_lemon_tree_goshaap", after: "হাত বুলিয়ে খেলতেন!", sec: 2.0, note: "P3 a slow stroke, the go-saap closes its eyes; his glow brightens (key beat)" },
  // 04 rice pot (5.0 s)
  { scene: "04_rice_pot_miracle", at: "open", sec: 1.0, note: "P1 the chapter-break fade in on the held wide: rice grains, the pot hanging, rope turning" },
  { scene: "04_rice_pot_miracle", after: "ছোট্ট শিশুর ওপর!", sec: 2.0, note: "P2 hold on the covered pot: dust settles, warm light under the rim, a hush" },
  { scene: "04_rice_pot_miracle", after: "আঁচড়ও লাগেনি!", sec: 2.0, note: "P3 parents look at each other, then at him; he pats the rice; his glow brightens (key beat)" },
];
const PAUSE_TOL = 0.5; // seconds: the cut silence must lie this close to the phrase end
/*
 * INSERTED SCENES (added 2026-11-21, director): scenes whose voices are not in the manifest/SRT, placed
 * where scene `before` begins (in the pre-breath timeline). Their clips play in order: `lead` seconds of
 * picture first, then each clip after its `gapBefore`, then `tail`. The insert pushes `before` and every
 * later scene, clip and cue later by its length, so all existing scenes keep their own sync. Subtitles come
 * from `text`, split into phrases like the SRT cues and spread over the clip by character count.
 * An entry with `after` instead of `before` is a picture-only scene of `sec` seconds placed after scene `after`
 * with timed cross-dissolves: it starts `dissolveIn` frames before `after` ends (after its pauses), and the next
 * scene starts `dissolveOut` frames before it ends. Both overlaps are exported in EP02_DISSOLVES.
 */
const INSERTS = [
  {
    id: "02a0_journey_to_ujanchar",
    component: "Scene02a0Journey",
    after: "01e_father_letter",
    sec: 11.0, // music-led journey montage, no narration (STO-15)
    dissolveIn: 40,
    dissolveOut: 40,
    clips: [],
  },
  {
    id: "01d2_shashthi_hands_miracle",
    component: "Scene01d2HandsMiracle",
    before: "01e_father_letter",
    lead: 0.6,
    tail: 0.8,
    clips: [
      { file: "01d2a_Narrator_Inside.wav", speaker: "", gapBefore: 0,
        text: "গ্রামের ব্রাহ্মণরা নবজাতককে পায়ের ধুলো দিতে আসবেন বলে সব আয়োজন ছিল—অথচ এক ফোঁটা বৃষ্টিও থামছে না! আর ঘরের ভেতর আত্মীয়রা হঠাৎ এক অদ্ভুত কাণ্ড দেখে অবাক—" },
      { file: "01d2b_Thakurma_Rain.wav", speaker: "ঠাকুরমা", gapBefore: 0.5,
        text: "ওরে তোরা এদিকে এসে দ্যাখ! খোকা যেমন ছোট্ট হাত দুটো জোরে নাড়ছে, বাইরে বৃষ্টিও অমনি মুষলধারে বাড়ছে! আবার হাত থামালেই বৃষ্টি কমে আসছে—এ কি মানুষের কাজ রে!" },
      { file: "01d2c_Surendra_Awe.wav", speaker: "সুরেন্দ্রচন্দ্র", gapBefore: 0.6,
        text: "বড় আশ্চর্য মা! কারও পদধূলি যেন ও নিতে চাইল না—প্রকৃতিই যেন ওর ইশারায় খেলছে!" },
    ],
  },
];
// Voice clips that span a scene boundary: cut at the sentence silence nearest to the start of `atScene`.
const SPLITS = [
  { file: "01a_Narrator.wav", atScene: "01c_mother_lap" },
  { file: "01b_Narrator_Rain.wav", atScene: "01e_father_letter" },
  { file: "02a_Narrator_Fox.wav", atScene: "02_fox_and_bagha_dog" },
];
const VOICE_DIR = path.join(outRoot, "remotion_studio", "public", "audio", "ep02");
const SR = 48000;
const { execSync, execFileSync, spawnSync } = require("child_process");
const probeDur = (file) => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();

const durations = JSON.parse(fs.readFileSync(path.join(epDir, "02_Audio", "Voice_WAVs", "audio_durations.json"), "utf8"));
const srt = fs.readFileSync(path.join(epDir, "04_Video_Assembly", "Subtitles_SRT", "Episode_02_Shashthi_and_GoShaap_bn.srt"), "utf8");
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

const clipFiles = manifest.scenes.flatMap((s) => s.audio_files);
if (clipFiles.length !== cues.length) throw new Error(`clips ${clipFiles.length} != cues ${cues.length}`);
const clips = clipFiles.map((file, i) => ({ file, cue: i, start: cues[i].start, end: cues[i].end, dur: durations[file].duration_sec }));
clips.forEach((c) => {
  if (Math.abs(c.end - c.start - c.dur) > 0.3) throw new Error(`${c.file}: cue ${c.end - c.start}s vs clip ${c.dur}s`);
});

const SOURCE_FILE = "00a_Source_Attribution.wav";
const SOURCE_DUR = probeDur(path.join(root, "02_Shared_Assets", "Templates", SOURCE_FILE));
const SOURCE_AT = cues[0].end + 0.3; // card appears right after the title line
const SHIFT = SOURCE_DUR + 0.5; // later content moves later by the card length
for (let i = 1; i < cues.length; i++) { cues[i].start += SHIFT; cues[i].end += SHIFT; }
clips.forEach((c, i) => { if (i >= 1) { c.start += SHIFT; c.end += SHIFT; } });

const speakerFor = (file) => {
  if (/Narrator|Intro|Outro|Sequential|Motki/i.test(file)) return "";
  if (/Charu/i.test(file)) return "চারুশীলা";
  if (/Babukaka/i.test(file)) return "বাবুকাকা";
  if (/Girls|Tease/i.test(file)) return "মেয়েরা";
  if (/Toddler/i.test(file)) return "বীরু";
  return "কথক";
};
// ---- short subtitle phrases ----
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
const phrases = [];
cues.forEach((c, ci) => {
  const pieces = splitPhrases(c.text);
  const total = pieces.reduce((a, p) => a + p.length, 0) || 1;
  let acc = 0;
  for (const p of pieces) {
    const from = c.start + ((c.end - c.start) * acc) / total;
    acc += p.length;
    const to = c.start + ((c.end - c.start) * acc) / total;
    phrases.push({ cue: ci, from, to, text: p });
  }
});

// ---- split points inside narration clips ----
const firstPhraseAt = (cueIdx, needle) => {
  const hit = phrases.find((p) => p.cue === cueIdx && p.text.includes(needle));
  if (!hit) throw new Error(`phrase "${needle}" not found in cue ${cueIdx}`);
  return hit.from;
};
const splitRain = firstPhraseAt(2, "বাবা"); // father's news begins: rain ends
const splitUjanchar = firstPhraseAt(3, "একদিন");
const splitLap = firstPhraseAt(1, "চারুশীলা"); // mother takes him into her lap: cot scene ends // fox story begins: Ujanchar ends

// ---- visual scenes (seconds), in timeline order ----
const visual = [
  { id: "00_intro", component: "Scene00Intro", start: cues[0].start, end: SOURCE_AT },
  { id: "00b_source_attribution", component: "SourceCard", start: SOURCE_AT, end: SOURCE_AT + SOURCE_DUR + 0.3 },
  { id: "01_shashthi_mystery", component: "Scene01Shashthi", start: cues[1].start, end: splitLap },
  { id: "01c_mother_lap", component: "Scene01cMotherLap", start: splitLap, end: cues[1].end + TAIL },
  { id: "01d_shashthi_rain", component: "Scene01dRain", start: cues[2].start, end: splitRain },
  // end = last line + 2.2 s: the old 1.2 s tail plus the old 1.0 s breath, so the authored frames are unchanged;
  // its last 40 f now lie under the dissolve into the journey (INSERTS)
  { id: "01e_father_letter", component: "Scene01eFather", start: splitRain, end: cues[2].end + 2.2 },
  { id: "02a_ujanchar", component: "Scene02aUjanchar", start: cues[3].start - 0.6, end: splitUjanchar }, // overlaps the father dissolve
  { id: "02_fox_and_bagha_dog", component: "Scene02Fox", start: splitUjanchar, end: cues[4].end + 1 },
  { id: "03_lemon_tree_goshaap", component: "Scene03Goshaap", start: cues[5].start, end: cues[5].end + 1 },
  { id: "04_rice_pot_miracle", component: "Scene04RicePot", start: cues[6].start, end: cues[7].end + 1 },
  { id: "99_closing_sequential_outro", component: "Scene99Outro", start: cues[8].start, end: cues[8].end + 1 },
];

const f = (sec) => Math.round(sec * FPS);
// ---- frames before the breaths (the timing the scene files were built on) ----
const scenes0 = visual.map((v) => ({ ...v, startFrame: f(v.start), durationFrames: f(v.end) - f(v.start) }));
// inserted scenes: lay out their clips (local seconds) and splice them in before their `before` scene
for (const ins of INSERTS) {
  if (ins.after) {
    // picture-only scene with timed dissolves: listed after `after`; its real start is set after the shifts
    if (ins.clips.length) throw new Error(`insert ${ins.id}: an "after" insert carries no voice clips`);
    const ai = scenes0.findIndex((s) => s.id === ins.after);
    if (ai < 0 || !scenes0[ai + 1]) throw new Error(`insert ${ins.id}: unknown scene ${ins.after} or no scene after it`);
    const next = scenes0[ai + 1];
    ins.placed = [];
    scenes0.splice(ai + 1, 0, { id: ins.id, component: ins.component, start: next.start, end: next.start + ins.sec, startFrame: next.startFrame, durationFrames: f(ins.sec), insert: ins });
    continue;
  }
  let t = ins.lead;
  ins.placed = ins.clips.map((c) => {
    t += c.gapBefore;
    const dur = probeDur(path.join(VOICE_DIR, c.file));
    const p = { ...c, at: t, dur };
    t += dur;
    return p;
  });
  const len = t + ins.tail;
  const bi = scenes0.findIndex((s) => s.id === ins.before);
  if (bi < 0) throw new Error(`insert ${ins.id}: unknown scene ${ins.before}`);
  const at = scenes0[bi].startFrame;
  scenes0.splice(bi, 0, { id: ins.id, component: ins.component, start: scenes0[bi].start, end: scenes0[bi].start + len, startFrame: at, durationFrames: f(len), insert: ins });
}
const sceneById = Object.fromEntries(scenes0.map((s) => [s.id, s]));
const breathAfter = Object.fromEntries(BREATHS.map((b) => [b.after, Math.round(b.sec * FPS)]));
BREATHS.forEach((b) => { if (!sceneById[b.after]) throw new Error(`breath after unknown scene ${b.after}`); });
// a pre-breath absolute frame belongs to the last story scene (01 on) that starts at or before it
const storyScenes = scenes0.slice(2);
const voicedScenes = storyScenes.filter((s) => !(s.insert && s.insert.after)); // picture-only inserts own no clip or cue
const sceneAt = (frame) => {
  let id = null;
  for (const s of voicedScenes) if (s.startFrame <= frame) id = s.id;
  return id;
};

// ---- voice clips: lengths from the played files ----
clips.splice(1, 0, { file: SOURCE_FILE, start: SOURCE_AT, end: SOURCE_AT + SOURCE_DUR, dur: SOURCE_DUR });
// The played WAVs run 0.03-0.34 s longer than audio_durations.json (which measured the trimmed
// Normalized_48k set), so the clip length comes from the file itself and no word tail is cut off.
clips.forEach((c) => { if (c.file !== SOURCE_FILE) c.dur = probeDur(path.join(VOICE_DIR, c.file)); });
// Every voice clip in one list. `base` is the pre-breath absolute frame its clock counts from (0 for the
// manifest clips, the inserted scene's start for inserted clips); `t` is seconds on that clock, so the clip's
// pre-breath frame is base + f(t), exactly as before.
const voice = [
  ...clips.map((c) => ({ file: c.file, group: "main", base: 0, t: c.start, dur: c.dur, scene: null, cueKey: c.cue === undefined ? null : `main:${c.cue}` })),
  ...scenes0.filter((s) => s.insert).flatMap((s) => s.insert.placed.map((c, k) => ({ file: c.file, group: s.id, base: s.startFrame, t: c.at, dur: c.dur, scene: s.id, cueKey: `${s.id}:${k}` }))),
];
// Every subtitle phrase, in the same order the cue rows were always written (manifest phrases, then inserts).
// cueKey names the cue (one voice clip's text) a phrase belongs to; cueFrom/cueTo is that cue's span (group clock).
let seq = 0;
const allPhrases = phrases.map((p) => ({ base: 0, from: p.from, to: p.to, text: p.text, speaker: speakerFor(clipFiles[p.cue] || ""), scene: sceneAt(f(p.from)), group: "main", seq: seq++, cueKey: `main:${p.cue}`, cueFrom: cues[p.cue].start, cueTo: cues[p.cue].end }));
for (const s of scenes0.filter((x) => x.insert)) {
  for (const [k, c] of s.insert.placed.entries()) {
    const pieces = splitPhrases(c.text);
    const total = pieces.reduce((a, p) => a + p.length, 0) || 1;
    let acc = 0;
    for (const p of pieces) {
      const a = c.at + (c.dur * acc) / total;
      acc += p.length;
      const b = c.at + (c.dur * acc) / total;
      allPhrases.push({ base: s.startFrame, from: a, to: b, text: p, speaker: c.speaker, scene: s.id, group: s.id, seq: seq++, cueKey: `${s.id}:${k}`, cueFrom: c.at, cueTo: c.at + c.dur });
    }
  }
}

function detectSilences(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "silencedetect=n=-45dB:d=0.12", "-f", "null", "-"], { encoding: "utf8" });
  const txt = (r.stderr || "") + (r.stdout || "");
  const starts = [...txt.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...txt.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  // (adjacent silences are NOT merged: the few ms between them can be a click, e.g. 03a at 16.285 s)
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
const silenceCache = {};
const silencesOf = (file) => (silenceCache[file] ??= detectSilences(path.join(VOICE_DIR, file)));
// cut points per original clip file: { sample, kind: "split" | "pause", scene }
const cutsOf = {};
const addCut = (file, cut) => {
  const list = (cutsOf[file] ??= []);
  if (!list.some((c) => Math.abs(c.sample - cut.sample) < SR * 0.01)) list.push(cut);
};

// ---- scene-boundary splits: cut at the sentence silence nearest to the scene change ----
const splitReport = [];
const splitAnchors = []; // { cueKey, atScene, t }: a split cut inside a cue (group-clock seconds)
for (const sp of SPLITS) {
  const clip = voice.find((c) => c.file === sp.file);
  if (!clip) throw new Error(`split clip ${sp.file} not found`);
  const target = sceneById[sp.atScene].start - clip.t; // seconds into the clip where the scene changes
  const inner = silencesOf(sp.file).filter((s) => s.a > 0.5 && s.b < clip.dur - 0.3); // sentence gaps, not lead or tail
  const dist = (s) => (target < s.a ? s.a - target : target > s.b ? target - s.b : 0);
  inner.sort((x, y) => dist(x) - dist(y));
  const gap = inner[0];
  if (!gap || dist(gap) > 1.5) throw new Error(`${sp.file}: no sentence silence within 1.5 s of ${target.toFixed(2)} s`);
  const cutSample = Math.round(((gap.a + gap.b) / 2) * SR);
  addCut(sp.file, { sample: cutSample, kind: "split", scene: sp.atScene });
  splitAnchors.push({ cueKey: clip.cueKey, atScene: sp.atScene, t: clip.t + cutSample / SR });
  splitReport.push(`${sp.file}: scene change at ${target.toFixed(2)} s, silence ${gap.a.toFixed(3)}-${gap.b.toFixed(3)} s, cut ${(cutSample / SR).toFixed(3)} s`);
}

// ---- pauses inside scenes: find the hold point (pre-breath frame) and the cut it needs ----
const pauseReport = [];
const pauseAnchors = []; // { cueKey, afterSeq, t }: a pause cut inside a cue (group-clock seconds)
const cutChecks = []; // { file, sec, label } every cut, for the level check
const BOUNDARY_HOLD = 0.3; // s: at a clip boundary the story holds this long after the speech ends (or mid-gap if shorter)
const pauses = PAUSES.map((p, idx) => {
  const kind = p.at === "open" || p.at === "end" ? p.at : "after";
  const label = `PAUSES[${idx}] (${p.scene}, ${kind === "after" ? `after "${p.after}"` : kind})`;
  const sc = sceneById[p.scene];
  if (!sc || !voicedScenes.includes(sc)) throw new Error(`${label}: unknown story scene ${p.scene}`);
  if (!(p.sec > 0)) throw new Error(`${label}: sec must be > 0`);
  if (p.at !== undefined && kind === "after") throw new Error(`${label}: at must be "open" or "end"`);
  const frames = Math.round(p.sec * FPS);
  const scenePhrases = allPhrases.filter((q) => q.scene === p.scene);
  if (kind === "open") {
    // the story clock holds on the scene's first frame: its narration and everything after move later
    pauseReport.push(`${label}: holds at story frame 0 (before "${scenePhrases[0]?.text ?? ""}") for ${frames} f`);
    return { sceneId: p.scene, kind, holdFrame: sc.startFrame, atStory: 0, frames, seq: -1, phrase: "(open) " + (scenePhrases[0]?.text ?? ""), note: p.note };
  }
  if (kind === "end") {
    // the story clock holds on the scene's last authored frame (narration, tail and breath all played)
    const authored = sc.durationFrames + (breathAfter[sc.id] || 0);
    const atStory = authored - 1;
    pauseReport.push(`${label}: holds at story frame ${atStory} (last authored frame, after "${scenePhrases[scenePhrases.length - 1]?.text ?? ""}") for ${frames} f`);
    return { sceneId: p.scene, kind, holdFrame: sc.startFrame + atStory, atStory, frames, seq: Infinity, phrase: "(end) " + (scenePhrases[scenePhrases.length - 1]?.text ?? ""), note: p.note };
  }
  const hits = scenePhrases.filter((q) => q.text.includes(p.after));
  if (hits.length !== 1) {
    const list = allPhrases.filter((q) => q.scene === p.scene).map((q) => `    "${q.text}"`).join("\n");
    throw new Error(`${label}: ${hits.length ? "snippet matches " + hits.length + " phrases, make it unique" : "no phrase of this scene contains the snippet"}. Phrases of ${p.scene}:\n${list}`);
  }
  const ph = hits[0];
  const t = ph.to; // phrase end, seconds on the group's clock
  const group = voice.filter((v) => v.group === ph.group).sort((x, y) => x.t - y.t);
  const leadOf = (v) => silencesOf(v.file).find((s) => s.a < 0.02);
  const trailOf = (v) => silencesOf(v.file).find((s) => s.b > v.dur - 0.02);
  const distTo = (A, B) => (t < A ? A - t : t > B ? t - B : 0);
  const cands = [];
  group.forEach((v, i) => {
    const next = group[i + 1];
    if (v.t > t + 3 || (v.t + v.dur < t - 3 && !(next && next.t > t - 3))) return;
    const lead = leadOf(v);
    const trail = trailOf(v);
    // sentence silences inside the clip
    for (const s of silencesOf(v.file)) {
      if (s === lead || s === trail) continue;
      cands.push({ kind: "cut", v, s, A: v.t + s.a, B: v.t + s.b, dist: distTo(v.t + s.a, v.t + s.b) });
    }
    // the silent gap after this clip (to the next clip's first sound, or open-ended after the last clip)
    const A = v.t + (trail ? trail.a : v.dur);
    const nextLead = next ? leadOf(next) : null;
    const B = next ? next.t + (nextLead ? nextLead.b : 0) : Infinity;
    if (B >= A) cands.push({ kind: "boundary", v, next, A, B, dist: distTo(A, B) });
  });
  cands.sort((x, y) => x.dist - y.dist);
  let best = cands[0];
  if (p.silence) {
    // named silence (original-clip seconds) for a cue whose subtitle estimate does not line up with the voice
    const v = group.find((x) => x.file === p.clip);
    if (!v) throw new Error(`${label}: clip ${p.clip} does not play in this phrase's group`);
    const [a, b] = p.silence;
    if (!(a > 0 && b > a && b < v.dur)) throw new Error(`${label}: silence ${a}-${b} s lies outside ${p.clip} (0-${v.dur.toFixed(2)} s)`);
    const d = distTo(v.t + a, v.t + b);
    if (d > 1.5) throw new Error(`${label}: named silence is ${d.toFixed(2)} s from the phrase end estimate: check the snippet`);
    best = { kind: "cut", v, s: { a, b }, A: v.t + a, B: v.t + b, dist: d, named: true };
  }
  if (!best || best.dist > PAUSE_TOL && !best.named) {
    const near = cands.slice(0, 4).map((c) => `    ${c.kind} ${c.v.file} ${c.A.toFixed(2)}-${Number.isFinite(c.B) ? c.B.toFixed(2) : "end"} s (off by ${c.dist.toFixed(2)} s)`).join("\n");
    throw new Error(`${label}: no sentence silence within ${PAUSE_TOL} s of the phrase end ${t.toFixed(2)} s. Nearest:\n${near}`);
  }
  let holdFrame; // pre-breath absolute frame where the story clock holds
  let where;
  if (best.kind === "cut") {
    const cutSample = Math.round(((best.s.a + best.s.b) / 2) * SR);
    addCut(best.v.file, { sample: cutSample, kind: "pause" });
    holdFrame = ph.base + f(best.v.t + cutSample / SR);
    if (ph.cueKey !== best.v.cueKey) throw new Error(`${label}: the cut clip ${best.v.file} is not the phrase's own clip`);
    pauseAnchors.push({ cueKey: ph.cueKey, afterSeq: ph.seq, t: best.v.t + cutSample / SR });
    cutChecks.push({ file: best.v.file, sec: cutSample / SR, label });
    where = `cut ${best.v.file} at ${(cutSample / SR).toFixed(3)} s (${best.named ? "named " : ""}silence ${best.s.a.toFixed(3)}-${best.s.b.toFixed(3)} s)`;
  } else {
    // hold just after the speech ends (BOUNDARY_HOLD), or mid-gap when the gap to the next clip is shorter
    const speechEnd = best.A;
    const mid = Number.isFinite(best.B) ? Math.min((best.A + best.B) / 2, speechEnd + BOUNDARY_HOLD) : Math.min(speechEnd + BOUNDARY_HOLD, best.v.t + best.v.dur);
    holdFrame = ph.base + (best.next ? Math.min(f(mid), f(best.next.t)) : f(mid));
    where = `clip boundary after ${best.v.file}${best.next ? " before " + best.next.file : ""} (no cut, speech ends ${speechEnd.toFixed(2)} s)`;
  }
  const atStory = holdFrame - sc.startFrame;
  if (atStory < 0 || atStory > sc.durationFrames + (breathAfter[sc.id] || 0)) throw new Error(`${label}: hold point ${atStory} lies outside the scene (0..${sc.durationFrames})`);
  pauseReport.push(`${label}: phrase ends ${t.toFixed(2)} s, ${where}, holds at story frame ${atStory} for ${frames} f`);
  return { sceneId: p.scene, kind, holdFrame, atStory, frames, seq: ph.seq, phrase: ph.text, note: p.note };
});
{
  // two pauses of one scene must not hold at the same story frame
  const seen = new Set();
  for (const p of pauses) {
    const k = `${p.sceneId}@${p.atStory}`;
    if (seen.has(k)) throw new Error(`two pauses of ${p.sceneId} hold at story frame ${p.atStory}`);
    seen.add(k);
  }
}

// ---- re-spread the phrases of every cue that carries a pause cut between the real cut points ----
// The SRT phrase times are a character-count estimate over the whole cue; a pause cut is a measured sentence
// silence, so the phrase before it must end there and the phrase after it start there. Split cuts of the same
// cue are anchors too. Phrase scene assignments (made from the estimate) stay as they are.
const respreadReport = [];
for (const key of [...new Set(pauseAnchors.map((a) => a.cueKey))]) {
  const list = allPhrases.filter((q) => q.cueKey === key).sort((x, y) => x.seq - y.seq);
  const anchors = pauseAnchors.filter((a) => a.cueKey === key).map((a) => ({ idx: list.findIndex((q) => q.seq === a.afterSeq), t: a.t }));
  for (const sa of splitAnchors.filter((a) => a.cueKey === key)) {
    const first = list.findIndex((q) => q.scene === sa.atScene);
    if (first < 1) throw new Error(`re-spread ${key}: no phrase of ${sa.atScene} after the split`);
    anchors.push({ idx: first - 1, t: sa.t });
  }
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
const enc = ["-c:a", "pcm_s16le", "-ar", String(SR), "-ac", "1"];
const cutFiles = new Set();
const cutLevelReport = [];
for (let i = 0; i < voice.length; i++) {
  const v = voice[i];
  const cuts = (cutsOf[v.file] || []).sort((x, y) => x.sample - y.sample);
  if (!cuts.length) continue;
  const src = path.join(VOICE_DIR, v.file);
  const stem = v.file.replace(/\.wav$/, "");
  const bounds = [{ sample: 0 }, ...cuts, null];
  const parts = [];
  let scene = v.scene;
  for (let k = 0; k < bounds.length - 1; k++) {
    const s0 = bounds[k].sample;
    const s1 = bounds[k + 1] ? bounds[k + 1].sample : null;
    if (bounds[k].kind === "split") scene = bounds[k].scene; // the part after a scene split moves with that scene
    const af = [];
    if (s0 === 0) af.push(`atrim=end_sample=${s1}`);
    else af.push(s1 === null ? `atrim=start_sample=${s0}` : `atrim=start_sample=${s0}:end_sample=${s1}`, "asetpts=PTS-STARTPTS", `afade=t=in:st=0:d=${FADE}`);
    if (s1 !== null) af.push(`afade=t=out:st=${((s1 - s0) / SR - FADE).toFixed(6)}:d=${FADE}`);
    const name = `${stem}_p${k + 1}.wav`;
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-af", af.join(","), ...enc, path.join(VOICE_DIR, name)]);
    const d = probeDur(path.join(VOICE_DIR, name));
    // p2 of a scene split moves with the next scene even if the cut is a few frames before it
    parts.push({ file: name, original: v.file, group: v.group, base: v.base, t: v.t + s0 / SR, dur: d, scene });
    cutFiles.add(name);
  }
  splitReport.push(`${v.file}: ${parts.map((p) => `${p.file} ${p.dur.toFixed(3)} s`).join(" + ")} (original ${v.dur.toFixed(3)} s)`);
  // the parts must sum to the original, sample for sample
  const total = parts.reduce((a, p) => a + samplesOf(path.join(VOICE_DIR, p.file)), 0);
  const orig = samplesOf(src);
  if (total !== orig) throw new Error(`${v.file}: parts sum to ${total} samples, original has ${orig}`);
  // every cut must sit in silence: RMS below -45 dB within +-30 ms, and no peak above -38 dB (no speech)
  for (const c of cuts) {
    const { rms, peak } = levelAt(src, c.sample / SR);
    cutLevelReport.push(`${v.file} cut ${(c.sample / SR).toFixed(3)} s (${c.kind}): RMS ${rms} dB, peak ${peak} dB`);
    if (!(rms < -45 && peak < -38)) throw new Error(`${v.file}: the cut at ${(c.sample / SR).toFixed(3)} s is not in silence (RMS ${rms} dB, peak ${peak} dB)`);
  }
  splitReport.push(`  parts sum to the original: ${total} samples`);
  voice.splice(i, 1, ...parts);
  i += parts.length - 1;
}
// delete stale NAME_pK.wav files from earlier runs (only names this generator makes)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const originals = [...new Set(voice.map((v) => v.original || v.file))];
for (const file of fs.readdirSync(VOICE_DIR)) {
  for (const o of originals) {
    if (new RegExp(`^${esc(o.replace(/\.wav$/, ""))}_p\\d+\\.wav$`).test(file) && !cutFiles.has(file)) {
      fs.unlinkSync(path.join(VOICE_DIR, file));
      splitReport.push(`deleted stale ${file}`);
    }
  }
}

// ---- shifts: breaths, inserts and pauses ----
const pauseFramesOf = {};
for (const p of pauses) pauseFramesOf[p.sceneId] = (pauseFramesOf[p.sceneId] || 0) + p.frames;
// cumulative shift of each scene = sum of the breaths (and inserts and pauses) of all earlier scenes
let cum = 0;
const shiftOf = {};
// an inserted scene also pushes everything after it later by its own length; a scene's pauses push everything after it.
// A picture-only insert placed `after` a scene with dissolves pushes the next scene so that it starts `dissolveOut`
// frames before the insert ends, the insert starting `dissolveIn` frames before `after` ends:
//   advance = (after's pre-breath end - next's pre-breath start) + insert length - dissolveIn - dissolveOut
const insertAdvance = (s, i) => {
  if (!s.insert) return 0;
  if (!s.insert.after) return s.durationFrames;
  const a = sceneById[s.insert.after];
  const next = scenes0[i + 1];
  return a.startFrame + a.durationFrames - next.startFrame + s.durationFrames - s.insert.dissolveIn - s.insert.dissolveOut;
};
scenes0.forEach((s, i) => { shiftOf[s.id] = cum; cum += (breathAfter[s.id] || 0) + insertAdvance(s, i) + (pauseFramesOf[s.id] || 0); });
const TOTAL_BREATH = cum;
const shiftAt = (frame) => {
  const id = sceneAt(frame);
  return id ? shiftOf[id] : 0;
};
// inside a scene: an audio part shifts by every pause of its scene whose hold point is at or before it (all of
// them for an open pause, none for an end pause); a subtitle phrase shifts by every pause of its scene that follows
// an earlier phrase (open pauses have seq -1, end pauses seq Infinity)
const pauseShiftAudio = (scene, pre) => pauses.filter((p) => p.sceneId === scene && (p.kind === "open" || (p.kind !== "end" && pre >= p.holdFrame))).reduce((a, p) => a + p.frames, 0);
const pauseShiftCue = (scene, s) => pauses.filter((p) => p.sceneId === scene && s > p.seq).reduce((a, p) => a + p.frames, 0);

const scenes = scenes0.map((s) => ({ ...s, startFrame: s.startFrame + shiftOf[s.id], durationFrames: s.durationFrames + (breathAfter[s.id] || 0) + (pauseFramesOf[s.id] || 0) }));
// picture-only inserts: real start = end of `after` (with its pauses) - dissolveIn; check the next scene's start
const dissolveRows = [];
scenes.forEach((s, i) => {
  if (!s.insert || !s.insert.after) return;
  const a = scenes.find((x) => x.id === s.insert.after);
  s.startFrame = a.startFrame + a.durationFrames - s.insert.dissolveIn;
  const next = scenes[i + 1];
  if (next.startFrame !== s.startFrame + s.durationFrames - s.insert.dissolveOut) throw new Error(`insert ${s.id}: next scene ${next.id} starts at ${next.startFrame}, expected ${s.startFrame + s.durationFrames - s.insert.dissolveOut}`);
  dissolveRows.push({ from: a.id, into: s.id, frames: s.insert.dissolveIn, startFrame: s.startFrame });
  dissolveRows.push({ from: s.id, into: next.id, frames: s.insert.dissolveOut, startFrame: next.startFrame });
});
const endPauseFrames = (id) => pauses.filter((p) => p.sceneId === id && p.kind === "end").reduce((a, p) => a + p.frames, 0);
const breathRows = BREATHS.map((b) => {
  const idx = scenes.findIndex((s) => s.id === b.after);
  const next = scenes[idx + 1];
  const frames = breathAfter[b.after];
  // the breath keeps its authored place; an end pause of the scene follows it, so the breath ends where the end
  // pause begins (without one: where the next scene starts, as always)
  return { after: b.after, next: next.id, frames, startFrame: next.startFrame - frames - endPauseFrames(b.after) };
});
const pauseRows = [];
for (const s of scenes) {
  let before = 0;
  for (const p of pauses.filter((x) => x.sceneId === s.id).sort((x, y) => x.atStory - y.atStory)) {
    pauseRows.push({ sceneId: s.id, atStory: p.atStory, frames: p.frames, startFrame: s.startFrame + p.atStory + before, phrase: p.phrase, kind: p.kind, note: p.note });
    before += p.frames;
  }
}

const sceneLines = ["// AUTO-GENERATED by scripts/build_ep02_timing.js. Do not edit by hand.", `export const EP02_FPS = ${FPS};`];
sceneLines.push("export interface Ep02Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }");
sceneLines.push("export const EP02_SCENES: Ep02Scene[] = [");
for (const v of scenes) {
  sceneLines.push(`  { sceneId: ${JSON.stringify(v.id)}, component: ${JSON.stringify(v.component)}, startFrame: ${v.startFrame}, durationFrames: ${v.durationFrames} },`);
}
sceneLines.push("];");
const totalEnd = Math.max(...scenes.map((v) => v.startFrame + v.durationFrames));
sceneLines.push(`export const EP02_TOTAL_FRAMES = ${totalEnd};`);
sceneLines.push("/**");
sceneLines.push(" * Pauses after a scene's narration: scene `after` holds `frames` longer; the breath ends where `next` starts, or,");
sceneLines.push(" * when the scene has an end pause (EP02_PAUSES, atStory = its last authored frame), where that end pause begins.");
sceneLines.push(" */");
sceneLines.push("export interface Ep02Breath { after: string; next: string; frames: number; startFrame: number }");
sceneLines.push("export const EP02_BREATHS: Ep02Breath[] = [");
for (const b of breathRows) sceneLines.push(`  { after: ${JSON.stringify(b.after)}, next: ${JSON.stringify(b.next)}, frames: ${b.frames}, startFrame: ${b.startFrame} },`);
sceneLines.push("];");
sceneLines.push("export interface Ep02Audio { file: string; startFrame: number; frames: number }");
sceneLines.push("export const EP02_AUDIO: Ep02Audio[] = [");
// manifest clips (and their parts) first, then inserted clips; a stable sort keeps that order on ties
const audioRows = voice.map((v) => {
  const pre = v.base + f(v.t);
  const scene = v.group !== "main" ? v.group : v.scene || sceneAt(pre);
  const sceneShift = v.group !== "main" ? shiftOf[v.group] : v.scene ? shiftOf[v.scene] : shiftAt(pre);
  return { file: v.file, original: v.original || v.file, startFrame: pre + sceneShift + pauseShiftAudio(scene, pre), frames: Math.round(v.dur * FPS) };
});
audioRows.sort((a, b) => a.startFrame - b.startFrame);
for (const r of audioRows) sceneLines.push(`  { file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} },`);
sceneLines.push("];");
sceneLines.push("/**");
sceneLines.push(" * The played parts of each original voice clip (a clip cut at a scene split or an in-scene pause has");
sceneLines.push(" * several, NAME_p1..NAME_pN; an uncut clip has one part, identical to its EP02_AUDIO row).");
sceneLines.push(" * Use clipSpan(original) from src/episode/storyClock.ts for an original clip's whole window.");
sceneLines.push(" */");
sceneLines.push("export interface Ep02ClipPart { file: string; startFrame: number; frames: number }");
sceneLines.push("export const EP02_CLIP_PARTS: Record<string, Ep02ClipPart[]> = {");
for (const o of [...new Set(audioRows.map((r) => r.original))]) {
  const rows = audioRows.filter((r) => r.original === o).map((r) => `{ file: ${JSON.stringify(r.file)}, startFrame: ${r.startFrame}, frames: ${r.frames} }`);
  sceneLines.push(`  ${JSON.stringify(o)}: [${rows.join(", ")}],`);
}
sceneLines.push("};");
sceneLines.push("/**");
sceneLines.push(" * Held moments inside scenes (PAUSES in the generator, rule CAM-14). The story clock of scene `sceneId` holds");
sceneLines.push(" * at its authored local frame `atStory` for `frames`; `startFrame` is the absolute real frame where the pause");
sceneLines.push(" * begins. Use useStory / storyFrame / pauseState from src/episode/storyClock.ts.");
sceneLines.push(" */");
sceneLines.push("export interface Ep02Pause { sceneId: string; atStory: number; frames: number; startFrame: number }");
if (!pauseRows.length) sceneLines.push("export const EP02_PAUSES: Ep02Pause[] = [];");
else {
  sceneLines.push("export const EP02_PAUSES: Ep02Pause[] = [");
  for (const p of pauseRows) sceneLines.push(`  { sceneId: ${JSON.stringify(p.sceneId)}, atStory: ${p.atStory}, frames: ${p.frames}, startFrame: ${p.startFrame} },`);
  sceneLines.push("];");
}
sceneLines.push("/**");
sceneLines.push(" * Timed cross-dissolves (scene overlaps made by the generator for the journey insert): `into` starts at");
sceneLines.push(" * `startFrame` and fades in over `frames` on top of `from`, whose durationFrames already end at startFrame + frames");
sceneLines.push(" * (no extra tail needed). Episode02.tsx: SCENE_DISSOLVE_IN[into] = frames.");
sceneLines.push(" */");
sceneLines.push("export interface Ep02Dissolve { from: string; into: string; frames: number; startFrame: number }");
sceneLines.push("export const EP02_DISSOLVES: Ep02Dissolve[] = [");
for (const d of dissolveRows) sceneLines.push(`  { from: ${JSON.stringify(d.from)}, into: ${JSON.stringify(d.into)}, frames: ${d.frames}, startFrame: ${d.startFrame} },`);
sceneLines.push("];");
fs.writeFileSync(path.join(outDir, "timing.ts"), sceneLines.join("\n") + "\n", "utf8");

const subs = ["// AUTO-GENERATED by scripts/build_ep02_timing.js. Do not edit by hand.", "export const EP02_CUES: { from: number; to: number; text: string; speaker: string }[] = ["];
const cueRows = allPhrases.map((p) => {
  const pre = p.base + f(p.from);
  // a main phrase moves with the scene it was assigned to (a re-spread phrase may start a few frames before it)
  const sh = (p.group !== "main" ? shiftOf[p.group] : p.scene ? shiftOf[p.scene] : shiftAt(pre)) + pauseShiftCue(p.scene, p.seq);
  let from = pre;
  let to = p.base + f(p.to);
  // the phrase timing is a character-count estimate: keep a phrase before a pause from running into it, and a
  // phrase after a pause from starting inside it (the voice resumes exactly at the hold point)
  for (const q of pauses) {
    if (q.sceneId !== p.scene) continue;
    if (p.seq > q.seq) { from = Math.max(from, q.holdFrame); to = Math.max(to, from); }
    else to = Math.max(from, Math.min(to, q.holdFrame));
  }
  return { from: from + sh, to: to + sh, text: p.text, speaker: p.speaker };
}).sort((a, b) => a.from - b.from);
for (const c of cueRows) subs.push(`  { from: ${c.from}, to: ${c.to}, text: ${JSON.stringify(c.text)}, speaker: ${JSON.stringify(c.speaker)} },`);
subs.push("];");
fs.writeFileSync(path.join(outDir, "subtitles.ts"), subs.join("\n") + "\n", "utf8");

// scene files that look a cut clip up by its exact file name must switch to clipSpan(original)
const cutOriginals = [...new Set(voice.filter((v) => v.original).map((v) => v.original))];
for (const file of fs.readdirSync(outDir, { recursive: true })) {
  if (!/\.tsx?$/.test(file) || /^(timing|subtitles)\.ts$/.test(path.basename(file))) continue;
  const src = fs.readFileSync(path.join(outDir, file), "utf8");
  for (const o of cutOriginals) {
    if (src.includes(`"${o}"`)) console.warn(`WARNING: ${file} looks up "${o}" by name, but that clip is now cut into parts: use clipSpan("${o}") / EP02_CLIP_PARTS.`);
  }
}

console.log("splits and cuts:");
splitReport.forEach((l) => console.log("  " + l));
console.log("pauses:");
if (!pauseReport.length) console.log("  (none)");
pauseReport.forEach((l) => console.log("  " + l));
console.log("cut levels:");
cutLevelReport.forEach((l) => console.log("  " + l));
console.log("re-spread phrases (moved more than 2 f):");
respreadReport.forEach((l) => console.log("  " + l));
console.log("pause table (scene | after | kind | atStory | absolute start | frames):");
for (const r of pauseRows) console.log(`  ${r.sceneId.padEnd(28)} | ${r.phrase} | ${r.kind} | ${r.atStory} | ${r.startFrame} | ${r.frames}`);
console.log("total pauses:", pauseRows.length, "|", pauseRows.reduce((a, r) => a + r.frames, 0), "f");
console.log("dissolves:");
dissolveRows.forEach((d) => console.log(`  ${d.from} -> ${d.into}: ${d.frames} f from ${d.startFrame}`));
console.log("visual scenes:");
for (const v of scenes) console.log(`  ${v.id.padEnd(28)} start ${v.startFrame}  frames ${v.durationFrames}`);
console.log("total frames:", totalEnd, `(breaths, inserts and pauses ${TOTAL_BREATH} f)`, "| audio clips:", voice.length, "| phrases:", allPhrases.length);
