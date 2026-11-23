# Series Studio Ghibli Style Bible & QA Reference (`src/ghibli_pipeline/GHIBLI_STYLE_BIBLE.md`)

This document locks the visual language across every Ghibli-pipeline episode so every plate, prop, and character reads as painted by **one artist's hand** (Master Plan Items 10, 11, 23, 28).

---

## 1. Paper, Linework & Pigment Standards
- **Paper Stock:** Warm cold-press Arches-style watercolor paper (`#f2e5cf` highlight tooth, subtle organic grain at 1:1 native pixel scale).
- **Foreground Ink:** Warm sepia-umber (`#382115`, stroke weight ~1.2–1.6 px at 1080p; Child Thakur `#462a1b` softer weight).
- **Midground Ink (Aerial Perspective):** Softened warm ochre-grey (`#6e5a49`), never heavy black.
- **Far Background Trees:** Zero hard ink outlines — pure wet-on-wet watercolour shapes softly dissolving into horizon mist.
- **White Cloth (Dhoti / Chadar / Saree):** Never flat `#ffffff` with neutral grey lines. Always warm cream-ochre sunlit faces (`#fff7e2` → `#f3e6cf`) paired with cool lavender-slate shadow creases (`#8e9ab2` / `#78849a`).

## 2. Lighting & Grounding Rules per Set
| Set / Scene | Time of Day | Sun Direction | Rim Color | Shadow Bounce Color | Shade Factor |
|---|---|---|---|---|---|
| Ep03 Scene 01 (Dawn Garden) | Sharad Dawn | Upper-right low (`rimDir = 1`) | `#ffd38e` (low gold) | `#8b9ec4` (cool dawn mist) | `0.10` |
| Ep03 Scene 02 (Vedic Courtyard) | Sharad Morning | Upper-right (`rimDir = 1`) | `#ffe6a8` (warm sun) | `#8ea8c4` (sky bounce) | `0.00` |
| Ep05 Scene 01 (Kachari Compound) | Late Morning | Upper-right (`rimDir = 1`) | `#ffe8ae` | `#91a8bf` | `0.00` |
| Ep05 Scene 02 (Banana Grove) | Afternoon Shade | Upper-right filtered (`rimDir = 1`) | `#ffe7aa` | `#7c9c78` (leaf bounce) | `0.18` + `dapple` |

## 3. Ground Shadows (2-Layer Rule)
Every grounded character, animal, and floor prop uses `<ContactShadow />` (2-layer):
1. Wide directional watercolour cast wash angled opposite `sunDir`.
2. Crisp dark sepia-umber ambient-occlusion contact crease (`#24120a`) immediately beneath feet, hooves, knees, or basket rims.

## 4. Resolution & Plate Generation Standard
- **Wide Panoramas (Sky, Far Trees, Courtyard Back, Floor):** Target `>= 5120×2160` (5K wide) via native high-res / tiled stitch + detail-preserving upscale so 3–4× zooms stay crisp with authentic paper tooth.
- **Standard Plates & Key Cutouts:** Target `>= 3840×2160` (4K) or >= 2× rendered pixel height.
- **Architecture Continuity:** Vedic House must always be a **plain Bengali brick courtyard house** (plain flat-plastered lime walls, simple veranda arches/pillars, unadorned parapet — never ornate Mughal palace arches), matching Episodes 1, 2, and 4.
- **Tulsi Mancha:** Always clean, cared-for, freshly lime-washed, with a lit clay diya and fresh marigold/hibiscus garland.

## 5. Master Compositing Order (Non-Negotiable)
1. Sky & Far Trees (soft painted blur + depth mist)
2. Midground Architecture & Trees
3. Floor Plane + 2-Layer Ground Shadows
4. Characters (`#ghibli-char-ink` / `#ghibli-balak-ink`) & Live Watercolor Interactive Props
5. Foreground Light Shafts (soft screen wash falling *over* characters) & Foreground Foliage Bokeh
6. **Single Unified `<GhibliGrade />`** (global harmony glaze + sun bloom + 8 fps paper tooth + vignette)
