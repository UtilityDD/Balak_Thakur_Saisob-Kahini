# Shared brief: Episode 5 preparation round (2026-11-22)

You are one of three agents working in parallel for "Stories of Balak Thakur", a gentle Bengali devotional
children's animated series (Remotion, React + SVG, 1920x1080, 24 fps, 2.5D multiplane camera). Each agent owns only
the file(s) named in its prompt. Never edit any other file. Do NOT git commit.

The three jobs this round:
1. **Plan agent**: the Episode 5 shot-and-pause plan for the director's approval (a Markdown file only, no code).
2. **Design agent**: Balak's new face, hair and costume from the director's reference plates (BAL-26), as an opt-in
   design on the five-year-old rig, plus a QA sheet for the director to approve.
3. **Timing agent**: Episode 5 voices levelled into the studio, the timing generator, and the story clock entries.

Production worktree (code): `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`). Remotion
commands run from `remotion_studio`; `scripts/` commands from the worktree root (Git Bash).
Main repo (docs, bible, episode folders): `C:\Dipankar\Balak_Thakur_AI_Studio`.

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules, how work is done).
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`, especially:
  - **BAL-26 (new today)**: from Episode 5 on Balak follows the director's reference plates in
    `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\Thakur_Reference_Plates\` (age 6, 12, 16, 20, 22), adapted
    to age. Short straight soft black hair with a side part (no curls), large dark-brown almond eyes, straight dark
    brows, small straight nose, calm closed-lip half smile, warm medium-brown skin, white dhoti and a white chadar
    wrapped across the chest and over both shoulders, barefoot, no jewellery or marks. Open the plates and look.
  - BAL-01 to BAL-14 (divine light, still applies), BAL-22 to BAL-24, STO-18 (place, people and speakers come from
    the book), STO-19 (Episode 4 approval, the model for Episode 5), CAM-10, CAM-11, CAM-13, CAM-14, MOT-19, MOT-20.
- `C:\Dipankar\Balak_Thakur_AI_Studio\docs\PIPELINE_DECISIONS.md`: TIM-INS-01, TIM-PAUSE-01 to 03, TIM-EP04-01,
  TIM-GAP-01, PIT-01 to PIT-04.
- The book is the source of truth: `C:\Dipankar\Balak_Thakur_AI_Studio\book.xlsx`, sheet 1, one chapter per row in
  column D (row 10 = chapter 5 = Episode 3; rows 11 and 12 = chapters 6 and 7 = Episode 4; Episode 5 is the next
  chapter(s): check the text). Read with openpyxl via `python -I`, writing UTF-8 output to a file in your scratch
  folder, then read that file (the console mangles Bengali).
- Episode 5 resources: `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\`
  (`01_Script_and_Storyboard\Episode_05_AI_Studio_Voice_Script.md`, `scenes_manifest.json`,
  `02_Audio\Voice_WAVs\` with `audio_durations.json`, `04_Video_Assembly\Subtitles_SRT\*_bn.srt`).
- The Episode 4 models: plan
  `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_04_Idols_and_Coconut_Water\01_Script_and_Storyboard\Ep04_Shots_and_Pauses_DRAFT.md`,
  generator `C:\Dipankar\Balak_Thakur_Production\scripts\build_ep04_timing.js`, clock
  `remotion_studio\src\episode\storyClock.ts` (EP04_CLOCK, useStory4, gapState4, breakState4), episode
  `remotion_studio\src\episode04\`.

## Rendering (16 GB machine; other agents render too)
Bundle once after each edit into your own folder and render stills from it (about 4 s each):
`node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_<you>` then
`node node_modules/@remotion/cli/remotion-cli.js still ../bundle_<you> <Composition> ../check_<you>/f.png --frame=N`.
Clips only through the lock: `bash ../scripts/render_locked.sh render <Composition> ../check_<you>/clip.mp4 --frames=A-B --codec=h264`.
Never a full episode render. Look at your stills before you finish.

## Finish
Type-check from `remotion_studio`: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`
(errors inside `src/param_bismoy_ep01` are the director's separate series: never touch that folder, ignore its errors;
another agent's file may be mid-edit: say so). Keep your files compiling between saves. Save as you go.
Report: what you changed, the paths of your stills or files, open questions for the director.
