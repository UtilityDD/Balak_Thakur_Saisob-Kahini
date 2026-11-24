---
name: new-episode
description: Scaffold a new Balak Thakur episode in Remotion from its resources (scenes_manifest.json, Voice_WAVs, audio_durations.json, the Bengali SRT) - copy and level the voices to public/audio/epNN, generate timing.ts and subtitles.ts with a builder modelled on scripts/build_ep03_timing.js / build_ep02_timing.js (INSERTS for scenes not in the manifest, PAUSES for held moments inside scenes), set up intro, source card, scenes on shared sets (UjancharHouse for Ujanchar episodes), sound beds from the start, the outro with the soft boxless next-episode glimpse (TTL-10a), register the composition in Root.tsx and export the final SRT. Use when starting work on Episode 4, 5 ... 19, or when an episode's voices or SRT change and its timing must be rebuilt.
---

# new-episode

Reference implementations: Episode 2 (`src/episode02/`, `scripts/build_ep02_timing.js`: INSERTS, PAUSES, picture-only
journey insert with dissolves) and Episode 3 (`src/episode03/`, `scripts/build_ep03_timing.js`: PAUSES ported, the
`98_next_episode` glimpse inside the outro, the UjancharHouse set). `NN` = two-digit episode number, `<EP>` = folder
under `03_Episodes` (e.g. `Episode_04_Idols_and_Coconut_Water`).

