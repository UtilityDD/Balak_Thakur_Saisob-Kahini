# Episodes

One folder per episode, `Episode_NN_<Short_Name>` (01 to 19). All 19 folders already exist with the layout below.
Rules for how episodes look and sound: [../CLAUDE.md](../CLAUDE.md) and
[../01_Series_Bible/DIRECTOR_DECISIONS.md](../01_Series_Bible/DIRECTOR_DECISIONS.md).

## Folder convention

```
Episode_NN_<Short_Name>/
  00_concept_and_scene_plan.md        optional: concept and scene plan (Episode 3 has one)
  05_audit_intro_to_outro.md          optional: read-only QA audit (Episode 2 has one)
  01_Script_and_Storyboard/
    Episode_NN_AI_Studio_Voice_Script.md   voice script: one block per WAV (file name, speaker, style, Bengali text)
    scenes_manifest.json                   scenes: id, lighting, camera, characters, audio files, ambient, music, SFX
    EpNN_Shots_and_Pauses_DRAFT.md         per-scene shot list and pause table; the director approves it before coding
                                           (Episodes 2 and 3: approved, STO-16, STO-17, despite "DRAFT" in the name)
  02_Audio/
    Voice_WAVs/                       one WAV per script block (00_Intro.wav ... 99_Outro_Sequential.wav)
      audio_durations.json            duration and 24 fps RMS envelope per clip (drives timing and lip-sync)
      Normalized_48k/                 normalised copies (gitignored)
    Final_Mix/                        voice master and concat lists (gitignored)
    Music/  SFX/                      episode-specific music and effects (mostly empty; shared ones are in 02_Shared_Assets)
  03_Visuals/
    Backgrounds/  Characters/  Generated_Scenes/  Title_Cards/   reference images (mostly empty: visuals are SVG code)
  04_Video_Assembly/
    Final_Render/<Episode_folder>.mp4  the delivered episode (MP4s are gitignored)
    Subtitles_SRT/<Episode_folder>_bn.srt        source Bengali subtitles (input to the timing build)
    Subtitles_SRT/<Episode_folder>_bn_final.srt  final, as-rendered subtitles (exported from subtitles.ts; deliver this)
    Timeline_Project/                  intermediate renders and timeline files
```

The Remotion code for an episode lives in the production worktree at `remotion_studio/src/episodeNN/`
(Episode 1: `src/Episode01.tsx` and `src/cinematic/`). Voice clips are copied into
`remotion_studio/public/audio/epNN/` under the same file names (pause cuts add `NAME_pN.wav` parts beside them).
See [../docs/REPO_MAP.md](../docs/REPO_MAP.md).

## Starting a new episode

1. Read the voice script and scene manifest in `01_Script_and_Storyboard/`, and the previous episode's outro (it
   shows a glimpse of this one).
2. Voices: one WAV per script block into `02_Audio/Voice_WAVs/` (saved series voices, see
   `01_Series_Bible/AI_Studio_Voice_Design_Master.md`), normalised to -16 LUFS / -1.5 dBTP with lengths kept
   (voice-loudness skill).
3. Subtitles: `04_Video_Assembly/Subtitles_SRT/<Episode_folder>_bn.srt` (`scripts/generate_srt.py`). The gap between
   clips in the SRT must match the gap the timing build uses.
4. Shot list and pauses: write `EpNN_Shots_and_Pauses_DRAFT.md` (follow the narration literally, reuse known sets,
   camera grammar CAM-13, 2 or 3 pauses per scene CAM-14) and get the director's approval.
5. Timing: copy the voices to `remotion_studio/public/audio/epNN/` and write a generator modelled on
   `scripts/build_ep03_timing.js` (with its `PAUSES` table) to build `src/episodeNN/timing.ts` and `subtitles.ts`.
   Add the episode's story clock with `makeStoryClock` in `src/episode/storyClock.ts`.
6. Build the scenes in `src/episodeNN/` on the shared pieces (`src/episode/` cards, subtitles, source card;
   `src/cinematic/` rig, Hand, sets and divine toolkit) with parallel agents, one per file, from a shared brief file;
   register the composition in `src/Root.tsx`.
7. Review with stills, contact sheets and short clips; the director approves; only then render the full episode into
   `04_Video_Assembly/Final_Render/` and export the final SRT (`node scripts/export_ep02_srt.js <N>`).

