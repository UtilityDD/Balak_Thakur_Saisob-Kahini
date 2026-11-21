---
name: frame-qa
description: Render still frames of a Remotion composition (Episode01, Episode02, Episode03, QA sheets such as HandQA, HeadQA, ToddlerQA) with the bundle-once method (about 4 s per still), build ffmpeg contact sheets and large face and hand crops, check pause frames, lip sync on consecutive frames, baby faces against the newborn reference and outline-free hands, and review them against docs/QA_CHECKLIST.md. Use to verify any visual change before saying it is done, to audit a scene or episode, or when the director asks to "check", "show" or "review" frames. Never claim a fix without having looked at the frame.
---

# frame-qa

## Rules
- Every visual change is verified by rendering stills and LOOKING at them (Read the PNG) before reporting it done.
  Never claim a fix from reading code alone.
- QA review agents only report (frame number, what is wrong, which rule); they never edit code.
- Stills and short clips only. A full episode render needs the director's approval (`render-episode`).
- PNGs go in a scratchpad folder or a `check_*` folder in the worktree root, never in `src/`, `public/` or `03_Episodes/`.

## Where to run
Production code is in the worktree
`C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad\ep01run`
(branch `feat/ep01-polish-and-rules`) until it is committed into `C:\Dipankar\Balak_Thakur_AI_Studio`; use the main
repo if `remotion_studio/src/episode02/Episode02.tsx` exists there. Run from `<root>/remotion_studio` in Git Bash.

## 1. Bundle once, then render stills from the bundle (REN-BUNDLE-01)
A plain `remotion still src/index.ts ...` re-bundles the whole project every time (about 50 s). Bundle once and
render from the bundle (about 4 s per still). Re-bundle after ANY code change, or you are looking at old code.
```bash
W="/c/Users/rouma/AppData/Local/Temp/claude/8d2a3455c490787c/d453e53b-1da9-42c9-8691-a833340f8cb5/scratchpad/ep01run"
cd "$W/remotion_studio"
B=../bundle_qa; QA=../check_ep3_s02; mkdir -p "$QA"
NODE_OPTIONS=--max-old-space-size=6144 node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=$B > $QA/bundle_log.txt 2>&1 || tail $QA/bundle_log.txt
still () {  # still <Comp> <frame> [name]; retries a Chromium crash (exit 139) up to 3 times
  for t in 1 2 3; do
    node node_modules/@remotion/cli/remotion-cli.js still $B "$1" "$QA/${3:-f_$2}.png" --frame="$2" --log=error && return 0
  done; echo "FAILED $1 $2"
}
for fr in 1200 1260 1320 1380; do still Episode03 $fr; done
```
- Run 2 to 3 such loops in parallel at most (the machine has about 16 GB). If other agents are rendering, go through
  the lock instead: `bash ../scripts/render_locked.sh still Episode03 ../check_x/f_1200.png --frame=1200` (slow:
  it re-bundles; it times out after 4 min).
- Short clip (for lip sync, motion, pauses): `bash ../scripts/render_locked.sh render Episode03 ../check_x/clip.mp4 --frames=1200-1260 --codec=h264`
  (12 min limit), or from the bundle: `node node_modules/@remotion/cli/remotion-cli.js render $B Episode03 $QA/clip.mp4 --frames=1200-1260 --codec=h264 --concurrency=2`.
- If `tsc` shows errors only in `src/param_bismoy_ep01` (the director's separate series), ignore them; any other
  compile error breaks the bundle for everyone.

## 2. Pick frames
- Scene starts and lengths: `src/episodeNN/timing.ts` (`EPNN_SCENES`), pauses: `EPNN_PAUSES` (`startFrame`, `frames`),
  dissolves: `EP02_DISSOLVES`; cues: `src/episodeNN/subtitles.ts`. Episode 1: `src/data/episode01Data.ts`.
- Cover: each scene's start, key beats, middle and end; every line cue the camera keys on (the move should start on
  the line, CAM-13); every pause (its first, middle and last frame); dissolve midpoints; frames each side of a join.
