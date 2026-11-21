# Shared brief: Episode 2 camera, pause and motion pass (2026-11-21)

You are one of ten agents working in parallel on Episode 2 of "Stories of Balak Thakur", a gentle Bengali
devotional children's animated series (Remotion, React + SVG, 1920x1080, 24 fps, 2.5D multiplane camera).
Each agent owns exactly ONE file (named in your prompt). Never edit any other file.

Working copy: `C:\Dipankar\Balak_Thakur_Production\remotion_studio`

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules).
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: CAM-13 (camera grammar), CAM-14
  (pauses), MOT-19 (hands), MOT-20 (breathing), STO-15, STO-16 (approved plan answers), the BAL rules (Balak's
  divine look), PIT-01 in `docs\PIPELINE_DECISIONS.md` (cheeks at or below 0.3 on a speaking face).
- The APPROVED plan: `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_02_Shashthi_and_GoShaap\01_Script_and_Storyboard\Ep02_Shots_and_Pauses_DRAFT.md`
  (status block at the top, then your scene's Shot list and Pauses, and the "Notes for whoever codes this").
  Implement your scene's shot list and pause moments exactly as approved.

## The new timing (already generated; do not edit timing.ts or subtitles.ts)
- Episode 2 is now 7,307 frames (5:04.5). `src\episode02\timing.ts` exports EP02_SCENES, EP02_AUDIO,
  EP02_BREATHS, EP02_PAUSES (`{sceneId, atStory, frames, startFrame}`), EP02_CLIP_PARTS, EP02_DISSOLVES.
- `src\episode\storyClock.ts`: `useStory(sceneId)` returns `{ f, lifeF, pause }`:
  - `f` = the STORY clock: the scene's original authored local frame. It HOLDS during a pause. Use it for every
    story action (poses, acting tracks, mouths, props, story camera keys). Existing choreography written in local
    frames keeps working if you feed it `f` instead of `useCurrentFrame()`.
  - `lifeF` = the real local frame. Pass it as the `lifeF` prop to every Puppet, BabyThakur and SeatedChild so
    breathing, blinks, saccades and idle life continue during pauses. Use it for anything that must keep moving in a
    pause (a slow push, drifting motes, rain, flames, water).
  - `pause` = `{ inPause, index, t (0..1), frames }`: animate the approved pause moment from it (a look between
    characters, a sigh via the Puppet `sigh` prop, Balak's glow brightening gently, a slow push in on lifeF).
  - Also `cueLocalStory(snippet, sceneId)` gives a narration phrase's start/end in story frames, and
    `clipSpan(originalFile)` gives a voice clip's window even when it has been cut into parts.
- Tie every camera key to the narration with `cueLocalStory` (CAM-13), not to hard-coded frame numbers.

## Camera grammar (CAM-13), in short
Every move has a story reason and starts on its line; at most one move per sentence; about 2 s or more of hold
between moves; a speaker's close-up starts 6 to 8 frames before the line; emotional peaks get a slow push in;
establishing views are held wides; no aimless drift. Keep faces and key action above y = 820; never show a
background's edge.

## Motion
- Rigs now have natural breathing. Puppet props: `breathRate?: number` (1 calm, about 1.6 frightened, can be
  animated), `sigh?: (f) => number` (0..1 pulse), `lifeF?: number`; exported `puppetBreath(...)`. BabyThakur and
  SeatedChild have `lifeF?` (SeatedChild also `sigh`, `talk`). Use breathRate for fright and sigh for relief beats.
- If your scene hand-copies the OLD breathing or bounce to aim a holder's hands at the baby, switch it to
  `puppetBreath(...)` so contact stays exact (never float: both hands touch the baby every frame).
- Hands: the shared `Hand` (`src\cinematic\rig\Hand.tsx`) was rebuilt with correct thumbs and a `baby?: boolean`
  variant. For a hand on the chest or cheek use the "relaxed" shape (the "open" shape reads as a wave). If your
  scene draws its own hands (crawling or sitting baby), switch them to the shared Hand's baby variant.
- No frozen pose longer than about 20 frames outside pauses; gestures start 6 to 8 frames before their cue.

## Rendering: ALWAYS use the shared lock (the machine has 16 GB; parallel renders crash it)
From `remotion_studio`:
- `bash ../scripts/render_locked.sh still Episode02 ../check_<you>/f_1234.png --frame=1234`
- `bash ../scripts/render_locked.sh render Episode02 ../check_<you>/clip.mp4 --frames=1200-1260 --codec=h264`
Render only what you need (about 8 to 12 stills and at most one short clip of a pause), build contact sheets with
ffmpeg, and LOOK at them before you finish. Never render the full episode.

## Finish
Type-check: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`. Errors inside
`src/param_bismoy_ep01` are the director's separate series: ignore them. Errors in other agents' files may be them
mid-edit: say so. Save as you go (sessions can end). Do NOT git commit.
