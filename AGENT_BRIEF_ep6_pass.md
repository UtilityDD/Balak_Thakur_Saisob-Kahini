# Agent brief: Episode 6 build pass, round 1 (foundations)

You are one of several agents working in parallel on Episode 6 of "Stories of Balak Thakur". Each agent owns ONLY
the files named in its prompt (usually one source file plus its own QA sheet). Never edit any other file; if you need
something from another file, report it instead.

- Production worktree (all code): `C:\Dipankar\Balak_Thakur_Production\remotion_studio`.
- Main repo (bible, plans, decisions): `C:\Dipankar\Balak_Thakur_AI_Studio`.

## Read first
1. `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md`.
2. The APPROVED plan (STO-21):
   `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_06_Rescuing_Brother_and_Playmates\01_Script_and_Storyboard\Ep06_Shots_and_Pauses_DRAFT.md`
   (the "DRAFT" in the name is historical; its status block says APPROVED). Especially "Balak in Episode 6", "Scene
   designs and shared looks" (characters, props, sets, light) and the two scene shot lists.
3. `01_Series_Bible/DIRECTOR_DECISIONS.md`: BAL-01 to BAL-14 and BAL-26 (Balak's design and divine light), STO-20a
   (the standing child's bent back is ONE smooth curve, no hump or extra cloth panel), STO-21, MOT-01 to MOT-07 (contact,
   feet planted), MOT-13 (eyes lead, no frozen pose over ~20 f), MOT-19 (shared `Hand`, no outline, thumbs correct),
   MOT-20 (breathing), CHR-* (costumes), CAM-07/08/11 (captions band y < 820, no background edge, calm background).
   `docs/PIPELINE_DECISIONS.md`: RIG-EP05-01/02 (plate design, standing child scale `s ≈ 0.56`, `headScale ≈ 1.35`), PIT-*.
4. Episode 5 as the model: `src/episode05/` (scenes, `rig/StandingChild.tsx`, `qa/*`), `src/cinematic/sets/KrishnanagarKachari.tsx`
   (how a new set is built from `UjancharHouse`'s pieces), `src/cinematic/rig/cast.ts`.

## Core rules
- Episodes 1 to 5 are delivered: anything shared you change must be **opt-in** (a new pose, a new prop, a default-off
  option). Existing poses, props and defaults must render byte-identically. Check one Episode 5 QA still (e.g.
  `StandingChildQA`, `Cast05QA`, `KachariSetQA`) before and after if you touch a shared rig.
- Clocks: components take `f` (story frame, drives choreography) and `lifeF` (real frame: breathing, blinks, sway,
  anything that keeps moving during a pause). Blinks on `lifeF` (PIT-03).
- No glow on anyone but Balak (BAL-05); Balak's glow is `BirulGlow` (soft falloff, never pulsing with breath).
- Balak: BAL-26 plate design at about six (`design="plate" age={6}` on `SeatedChild`; `StandingChild`); no tilak,
  jewellery, thread, bangles, anklets; plain white dhoti and chadar; barefoot.
- All on-screen text in Baloo Da 2 (`BN_FONT`, `src/cinematic/fonts.ts`).
- Your QA sheet: replace the stub at `src/episode06/qa/<YourQA>.tsx` (already registered in `src/Root.tsx`, 240 frames,
  1920x1080; keep the export name). Show every new item large and labelled, animated over the 240 frames.

## Rendering (16 GB machine, one render at a time)
From `remotion_studio`:
- `bash ../scripts/render_locked.sh still <CompositionId> ../check_ep06_<you>/f_<N>.png --frame=<N>` (4 min limit)
- or bundle once into your own folder and render stills from it (about 4 s each; re-bundle after code changes):
  `node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_ep06_<you>`
  `node node_modules/@remotion/cli/remotion-cli.js still ../bundle_ep06_<you> <CompositionId> ../check_ep06_<you>/f.png --frame=N`
- Short clips only through the lock (`render_locked.sh render ... --frames=A-B --codec=h264`). Never a full render.
- LOOK at your stills (Read the PNG) and fix what you see before reporting: faces, hands (no outline, thumbs),
  contact, the bent back's curve, scale against adults.

## Finish
- Keep your file compiling at every save (every render bundles the whole project; a broken save breaks everyone).
- Type-check from `remotion_studio`: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`.
  Ignore errors in `src/param_bismoy_ep01/` (the director's separate series: never touch it) and errors in files
  other agents own (they may be mid-edit).
- No git commits. Report: the API you added (names, props, signatures), the QA still paths to look at, anything
  you could not do.
