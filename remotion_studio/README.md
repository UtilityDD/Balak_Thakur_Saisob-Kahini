# Balak Thakur Remotion studio

The Remotion project that renders "ছোটদের বালক ঠাকুরের গল্প" (Stories of Balak Thakur). No bitmaps: every frame is
SVG and CSS in React (2.5D multiplane camera, vector rigs, sets, divine light, cards). All compositions are
1920 x 1080 at 24 fps. The rules (look, motion, camera, captions, audio, process) are in the main repo's
`CLAUDE.md`, `01_Series_Bible/DIRECTOR_DECISIONS.md` and `docs/PIPELINE_DECISIONS.md` (worktree:
`01_Series_Bible/production_rules.md`). Read them before you change a scene.

## Where to look

| Path | What it is |
|---|---|
| `src/Root.tsx` | Every composition. |
| `src/episode/README.md` | **Story clock** (`useStory`, pauses), intro, source card, captions, outro. |
| `src/cinematic/README.md` | Camera, anim helpers, Puppet / Head / Hand rigs, `BabyThakur`, divine light, sets (incl. `UjancharHouse`). |
| `src/episode02/README.md`, `src/episode03/README.md`, `src/episode04/README.md` | Per-episode scenes, timing, sound. |
| `public/audio/README.md` | Audio folders and level rules (the folder is gitignored: back it up). |
| `../scripts/README.md` | Timing builders, SRT export, locked renders, loudness, SFX synthesis. |
| `src/Episode01.tsx`, `src/data/episode01Data.ts` | Episode 1 timeline and its generated data. |
| `src/components/`, `src/scenes/` | First-generation Episode 1 renderer (`SourceAttribution.tsx` here is still the shared source page). |
| `src/param_bismoy_ep01/` | Separate `ParamBismoyEp01` / `ParamBismoyPaintedDemo` compositions. |

## Compositions (src/Root.tsx)

| id | Frames | Notes |
|---|---|---|
| `Episode01` | `EPISODE_01_TOTAL_FRAMES` (9705) | Episode 1 |
| `Episode02` | `EP02_TOTAL_FRAMES` (7307) | `src/episode02/Episode02.tsx` |
| `Episode03` | `EP03_TOTAL_FRAMES` (3259) | `src/episode03/Episode03.tsx` |
| `Scene00Demo` … `Scene08Demo` | scene length | Episode 1 scenes standalone |
| `HandQA` | 1 | Every hand shape, both sides, forced views, baby hand |
| `HeadQA`, `EyeQA`, `EyeZoom`, `GhomtaQA`, `ToddlerQA` | 120 | Rig QA sheets |
| `CastLineup`, `CastCloseup` | 240 | Episode 1 cast |
| `SourceAttributionQA` | 150 | Source page |
| `ParamBismoyEp01`, `ParamBismoyPaintedDemo` | own timing | `src/param_bismoy_ep01/` |

Episode 4 has timing and subtitles only (`src/episode04`), no composition.

## Run, check, render

All from `remotion_studio` (Git Bash). Node 18+, `npm ci`; Remotion 4.0.x.

```sh
npx remotion studio src/index.ts --port 3100        # LAN: http://192.168.1.8:3100; restart it if it hangs
NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit   # after every edit
bash ../scripts/render_locked.sh still Episode03 ../ep3_check/f_1200.png --frame=1200    # one still, locked
```

- Verify every change with stills and contact sheets (skill `frame-qa`) and show the director.
  **No full episode render before the director approves the frames.**
- Use `render_locked.sh` when other agents may be rendering: the machine runs out of memory with parallel renders.
- Full render (skill `render-episode`): chunks of about 2,000 frames with `--codec=h264 --crf=16`, joined with
  `ffmpeg -f concat -safe 0 -i list.txt -c copy`, then duration and join checks, then copy to
  `03_Episodes/<Episode>/04_Video_Assembly/Final_Render/<Episode>.mp4`.
- The npm `render:*` scripts are old single-pass renders to old names; do not use them. `remotion.config.ts`: JPEG
  frames, overwrite on, concurrency 4.

## How an episode is built (Episodes 2 and 3)

1. `../scripts/build_ep0N_timing.js` builds `src/episode0N/timing.ts` and `subtitles.ts` (generated: never edit) from
   the main repo's manifest, `audio_durations.json` and SRT, inserts the source card, cuts voice clips at the
   approved pauses into `public/audio/ep0N/NAME_pK.wav` and exports the pause list.
2. `Episode0N.tsx` puts each scene in a `<Sequence>` at its `startFrame`, plays beds, SFX (scene, pause and breath
   cues), narration parts at absolute frames, and `SeriesSubtitles` from the source card on.
3. Each scene reads `useStory(sceneId)` (Episode 3: `useStory3`): story clock `f` for choreography and camera, real
   clock `lifeF` for breathing, blinks and weather, so pauses hold the story while life goes on.

## Short working rules

- One agent per file; keep the protected fixes in your brief; save as you go; type-check before you finish.
- Faces and key action above y = 820; zooms and pans never show a background edge.
- Divine light is Balak's alone and restrained (steady soft halo, level 1 or below); no tilak, jewellery or sacred
  thread on him. A held baby never floats.
- Everything is a pure function of the frame (Remotion renders frames out of order, in parallel).
