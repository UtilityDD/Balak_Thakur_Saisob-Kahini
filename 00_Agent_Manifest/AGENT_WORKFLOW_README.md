# How an AI Agent & Production Pipeline Uses This Workspace

> **Resuming work? Read `PENDING_WORK.md` (repo root) first** — the live list of what is in progress, blocked, and next, with resume commands. Keep it updated.


## 1. Series Rules & Bibles
1. Read `00_Agent_Manifest/series_config.json` for 2.5D multi-plane specs, 24fps cinematic rules, and 4-bus audio levels.
2. Read `01_Series_Bible/visual_style_guide.md` for borderless RGBA rules, Bengali weather/nature presets, camera easing, and lip-sync/gesture guidelines.
3. Read `01_Series_Bible/characters.json` and `01_Series_Bible/AI_Studio_Voice_Design_Master.md` to keep character appearance, rig layers, and `gemini-3.8-flash-tts` Voice IDs consistent across all episodes.
4. Consult `02_Shared_Assets/asset_catalog.json` to reuse existing skies, Padma river plates, flora, architecture, weather overlays, ambient beds, music stems, and SFX before generating new assets.

## 2. Per-Episode Production Flow
1. **Validate:** Run `python scripts/validate_studio.py` to verify all manifests and `scenes_manifest.json`.
2. **Voice Generation:** Generate `.wav` files in Google AI Studio (`gemini-3.8-flash-tts`) per `01_Script_and_Storyboard/Episode_XX_AI_Studio_Voice_Script.md` into `02_Audio/Voice_WAVs/`.
3. **Audio Prep & Lip-Sync Envelope:** Run `python scripts/normalize_audio.py --episode Episode_XX_...` to normalize to `-16 LUFS` (48 kHz) and compute `audio_durations.json` + amplitude envelopes.
4. **Subtitles:** Run `python scripts/generate_srt.py --episode Episode_XX_...` to build `04_Video_Assembly/Subtitles_SRT/`.
5. **2.5D Scene Rendering:** Composite 5-plane borderless RGBA layers with smooth eased camera motion via `python scripts/render_25d_scene.py`.
6. **Master Mix & Final Render:** Run `python scripts/assemble_episode.py --episode Episode_XX_...` to mix Voice + Ambient Bed + Ducked Music + SFX and render the 1080p MP4 to `04_Video_Assembly/Final_Render/`.
