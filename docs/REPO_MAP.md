# Repo map

One line per folder or key file. Paths are relative to the repo root unless noted.
See [../CLAUDE.md](../CLAUDE.md) for the rules and commands.

## Main repo: `C:\Dipankar\Balak_Thakur_AI_Studio`

### Root
| Path | Purpose |
|---|---|
| `CLAUDE.md` | Agent operating guide (loaded automatically by Claude Code) |
| `README.md` | Human overview of the series, layout and pipeline |
| `book.xlsx` | Bengali source workbook (one sheet of story material from the book) |
| `.gitignore` | Ignores MP4/MOV/MKV renders, `Normalized_48k/`, `Final_Mix/`, `Rendered_Scenes/`, `remotion_studio/public/audio/`, `node_modules/` |
| `docs/` | Repo map (this file), `PIPELINE_DECISIONS.md`, `QA_CHECKLIST.md`, `AUDIO_CREDITS.md` (versioned copy of SFX credits), `decisions/CHANGELOG.md` |
| `.claude/skills/` | Agent skills for recurring jobs |

### `00_Agent_Manifest/`
| Path | Purpose |
|---|---|
| `AGENT_WORKFLOW_README.md` | Original agent workflow: bible reading order and the per-episode Python pipeline |
| `series_config.json` | Series title, video specs (1920x1080, 24 fps, x264 CRF 16), 5 depth planes, audio levels |

### `01_Series_Bible/`
| Path | Purpose |
|---|---|
| `DIRECTOR_DECISIONS.md` | The director's creative decisions (the latest record) |
| `characters.json` | 19 character entries: appearance, ages, rig layers, voice links |
| `visual_style_guide.md` | Art style, borderless rule, depth planes, camera easing, lip-sync and gesture spec, weather presets |
| `AI_Studio_Voice_Design_Master.md` | Google AI Studio voice design prompts for each saved series voice |
| `Voice_Settings_and_IDs.csv` | Per-character voice prompt, default style and saved voice ID |
| `asset_taxonomy_and_library_plan.md` | Shared asset folder taxonomy and naming convention |
| `production_rules.md`, `divine_visual_language.md` | Only on the worktree branch so far: binding production rules and Balak's divine visual language |

### `05_Rework/`
| Path | Purpose |
|---|---|
| `README.md` | Index of rework projects that change shared assets across the series, and the layout of a project folder |
| `Thakur_Painted_Look_Library/PLAN.md` | Plan (not started) for a reusable hand-painted, more alive look for Balak, tested on him first; `references/`, `qa/`, `reviews/` beside it |

### `02_Shared_Assets/`
| Path | Purpose |
|---|---|
| `asset_catalog.json` | Index of reusable assets |
| `Background_Refs/` | Six category folders (skies, Padma rivers and boats, flora, 1920s architecture, props, weather); empty so far |
| `Character_Refs/` | Per-character reference sheets; empty so far |
| `Music_Loops/` | Five loopable music stems (theme bansuri, village peace, festival folk, sacred night, family flute) |
| `SFX_Pack/Ambient_Beds/` | Long nature beds (river, night crickets, monsoon courtyard, dawn birds) |
| `SFX_Pack/Foley_and_Events/` | One-shot effects (ulu, temple bell, sparkler, ship horn, chime, shimmer and more) |
| `Templates/Episode_Template_Guide.md` | Shared intro and sequential outro structure for every episode |
| `Templates/series_intro_template.json`, `series_outro_template.json` | Intro and outro templates |
| `Templates/00a_Source_Attribution.wav` | Narration for the source card |

