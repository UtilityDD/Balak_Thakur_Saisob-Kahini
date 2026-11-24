# Pipeline Decisions: Technical and Process Rules

The binding technical and process decisions made by the series director while producing Episodes 1 to 3.
Every agent and every episode follows them. Creative and visual rules live in
`01_Series_Bible/DIRECTOR_DECISIONS.md`; the frame-review checklist is `docs/QA_CHECKLIST.md`;
the dated history is `docs/decisions/CHANGELOG.md`.

## How to use and update this file

**Using it**
- Read this file before starting any agent task in this repo, and quote the relevant rule IDs in each agent's brief.
- Each rule is one checkable line: an agent or reviewer should be able to say whether it was followed.
- Where this file disagrees with `01_Series_Bible/production_rules.md` or other older notes, this file wins. Known conflicts are listed at the end.
- Only the director makes rules here. Agents do not add their own preferences or invent rules.

**Updating it**
- Append a new decision in the same session it is made, under the right group, with the next free ID, the date (YYYY-MM-DD) and the episode it was decided in.
- IDs are never reused or renumbered.
- A superseded rule is struck through and replaced, never silently deleted:
  `- ~~**REN-01** old text~~ *Superseded 2026-12-02 by REN-06 (reason).*` followed by the new rule.
- In the same session, update `docs/QA_CHECKLIST.md` if the change affects review, and add a line to `docs/decisions/CHANGELOG.md`.

**Conventions**
- `Ep` is the episode in which the rule was decided. `Ep 1-3` means it was decided during the Episode 1 to 3 sessions and the exact episode was not recorded.
- All rules below were recorded on 2026-11-21 from the director's sessions up to that date.

---

## 1. Code location and committing (LOC)

