# CLAUDE.md: agent operating guide

Read this first. It says what this project is, where things live, how work is done and the rules the director has
set. The director (the user) makes all creative decisions. Follow these rules; do not invent new ones.
Last refreshed 2026-11-21.

## What this is
"Stories of Balak Thakur" (ছোটদের বালক ঠাকুরের গল্প): a 19-episode Bengali children's animated series about the
child saint Balak Thakur, based on "Sri Sri Balak Brahmachari's Childhood Stories". Animation is code: Remotion
(React + SVG, 1920x1080, 24 fps) with a 2.5D multiplane camera. Audio and subtitles come from a Python/Node pipeline.

## Episode status (2026-11-22)
- Episode 1: final (9,705 frames, 6:44.5). Will need a re-render for the shared rig fixes (hands, breathing,
  baby face); the director said "not now" (2026-11-22).
- Episode 2: final delivered 2026-11-22 (7,307 frames, 5:04.5), with Surendra as the rice-pot father. A re-render so its
  outro glimpse of Episode 3 shows the new Balak is paused at 2 of 4 chunks (`render_final_set3.sh`, resumes skipping them).
- Episode 3: final re-delivered 2026-11-22 (3,259 frames, 2:15.8), at the Vedic house; the girls scold Balak (STO-17a, STO-18);
  reference-plate Balak (BAL-26a) and cinematic score (AUD-07, `02_Audio/Ep03_Music_Cue_Sheet.md`).
- Episode 4: final re-delivered 2026-11-22 (3,335 frames, 2:19.0), at the Vedic house (STO-19); generator scripts/build_ep04_timing.js with pauses, action gaps and chapter breaks; reference-plate Balak (BAL-26b) and cinematic score (AUD-07).
- Episode 5: final delivered 2026-11-22 (2,849 frames, 1:58.8), the Krishnanagar kachari in Ujanchar (STO-20, 20a, 20b): the
  tortoise (Balak seated) and the cow in the banana grove; reference-plate Balak at six (BAL-26), cinematic score (AUD-07).
- Episode 6: final delivered 2026-11-23 (2,978 frames, 2:04.1, -16.4 LUFS) at the Ujanchar house and a new Ujanchar playing
  field (STO-21, CHR-08/08a, AUD-08): the elder brother saved, the treasurer and the ten rupees.
- Episodes 7 to 19: scripts, manifests, SRTs and draft voices only. Planned rework: `05_Rework/` (Balak painted-look library, not started).
- From Episode 5 on Balak follows the director's reference plates (`01_Series_Bible/Thakur_Reference_Plates/`, BAL-26); every
  episode gets a music cue sheet with Indian instruments (AUD-07; library in `remotion_studio/public/audio/music/ep05/`).
Details and pending work: [03_Episodes/README.md](03_Episodes/README.md).

## Where things live
- Main repo: `C:\Dipankar\Balak_Thakur_AI_Studio` (branch `feat/cinematic-animation`). Bible, episode scripts,
  shot-and-pause plans, voice WAVs, SRTs, final renders.
- Production worktree (newest code):
  `C:\Dipankar\Balak_Thakur_Production`
  (branch `feat/ep01-polish-and-rules`). Its `remotion_studio/src` and `scripts` are newer than the main repo's.
- The worktree is a git worktree of this repo, recreated on 2026-11-22 at the permanent path above (the old temp
  folder was deleted; the code survived because it was committed: 3f1bf72). Commit new work on its branch when the
  director asks. Its `remotion_studio/public/audio/` (normalised voices, pause part files, recorded SFX and their
  credit READMEs) is gitignored: after major audio changes refresh the backup in `_backups/` (see
  `_backups/README.md`); credits are versioned in [docs/AUDIO_CREDITS.md](docs/AUDIO_CREDITS.md). After recreating
  the worktree, run `npm ci` in `remotion_studio` and restore `public/audio` from `_backups/`.
- Leave alone: `remotion_studio/src/param_bismoy_ep01/` (and `public/audio/s2_ep01/`) is the director's separate
  new series. Do not edit, move or delete it. Its type errors can fail `tsc`; judge your work by your own files.
- Final renders: `03_Episodes/<Episode_folder>/04_Video_Assembly/Final_Render/<Episode_folder>.mp4`.
- Full map: [docs/REPO_MAP.md](docs/REPO_MAP.md).

## How work is done now
1. Plan: the director approves a per-episode shot list and pause table before any coding
   (`03_Episodes/<Episode>/01_Script_and_Storyboard/EpNN_Shots_and_Pauses_DRAFT.md`; approved for Ep 2 and Ep 3,
   STO-16, STO-17).
