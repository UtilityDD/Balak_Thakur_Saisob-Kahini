#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Generic Chunked Ghibli Episode Renderer (`scripts/ghibli_pipeline/render_ghibli_episode.sh`)
#
# Renders ANY registered Ghibli composition in memory-safe chunks (safe on 16 GB RAM),
# concatenates them losslessly with ffmpeg, verifies frame count & duration with ffprobe,
# and extracts 4 join-boundary verification PNGs.
#
# Usage:
#   bash scripts/ghibli_pipeline/render_ghibli_episode.sh \
#     [COMPOSITION_ID] [TOTAL_FRAMES] [OUTPUT_MP4_PATH] [NUM_CHUNKS]
#
# Defaults (Episode 3):
#   COMPOSITION_ID = Episode03GhibliTest
#   TOTAL_FRAMES   = 3259
#   OUTPUT_MP4     = /c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/Episode_03_Five_Year_Old_Wisdom/04_Video_Assembly/Ghibli_Test_Render/Episode_03_Ghibli_Sketch_Test.mp4
#   NUM_CHUNKS     = 4
# =============================================================================

COMP_ID="${1:-Episode03GhibliTest}"
TOTAL_FRAMES="${2:-3259}"
OUT_MP4="${3:-/c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/Episode_03_Five_Year_Old_Wisdom/04_Video_Assembly/Ghibli_Test_Render/Episode_03_Ghibli_Sketch_Test.mp4}"
NUM_CHUNKS="${4:-4}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STUDIO_DIR="$PROD_ROOT/remotion_studio"
BUNDLE_DIR="$PROD_ROOT/bundle_ghibli_${COMP_ID}"
CHUNK_DIR="$PROD_ROOT/chunks_${COMP_ID}"
OUT_DIR="$(dirname "$OUT_MP4")"

mkdir -p "$OUT_DIR" "$CHUNK_DIR"
cd "$STUDIO_DIR"

export NODE_OPTIONS="--max-old-space-size=6144"

echo "=== [1/4] Bundlingsrc/ghibli_pipeline/entry.tsx -> $BUNDLE_DIR ==="
node node_modules/@remotion/cli/remotion-cli.js bundle \
  src/ghibli_pipeline/entry.tsx \
  --out-dir "$BUNDLE_DIR"

CHUNK_SIZE=$(( (TOTAL_FRAMES + NUM_CHUNKS - 1) / NUM_CHUNKS ))
> "$CHUNK_DIR/list.txt"

for (( i=0; i<NUM_CHUNKS; i++ )); do
  START=$(( i * CHUNK_SIZE ))
  END=$(( (i + 1) * CHUNK_SIZE - 1 ))
  if (( END >= TOTAL_FRAMES )); then
    END=$(( TOTAL_FRAMES - 1 ))
  fi
  if (( START > END )); then
    break
  fi
  PART_FILE=$(printf "part_%02d.mp4" "$i")
  echo "=== [2/4] Rendering Chunk $((i+1))/$NUM_CHUNKS ($COMP_ID frames $START..$END) ==="
  node node_modules/@remotion/cli/remotion-cli.js render \
    "$BUNDLE_DIR" "$COMP_ID" \
    "$CHUNK_DIR/$PART_FILE" \
    --codec=h264 --crf=16 --concurrency=1 --gl=angle --frames="${START}-${END}"
  echo "file '$PART_FILE'" >> "$CHUNK_DIR/list.txt"
done

echo "=== [3/4] Concatenating $NUM_CHUNKS chunks into $OUT_MP4 ==="
ffmpeg -y -f concat -safe 0 -i "$CHUNK_DIR/list.txt" -c copy "$OUT_MP4"

echo "=== [4/4] Verifying final MP4 with ffprobe & join-boundary frame check ==="
ffprobe -v error -show_entries format=duration,size -show_entries stream=nb_frames,r_frame_rate,width,height -of default=noprint_wrappers=1 "$OUT_MP4"
MID_SEC=$(awk "BEGIN { printf \"%.2f\", ($CHUNK_SIZE / 24.0) - 0.08 }")
ffmpeg -y -ss "$MID_SEC" -i "$OUT_MP4" -frames:v 4 "$CHUNK_DIR/join_check_%02d.png"

echo "=== Render Complete: $OUT_MP4 ==="
