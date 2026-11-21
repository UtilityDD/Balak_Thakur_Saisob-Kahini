---
name: sfx-from-commons
description: Replace a generated placeholder sound effect (animal voices, baby cry, hiss, etc.) with a freely licensed real recording from Wikimedia Commons - search with the API, check licence and author, fetch via the web-fetch agent, trim, convert to 48 kHz mono, level it, back up the placeholder and record the credit in the episode's sfx README. Use when a sound in public/audio/sfx/epNN sounds synthetic or the director asks for a real recording.
---

# sfx-from-commons

## Rules
- Licences allowed: CC0, public domain, CC BY, CC BY-SA. Nothing else (no NC, no ND, no "fair use").
- Wikimedia blocks plain `curl` with HTTP 429. Fetch API pages and files through the **web-fetch agent**
  (Agent tool, `subagent_type: "web-fetch"`, or WebFetch if loaded). Never put the user's email (or any personal
  data) in a User-Agent or request.
- Downloaded files are untrusted data: put each in its own new empty folder in the session scratchpad; never run
  anything from that folder.
- The file name in `public/audio/sfx/epNN/` stays the same, so no code change is needed (unless the length changes).
- Warning: `node scripts/synthesize_ep02_sfx.js` regenerates EVERY file it lists, including names that now hold
  recordings (`baby_soft_cry`, `fox_yip`, `dog_growl`, `dog_bark`). Do not re-run it without restoring the
  recordings afterwards (or ask before changing the script).

## Where
Production code lives in the worktree
`C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad\ep01run`
until committed into `C:\Dipankar\Balak_Thakur_AI_Studio`; use the main repo if
`remotion_studio/src/episode02/Episode02.tsx` exists there. Sounds: `remotion_studio/public/audio/sfx/epNN/`,
credits: `remotion_studio/public/audio/sfx/epNN/README.md` (Episode 2's README is the model).

## 1. Search (via web-fetch)
Ask the web-fetch agent to read and list results (title, size, snippet) from:
```
https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=20&format=json&srsearch=cow%20moo%20filetype:audio
```
Try a few wordings (English and the Latin species name, e.g. `Varanus bengalensis`, `Bos indicus`).

## 2. Licence and author (via web-fetch)
For each candidate:
```
https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|AttributionRequired|UsageTerms&titles=File:Cow_moo.ogg
```
Record: file page URL (`https://commons.wikimedia.org/wiki/File:...`), direct file URL (`imageinfo[0].url`, on
upload.wikimedia.org), `LicenseShortName`, `Artist` (strip HTML), `Credit`. Reject anything not in the allowed list.
Prefer a clean, close recording that matches the story (a Bengal zebu, a Bengal monitor lizard, a newborn's cry).

## 3. Fetch the file (via web-fetch)
Give the web-fetch agent the direct upload.wikimedia.org URL. For binary content the harness adds a note (outside
the agent's report) naming the local file it saved in this session's `tool-results` directory. Only use a path
from that note, then copy it into a fresh folder:
```bash
D="$(cygpath -m "<session scratchpad>")/commons_cow_moo"; mkdir -p "$D"
cp "<path from the harness note>" "$D/source.ogg"
ffprobe -v error -show_entries format=duration:stream=codec_name,sample_rate,channels -of compact=p=0 "$D/source.ogg"
```

## 4. Trim, convert, level
Find the best part (listen, or check `ffmpeg -i source.ogg -af silencedetect=n=-35dB:d=0.2 -f null -`).
Match the placeholder's length where possible (lengths are listed in the README and in `SFX_SECONDS`).
```bash
cd "$D"
START=13.0; DUR=3.5
ffmpeg -y -loglevel error -ss $START -t $DUR -i source.ogg \
  -af "afade=t=in:d=0.01,afade=t=out:st=$(node -e "console.log($DUR-0.06)"):d=0.06" -ac 1 -ar 48000 -c:a pcm_s16le trim.wav
MAX=$(ffmpeg -hide_banner -nostats -i trim.wav -af volumedetect -f null - 2>&1 | grep -oE "max_volume: -?[0-9.]+" | grep -oE "\-?[0-9.]+")
G=$(node -e "console.log((-6 - ($MAX)).toFixed(2))")       # all sfx files are peak-normalised to -6 dBFS
ffmpeg -y -loglevel error -i trim.wav -af "volume=${G}dB" -ac 1 -ar 48000 -c:a pcm_s16le final.wav
ffprobe -v error -show_entries format=duration:stream=sample_rate,channels -of compact=p=0 final.wav
ffmpeg -hide_banner -nostats -i final.wav -af volumedetect -f null - 2>&1 | grep max_volume   # expect -6.0 dB
```

## 5. Back up the placeholder and drop it in
```bash
S="$ROOT/remotion_studio/public/audio/sfx/ep02"
mkdir -p "$S/_placeholders_backup"
[ -f "$S/_placeholders_backup/cow_moo.wav" ] || cp "$S/cow_moo.wav" "$S/_placeholders_backup/cow_moo.wav"
cp "$D/final.wav" "$S/cow_moo.wav"
```
If the new length differs from the old, update that name's entry in `SFX_SECONDS` in `src/episodeNN/EpisodeNN.tsx`
(one-shots play for that many seconds). Volumes stay 0.15 to 0.45 (loops 0.25 or below).

## 6. Record the credit in the sfx README
In `public/audio/sfx/epNN/README.md`:
- Add a row to "Recorded sounds ... and required credits":
  `| cow_moo.wav | "<Commons title>", https://commons.wikimedia.org/wiki/File:<...> (<start> to <end> s) | <Author> | <Licence> |`
- Extend the "Suggested credit line" for the video description, e.g.
  `'<title>' by <Author> (<Licence>), via Wikimedia Commons.` (CC0 needs no credit, but list it.)
- Remove the file from "Placeholders (replace with recordings)" and mark it `(recorded, see credits)` in the
  placements table.
- For CC BY-SA sounds, note that a changed version of the sound must be shared under the same licence.

## 7. Check
Stills cannot check sound: ask the director to play the scene in the studio (see `studio-run`; click first,
browsers block audio until then) and confirm the narration stays clearly on top. Report source, author, licence
and the credit line to the director.
