# Shared brief: Episode 3 camera, pause, set and sound pass (2026-11-21)

You are one of a few agents working in parallel on Episode 3 of "Stories of Balak Thakur", a gentle Bengali
devotional children's animated series (Remotion, React + SVG, 1920x1080, 24 fps, 2.5D multiplane camera).
Each agent owns exactly ONE file (named in your prompt). Never edit any other file.

Working copy: `C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad\ep01run\remotion_studio`

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules).
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: CAM-13 (camera grammar), CAM-14
  (pauses), MOT-19 (hands), MOT-20 (breathing), STO-17 (Episode 3 approved answers: Charu speaks the scolding line
  and the girls only giggle; the episode is set at the Ujanchar village house; the ending holds on Balak's serene
  face as his glow brightens gently, with Divine_Motif under his last line and its pause), the BAL rules,
  PIT-01 in `docs\PIPELINE_DECISIONS.md` (cheeks at or below 0.3 on a speaking face).
- The APPROVED plan: `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_03_Five_Year_Old_Wisdom\01_Script_and_Storyboard\Ep03_Shots_and_Pauses_DRAFT.md`
  (status block at the top with the director's answers and defaults, then your scene's shot list, pauses, the
  sound plan and the notes for coders). Implement it exactly as approved.

## Timing (generated; do not edit timing.ts or subtitles.ts)
- Episode 3 is now 3,259 frames (2:15.8). `src\episode03\timing.ts` exports EP03_SCENES, EP03_PAUSES,
  EP03_CLIP_PARTS and the audio list.
- `src\episode\storyClock.ts`: `useStory3(sceneId)` returns `{ f, lifeF, pause }` (f = the STORY clock, holding in
  pauses, for every story action; lifeF = real local frame, for the `lifeF` prop of every Puppet and SeatedChild and
  anything that keeps moving in a pause; pause = `{ inPause, index, t, frames }` for the pause moment). Also
  `cueLocalStory3(snippet, sceneId)`, `clipSpan3(file)`, `pausesFor3(sceneId)`.
- Scene 02's open pause holds through the dissolve from scene 01, so any fade-in there must run on lifeF.
- Tie every camera key to the narration with `cueLocalStory3` (CAM-13), not hard-coded frames.

## Set
- The Ujanchar village house is a shared set: `src\cinematic\sets\UjancharHouse.tsx` (read its header for the
  components and props: dawn and morning light, tulsi mancha, hibiscus shrub, multiplane layers, safe camera range).
  It recreates Episode 2's go-saap courtyard so the family's home is consistent. Use it instead of Episode 3's old
  garden and ochre courtyard sets.

## Motion and rigs
- SeatedChild (five-year-old Balak, `src\episode03\rig\SeatedChild.tsx`, read-only): props include expression,
  prevExpression, expressionStart, footFlowers, basketAt, showBasket, prevPoseStart, lifeF, sigh, talk.
- Puppet (`src\cinematic\rig\Puppet.tsx`, read-only): breathRate, sigh, lifeF, mouth, talk; FACE_LOOKS in cast.ts.
- Hands: the shared Hand is being refined right now (outline and wrist seam removed); use "relaxed" for a hand on the
  chest or cheek.
- No frozen pose longer than about 20 frames outside pauses; gestures start 6 to 8 frames before their cue; faces
  and key action above y = 820; never show a background edge.

## Rendering (the machine has 16 GB)
Fast method: from `remotion_studio`, bundle once after each edit, then render stills from the bundle:
- `node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_<you>`
- `node node_modules/@remotion/cli/remotion-cli.js still ../bundle_<you> Episode03 ../check_<you>/f_1234.png --frame=1234`
  (about 4 s each). For a short clip use the lock: `bash ../scripts/render_locked.sh render Episode03 ../check_<you>/clip.mp4 --frames=A-B --codec=h264`.
Render only what you need, build contact sheets with ffmpeg, and LOOK at them before you finish.

## Finish
Type-check: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`. Errors inside
`src/param_bismoy_ep01` are the director's separate series: ignore them. Errors in other agents' files may be them
mid-edit: say so. Save as you go; keep your file compiling between saves (every render bundles the whole project).
Do NOT git commit.