- Quick list of pause frames:
  `node -e "const t=require('fs').readFileSync('src/episode03/timing.ts','utf8');for(const m of t.matchAll(/sceneId: \"([^\"]+)\", atStory: (\d+), frames: (\d+), startFrame: (\d+)/g))console.log(m[1],'pause',m[4],'-',+m[4]+ +m[3]-1)"`
  (if it prints nothing, read `EPNN_PAUSES` in `timing.ts` by eye; the field order may differ.)

## 3. Contact sheet (ffmpeg xstack)
Six frames, 3 x 2 at 640 x 360:
```bash
cd "$QA"
ffmpeg -y -loglevel error -i f_1200.png -i f_1260.png -i f_1320.png -i f_1380.png -i f_1440.png -i f_1500.png \
  -filter_complex "[0]scale=640:360[a];[1]scale=640:360[b];[2]scale=640:360[c];[3]scale=640:360[d];[4]scale=640:360[e];[5]scale=640:360[f];[a][b][c][d][e][f]xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0" sheet.png
```
4 frames: `layout=0_0|w0_0|0_h0|w0_h0`. Give the frame list cell by cell with the sheet.

## 4. Large face and hand crops
Faces and hands cannot be judged on a sheet. Crop at full resolution and scale up 3x:
```bash
ffmpeg -y -loglevel error -i f_1320.png -vf "crop=320:240:820:260,scale=960:720:flags=lanczos" crop_1320_face.png
ffmpeg -y -loglevel error -i f_1320.png -vf "crop=240:180:900:600,scale=960:720:flags=lanczos" crop_1320_hand.png
```
Find the x/y from the full frame first (Read it), then crop.

## 5. Today's specific checks
- **Pause frames, eyes (PIT-03):** every frame of a pause must show characters alive: breathing, blinking, glancing.
  A blink keyed on the story clock (or the Puppet's end-of-speech blink via `talk(f)`) freezes shut for the whole
  pause and the character looks asleep. Render the first, middle and last frame of each pause, crop the faces, and
  flag any eyes held closed.
- **Lip sync on consecutive frames (PIT-02):** scattered stills can all land on closed mouths. Render 24 to 48
  consecutive frames of a spoken line (a short clip) and tile mouth crops:
  ```bash
  ffmpeg -y -loglevel error -i clip.mp4 -vf "crop=200:150:860:330,scale=200:150,tile=8x3" lips_tile.png
  ```
  The mouth must open and close with the syllables. A puffed `cheeks` value above 0.3 can squeeze the lips (PIT-01).
- **Baby faces (BAL-25):** baby Balak has ONE face in every scene. Render the newborn `BabyThakur` reference (a
  newborn frame of Episode 2 scene 01 or 01c from `timing.ts`, or the `HeadQA` sheet) and put its face crop beside
  the crawling or sitting baby's crop. Check: large round cranium, round balanced face, short soft chin (never
  tapering), button nose, equal big warm brown eyes with one catchlight each, calm lids (closed only for a blink,
  sleep or deliberate contentment), curls inside the head outline, no stray cheek line, no pale hairline seam.
- **Hands (MOT-19):** thumb on the correct side for left/right in palm, back and side views; no dark outline and no
  line at the wrist (the hand shares the arm's fill and edge); fingers separated by soft shading only. Use the
  `HandQA` composition for the shared hand: `still HandQA 0 handqa`.
- **Breathing (MOT-20):** subtle, irregular, nothing bobs; Balak's halo steady (brightens only on key beats).
- **Camera (CAM-13/14):** each move starts on its narration line; about 2 s of hold between moves; no drift.

## 6. Review and report
- Read every sheet and crop. Check against `docs/QA_CHECKLIST.md`, `01_Series_Bible/DIRECTOR_DECISIONS.md` (main repo)
  and the protected fixes for the scene.
- Standing checks: Balak's look and restrained divine light (no Krishna markers), held baby never floating, hands
  touching what they hold, feet planted, no frozen pose over about 20 frames outside pauses, faces above y = 820, no
  background edge in zooms and pans, captions in Baloo Da 2 with the right speaker chip, no captions on the intro
  title page, dissolves between related scenes.
- Report per frame: `frame N: PASS` or `frame N: FAIL - <what> (<rule ID>)`, with sheet and crop paths.

## 7. After a fix
Re-bundle, re-render the same frames into a new folder (`..._v2`), compare with the previous sheet, then report.
