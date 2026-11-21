# Episode 3: পাঁচ বছরের মুখে অমূল্য তত্ত্ব (Five-Year-Old Wisdom)

Composition `Episode03` (`Episode03.tsx`): `EP03_TOTAL_FRAMES` = 3259 frames at 24 fps (about 2 min 16 s).
Resources in the main repo: `03_Episodes/Episode_03_Five_Year_Old_Wisdom/` (approved plan:
`01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md`, STO-17). Voices: `public/audio/ep03/`; recorded SFX:
`public/audio/sfx/ep03/` (credits in its README). Frame numbers are today's; read them from `timing.ts`.

## Where to look

| File | What it is |
|---|---|
| `timing.ts` | **Generated, do not edit.** `EP03_SCENES`, `EP03_TOTAL_FRAMES`, `EP03_AUDIO`, `EP03_CLIP_PARTS`, `EP03_PAUSES`, `EP03_FPS`. |
| `subtitles.ts` | **Generated, do not edit.** `EP03_CUES`. |
| `Episode03.tsx` | Timeline: scenes, the 01 → 02 dissolve, beds, SFX, pause sounds, divine motif, narration, captions. |
| `scenes/*.tsx` | Scene components; they read clocks with `useStory3` / `cueLocalStory3` (see `src/episode/README.md`). |
| `rig/SeatedChild.tsx` | Five-year-old Balak sitting cross-legged (below). |
| `rig/BirulGlow.tsx` | `BirulGlow({ cx, cy, r = 150, glow, f })`: his restrained halo (soft radial falloff, no rings, six slow motes; no `DivineDefs` needed). |
| `src/cinematic/sets/UjancharHouse.tsx` | The shared Ujanchar house set both story scenes stand in. |
| `../../../scripts/build_ep03_timing.js` | Regenerates `timing.ts`, `subtitles.ts` and the cut voice parts. |

## Scenes (`EP03_SCENES`)

| sceneId | Component | Start | Frames | Pauses | One line |
|---|---|---|---|---|---|
| `00_intro` | `Scene00Intro` | 0 | 176 | | Episode 1 intro design, "পর্ব তিন". No captions. |
| `00b_source_attribution` | `SourceCard` (inline) | 176 | 454 | | Book page; it keeps drawing until scene 01 has faded in (`SOURCE_CARD_END`). |
| `01_sharad_flower_gathering` | `Scene01SharadFlowerGathering` | 638 | 473 | 2 + end | Autumn dawn at the Ujanchar house (`time="dawn"`): Sarala, Mina, Tuni and Rekha (exported `S01_*` Puppets) fill sajhi baskets with jaba, jhumko and shiuli. No divine light. |
| `02_flowers_on_own_feet` | `Scene02FlowersOnOwnFeet` (via `Scene02Dissolving`) | 1098 | 1303 | 9 (02A, 02B, 02C) | Morning at the tulsi mancha: Balak (`SeatedChild`) waters it, lays three hibiscus on his own feet and bows (02A); Charu scolds, the girls giggle (02B); he answers calmly, glow brightens gently (02C). Charu, the girls and the scene 01 women are Puppets. |
| `99_closing_sequential_outro` | `Scene99ClosingSequentialOutro` | 2388 | 703 | | `SeriesOutro` (runs `OUTRO_WITH_GLIMPSE_FRAMES`, through the 98 segment) + `NextEpisodeGlimpse` of Episode 4. |
| `98_next_episode` | `Scene98NextEpisode` | 3091 | 168 | | Draws nothing (`null`); the outro covers it. Appended by the builder. |

Both story scenes take every key from the narration cues (`cueLocalStory3`, `clipSpan3`) and pauses
(`pausesFor3`), and route every camera through `ujancharKeepInSet` so no background edge shows. Scene 01 acts on
the real clock with keys inside the pause windows; scene 02's Balak acts on the story clock `f`, the standing
figures on `lifeF`.

## `EP03_PAUSES`

12 pauses (16.5 s): scene 01 after "শরতের মিষ্টি ভোর।", after "আকাশ-বাতাস ভরে উঠেছে।", end; scene 02 open, then
three per beat 02A, 02B, 02C (pause indices 0 to 8). None in the outro or 98. `02b_Girls_Tease.wav` is Charu's
voice: its captions are labelled চারুশীলা (`SPEAKER_BY_FILE` in the builder).

