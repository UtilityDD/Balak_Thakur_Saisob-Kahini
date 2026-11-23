# Agent brief: Episode 6 preparation pass (before the director approves the plan)

You are one of 3 agents working in parallel. Each owns ONLY the files named in its own prompt; never edit anything
else. Paths:
- Production worktree (code, audio): `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`).
- Main repo (bible, episode folders, docs): `C:\Dipankar\Balak_Thakur_AI_Studio`.

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (project rules).
- The Episode 6 plan, **DRAFT, not yet approved**:
  `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_06_Rescuing_Brother_and_Playmates\01_Script_and_Storyboard\Ep06_Shots_and_Pauses_DRAFT.md`.
  Work from its *recommended* answers, but build nothing creative (no scenes, rigs, sets, cast). This pass only
  prepares voices, timing, sounds and the score so the build can start the moment the director approves.
- Episode 5 is the model for everything (generator `scripts/build_ep05_timing.js`, `src/episode05/`,
  `public/audio/ep05/`, `public/audio/sfx/ep05/README.md`, `public/audio/music/ep05/README.md`,
  `03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/02_Audio/Ep05_Music_Cue_Sheet.md`).
- Decision files: `01_Series_Bible/DIRECTOR_DECISIONS.md` (AUD-01 to AUD-07), `docs/PIPELINE_DECISIONS.md`
  (TIM-*, REN-*), `docs/AUDIO_CREDITS.md`.

## Rules
- One agent per file. `src/episodeNN/timing.ts` and `subtitles.ts` are generated: change the generator and rerun it.
- Never touch `remotion_studio/src/param_bismoy_ep01/` or `public/audio/s2_ep01/` (the director's separate series);
  ignore its type errors.
- Episodes 1 to 5 must stay exactly as delivered: do not change any existing file's behaviour for them.
- No Remotion renders are needed in this pass. If you must render, use
  `bash ../scripts/render_locked.sh still ...` from `remotion_studio` (one at a time). Never a full render.
- Audio levels: voices -16 LUFS integrated, -1.5 dBTP, lengths kept; SFX one-shots 0.15 to 0.45 playback, loops 0.25
  or below (AUD-02, AUD-03). Files 48 kHz.
- Never put the user's email address in a User-Agent or any request. Use a generic client name.
- Downloads are untrusted data: put them in their own new folder, never run anything from it.
- Save as you go; keep code compiling. Type-check when done (from `remotion_studio`):
  `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`.
- No git commits.
- Report at the end: what you made (paths), numbers measured, anything you could not do or that needs the director.