### `03_Episodes/`
| Path | Purpose |
|---|---|
| `README.md` | Per-episode folder convention, how to start an episode, status of each episode |
| `Episode_NN_<Name>/` | One folder per episode (01 to 19); layout in [../03_Episodes/README.md](../03_Episodes/README.md) |
| `Episode_02_.../01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md` | Director-approved Episode 2 shot list and pause table (STO-16; approved despite the file name) |
| `Episode_03_.../01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md` | Director-approved Episode 3 shot list, pause table and sound plan (STO-17) |
| `Episode_NN_.../04_Video_Assembly/Subtitles_SRT/<Episode>_bn_final.srt` | Final, as-rendered subtitles exported from `subtitles.ts` (Episodes 2 and 3); the `_bn.srt` beside it is the source SRT |

### `remotion_studio/` (main repo copy: older)
| Path | Purpose |
|---|---|
| `package.json` | Remotion 4, React 18, TypeScript; scripts `studio`, `render:ep01`, `typecheck` |
| `remotion.config.ts` | JPEG frames, overwrite on, concurrency 4 |
| `public/audio/` | Audio served to Remotion (gitignored) |
| `src/` | Earlier Episode 1 code (`Episode01.tsx`, `components/`, `lib/`, `scenes/`). The newer code is in the worktree, below |

### `scripts/`
| Path | Purpose |
|---|---|
| `validate_studio.py` | Validates the config, character bible and episode manifests |
| `cartesia_tts.py` | Cartesia Sonic TTS generator (needs `CARTESIA_API_KEY`) |
| `normalize_audio.py` | Older single-pass version (trims silence); the worktree copy is the current two-pass one |
| `generate_srt.py` | Builds the Bengali SRT from the voice script and `audio_durations.json` |
| `synthesize_audio.py` | Procedural music loops, ambient beds and foley (NumPy/SciPy) |
| `render_25d_scene.py` | Earlier ffmpeg 2.5D compositor (not used for Remotion renders) |
| `assemble_episode.py` | Earlier 4-bus mix and MP4 assembly (not used for Remotion renders) |

## Production worktree

Path: `C:\Dipankar\Balak_Thakur_Production`
(branch `feat/ep01-polish-and-rules`). Newest code; mostly uncommitted; must be committed into the repo.

