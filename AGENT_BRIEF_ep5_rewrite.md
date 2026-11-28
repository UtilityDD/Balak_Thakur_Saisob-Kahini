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

## BUILD PASS (2026-11-28): all 40 voices are in — make the episode
- The director recorded every line to the blueprint text (verified identical to `lines.json`). `timing.ts` / `subtitles.ts` are
  regenerated on the real voices: 9,870 frames (6:51). They are GENERATED: never hand-edit; key everything to spans
  (`ep05rSpan`, `ep05rAbs`, cue helpers), never raw frame numbers. Levelled voices: `public/audio/ep05_ghibli_rewrite/`
  with `audio_durations.json` (RMS envelope per frame for mouths, as Episode 4 does).
- Open questions (blueprint section 9): the director has not answered individually; build to each question's RECOMMENDED answer.
  List in your report every place where that choice shows on screen.
- Scene files are skeletons: replace the stand-in figures with `Ep05RewriteCast.tsx` (Ep05Person, Ep05Haricharan,
  Ep05SeatedBalak, Ep05StandingBalak, gestures, light presets) and `Ep05RewriteProps.tsx` (tortoises incl. bite/hang/release, pole,
  cucumber vine whole/torn, cow, ledger/inkpot/pen/fan, mat). Read their headers. `scenes/RewriteKit.tsx` is shared: do not edit it
  (report needs). `SKELETON_LABELS` is now off.
- Acting standard = Ghibli Episode 4's final pass (read one of `src/ghibli_pipeline/episode04/scenes/*.tsx` for patterns): every shot of
  the blueprint's shot table staged; lip sync from the RMS envelope, only the speaker's mouth moves; gestures timed to the words, eased,
  overlapping, no frozen pose over ~20 frames outside a pause; listeners react; hands touch what they hold (MOT-01..07); real walks
  (planted feet, no sliding); pauses hold the story while life goes on; faces and action above y = 820; no background edge in frame;
  one camera move per sentence, close-ups 6-8 frames before the line (CAM rules).
- Balak: `{...EP05_BALAK_LOOK}` on every rig, halo/ground glow via `Ep05BalakDivine` (head halo only; two gentle glow beats P3 and P9
  via `ep05GlowBeat`), ink filter with `inkZoom={cam.zoom}`. Opt-in rig props you may use where they look right in your stills:
  `bodyLean="auto"` (StandingChild), `offerTuck={1}` (SeatedChild offerUp), `handDirs` (standing namaskar), `prevReachAt/prevHolding/
  prevReachFor` (smooth kneelReach changes). KNOWN RIG WEAK SPOTS (do not edit rig files; stage around them and report): standing
  pointing bunches the shawl at the neck, a shrug tangles the forearms, a standing cross-body offer bares the far elbow, seated
  offering forearms read long — prefer open-palm gestures, hands near the chest, tucked offers. STO-20b: Balak stays SEATED at the tortoises.
- No new paintings yet: keep the stand-in plates the skeleton uses (listed in each scene header) and make them read well (framing,
  light presets, haze, ground cover over cut-out bases). Life layer (STO-22b): use `core/GhibliLifeKit.tsx` (sunrise/rays, bird flock,
  butterflies via existing components, dust, cloud shadows, dappled light, ground cover, reeds) — sparingly, never across a speaking face.
- Renders: ONLY `bash ../scripts/render_locked.sh still|render Episode05GhibliRewrite ...` from `remotion_studio` (GPU; one at a time; RAM is
  tight: no private bundles, no clip longer than ~240 frames, clips with sound only for lip-sync checks). Look at your stills (Read the PNG).
- Type-check; no commits; report: what each shot now does, frames to look at, sound cues whose timing you fixed in picture (name + span
  + offset, for the sound agent), anything not done.
