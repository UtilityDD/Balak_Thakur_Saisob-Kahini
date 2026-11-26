# Agent brief: Ghibli Episode 5 conversation-led rewrite — PREP while the director records voices

Each agent owns ONLY the files named in its prompt (report anything else).
- Spec: `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\01_Script_and_Storyboard\Episode_05_FULL_PRODUCTION_BLUEPRINT.md`
  (DRAFT; the director may still change lines — keep everything data-driven so lines/timing can change) and the book text
  `Ep05_Book_Source_Text.md` beside it. Decisions: CLAUDE.md, DIRECTOR_DECISIONS.md (STO-20/22/22b/23, BAL-26e/f, CHR-09, TTL-14, AUD-09),
  PIPELINE_DECISIONS.md (REN-GPU-01: renders with --gl=angle, concurrency 2).
- Code: new folder `remotion_studio/src/ghibli_pipeline/episode05_rewrite/` (composition `Episode05GhibliRewrite`, QA `Ep05RewriteCastQA`, both
  registered in Root.tsx by the main session — do not edit Root.tsx). Template to copy patterns from: `src/ghibli_pipeline/episode04/`
  (Episode04Ghibli.tsx, Ep04GhibliShared.tsx, scenes, ep04BalakLook.ts, Ep04BalakDivine.tsx, Ep04PondLife.tsx) and the existing Ghibli
  Episode 5 (`src/ghibli_pipeline/episode05/`, plates `public/images/ghibli_ep05/`, sounds `public/audio/sfx/ep05/`) — reuse, do not edit them.
- Voices: the director is generating them NOW into `03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\02_Audio\Voice_WAVs_Full_Rewrite\`
  (file names from the blueprint's section 10). Until they exist use the blueprint's estimated durations.
- Do NOT edit shared rigs (StandingChild, SeatedChild, ThakurHeadPlate, Puppet, cast.ts, Hand) or anything outside your files; Episodes 1-6 and
  Ghibli Episode 4 must render unchanged. Balak uses the BAL-26f look via a local `ep05BalakLook.ts` (director still to confirm; one switch).
- Renders: `bash ../scripts/render_locked.sh ...` from remotion_studio (it adds --gl=angle) or your own bundle with --gl=angle; never a full
  render. Look at your stills before reporting. Type-check (ignore param_bismoy and cinematic/thakur/qa errors). No commits.
