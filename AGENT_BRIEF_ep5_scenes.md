# Shared brief: Episode 5 build, round B (scenes and sound) (2026-11-22)

You are one of three agents building the scenes of Episode 5 of "Stories of Balak Thakur" (Remotion, React + SVG,
1920x1080, 24 fps, 2.5D multiplane camera). Each agent owns only the file(s) named in its prompt. Never edit any other
file (rigs, sets, animals, cast, timing are finished pieces; if one lacks something, work around it in your file and
say so in your report). Do NOT git commit.

Production worktree: `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`). Remotion commands
run from `remotion_studio`.

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules).
- The APPROVED plan (STO-20), your scene's section in full, plus "Scene designs and shared looks", "Sounds available",
  "Notes for whoever codes this" (protected fixes):
  `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\01_Script_and_Storyboard\Ep05_Shots_and_Pauses_DRAFT.md`
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: STO-20, BAL-26 (Balak in the plate design,
  age 6), BAL-01 to BAL-14 (BirulGlow only on Balak, restrained; brightens gently only on the two key beats), CAM-01,
  CAM-10, CAM-11, CAM-13 (camera keys on narration cues; at most one move per line; ~2 s holds; close-ups start 6 to 8
  frames before the line), CAM-14 (pauses: story waits, life goes on), MOT-01 to MOT-20, TTL rules.
- `C:\Dipankar\Balak_Thakur_AI_Studio\docs\PIPELINE_DECISIONS.md`: PIT-01 to PIT-04, TIM-GAP-01.
- The Episode 4 scenes as the code model: `remotion_studio\src\episode04\scenes\*.tsx` and `Episode04.tsx`.

## Timing and clocks (generated; never edit timing.ts / subtitles.ts)
- Total 2,849 frames. Scenes (absolute): 00_intro 0, 00b_source_attribution 177, 01_tortoise_play 639 (591 f),
  break 1230-1254, 02_banana_grove_cow_rescue 1254 (985 f), 99_closing_sequential_outro 2226 (623 f).
- `src\episode05\timing.ts`: EP05_SCENES, EP05_AUDIO, EP05_CLIP_PARTS, EP05_PAUSES, EP05_GAPS (kinds open/after/end,
  with beats), EP05_BREAKS. `subtitles.ts`: EP05_CUES.