- **LOC-01** The main repo is `C:\Dipankar\Balak_Thakur_AI_Studio` (branch `feat/cinematic-animation`), with folders `00_Agent_Manifest`, `01_Series_Bible`, `02_Shared_Assets`, `03_Episodes`, `remotion_studio` and `scripts`. *Ep 1-3*
- **LOC-02** Each episode folder (`Episode_01` to `Episode_19`) contains `01_Script_and_Storyboard`, `02_Audio`, `03_Visuals` and `04_Video_Assembly/{Final_Render,Subtitles_SRT,Timeline_Project}`. *Ep 1-3*
- **LOC-03** Final renders go to `03_Episodes/<Episode_folder>/04_Video_Assembly/Final_Render/<Episode_folder>.mp4`. *Ep 1-3*
- **LOC-04** CLOSED (2026-11-22): the production code was committed on branch `feat/ep01-polish-and-rules` (3f1bf72, director's request 2026-11-21) and the audio backed up to `_backups/`. The temp worktree folder was then deleted by a cleanup; the worktree was recreated at the permanent path `C:\Dipankar\Balak_Thakur_Production` (`git worktree add`, `npm ci` in `remotion_studio`, `public/audio` restored from `_backups/`). Never keep the production worktree in a temp folder again. *Ep 1-3*

## 2. Agent workflow (AGT)

- **AGT-01** One agent per file: two agents never edit the same file at the same time. *Ep 1-3*
- **AGT-02** Every agent brief includes the list of recent fixes it must keep (protected fixes). *Why:* so it does not undo them. *Ep 1-3*
- **AGT-03** Agents save their file as they go, not only at the end. *Why:* sessions can end mid-task. *Ep 1-3*
- **AGT-04** Every agent that edits code finishes with a clean type-check, run in `remotion_studio`:
  `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`. *Ep 1-3*

## 3. QA and review (QA)

- **QA-01** No full episode is rendered until the director has seen and approved the frames. *Ep 1-3*
- **QA-02** Every change is verified by rendering still frames and contact sheets. *Ep 1-3*
- **QA-03** The agent looks at those stills and contact sheets before saying the work is done. *Ep 1-3*
- **QA-04** QA review agents only report; they never edit files. *Ep 1-3*
- **QA-05** Frame reviews use `docs/QA_CHECKLIST.md` so every episode is reviewed the same way. *Ep 3 (set up with this documentation, 2026-11-21)*

## 4. Rendering, joining and verification (REN)

- **REN-01** Full renders run as parallel chunks of about 2,000 frames. *Why:* long single renders can crash Chrome (`production_rules.md` section 7). *Ep 1-3*
- **REN-02** Chunks are joined with ffmpeg concat. *Ep 1-3*
- **REN-03** The joined file is checked for the expected duration. *Ep 1-3*
- **REN-04** The joined file is checked for blank frames at every join. *Ep 1-3*
- **REN-05** Only after those checks is the file copied into the episode's `Final_Render` folder (LOC-03). *Ep 1-3*

## 5. Remotion Studio (STU)

- **STU-01** The Remotion Studio runs on port 3100 (LAN address `192.168.1.8:3100`). *Ep 1-3*
- **STU-02** If the studio hangs while agents are saving files, restart it. *Ep 1-3*
- **STU-03** Browsers need a click on the page before they play audio; silence before a click is not a bug. *Ep 1-3*

## 6. Voice loudness (PAU)

- **PAU-01** Voices (narration and speech) are normalised to -16 LUFS integrated with a -1.5 dBTP true-peak ceiling. *Ep 1-3*
- **PAU-02** The method is two-pass ffmpeg `loudnorm` in linear mode. *Ep 1-3*
- **PAU-03** Normalising keeps every clip's length identical. *Ep 1-3*
- **PAU-04** Originals are backed up in an `_original_levels/` folder before normalising. *Ep 1-3*

Mix levels for sound effects and loops are creative rules: see AUD-02 and AUD-03 in `DIRECTOR_DECISIONS.md`.

## 7. Sound-effect sourcing, licences and credits (SFX)

- **SFX-01** Real recordings are preferred for animal voices and the baby's cry (AUD-04). *Ep 1-3*
- **SFX-02** Real recordings come from Wikimedia Commons, under CC0, CC BY or CC BY-SA only. *Ep 1-3*
- **SFX-03** For every recording, the source, author and licence are recorded in the sound folder's README. *Ep 1-3*
- **SFX-04** Every recording gets a credit line for the video description. *Ep 1-3*
- **SFX-05** Generated sound effects come from `scripts/synthesize_ep02_sfx.js`. *Ep 2*
- **SFX-06** A generated placeholder is replaced by dropping a recording in under the same file name. *Ep 2*

Because the audio folder and its READMEs are gitignored, the versioned copy of every credit (source URL, author, licence, part used, credit line) is kept in `docs/AUDIO_CREDITS.md`. Update it in the same session as the sound folder's README.

## 8. Wikimedia fetching (WEB)

- **WEB-01** Do not fetch Wikimedia with plain curl; it returns HTTP 429. Fetch through the web-fetch agent. *Ep 1-3*
- **WEB-02** Never put the user's email address in a User-Agent string. *Ep 1-3*

## 9. Commits (GIT)

- **GIT-01** Commit and push only when the director asks. *Ep 1-3*
- **GIT-02** End commit messages with the attribution line given in the session. *Ep 1-3*

---

## Known conflicts with older files (this file wins)

Found on 2026-11-21. The older files were not edited; fix them when the director asks.

1. `production_rules.md` section 6 says generated audio lives in the gitignored `remotion_studio/public/audio/` and WAV files are not committed, and it names `scripts/synthesize_sfx.js`. Episode 2 SFX come from `scripts/synthesize_ep02_sfx.js` (SFX-05). If downloaded Wikimedia recordings and their README credits (SFX-03, SFX-06) sit in that gitignored folder, the licence records are not versioned. The director should decide where recordings and their READMEs live. Until then, the credits are versioned in `docs/AUDIO_CREDITS.md` (added 2026-11-21).
2. `production_rules.md` section 7 says to "review in the Remotion studio before a full render". The newer rule is stricter: verify with stills and contact sheets, and render the full episode only after the director approves the frames (QA-01 to QA-03).

## Known code pitfalls (added 2026-11-21)

- **PIT-01** In `src/cinematic/rig/Head.tsx`, a HeadState `cheeks` value above 0.3 draws puffed cheeks that press the lips small. It used to override the speech mouth, which silently hid Charu's lip sync in the Episode 2 fox scene. Fixed: the puff now applies only when the mouth is nearly closed (`mouth.open < 0.06`), so speech always wins. Still, use `cheeks` up to about 0.3 for a blush on a speaking character.
- **PIT-02** Lip sync must be checked on consecutive frames (render a short clip and tile close crops of the mouth); a few scattered stills can all land on closed moments and hide a broken lip sync.

## Inserted scenes in the timing generator (added 2026-11-21)

- **TIM-INS-01** A scene whose voices are not in the episode's manifest or SRT (for example Episode 2's `01d2_shashthi_hands_miracle`) is added through the `INSERTS` list in `scripts/build_ep02_timing.js`, not by editing the source SRT or manifest. Each insert names the scene it goes before, a lead, a tail, and its clips in order (file, speaker, gap before, Bengali text for the subtitles). The generator reads each clip's real length from `public/audio/epNN`, places the clips inside the new scene, turns the text into subtitle phrases, and pushes the following scene and everything after it later by the insert's length, so every existing scene keeps its own sync. A breath after the insert goes in `BREATHS` as usual.
- New voice clips are normalised to -16 LUFS / -1.5 dBTP in `public/audio/epNN` (originals in `_original_levels`) before the generator runs, since it measures their played length.
- The source SRT in `03_Episodes/<Episode>/04_Video_Assembly/Subtitles_SRT/` does not yet contain inserted lines; regenerate the final SRT from `subtitles.ts` before delivery.

