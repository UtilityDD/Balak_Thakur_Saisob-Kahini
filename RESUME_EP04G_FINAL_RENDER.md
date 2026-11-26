# DONE 2026-11-26 05:57: Episode04GhibliFull_2026-11-26.mp4 + _bn.srt are in the main repo's Ghibli_Test_Render folder. Remaining: refresh _backups/ audio.

# Resume: Ghibli Episode 4 final render (paused 2026-11-25 ~09:45 at the director's request)

The director approved the final render of `Episode04GhibliFull` (8,594 frames, 24 fps) on 2026-11-25 and paused it to
resume later today. All code work for this pass is finished, verified and type-checked; only the render remains.

## State
- Done: `chunks_ep4g/v00_intro.mp4` (frames 0-696, picture only).
- To do: picture chunks v02 (2880-3817), v04 (5090-6399), v01 (697-2879), v03 (3818-5089), v06 (6400-8593); the
  soundtrack `audio_full.wav`; join; mux; checks. Partial chunks from the paused run were deleted.
- Bundles to use (do NOT re-bundle unless code changes): `bundle_final_ep4g` (picture, made 08:54, includes the dhoti
  fix in StandingChild saved 08:29) and `bundle_final_audio` (soundtrack, AUD-09 re-score). If any code changed since,
  re-bundle both and re-render every chunk.

## Paused again 2026-11-25 evening (director: "pause halfway for tomorrow")
The run resumed at 19:04 was set to stop after the chunks then rendering (v02 2880-3817, v04 5090-6399). Text files
`v01_scene01.mp4`, `v03_scene03.mp4`, `v06_shrine_outro.mp4` in `chunks_ep4g/` are PLACEHOLDERS that made the script
skip those chunks. The soundtrack `audio_full.wav` may have rendered after the pair. Before resuming: delete the three
placeholders (check each is a ~70-byte text file, not a real video) and any `video_joined.mp4` / `Episode04GhibliFull.mp4`
made from them, then check `status.txt` for which chunks are `done`.

## Evening state (20:41)
- Done and good: `v00_intro.mp4` (0-696), `v02_scene02.mp4` (2880-3817, 64 MB, finished 19:42).
- Claude Code stopped the resume script at ~20:40 because the machine ran critically low on memory (other apps open).
  The Scene 04 chunk (5090-6399) render process may have kept running on its own. Before trusting `v04_scene04.mp4`,
  check it: `ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 v04_scene04.mp4`
  must print 1310; otherwise delete it and let the script re-render it.

## GPU switch (22:20, decision REN-GPU-01) — read this first
Renders now use the GPU (`--gl=angle`, concurrency 2): about 18x faster (heaviest frames 33 s per 40 frames vs >608 s).
`resume_render.sh` already passes it. The two software-rendered chunks were moved to `_software_render_2026-11-25/` so
the whole episode is rendered one way: the script re-renders ALL chunks. Expected total: about 45-75 minutes.
The director chose to run it tomorrow (2026-11-26). Close big apps first (Cursor, Brave, Steam, games).

## How to resume
1. Close the studio browser tab if possible (frees memory). Check free RAM is ~6 GB or more.
2. Run `bash /c/Dipankar/Balak_Thakur_Production/chunks_ep4g/resume_render.sh` (Git Bash; ~2-2.5 h). It skips finished
   chunks, renders two picture chunks at a time (three at once + audio crashed Chrome at 09:05), then the
   soundtrack, joins, muxes to `chunks_ep4g/Episode04GhibliFull.mp4` and prints frame count (expect 8594) and loudness.
3. Check joins and blank frames (render-episode skill), export the final SRT with
   `node scripts/export_ghibli_srt.js` (see its header), and copy the MP4 + SRT to
   `03_Episodes/Episode_04_Idols_and_Coconut_Water/04_Video_Assembly/Ghibli_Test_Render/` in the main repo
   (NOT `Final_Render`: the delivered SVG Episode 4 stays there). Log it in `docs/decisions/CHANGELOG.md`.
4. Refresh the `_backups/` audio backup (new `public/audio/sfx/ghibli_life/` and `ep04_ghibli/`).

## What this pass contains (decisions BAL-26f + amendment, AUD-09, STO-22b, CHR-09, TTL-14)
New Balak look (opt-in `plateLook="ref2"`, Ep4 only; Eps 3/5/6 pixel-identical), thin warm-brown face line, head-only
halo; gestures in all six scenes; new pond ghat, living water, ducks, kingfisher; life sounds; re-score with the
ep05 instrument library at TV balance (~-22 LUFS wordless, ~-16 dialogue).

## Open notes for the director's next review (not blockers)
Veranda pillar/roof beams at 5760-5815 look flat (not watercolour); Balak's forearms read as straight bars when holding
the Gobinda out; standing chadar over the arms still a little sleeve-like; Charu's new palms-joined moment in Scene 04
needs approval; kingfisher dive small in frame; soft spot effects (moth, cow bell) partly masked by the louder music.
Nothing is committed yet (commit only when the director asks).
