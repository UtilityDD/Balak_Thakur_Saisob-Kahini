# Episode 2: রহস্যময় শৈশব ও গো-সাপ (The Mysterious Infancy and the Go-saap)

Composition `Episode02` (`Episode02.tsx`): `EP02_TOTAL_FRAMES` = 7307 frames at 24 fps (about 5 min 4 s).
Resources in the main repo: `03_Episodes/Episode_02_Shashthi_and_GoShaap/` (the approved shot and pause plan is
`01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md`). Voices: `public/audio/ep02/`. Frame numbers below are
today's; they move whenever the timing is rebuilt, so always read them from `timing.ts`.

## Where to look

| File | What it is |
|---|---|
| `timing.ts` | **Generated, do not edit.** `EP02_SCENES`, `EP02_TOTAL_FRAMES`, `EP02_BREATHS`, `EP02_AUDIO`, `EP02_CLIP_PARTS`, `EP02_PAUSES`, `EP02_DISSOLVES`, `EP02_FPS`. |
| `subtitles.ts` | **Generated, do not edit.** `EP02_CUES` (phrases with speaker). |
| `Episode02.tsx` | Timeline: scenes, dissolves, beds, SFX, pause and breath sounds, narration, captions. |
| `scenes/*.tsx` | One component per scene; each reads its clocks with `useStory(sceneId)` (see `src/episode/README.md`). |
| `rig/Animals.tsx` | `Fox`, `BaghaDog`, `GoSaap` (+ `GOSAAP_STRIDE`), `Goat` (unused); `AnimalProps` with `pose`, `prevPose`, `poseStart`, `lean`. |
| `rig/BullockCart.tsx` | `BullockCart` (`roll`, `step`, `walk`, `close`, `riders`, `ridersOverCanopy`, `bells` ...), `DECK_Y`, `SEAT_Y`, `WHEEL_R`, `STEP_LEN`. |
| `rig/Matka.tsx` | `Matka`, the clay rice pot (`rot`, `mouthView`, `leak`, `rice`, `dust`, world-space `children`). |
| `../../../scripts/build_ep02_timing.js` | Regenerates `timing.ts`, `subtitles.ts` and the cut voice parts. |

## Scenes in timing order (`EP02_SCENES`)

| sceneId | Component (file) | Start | Frames | Pauses | One line |
|---|---|---|---|---|---|
| `00_intro` | `Scene00Intro` | 0 | 184 | | Episode 1 intro design, "পর্ব দুই". No captions. |
| `00b_source_attribution` | `SourceCard` (inline `SourceAttributionScene`) | 184 | 454 | | Book-page source card, stretched to the next scene. |
| `01_shashthi_mystery` | `Scene01Shashthi` | 646 | 708 | 3 | Vedic house wide (`BaidikBariDay`), then the long room of cots; Charu walks in and kisses the calm newborn. |
| `01c_mother_lap` | `Scene01cMotherLap` | 1354 | 283 | open, end | Charu lifts him from the madur into a cradle hold (arms solved on him every frame) and rocks him. |
| `01d_shashthi_rain` | `Scene01dRain` | 1643 | 286 | open, end | Shashthi downpour at the decorated Vedic house (storm regrade); villagers and a boat turn back. |
| `01d2_shashthi_hands_miracle` | `Scene01d2HandsMiracle` | 1929 | 1161 | 3 | **New.** Inside on the rainy morning: the rain follows the baby's waving hands (`rainIntensity`); Thakurma and Surendra speak. |
| `01e_father_letter` | `Scene01eFather` | 3090 | 472 | open, 2 | Grey rainy day: the dak-peon brings the job letter, the family leaves through the gate. Exports `SURENDRA`, `THAKURMA`, `DAK_PEON`. |
| `02a0_journey_to_ujanchar` | `Scene02a0Journey` | 3522 | 264 | | **New.** No narration: six music-led shots J1-J6 of the bullock-cart journey (rain clears to dusk gold). |
| `02a_ujanchar` | `Scene02aUjanchar` | 3746 | 207 | end | One held aerial wide of jungle-ringed Ujanchar at dusk. |
| `02_fox_and_bagha_dog` | `Scene02Fox` | 3953 | 989 | 3 | Night: Charu at the hearth, a fox breaks in through the far wall, Bagha drives it out, Charu finds him smiling. Has a third "acting" clock. |
| `03_lemon_tree_goshaap` | `Scene03Goshaap` | 4929 | 788 | 3 | Ujanchar courtyard: the infant crawls to the go-saaps and pets them; Charu's close-up; fade to black (chapter break). |
| `04_rice_pot_miracle` | `Scene04RicePot` | 5704 | 850 | open, 2 | The matka falls over the toddler; the parents tip it; he sits inside smiling. Exports `ricePotStoryFrame` (its authored-frame clock). |
| `99_closing_sequential_outro` | `Scene99Outro` | 6541 | 766 | | `SeriesOutro` plus the feathered glimpse of Episode 3's tulsi scene. |

Most scenes read their own length from `EP02_SCENES` (a fallback number is only used if the row is missing).

