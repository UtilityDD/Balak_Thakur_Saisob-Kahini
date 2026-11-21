#!/usr/bin/env bash
# Render Episodes 2, 3 and 4 one after another from one bundle (16 GB machine: never more than two chunks at once),
# then join each and print the checks. Run from the worktree root: bash render_final_set.sh
set -u
cd "$(dirname "$0")/remotion_studio"
R="$(cd .. && pwd)/render_final_2026-11-22"
rm -rf "$R" && mkdir -p "$R"
B="$R/bundle"
for t in 1 2 3; do
  NODE_OPTIONS=--max-old-space-size=4096 node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir="$B" > "$R/bundle_log.txt" 2>&1 && break
  echo "bundle try $t failed"; sleep 20
done
[ -f "$B/index.html" ] || { echo "BUNDLE FAILED"; exit 1; }
echo "bundled"

rc () { # rc <Comp> <idx> <start> <end>
  local comp=$1 idx=$2 s=$3 e=$4 out="$R/${1}_part_$(printf %02d $2).mp4"
  for try in 1 2; do
    NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js render "$B" "$comp" "$out" \
      --codec=h264 --crf=16 --concurrency=2 --frames="$s-$e" > "$R/log_${comp}_$idx.txt" 2>&1 && { echo "$comp chunk $idx OK"; return 0; }
    echo "$comp chunk $idx failed (try $try)"
  done
  return 1
}
join_check () { # join_check <Comp> <OutName>
  local comp=$1 name=$2
  # ffmpeg on Windows cannot read /c/... paths: write Windows-style (C:/...) paths into the concat list
  ls "$R"/${comp}_part_??.mp4 | sort | while read f; do echo "file '$(cygpath -m "$f")'"; done > "$R/list_$comp.txt"
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$R/list_$comp.txt" -c copy "$R/$name.mp4"
  local o="$R/$name.mp4"
  echo "== $name"
  echo "frames: $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$o" 2>/dev/null)"
  echo "duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$o")"
  echo "decode errors: $(ffmpeg -v error -i "$o" -f null - 2>&1 | wc -l)"
  echo "black: $(ffmpeg -hide_banner -i "$o" -vf blackdetect=d=0.04:pix_th=0.05 -an -f null - 2>&1 | grep -o 'black_start:[0-9.]* black_end:[0-9.]*' | tr '\n' ' ')"
  echo "loudness: $(ffmpeg -hide_banner -nostats -i "$o" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E 'I:|Peak:' | tr -s ' ' | tr '\n' ' ')"
}

rc Episode02 0 0 1999; rc Episode02 1 2000 3999; rc Episode02 2 4000 5999; rc Episode02 3 6000 7306
join_check Episode02 Episode_02_Shashthi_and_GoShaap
rc Episode03 0 0 1629; rc Episode03 1 1630 3258
join_check Episode03 Episode_03_Five_Year_Old_Wisdom
rc Episode04 0 0 1667; rc Episode04 1 1668 3334
join_check Episode04 Episode_04_Idols_and_Coconut_Water
echo "ALL DONE"
