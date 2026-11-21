---
name: render-episode
description: Render a full Balak Thakur episode (Episode01, Episode02, Episode03 ...) to MP4 - bundle once, render chunks of about 2,000 frames from the bundle (three at a time; several episodes can share one bundle), join with ffmpeg concat, verify frame count, duration, black runs, join frames and ebur128 loudness, re-export the final SRT, back up the previous cut outside the repo, copy into 03_Episodes/<Episode>/04_Video_Assembly/Final_Render/<Episode>.mp4 and log it in docs/decisions/CHANGELOG.md. Use ONLY after the director has seen and approved the still frames and explicitly asked for the final render.
---

# render-episode

## Gate (do not skip)
- The director approved the frames (`frame-qa`, `episode-polish-pass` step 5) and asked for the render. If not, stop.
- No agent is editing code (a render bundles the whole project; a half-saved file breaks it). Subagents never render.
- Type-check from `remotion_studio` and stop on errors (errors only in `src/param_bismoy_ep01`, the director's
  separate series, are ignored):
  `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`

## 1. Settings and bundle (once)
```bash
W="/c/Users/rouma/AppData/Local/Temp/claude/8d2a3455c490787c/d453e53b-1da9-42c9-8691-a833340f8cb5/scratchpad/ep01run"
cd "$W/remotion_studio"
CH="$(cygpath -m "<session scratchpad>")/render_final"; mkdir -p "$CH"
NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir="$CH/bundle" > "$CH/bundle_log.txt" 2>&1 || tail "$CH/bundle_log.txt"
total () { grep -oE "EP$1_TOTAL_FRAMES = [0-9]+" src/episode$1/timing.ts | grep -oE "[0-9]+$"; }
echo "Episode02 $(total 02)  Episode03 $(total 03)"     # Episode 1: EPISODE_01_TOTAL_FRAMES in src/data/episode01Data.ts
```
One bundle serves every composition in it, so two or more approved episodes can render from the same bundle.

## 2. Render chunks from the bundle, three at a time
```bash
JOBS=()                                            # "Comp start end index"
add () { local c=$1 t=$2 i=0; for ((s=0; s<t; s+=2000)); do e=$((s+1999)); [ $e -ge $((t-1)) ] && e=$((t-1)); JOBS+=("$c $s $e $i"); i=$((i+1)); done; }
add Episode02 $(total 02); add Episode03 $(total 03)
chunk () {  # chunk <Comp> <start> <end> <index>; two tries
  local out="$CH/$1_part_$(printf %02d $4).mp4"
  for t in 1 2; do
    NODE_OPTIONS=--max-old-space-size=8192 timeout 3600 node node_modules/@remotion/cli/remotion-cli.js render "$CH/bundle" "$1" "$out" \
      --codec=h264 --crf=16 --concurrency=2 --frames=$2-$3 > "$CH/log_$1_$4.txt" 2>&1 && { echo "OK $1 $4"; return 0; }
    echo "FAIL $1 $4 try $t"
  done; return 1
}
n=0; for j in "${JOBS[@]}"; do chunk $j & n=$((n+1)); [ $((n % 3)) -eq 0 ] && wait; done; wait
ls -la "$CH"/*_part_*.mp4
```
Run it as a background task (`run_in_background: true`). More than three chunks at once runs out of memory; a
crash shows as exit 139. A failed chunk: read its log, re-run only that `chunk` line.

## 3. Join (per episode)
```bash
COMP=Episode02; EP=Episode_02_Shashthi_and_GoShaap; TOTAL=$(total 02)
ls "$CH"/${COMP}_part_*.mp4 | sort | while read f; do echo "file '$f'"; done > "$CH/list_$COMP.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$CH/list_$COMP.txt" -c copy "$CH/$EP.mp4"; OUT="$CH/$EP.mp4"
```

## 4. Verify (all of these, every time)
```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$OUT"   # must equal $TOTAL
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"                                          # TOTAL/24 s (audio may add a few ms)
ffmpeg -hide_banner -i "$OUT" -vf "blackdetect=d=0.04:pix_th=0.05" -an -f null - 2>&1 | grep black_start      # black runs
ffmpeg -hide_banner -nostats -i "$OUT" -filter_complex ebur128=peak=true -f null - 2>&1 | tail -12             # loudness
for j in $(seq 2000 2000 $((TOTAL-1))); do for fr in $((j-1)) $j; do
  ffmpeg -y -loglevel error -i "$OUT" -vf "select=eq(n\,$fr)" -vsync 0 -frames:v 1 "$CH/join_${COMP}_$fr.png"; done; done
```
- Frame count equals `TOTAL`; duration equals `TOTAL / 24`.
- Black runs only at designed fades: the intro fade-in, chapter breaks (Episode 2 before `04_rice_pot_miracle`) and
  the outro's fade to dark at the end. Compare each `black_start` with scene starts in `timing.ts`; any black at a
  join time (2000/24 = 83.333 s, 166.667 s, ...) is a fault.
- Read the join frames (tile them into a sheet with `frame-qa` step 3): each pair must be continuous, no blank frame.
- Loudness: integrated about -16 to -17 LUFS (Episode 2 final: -16.7 LUFS) and true peak at or below -1.5 dBTP
  (Episode 2: -2.4). Far off means a voice or bed is wrong: stop and tell the director.
- Listen to a second around each join for a click or gap. If the audio gaps, re-join with `-c:v copy -c:a aac -b:a 192k`.

## 5. Final SRT
Re-export the as-rendered subtitles (pauses move every cue):
```bash
cd "$W" && node scripts/export_ep02_srt.js 2      # episode number; Episode 3: node scripts/export_ep02_srt.js 3
```
It writes `03_Episodes/<EP>/04_Video_Assembly/Subtitles_SRT/<EP>_bn_final.srt` in the main repo and prints the cue
count and the last cue time; the last cue must end before the episode length.

## 6. Deliver
```bash
DEST="/c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/$EP/04_Video_Assembly/Final_Render"; mkdir -p "$DEST"
[ -f "$DEST/$EP.mp4" ] && cp "$DEST/$EP.mp4" "$CH/${EP}_previous.mp4"     # back up the old cut OUTSIDE the repo
cp "$OUT" "$DEST/$EP.mp4" && ffprobe -v error -show_entries format=duration -of csv=p=0 "$DEST/$EP.mp4"
```

## 7. Log and report
- Add a dated entry to `docs/decisions/CHANGELOG.md` in the main repo, as the "Episode 2 final render delivered"
  entry does: path, frames, duration, codec/CRF, chunk count and join result, LUFS and peak, where the previous cut
  is kept, and the rule IDs the cut includes. (If another agent owns that file right now, give the text to the main
  session instead.)
- Report to the director: path, frames, duration, joins, loudness, SRT path. Do not commit unless asked.
