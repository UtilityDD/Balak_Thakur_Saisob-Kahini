#!/usr/bin/env bash
set -euo pipefail

# Wrapper for Episode 3 Ghibli Sketch Test full render (3,259 frames, 24 fps, 1920x1080).
# Delegates to the generic multi-episode render_ghibli_episode.sh pipeline.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/render_ghibli_episode.sh" \
  "Episode03GhibliTest" \
  3259 \
  "/c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/Episode_03_Five_Year_Old_Wisdom/04_Video_Assembly/Ghibli_Test_Render/Episode_03_Ghibli_Sketch_Test.mp4" \
  4
