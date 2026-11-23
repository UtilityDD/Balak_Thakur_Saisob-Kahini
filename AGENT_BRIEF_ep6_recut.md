# Agent brief: Episode 6 immersive re-cut (STO-22 pilot)

You are one of several agents working in parallel. Each owns ONLY the files named in its prompt; never edit anything
else (report what you need instead).

- Production worktree (code, audio): `C:\Dipankar\Balak_Thakur_Production\remotion_studio`.
- Main repo (bible, plans, decisions): `C:\Dipankar\Balak_Thakur_AI_Studio`.

## Read first
1. `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md`.
2. The APPROVED re-cut plan (STO-22a):
   `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_06_Rescuing_Brother_and_Playmates\01_Script_and_Storyboard\Ep06_Immersive_Recut_PLAN.md`.
   It only ADDS wordless moments (W1, K1, C1, A1, G1; W2, T1, D1, D2, L1, R1, M1, G2) to the delivered Episode 6;
   the original approved plan `Ep06_Shots_and_Pauses_DRAFT.md` (STO-21) still stands for everything else.
3. `01_Series_Bible/DIRECTOR_DECISIONS.md`: STO-22 and STO-22a (the new rule), STO-21, CHR-08/08a, AUD-07/08, BAL-01 to
   BAL-14, BAL-26, MOT-01 to MOT-07, MOT-13, MOT-19, MOT-20, CAM-07/08/11/13. `docs/PIPELINE_DECISIONS.md`: RIG-EP05-01/02,
   RIG-EP06-01/02, TIM-EP06-01, PIT-*.
4. The Episode 6 build as delivered: `src/episode06/` (Episode06.tsx, scenes, props, qa), `src/cinematic/sets/UjancharVillageField.tsx`,
   `src/cinematic/sets/UjancharHouse.tsx`, `src/cinematic/rig/cast.ts` + `Puppet.tsx`, `src/episode05/rig/StandingChild.tsx`,
   `src/episode03/rig/SeatedChild.tsx`, `scripts/build_ep06_timing.js`, `02_Audio/Ep06_Music_Cue_Sheet.md`.

## Rules
- Episodes 1 to 5 are delivered and must stay byte-identical; shared files change only opt-in.
- No new spoken lines; no glow on anyone but Balak (BAL-05); hands use the shared `Hand` (MOT-19); contact kept.
- Clocks: `f` (story) drives choreography and camera keys; `lifeF` (real) drives breathing, blinks, sway, animals,
  anything that moves during a pause. Keys from narration cues, pauses or gap beats, never hard-coded frames.
- Never touch `src/param_bismoy_ep01/` or the `src/ghibli_pipeline/` files (another session's work).
- Renders: one at a time through `bash ../scripts/render_locked.sh still|render ...` from `remotion_studio`, or your own
  bundle folder `../bundle_recut_<you>`; never a full render. Look at your stills (Read the PNG) and fix before
  reporting.
- Keep files compiling at every save; type-check when done
  (`NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`, ignore param_bismoy).
- Audio: SFX one-shots 0.15 to 0.45, loops 0.25 or below; CC-licensed recordings with credits; never put the user's
  email in a User-Agent; downloads in their own folder, never run anything from them.
- No git commits. Report: what you made (paths, API, numbers), still paths to check, anything you could not do.
