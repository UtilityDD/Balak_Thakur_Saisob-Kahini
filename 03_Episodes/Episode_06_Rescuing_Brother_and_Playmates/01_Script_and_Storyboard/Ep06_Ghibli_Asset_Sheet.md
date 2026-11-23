# Episode 6 hand-painted (Ghibli pipeline) version: asset sheet

**Status: DRAFT for the director (2026-11-23).** Converts the approved immersive re-cut (STO-22a, `Episode06`,
3,302 frames) to the watercolour + sepia-ink look. Story, timing, voices, sound, rigs and acting stay exactly as in
the re-cut; only the sets, still props and atmosphere change. Built isolated in
`remotion_studio/src/ghibli_pipeline/episode06/`, plates in `public/images/ghibli_ep06/`, renders to
`04_Video_Assembly/Ghibli_Test_Render/`. Nothing delivered is touched.

Images are generated in Gemini (the director's Chrome), saved to `public/images/ghibli_ep06/raw/` under the file
names below, then processed by `scripts/ghibli_pipeline/prepare_episode_plates.py --manifest .../ep06_ghibli.json`.

## Fixes from the Episode 3 audit, written into every prompt

- Humble rural East Bengal village of the 1890s: mud walls, thatch, bamboo, earth yards. **No palaces, no ornate
  stone, no columns.**
- The light matches the scene's time (late morning, afternoon gold, sunset); the direction is fixed per set so the
  painted shadows agree with the rigs' light (`UjancharLightLayer` / `VillageLightLayer`).
- Generated at the final size or larger (no 3.7x upscales): plates ≥ 2560 px wide, panoramas made from 2 or 3
  overlapping panels.
- Prompts and dates are logged here (the audit found no record for Episode 3).

## Style prefix (every image)

> Studio Ghibli–style hand-drawn watercolour and gouache background illustration on warm cold-press watercolour
> paper, delicate sepia and charcoal pencil linework, visible paper tooth, rural East Bengal village in the 1890s,
> humble mud-walled houses with thatched roofs, bamboo, banana and mango trees, no characters, no people, no
> animals, no text, no watermark, 16:9.

Cutout suffix: *isolated on a pure solid #FFFFFF white background, whole object centred with a clean margin on all
sides, no cast-shadow puddle on the white paper.*

## Reused from the Episode 5 set (Ujanchar, same village)

`far_trees_sketch`, `mud_house_main_sketch`, `mud_house_corner_sketch`, `yard_earth_floor_sketch`,
`tree_mango_sketch`, `banana_clump_sketch`, `prop_bamboo_fence`, `prop_khadam_sandals`, `watercolor_paper_grain`,
`card_intro_bg_sketch`, `card_source_bg_sketch`, `card_outro_padma_sketch`. Checked against Ep6 framing before use.

## New images (16)

| # | File (raw/) | Kind | Size | Prompt (after the prefix) |
|---|---|---|---|---|
| 1 | `sky_village_late_morning.png` | plate | 2560×1440 | Wide open sky over flat Bengal fields, late morning, high soft cumulus, pale warm blue fading to cream at the horizon, sun from the upper left. Sky only, low flat horizon line at the bottom 15%. |
| 2 | `sky_village_afternoon.png` | plate | 2560×1440 | Same sky in warm afternoon gold, long soft clouds lit amber from the left, hazy ochre horizon. Sky only. |
| 3 | `sky_village_sunset.png` | plate | 2560×1440 | Bengal village sunset: low orange-rose sun near the horizon on the left, violet-gold clouds, a few birds as tiny ink ticks. Sky only. |
| 4 | `field_floor_panel_a.png` / `_b.png` | panorama | 2 × 2720×1200 | Ground-level perspective of a dry, sunlit village playing field: trodden earth with patches of short grass, footpaths, small stones, seen from a child's eye height, horizon at the very top edge. Panel A left half, panel B right half, matching edges. |
| 5 | `village_lane_back.png` | panorama | 5040×1320 | Narrow earthen village lane between mud-walled thatched houses and bamboo fences, gourd vines on the fences, a banana tree, soft late-morning light from the left. Eye-level, the lane runs left to right across the frame. |
| 6 | `village_field_edge_back.png` | panorama | 5040×1320 | Edge of the playing field: a low line of mud huts, bamboo clumps, a few palms and a mango tree under late-morning sun, open ground in front. Eye-level. |
| 7 | `friend_house_front.png` | cutout | 1400 px tall | Small mud-walled house with a thatched roof and a short veranda, a wooden peg on the wall beside the door, a rope clothesline hint. Front view. *(cutout suffix)* |
| 8 | `sweet_stall.png` | cutout | 1300 px tall | Tiny village sweet-seller's stall: bamboo frame, thatched awning, a low wooden counter with brass trays of sandesh and rosogolla and two glass jars of coloured lozenges. Front view, no seller. *(cutout suffix)* |
| 9 | `haystack_a.png`, `haystack_b.png` | cutout | 1100 px tall | A rounded golden rice-straw haystack on a bamboo post, loose straw at the base (two different shapes). *(cutout suffix)* |
| 10 | `fallen_log.png` | cutout | 900 px tall, wide | A weathered fallen tree log lying on its side, bark and moss, a broken branch stub. Side view. *(cutout suffix)* |
| 11 | `tree_banyan_field.png` | cutout | 1400 px tall | A broad old banyan tree with aerial roots, dense canopy, at the edge of a field. *(cutout suffix)* |
| 12 | `bamboo_clump.png` | cutout | 1400 px tall | A tall clump of green bamboo, slender leaning culms and feathery leaves. *(cutout suffix)* |
| 13 | `ujanchar_veranda_back.png` | panorama | 5040×1320 | The Ujanchar family house seen from its earthen courtyard: a long mud-walled house with a thatched roof, a low raised veranda with wooden posts, a dark doorway, a kitchen hut corner, morning light from the right. Humble, not grand. |
| 14 | `glimpse_ep07_pathshala.png` | plate | 2560×1440 | A village pathshala: an open thatched hut on a raised mud plinth under a big tree, palm-leaf mats on the floor, slates leaning on a bamboo rail, soft morning light. No people. |
| 15 | `card_outro_sunset_field.png` | plate | 2560×1440 | The playing field at sunset, empty, long shadows from a haystack and the banyan, warm glowing sky. |
| 16 | `props_sheet_ep06.png` | sheet | 2560×1440 | A neat sheet of separate village props on white: a brass thali, a clay kolshi, a wooden slate, a jute sack of rice, a small wooden stool, a bamboo basket. Each well spaced. *(cutout suffix)* |

Interactive props stay as ink-styled SVG at their IK points (never cutouts): the ten-rupee note, the shirt on the
peg and its pocket, the khadam on the feet, slates in hands, the kolshi being carried, kites, the brass thali in
hands (MOT-01 to MOT-07).

## Shot-by-shot use (summary)

- Ujanchar house scenes: sky 1 → far trees (ep05) → veranda back (13) → haze → mango/banana cutouts (behind which a
  village woman passes) → yard floor (ep05) → characters → foreground leaf bokeh.
- Field and stall: sky 1/2 → field-edge back (6) → banyan, bamboo, haystacks (9, 11, 12) → stall (8), friend's
  house (7) → field floor (4) → characters → grass bokeh.
- Lane walk: lane back (5) with gourd-vine SVG on top (it moves in the wind) → fences → characters.
- The log and afterglow: sky 3 (sunset) → field edge (6) → log (10) → long painted shadows.
- Outro: card 15, glimpse 14.

## Log

- 2026-11-23: sheet drafted; images to be generated in Gemini via the director's Chrome.