## Status (2026-11-22)

| Ep | Folder | Length | Last render on disk | Pending |
|---|---|---|---|---|
| 1 | `Episode_01_Kali_Puja_Birth` | 9,705 frames, 6:44.5 | `Episode_01_Kali_Puja_Birth.mp4`, 2026-11-19 (9,705 frames) | Re-render for the shared rig fixes (hands, breathing, baby face) after the director approves stills. No `_bn_final.srt` yet. Other MP4s in `Final_Render` are older masters and style tests |
| 2 | `Episode_02_Shashthi_and_GoShaap` | 7,307 frames, 5:04.5 | `Episode_02_Shashthi_and_GoShaap.mp4`, 2026-11-22 final (7,307 frames, -16.7 LUFS), with `_bn_final.srt` | Optional re-render so its outro glimpse of Episode 3 shows the new Balak: paused at 2 of 4 chunks (`render_final_set3.sh`) |
| 3 | `Episode_03_Five_Year_Old_Wisdom` | 3,259 frames, 2:15.8 | `Episode_03_Five_Year_Old_Wisdom.mp4`, 2026-11-22 re-delivered (3,259 frames, -16.2 LUFS), with `_bn_final.srt` | None. Reference-plate Balak (BAL-26a), visible feet for the flowers, cinematic score (AUD-07) |
| 4 | `Episode_04_Idols_and_Coconut_Water` | 3,335 frames, 2:19.0 | `Episode_04_Idols_and_Coconut_Water.mp4`, 2026-11-22 re-delivered (3,335 frames, -16.3 LUFS), with `_bn_final.srt` | None. Reference-plate Balak (BAL-26b), cinematic score (AUD-07) |
| 5 | `Episode_05_Tortoise_and_Gentle_Cow` | 2,849 frames, 1:58.8 | `Episode_05_Tortoise_and_Gentle_Cow.mp4`, 2026-11-22 final (2,849 frames, -16.7 LUFS), with `_bn_final.srt` | None. STO-20/20a/20b, BAL-26, AUD-07 |
| 6 | `Episode_06_Rescuing_Brother_and_Playmates` | 2,978 frames, 2:04.1 | `Episode_06_Rescuing_Brother_and_Playmates.mp4`, 2026-11-23 final (2,978 frames, -16.4 LUFS), with `_bn_final.srt` | Immersive re-cut planned as the STO-22 pilot (`Ep06_Immersive_Recut_PLAN.md`, awaiting approval; about 2:17.6). STO-21, CHR-08/08a, AUD-07/08; the khadam is a clog recording stand-in (no free khadam recording exists) |
| 7 | `Episode_07_Labababus_Pathshala` | | None | Script stage |
| 8 | `Episode_08_Ananda_Master_and_Mothers_Heart` | | None | Script stage |
| 9 | `Episode_09_Gayali_Mandra_Haat` | | None | Script stage |
| 10 | `Episode_10_Fakir_of_Mainamati` | | None | Script stage |
| 11 | `Episode_11_Peacock_Boat_Dream` | | None | Script stage |
| 12 | `Episode_12_The_Same_Mantra` | | None | Script stage |
| 13 | `Episode_13_Shodashis_Healing_Dream` | | None | Script stage |
| 14 | `Episode_14_Barada_Chakrabortys_Vision` | | None | Script stage |
| 15 | `Episode_15_Nasiruddin_Haji` | | None | Script stage |
| 16 | `Episode_16_Sharadiya_Durga_Puja` | | None | Script stage |
| 17 | `Episode_17_Bijoya_Sinking_Boat` | | None | Script stage |
| 18 | `Episode_18_Vibhuti_in_Play_and_Prophecy` | | None | Script stage |
| 19 | `Episode_19_Truth_Against_Falsehood` | | None | Script stage (season finale) |

"Script stage" means script, manifest, SRT and draft voice WAVs, with no visuals or Remotion code yet. The voice WAVs
and `audio_durations.json` for Episodes 3 to 19 are not yet tracked in git, and Episodes 5 to 19 have empty
`03_Visuals` and `Final_Render` folders. All Remotion code for Episodes 1 to 4 is in the uncommitted worktree.

Update this table when an episode changes stage or is rendered.
