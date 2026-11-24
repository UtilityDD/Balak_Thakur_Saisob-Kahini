# Mandatory Pre-Finalization QA Pipeline (Series 2: *Param Bismoy Balak Thakur*)

Every rendered scene or episode MP4 **must** pass `python scripts/qa_verify_episode.py <mp4_path> <audit_dir>` **and** a visual inspection of the extracted `qa_frame_*.png` keyframes **before** being reported as finalized.

## Automated Gates Enforced by `scripts/qa_verify_episode.py`
1. **Gate 1 — Master Stream Spec:**
   - Resolution must be `1920x1080`, frame rate must be `24/1` (`24.000 fps`), codec `H.264` + `AAC`.
2. **Gate 2 — JoyVASA Source Clip Sync & FPS Lock:**
   - Every JoyVASA neural clip (`*_24.mp4`) must be resampled and time-locked via `setpts=(TARGET_DUR/SRC_DUR)*PTS,fps=24` so its frame rate is `24/1` and its duration matches the master `48 kHz` voiceover WAV within `<= 0.10s` (eliminating `25 fps` drift).
   - Multi-angle cuts within a single dialogue block must mount their full-duration `*_24.mp4` inside a shared `<Sequence from={dialogueStartFrame}>` so cutting across wide, OTS close-up, tactile insert, and dual-character shots never offsets lip-sync.
3. **Gate 3 — Multi-Shot Keyframe Extraction & Visual Audit:**
   - Extracts keyframes across all shot cuts (`qa_frame_*.png`) and verifies non-black luminance plus visual checks for:
     - **Zero character continuity jumps** (consistent hair, tilak, facial hair, backrest/props across wide and close-up angles).
     - **Zero over-driven bulging eyes** (keep JoyVASA `--driving_multiplier` between `0.75` and `0.95`, `--cfg_scale` between `1.8` and `2.3`).
     - **Zero dual-character split seams** (composite multi-character shots in Python/NumPy at native plate resolution with an 80px cosine feather rather than CSS percentage boxes).
     - **Zero unblurred SVG smoke shapes** or frozen painted lightning bolts in non-flash frames.
     - **Clean TV-anime frame** (no burned-in subtitle text on the video; subtitles are delivered via separate `_bn.srt` files).