## How `Episode03.tsx` places things

- **Scenes**: `<Sequence>` per scene with tail = max(`SCENE_TAIL`, gap). `SCENE_TAIL` keeps the source card, scene
  01 (under the dissolve) and the outro (through 98) drawing.
- **01 → 02 cross-dissolve**: `SCENE_DISSOLVE_IN` = `S02_DISSOLVE` (18 f). `Scene02Dissolving` uses `Freeze` to
  remap scene 02's first 18 frames past its own 10-frame fade (`S02_OWN_FADE`), so the dissolve never dips dark.
- **Beds** (`BEDS`, absolute windows with layers `{ file, under, open, pauseOpen?, out? }`): intro and card
  (`Theme_Intro_Bansuri`), scene 01 dawn garden (dawn birds, `sfx/ep02/wind_soft`, `Village_Peace_Loop`), scene
  02 courtyard (`sfx/ep02/birds_village`, wind, `Warm_Family_Flute`, which bows out at `MOTIF_IN`), outro (deep
  river + `Theme_Intro_Bansuri`). Ducking as Episode 2 but `DUCK_RAMP` 10, `DUCK_MERGE` 20. `pauseOpen` sets a
  layer's level inside a given pause.
- **`SFX_CUES`**: story frames by default, or `cue: "<phrase>"`. `B2` derives Balak's beats (pour, leaf, three
  picks, bow, last bow) the way scene 02 does. `PICK` (`paper_rustle` 0.15) stands in for a flower pick.
- **`PAUSE_CUES`**: `{ scene, pause, at, fromEnd? }` (river glint, cloth rustles, shimmer, Charu's steps,
  `sfx/ep03/girls_giggle` with `rate` 1.08 / 1.04 for the second girl).
- `PLACED_SFX` also holds the template's intro `chime_pop` and outro `soft_magical_shimmer`.
- **Divine motif**: `DIVINE_MOTIF` enters on "গাছ কেটে" (Balak's last line), 0.12 under his voice, 0.18 in the end
  pause, fading out early in the outro.
- **Narration** at absolute frames; **captions** from the source card on.

## `SeatedChild` (rig/SeatedChild.tsx)

Borderless vector Balak at about five, cross-legged; cream dhoti and uttariya built from the body joints; serene
face, half-lidded eyes, faint smile, curly dark hair; shared `Hand` (no outline). **No sacred thread, tilak,
jewellery, bangles or anklets; no divine light** (the scene adds `BirulGlow`).

| Prop | Meaning |
|---|---|
| `x`, `y`, `s`, `flip` | Seat centre on the ground line; about 230 px tall at s = 1; faces right. |
| `f` | Story clock: poses, expressions, gestures. |
| `lifeF` | Life clock: breathing, blinks, saccades, idle gaze, sway, weight shift. Pass it whenever `f` holds or warps. |
| `pose`, `prevPose`, `poseStart`, `prevPoseStart` | `SeatedPose`: `sitCross`, `pour`, `pickLeaf`, `placeFlowerOnFoot`, `bowHands`, `lookUp`, `idle`, `bless`, `palmRaise`, `reaction`. Joints blend from `prevPose` over 16 frames. |
| `expression`, `prevExpression`, `expressionStart` | `serene`, `joyful`, `thoughtful`, `compassionate`, `playful` (default from `POSE_EXPRESSION`), 18-frame blend. |
| `face` | `{ lookX?, smile?, eyesDown? }`. |
| `mouth`, `talk` | Mouth 0..1; speech envelope (shallow breathing while speaking). |
| `sigh` | `(f) => 0..1` deep calm breath on a beat; `sighCurve(start)` builds one. |
| `footFlowers` | 0 to 3 hibiscus on his feet (fractional eases the newest in). |
| `showBasket`, `basketAt` | Rig's own basket (default off; the scene owns it) and the pick point. |
| `glow` | Ignored (compatibility). |

## Episode decisions to keep

- Both story scenes use the shared `UjancharHouse` set (STO-17): the same courtyard as Episode 2's go-saap scene.
- Divine light only on Balak, via `BirulGlow`, brightening gently on 02A P3 and the end; none in scene 01.
- The next-episode glimpse names Episode 4 "শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক" (the manifest and SRT title).