2. Timing: pauses go into the episode's timing generator, which is rerun (see "Pauses" below).
3. Build: parallel agents, one per file, each briefed from a shared brief file in the worktree root
   (`AGENT_BRIEF_ep2_pass.md`, `AGENT_BRIEF_ep3_pass.md`) plus its own file, scene and protected fixes.
   Use the agent-dispatch skill. QA agents only report.
4. Verify: the main session checks every change with stills, contact sheets and short clips (lip sync and pauses
   need consecutive frames, PIT-02, PIT-03), and looks at them itself.
5. Approve: the director sees the frames and approves.
6. Render: only then the chunked full render, the final SRT export and the copy to `Final_Render`.

## Golden rules
1. Divine rules for Balak. Divine to devotees, never Krishna-like: no tilak, bangles, anklets, jewellery or sacred
   thread; curly dark hair. Divine light is his alone and restrained: soft warm-white halo behind the head that fades
   out (no hard, dashed or bursting rings or rays), warm golden rim light, faint ground glow, a few slow motes; it
   brightens gently only on key beats and does not pulse with breathing (BAL-01 to BAL-14, MOT-20).
2. One baby face. Baby Balak has one face design in every scene; the newborn BabyThakur face in
   `src/cinematic/divine/Divine.tsx` is the reference (BAL-25).
3. Never float. A held baby's holder computes arm targets from the baby every frame; both hands touch him; a lift
   starts only after the hands are under him. Feet stay planted, contact is always kept (MOT-01 to MOT-07).
4. Hands. One shared `Hand` (`src/cinematic/rig/Hand.tsx`, with a `baby` variant) everywhere: thumbs on the correct
   side, no outline or wrist line, checked on the `HandQA` sheet (MOT-19).
5. Breathing. Subtle, slightly irregular, different per character; quicker in fright, a sigh for relief, quieter
   while speaking (MOT-20).
6. Camera grammar. Every move has a story reason and starts on its line; at most one move per sentence, about 2 s of
   hold between moves, close-ups start 6 to 8 frames before the line; keys tied to narration cues, not hard-coded
   frames; background calmer than the subjects (CAM-11, CAM-13).
7. Pauses. 1 to 2 s holds inside scenes at settled moments, 2 or 3 per scene, from the approved pause table: the
   story waits, life (breathing, blinks, glances, ambient sound) goes on (CAM-14).
8. Captions band. Faces and key action above y = 820; zooms and pans never show a background edge.
9. No full render before approval. Verify with stills and clips, show the director, render only after approval.
10. One agent per file; brief every agent with the protected fixes it must keep; save as you go.
11. Type-check before you finish. From `remotion_studio`:
    `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`
12. Commit and push only when the director asks; end commit messages with the attribution line given in the session.
13. Record decisions in the same session (see the end of this file).

Other standing rules, in brief (details in the decision files): faithful story, cinematic telling (STO-22: every narrated
event shown, plus marked wordless moments around it; no new lines, no changed facts); reuse
established sets (below); captions always one line, split at natural breaks (TTL-14); font Baloo Da 2 (`BN_FONT`, `src/cinematic/fonts.ts`) everywhere; Episode 1 intro, subtitle
and outro styles are the template, the title page shows no captions, the outro shows the next episode as a soft
boxless glimpse (TTL-10a); eased pose changes, overlapping action, no frozen pose over about 20 frames outside a
pause; voices at -16 LUFS / -1.5 dBTP, SFX 0.15 to 0.45, loops 0.25 or below; prefer real CC-licensed recordings
(credit them); never put the user's email in a User-Agent.

## Shared sets (never redraw a known place)
- Vedic house: `BaidikBariDay` in `src/cinematic/sets/S01_DaySets.tsx` (STO-02).
- Inner courtyard: `CourtyardBack`, `CourtyardFloor` in `src/cinematic/sets/Interiors.tsx` (STO-03).
- Ujanchar village house: `src/cinematic/sets/UjancharHouse.tsx` (STO-10, STO-17), the Episode 2 go-saap courtyard
  as one shared set with "morning" and "dawn" light; read its header for the API.

## Pauses (the story clock)
- Pauses live in the `PAUSES` table of the episode's generator (`scripts/build_ep02_timing.js`,
  `build_ep03_timing.js`); scenes without voices in the SRT go in `INSERTS`. The generator cuts voice clips at
  sentence silences into `NAME_p1..pN.wav`, lengthens scenes and shifts everything after. Details: TIM-INS-01,
  TIM-PAUSE-01 to 03 in [docs/PIPELINE_DECISIONS.md](docs/PIPELINE_DECISIONS.md).
