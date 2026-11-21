# Stories of Balak Thakur (ছোটদের বালক ঠাকুরের গল্প)

A Bengali children's animated series in 19 episodes about the childhood of the saint Balak Thakur (Biru), set in
1920s rural East Bengal. The stories follow "Sri Sri Balak Brahmachari's Childhood Stories"
(‘শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী’), based on the accounts of his mother Charushila Devi, Sarala Devi and
eyewitnesses. Audience: families and children aged 5 to 12.

Each episode runs a few minutes: a series title, a source card, the story scenes with Bengali narration and
dialogue (with held moments so the audience has time to feel them), a short moral, and an outro with a soft glimpse
of the next episode.

## How it is made
The animation is code. Characters, sets, lighting and camera are drawn as SVG in React and rendered with
[Remotion](https://www.remotion.dev/) at 1920x1080, 24 fps, using a 2.5D multiplane camera (parallax layers, push-ins,
rack focus). Voices are text-to-speech (Google AI Studio, Cartesia), normalised to -16 LUFS. Subtitles are Bengali SRT
files. Sound effects are generated in Node or taken from CC-licensed recordings.

## Folder layout

| Folder | What it holds |
|---|---|
| `00_Agent_Manifest/` | Series config (video and audio specs) and the original agent workflow notes |
| `01_Series_Bible/` | Characters, visual style, voice design, asset plan, director decisions |
| `02_Shared_Assets/` | Reusable music loops, ambient beds, foley, intro and outro templates |
| `03_Episodes/` | One folder per episode: script, shot-and-pause plan, audio, subtitles, final render ([details](03_Episodes/README.md)) |
| `remotion_studio/` | The Remotion project (React + SVG animation) |
| `scripts/` | Python and Node tools for audio, subtitles, timing and sound effects |
| `docs/` | Repo map, pipeline decisions, QA checklist, audio credits, decision changelog |
| `.claude/skills/` | Step-by-step skills for AI agents |

A folder-by-folder map is in [docs/REPO_MAP.md](docs/REPO_MAP.md).

Note: the newest Remotion code and scripts live in a separate git worktree (branch `feat/ep01-polish-and-rules`, in a
temporary folder) and are mostly uncommitted; its audio folder is gitignored. See [CLAUDE.md](CLAUDE.md) for the path.
It needs to be committed into this repo.

## Production pipeline: script to final render

1. Script. Each episode has a voice script (`01_Script_and_Storyboard/Episode_NN_AI_Studio_Voice_Script.md`) and a
   scene manifest (`scenes_manifest.json`).
2. Voices. One WAV per script block into `02_Audio/Voice_WAVs/` (saved series voices, see
   `01_Series_Bible/AI_Studio_Voice_Design_Master.md`), normalised to -16 LUFS / -1.5 dBTP with lengths kept.
3. Subtitles. The Bengali SRT in `04_Video_Assembly/Subtitles_SRT/`.
4. Shot list and pauses. A per-scene shot list and pause table (`EpNN_Shots_and_Pauses_DRAFT.md`) that follows the
   narration literally; the director approves it before any coding.
5. Timing. A generator script turns voice lengths, the SRT and the approved pauses into frame-accurate `timing.ts`
   and `subtitles.ts` for Remotion.
6. Animation. Parallel agents, one per file, build the scenes in `remotion_studio/src/episodeNN/` on the shared rig,
   sets, cards, subtitles and outro, and add sound.
7. Review. Still frames, contact sheets and short clips; the director approves.
8. Final render. Only after approval: render in chunks of about 2,000 frames, join with ffmpeg, check, copy to
   `04_Video_Assembly/Final_Render/<Episode_folder>.mp4`, and export the final SRT (`<Episode_folder>_bn_final.srt`).

The earlier Python/ffmpeg compositor (`scripts/render_25d_scene.py`, `scripts/assemble_episode.py`) is kept but the
current episodes are rendered with Remotion.

## Status (2026-11-21)
Episode 1 final (6:44.5; a re-render with the shared rig fixes is pending). Episode 2 final (5:04.5), re-rendering
with hand and baby-face fixes. Episode 3 final rendering (2:15.8). Episode 4 has timing only. Episodes 5 to 19 are at
the script stage. Details: [03_Episodes/README.md](03_Episodes/README.md).

## Where to read next
- [CLAUDE.md](CLAUDE.md): the operating guide for AI agents (rules, workflow, commands, where things are).
- [01_Series_Bible/DIRECTOR_DECISIONS.md](01_Series_Bible/DIRECTOR_DECISIONS.md): the director's creative decisions.
- [docs/PIPELINE_DECISIONS.md](docs/PIPELINE_DECISIONS.md): technical and process decisions.
- [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) and [docs/AUDIO_CREDITS.md](docs/AUDIO_CREDITS.md).
- Series bible: [characters.json](01_Series_Bible/characters.json),
  [visual_style_guide.md](01_Series_Bible/visual_style_guide.md),
  [AI_Studio_Voice_Design_Master.md](01_Series_Bible/AI_Studio_Voice_Design_Master.md),
  [Voice_Settings_and_IDs.csv](01_Series_Bible/Voice_Settings_and_IDs.csv),
  [asset_taxonomy_and_library_plan.md](01_Series_Bible/asset_taxonomy_and_library_plan.md).
- [00_Agent_Manifest/AGENT_WORKFLOW_README.md](00_Agent_Manifest/AGENT_WORKFLOW_README.md) and
  [series_config.json](00_Agent_Manifest/series_config.json): original pipeline notes and specs.
- [02_Shared_Assets/Templates/Episode_Template_Guide.md](02_Shared_Assets/Templates/Episode_Template_Guide.md):
  shared intro and outro structure.