## Pauses inside scenes (added 2026-11-21)

- **TIM-PAUSE-01** Held moments inside a scene (rule CAM-14) go in the `PAUSES` table of `scripts/build_ep02_timing.js` (empty until the director approves the per-scene pause table). Entry: `{ scene, after: "<unique snippet of the subtitle phrase the pause follows>", sec, note }`. The generator finds the phrase's end, cuts the voice clip playing there at the middle of the nearest sentence silence (silencedetect -45 dB / 0.12 s; it must lie within 0.5 s of the phrase end, else the run stops with the nearest silences listed), or holds at the gap between two clips without a cut. Everything after the hold point (later parts of that clip, later clips, cues, scenes, breaths) moves later by the pause, and the scene grows by it. A clip with several cuts (scene splits and pauses) is played as `NAME_p1.wav .. NAME_pN.wav`; unused part files from earlier runs are deleted; originals are never written.
- Exports: `EP02_PAUSES` (`sceneId`, `atStory` = the scene-local frame in the scene's original authored timing where the story holds, `frames`, `startFrame` = absolute real frame) and `EP02_CLIP_PARTS` (original file to its played parts). `EP02_AUDIO` lists only playable parts, so a scene that looks up a cut clip by its file name must switch to `clipSpan(original)`; the generator prints a warning naming such scene files.
- Scenes use `src/episode/storyClock.ts`: `useStory(sceneId)` returns `f` (story frame: holds during a pause, so hard-coded choreography stays in sync), `lifeF` (real local frame, passed to the rigs' `lifeF` prop so breathing and blinks continue) and `pause` (`inPause`, `index`, `t`, `frames`, `elapsed`) for reactions, a slow push or sound inside the pause. Also `storyFrame`, `storyToReal`, `pauseState` (generic, take a pause list), `cueLocalStory(snippet, sceneId)` (a phrase's start and end in story frames, for CAM-13 camera keys) and `clipSpan` / `clipLocalStory`.
- Sounds placed by scene-local frame in `Episode02.tsx` (for example the divine motif at fox local 547) are real frames: convert them with `storyToReal` once a scene has pauses.
- **TIM-PAUSE-02** (2026-11-21) The director-approved Episode 2 pause table (STO-16, 23 pauses, 36 s, no outro pauses) and the journey scene (STO-15) are coded in `scripts/build_ep02_timing.js`. The pause entry now has three kinds: `after: "<snippet>"` (between sentences), `at: "open"` (the story holds at `atStory` 0, so the scene's start stays and its narration and everything after move later) and `at: "end"` (the story holds on the scene's last authored frame, `atStory` = authored length - 1, lengthening its hold after the breath; the breath row keeps its place before the end pause). An `after` pause may name its silence (`clip`, `silence: [a, b]` in the original clip's seconds) when the subtitle estimate does not line up with the voice (the fox narration: 12.02-12.58 and 18.42-18.83 s, chosen from silencedetect and the sentence order). At a clip boundary the story holds 0.3 s after the speech ends (or mid-gap if shorter). Every cut is checked (RMS below -45 dB and peak below -38 dB within 30 ms of the cut; the parts' samples must sum to the original), adjacent silences are not merged (the gap can be a click), and a cue that carries a pause cut has its phrases re-spread between the real cut points so captions follow the voice parts. Picture-only inserts use `after` + `dissolveIn` / `dissolveOut`: `02a0_journey_to_ujanchar` (264 f) starts 40 f before `01e_father_letter` ends and `02a_ujanchar` starts 40 f before the journey ends; these overlaps are exported as `EP02_DISSOLVES { from, into, frames, startFrame }` (Episode02.tsx: `SCENE_DISSOLVE_IN[into] = frames`, no extra tail). The 1.0 s breath after 01e is folded into the scene (end = last line + 2.2 s, authored frames unchanged), so `EP02_BREATHS` has no 01e row. Result: 7,307 frames (5:04.5); the draft's estimate of about 7,350 counted the journey's full 11 s, without the two 40 f dissolve overlaps or the 32 f father-to-Ujanchar overlap that the journey replaces. Backups of the previous generated files: `ep2_timing_before_pauses.ts` and `ep2_subs_before_pauses.ts` beside the worktree.
- **TIM-PAUSE-03** (2026-11-21) The pause mechanism is ported to `scripts/build_ep03_timing.js` with the director-approved Episode 3 table (STO-17): 12 pauses, 396 f (01: 3; scene 02: 9, three per beat 02A/02B/02C; none in the outro 99 or the glimpse 98). Episode 3 is now 3,259 frames (2:15.8). Cuts (silencedetect -45 dB, all at RMS -56 dB or lower): 01a at 2.256 / 7.768 s, 02a at 11.197 s (named silence 11.081-11.312: the estimate is 0.54 s early), 02b at 1.983 / 6.718 s, 02c at 5.991 / 10.411 s; 02A P3 and 02B P3 hold at clip boundaries. Part files are cut at each clip's own sample rate (Episode 3's voices are 24 kHz). One difference from Episode 2: an `end` pause holds on the last frame the scene shows *alone* (`atStory` = min(authored length, next scene's start) - 1), because Episode 3's next scene starts 13 f before the authored end (01 -> 02 dissolve, 02 -> outro); the whole pause is on screen and the overlap frames play unchanged after it (for Episode 2 this is the same as its rule). Clip lengths now come from the played files (as Episode 2). Speaker: `02b_Girls_Tease.wav` is Charu's voice, caption চারুশীলা (`SPEAKER_BY_FILE`). Exports `EP03_PAUSES`, `EP03_CLIP_PARTS`; scenes use `useStory3`, `cueLocalStory3`, `clipSpan3`, `clipLocalStory3`, `pausesFor3`, `absToStory3` (or `EP03_CLOCK`) from `src/episode/storyClock.ts` (Episode 2's exports unchanged). Scene 02's open pause holds story frame 0 through the 18 f dissolve, so scene 02 must drive its own fade-in from `lifeF`. `NO_PAUSES=1 OUT_DIR=<dir>` writes the no-pause timing for comparison. Final SRT re-exported (`Episode_03_Five_Year_Old_Wisdom_bn_final.srt`). Backups: `ep3_timing_before_pauses.ts`, `ep3_subs_before_pauses.ts` beside the worktree.
- **TIM-EP04-01** (2026-11-21) Episode 4's timing is now generated by `scripts/build_ep04_timing.js` (a port of `build_ep03_timing.js`: PAUSES table, open/mid/end pauses, clip splitting at silences, `EP04_PAUSES`, `EP04_CLIP_PARTS`, source card at cue 1's end + 0.3 s with later cues shifted by 18.6 + 0.5 s). It replaces the hand-built `src/episode04/timing.ts` (0.3 s gaps against the SRT's 0.45 s, cue 8 past the end, no source card; backups in `C:\Dipankar\Balak_Thakur_Production_backups\`). `public/audio/ep04` now plays the `Normalized_48k` clips (the raw WAVs had about 0.25 s extra leading silence; kept in `_original_levels/raw_previous/`), levelled to -16 LUFS / -1.5 dBTP by two-pass linear loudnorm from `_original_levels/` (`03b_Toddler_Coconut.wav` read -16.6 LUFS after loudnorm, so it was set with a plain -1.1 dB gain instead; all lengths unchanged). PAUSES stay empty until the director approves the plan. There is no separate `98_next_episode` segment: the glimpse is a layer inside the outro. Result: 2,711 frames (1:53.0), every clip at its SRT time plus the card shift. Speakers checked against the book: 01b and 03b বীরু, 02b ঠাকুরমা (book: "ঠাকুমা বললেন"), 03a পুরোহিত ঠাকুর (voiced with Bhagabati Thakur's voice ID, but the book names only "the priest" in this story; the director should confirm). A short opening address ("মা,") now joins the next caption phrase. `storyClock.ts` gained `EP04_CLOCK`, `useStory4` and friends (Episode 2 and 3 unchanged). Final SRT exported (`Episode_04_Idols_and_Coconut_Water_bn_final.srt`).
- **TIM-GAP-01** (2026-11-22) New timing kind, the **action gap**, in `scripts/build_ep04_timing.js` for Episode 4's wordless book action (STO-19, approved plan). A pause holds the story clock; an action gap is picture time with no narration in which the story clock **keeps running**. `GAPS` entries take the PAUSES kinds `open` / `after` (+ `clip`, `silence`) and find their hold point the same way, then lengthen the scene's authored (story) timeline there: every later clip part, cue, pause and scene moves later, and `f` from `useStory4` runs through the gap (story frames include gaps; `cueLocalStory4` returns them). At one hold point the order is pauses, the gap, then pauses marked `afterGap: true`. Optional named `beats` subdivide a gap. Exported as `EP04_GAPS { sceneId, fromStory, frames, startFrame, beats }`; helpers `gapsFor4`, `gapState4(sceneId, f)` and `useStory4(...).gap` (generic `gapState` in `storyClock.ts`). Also new: chapter breaks `BREAKS` (CAM-10) exported as `EP04_BREAKS { after, next, frames, startFrame }`, timeline in which no scene is mounted; the scene before is cut to its solo frames plus its pauses so it does not overlap the next (no cross-dissolve); helper `breakState4(absFrame)`. Episode 4 with the 9 approved pauses (336 f; 01a cut at 4.345 s in its named silence 3.988-4.701, RMS -73.5 dB), gaps AG1 60 f (scene 03 open) and AG2 180 f (after "ধুপ! ধুপ কই?", beats a_dhoop 72, b_ask 36, c_inside 24, d_drink 48) and two 24 f breaks is **3,335 frames (2:18.96)**: scenes 01 at 635, 02 at 1424, 03 at 2090, outro at 2692; breaks at 1400 and 2066. Episode 2 and 3 timing and helpers unchanged. Final SRT re-exported.

