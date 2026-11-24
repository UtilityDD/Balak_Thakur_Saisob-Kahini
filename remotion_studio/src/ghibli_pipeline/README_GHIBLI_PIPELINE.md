# Studio Ghibli Watercolor + Sepia-Ink Animation Pipeline (All Episodes Guide)

This directory (`src/ghibli_pipeline/` and `scripts/ghibli_pipeline/`) provides a **strictly isolated, non-destructive Studio Ghibli watercolor + sepia-charcoal ink sketch pipeline** for any episode of *Chotoder Balak Thakurer Golpo* or *Param Bismoy*—past (`Episode 01–06`) or upcoming (`Episode 07+`).

> **Golden Isolation Rule:** Never overwrite or break existing pure-SVG episodes (`src/episode01..06/*`), shared rigs (`src/cinematic/rig/*`), or existing `Final_Render/` outputs. Every Ghibli version lives in `src/ghibli_pipeline/<episode>/`, stores its plates in `public/images/ghibli_<ep>/`, and renders to `04_Video_Assembly/Ghibli_Test_Render/`.

---

## 1. Pipeline Architecture & Shared Modules

| File / Folder | Purpose |
| :--- | :--- |
| [`src/ghibli_pipeline/GhibliStage.tsx`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/GhibliStage.tsx) | Shared multiplane camera stage & visual primitives: `<GhibliStage>`, `<GhibliLayer>` (supports `groundLocked` & `parallaxDrift`), `<GhibliPreload>`, `<GhibliCutout>`, `<ContactShadow>`, `<GhibliCharFilterDefs>` (`#ghibli-char-ink` non-destructive sepia-ink contour for `Puppet` & `SeatedChild`), `<GhibliCourtyardShadows>`, `<GhibliAtmosphericHaze>`, `<GhibliForegroundBokeh>`, `<GhibliSketchedLeaf>`, `<GhibliGrade>`, and ink blossoms. |
| [`src/ghibli_pipeline/core/ghibliMotion.ts`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/core/ghibliMotion.ts) | Shared kinematics & depth helpers: `withFootLockedSteps()` (zero-slip stepping during flower/prop gathering), `ghibliWalkSpot()` & `ghibliStrideOf()` (phase-locked zero-slip walking gait with hip bob & counter-arm swing), `safeBodyTurn()` (prevents `Puppet.tsx` far-arm dark skin-color flip when `\|bodyTurn\| > 0.378`), `solvePuppetArmIK()`, `reachToTarget()`, `withGhibliAlive()`, and `zoomProportionalDof()`. |
| [`src/ghibli_pipeline/registry.ts`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/registry.ts) | Central registry (`GHIBLI_EPISODES`) of all Ghibli episode compositions (`Episode03GhibliTest`, etc.). |
| [`src/ghibli_pipeline/entry.tsx`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/entry.tsx) | Standalone Remotion root registering every composition in `GHIBLI_EPISODES`. |
| [`scripts/ghibli_pipeline/prepare_episode_plates.py`](file:///C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/prepare_episode_plates.py) | Generic plate & cutout processor (supports `--episode ep03` or `--manifest <ep_ghibli.json>`). |
| [`scripts/ghibli_pipeline/render_ghibli_episode.sh`](file:///C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/render_ghibli_episode.sh) | Generic 16 GB RAM-safe chunked H.264 renderer (`--crf=16 --concurrency=1 --gl=angle`), lossless `ffmpeg` concat, `ffprobe` verification, and join-boundary frame extractor. |

---

## 2. Step-by-Step Workflow for Converting or Creating Any Episode in Ghibli Style

### Step 1 — Audit the Episode & List Required Sketch Plates
1. Read the episode's `timing.ts`, `subtitles.ts`, and `scenes/*.tsx`.
2. Check the maximum camera zoom across all shots:
   - If a scene zooms up to `3.0×–4.0×` (like close-ups on Balak Thakur), generate/upscale architectural back plates to **`5040×1320`**, floor plates to **`5440×1200`**, and hero altar/tree cutouts to **`1200–1400px` tall** so close-ups remain razor-sharp.
3. Classify every visual element into:
   - **Full-Frame Plates (`2560×1440`):** Skies, title/source/outro cards, next-episode glimpse backgrounds.
   - **Stitched Panoramas:** Veranda/courtyard facades (`courtyard_back`), perspective ground floors (`courtyard_floor`), distant tree horizons (`far_trees`).
   - **Transparent Cutouts (`#FFFFFF` studio background for flood-fill extraction):** Trees, Tulsi Mancha, static baskets, stools, shrines.
   - **Interactive Zero-Float Rigged Props (Keep as Ink-Styled SVG):** Any prop a character's hand actively bends, picks up, pours, or hands off (e.g., `GhibliJabaBranch`, pickable flowers, `KolsiShape`, `PickLeaf`) must remain an ink-outlined SVG at the exact IK coordinate so hands never float.

### Step 2 — Generate Raw Ghibli Plates in `public/images/ghibli_<ep>/raw/`
Use this mandatory style prompt prefix for visual consistency across all episodes:
> *"Studio Ghibli hand-drawn watercolor and gouache background illustration on warm cold-press watercolor paper, delicate sepia and charcoal pencil linework, visible paper tooth, soft golden Bengal morning sunlight coming from the upper-right, no characters, no people, no text, no watermarks."*

- For isolated cutouts (trees, altars, props), add: *"isolated on a pure solid `#FFFFFF` white background, full object centered with clean margin around all edges, no outer cast shadow puddle on the white paper."*

### Step 3 — Run `prepare_episode_plates.py`
Create a manifest JSON in `scripts/ghibli_pipeline/manifests/epXX_ghibli.json` (or use `--episode ep03`) and run:
```bash
python C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/prepare_episode_plates.py --manifest C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/manifests/epXX_ghibli.json
```
What the processor does automatically:
1. **Procedural Cold-Press Paper Tooth (`watercolor_paper_grain.png`):** Multi-scale warm cotton tooth for multiply compositing.
2. **Edge-Connected BFS Flood-Fill Alpha (`extract_border_alpha`):** Never uses global white-keying (preserving white flowers and cream lime-plaster highlights). Includes a **3-pass morphological light-halo choke** (`choke_light_halo=True`) and **5-step interior RGB decontamination** so tree trunks have zero white/paper rim lines at `3.5×` close-ups.
3. **Enclosed Hole Punching (`remove_enclosed_holes`):** Punches out trapped pure-white paper holes inside closed basket handles and tree trunk forks (plus a 2px bright-rim choke).
4. **Seamless Horizon & Panorama Blending:** Crops verandah facades through symmetric column centerlines (`22px` cosine blend) and feathers the top `34px` alpha of floor panoramas so the `y = 784` wall-to-floor horizon seam is invisible during parallax.
5. **Auto-Measured Anchors (`plateAnchors.ts`):** Measures exact pixel dimensions and trunk/base `(anchorX, anchorY)` for `<GhibliCutout>`.

### Step 4 — Build the Episode's Scene Wrappers in `src/ghibli_pipeline/episodeXX/`
Follow the 6 mandatory quality rules perfected in Episode 3:

1. **Wrap Every Character in `filter="url(#ghibli-char-ink)"`:**
   Place `<GhibliCharFilterDefs />` inside your `<GhibliLayer>` and wrap every `<Puppet>` (and `<LooseHair>`) or `<SeatedChild>` in `<g filter="url(#ghibli-char-ink)">...</g>`. This adds a non-destructive `1.05px` warm sepia-charcoal ink contour and warm paper pigment harmony.
2. **Use 4-Plane Multiplane Depth + Upstage Tree Occlusion:**
   - `depth={0.12}`: Sky plate
   - `depth={0.38}`: Distant village treetops (`far_trees_sketch.png`)
   - `depth={0.55}`: Architectural back plate (`courtyard_back_sketch.png`)
   - `depth={0.68}`: `<GhibliAtmosphericHaze f={lifeF} />` (warm golden aerial-perspective veil + 24 drifting sunlit dust motes separating dark hair from dark doorways)
   - `depth={0.82}` (`groundLocked parallaxDrift={-0.025}`): Mid-ground trees + upstage background characters moving **behind** tree trunks (render the upstage character *before* the `<GhibliCutout>` tree in the same layer so the trunk and branches naturally occlude them!)
   - `depth={0.93}` (`groundLocked parallaxDrift={-0.01}`): Upstage Tulsi Mancha / altar & secondary actors
   - `depth={1.00}`: Principal focal characters (`focus: 1.0`, zero DOF blur)
   - `depth={1.22}` (`extraBlur={3.2}`): `<GhibliForegroundBokeh f={lifeF} zoom={cam.zoom} />` (soft out-of-focus foreground branch/flower framing that automatically recedes on tight close-ups)
3. **Use `zoomProportionalDof(cam.zoom)` on the Camera:**
   Scales `cam.dof` from `0.28` on `1.0×` wide shots up to `1.85` on `3.5×–4.0×` close-ups so background architecture and trees melt into creamy bokeh during close-ups.
4. **Never Let Characters Stand Rigid or Slide While Walking (`ghibliMotion.ts`):**
   - For characters picking flowers or working at a spot, step their `bodyX` across `15–40px` between actions, re-solve `reachToTarget()` at each stepped `bodyX`, wrap their track in `withFootLockedSteps(track, cast, scale)`, and pass `POS.x + ACT(f).bodyX` to `<ContactShadow>`.
   - For walking entrances, use `ghibliWalkSpot()` and `ghibliStrideOf()` so `stride` matches `0.21 * thigh * scale` with phase-locked step progression, vertical hip bob, and counter-arm swing.
5. **Prevent Far-Arm Dark Skin Flip (`safeBodyTurn`):**
   Keep `|bodyTurn| <= 0.36` whenever a character raises or points with their rear arm (compensate with `headTurn: 0.45–0.52`). In `Puppet.tsx`, `|bodyTurn| > 0.378` triggers `rFar = true` (`c.skinShade` + `brightness(0.85)`), which makes one arm look darker than the other.
6. **Check Quiet SFX Levels (Like `girls_giggle.wav`):**
   Always measure RMS dBFS on subtle human reaction SFX (`girls_giggle.wav` has raw RMS `-25.36 dBFS` and needs `volume: 0.58–0.95` to be clearly heard over ambient beds).

### Step 5 — Register, Preview on Localhost/LAN & Render Chunked MP4
1. Add the composition to [`src/ghibli_pipeline/registry.ts`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/ghibli_pipeline/registry.ts) and [`src/Root.tsx`](file:///C:/Dipankar/Balak_Thakur_Production/remotion_studio/src/Root.tsx).
2. Preview on `http://localhost:3100` (and LAN `http://192.168.1.8:3100`) per the `studio-run` skill and render QA stills/contact sheet for director approval.
3. Once approved, stop the Studio server (to free RAM on this 16 GB machine) and run the generic chunked renderer:
   ```bash
   bash C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/render_ghibli_episode.sh \
     EpisodeXXGhibliTest <TOTAL_FRAMES> \
     "/c/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/<Episode_Folder>/04_Video_Assembly/Ghibli_Test_Render/Episode_XX_Ghibli_Sketch_Test.mp4" 4
   ```
