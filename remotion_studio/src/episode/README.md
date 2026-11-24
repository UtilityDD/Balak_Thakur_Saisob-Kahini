# src/episode: shared episode code

The story clock (pauses inside scenes) and the series-wide cards and captions used by Episode 2 onward.
Font everywhere: Baloo Da 2 (`BN_FONT`, `src/cinematic/fonts.ts`). Episode order is always
**intro title (no captions) → source card → story scenes → outro with the next-episode glimpse**.

## Where to look

| File | What it is |
|---|---|
| `storyClock.ts` | Story clock `f`, life clock `lifeF`, pause state, cue and clip helpers (below). |
| `SeriesSubtitles.tsx` | `SeriesSubtitles({ cues })`, `SubtitleCue { from, to, text, speaker? }`. |
| `SourceCard.tsx` | `SourceCard({ bn, en, frames })`: the book-page source card (draws `components/SourceAttribution.tsx`). |
| `SeriesCards.tsx` | `SeriesOutro({ closing, frames = 704 })`, `CARD_PALETTE`, and the unused `SeriesIntro`. |
| `SourceAttributionQA.tsx` | 150-frame QA composition of the source page. |
| `src/cinematic/scenes/Scene00Intro.tsx` | The intro for every episode (`episodeLabel`, `episodeName` props). |

## The story clock (`storyClock.ts`)

Rule CAM-14: a pause is a 1 to 2 s hold between two narration sentences inside a scene. The voice stops and the
story waits, while life goes on (breathing, blinks, ambience, a slow push). The timing builders
(`scripts/build_ep02_timing.js`, `build_ep03_timing.js`) cut the voice clip at the sentence silence, lengthen the
scene by the pause and export `EP0N_PAUSES { sceneId, atStory, frames, startFrame }`. `atStory` is a frame in the
scene's original authored ("story") timing; `startFrame` is the absolute real frame where the pause begins.

In a scene:

```ts
const { f, lifeF, pause } = useStory("02_fox_and_bagha_dog");   // Episode 2
const { f, lifeF, pause } = useStory3("02_flowers_on_own_feet"); // Episode 3
```

- `f`: story frame. Runs like the old local frame, holds at `atStory` during a pause, and is
  `real local - earlier pause frames` after it. Drive choreography, story camera keys and lip sync with it.
- `lifeF`: the real local frame (`useCurrentFrame()`). Pass it to the rigs' `lifeF` prop (`Puppet`, `BabyThakur`,
  `SeatedChild`) so breathing, blinks and idle life keep going inside a pause. Also use it for weather, smoke,
  fades and anything that moves in a pause.
- `pause`: `PauseState { inPause, index, t (0..1), frames, elapsed }`, to animate a reaction inside the pause.
- With no pauses in a scene, `f === lifeF`.

Helpers. Unsuffixed exports are bound to Episode 2; the `3` suffix to Episode 3 (also `EP03_CLOCK`):

| Episode 2 | Episode 3 | Returns |
|---|---|---|
| `useStory(id)` | `useStory3(id)` | `{ f, lifeF, pause }` hook |
| `cueLocalStory(snippet, id)` | `cueLocalStory3` | `{ from, to }` of the first subtitle phrase of that scene containing `snippet`, in story frames (CAM-13: camera keys follow the words), or `undefined` |
| `clipSpan(original)` | `clipSpan3` | `{ startFrame, endFrame, frames, parts }` of an original voice clip in absolute real frames, even after it was cut into `NAME_p1..pN` |
| `clipLocalStory(original, id)` | `clipLocalStory3` | that clip window in the scene's story frames |
| `pausesFor(id)` | `pausesFor3` | the scene's pauses, sorted by `atStory` |
| `absToStory(abs, id)` | `absToStory3` | story frame of an absolute frame |

Generic, any episode: `storyFrame(realLocal, pauses)`, `storyToReal(story, pauses)` (a frame equal to a pause's
`atStory` maps to the pause start), `pauseState(realLocal, pauses)`, and
`makeStoryClock({ scenes, pauses, cues, audio, clipParts })` to bind a new episode's generated timing.

How the episode files use it: `Episode02.tsx` / `Episode03.tsx` convert cue frames with
`storyReal(id, story) = storyToReal(story, pausesFor(id))`, place pause sounds with `pauseWindow(id, index)`, and
gate action loops (steps, pats) to silence while a scene's story is held (`storyRunning`).

Gotcha (Episode 3): scene 02's open pause holds story frame 0 for its first 24 real frames, which include the
18-frame dissolve from scene 01. Drive a fade-in from `lifeF`, not `f`.

## Intro

`Scene00Intro` from `src/cinematic/scenes/Scene00Intro.tsx` with this episode's `episodeLabel` and `episodeName`.
Each episode wraps it in its own `scenes/Scene00Intro.tsx`. Keep the design as it is. Its motion is fixed at 178
frames (it fades out over 166 to 178), whatever the slot length. The intro shows **no captions**: each
`EpisodeNN.tsx` passes `cues.filter((c) => c.from >= SCENES[1].startFrame)`.

## Source card

`SourceCard` fades in over 24 frames and out over its last 24. `bn` and `en` are required by the type but not
drawn: the page text is fixed in `src/components/SourceAttribution.tsx` (edit `BOOK_NAME` and the lines after it
there; every episode picks it up). Both episodes stretch `frames` so the card covers the timing gap before the
first story scene (no black frame). Its narration is `00a_Source_Attribution.wav`, placed by the timing builder.

## Captions (`SeriesSubtitles`)

- `from` and `to` are **absolute** episode frames (`to` exclusive). Put it at the episode root, not in a scene.
- Cues come from the generated `subtitles.ts`: phrases of up to about 36 characters.
- `speaker` `""` or `"কথক"` = narrator, no chip. Any other value (`চারুশীলা`, `ঠাকুরমা`, `সুরেন্দ্রচন্দ্র`,
  `বাবুকাকা`, `বীরু`) gets the gold chip.
- Episode 1 style: dark bottom band, cream 44 px text, character lines white 48 px; band at z-index 49, text 50.
  Keep faces and key action above y = 820.

## Outro

`SeriesOutro` is the sunset card with the series title and the outro narration captions. The next-episode glimpse
(TTL-10a) is a soft, feathered, boxless oval laid over it on the "আসছে পরের পর্ব" line, with the label and episode
name on its lower edge. No empty end hold.

- Episode 2: `src/episode02/scenes/Scene99Outro.tsx` (glimpse of Episode 3's tulsi scene).
- Episode 3: `src/episode03/scenes/Scene99ClosingSequentialOutro.tsx` + `NextEpisodeGlimpse` from
  `Scene98NextEpisode.tsx` (the outro runs on through the 98 segment, which draws nothing itself).
- `CARD_PALETTE.cream` is deliberately not `#FFF4D6` (reserved for Balak's divine light).
