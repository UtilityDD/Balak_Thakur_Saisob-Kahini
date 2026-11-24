# Episode 4 — 100% Complete Agent-Executable Production Blueprint
## পর্ব ৪: শিবলিঙ্গ, গোবিন্দ ও নারিকেলোদক (Idols, Wooden Doll & Coconut Water)

> **Purpose:** Complete, zero-ambiguity production blueprint for **Episode 4** (`03_Episodes/Episode_04_Idols_and_Coconut_Water/`). Any AI agent or production team can follow this single document to generate all voice WAVs, source/mix all SFX & music, build all Remotion sets/rigs/props/VFX, and assemble the full episode.
> **Source Fidelity:** 100% faithful to `book.xlsx` — Chapter 6 (*পূজার শিবলিঙ্গ ও গোবিন্দ মূর্ত্তি নিয়ে শিশু ঠাকুরের খেলা*, Row 12) and Chapter 7 (*বিগ্রহ অভিষেকের সময় ভোগের নারিকেলোদক পান*, Row 13).
> **Target Specs:** 1920×1080, 24 fps, **~5 min 15 sec** (~7,560 frames), Bengali audio + Baloo Da 2 subtitles.

---

## 1. Standing Rules & Creative Guardrails (Must Follow)

- **Balak Design (`BAL-26b`, `BAL-01`–`BAL-14`):** Age 5 (`SeatedChild design="plate" age={5}` + `StandingChild design="plate" age={5}` where standing/walking). Short straight black hair with side part (reference plate 01), plain white/cream cotton dhoti + uttariya across chest, barefoot. **NO tilak, bangles, anklets, jewellery, or sacred thread.**
- **Divine Light (`BAL-05`–`BAL-11`):** Divine light appears on Balak **ONLY** (never on clay Shiva, brass Gobinda, or shrine idols). Restrained soft warm-white halo behind head + warm golden rim + 3–4 slow motes. **Only ONE gentle glow brightening beat in the entire episode:** Scene 04 on Thakurma's *"এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!"*
- **Tone (`STO-19` + `STO-22`):** Playful, humorous, logical, affectionate, and deeply Bengali. Omit physical hitting (*চড়চাপড়* / *উত্তম-মধ্যম*)—replace with verbal scolding, dramatic hand-on-forehead exasperation, and warm family comedy suitable for children.
- **Camera Grammar (`CAM-01`–`CAM-14`):** No aimless drift; at most 1 camera move per sentence; ~2 s holds between moves; close-ups cut 6–8 frames *before* a speaker's line; faces & key action above `y = 820` (clear of captions band); no handheld shake (`CAM-03`—this is a comedy-devotional episode, not horror/danger).
- **Audio Levels (`AUD-01`–`AUD-08`):** Voices normalized to `-16 LUFS / -1.5 dBTP`; ambient loops `≤ 0.25` (ducked to `0.08–0.12` under voice, rising to `0.18–0.24` in pauses); one-shot SFX `0.15–0.45`; Indian-instrument score (`AUD-07`) `-36 to -40 LUFS` under voice, `-29 to -34 LUFS` in pauses.

---

## 2. Complete Cast, Rigs, Costumes & Voice Design Table