- Scenes read `src/episode/storyClock.ts`: `useStory(sceneId)` (Ep 2) or `useStory3` (Ep 3) returns `f` (story clock,
  holds in a pause: drive choreography, mouths and story camera keys with it), `lifeF` (real frame: pass it to every
  rig's `lifeF` prop and anything that keeps moving) and `pause` (`inPause`, `index`, `t`, `frames`).
  `cueLocalStory(snippet, sceneId)` gives a narration phrase's story frames for camera keys; `clipSpan(file)` gives
  a cut clip's window. Run blinks on `lifeF` (PIT-03).

## How to run
Remotion commands run from `remotion_studio` in the production worktree, `scripts/` commands from the worktree root
(Git Bash syntax). The machine has 16 GB of RAM.
- Studio: `npx remotion studio src/index.ts --port 3100` (LAN http://192.168.1.8:3100). Restart it if it hangs
  while agents save files (studio-run skill). Browsers need a click before audio plays.
- Compositions: `Episode01`, `Episode02`, `Episode03`, QA sheets (`HandQA`, `HeadQA`, `EyeQA`, `ToddlerQA`, `GhomtaQA`,
  `CastLineup`, `SourceAttributionQA`). See `src/Root.tsx`.
- Fast stills (bundle once, about 4 s a still; re-bundle after any code change, REN-BUNDLE-01):
  `node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_qa`
  `node node_modules/@remotion/cli/remotion-cli.js still ../bundle_qa Episode03 ../ep3_check/f_1200.png --frame=1200`
- Agents' renders go through the shared lock so only one runs at a time (REN-LOCK-01):
  `bash ../scripts/render_locked.sh still Episode02 ../out/f.png --frame=N` or
  `bash ../scripts/render_locked.sh render Episode02 ../out/clip.mp4 --frames=A-B --codec=h264`
- Full render, only after approval (render-episode skill): parallel chunks of about 2,000 frames, e.g.
  `NODE_OPTIONS=--max-old-space-size=8192 node node_modules/@remotion/cli/remotion-cli.js render src/index.ts Episode02 ../chunks/part_00.mp4 --codec=h264 --crf=16 --concurrency=2 --frames=0-1999`,
  join with `ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`, check duration and blank frames at each join,
  copy to `Final_Render`. (`render_chunks.sh` in the worktree root is the Episode 1 example; its `TOTAL` is stale.)
- Timing: `node scripts/build_ep02_timing.js` / `build_ep03_timing.js` write `src/episodeNN/timing.ts` and
  `subtitles.ts` (generated: never edit by hand).
- Final SRT: `node scripts/export_ep02_srt.js <episodeNumber>` writes
  `04_Video_Assembly/Subtitles_SRT/<Episode>_bn_final.srt` from `subtitles.ts` (the delivered subtitles; the source
  `_bn.srt` lacks inserted lines and pauses).
- Voice loudness: `python scripts/normalize_audio.py` (two-pass linear loudnorm, lengths kept, originals in
  `_original_levels`); voice-loudness skill.
- Generated SFX: `node scripts/synthesize_ep02_sfx.js` (also `synthesize_sfx.js`, `synthesize_divine_motif.js`).
  Replace a placeholder by dropping a recording in under the same name (sfx-from-commons skill).

## Where decisions and knowledge live
- [01_Series_Bible/DIRECTOR_DECISIONS.md](01_Series_Bible/DIRECTOR_DECISIONS.md): creative rules (BAL, CHR, MOT, CAM,
  STO, ANI, TTL, AUD).
- [docs/PIPELINE_DECISIONS.md](docs/PIPELINE_DECISIONS.md): technical and process rules, timing generator, pauses,
  render lock, known code pitfalls (PIT).
- [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) for frame reviews; [docs/decisions/CHANGELOG.md](docs/decisions/CHANGELOG.md)
  for the dated history.
- `.claude/skills/`: agent-dispatch, frame-qa, new-episode, render-episode, sfx-from-commons, studio-run,
  voice-loudness.
- Older bible docs (still valid; link, do not duplicate): `00_Agent_Manifest/`, `01_Series_Bible/characters.json`,
  `visual_style_guide.md`, `AI_Studio_Voice_Design_Master.md`, `Voice_Settings_and_IDs.csv`,
  `asset_taxonomy_and_library_plan.md`, `02_Shared_Assets/Templates/Episode_Template_Guide.md`. The worktree branch
  also has `01_Series_Bible/production_rules.md` and `divine_visual_language.md`.
- Where documents disagree, the decision files win. If still unsure, ask the director.

## When the director decides something new
Write it into `DIRECTOR_DECISIONS.md` (creative) or `docs/PIPELINE_DECISIONS.md` (technical or process) in the same
session, with the date and the reason if one was given, and add a CHANGELOG line. Do not leave a decision only in
chat. If it changes a rule above, update this file too.

## Before you start a task
1. Check which tree you are in (main repo or worktree) and `git status`.
2. Read the decision files and the episode's approved shot-and-pause plan and `src/episodeNN/`.
3. Ask for, or collect, the protected-fix list for the files you will touch.
4. Verify with stills and clips; type-check; report what you changed and what the director should look at.
