# Shared brief: Episode 5 build, round A (rigs, set, animals, people, sound, timing) (2026-11-22)

You are one of about eight agents building Episode 5 of "Stories of Balak Thakur", a gentle Bengali devotional
children's animated series (Remotion, React + SVG, 1920x1080, 24 fps, 2.5D multiplane camera). Each agent owns only
the file(s) named in its prompt. Never edit any other file. Do NOT git commit.

This round builds the pieces; round B (after you) builds the scenes from them. So make your component's API clear,
documented in the file header, and driven by props a scene can key per frame.

Production worktree: `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`). Remotion commands
run from `remotion_studio`; `scripts/` commands from the worktree root (Git Bash).

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules).
- The APPROVED plan (STO-20): `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\01_Script_and_Storyboard\Ep05_Shots_and_Pauses_DRAFT.md`:
  "Balak in Episode 5", "Scene designs and shared looks" (animals, characters, props, sets), both scene shot lists and
  pauses, "Notes for whoever codes this" (with the protected fixes every agent keeps).
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: STO-20, BAL-26 (Balak's design from the
  reference plates, `01_Series_Bible\Thakur_Reference_Plates\01_Thakur_Age06_Child_Ujanchar.jpg` is THE reference for
  this episode: open it and look), BAL-01 to BAL-14 (no glow on anyone or anything but Balak), ANI rules (animals
  realistic and readable), CHR rules, MOT-01 to MOT-20 (planted feet, contact, hands, breathing), CAM-08, CAM-11.
- `C:\Dipankar\Balak_Thakur_AI_Studio\docs\PIPELINE_DECISIONS.md`: PIT-01 to PIT-04.

## Look and code conventions
- Borderless vector shapes with soft form shading, light from the upper left; the Ujanchar palette and materials
  (`src\cinematic\sets\UjancharHouse.tsx`) for anything in this world; Baloo Da 2 (`BN_FONT`, `src\cinematic\fonts.ts`)
  for any text.
- Every rig takes `f` (story clock: drives poses, actions, mouths) and `lifeF` (real frame: breathing, blinks,
  idle motion, ear and tail flicks, anything that keeps moving in a pause). Use seeded noise, never a visible loop.
- Shared `Hand` (`src\cinematic\rig\Hand.tsx`) for every human hand: no outline, thumbs on the correct side (MOT-19).
- Episodes 1 to 4 must not change. If you touch a shared file, prove it: render the same frames of the affected
  episodes before and after and compare them pixel for pixel (ffmpeg `-lavfi psnr`, or a byte compare of the PNGs).

## QA sheets (already registered in Root.tsx by the main session; you own yours and replace the stub)
`src\episode05\qa\StandingChildQA.tsx`, `TortoiseQA.tsx`, `CowQA.tsx`, `KachariSetQA.tsx`, `Cast05QA.tsx` (240 frames
each, 1920x1080). Show every pose, action and state the plan needs, large enough to judge, labelled, animated over the
240 frames where motion matters. Root.tsx belongs to the main session: do not edit it.

## Rendering (memory is tight: about 5 GB free with eight agents)
Use ONLY the lock, from `remotion_studio`, for stills and clips; no private bundles this round:
`bash ../scripts/render_locked.sh still <Composition> ../check_<you>/f.png --frame=N`
`bash ../scripts/render_locked.sh render <Composition> ../check_<you>/clip.mp4 --frames=A-B --codec=h264`
Each call bundles and waits its turn; batch your checks (render a few frames, look, fix, repeat). Retry a timed-out
render once, then report. Never a full episode render. Look at your stills yourself before you finish.

## Finish
Type-check from `remotion_studio`: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`
(errors inside `src/param_bismoy_ep01` are the director's separate series: never touch that folder; another agent's
file may be mid-edit: say so). Keep your files compiling between saves (every render bundles the whole project).
Report: the files you changed, the component API, still paths for the main session to check, anything not done.
