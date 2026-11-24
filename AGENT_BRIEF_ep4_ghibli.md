# Agent brief: finish Ghibli Episode 4 (full rewrite) for the director's review

You are one of a few agents. Each owns ONLY the files named in its prompt; never edit anything else (report instead).

- Code: `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\episode04\` (composition
  `Episode04GhibliFull`, 8,594 frames; timing in `timing.ts`/`subtitles.ts` are generated, do not hand-edit).
- Blueprint (the spec): `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_04_Idols_and_Coconut_Water\01_Script_and_Storyboard\Episode_04_FULL_PRODUCTION_BLUEPRINT.md`
  (cast, voice lines, 6 scenes with shot tables, pauses P1-P11, action gaps AG1-AG7, chapter break, audio).
- Pipeline guide: `remotion_studio/src/ghibli_pipeline/README_GHIBLI_PIPELINE.md` and the skill
  `C:\Dipankar\Balak_Thakur_AI_Studio\.claude\skills\ghibli-pipeline\SKILL.md`.
- Rules: `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md`; BAL-01 to BAL-14 (divine light on Balak only, one gentle glow beat in
  Scene 04), BAL-26b (Balak age 5, plate design), MOT-01 to 07 (contact, no floating), MOT-19 (hands: no outline),
  MOT-20 (breathing), CAM-07/08/13 (faces above y = 820, no background edge, camera grammar), STO-22 (wordless moments).

Hard limits:
- Do NOT edit shared rigs or sets outside `src/ghibli_pipeline/episode04/` (`StandingChild.tsx`, `SeatedChild.tsx`,
  `ThakurHeadPlate.tsx`, `Puppet.tsx`, `cast.ts`, `UjancharHouse.tsx` etc., PROC-OWN-01), the delivered SVG `src/episode04/`,
  `src/episode06/`, or `src/param_bismoy_ep01/`. Episodes 1-6 must render unchanged.
- Renders: one at a time via `bash ../scripts/render_locked.sh still|render Episode04GhibliFull ...` from `remotion_studio`,
  or your own bundle `../bundle_ep4g_<you>`; never a full render. Look at your stills/clips (Read the PNG) before reporting.
- Keep files compiling at every save; type-check when done
  (`NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`; ignore `param_bismoy` and
  `src/cinematic/thakur/qa/*` errors). No git commits.
- Report: what you changed, frames/clips to look at, anything you could not do.
