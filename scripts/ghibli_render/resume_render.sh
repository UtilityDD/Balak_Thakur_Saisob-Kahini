#!/bin/bash
# Versioned copy of chunks_ep4g/resume_render.sh (Ghibli Episode 4 final render, 2026-11-25/26). Paths are relative to chunks_ep4g/: copy this file into a chunks folder next to remotion_studio before running.
# Resume the Ghibli Episode 4 final render (paused 2026-11-25 ~09:45). Safe to re-run: chunks whose .mp4 exists are skipped.
# Two picture chunks at a time (3 + a soundtrack render crashed Chrome on 16 GB). Run from Git Bash:
#   bash /c/Dipankar/Balak_Thakur_Production/chunks_ep4g/resume_render.sh
set -u
cd "$(dirname "$0")"
B=../bundle_final_ep4g          # picture bundle (code as approved for render, includes the dhoti fix)
BA=../bundle_final_audio        # audio bundle (AUD-09 re-score)
R() { # name frames
  [ -s "$1.mp4" ] && { echo "skip $1"; return; }
  (cd ../remotion_studio && NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js render $B Episode04GhibliFull \
    ../chunks_ep4g/$1.mp4 --codec=h264 --crf=16 --concurrency=2 --gl=angle --timeout=120000 --muted --frames=$2 --log=error > ../chunks_ep4g/$1.log 2>&1) \
    && echo "$1 done $(date +%H:%M)" >> status.txt || { echo "$1 FAILED $(date +%H:%M)" >> status.txt; rm -f "$1.mp4"; }
}
R v00_intro 0-696
R v02_scene02 2880-3817 & R v04_scene04 5090-6399 & wait
R v01_scene01 697-2879 & R v03_scene03 3818-5089 & wait
R v06_shrine_outro 6400-8593
if [ ! -s audio_full.wav ]; then
  (cd ../remotion_studio && NODE_OPTIONS=--max-old-space-size=4096 node node_modules/@remotion/cli/remotion-cli.js render $BA Episode04GhibliFull \
    ../chunks_ep4g/audio_full.wav --codec=wav --gl=angle --timeout=120000 --concurrency=2 --log=error > ../chunks_ep4g/audio.log 2>&1) \
    && echo "audio done $(date +%H:%M)" >> status.txt || { echo "audio FAILED" >> status.txt; exit 1; }
fi
for c in v00_intro v01_scene01 v02_scene02 v03_scene03 v04_scene04 v06_shrine_outro; do [ -s $c.mp4 ] || { echo "missing $c: re-run this script"; exit 1; }; done
printf "file 'v00_intro.mp4'\nfile 'v01_scene01.mp4'\nfile 'v02_scene02.mp4'\nfile 'v03_scene03.mp4'\nfile 'v04_scene04.mp4'\nfile 'v06_shrine_outro.mp4'\n" > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy video_joined.mp4
ffmpeg -y -loglevel error -i video_joined.mp4 -i audio_full.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest Episode04GhibliFull.mp4
echo "muxed $(date +%H:%M)" >> status.txt
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 Episode04GhibliFull.mp4   # expect 8594
ffmpeg -hide_banner -nostats -i Episode04GhibliFull.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:"   # expect ~ -16 LUFS, peak < -1.5 dBTP
