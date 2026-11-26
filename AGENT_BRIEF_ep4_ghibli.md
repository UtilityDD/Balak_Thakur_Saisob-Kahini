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

## Pass 2 (2026-11-25): new Balak look, gestures, pond (BAL-26f)
- The director: "keep the new look of balak thakur, making his divine different look, make him better with detailed work; keep other
  characters as usual; work on gesture improvements, pond ghat, animate pond water, use ducks and more detail. Do not touch other
  episodes now." Read BAL-26e and BAL-26f in DIRECTOR_DECISIONS.md and the reference `01_Series_Bible/Thakur_Reference_Plates/new_ref_thakur.png`.
- OTHER EPISODES MUST NOT CHANGE. Shared rigs (`ThakurHeadPlate.tsx`, `episode05/rig/StandingChild.tsx`, `episode03/rig/SeatedChild.tsx`)
  are edited only by the Balak rig agent, and only behind opt-in props. Do not edit `core/` files (GhibliBalakAura, GhibliLifeKit,
  GhibliStage) or anything outside `src/ghibli_pipeline/episode04/`; create new Episode 4 files instead.
- Every Balak rig in Episode 4 gets `{...EP04_BALAK_LOOK}` (from `./ep04BalakLook` / `../ep04BalakLook`), and every Balak glow uses
  `Ep04BalakDivine` / `Ep04BalakGroundGlow` from `Ep04BalakDivine.tsx` (same props as GhibliBalakAura). No whole-body glow/outline.
- Other characters: design unchanged; gestures may be improved (posing, hand targets, timing) in the scene files.
- The director's uncommitted edits in `Scene01ClayShivaGhibli.tsx` and the three rig files are the starting point: keep them.