## Timing data the episode file uses

- `EP02_PAUSES` (23 pauses, rule CAM-14): story holds inside scenes. Scenes read them through `useStory`;
  `Episode02.tsx` reads them through `pausesFor`, `pauseWindow` and `storyReal`.
- `EP02_BREATHS`: the hold after a scene's narration (`after`, `next`, `frames`, `startFrame`).
- `EP02_DISSOLVES`: father → journey (40 f at 3522) and journey → Ujanchar (40 f at 3746). The `from` scene's
  `durationFrames` already run to the end of the overlap.
- `EP02_CLIP_PARTS`: original clip → its played parts. `EP02_AUDIO` lists the parts that actually play
  (`01a_Narrator_p1..p5`, `01b_Narrator_Rain_p1..p3`, `01d2a/b/c`, `02a_Narrator_Fox_p1..p4`, `02b_Charu`,
  `03a_Narrator_Goshaap_p1..p4`, `04a_Narrator_Motki_p1..p2`, `04b_Babukaka`, `99_Outro_Sequential`).

## How `Episode02.tsx` places things

- **Scenes**: each in a `<Sequence>` at its `startFrame` for `durationFrames + tail`, where tail =
  max(`SCENE_TAIL`, gap to the next scene), so a timing gap never flashes black.
- **Dissolves**: `SCENE_DISSOLVE_IN` wraps a scene in `DissolveIn` (sine opacity 0 → 1). Entries: the fox scene
  (`UJ_DISSOLVE` 44, with `SCENE_TAIL` keeping the Ujanchar picture for 44 frames under it) and every
  `EP02_DISSOLVES.into`. Beds fade across timed dissolves (`bedFade`).
- **Beds** (`SCENE_BEDS`, per scene: `ambient`, `ambientGain`, `music`, one-shot `sfx` at 0.4): play for the
  scene's own length. Ambience sits at 0.25 open / 0.16 under a voice, music 0.14 / 0.08 (`ducked`,
  `DUCK_RAMP` 12, `DUCK_MERGE` 24). `MUSIC_SWELLS` lifts the father scene's music in its news pause. The journey
  has no bed: `JOURNEY_MUSIC` (one pass of `Warm_Family_Flute`) runs from J1 into Ujanchar. 01d2 plays its own
  rain inside the scene file.
- **Scene cues** (`SFX_CUES`): `at` is a story frame by default (converted with `storyReal`); `cue: "<phrase>"`
  anchors to a subtitle phrase; `real: true` means real local frames. `gate: true` silences a loop in a pause.
  `JOURNEY_SFX` (on the `JOURNEY_CUT` shot boundaries) and the `FATHER` beats (rebuilt from the cues the way
  `Scene01eFather` does) feed into it. Rice-pot cues use `rp()` = `ricePotStoryFrame`.
- **`PAUSE_CUES`**: `{ scene, pause (index), at, fromEnd? }`, real frames from the pause start or end.
- **`BREATH_CUES`**: `{ after, at }`, relative to the breath after scene `after`.
- **Chapter break**: go-saap fades to black inside its scene; `CHAPTER_CHIME` plays `sfx/soft_magical_shimmer`
  at rice-pot story 0.
- **Divine motif**: `DIVINE_MOTIF` plays `music/Divine_Motif.wav` once, from the fox scene's pause 3
  ("…মিষ্টি হাসছে!") to fox story 787.
- **SFX files**: a bare name is `public/audio/sfx/ep02/<name>.wav`; a name with a slash is `public/audio/<path>.wav`.
  Volumes 0.15 to 0.45, loops 0.25 or below.
- **Narration**: every `EP02_AUDIO` row at its absolute frame, volume 1. **Captions**: `SeriesSubtitles` from the
  source card on.

## Episode decisions to keep

- Visuals follow the narration literally (the pot covers the baby; the fox enters through a hole in the far wall
  and Charu never meets it; no guests reach the Shashthi puja; Ujanchar is ringed by jungle, no name board).
- Reused sets: `BaidikBariDay` (regraded by filter, never edited), `CourtyardBack` / `CourtyardFloor`, `Khat`,
  `TulsiMancha`. The go-saap courtyard became the shared `src/cinematic/sets/UjancharHouse.tsx`; this scene file
  itself still draws its own copy.
- A held baby never floats: holders' arms are solved from `BabyThakur` every frame (`stillness` 1, and
  `puppetBreath` when a scene mirrors the shoulder).
- The crawling infant is built inside `Scene03Goshaap` (Puppet is upright only) with `BabyHeadGS`, which follows the
  newborn face reference in `src/cinematic/divine/Divine.tsx`.
- Divine light on Balak only, steady Level 1, brightening gently on key beats.
- Continuity: the father is `SURENDRA` in 01d2, 01e and the journey, but `CAST.babukaka` in the rice pot
  scene (caption speaker বাবুকাকা). Ask the director before unifying.
- Some scenes copy Puppet proportions or motion formulas (`Scene01Shashthi`, `Scene01cMotherLap`, `Scene02Fox`). A
  change to `Puppet.tsx` proportions can break their hand contacts.
