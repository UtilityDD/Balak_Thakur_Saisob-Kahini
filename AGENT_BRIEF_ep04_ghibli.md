# AGENT BRIEF — Episode 4 Studio Ghibli Full Production (`Episode04GhibliFull`)

You are one of 4 parallel agents building Episode 4 Ghibli in `C:\Dipankar\Balak_Thakur_Production\remotion_studio`.
**Rule 1 (Strict File Ownership):** Edit ONLY the exact file(s) assigned in your prompt. Do NOT edit `Ep04GhibliShared.tsx`, `timing.ts`, `subtitles.ts`, `plateAnchors.ts`, `Scene01..03`, or `src/param_bismoy_ep01/*`. Do NOT run full episode renders.

## Shared Exports Already Built (Import & Use Directly)
- `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\episode04\timing.ts`:
  - `EP04G_TOTAL_FRAMES` (8594), `EP04G_SCENES`, `EP04G_AUDIO`, `EP04G_SPANS`, `ep04gSpan(sceneId, key)`, `ep04gRms(sceneId, file, localFrame)`, `ep04gSpeakRms(sceneId, files, localFrame)`
- `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\episode04\subtitles.ts`:
  - `EP04G_CUES`
- `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\episode04\Ep04GhibliShared.tsx`:
  - `EP04G_CAST` (`charu`, `elderBrother`, `jyethi`, `sundar`, `harendra`, `thakurma`, `bhagabati`, `runner`, `mangla`)
  - `EP04G_MORNING_LIGHT`, `EP04G_AFTERNOON_LIGHT`, `EP04G_POND_LIGHT`, `EP04G_SHRINE_LIGHT`
  - `mouthFromRms(rms, f)`, `poseOf(overrides)`
  - `GhibliCourtyardBackdrop` (`{ f, mode: "morning" | "afternoon", showMadur }`)
  - `GhibliShrineBackdrop` (`{ f }`)
  - `GhibliEp04ForegroundFinish` (`{ f, zoom, shrineArch, petals, warmth }`)
  - `GhibliSmokeCurls`, `GhibliChapterBreak`, `GhibliScene99OutroEp04`
- Reference scene already written to follow exact import paths & prop types:
  - `C:\Dipankar\Balak_Thakur_Production\remotion_studio\src\ghibli_pipeline\episode04\scenes\Scene01ClayShivaGhibli.tsx`

## Mandatory Visual & TypeScript Rules
1. Place `<GhibliCharFilterDefs f={f} />` inside `<GhibliLayer depth={1.0}>` and wrap EVERY `<Puppet>`, `<SeatedChild>`, and `<StandingChild>` in `<g filter="url(#ghibli-char-ink)">...</g>`.
2. Always clamp `Puppet` `bodyTurn` with `safeBodyTurn(...)` (`[-0.36, 0.36]`) and drive `cam.dof = zoomProportionalDof(cam.zoom)`.
3. Keep all faces and key props above `y = 820` on screen (`CAM-07`).
4. `GhibliBalakAura` props are `{ cx, cy, r, glow, f }`; `GhibliBalakGroundGlow` props are `{ x, y, rx, ry, level }`. Divine light is on Balak ONLY (`BAL-05`), steady `glow={0.55}` everywhere EXCEPT Scene 04's prophecy where it gently rises to `0.95`!
5. Save your file in a clean, compiling TypeScript state. Do not commit.
