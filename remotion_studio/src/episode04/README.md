# Episode 4: The Idols & The Coconut Offering (শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক)

Timing and subtitle data for Episode 4, built from the Episode 4 resources in the main repo. Frames are at 24 fps.

- `timing.ts`: `EP04_SCENES`, `EP04_AUDIO`, `EP04_TOTAL_FRAMES` (2210 frames, about 92.1 s).
- `subtitles.ts`: `EP04_CUES` (8 cues from the Bengali SRT).
- Narration WAVs: `public/audio/ep04/` (same file names as `02_Audio/Voice_WAVs/`).

Layout: clips are placed back to back with a 0.3 s (7 frame) gap after each clip. Each scene spans its clips plus the gap after its last clip. Frames are `round(duration_sec * 24)` from `audio_durations.json`.

## Scenes

| # | Scene ID | Frames (start, length) | Frame range | Narration file(s) (start, frames) | Visuals |
|---|----------|------------------------|-------------|-----------------------------------|---------|
| 1 | `00_intro` | 0, 173 | 0 - 172 | `00_Intro.wav` (0, 166) | Needs visuals |
| 2 | `01_clay_shiva_and_doll` | 173, 661 | 173 - 833 | `01a_Narrator_Shiva.wav` (173, 381); `01b_Toddler_Thakur_Clay.wav` (561, 266) | Needs visuals |
| 3 | `02_gobinda_pond_and_thakurma` | 834, 491 | 834 - 1324 | `02a_Narrator_Pond.wav` (834, 261); `02b_Thakurma_Blessing.wav` (1102, 216) | Needs visuals |
| 4 | `03_coconut_water_abhishek` | 1325, 259 | 1325 - 1583 | `03a_Bhagabati_Dhoop.wav` (1325, 49); `03b_Toddler_Coconut.wav` (1381, 196) | Needs visuals |
| 5 | `99_closing_sequential_outro` | 1584, 626 | 1584 - 2209 | `99_Outro_Sequential.wav` (1584, 619) | Needs visuals |

Total: 2210 frames.

## Visuals status

No scene has visuals yet. Checked:

- `03_Visuals/Backgrounds`, `Characters`, `Generated_Scenes` and `Title_Cards` in the main repo are empty.
- The `depth_layers` PNGs named in `scenes_manifest.json` (for example `title_card_ep04_L4.png`, `stage_ep04_01_clay_shiva_and_doll_L4.png`) do not exist.
- There are no Episode 4 scene components in this project. The `component` names in `timing.ts` (`Scene00Intro`, `Scene01ClayShivaAndDoll`, `Scene02GobindaPondAndThakurma`, `Scene03CoconutWaterAbhishek`, `Scene99ClosingSequentialOutro`) are planned names only and are not implemented or registered.

## Known sync issue (subtitles vs. audio)

The Episode 4 SRT was laid out with a 0.45 s gap between clips (for example, cue 2 starts at 7.355 s, after the 6.905 s intro). The timing spec here uses 0.3 s. Cues were converted from the SRT as given, so they drift from the audio:

- Cue 2 starts at frame 177 while `01a_Narrator_Shiva.wav` starts at frame 173.
- Cue 8 runs from frame 1610 to 2229, but the audio ends at frame 2203 and `EP04_TOTAL_FRAMES` is 2210. The last cue runs past the end of the episode.

Fix before rendering: regenerate the SRT with a 0.3 s gap, or change the gap in the timing build to 0.45 s (about 11 frames) so the two match.

## Speaker labels

The SRT has no speaker field. Labels were taken from the voice script (narrator = `""`, as in Episode 3):

- Toddler Thakur (বীরু): cues 3 and 7.
- Thakurma (ঠাকুমা): cue 5.
- Bhagabati Thakur (ভগবতী ঠাকুর): cue 6.

The Bengali display names are my choice, not from a series file. Confirm them before use.
