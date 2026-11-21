---
name: voice-loudness
description: Measure and normalise every voice clip (narration and character speech) of a Balak Thakur episode to -16 LUFS integrated with a -1.5 dBTP true-peak ceiling using two-pass ffmpeg loudnorm (linear), backing up originals to _original_levels and verifying levels and unchanged lengths. Use when new voice WAVs arrive for an episode, when voices sound uneven, or before an episode's final render.
---

# voice-loudness

## Target (director's rule)
-16 LUFS integrated, -1.5 dBTP true-peak ceiling, two-pass `loudnorm` with `linear=true`, 48 kHz mono 16-bit
output, clip lengths identical to the originals, originals kept in `_original_levels/`.
Do NOT use `scripts/normalize_audio.py` for this: it runs `silenceremove`, which changes clip lengths and breaks
the timing.

## Where
The clips the composition plays are `remotion_studio/public/audio/epNN/*.wav` (copied from
`03_Episodes/<Episode>/02_Audio/Voice_WAVs/`, plus `00a_Source_Attribution.wav`). Normalise those copies; leave the
episode's source `Voice_WAVs` as delivered. Production code lives in the worktree
`C:\Dipankar\Balak_Thakur_Production`
until it is committed into `C:\Dipankar\Balak_Thakur_AI_Studio`; use the main repo if
`remotion_studio/src/episode02/Episode02.tsx` exists there.

## 1. Measure first (report before changing)
```bash
cd "$ROOT/remotion_studio/public/audio/ep03"
for f in *.wav; do
  printf "%-32s " "$f"
  ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' ' | tr '\n' ' '
  echo
done
```

## 2. Back up and normalise (two-pass, always from the backup)
```bash
cd "$ROOT/remotion_studio/public/audio/ep03"
mkdir -p _original_levels
jget () { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s)['$1']))"; }
for f in *.wav; do
  [ -f "_original_levels/$f" ] || cp "$f" "_original_levels/$f"     # never overwrite an existing backup
  src="_original_levels/$f"
  J=$(ffmpeg -hide_banner -nostats -i "$src" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  MI=$(echo "$J" | jget input_i); MTP=$(echo "$J" | jget input_tp); MLRA=$(echo "$J" | jget input_lra)
  MTH=$(echo "$J" | jget input_thresh); OFF=$(echo "$J" | jget target_offset)
  R=$(ffmpeg -hide_banner -nostats -y -i "$src" \
      -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true:print_format=json" \
      -ar 48000 -ac 1 -c:a pcm_s16le "$f" 2>&1 | sed -n '/^{/,/^}/p')
  echo "$f  in $MI LUFS / $MTP dBTP  -> $(echo "$R" | jget normalization_type)"
done
```
- Re-running is safe: it always starts from `_original_levels/`.
- `-ar 48000` is required (loudnorm works at 192 kHz internally); the originals are often 24 kHz.
- If a clip reports `dynamic`, ffmpeg could not reach -16 LUFS with a pure gain change without breaking the
  -1.5 dBTP ceiling, so it fell back to dynamic mode for that clip. The approved Episode 2 voices measure -16.0 to
  -16.1 LUFS with -1.5 dBTP the same way. List those clips in the report; do not add other processing.

## 3. Verify
```bash
for f in *.wav; do
  a=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "_original_levels/$f")
  b=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  lv=$(ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' ' | tr '\n' ' ')
  echo "$f  len $a -> $b  $lv"
done
```
Pass: every clip I = -16 LUFS (+/- 0.5), true peak at or below -1.5 dBFS, and each length equal to its original
(to the millisecond). If a length changed, restore that clip from `_original_levels/` and investigate; the frame
counts in `timing.ts` depend on these lengths.

## 4. Afterwards
- Listen to one narration and one character clip in the studio (click first; browsers block audio until then).
- Sound effects stay quieter than the voice: volumes 0.15 to 0.45, loops 0.25 or below (set in `EpisodeNN.tsx`).
- Report the before/after table to the director. Do not commit unless asked.