| # | Character | Caption Chip | Visual Rig / Costume | Voice Speaker ID | Voice Design Prompt (for Google AI Studio `gemini-3.8-flash-tts`) |
|---|---|---|---|---|---|
| 1 | **Narrator (Kathak)** | *(none — `TTL-08`)* | Off-screen | `01_Narrator_Kathak` | *(Saved Series Voice)* Warm, soothing Bengali storyteller in early 40s, affectionate children's audiobook cadence. |
| 2 | **Balak Thakur (Biru, age 5)** | `বীরু` | `SeatedChild` & `StandingChild` (`design="plate" age={5}`), cream dhoti + uttariya, barefoot (`BAL-26b`) | `12_Balak_Thakur_Child` | *(Saved Series Voice)* Clear, sweet, innocent 5-year-old Bengali boy, calm, fearless, logical, unhurried smile in voice. |
| 3 | **Charu (Charushila Devi)** | `মা` | `CAST.charu` Puppet: white sari, red border, sindoor, thin red alta (`CHR-01`–`03`). Needs kneeling `pranam` pose. | `05_Charu` | *(Saved Series Voice)* Soft-spoken mid-20s rural Bengali mother, expressive between shock, frustration, and love. |
| 4 | **Elder Brother (Dada, age 8–9)** | `বড়দা` | Existing Ep 6 `ElderBrother` Puppet (scaled to ~8 yrs, printed cotton shirt & shorts/dhoti) | `02_Gopal_Boy1` *(reuse)* | *(Saved Series Voice)* Lively 8–9 yr old Bengali boy, slightly tattletale/excited energy. |
| 5 | **Jyethi (Bhagabati's wife)** | `জ্যেঠাইমা` | `CAST` adult woman Puppet: cream/white sari with maroon border, neat bun, expressive brows | `06_Manorama_Devi` *(reuse)* | *(Saved Series Voice)* Grounded late-30s Bengali aunt, slightly dramatic/traditional tone. |
| 6 | **Mangla (House Servant)** | `মংলা` | **New Puppet:** lean rural Bengali man in late 20s, knee-length cotton dhoti, gamchha over shoulder, wide expressive eyes | `14_Mangla_Servant` *(NEW)* | `A lively, slightly nervous rural East Bengali young man in his late 20s with an expressive, comedic, high-energy village voice.` |
| 7 | **Sundar Jyetha (Sundar Thakur)** | `সুন্দর জ্যেঠা` | `SUNDAR` from Ep 1 (`Scene05Rain.tsx`): spectacles, white kurta, brown shawl | `08_Sundar_Thakur` | *(Saved Series Voice)* Scholarly, warm, gentle late-40s Bengali uncle, affectionate coaxing voice. |
| 8 | **Harendra Thakur (Elder Uncle)** | `হরেন্দ্র ঠাকুর` | **New Elder Puppet:** stern late-50s Brahmin elder, white dhoti, chadar, grey mustache, furrowed brows | `10_Grumpy_Relative` *(reuse)* | *(Saved Series Voice)* Dry, fussy, traditional 60s Bengali elder, slightly dramatic exasperation. |
| 9 | **Thakurma (Grandmother)** | `ঠাকুরমা` | `THAKURMA` from Ep 2 (`Scene01eFather.tsx`): plain white sari, grey hair, gentle age lines, no alta (`CHR-04`) | `11_Thakurma` | *(Saved Series Voice)* Spirited, loving, wise late-60s Bengali grandmother with warm raspy pride. |
| 10 | **Bhagabati Thakur (Head Priest)** | `পুরোহিত ঠাকুর` | `CAST.bhagabati` from Ep 1: silver-streaked hair, white mustache, bare-chested with namaboli shawl | `07_Bhagabati_Thakur` | *(Saved Series Voice)* Dignified late-50s Brahmin priest, deep resonant voice; flustered & booming when shocked. |
| 11 | **Family Members / Runner Cousin** | `বাড়ির লোক` | 2–3 `CAST` background elders/cousins + 1 fast-running cousin Puppet | `03_Rama_Boy2` *(reuse for runner/crowd)* | *(Saved Series Voice)* Energetic Bengali youth voice. |

---

## 3. Studio Ghibli Watercolor + Sepia-Ink Visual Pipeline (Full Plate, Cutout, Prop & Multiplane Spec)

> **Pipeline Isolation Rule (`ghibli-pipeline` skill):** Never overwrite existing pure-SVG `src/episode04/*` or `Final_Render/`. All Ghibli Episode 4 code lives in `remotion_studio/src/ghibli_pipeline/episode04/`, raw & processed plates live in `remotion_studio/public/images/ghibli_ep04/`, manifest lives in `scripts/ghibli_pipeline/manifests/ep04_ghibli.json`, and QA stills/MP4 render to `03_Episodes/Episode_04_Idols_and_Coconut_Water/04_Video_Assembly/Ghibli_Test_Render/`.

### 3.1 Mandatory Ghibli Rendering & Motion Standards (All 6 Scenes)
1. **Character Sepia-Ink Contour (`#ghibli-char-ink`):** Place `<GhibliCharFilterDefs />` inside every character `<GhibliLayer>` and wrap every `<Puppet>`, `<LooseHair>`, `<SeatedChild>`, and `<StandingChild>` in `<g filter="url(#ghibli-char-ink)">...</g>`.
2. **Zoom-Proportional Depth-of-Field:** Drive `cam.dof = zoomProportionalDof(cam.zoom)` (`0.28` on `1.0×` wides → `1.85` on `3.0×–3.8×` close-ups on Balak's face, the brass *tata*, or the stone bowl).
3. **Zero-Slip Foot-Locked Motion (`ghibliMotion.ts`):**
   - Walking entrances (Elder Brother bringing Balak in Scene 01, Mangla sprinting away in Scene 02, Family & Runner Cousin sprinting along the pond bank in Scene 03, Thakurma walking off in Scene 05, Family rushing to shrine in Scene 06) MUST use `ghibliWalkSpot()` + `ghibliStrideOf()`.
   - Working/standing characters (Charu at puja, Sundar coaxing, Bhagabati performing abhishek) step smoothly via `withFootLockedSteps()` with `<ContactShadow>` anchored to `POS.x + ACT(f).bodyX`.
   - Keep `|bodyTurn| <= 0.36` (`safeBodyTurn()`) whenever both arms are visible so the rear arm never flips dark in `Puppet.tsx`.
4. **Upstage Occlusion:** In Scenes 02–03 (`VedicPondDay`), render Mangla's escape and the Runner Cousin's sprint **behind** the `tree_mandar_bloom_sketch` trunk (`depth=0.82`) for genuine 3D parallax depth.

### 3.2 Exact 10-Plane Cinematic Multiplane Parallax Stack (True Ghibli 3D Depth)

> **Why 10 Planes (Upgraded from Episode 3's 8 Planes):** Separating slow-drifting clouds (`0.08`), far misty horizon (`0.26`), volumetric sunbeams/lamp-cones (`0.68`), near-foreground doorway/pillar framing (`1.14`), and extreme foreground bokeh (`1.30`) makes even a subtle `60–90 px` lateral camera truck or `1.0→2.6×` push-in feel like a genuine theatrical Studio Ghibli multiplane camera!

| Depth Plane | Parallax / Blur | Courtyard (Scenes 01 & 04) | Daytime Pond (Scenes 02 & 03) | Evening Shrine (Scenes 05 & 06) |
|---|---|---|---|---|
| `depth=0.08` | Sky + Slow Clouds (`parallaxDrift=+0.004`) | `sky_ep04_morning_courtyard.png` / `sky_ep04_afternoon_gold.png` + slow drifting watercolor cloud wisps | `sky_ep04_pond_day.png` + bright cumulus drift | `sky_ep04_purnima_dusk.png` (glowing full moon + faint twinkling stars) |
| `depth=0.26` | Far Atmospheric Horizon (`extraBlur=1.2`) | Soft misty Bengal palms & banyan silhouettes (`far_trees_ep04_sketch.png`) | Distant misty village treeline beyond the Vedic house | Deep indigo moonlit treetop silhouettes |
| `depth=0.45` | Mid-Far Architecture (`5040×1320`) | Distant courtyard garden wall & upper mango canopy | `pond_far_bank_baidik_sketch.png` (`BaidikBariDay` ochre roofline & coconut palms across water) | Moonlit outer courtyard arcade seen through shrine window |
| `depth=0.58` | Primary Set Back / Water (`5040×1320` / `3840×2160`) | `courtyard_back_ep04_morning.png` (Vedic veranda arches, terracotta pillars, wooden shutters) | `pond_water_emerald_sketch.png` + **animated watercolor caustic shimmer & horizontal ripple bands** | `thakur_ghar_interior_sketch.png` (4K whitewashed shrine walls, red-oxide dado, warm lamp pools) |
| `depth=0.68` | **Volumetric Light & Atmospheric Haze** | **Diagonal golden morning/afternoon sunbeams** + `<GhibliAtmosphericHaze f={lifeF} />` (24 drifting sunlit pollen/dust motes) | Soft pond mist shimmer + sunbeams filtering through *mandar* canopy | **Flickering warm amber oil-lamp light cone** + rising layered incense smoke veil (contrasting cool moonlight outside!) |
| `depth=0.78` | **Upstage Occluders & Living Micro-Life** (`groundLocked, parallaxDrift=-0.03`) | `tulsi_mancha_ep04_sketch.png` + **hopping sparrow** + Jyethi upstage | `brick_ghat_steps_sketch.png` (left) + **Mangla & Runner occluding BEHIND `tree_mandar_bloom_sketch.png` trunk** (right) + **skimming dragonfly** + `banana_clump_pond_sketch.png` | `deity_khat_shrine_sketch.png` (carved teakwood *khat* with `BrassGobinda`, stone Gopal, shalagram — NO glow) |
| `depth=0.92` | Mid-Ground Floor & Static Props (`groundLocked, parallaxDrift=-0.012`) | `courtyard_floor_ep04_sketch.png` + `madur_mat_veranda_sketch.png` (Sc 04) + scattered shiuli petals | Grassy pond bank + fallen crimson *mandar* petals + water-edge reeds | Smooth red-oxide shrine floor + woven *ashan* + cut green coconuts + `BrassDhupDani` at threshold |
| `depth=1.00` | **Hero Focal Plane (`focus=1.0`, crisp)** | Charu, Balak, Elder Brother, Harendra, Thakurma (`#ghibli-char-ink`) + interactive `GhibliClayShivalinga` / `GhibliWoodenAhladiDoll` + `<ContactShadow>` | Balak, Mangla, Sundar, Runner, Family (`#ghibli-char-ink`) + interactive `GhibliBrassGobinda` / `GhibliWoodenAhladiDoll` | Bhagabati Thakur, Balak, Charu, Jyethi, Sundar (`#ghibli-char-ink`) + interactive `GhibliStoneBowlFopra` / `GhibliBrassDhupDani` |
| `depth=1.14` | **Near-Foreground Architectural Framing** (`extraBlur=1.4`) | Soft foreground veranda terracotta pillar edge (left/right frame anchor) | Soft foreground mossy bank grass blades & over-shoulder framing silhouettes | **`shrine_arch_frame_sketch.png`** (veranda doorway arch & **gently swaying tied-back red-border curtain** peeking into the shrine!) |
| `depth=1.30` | **Extreme Foreground Parallax Bokeh** (`extraBlur=3.8, parallaxDrift=+0.045`) | `<GhibliForegroundBokeh>` out-of-focus hibiscus & jasmine sprig (recedes automatically on `>2.2×` close-ups) | Out-of-focus overhanging crimson *mandar* blossom branch & banana leaf tip gliding rapidly during lateral trucks | Soft foreground brass hanging lamp rim / veranda vine leaves in cool moonlight |

### 3.2b Per-Scene Cinematic Parallax, Rack-Focus & Living-World Choreography
- **Scene 01 (Courtyard):** AG1 opens with a **gentle `90 px` lateral parallax truck** (`cam.x: -50 → +40`) so foreground hibiscus bokeh (`1.30`), tulsi-mancha (`0.78`), and veranda pillars (`0.58`) glide across three speeds while morning sunbeams (`0.68`) shimmer. On Charu's shock (Shot 2), use a **rack-focus pull (`focus: 1.0 → 0.78 → 1.0`)** from the wooden doll on the plate to the empty courtyard arch!
- **Scene 02 (Pond & Mangla):** Crimson *mandar* petals drift across **three simultaneous depth planes (`0.78`, `1.00`, `1.30`)** with expanding water ripple rings when petals hit `pond_water_emerald_sketch.png`. During Mangla's panic sprint (Shot 10), a **motivated lateral pan** follows him passing **behind the *mandar* tree trunk (`0.78`)** while foreground banana bokeh (`1.30`) sweeps across!
- **Scene 03 (Pond Standoff):** On Balak's *"পুকুরে ছুঁড়ে ফেলে দেব!"* (Shot 12), use **deep-to-shallow rack focus**: Balak holding `BrassGobinda` sharp at `1.00` while the freezing cousins & Charu sit soft at `0.78`, then rack cleanly to Sundar Jyetha stepping forward.
- **Scene 04 (Thakurma's Prophecy — Sacred Cinematic Peak):** Warm amber afternoon sunbeam (`0.68`) slants directly onto Balak. On *"এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!"* (Shot 19), a slow **`1.0 → 2.6×` push-in** triggers `zoomProportionalDof` (`0.28 → 1.55`), melting Harendra and the courtyard pillars into creamy golden watercolor bokeh while Balak's subtle halo (`BAL-11`) and 4 slow rising motes glow softly!
- **Scene 05 (Purnima Shrine Room):** **Warm-vs-Cool Cinematic Split Lighting** — cool silver-blue Purnima moonlight outside the veranda arch (`0.12`, `1.14`) contrasting with warm flickering golden oil-lamp cones inside `ThakurGhar` (`0.58`, `0.68`). The camera slowly glides **through** the foreground veranda arch (`1.14`, swaying curtain) as Balak enters! During the coconut-water heist (`AG7`), a tight **`1.2 → 2.8×` push-in** melts the carved deity *khat* (`0.78`) into glowing amber bokeh behind Balak's lifting stone bowl!
- **Scene 06 (Priest Uproar & Ant Cutaway):** Dual-plane comic staging—red-faced Bhagabati Thakur sharp at `1.00` while the rushing family appears framed in the moonlit doorway arch (`0.78/1.14`). On *"আমার পুতুলকে খাওয়াতে…"* (Shot 27), dissolve into a **macro shallow-DOF Ghibli storybook vignette** (`ants_cutaway_vignette_sketch.png`) where tiny sepia-ink ants march across soft warm bokeh!

### 3.3 Complete Ghibli Plate & Cutout Manifest (`ep04_ghibli.json`)

> **Mandatory Raw Plate Style Prefix (prepend to every prompt below):**
> *"Studio Ghibli hand-drawn watercolor and gouache background illustration on warm cold-press watercolor paper, delicate sepia and charcoal pencil linework, visible paper tooth, no characters, no people, no text, no watermarks."*
> *(For all Cutouts, append: "isolated on a pure solid `#FFFFFF` white background, full object centered with clean margin around all edges, no outer cast shadow puddle on the white paper.")*

| Plate / Cutout File | Kind & Target Size | Detailed Watercolor Prompt (for `public/images/ghibli_ep04/raw/`) |
|---|---|---|
| `sky_ep04_morning_courtyard.png` | Full Plate (`2560×1440`) | Crisp pale-azure Bengal morning sky warming to soft honey-gold near the upper-right horizon, wispy hand-painted cumulus clouds, subtle watercolor blooms. |
| `sky_ep04_pond_day.png` | Full Plate (`2560×1440`) | Bright late-morning cerulean rural Bengal sky with luminous cream-white puff clouds and soft atmospheric warmth at the horizon. |
| `sky_ep04_afternoon_gold.png` | Full Plate (`2560×1440`) | Warm amber and peach late-afternoon Bengal sky, gentle golden light slant from upper-left, soft nostalgic Ghibli clouds. |
| `sky_ep04_purnima_dusk.png` | Full Plate (`2560×1440`) | Deep serene indigo-teal Bengal full-moon evening sky with a softly glowing cream-silver Purnima moon, faint hand-dotted stars, wispy moonlit cloud bands. |
| `thakur_ghar_interior_sketch.png` | Full Plate (`3840×2160`, 4K for close-ups) | Traditional rural Bengal Brahmin family shrine room (*Thakur Ghar*) interior: hand-plastered cream lime-whitewashed walls with aged terracotta red-oxide lower dado, dark wooden ceiling beams, a small barred wooden window showing cool blue moonlit night outside, warm flickering amber glow from brass oil lamps on the left wall, woven *ashan* prayer mat on the smooth red-oxide floor, empty center space for the wooden deity *khat* and priest. |
| `ants_cutaway_vignette_sketch.png` | Full Plate (`2560×1440`) | Soft sunlit cream-ochre Bengal mud-and-lime veranda floor in warm top-down three-quarter angle, gentle feathered pastel watercolor border fading softly into warm cream paper edges, tiny fallen jasmine petals, leaving clean center floor for animated wooden doll and ants. |
| `glimpse_ep05_cow_grove_sketch.png` | Full Plate (`2560×1440`) | Sun-dappled rural Bengal banana grove in warm afternoon gold, broad translucent green banana leaves, a gentle white humped Bengal zebu cow standing peacefully in soft watercolor haze. |
| `courtyard_back_ep04_morning.png` | Panorama (`5040×1320`) | Continuous traditional Medinimandal Vedic house (*Baidik Bari*) arched veranda facade, weathered cream-ochre lime plaster with terracotta pillars, dark wooden louvered doors, red-oxide plinth steps, warm morning sunlight slanting from upper-right (matched to Episode 3 continuity). |
| `courtyard_floor_ep04_sketch.png` | Panorama (`5440×1200`) | Wide perspective rural Bengal inner courtyard ground: worn terracotta-red lime floor with soft hand-painted sweep marks, subtle cracked plaster grain, scattered white shiuli and bel leaves, clean feathered upper edge. |
| `pond_far_bank_baidik_sketch.png` | Panorama (`5040×1320`) | Distant rural Bengal village bank across a pond: ochre terracotta roofline of a traditional Vedic house nestled among tall coconut palms, betel-nut trees, bamboo clumps, and dense mango foliage under soft late-morning haze. |
| `pond_water_emerald_sketch.png` | Panorama (`5440×1200`) | Calm emerald-jade rural Bengal village pond water in perspective, hand-painted horizontal gouache sky reflections, clustered green water-lily pads near the far edge, subtle sunlit ripple strokes. |
| `tree_mandar_bloom_sketch.png` | Cutout (`1350px` tall, `chokeLightHalo: true`) | Gnarled rural Bengal *mandar* (Indian coral) tree in full spring bloom with twisting sepia-ink bark, lush green leaves, and clusters of vibrant crimson-red coral blossoms; open trunk fork so characters can walk behind it. |
| `brick_ghat_steps_sketch.png` | Cutout (`1100px` tall) | Weathered mossy terracotta brick pond *ghat* steps descending to the left into water, chipped lime mortar, small fern tufts in cracks, damp darker lower steps. |
| `deity_khat_shrine_sketch.png` | Cutout (`1200px` tall) | Carved dark teakwood Bengali family shrine altar (*thakur-khat*) draped in crimson-and-gold cotton cloth, holding a small brass oil lamp, white conch shell, copper *kosha-kushi* water vessel, tiny stone Gopal, and black shalagram stone on a miniature brass throne, decorated with fresh marigolds and bel leaves. **No glowing aura or rays.** |
| `shrine_arch_frame_sketch.png` | Cutout (`1440px` tall) | Foreground lime-plaster Bengali veranda doorway arch with wooden threshold and a soft white-and-red-bordered cotton curtain tied neatly to the right side, clean open center doorway. |
| `tulsi_mancha_ep04_sketch.png` | Cutout (`1400px` tall) | Weathered terracotta-and-lime Bengali *tulsi mancha* altar with a lush green holy basil plant on top, tiny clay diya niche, subtle hand-drawn sepia cracks (matched to Episode 3). |
| `madur_mat_veranda_sketch.png` | Cutout (`600px` wide) | Flat woven rural Bengal *madur* reed floor mat in warm golden straw tones with hand-painted crimson woven border, viewed in gentle perspective. |
| `banana_clump_pond_sketch.png` | Cutout (`1150px` tall) | Lush cluster of rural Bengal banana plants with broad backlit sunlit emerald leaves and softly frayed leaf edges. |

### 3.4 Interactive Zero-Float Ink-Styled SVG Props (`src/ghibli_pipeline/episode04/Ep04GhibliProps.tsx`)
Every prop actively picked up, rolled, handed off, or drunk from is coded as a **hand-inked watercolor SVG** (`stroke="#3A2618"`, `strokeWidth={1.6}`, layered warm wash gradients + `#ghibli-char-ink` harmony) pinned to exact IK hand coordinates so hands **never float**:

1. **`GhibliClayShivalinga` & `GhibliClayBall`:** Hand-molded dark grey-brown wet field-clay lingam (`#5A4D43` → `#7C6D60`) with subtle sepia thumb-ridge lines, 3-lobed fresh green bel leaf (`#4C7A3B`), two white shiuli/kunda blossoms, sitting on a hammered warm-brass *tata* plate (`#D4A24C`) beside a tiny clay diya with animated flame. Smoothly morphs into `GhibliClayBall` (soft uneven round clay lump) between Balak's rolling palms in Scene 01.
2. **`GhibliWoodenAhladiDoll` (*গলৈয়ার আহ্লাদী*):** Cheerful Bengal fairground folk doll (~22 cm): lathe-turned wooden silhouette painted in bright vermilion red (`#C93B2B`), turmeric yellow (`#E6B43C`), and leaf green (`#3A7D44`), oversized round black-and-white folk eyes, rosy cheeks, red crescent smile, delicate sepia wood-grain lines. Used in Scenes 01, 02, 03, and Scene 06 cutaway (with tiny dark nail-dot near the mouth!).
3. **`GhibliBrassGobinda`:** Dignified ~25 cm standing antique-brass figure (`#C6933A` → `#F2D27B` specular wash, dark umber patina `#6E4B18`) holding a slender flute on a lotus pedestal. **Zero halo or divine glow (`BAL-05`).** Anchored to two-hand grip coordinates for both Balak (`holdInLap`, `offerUp`) and Sundar Jyetha.
4. **`GhibliStoneBowlFopra`:** Wide hand-carved speckled grey granite bowl (`#6B6E70` → `#9DA0A2`) with **animated translucent coconut-water surface (`waterLevel: 1 → 0`)** that tilts with gravity and drains smoothly during Balak's `drinkBowl` action in Scene 05, revealing the whole creamy spongy coconut *fopra* (`#F4EAD5`) resting inside; accompanied by two halved green coconuts (`#4E7D38`) on the floor.
5. **`GhibliBrassDhupDani`:** Traditional Bengali handheld brass incense burner with curved handle, glowing orange-red charcoal embers (`#E0531C`), and procedural rising sepia-cream watercolor smoke curls (`lifeF`-driven).
6. **`GhibliPujaBell`:** Small turned-brass handbell held in Charu's (Scene 01) and Bhagabati Thakur's (Scene 05) right hand with wrist-shake oscillation synced to `temple_bell_small.wav`.
7. **`GhibliAntsLine` (Scene 06 Cutaway):** 8–10 tiny sepia-ink ants animated along a gentle bezier curve on `ants_cutaway_vignette_sketch.png`, each carrying a tiny white painted rice grain away from `GhibliWoodenAhladiDoll`'s mouth!

---

## 4. Complete Google AI Studio Voice Script (100% Ready to Generate)

- **Workspace:** `https://aistudio.google.com/generate-speech`
- **Model:** `gemini-3.8-flash-tts`
- **Save all `.wav` files into:** `03_Episodes/Episode_04_Idols_and_Coconut_Water/02_Audio/Voice_WAVs/`
- **Total Voice Blocks:** 30 WAV files (Narrator is **only 6 short blocks**; **24 blocks are lively character dialogue!**)

### Block 00 — Series Intro
- **00_Intro.wav** | `01_Narrator_Kathak` | Style: `Cheerful, bright, welcoming Bengali children's show announcer.`
  > ছোটদের বালক ঠাকুরের গল্প। <short pause> পর্ব চার: শিবলিঙ্গ, গোবিন্দ ও নারিকেলোদক।

---

### Story 1 — মাটির শিবলিঙ্গ ও কাঠের পুতুল (Scene 01)

- **01a_Narrator_Morning.wav** | `01_Narrator_Kathak` | Style: `Warm, gentle, light storybook morning tone.`
  > মেদিনীমণ্ডলের বৈদিক বাড়ি। রোজ সকালে মা চারুশীলা মাটির শিবলিঙ্গ গড়ে পূজো করেন—আর পাঁচ বছরের বীরু অবাক হয়ে দেখে।

- **01b_Charu_Shock.wav** | `05_Charu` | Style: `Startled gasp turning into flustered, scolding motherly alarm.`
  > অ্যাঁ! একি কাণ্ড! আমার মাটির শিব কোথায় গেল? <short pause> থালায় ওটা কী—গলৈয়ার কাঠের পুতুল?! ওরে বীরু! বীরু কোথায় গেলি?

- **01c_ElderBrother_Report.wav** | `02_Gopal_Boy1` | Style: `Breathless, excited older brother reporting mischief.`
  > মা, ধরে এনেছি! কই, শিব তো দেখলাম না—দেখলাম ও শিবের মাটিটা হাতে পাকিয়ে গোল গোল লাড্ডু বানাচ্ছে!

- **01d_Charu_Scold.wav** | `05_Charu` | Style: `Exasperated, worried traditional mother, hands on hips.`
  > ওরে দুষ্টু ছেলে, ঠাকুরের শিবলিঙ্গ নিয়ে কেউ খেলা করে? তোর কি একটুও ভয়-ডর নেই?

- **01e_Balak_ClayLogic.wav** | `12_Balak_Thakur_Child` | Style: `Completely calm, innocent, logical, smiling 5-year-old boy.`
  > মা, তুমি তো রোজ ক্ষেতের মাটির ঢেলা আনিয়ে শিব গড়ে পুজো করে ঘরের পেছনে ফেলে দাও! তখন তো চটো না? <short pause> আমি তো শুধু ওটা নিয়ে খেলছি, আর বদলে আমার রঙচঙে পুতুলটা তো তোমায় দিয়ে গেলাম—ওটা আর ফেলতে হবে না!

- **01f_Jyethi_Remark.wav** | `06_Manorama_Devi` | Style: `Shaking head in half-shocked, gossiping aunt tone.`
  > চারু, তোর ছেলেটা তো বড্ড ঠেটা! বাড়ির আর সবার দেব-দেবীতে কত ভক্তি—আর তোর বীরুর একটুও ভয় নেই!

- **01g_Charu_FlashbackIntro.wav** | `05_Charu` | Style: `Sighing with mixed exasperation and motherly awe, lowering voice to tell a story.`
  > কী আর বলব দিদি! সেদিন তুমি ছিলে না—আমার পাঁচ বছরের ছেলে কী বুকের পাটা নিয়ে ঠাকুরঘর থেকে পিতলের গোবিন্দ মূর্তি নিয়ে পালাল, শুনলে অবাক হবে!

---

### Story 2 — পুকুরপাড়ে গোবিন্দ ও ঠাকুরমার ভবিষ্যদ্বাণী (Scenes 02, 03, 04)

- **02a_Balak_ToMangla.wav** | `12_Balak_Thakur_Child` | Style: `Playful, matter-of-fact, proud 5-year-old explaining to a friend.`
  > জানিস মংলা, এতদিন ছোট ছিলাম বলে কাঠের পুতুল নিয়ে খেলতাম। এখন তো বড় হয়েছি—তাই আজ পিতলের পুতুলটা নিয়ে খেলব, আর কাল পাথরের গোপালটাকে নিয়ে আসব! <short pause> জ্যেঠামশায়রাও তো ওদের স্নান করান, খাওয়ান—ঠিক আমার পুতুলের মতো!

- **02b_Balak_DealMangla.wav** | `12_Balak_Thakur_Child` | Style: `Quick, cheeky whisper hearing footsteps from the house.`
  > এই মংলা, বাড়িতে খোঁজ পড়েছে! তুই এক কাজ কর—এই পুতুলটা সুন্দর জ্যেঠাকে দিয়ে আমার কাঠের পুতুলটা নিয়ে আয় তো!

- **02c_Mangla_Panic.wav** | `14_Mangla_Servant` | Style: `Comedically terrified, high-pitched rural Bengali gasp while running away.`
  > ওরে বাবা! ঠাকুরের গোবিন্দ ছুঁলে আমার হাত খসে পড়বে যে! আমি পালালাম—বাপ রে বাপ!

- **03a_Family_Shout.wav** | `03_Rama_Boy2` | Style: `Urgent, loud shouting from across the pond bank.`
  > ওই তো বীরু! ওই হতচ্ছাড়া, গোবিন্দ দিয়ে যা—এক্ষুনি আয় বলছি!

- **03b_Balak_Standoff.wav** | `12_Balak_Thakur_Child` | Style: `Fearless, firm, mischievous warning, holding ground.`
  > না, যাব না—তোমরা বকবে! <short pause> এই, এসো না বলছি! আর এক পা এলেই আমি কিন্তু এটা পুকুরে ছুঁড়ে ফেলে দেব!

- **03c_Sundar_Coax.wav** | `08_Sundar_Thakur` | Style: `Very gentle, sweet, diplomatic uncle coaxing a child with a smile.`
  > আরে থামো সবাই, যেও না! <short pause> শোনো বীরু, তুমি তো খুব লক্ষ্মী ছেলে! গোবিন্দটা আমায় দিয়ে দাও—তোমায় মেলা থেকে আরও একটা নতুন পুতুল কিনে দেব, কেমন?

- **03d_Balak_Negotiate.wav** | `12_Balak_Thakur_Child` | Style: `Calm, smart little negotiator.`
  > দিতে পারি—যদি তোমরা আমায় কিছু না বলো। আর আগে আমার কাঠের পুতুলটা এখানে এনে দাও!

- **03e_Runner_Handover.wav** | `03_Rama_Boy2` | Style: `Panting slightly after running, holding out the wooden doll.`
  > এই নে তোর কাঠের পুতুল! দে, এবার গোবিন্দ দে!

- **03f_Balak_ToSundar.wav** | `12_Balak_Thakur_Child` | Style: `Sweet, trusting, smiling warmly at Sundar uncle.`
  > না, তোমাকে দেব না—সুন্দর জ্যেঠাকে দেব! <short pause> এই নাও জ্যেঠা।

- **04a_Harendra_Grumble.wav** | `10_Grumpy_Relative` | Style: `Stern, exasperated elder shaking his head in the courtyard.`
  > কী যে কালাপাহাড় এল আমাদের ঘরে! ঠাকুর-দেবতা কিচ্ছু মানছে না! হুকুম দিচ্ছি—ওকে যেন আর কোনোদিন ঠাকুরঘরে ঢুকতে দেওয়া না হয়!

- **04b_Thakurma_Prophecy.wav** | `11_Thakurma` | Style: `Warm, deeply proud, wise, resonant grandmotherly voice with awe.`
  > তোরা ওকে যতই কালাপাহাড় বলিস—দেখিস, <short pause> এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!

---

### Story 3 — পূর্ণিমার অভিষেক ও নারিকেলোদক (Scenes 05, 06)

- **05a_Narrator_Abhishek.wav** | `01_Narrator_Kathak` | Style: `Quiet, devotional, slightly playful storyteller.`
  > সেদিন পূর্ণিমার বিশেষ অভিষেক। ঠাকুরঘরে ঢোকা বারণ—তাই বীরু চুপচাপ বারান্দায় বসে পুরোহিত ঠাকুরের পূজো দেখছে।

- **05b_Bhagabati_Dhoop.wav** | `07_Bhagabati_Thakur` | Style: `Busy, slightly impatient elder priest calling out during ritual.`
  > ধূপ! <short pause> আরে, ধূপ কই? কেউ কি নেই নাকি?

- **05c_Balak_AskDhoop.wav** | `12_Balak_Thakur_Child` | Style: `Soft, polite, eager little voice from the doorway.`
  > ঠাকুরমশায়, আমি ধূপ দেব?

- **05d_Bhagabati_Huhu1.wav** | `07_Bhagabati_Thakur` | Style: `Absent-minded, hurried muttered agreement while chanting.`
  > হুঁ হুঁ, দে—তাড়াতাড়ি দে।

- **05e_Balak_AskSit.wav** | `12_Balak_Thakur_Child` | Style: `Innocent, sweet little request.`
  > ঠাকুরমশায়, আমি একটু ঘরে বসব?

- **05f_Bhagabati_Huhu2.wav** | `07_Bhagabati_Thakur` | Style: `Completely absorbed in mantra, waving hand absent-mindedly.`
  > হুঁ হুঁ, বোস… এতে গন্ধে পুষ্পে…

- **06a_Balak_CoconutConfess.wav** | `12_Balak_Thakur_Child` | Style: `Completely cheerful, satisfied, innocent 5-year-old.`
  > ঠাকুরমশায়, আপনার ঠাকুর তো মুখ দিয়ে খায় না—তাই আমি নারকেলের জলটা খেয়ে ফোপড়াটা ওর জন্য রেখে দিয়েছি!

- **06b_Bhagabati_Explode.wav** | `07_Bhagabati_Thakur` | Style: `Shocked, loud, flustered, comically indignant priest.`
  > অ্যাঁ?! সর্বনাশ! ওরে সবাই এসে দ্যাখ—বাবুর ছেলেটা ঠাকুরভোগের সব নারকেলের জল খেয়ে এঁটো ফোপড়াটা ঠাকুরের জন্য রেখে দিয়েছে!

- **06c_Balak_AntsLogic.wav** | `12_Balak_Thakur_Child` | Style: `Wide-eyed, genuinely trying to calm the priest down, sweet & funny.`
  > ও ঠাকুরমশায়, আপনি চেঁচাচ্ছেন কেন? আচ্ছা, ফোপড়াটা না হয় আপনিই খেয়ে ফেলুন, আমি কাউকে বলব না! <short pause> আরে পুতুল কি আর খায়? আমার পুতুলকে খাওয়াতে মুখে পেরেক দিয়ে ফুটো করেছিলাম—তবুও খেল না, সব তো পিঁপড়েরা খায়!

- **06d_Family_ScoldShrine.wav** | `06_Manorama_Devi` | Style: `Rushing in, scolding in disbelief.`
  > ওরে বীরু, তোকে এত বারণ করা হলো, তবু তুই ঠাকুরঘরে ঢুকলি কেন? তোর একটুও ভয় নেই?

- **06e_Balak_LegalDefense.wav** | `12_Balak_Thakur_Child` | Style: `Completely calm, honest, matter-of-fact smile.`
  > আমি তো ইচ্ছে করে ঢুকিনি! ধূপ দেওয়ার কেউ ছিল না—আমি তো ঠাকুরমশায়কে জিজ্ঞেস করেই ভেতরে ঢুকেছি!

---

### Block 99 — Closing Moral & Episode 5 Teaser
- **99_Outro_Sequential.wav** | `01_Narrator_Kathak` | Style: `Serene, warm, smiling storyteller, then curious for the teaser.`
  > ভয়ের আচারে নয়—সরল সত্য আর জীবন্ত প্রাণের প্রতি ভালোবাসাতেই সত্যিকারের পূজো সম্পূর্ণ হয়। <short pause> ছোটদের বালক ঠাকুরের গল্প—আসছে পরের পর্ব: কচ্ছপ খেলা ও গাভী রক্ষা! কলাবাগিচায় বাঁশ হাতে হরিচরণের সামনে দাঁড়িয়ে ছোট্ট বীরু কীভাবে অসহায় গাভীকে বাঁচাল, দেখুন পরের পর্বে!


---

## 5. Scene-by-Scene Complete Visualization, Shot List, Blocking, Pauses & VFX

> **Legend:** `AG` = Action Gap (story moves wordlessly, drives choreography on story clock); `P` = Pause (story holds 1–2 s, breathing/blinks/breeze/ambient continue on `lifeF`); `CB` = Chapter Break (`CAM-10`: fade to black, 1 s hold, soft chime, fade in). All faces & key props framed **above `y = 820`**.

---

### Intro & Source Card (0:00 – 0:26 | ~624 f)
- **Visuals:** Series template (`TTL-02`–`TTL-06`): saffron-orange gradient, gold pill `পর্ব চার`, title `শিবলিঙ্গ, গোবিন্দ ও নারিকেলোদক` animated word-by-word, golden sparkles, followed by centered book-page Source Attribution card. No captions on title page.
- **Audio:** `00_Intro.wav` + `00a_Source_Attribution.wav`; `Theme_Intro_Bansuri` (`0.14` open / `0.08` under voice); `chime_pop` (`0.30`).

---

### Scene 01 — `01_clay_shiva_swap` (Morning Courtyard: Clay Shiva & Wooden Doll)
- **Set & Grade:** `CourtyardBack` + `CourtyardFloor` + `TulsiMancha` (Morning Grade: cool-warm diagonal sun, soft dust motes, sparrow on tulsi-tala).
- **Duration:** ~62 s (~1,488 f)

| Shot / Beat | Audio / Timing | Framing & Camera (`CAM-13`) | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **AG1 (World Open, 2.5 s)** | Wordless (`STO-22`) | **Held Wide:** Full morning courtyard; veranda plinth at center-left with Charu's brass *tata*, `ClayShivalinga`, diya & bell; Balak seated at right holding `WoodenAhladiDoll` in his lap | Sparrow hops on tulsi-tala and flies off; Charu lights diya and rings tiny brass bell; Balak watches with wide, curious, calm eyes (slow blink) | VFX: thin incense smoke curl, morning dust motes. SFX: `birds_village` (0.20), `temple_bell_small` (0.22) |
| **Shot 1** | `01a_Narrator_Morning` | **Medium Two-Shot** (cut on line): Charu doing puja at left, Balak seated at right watching intently | Charu finishes offering a bel leaf, joins palms, and bows forward into a deep kneeling `pranam` (forehead to veranda floor, eyes closed) | Bed: `Village_Peace_Loop` (-37 LUFS under voice), `tanpura_drone` |
| **AG2 (The Swap, 3.5 s)** | Wordless comedy beat | **Medium Close on Plate & Hands** (slow push `1.0 → 1.15x` as he reaches): `y < 800` | Balak rises onto his knees (`kneelReach`), leans silently to the brass *tata*, lifts `ClayShivalinga` with his left hand, sets bright `WoodenAhladiDoll` right in the center of the plate with a distinct **brass clink**, and scoots back calmly rolling the clay Shiva into a smooth round ball (`ClayBall`)! | SFX: `cloth_rustle` (0.15), **`wood_on_brass_tap` (0.28)** (triggers Charu's head lift!), `clay_pat` (0.18). Music: `cheeky_pluck_3` + `tabla_soft` tiptoe |
| **Shot 2 + P1 (1.0 s)** | `01b_Charu_Shock` | **Close-Up on Charu** (cut 6 f before line) → **Insert Cut** to the gaudy `WoodenAhladiDoll` sitting proudly on the sacred brass plate! | Charu's head snaps up at the tap; hand flies to mouth on *"অ্যাঁ!"*; eyes dart from the smiling painted doll to the empty spot where Balak was | SFX: `cheeky_pluck_1` swarmandal flurry on the doll insert! |
| **Shot 3** | `01c_ElderBrother_Report` | **Medium Wide:** Courtyard right arch | Elder Brother marches in holding Balak gently by the wrist; Balak walks calmly, happily rolling the round `ClayBall` between both palms | SFX: `footsteps_floor` (0.20) |
| **Shot 4** | `01d_Charu_Scold` | **Medium Two-Shot:** Charu kneeling/bending at Balak's eye level, hands on hips | Charu's brows knit, wagging a finger gently (NO hitting); Balak completely unbothered, faint serene smile | Bed: `birds_village` (0.10) |
| **Shot 5 + P2 (1.5 s)** | `01e_Balak_ClayLogic` | **Medium Close-Up on Balak** (cut 6 f before line; gentle push `1.0 → 1.15x` on *"আমার রঙচঙে পুতুলটা"*) | Balak holds up the `ClayBall`, gestures openly toward the backyard on *"ঘরের পেছনে ফেলে দাও"*, then gestures sweetly toward the painted doll on *"ওটা আর ফেলতে হবে না!"*. In **P2**, cut to Charu pressing her palm to her forehead in helpless disbelief | Music: light tender `play_plucks` rising in P2 |
| **Shot 6** | `01f_Jyethi_Remark` | **Medium Shot:** Jyethi standing by the veranda pillar, shaking head | Jyethi raises eyebrows dramatically, hand on cheek; Charu glances over at her | SFX: `cloth_rustle` (0.15) |
| **Shot 7 + P3 (1.5 s)** | `01g_Charu_FlashbackIntro` | **Medium Close on Charu** → slow **Cross-Dissolve (36 f, `CAM-09`)** into Scene 02's daytime pond | Charu sighs with a half-smile of awe and leans in to tell Jyethi the Gobinda story; sunlight warms into the flashback | Music: `Warm_Family_Flute` enters softly over dissolve |

---

### Scene 02 — `02_gobinda_and_mangla` (Pond Bank: Brass Gobinda & Servant Mangla)
- **Set & Grade:** `VedicPondDay` (bright late-morning sun, brick ghat left, emerald pond reflections, red blooming *mandar* tree right, `BaidikBariDay` roofline across water).
- **Duration:** ~32 s (~768 f)

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **AG3 (Pond Open, 2.0 s)** | Wordless (`STO-22`) | **Held Wide** of `VedicPondDay`: red *mandar* petals drifting onto the green water; Balak seated under the tree turning `BrassGobinda` in the sunlight; servant Mangla crouching nearby with a gamchha | A red *mandar* blossom drops onto the grass beside Balak; ripples spread on the pond; Balak examines the shiny brass flute-player with delighted curiosity | VFX: falling red petals, animated water ripple rings. SFX: `pond_water_lap` (0.16), `birds_village` (0.20), `blossom_plop` (0.18) |
| **Shot 8** | `02a_Balak_ToMangla` | **Medium Two-Shot** under the *mandar* tree: Balak at right holding `BrassGobinda`, Mangla at left wide-eyed | Balak holds up `BrassGobinda` proudly; mimics bathing/feeding gestures playfully; Mangla's eyes grow wider and wider in sheer superstitious terror | Music: playful `play_plucks` + light `tabla_soft` |
| **AG4 (Distant Shouts, 1.2 s)** | Wordless cue | **Same Two-Shot** | Faint muffled shouts echo from `BaidikBariDay` across the pond! Balak's ears perk up; he leans conspiratorially toward Mangla | SFX: `distant_family_calls_muffled` (0.16) |
| **Shot 9** | `02b_Balak_DealMangla` | **Medium Close on Balak** (cut 6 f before line) | Balak holds `BrassGobinda` out toward Mangla with both hands (`offerUp`), cheeky innocent whisper | — |
| **Shot 10 + P4 (1.2 s)** | `02c_Mangla_Panic` | **Medium Wide** (cut on Mangla jumping backward!) | Mangla recoils as if the brass idol were hot fire, waves both hands frantically, drops his gamchha, grabs it, and **sprints off left** in a comical dust puff! In **P4**, Balak watches him run with an amused blink | VFX: tiny cartoon-realistic dust puff at Mangla's heels. SFX: `footsteps_mud_run` (0.30), `cheeky_pluck_2` |

---

### Scene 03 — `03_pond_standoff_and_rescue` (Pond Bank Standoff & Sundar Jyetha's Rescue)
- **Set & Grade:** `VedicPondDay` (continuous from Scene 02).
- **Duration:** ~48 s (~1,152 f)

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **Shot 11** | `03a_Family_Shout` | **Wide Bank Shot:** Left brick ghat — Sundar Jyetha, Charu, and 2–3 cousins rush into frame pointing across to the *mandar* tree | Two cousins start dashing along the bank toward Balak; Charu holds her sari hem anxious | SFX: `footsteps_mud` (0.28), `birds_scatter_wings` (0.20) |
| **Shot 12 + P5 (1.5 s)** | `03b_Balak_Standoff` | **Medium Shot on Balak** (standing at water's edge, `StandingChild` plate rig) → **Quick Cut** to the rushing family **freezing mid-stride**! | Balak stands calmly by the water, holding `BrassGobinda` out over the pond edge! On *"পুকুরে ছুঁড়ে ফেলে দেব!"*, the cousins skid to a halt, hands up, mouths open in horror; Charu gasps | SFX: `drum_hit_low` soft comic sting (0.22) on the freeze! |
| **Shot 13** | `03c_Sundar_Coax` | **Medium Close on Sundar Jyetha** (cut 6 f before line) | Sundar waves the cousins back, steps forward gently, bends slightly with spectacles glinting and a warm coaxing smile, palms open | Music: `Warm_Family_Flute` fades in softly |
| **Shot 14** | `03d_Balak_Negotiate` | **Medium Close on Balak** (cut 6 f before line) | Balak lowers `BrassGobinda` safely to his chest (`holdInLap`), tilts head slightly, logical and calm | — |
| **AG5 (The Sprint, 2.0 s)** | Wordless action | **Wide Shot:** Sundar nods to the Runner Cousin, who sprints back toward `BaidikBariDay` and dashes back holding bright `WoodenAhladiDoll` | Fast, comical run along the bank; water glints | SFX: `footsteps_mud_run` (0.25), light `tabla_soft` |
| **Shot 15** | `03e_Runner_Handover` | **Medium Two-Shot:** Runner Cousin panting, thrusting `WoodenAhladiDoll` toward Balak and reaching for `BrassGobinda` | Balak takes his beloved wooden doll happily with one hand, but pulls `BrassGobinda` away from the cousin! | — |
| **Shot 16 + P6 (2.0 s)** | `03f_Balak_ToSundar` | **Two-Shot (Balak & Sundar):** Slow gentle push `1.0 → 1.12x` as Balak walks two steps and hands `BrassGobinda` cleanly into Sundar's two waiting hands | Sundar draws `BrassGobinda` to his chest with deep relief and smiles down at Balak; in the background, Charu lets out a visible sigh of relief (`MOT-20`). **Slow Cross-Dissolve (40 f)** to Scene 04 afternoon courtyard | SFX: `cloth_rustle` (0.15). Music: `Warm_Family_Flute` swells warmly then dims over dissolve |

---

### Scene 04 — `04_kalapahar_to_kailashpati` (Afternoon Courtyard: The Prophecy — Sacred Beat)
- **Set & Grade:** `CourtyardBack` + `CourtyardFloor` (Afternoon warm amber grade; family seated on *madur* mats on veranda).
- **Duration:** ~30 s (~720 f)

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **Shot 17 + P7 (1.0 s)** | `04a_Harendra_Grumble` | **Medium Wide Group:** Harendra Thakur at left gesturing sternly; Charu & Jyethi listening; Thakurma seated calmly at center-right; Balak seated quietly near Thakurma's knees hugging `WoodenAhladiDoll` | Harendra shakes his head firmly and points a warning finger on *"ঠাকুরঘরে ঢুকতে দেওয়া না হয়!"* Everyone nods gravely—except Thakurma, who smiles knowingly | Music: `tanpura_drone_low` + single soft `drum_hit_low` |
| **Shot 18** | `04b_Thakurma_Prophecy` (part 1: *"তোরা ওকে যতই কালাপাহাড় বলিস—"*) | **Medium Close on Thakurma** (cut 6 f before line) | Thakurma turns warmly to the family, eyes shining with quiet certainty, resting a loving hand on Balak's shoulder | Music: C layers fade out cleanly; C# `tanpura_drone_cs` enters |
| **Shot 19 + P8 (2.5 s) [KEY BEAT]** | `04b_Thakurma_Prophecy` (part 2: *"এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!"*) | **Close-Up on Balak** (cut on *"এই কালাপাহাড়ই"*, slow push `1.0 → 1.28x`, held through **P8**) | Balak lifts his calm, luminous half-lidded eyes (`BAL-12`) toward Thakurma with a serene, knowing half-smile; slow blink (`BAL-14`). In the last 1 s of P8, cut briefly to Charu's glistening, moved eyes (`CAM-12`) | **VFX (Episode's ONLY Glow Beat, `BAL-11`):** Balak's soft warm-white halo + golden rim light brighten gently; 4 slow golden motes rise. SFX: `soft_magical_shimmer` (0.16). Music: **`Divine_Motif` (C#)** swells gently! |

### **Chapter Break (`CB1`, 1.2 s | 29 f)**
- Fade to black (12 f) → Hold black (8 f) + soft `temple_bell_drop` / chime (0.20) → Fade in (12 f) to Scene 05.

---

### Scene 05 — `05_dhoop_and_coconut_water` (Full-Moon Abhishek: The Dhoop & One-Gulp Heist)
- **Set & Grade:** Veranda Arcade (`CourtyardBack` dusk/moonlit outside) ↔ `ThakurGhar` Interior (warm flickering brass oil-lamp light inside, `BrassGobinda` back on the carved *khat*, `StoneBowlAndFopra` in front).
- **Duration:** ~52 s (~1,248 f)

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **AG6 (World Open, 2.5 s)** | Wordless (`STO-22`) | **Wide Split-Depth Shot:** Through the open shrine arch — inside, warm oil lamps flicker as Bhagabati Thakur performs evening abhishek; Thakurma sets `BrassDhupDani` just outside the doorway and walks away into the courtyard; Balak sits cross-legged on the veranda just outside the forbidden threshold, watching intently | Incense smoke curls lazily upward; oil-lamp flame flickers softly; Balak's eyes follow every ritual movement | VFX: warm lamp flicker, animated incense smoke curl. SFX: `temple_bell_small` (0.24), `evening_crickets_soft` (0.12) |
| **Shot 20** | `05a_Narrator_Abhishek` | **Medium Shot on Balak (Veranda):** Seated neatly outside the threshold line, chin slightly up, looking inside | Balak glances at the doorway line (remembering he is forbidden) and sighs softly, staying obediently outside | Music: warm `tanpura_drone` (C) |
| **Shot 21 + P9 (1.0 s)** | `05b_Bhagabati_Dhoop` | **Medium Interior (`ThakurGhar`):** Bhagabati Thakur seated at puja, right hand holding a flower, looking around impatiently | He calls out; **P9** holds on the empty veranda—nobody answers! | Music: tanpura dips to floor in P9 (comic silence) |
| **Shot 22** | `05c_Balak_AskDhoop` | **Medium Close on Balak (Doorway):** Leaning forward slightly, peeking around the doorframe | Polite, eager eyes; one hand gently touching the handle of `BrassDhupDani` | — |
| **Shot 23** | `05d_Bhagabati_Huhu1` | **Over-Shoulder Interior:** Bhagabati Thakur not even turning around, waving his left hand absent-mindedly | Balak rises (`StandingChild`), carries smoking `BrassDhupDani` carefully across the threshold and places it right beside the priest! | SFX: tiny `footsteps_floor` (0.14), `brass_set_down` (0.20) |
| **Shot 24** | `05e_Balak_AskSit` + `05f_Bhagabati_Huhu2` | **Two-Shot Interior:** Balak standing politely beside the priest, pointing down at the floor; priest nodding with eyes half-closed chanting *"এতে গন্ধে পুষ্পে…"* | Balak sits down cross-legged right in front of the deity *khat*! | Music: `cheeky_pluck_3` (mischief seeded!) |
| **AG7 (The Coconut Water Heist, 5.0 s)** | Wordless Suspense-Comedy! | **Insert Close-Up** on `StoneBowlAndFopra` gleaming in lamplight → **Medium Close on Balak** (slow push `1.0 → 1.18x`) | Balak's eyes widen softly at the brimming stone bowl. While Bhagabati Thakur's back is half-turned ringing the bell, Balak lifts the wide grey stone bowl with **both hands (`drinkBowl`)**, tilts it up, and **drinks EVERY DROP in one long, smooth gulp** (liquid level drops cleanly)! He wipes his mouth delicately with the back of his hand, sets the bowl with the whole *fopra* neatly back in its exact spot, and sits back completely content! | Music: **`tension_rise`** (rising tabla + low dhol roll, 1.5 s) cresting at the lip → **`cheeky_pluck_2`** 5-note swarmandal release on the gulp! SFX: **`drink_gulp` (0.30)**, `stone_bowl_set` (0.22) |

---

### Scene 06 — `06_priest_uproar_and_ants` (The Priest's Uproar, Ant Cutaway & Legal Defense)
- **Set & Grade:** `ThakurGhar` Interior + quick 2.5 s comic visual cutaway (pastel vignette of `WoodenAhladiDoll` with ants).
- **Duration:** ~48 s (~1,152 f)

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX & SFX |
|---|---|---|---|---|
| **Shot 25 + P10 (1.0 s)** | `06a_Balak_CoconutConfess` | **Medium Two-Shot (`ThakurGhar`):** Balak smiling cheerfully at the priest; Bhagabati Thakur turning to reach for the coconut water bowl | Balak points casually at the empty bowl with the lonely *fopra*. In **P10**, Bhagabati Thakur stares into the bone-dry bowl, his face slowly turning bright red! | SFX: `temple_bell_drop` comic clink (0.18) as priest's bell freezes |
| **Shot 26** | `06b_Bhagabati_Explode` | **Medium Close on Bhagabati Thakur** (cut 6 f before line) | Arms thrown up in comic shock, white mustache twitching, shouting toward the courtyard doorway! | Music: quick comic `tabla_soft` flurry |
| **Shot 27 + Cutaway** | `06c_Balak_AntsLogic` | **Medium Close on Balak** → **2.5 s Comic Vignette Cutaway** on *"আমার পুতুলকে খাওয়াতে…"* → back to Balak | Balak leans forward earnestly, gesturing toward the *fopra* to offer it to the priest! **Cutaway Visual:** Soft feathered dream-vignette showing `WoodenAhladiDoll` on a veranda floor with tiny painted grains of rice near its mouth and a neat line of tiny black ants happily carrying the rice away! Back to Balak shrugging innocently | VFX: soft feathered memory-vignette border (no box). SFX: tiny playful `santoor_plink` on the ants! |
| **Shot 28** | `06d_Family_ScoldShrine` | **Wide Interior/Doorway:** Jyethi, Charu, and Sundar rush to the shrine doorway in alarm | Jyethi wags a finger; Charu covers her face half-embarrassed, half-amused; Sundar hides a smile behind his spectacles | SFX: `footsteps_floor` (0.22) |
| **Shot 29 + P11 (2.5 s) [Afterglow]** | `06e_Balak_LegalDefense` | **Medium Close on Balak** (cut 6 f before line; slow push `1.0 → 1.12x`) → **Reaction Cut** in P11 to Bhagabati Thakur blinking speechlessly, realizing he *did* say *"হুঁ হুঁ"*! | Balak points politely toward Bhagabati Thakur with an open palm and gives his serene, fearless smile. Sundar chuckles softly; even Charu can't hold back a tiny smile | Music: tender **`bansuri_compassion`** swells warmly in P11, settling on Sa before the fade to Outro |

---

### Block 99 — Closing Sunset & Episode 5 Glimpse (~26 s | ~624 f)
- **Visuals:** Series template (`TTL-09`, `TTL-10a`): Padma sunrise/sunset over water, series title, captions; soft feathered boxless glimpse of **Episode 5** (6-year-old Balak seated gently stroking the calm white Bengal zebu cow in the banana grove, `STO-19`/`BAL-26b`).
- **Audio:** `99_Outro_Sequential.wav`; `padma_river_day` (0.15); `Theme_Intro_Bansuri` (0.08 under voice, 0.14 open); `soft_magical_shimmer` at `0.12` (`AUD-08a`).

---

## 6. Complete Audio Architecture (Beds, Music Cues & SFX Sourcing)

### A. Ambient Beds (Loops, `≤ 0.25`, Ducked Under Voice)
| Scene | Bed File (`public/audio/`) | Under Voice | In Pause / AG |
|---|---|---|---|
| **01** (Morning Courtyard) | `sfx/ep02/birds_village.wav` + `sfx/ep02/wind_soft.wav` | `0.10` / `0.06` | `0.20` / `0.12` |
| **02–03** (Daytime Pond) | `sfx/ep02/birds_village.wav` + `sfx/ep04/pond_water_lap.wav` *(or `sfx/river_water.wav`)* | `0.10` / `0.08` | `0.20` / `0.16` |
| **04** (Afternoon Courtyard) | `sfx/ep02/birds_village.wav` + `sfx/ep02/wind_soft.wav` | `0.08` / `0.06` | `0.18` / `0.12` |
| **05–06** (Evening Shrine) | `ambient/bengal_night_crickets.wav` *(soft)* + `sfx/ep02/wind_soft.wav` | `0.08` / `0.05` | `0.14` / `0.10` |
| **99** (Outro) | `ambient/padma_river_day.wav` | `0.10` | `0.16` |

### B. One-Shot SFX List (All Volumes `0.15–0.45`)
- **Already in Repo:** `chime_pop.wav`, `temple_bell_drop.wav`, `soft_magical_shimmer.wav`, `sfx/ep02/cloth_rustle.wav`, `sfx/ep02/footsteps_floor.wav`, `sfx/ep02/footsteps_mud.wav`, `sfx/ep02/clay_thud.wav`, `sfx/ep02/water_splash.wav`.
- **New CC Recordings to Source (`sfx-from-commons` skill, save in `public/audio/sfx/ep04/`):**
  1. `wood_on_brass_tap.wav` — crisp wooden doll tap onto brass plate (Scene 01 AG2).
  2. `clay_pat.wav` — soft clay-rolling pats (Scene 01 AG2).
  3. `temple_bell_small.wav` — gentle handheld brass puja bell (Scenes 01 & 05).
  4. `pond_water_lap.wav` — gentle still pond lapping (Scenes 02–03).
  5. `blossom_plop.wav` — light petal/blossom landing (Scene 02 AG3).
  6. `drink_gulp.wav` — clear gentle drinking gulp (Scene 05 AG7).
  7. `stone_bowl_set.wav` — stone bowl set cleanly on floor (Scene 05 AG7).
  8. `birds_scatter_wings.wav` — soft fluttering wings when family runs to pond (Scene 03).

### C. Indian Instrument Music Cues (`public/audio/music/ep05/` + `music/`)
1. **Scene 01:** `Village_Peace_Loop` + `tanpura_drone` (C) → `cheeky_pluck_3` + `tabla_soft` (swap) → `cheeky_pluck_1` (Charu shock) → `play_plucks` (Balak's clay logic).
2. **Scenes 02–03:** `tanpura_drone` (C) + `play_plucks` (Mangla talk) → `cheeky_pluck_2` (Mangla runs) → `drum_hit_low` (pond freeze) → `Warm_Family_Flute` (Sundar coaxing & relief).
3. **Scene 04:** `tanpura_drone_low` + `drum_hit_low` (Harendra grumble) → crossfade to C# `tanpura_drone_cs` + **`Divine_Motif`** (Thakurma's prophecy & glow beat).
4. **Scenes 05–06:** `tanpura_drone` (C) → `cheeky_pluck_3` (Balak asks to sit) → `tension_rise` + `cheeky_pluck_2` (coconut water gulp!) → `santoor_plink` (ants cutaway) → `bansuri_compassion` (legal defense & smiling afterglow).

---

## 7. Agent Execution Checklist (Ghibli Pipeline — Exact Files to Build)

1. **Voice Generation:** Generate all 31 WAVs from Section 4 in Google AI Studio → save to `03_Episodes/Episode_04_Idols_and_Coconut_Water/02_Audio/Voice_WAVs/` → run `python scripts/normalize_audio.py` (`-16 LUFS / -1.5 dBTP`) → copy to `remotion_studio/public/audio/ep04/`.
2. **Ghibli Plate Generation & Processing:**
   - Generate all raw watercolor plates & `#FFFFFF` cutouts from Section 3.3 into `remotion_studio/public/images/ghibli_ep04/raw/`.
   - Create `scripts/ghibli_pipeline/manifests/ep04_ghibli.json` matching Section 3.3 and run:
     `python C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/prepare_episode_plates.py --manifest C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/manifests/ep04_ghibli.json`
   - Verify generated `src/ghibli_pipeline/episode04/plateAnchors.ts` and zero white halos on `tree_mandar_bloom_sketch.png`, `deity_khat_shrine_sketch.png`, and `tulsi_mancha_ep04_sketch.png`.
3. **SFX & Subtitles:** Source the 8 CC SFX files into `remotion_studio/public/audio/sfx/ep04/` (measure RMS dBFS on quiet reactions per `ghibli-pipeline` rule 6; credit in `docs/AUDIO_CREDITS.md`); generate source SRT via `scripts/generate_srt.py`.
4. **Timing Generator:** Create/update `scripts/build_ep04_ghibli_timing.js` with all 6 scenes, 11 pauses (`P1`–`P11`), 7 action gaps (`AG1`–`AG7`), and 1 chapter break (`CB1`) → generate `src/ghibli_pipeline/episode04/timing.ts` and `subtitles.ts`.
5. **Remotion Ghibli Code (Strictly Isolated in `src/ghibli_pipeline/episode04/`, 1 agent per file):**
   - `Ep04GhibliProps.tsx` (all 7 zero-float ink-styled SVG props from Section 3.4)
   - `Ep04GhibliCast.tsx` (reused `CAST.charu`, `SUNDAR`, `THAKURMA`, `CAST.bhagabati`, `ElderBrother` + new `Mangla` & `Harendra`, all wrapped in `#ghibli-char-ink` with `safeBodyTurn`)
   - `Scene01ClayShivaGhibli.tsx` through `Scene06PriestUproarGhibli.tsx` (using `<GhibliStage>`, 8-layer depth stack, `zoomProportionalDof`, `withFootLockedSteps`, `ghibliWalkSpot`, and upstage *mandar*-tree occlusion)
   - `Episode04Ghibli.tsx` (master composition + `SCENE_BEDS`, `MUSIC_CUES`, SFX triggers)
   - Register `Episode04GhibliFull` in `src/ghibli_pipeline/registry.ts` and `src/Root.tsx`.
6. **QA & Chunked Render:** Run `tsc --noEmit` → preview on `http://localhost:3100` & render QA stills/contact sheets into `04_Video_Assembly/Ghibli_Test_Render/` → director approval → run `scripts/ghibli_pipeline/render_ghibli_episode.sh Episode04GhibliFull <TOTAL_FRAMES> ...` → export final SRT.
