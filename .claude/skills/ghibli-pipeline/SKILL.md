---
name: ghibli-pipeline
description: End-to-end Studio Ghibli watercolor + sepia-ink sketch pipeline for converting or creating any episode (old or upcoming) of Chotoder Balak Thakurer Golpo or Param Bismoy without modifying existing pure-SVG episodes or character rigs.
---

# Studio Ghibli Watercolor + Sepia-Ink Animation Pipeline Skill

Use this skill whenever the director asks to create or convert an episode (past or upcoming) in **Studio Ghibli watercolor + hand-drawn sepia/charcoal ink sketch style** while preserving all rigged characters (`Puppet`, `SeatedChild`), poses, IK, lip-sync, blinks, breathing, pauses, timing, audio, music, SFX, and subtitles.

## 1. Strict Isolation & Non-Overwrite Rules
- **Never overwrite or edit** existing pure-SVG episode files (`src/episode01..06/*`, `src/param_bismoy_ep01/*`), shared rigs (`src/cinematic/rig/*`), or existing `Final_Render/` outputs.
- All Ghibli episode code lives in `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\<episode>\`.
- All Ghibli raw and processed plates live in `C:\Dipankar\Balak_Thakur_Production\remotion_studio\public\images\ghibli_<ep>\`.
- All Ghibli QA stills, contact sheets, test clips, and full MP4 renders output to `03_Episodes\<Episode_Folder>\04_Video_Assembly\Ghibli_Test_Render\`.

## 2. Shared Code & Scripts (Do Not Reinvent)
Read the full reference guide first:
- **Reference Guide:** [`C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\README_GHIBLI_PIPELINE.md`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/README_GHIBLI_PIPELINE.md)
- **Stage, Multiplane Layers, Character Ink Filter & Atmospheric Depth:** [`src/ghibli_pipeline/GhibliStage.tsx`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/GhibliStage.tsx)
- **Zero-Slip Walking, Stepping IK, Safe BodyTurn & Zoom-Proportional DOF:** [`src/ghibli_pipeline/core/ghibliMotion.ts`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/core/ghibliMotion.ts)
- **Episode Registry:** [`src/ghibli_pipeline/registry.ts`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/registry.ts)
- **Generic Multi-Episode Plate Processor:** [`scripts/ghibli_pipeline/prepare_episode_plates.py`](file:///C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/prepare_episode_plates.py) (with manifest template [`scripts/ghibli_pipeline/manifests/ep03_ghibli.json`](file:///C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/manifests/ep03_ghibli.json))
- **Generic Chunked MP4 Renderer:** [`scripts/ghibli_pipeline/render_ghibli_episode.sh`](file:///C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/render_ghibli_episode.sh)
- **Reference Implementation (Episode 3):** [`src/ghibli_pipeline/episode03/`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/episode03/Episode03Ghibli.tsx)

## 3. Mandatory Visual & Motion Standards (Learned from Episode 3 Director Reviews)
1. **Hand-Drawn Sepia Ink Contour on All Rigged Characters (`#ghibli-char-ink`):**
   - Place `<GhibliCharFilterDefs />` in your `<GhibliLayer>` and wrap every `<Puppet>` (plus `<LooseHair>`) and `<SeatedChild>` in `<g filter="url(#ghibli-char-ink)">...</g>`.
2. **4-Plane Courtyard/Set Depth + Upstage Tree Occlusion:**
   - Separate backgrounds (`depth=0.12..0.55`), warm aerial-perspective haze + dust motes (`depth=0.68`, `<GhibliAtmosphericHaze>`), mid-ground trees & upstage actors moving **behind** tree trunks (`depth=0.82, groundLocked, parallaxDrift=-0.025`), upstage altars (`depth=0.93, groundLocked`), foreground focal actors (`depth=1.0`), and out-of-focus foreground foliage bokeh (`depth=1.22, extraBlur=3.2`, `<GhibliForegroundBokeh>`).
   - Where trees are present, stage at least one background character moving/working *behind* the tree trunk (rendered before the tree `<GhibliCutout>` in the `depth=0.82` layer) for natural 3D occlusion depth.
3. **Zoom-Proportional Depth-of-Field (`zoomProportionalDof`):**
   - Drive `cam.dof = zoomProportionalDof(cam.zoom)` so wide shots (`1.0x`) have deep focus (`0.28`) while `3.0x–4.0x` close-ups open up to creamy background bokeh (`1.85`).
4. **Zero-Slip Foot-Locked Walking & Stepping While Working (`ghibliMotion.ts`):**
   - Never leave flower-gatherers or working characters planted at one X coordinate—step their `bodyX` across `15–40px` between actions, re-solve `reachToTarget()` at each stepped `bodyX`, and wrap their pose track in `withFootLockedSteps(track, cast, scale)`.
   - For walking entrances, use `ghibliWalkSpot()` and `ghibliStrideOf()` (which uses `Puppet.tsx`'s exact `0.21 * thigh * scale` kinematic denominator, phase-locked step progression, vertical hip bob, and counter-arm swing) so feet never slide.
5. **Prevent Far-Arm Dark Skin Color Flip (`safeBodyTurn`):**
   - In `Puppet.tsx`, `|bodyTurn| > 0.378` (`sin(0.95 * bodyTurn) > 0.35`) marks the rear arm as `rFar = true` (`c.skinShade` + `brightness(0.85)`), making a raised or pointing arm look darker than the other arm. Keep `|bodyTurn| <= 0.36` (`safeBodyTurn`) when both arms are visible and compensate with `headTurn`.
6. **Verify Subtle Reaction SFX Loudness:**
   - Measure RMS dBFS on quiet human reaction SFX (like `girls_giggle.wav`, raw RMS `-25.36 dBFS`) and set cue volumes to `0.58–0.95` so they are clearly audible.
