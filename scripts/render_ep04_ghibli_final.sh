#!/usr/bin/env bash
# Final publish render of Ghibli Episode 4 (composition Episode04GhibliFull, 8594 frames @ 24 fps).
# Pattern from render_final_set.sh: bundle once, render in chunks (a crash only costs one chunk), join losslessly,
# export the SRT, then print the QA checks (frames, duration, decode errors, black frames, loudness).
# All temp files stay on D: (TMP/TEMP point inside the output folder). Run from the worktree root:
#   bash scripts/render_ep04_ghibli_final.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/remotion_studio"
R="$ROOT/render_final_ep04_ghibli"
NAME="Episode_04_Idols_and_Coconut_Water_Ghibli"
COMP="Episode04GhibliFull"
TOTAL=8594
CHUNK=1440
mkdir -p "$R/tmp"
export TMP="$R/tmp" TEMP="$R/tmp" TMPDIR="$R/tmp"
B="$R/bundle"
rm -rf "$B" "$R"/${COMP}_part_*.mp4
for t in 1 2 3; do
  NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir="$B" > "$R/bundle_log.txt" 2>&1 && break
  echo "bundle try $t failed"; sleep 10
done
[ -f "$B/index.html" ] || { echo "BUNDLE FAILED (see $R/bundle_log.txt)"; exit 1; }
echo "bundled"

idx=0
for ((s = 0; s < TOTAL; s += CHUNK)); do
  e=$((s + CHUNK - 1)); [ $e -ge $TOTAL ] && e=$((TOTAL - 1))
  out="$R/${COMP}_part_$(printf %02d $idx).mp4"
  ok=0
  for try in 1 2; do
    NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js render "$B" "$COMP" "$out" \
      --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --frames="$s-$e" \
      > "$R/log_part_$idx.txt" 2>&1 && { ok=1; break; }
    echo "chunk $idx ($s-$e) failed (try $try)"
  done
  [ $ok -eq 1 ] || { echo "CHUNK $idx FAILED — see $R/log_part_$idx.txt"; exit 1; }
  echo "chunk $idx ($s-$e) OK"
  idx=$((idx + 1))
done

ls "$R"/${COMP}_part_??.mp4 | sort | while read f; do echo "file '$(cygpath -m "$f" 2>/dev/null || echo "$f")'"; done > "$R/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$R/list.txt" -c copy -movflags +faststart "$R/$NAME.mp4"
node "$ROOT/scripts/export_ghibli_srt.js" 4 "$R/${NAME}_bn.srt"

o="$R/$NAME.mp4"
echo "== $NAME.mp4"
echo "streams: $(ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of compact=p=0 "$o" | tr '\n' ' ')"
echo "frames: $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$o" 2>/dev/null) (expected $TOTAL)"
echo "duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$o")"
echo "decode errors: $(ffmpeg -v error -i "$o" -f null - 2>&1 | wc -l)"
echo "black: $(ffmpeg -hide_banner -i "$o" -vf blackdetect=d=0.04:pix_th=0.05 -an -f null - 2>&1 | grep -o 'black_start:[0-9.]* black_end:[0-9.]*' | tr '\n' ' ')"
echo "loudness: $(ffmpeg -hide_banner -nostats -i "$o" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E 'I:|LRA:|Peak:' | tr -s ' ' | tr '\n' ' ')"
rm -rf "$R/tmp" "$B"
echo "ALL DONE -> $R"
