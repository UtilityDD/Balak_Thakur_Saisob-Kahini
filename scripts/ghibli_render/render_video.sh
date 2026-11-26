#!/bin/bash
# Versioned copy of chunks_ep4g/render_video.sh (Ghibli Episode 4 final render, 2026-11-25/26). Paths are relative to chunks_ep4g/: copy this file into a chunks folder next to remotion_studio before running.
# Picture-only chunks of Episode04GhibliFull (sound is rendered separately and muxed). Usage: render_video.sh NAME A-B [NAME A-B ...]
cd "$(dirname "$0")/../remotion_studio"
run() {
  NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js render ../bundle_final_ep4g Episode04GhibliFull \
    ../chunks_ep4g/$1.mp4 --codec=h264 --crf=16 --concurrency=2 --timeout=120000 --muted --frames=$2 --log=error > ../chunks_ep4g/$1.log 2>&1 \
    && echo "$1 done $(date +%H:%M)" >> ../chunks_ep4g/status.txt || echo "$1 FAILED $(date +%H:%M)" >> ../chunks_ep4g/status.txt
}
while [ $# -ge 2 ]; do run "$1" "$2" & shift 2; done
wait