## Shared render lock for parallel agents (added 2026-11-21)

- **REN-LOCK-01** The production machine has about 16 GB of RAM; several agents rendering stills at once run it out of memory. Every agent renders through `scripts/render_locked.sh` in the worktree (from `remotion_studio`: `bash ../scripts/render_locked.sh still Episode02 ../out/f.png --frame=N`, or `render ... --frames=A-B --codec=h264`). It takes a lock directory (`.render.lock` in the worktree root), runs one render, and always releases it; a lock older than 15 minutes is treated as stale. Agents can work in parallel; only their renders queue.
- Agent briefs for a big pass can share one brief file (e.g. `AGENT_BRIEF_ep2_pass.md` in the worktree) so each prompt only adds its own file and scene specifics.
- **REN-BUNDLE-01** (2026-11-21) For many QA stills, bundle once and render from the bundle: from `remotion_studio`, `node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_qa`, then `node node_modules/@remotion/cli/remotion-cli.js still ../bundle_qa Episode02 ../out/f.png --frame=N`. A still takes about 4 s this way instead of about 50 s (each plain `still` re-bundles the project). Re-bundle after any code change. `render_locked.sh` also gives each render a time limit (4 min for a still, 12 for a clip) so a hung render cannot block the queue.
- **PIT-03** (2026-11-21) Frozen blinks in pauses: when a pause starts right after a character's last syllable, a blink keyed on the STORY clock (including the Puppet's end-of-speech blink driven by `talk(f)`) holds for the whole pause, so the character looks asleep (Thakurma in Episode 2, Charu in Episode 3). Run blinks on `lifeF`, and make a speaking character's `talk` read silent across a pause boundary. Check every pause frame for held-closed eyes.
- **PIT-04** (2026-11-22) Stopping a render script does not stop its renders: when a background render script is stopped (by TaskStop or by Claude Code's low-memory guard), only the bash wrapper dies; its node renderer, headless Chrome and ffmpeg children keep running as orphans, and a restarted script then runs duplicates that write to the same chunk files and exhaust the 16 GB of RAM. After any stop, list `node.exe` / `chrome-headless-shell.exe` / `ffmpeg.exe` / `bash.exe` processes whose command lines mention the worktree and kill each tree (`taskkill /PID <pid> /T /F`) before restarting. Render scripts write each chunk to a `.tmp.mp4` and rename it only on success, and skip chunks already done (`render_parallel_rest.sh`), so a retry can never overwrite a good chunk. Close other heavy apps (games, browsers, other AI tools) while rendering; with them closed, two chunks at once fit.

## Episode 5 rigs and sets (added 2026-11-22)
- **RIG-EP05-01** Balak from age 5 on uses the plate design (BAL-26): `SeatedChild` with `design="plate"` and `age`, and the new `StandingChild` (`src/episode05/rig/StandingChild.tsx`); both draw one shared head, `src/cinematic/rig/ThakurHeadPlate.tsx` (turn range up to ±1.8), and one cloth palette (`PLATE_COLORS`). The classic design stays the default, byte-identical for Episodes 3 and 4.
- **RIG-EP05-02** Next to the big-headed Puppet adults, standing Balak uses `s ≈ 0.56` with `headScale ≈ 1.35` (head about 80-85% of an adult Puppet head, height about 0.7 of an adult); place `BirulGlow` at `standingChildJoints().glowAnchor`.
- **RIG-EP06-01** The reference-plate head (`ThakurHeadPlate.tsx`) draws at most a turn of ±1.3 (`PLATE_TURN_READ`, a strong three-quarter); larger requested turns are drawn at 1.3, because the near-profile drawing broke (ear on the cheek, nose past the outline, a ghosted eye). Scenes keep Balak's body yaw moderate (about 0.5) in close shots and let the eyes carry side looks. No delivered Episode 3-5 frame changed (2026-11-23).
- **RIG-EP06-02** Children among children (CHR-08): `EP06_CHILD_SCALE` and `EP06_CHILD_HEAD = 0.8` in `cast.ts` are the single source for standing Balak (s 0.51-0.52 K, headScale about 1.42-1.45), seated Balak (s 0.74 K) and the new Puppet children's heads (`CastMember.headScale`, opt-in). New Puppet options are opt-in and default off: `footwear: "khadam"` with `walkPlantFrames` / `footPlants` for clack sync, `GESTURES6` presets, `swatAt` / `reachAt` (2026-11-23).
- **TIM-EP06-01** Caption anchors: `build_ep06_timing.js` can pin a cue's first phrase (`PHRASE_ANCHORS`) so captions skip a clip's leading room tone; every Episode 6 phrase start is within 1 frame of its voice (2026-11-22).
- **PROC-OWN-01** One owner per shared file across sessions, not only across agents: while the Episode 6 re-cut is in progress, this session owns the Balak rig files (`StandingChild.tsx`, `SeatedChild.tsx`, `ThakurHeadPlate.tsx`) and the painted-look library work (`05_Rework/`, `src/cinematic/thakur/`) is paused; it resumes on top of the healthy build after Episode 6 is re-delivered. *Why:* a second session started the painted look and overwrote an agent's StandingChild work at 08:34; the director chose to pause it (2026-11-23).
- **GHB-PLATE-01** Ghibli plates are kept as painted rasters, sliced into layers (back wall, front pillars and other occluders) with small SVG overlays for anything that moves or changes (lamp flames, doors, light beams, time-of-day shading): the hybrid route. Automatic vector tracing is not used (it posterises the watercolour). A full hand-built SVG set remains the route for the main SVG series. The Vedic house courtyard for Ghibli Episode 4 comes from the director's Gemini images of 2026-11-24 (plain round arches, terracotta walls, red-oxide floor with alpana), replacing the earlier palace-style plate. *Why:* the director asked whether the images could be exact SVGs for easier animation and chose the recommended hybrid plan (2026-11-24).
- **RIG-EP05-03** New shared pieces: `src/cinematic/animals/Tortoise.tsx` (contact helpers `tortoiseGrips`, `tortoiseJawTip`), `src/cinematic/animals/GentleCow.tsx` (Episode 2 cow with gaits; keep `turn` at or below 0.25, the going-away view is weak), `src/cinematic/sets/KrishnanagarKachari.tsx` (compound, corner, grove), Puppet channels `hold`/`holdTurn`/`cheek`, `headHands`, `scratch`, `jab`, bamboo pole with `anchors()`, cast `binoy`, `haricharan`, `surendra`. Each shared-file change was proven byte-identical on Episodes 1-4 frames.
- **RIG-EP05-04** Agents reuse check folders by name (`check_s02` held Episode 3 frames from the day before): give each round a new folder name (e.g. `check_ep05_s02`) so old frames are never mistaken for new ones.
