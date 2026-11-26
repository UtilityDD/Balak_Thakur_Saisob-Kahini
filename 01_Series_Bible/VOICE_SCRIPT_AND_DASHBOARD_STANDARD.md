# Voice Script & Generation Dashboard Standard (Series Master)
## পরম বিস্ময় বালক ঠাকুর — অডিও প্রোডাকশন স্ট্যান্ডার্ড

> **Status:** APPROVED & STANDARDIZED (2026-11-26). All future episodes (Episodes 6 through 19) must follow this two-part specification for voice scripts and manual generator dashboards.

---

## 1. Google AI Studio Preset Voice Persona Mapping

When generating voices in Google AI Studio (`https://aistudio.google.com/generate-speech`), use `gemini-3.8-flash-tts` (or `gemini-3.8-flash-lite-tts`). Select or search for the exact matching preset voice name below:

| Series Character | Internal ID | AI Studio Preset Voice | Pitch & Tone Attributes | Role Continuity |
|---|---|---|---|---|
| **Narrator (কথক)** | `01_Narrator_Kathak` | **`Enzo`** | Low pitch, crisp, warm, affectionate children's audiobook storyteller | Series narrator across all 19 episodes |
| **Balak Thakur (বীরু)** | `12_Balak_Thakur_Child` | **`Sola`** | High pitch, gentle, sweet, innocent, fearless calm smile in voice | Protagonist (ages 5–6) |
| **Charu (মা চারুশীলা দেবী)** | `05_Charu` | **`Cleo`** | Mid-high pitch, soft, delicate, emotional rural Bengali mother | Mother, recurring |
| **Surendra (বাবা সুরেনবাবু)** | `04_Babukaka` | **`Achird`** | Warm resonant baritone, kind, patient father | Father, recurring |
| **Teen / Youth (বিনয়, কিশোর)** | `15_Binoy_Teen` | **`Puck`** | Middle pitch, upbeat, energetic, excitable teenage boy | Binoy (Ep 5), playmates |
| **Rustic / Angry Hand (হরিচরণ)** | `17_Haricharan` | **`Fenrir`** | Low pitch, earthy village accent, quick-tempered, blustering & comic | Haricharan (Ep 5), village hands |
| **Elder Clerks / Scholars (বড়বাবু)**| `10_Grumpy_Relative` | **`Charon`** | Low pitch, dry, slightly nasal, fussy elderly Bengali man | Senior clerk (Ep 5), conservative elders |
| **Theatrical Clerks / Muhuri** | `18_Kachari_Muhuri` | **`Zephyr`** | Middle pitch, sharp-tongued, dramatic, rapid-talking conclusions | Junior clerk (Ep 5), gossips |
| **Maternal Elders (জেঠিমা / মা)** | `06_Manorama_Devi` | **`Tova`** | Warm, mature maternal, grounded East Bengal tone | Manorama Devi, neighbor aunts |
| **Head Priests (পুরোহিত ঠাকুর)** | `07_Bhagabati_Thakur` | **`Orus`** | Deep, dignified elder priest voice, traditional scholarly cadence | Head priest (Ep 4, Ep 16) |

---

## 2. Standardized Voice Script Markdown Format (`*_AI_Studio_Voice_Script.md`)

Every episode must have a dedicated manual script located at:
`03_Episodes/Episode_XX_<Name>/01_Script_and_Storyboard/Episode_XX_AI_Studio_Voice_Script.md`

### Markdown Entry Template:

```markdown
### [Index]. `[Filename.wav]`
- [ ] **Save As:** `[Filename.wav]`
- **Character:** [Character Name (Bengali & English)]
- **AI Studio Voice:** **`[VoiceName]`**
- **Style Box:**
```text
[Emotional direction, pacing, vocal expression, max 1-2 lines]
```
- **Speech Box:**
```text
[Bengali dialogue or narration with <short pause> tags]
```
```

### Voice Script Writing Rules:
1. **`<short pause>` Tag:** AI Studio TTS recognizes `<short pause>` natively. Use it between clauses to introduce natural 0.45s breath breaks.
2. **Natural Bengali Syntax:** Ensure verb tenses match historical narrative flow (e.g. past imperfect "খেলছিল", "বলল", not translated English present continuous "চলছে").
3. **One-Line Caption Break Alignment:** Break long sentences with commas, dashes, or `<short pause>` so no phrase exceeds 44 characters for Baloo Da 2 subtitles (`TTL-14`).
4. **Target Directory Standard:** All downloaded voice files must be stored into:
   `03_Episodes/Episode_XX_<Name>/02_Audio/Voice_WAVs_Full_Rewrite/`

---

## 3. Interactive Voice Generation Dashboard HTML Standard

Alongside the Markdown file, each episode must have an interactive, self-contained HTML dashboard:
`03_Episodes/Episode_XX_<Name>/01_Script_and_Storyboard/Episode_XX_Voice_Generator_Dashboard.html`

### Required Dashboard Capabilities:
1. **One-Click Clipboard Copying:**
   - `Copy Voice`: Copies preset voice name (`Enzo`, `Sola`, etc.).
   - `Copy Style`: Copies the text from the Style Instructions box.
   - `Copy Bengali`: Copies the Bengali dialogue text.
   - `Copy Filename`: Copies the `.wav` filename for zero-mistake saving.
   - `Copy All`: Copies the combined data block.
2. **Persistent Progress Tracking:**
   - Clickable checkboxes on every card.
   - Progress bar at the top with percentage and count (`X / Total completed`).
   - Saved automatically to browser `localStorage` keyed by episode (`balak_thakur_epXX_voices_progress`).
3. **Smart Filtering:**
   - Character filters (Narrator, Balak, Charu, etc.).
   - Status filters (Pending vs Completed).
4. **Standalone & Responsive:**
   - 100% self-contained (embedded CSS and JS; uses Google Fonts `Inter` + `Baloo Da 2`).
   - Works immediately offline and across desktop Chrome, Edge, and tablets.

---

## 4. Automated Generation Tool (`scripts/generate_voice_dashboard.py`)

To generate the HTML dashboard automatically for any episode from its script markdown file, run:

```bash
# Generate dashboard for Episode 5:
python scripts/generate_voice_dashboard.py --episode 5

# Or specify custom markdown file:
python scripts/generate_voice_dashboard.py --input path/to/Episode_XX_AI_Studio_Voice_Script.md
```

This ensures complete consistency across all future episodes of Balak Thakur.