## Where
Resources: the main repo `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\<EP>\` (the builder's `REPO_ROOT`). Code: the
worktree `C:\Dipankar\Balak_Thakur_Production`
(branch `feat/ep01-polish-and-rules`) until committed; use the main repo if `remotion_studio/src/episode02/Episode02.tsx`
exists there. Commands run from `<root>` in Git Bash unless noted.

## 1. Check the resources
```bash
E="/c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/<EP>"
ls "$E/01_Script_and_Storyboard/scenes_manifest.json" "$E/02_Audio/Voice_WAVs/audio_durations.json" "$E/04_Video_Assembly/Subtitles_SRT/"*_bn.srt
node -e "const m=require('$E/01_Script_and_Storyboard/scenes_manifest.json');console.log(m.episode_title_bn,'| next:',m.next_episode_title_bn);m.scenes.forEach(s=>console.log(s.scene_id,s.audio_files))"
grep -c -- "-->" "$E/04_Video_Assembly/Subtitles_SRT/"*_bn.srt
```
- SRT cues must equal the manifest's `audio_files` (one cue per clip, in order); each cue's length must match its
  clip's `duration_sec` within 0.3 s (Episode 4's SRT had a 0.45 s drift, see `src/episode04/README.md`).
- Read `01_Script_and_Storyboard/*Voice_Script.md` for who really speaks each line (Episode 3's `02b_Girls_Tease.wav`
  is Charu's voice: the builder's `SPEAKER_BY_FILE` maps it to চারুশীলা).

## 2. Copy and level the voices
```bash
P="<root>/remotion_studio/public/audio/epNN"; mkdir -p "$P"
cp "$E/02_Audio/Voice_WAVs/"*.wav "$P/"
cp "/c/Dipankar/Balak_Thakur_AI_Studio/02_Shared_Assets/Templates/00a_Source_Attribution.wav" "$P/"
```
Then `voice-loudness` on `public/audio/epNN` (-16 LUFS, -1.5 dBTP, lengths unchanged). The builder reads clip lengths
from these played files and cuts pause parts (`NAME_p1.wav ...`) beside them; originals are never written.

## 3. Timing builder (`scripts/build_epNN_timing.js`)
Copy `scripts/build_ep03_timing.js` (it has the pause mechanism and the overlap-aware `end` pause) and change: `epDir`,
SRT name, `outDir` (`remotion_studio/src/episodeNN`), the `EP03_`/`Ep03` prefixes, `speakerFor()` / `SPEAKER_BY_FILE`,
the split points and the `visual` list (one entry per visual scene, following the narration literally). Keep the
mechanics: source card at `cues[0].end + 0.3` s, later cues shift by `SOURCE_DUR + 0.5` s, captions of at most 36
characters, frames = `round(sec * 24)`; scene IDs `00_intro`, `00b_source_attribution`, `99_closing_sequential_outro`
(plus `98_next_episode` for the glimpse segment if the manifest has it).
- **INSERTS** (TIM-INS-01): a scene whose voices are not in the manifest/SRT is added in the `INSERTS` list (copy the
  shape from `build_ep02_timing.js`): the scene it goes before, lead, tail, clips in order (file, speaker, gap,
  Bengali text). A picture-only insert (Episode 2's journey) uses `after` + `dissolveIn` / `dissolveOut`. Never edit
  the source SRT or manifest for an insert.
- **PAUSES** (TIM-PAUSE-01/02/03): start EMPTY. Fill them only from the director-approved pause table
  (`episode-polish-pass`). Entry kinds: `{ scene, after: "<unique phrase snippet>", sec, note }`, `at: "open"`,
  `at: "end"`, and optional `clip` + `silence: [a, b]` when the subtitle estimate misses the real silence.
```bash
mkdir -p remotion_studio/src/episodeNN/scenes
node scripts/build_epNN_timing.js                       # writes timing.ts + subtitles.ts; prints scenes and total
NO_PAUSES=1 OUT_DIR=../nopause_epNN node scripts/build_epNN_timing.js   # comparison without pauses (writes elsewhere)
```
It stops if clip and cue counts disagree or a pause has no silence within 0.5 s (it lists the nearest silences).
Never edit `timing.ts` / `subtitles.ts` by hand. Exports scenes use: `EPNN_SCENES`, `EPNN_AUDIO`, `EPNN_PAUSES`,
`EPNN_CLIP_PARTS`. Add an `EPNN_CLOCK = makeStoryClock({...})` block with `useStoryN`, `cueLocalStoryN`, `clipSpanN`,
`pausesForN` to `src/episode/storyClock.ts` (copy the `EP03_CLOCK` block; one owner for that file).

## 4. Scenes (`src/episodeNN/scenes/`)
- `Scene00Intro.tsx`: the Episode 1 intro unchanged in design, with this episode's label and name (copy Episode 3's).
- Source card: `SourceAttributionScene` with `<SourceCard bn en frames>` in `EpisodeNN.tsx` (copy Episode 2/3).
- Story scenes: reuse shared sets, never redraw a known location: the Vedic house `BaidikBariDay`
  (`src/cinematic/sets/S01_DaySets.tsx`), the courtyard `CourtyardBack`/`CourtyardFloor` (`Interiors.tsx`), and for every
  Ujanchar episode the family's village house `src/cinematic/sets/UjancharHouse.tsx` (read its header: `UjancharHouse`,
  `UJANCHAR_BG`, `ujancharKeepInSet`, time `"morning" | "dawn"`, safe camera range). Drive story action from `f` and life
  (blinks, breathing) from `lifeF` from the start (PIT-03). Tie camera keys to cues with `cueLocalStoryN` (CAM-13).
- `Scene99...Outro.tsx` and the glimpse (TTL-10a, replaces the old framed preview): the shared `SeriesOutro` sunset with
  title and captions, and over it the next episode as a SOFT GLIMPSE: a calm, divine moment of the next episode in a
  feathered elliptical vignette (no frame, border, shadow or dark backing) that melts into the sunset, fades in on the
  "আসছে পরের পর্ব" narration line, drifts and zooms very slightly, and fades out before the outro's fade to dark; the
  label "পর্ব <next>" and `next_episode_title_bn` in glowing cream-gold Baloo Da 2 on the lower feathered edge. Copy
  `src/episode03/scenes/Scene98NextEpisode.tsx` (a layer inside the outro; the 98 segment draws nothing itself) or
  Episode 2's `Scene99Outro.tsx`. No pauses in the outro or glimpse; no empty end hold.

## 5. `src/episodeNN/EpisodeNN.tsx` with sound from the start
Copy `src/episode03/Episode03.tsx` and adapt:
- `SCENE_COMPONENTS` keyed by `sceneId`; narration from `EPNN_AUDIO` (played parts only).
- Captions without the intro: `<SeriesSubtitles cues={EPNN_CUES.filter((c) => c.from >= EPNN_SCENES[1].startFrame)} />`.
- Sound beds in the first build, not as an afterthought: one ambient bed per scene (`public/audio/ambient/`, the deep
  beds in `public/audio/ep02/deep/`) and music (`public/audio/music/`), ducked under the voice and rising in pauses
  (copy the ducking block of `Episode02.tsx`: loops at most 0.25 in a pause, music at most 0.25); day birds for day
  scenes, crickets only at night, `Divine_Motif` only at sacred moments.
- `SFX_CUES` anchored to scenes, cues and pauses (volumes 0.15 to 0.45, loops 0.25 or below). New generated sounds go
  in `public/audio/sfx/epNN/` with a README; real recordings via `sfx-from-commons`.
- Related scenes: slow cross-dissolve (36 to 48 frames); separate stories: chapter break (fade to black, hold, soft
  chime, fade in).

## 6. Register in `src/Root.tsx`
```tsx
import { EpisodeNN } from "./episodeNN/EpisodeNN";
import { EPNN_TOTAL_FRAMES } from "./episodeNN/timing";
<Composition id="EpisodeNN" component={EpisodeNN} durationInFrames={EPNN_TOTAL_FRAMES} fps={24} width={1920} height={1080} />
```

## 7. Check, then polish
```bash
cd remotion_studio && NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit   # ignore src/param_bismoy_ep01
```
Then `frame-qa` (intro without captions, source card, every scene start/beat/end, dissolves, the outro glimpse) and
show the director (`studio-run`). Shot list, pauses and the scene pass follow `episode-polish-pass`. Full render only
after approval (`render-episode`).

## 8. Final SRT
After the last timing change (and again at the final render), export the as-rendered subtitles:
```bash
node scripts/export_ep02_srt.js NN      # e.g. 4; writes 03_Episodes/<EP>/04_Video_Assembly/Subtitles_SRT/<EP>_bn_final.srt
```

## 9. Decision files
Read `01_Series_Bible/DIRECTOR_DECISIONS.md`, `docs/PIPELINE_DECISIONS.md` and `docs/QA_CHECKLIST.md` (main repo) before
starting; record any new director decision there in the same session. Commit only when asked.
