#!/bin/bash
# Versioned copy of chunks_ep4g/render_pieces.sh (Ghibli Episode 4 final render, 2026-11-25/26). Paths are relative to chunks_ep4g/: copy this file into a chunks folder next to remotion_studio before running.
# GPU pieces of ~320 frames, one at a time (long GPU chunks crash Chrome on the pond/shrine scenes). Re-runnable.
cd "$(dirname "$0")"
piece() { # chunk a b
  local out="pieces/$1__$2-$3.mp4"
  [ -s "$out" ] && return 0
  for try in 1 2; do
    (cd ../remotion_studio && NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js render ../bundle_final_ep4g Episode04GhibliFull \
      ../chunks_ep4g/$out --codec=h264 --crf=16 --concurrency=2 --gl=angle --timeout=120000 --muted --frames=$2-$3 --log=error > ../chunks_ep4g/pieces/$1__$2-$3.log 2>&1) \
      && { echo "piece $1 $2-$3 done $(date +%H:%M)" >> status.txt; return 0; }
    rm -f "$out"; echo "piece $1 $2-$3 try $try FAILED $(date +%H:%M)" >> status.txt
  done
  return 1
}
chunk() { # name a b
  local name=$1 a=$2 b=$3 ok=1; [ -s "$name.mp4" ] && return 0
  : > pieces/$name.txt
  for ((s=a; s<=b; s+=320)); do e=$((s+319)); [ $e -gt $b ] && e=$b
    piece $name $s $e || ok=0; echo "file '${name}__${s}-${e}.mp4'" >> pieces/$name.txt; done
  [ $ok = 1 ] && (cd pieces && ffmpeg -y -loglevel error -f concat -safe 0 -i $name.txt -c copy ../$name.mp4) && echo "$name assembled $(date +%H:%M)" >> status.txt
}
until ! powershell -NoProfile -Command "if (Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -match 'audio_full' }) { exit 0 } else { exit 1 }"; do sleep 10; done
chunk v02_scene02 2880 3817
chunk v03_scene03 3818 5089
chunk v04_scene04 5090 6399
chunk v06_shrine_outro 6400 8593
bash resume_render.sh