- `src\episode\storyClock.ts`: `useStory5(sceneId)` -> `{ f, lifeF, pause, gap }`: `f` = story clock (holds in
  pauses; runs through action gaps), drive choreography, mouths and story camera keys with it; `lifeF` = real local
  frame, pass it to EVERY rig's `lifeF` (Balak, Puppets, tortoises, cow, BirulGlow, leaves, light). `cueLocalStory5(
  snippet, sceneId)` for cue-anchored camera keys, `clipSpan5("01a_Narrator_Tortoise.wav")` (original names),
  `gapState5`, `breakState5`, `pausesFor5`.
- Scene-local story frames of the key cues and pauses (from the timing agent):
  - S01: lines at 0, 74 (ছোট্ট বীরু), 155 (হঠাৎ), 241 (সবাই), 309 (কিন্তু), 396 (আর কচ্ছপও); P1 at story 148
    (1.5 s), P2 at 236 (1.0 s), P3 end at 482 (2.0 s). One plain frame after P3 before the break.
  - S02: P1 open at 0 (1.0 s); lines 0 (ছয় বছরের), 84 (চুপচাপ), 171 (একদিন), 224 (হরিচরণ বাঁশ হাতে), AG1 310-370
    (beats a_cow_hides 310+36, b_haricharan_arrives 346+24), Haricharan 383 (এই বীরু!), 410, 429; P2 at 462 (2.0 s);
    Balak 473, 527, 590, 624, 648, 722; AG2 end gap 791-851 (a_haricharan_leaves); P3 end at 851 (2.0 s).
  - Use cueLocalStory5 with snippets rather than these numbers where you can.

## The finished pieces (read each file's header for the API)
- Balak seated: `src\episode03\rig\SeatedChild.tsx` with `design="plate"` and `age={6}` (poses incl. sitCross with the
  plate rest, playPebbles + `PebblesArt`, lookUp, talk, palmRaise, pointIn, `headShake` prop, strokeCow with
  `strokeAt`/`strokeDir`). Balak standing: `src\episode05\rig\StandingChild.tsx` (standBend, turnTortoise, reachGrab,
  bitten, rise, handInHands, standIdle, standQuiet; hand/foot/head world helpers). Both share
  `src\cinematic\rig\ThakurHeadPlate.tsx`. Halo: `BirulGlow` (see how Episode 4 scenes place it).
- Set: `src\cinematic\sets\KrishnanagarKachari.tsx` (views compound / corner / grove, `KACHARI[view]` placement points,
  `kachariKeepInSet`, `kachariGrade`, `trellisTorn`, `trellisPoint`, cow slot between `KachariGroveBehindCowLayer`
  and `KachariGroveCowScreenLayer`, `doorOpen`).
- Tortoise: `src\cinematic\animals\Tortoise.tsx` (variants 0-3, walk/dist, neck, turnOver + `tortoiseGrips`, bite /
  release with `biteTarget` + `tortoiseJawTip`, `tortoiseBiteKeys`, turnAway). Put Balak's hands ON the tortoise's
  grip/jaw points every frame; draw the bitten hand before the tortoise.
- Cow: `src\cinematic\animals\GentleCow.tsx` (actions idle/walk/trot/graze/alarm/hidden/nuzzle, `path`, `target`,
  `tugs` + `cowTug`, `cucumber`, `solveGentleCow` for muzzle/forehead points). Keep `turn` at or below 0.25: she
  leaves side-on into the banana plants and is hidden by the trunks (the going-away view is weak).
- People: `src\cinematic\rig\Puppet.tsx` + `cast.ts`: CAST.binoy, CAST.haricharan (rProp/lProp "bamboo", poleTilt,
  poleDrop, `bambooThump` hit at start+13, jab with `pointAt`, throwUp), CAST.surendra, CAST.charu (kneel, hold +
  `holdAt`, holdTurn, cheek, sigh), CAST.womanA (mouthHand). `walkPose`/`walkTravel`: add `walkTravel(...).bodyX` to
  the Puppet's x (not Pose.bodyX). `anchors` callback for world points. `GESTURES5` presets. Haricharan
  breathRate about 2 to 2.5 while agitated. Silent mouths (`shoutMouth`) for Binoy's shout; Haricharan lip-syncs only
  his own line, Balak only his own lines.

## Sound events
Each scene file exports its sound-event list (as Episode 4 did: `S01_EVENTS`, `S02_EVENTS`: `{ id, f (scene-local
story frame or real frame, say which), file, volume }`), so Episode05.tsx can place SFX exactly on the action
(shell knocks, the bite, Charu's cloth rustle, the vine tug, the bamboo thump, the cow breath, the glow shimmer).
Sounds in `public\audio\sfx\ep05\` (shell_scrape, vine_tear, cow_munch (optional, very low), bamboo_thump,
cow_breath, banana_leaves) and `sfx\ep02\` (birds_village, wind_soft, cloth_rustle, footsteps_mud, ...).

## Rendering
Episode05 is registered (a skeleton by the main session with scenes, voices and captions). Use ONLY the lock, from
`remotion_studio`: `bash ../scripts/render_locked.sh still Episode05 ../check_<you>/f.png --frame=N` and
`bash ../scripts/render_locked.sh render Episode05 ../check_<you>/clip.mp4 --frames=A-B --codec=h264`. Render stills of
every shot, every pause start and middle, and short clips for lip sync and contact (consecutive frames). Look at them.
Never a full render. Faces and key action above y = 820; no background edge at any zoom.

## Finish
Type-check from `remotion_studio`: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`
(ignore `src/param_bismoy_ep01`). Keep your file compiling between saves. Report: what you built, frames to check
(absolute), the exported events, anything you could not do.
