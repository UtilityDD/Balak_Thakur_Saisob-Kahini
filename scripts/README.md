# scripts

Production scripts for the Balak Thakur series. Run them from the worktree (or repo) root. Node scripts need
Node 18+ and no packages; Python needs 3.10+ (`normalize_audio.py` also NumPy, `synthesize_audio.py` NumPy and
SciPy). `ffmpeg` and `ffprobe` must be on PATH.

The timing builders read inputs from `REPO_ROOT` (default `C:/Dipankar/Balak_Thakur_AI_Studio`) but write into the
`remotion_studio/` beside the script, so run the copy next to the studio you mean to update.

## Where to look

| Script | What it does |
|---|---|
| `build_ep02_timing.js` | Episode 2 timing (below). |
| `build_ep03_timing.js` | Episode 3 timing (below). |
| `export_ep02_srt.js` | Final as-rendered SRT for any episode. |
| `render_locked.sh` | One Remotion still or render at a time, with a lock and a time limit. |
| `normalize_audio.py` | Voice loudness to -16 LUFS / -1.5 dBTP, plus lip-sync envelopes. |
| `synthesize_ep02_sfx.js`, `synthesize_sfx.js`, `synthesize_divine_motif.js` | Procedural SFX and the divine motif. |
| `generate_srt.py`, `cartesia_tts.py`, `validate_studio.py` | SRT from the voice script, Cartesia TTS, bible and manifest checks. |
| `synthesize_audio.py`, `render_25d_scene.py`, `assemble_episode.py` | The older FFmpeg/PNG pipeline (kept for reference; the studio's `music/` and `ambient/` came from `synthesize_audio.py`). |
| `../render_chunks.sh` (worktree root) | Episode 1 example of the chunked full render. Its `TOTAL=9246` is stale (Episode 1 is 9705 frames) and its output name is a rerun file. |

## `build_ep02_timing.js`

`node scripts/build_ep02_timing.js`. Reads from `03_Episodes/Episode_02_Shashthi_and_GoShaap/`:
`01_Script_and_Storyboard/scenes_manifest.json` (clip order), `02_Audio/Voice_WAVs/audio_durations.json`,
`04_Video_Assembly/Subtitles_SRT/Episode_02_Shashthi_and_GoShaap_bn.srt` (one cue per clip; stops if the counts
differ or a cue and clip differ by more than 0.3 s), and the length of `02_Shared_Assets/Templates/00a_Source_Attribution.wav`.
The source card goes in 0.3 s after the title line; everything later shifts by its length + 0.5 s. Captions are
phrases of up to 36 characters timed by character share; the speaker comes from the file name.

Config tables at the top of the file:

- `BREATHS`: hold after a scene's narration before the next scene (`{ after, sec }`) → `EP02_BREATHS`.
- `PAUSES`: holds inside scenes (rule CAM-14, the 23-pause table): `{ scene, after: "<phrase snippet>", sec }`,
  `at: "open"` or `at: "end"`, optional `clip` + `silence` override. The voice is cut at the nearest sentence silence
  (silencedetect -45 dB / 0.12 s, within 0.5 s of the phrase end, else it stops and lists the silences); each cut
  is level-checked. → `EP02_PAUSES`.
- `INSERTS`: scenes not in the manifest. `01d2_shashthi_hands_miracle` (`before` 01e, its three clips and text)
  and `02a0_journey_to_ujanchar` (`after` 01e, 11 s, `dissolveIn`/`dissolveOut` 40) → `EP02_DISSOLVES`.
- `SPLITS`: clips cut at a scene boundary (`01a_Narrator` at 01c, `01b_Narrator_Rain` at 01e, `02a_Narrator_Fox`
  at the fox).

Outputs: `remotion_studio/src/episode02/timing.ts` (`EP02_SCENES`, `EP02_TOTAL_FRAMES`, `EP02_BREATHS`,
`EP02_AUDIO`, `EP02_CLIP_PARTS`, `EP02_PAUSES`, `EP02_DISSOLVES`) and `subtitles.ts` (`EP02_CUES`), plus the cut
parts `NAME_p1.wav .. NAME_pN.wav` written beside the originals in `remotion_studio/public/audio/ep02/` (originals
never written; stale parts deleted). Generated files are never edited by hand.

## `build_ep03_timing.js`

`node scripts/build_ep03_timing.js`. Same inputs and cutting for Episode 3, one visual scene per manifest scene
(1 s tail), the 12-pause `PAUSES` table (STO-17), no pauses in `NO_PAUSE_SCENES` (outro and 98). It appends the
168-frame `98_next_episode` row itself. `02b_Girls_Tease.wav` is captioned চারুশীলা (`SPEAKER_BY_FILE`). Outputs
`src/episode03/timing.ts` (`EP03_SCENES`, `EP03_TOTAL_FRAMES`, `EP03_AUDIO`, `EP03_CLIP_PARTS`, `EP03_PAUSES`),
`subtitles.ts`, and cut parts in `public/audio/ep03/`. Check mode: `NO_PAUSES=1 OUT_DIR=<dir>` writes a pause-free
timing to `<dir>` without cutting.

## `export_ep02_srt.js`

`node scripts/export_ep02_srt.js [episodeNumber=2] [outPath]` (e.g. `3` for Episode 3). Reads that episode's
`subtitles.ts` and `timing.ts`, drops the intro cues (as `EpisodeNN.tsx` does), prefixes character lines
("ঠাকুরমা: ..."), checks order, overlaps and length, and writes
`03_Episodes/Episode_NN_*/04_Video_Assembly/Subtitles_SRT/<folder>_bn_final.srt` (UTF-8, CRLF).

## `render_locked.sh`

From `remotion_studio`: `bash ../scripts/render_locked.sh still Episode02 ../out/f_1200.png --frame=1200` (or
`render ... --frames=a-b --codec=h264`). Serialises renders across agents (about 16 GB RAM) with the lock directory
`.render.lock` in the worktree root: waits up to 30 min, breaks a lock older than 15 min, always releases it. Time
limits: stills 240 s, renders 720 s (exit 124 = timed out, retry). Uses `--max-old-space-size=6144`.

## `normalize_audio.py`

Series rule: **-16 LUFS integrated, -1.5 dBTP true peak**, two-pass ffmpeg loudnorm in linear mode, 48 kHz mono
16-bit, clip lengths unchanged, originals backed up to `_original_levels/` (never overwritten; every pass reads
from the backup, so re-runs are safe). Also writes `audio_durations.json` (duration + 24 fps RMS envelope for lip
sync).

```sh
python scripts/normalize_audio.py --episode Episode_03_Five_Year_Old_Wisdom        # -> Voice_WAVs/Normalized_48k/
python scripts/normalize_audio.py --dir remotion_studio/public/audio/ep03 --in-place
python scripts/normalize_audio.py --dir remotion_studio/public/audio/ep03 --dry-run  # measure only, write nothing
```

The timing builders cut `NAME_pK.wav` parts from the originals in `public/audio/epNN/`, so if you re-level an
original there, rebuild that episode's timing so its parts match.

## Sound synthesis

- `synthesize_ep02_sfx.js [--force-placeholders]`: Episode 2 SFX into `public/audio/sfx/ep02/` (48 kHz mono,
  -6 dBFS peak, seamless loops). It keeps the recordings in its `RECORDED` set (`dog_bark`, `dog_growl`,
  `fox_yip`, `baby_soft_cry`) unless forced. **`saap_hiss` is now a recording but is not in that set**, so a run
  overwrites it (`sfx/ep02/_placeholders_backup/` holds the old placeholders, not the recordings: back the
  recording up first). Replace a placeholder by dropping a recording in under the same name and crediting it in the folder's
  README.
- `synthesize_sfx.js`: Episode 1 SFX (`padma_river_day`, `cracker_burst`, `sparkler_crackle`,
  `distant_ship_horn`) into `public/audio/sfx/`.
- `synthesize_divine_motif.js [out.wav]`: Balak's divine motif, default `public/audio/music/Divine_Motif.wav`.
