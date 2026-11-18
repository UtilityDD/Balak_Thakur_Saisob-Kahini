# Asset Taxonomy & Library Architecture (Scaling to 1,000+ Reusable Assets)

To achieve a **premium cinematic look** across all 19 episodes without regenerating the same trees, boats, skies, or ambient beds from scratch, all reusable assets live in `02_Shared_Assets/` and are indexed in `02_Shared_Assets/asset_catalog.json`.

## Folder Taxonomy

1. **`02_Shared_Assets/Background_Refs/`**
   - `01_Skies_and_Clouds/` — Kartik night, monsoon storm, Sharad blue, winter mist, golden dawn (4K wide plates for `0.15x` parallax).
   - `02_Padma_Rivers_and_Boats/` — Padma river loops, steamship dock, *mayurpankhi* boat, country *dingi* boats, *kaash* grass banks (`0.35x` parallax).
   - `03_Bengal_Flora_and_Trees/` — Borderless RGBA banyan, coconut palm, banana grove, bamboo cluster, mango tree, *shiuli* & lotus props (`0.65x`–`1.0x`).
   - `04_Architecture_1920s/` — Baidik Bari terracotta arches, Kali mandap, rural *pathshala*, village *haat* stalls, thatched mud huts.
   - `05_Props_and_Ritual_Items/` — Clay *diyas*, brass bells, *dhak* drums, palm-leaf horoscopes, brass sugar platters, sparklers.
   - `06_Weather_and_Particles/` — Loopable alpha overlays: 3-depth monsoon rain, fireflies, river shimmer, incense smoke, *shiuli* falling petals, golden aura dust.

2. **`02_Shared_Assets/Character_Refs/`**
   - Per-character folders (`<character_id>/`) storing:
     - `turnaround.png` (Front / 3-4 / Side)
     - `expressions/` (*serene*, *joyful*, *amazed*, *emotional*)
     - `visemes/` (7-state mouth PNGs: `REST`, `A`, `E`, `I`, `O`, `U`, `MBP`)

3. **`02_Shared_Assets/Music_Loops/`**
   - Seamless loopable stems (`48kHz WAV`): `Theme_Intro_Bansuri.wav`, `Village_Peace_Loop.wav`, `Festival_Folk_Loop.wav`, `Sacred_Night_Ambient.wav`, `Warm_Family_Flute.wav`, `Monsoon_Tension_Loop.wav`.

4. **`02_Shared_Assets/SFX_Pack/`**
   - `Ambient_Beds/` — Continuous 60s+ seamless Bengali nature beds (`padma_river_day.wav`, `bengal_night_crickets.wav`, `monsoon_rain_courtyard.wav`, `village_market_haat.wav`, `dawn_birds_temple.wav`).
   - `Foley_and_Events/` — `uludhwani.wav`, `temple_bell_drop.wav`, `sparkler_crackle.wav`, `distant_ship_horn.wav`, `goat_bleat_happy.wav`, `soft_magical_shimmer.wav`, `chime_pop.wav`.

## Naming Convention
`<category>_<subject>_<mood_or_variant>_<layer>.<ext>`
Example: `sky_padma_kartik_night_L1.png`, `flora_coconut_palm_breeze_L3.png`, `amb_bengal_night_crickets_48k.wav`