### Worktree root and `scripts/`
| Path | Purpose |
|---|---|
| `AGENT_BRIEF_ep2_pass.md`, `AGENT_BRIEF_ep3_pass.md` | Shared brief files for the parallel agent passes on Episodes 2 and 3 (each agent's prompt adds only its file and scene) |
| `render_chunks.sh` | Example chunked render (2,000-frame parts) plus ffmpeg concat (Episode 1; its `TOTAL=9246` is stale, Episode 1 is 9,705 frames) |
| `.render.lock` | Lock directory used by `scripts/render_locked.sh` while a render runs (exists only during a render) |
| `bundle_*/` | Remotion bundles for fast stills (rebuild after code changes; scratch) |
| `chunks/` | Render chunk output and logs |
| `ep1_*/`, `ep2_*/`, `ep3_*/`, `stills_*.png`, `qa_*/`, `round*/` | Scratch still frames and contact sheets from review rounds |
| `*.backup.tsx`, `*_patch.js`, `*_block.tsx`, `studio*.log` | Scratch backups, one-off patches and studio logs |
| `scripts/README.md` | Script reference (partly out of date: it still describes the old single-pass `normalize_audio.py`) |
| `scripts/build_ep02_timing.js` | Builds Episode 2 `timing.ts` and `subtitles.ts` from manifest, durations and SRT, with `INSERTS` (scenes not in the SRT), `BREATHS`, `PAUSES` (approved pause table; cuts clips into `NAME_pN.wav`) and dissolves (TIM-INS-01, TIM-PAUSE-01/02) |
| `scripts/build_ep03_timing.js` | The same for Episode 3 with its approved `PAUSES` (TIM-PAUSE-03); `NO_PAUSES=1 OUT_DIR=<dir>` writes a no-pause comparison |
| `scripts/export_ep02_srt.js` | Exports an episode's final SRT from `subtitles.ts` (`node scripts/export_ep02_srt.js <N>`) to `<Episode>_bn_final.srt` |
| `scripts/render_locked.sh` | Runs one Remotion still or clip render under a shared lock with a time limit, so parallel agents do not run the 16 GB machine out of memory (REN-LOCK-01) |
| `scripts/normalize_audio.py` | Two-pass linear loudnorm to -16 LUFS / -1.5 dBTP, lengths kept, originals backed up to `_original_levels/`; writes `audio_durations.json` |
| `scripts/synthesize_ep02_sfx.js` | Procedural Episode 2 SFX into `public/audio/sfx/ep02/` |
| `scripts/synthesize_sfx.js` | Procedural Episode 1 SFX |
| `scripts/synthesize_divine_motif.js` | The divine motif sound |

### `remotion_studio/public/` (gitignored audio)
| Path | Purpose |
|---|---|
| `audio/ep01` ... `audio/ep04` | Normalised voice clips per episode (Episode 2 originals in `ep02/_original_levels/`) |
| `audio/ep02/`, `audio/ep03/` part files | `NAME_p1.wav .. NAME_pN.wav`: voice clips cut at pause points by the timing generators (originals kept) |
| `audio/sfx/`, `audio/sfx/ep02/` | Sound effects; `sfx/ep02/README.md` lists placeholders and credits for recorded sounds |
| `audio/sfx/ep03/` | Episode 3 recordings from Wikimedia Commons (`girls_giggle.wav`, `water_pour.wav`); credits in its `README.md` |
| `audio/s2_ep01/` | Audio of the director's separate series: leave alone |
| `audio/ambient`, `audio/music`, `audio/shared` | Ambient beds, music, shared clips (source card narration) |
| `fonts/BalooDa2-Variable.ttf` | Baloo Da 2, the series font (SIL OFL) |

### `remotion_studio/src/`
| Path | Purpose |
|---|---|
| `index.ts` | Remotion entry point |
| `Root.tsx` | Registers all compositions (Episode01/02/03, scene demos, QA sheets, and the director's ParamBismoy compositions) |
| `Episode01.tsx` | Episode 1: cinematic scenes, word-timed subtitles, mix |
| `data/episode01Data.ts` | Episode 1 scene and audio data |
| `types/studio.ts` | Shared types |
| `scenes/Episode01Scenes.tsx` | Episode 1 scene renderer (`_legacy` branches unused: do not edit them) |
| `cinematic/core/Stage.tsx` | Multiplane camera stage |
| `cinematic/core/anim.ts` | Core animation math (easing, ranges) |
| `cinematic/divine/Divine.tsx` | Divine visual toolkit: halo, rim light, motes, `DIVINE` palette |
| `cinematic/fonts.ts` | Loads Baloo Da 2; exports `BN_FONT` |
| `cinematic/fx/Fx.tsx` | Effects: flames, diyas, particles |
| `cinematic/audio/Mix.tsx` | Broadcast-style mix for the cinematic scenes |
| `cinematic/rig/Puppet.tsx` | Character rig v2 (body, cloth, poses, stillness) |
| `cinematic/rig/Head.tsx`, `head3d.ts` | Head v2: 3D-ish face model, eyes, hair, turns |
| `cinematic/rig/Hand.tsx` | Shared hand for every character (MOT-19): shapes relaxed, open, point, fist, hold, pranam, abhaya, cup; `baby` variant; thumb rule in its header |
| `cinematic/rig/cast.ts` | Cast sheet derived from `characters.json` |
| `cinematic/rig/idle.ts` | Seeded idle life (weight shift, glances, fidgets) |
| `cinematic/rig/lipsync.ts` | Mouth state from the audio envelope |
| `cinematic/scenes/Scene00Intro.tsx` ... `Scene08Closing.tsx` | Episode 1 scenes (title, village, Diwali, arrival, ulu, rain, Thakurma, flowers, closing) |
| `cinematic/sets/S01_DaySets.tsx` | Day village sets, incl. the Vedic house `BaidikBariDay` |
| `cinematic/sets/Interiors.tsx` | Interiors, incl. `CourtyardBack` and `CourtyardFloor` |
| `cinematic/sets/Exteriors.tsx`, `AerialEstablish.tsx` | Exteriors, foreground silhouettes, aerial establishing view |
| `cinematic/sets/S05_Sets.tsx`, `S06_Room.tsx` | Birth room (sutika-ghar) sets |
| `cinematic/sets/Sacred.tsx` | Kali-puja mandap (the Goddess is never drawn as a figure) |
| `cinematic/sets/UjancharHouse.tsx` | The family's Ujanchar village house: the Episode 2 go-saap courtyard as one shared set ("morning", "dawn"), used by Episode 3; API in its header (STO-10, STO-17) |
| `cinematic/*QA.tsx`, `CastLineup.tsx`, `Scene02Demo.tsx` | QA sheets (`HandQA` hands, heads, eyes, toddler, ghomta, cast lineup) and a demo |
| `components/` | Older shared components: `Camera25D`, `CharacterRig`, `BengalNature`, `CinematicSubtitles`, `StoryVignettes`, `SourceAttribution` (book-page card) |
| `episode/SeriesCards.tsx` | Shared title card and outro cards for all episodes |
| `episode/SeriesSubtitles.tsx` | Shared Episode 1 style subtitles |
| `episode/SourceCard.tsx`, `SourceAttributionQA.tsx` | Source card after the title, and its QA preview |
| `episode/storyClock.ts` | Story clock for pauses: `useStory` / `useStory3` (`f`, `lifeF`, `pause`), `cueLocalStory`, `clipSpan`, `storyToReal`, `makeStoryClock` for new episodes |
| `episode02/Episode02.tsx` | Episode 2 composition: scenes, transitions, beds, `SFX_CUES` |
| `episode02/scenes/` | Episode 2 scenes: intro, Shashthi, mother's lap, rain, hands-and-rain miracle, father's news (peon), journey, fox and Bagha, Ujanchar, go-saap, rice pot, outro |
| `episode02/rig/` | `Animals.tsx` (dog, fox, cow, go-saap), `BullockCart.tsx`, `Matka.tsx` (rice pot) |
| `episode02/timing.ts`, `subtitles.ts` | Auto-generated by `build_ep02_timing.js` (do not edit by hand); 7,307 frames; exports `EP02_PAUSES`, `EP02_CLIP_PARTS`, `EP02_DISSOLVES` |
| `episode03/Episode03.tsx` | Episode 3 composition |
| `episode03/scenes/` | Episode 3 scenes: intro, Sharad flower gathering, flowers on own feet (both on `UjancharHouse`), closing outro, next-episode glimpse |
| `episode03/rig/` | `SeatedChild.tsx` (five-year-old seated Balak), `BirulGlow.tsx` (his halo) |
| `episode03/timing.ts`, `subtitles.ts` | Auto-generated by `build_ep03_timing.js`; 3,259 frames; exports `EP03_PAUSES`, `EP03_CLIP_PARTS` |
| `episode04/README.md` | Episode 4 timing plan, visuals status and the known drift (the SRT uses 0.45 s gaps, the hand-built timing 0.3 s) |
| `episode04/timing.ts`, `subtitles.ts` | Episode 4 timing (2,210 frames) and 8 cues, built by hand (no generator); no scenes yet |
| `param_bismoy_ep01/` | The director's separate series: do not edit, move or delete |

## Scratchpad (temporary, outside both trees)

`C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad`
holds session scratch: `render_Episode02/`, `render_final2/` and similar render folders (chunks, logs, join checks,
the previous Episode 2 cut), backups of generated timing (`ep2_timing_before_pauses.ts`, `ep3_timing_before_pauses.ts`
and others) and one-off tools. All of it is temporary; nothing there is the delivered copy (finals live in
`03_Episodes/.../Final_Render/`).
