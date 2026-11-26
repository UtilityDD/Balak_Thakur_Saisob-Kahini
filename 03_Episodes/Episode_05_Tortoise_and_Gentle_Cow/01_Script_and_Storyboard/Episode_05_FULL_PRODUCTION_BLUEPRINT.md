# Episode 5 — Full Production Blueprint (Ghibli Rewrite) — DRAFT for the director's approval
## পর্ব ৫: কচ্ছপ খেলা ও গাভী রক্ষা (The Tortoise & The Gentle Cow)

> **Status: DRAFT, written 2026-11-26. Nothing here is approved, recorded or coded.** The director's answers to section 9
> ("Open questions for the director") turn it into the approved plan. Until then the delivered Episode 5
> (`Final_Render/Episode_05_Tortoise_and_Gentle_Cow.mp4`, 2,849 f, STO-20/20a/20b) and the Ghibli Episode 5 test stay as they are.
> **Purpose:** One document an agent team can follow to record every voice, source every sound and music cue, paint
> every new plate, build the Ghibli scenes and assemble the rewritten Episode 5. Format follows
> `Episode_04_FULL_PRODUCTION_BLUEPRINT.md`.
> **Brief (STO-23, director 2026-11-26):** the new Ghibli concept of Episode 4: **more conversation, less narration.**
> "Consult the original book content for details. Do not restrict length. Keep a natural language tone."
> **Source fidelity:** `01_Script_and_Storyboard/Ep05_Book_Source_Text.md` (book.xlsx rows 14-15): chapter আট
> (*কচ্ছপের সাথে শিশু ঠাকুরের খেলা*) and chapter নয় (*গাভীকে প্রহার থেকে রাক্ষাকল্পে শিশুর সংকল্প*). The book's
> own direct speech is used verbatim or lightly modernised wherever it exists. Every line the book only narrates or
> clearly implies is marked **[implied]** so the director can check it. No invented events, no changed facts (STO-22).
> **Target specs:** 1920×1080, 24 fps, **about 6 min 28 s (about 9,320 frames)**, Bengali voices, Baloo Da 2
> one-line captions (TTL-14). Today's delivered cut is 1:58.8; the growth comes from the book's own content
> (chapter 9's opening, Binoy's account, the full exchange with Haricharan, the kachari gossip), not from padding.

---

## 1. Standing Rules & Creative Guardrails (Must Follow)

- **Balak's design (`BAL-26`, `BAL-26e`, `BAL-26f`, `BAL-01`–`BAL-14`):** about **six** for the whole episode (the
  book: "সবেমাত্র পাঁচ বছর পেরিয়ে ছয় বছরে পা দিয়েছে", ch. 9; ch. 8 sits between the five-year-old chapters and
  this one; STO-20 "one design, about six"). Light golden skin (cheek about `#f4d1a7`), short straight dark hair with
  a side part, large dark almond eyes with a catchlight, white chadar over both shoulders and upper arms with one chest
  wrap, white dhoti, barefoot. **No tilak, bangles, anklets, jewellery or sacred thread.** Proposed: the Ghibli
  Episode 4 look (`ep04BalakLook.ts`, `Ep04BalakDivine.tsx`) is extended to Ghibli Episode 5 (BAL-26f is opt-in for
  Ghibli Episode 4 only today: question Q1).
- **Seated, not bent over (`STO-20b`):** Balak sits cross-legged for the whole tortoise play, the bite and Charu's
  hand check, in the present and in Binoy's flashback. He walks (`StandingChild`, healthy build, BAL-26c/26d) only
  when he slips out (scene 01) and between his quiet places (scene 03).
- **Divine light (`BAL-05`–`BAL-14`, `MOT-20`):** on Balak only (never on a tortoise, the cow, a prop or another
  person). Soft warm-white halo behind the head that fades out, faint warm rim, faint ground glow, 3–4 slow motes; it
  never pulses with breathing. **Two gentle brightenings only, one per story (as STO-20):** P3, the unmarked hand;
  P9, the cow lowering her muzzle to him.
- **Balak's nature (`BAL-22`, STO-23):** calm, simple, unhurried, a gentle eye-smile (never a grin). He is never
  preachy: his words to Haricharan are the book's own, said plainly, not as a sermon. With the tortoise he is
  playful and unafraid ("ছাড়লি না, ছাড়লি না—দাঁড়া, দেখাচ্ছি মজা!" is a child's teasing, not anger).
- **Tone (`STO-22`, STO-23):** warm, gently funny where the book is (the tortoise tug, Binoy's sheepishness,
  Haricharan's bluster, the clerks' escalating guesses), tender in chapter 9's opening. Speech is natural 1890s East
  Bengal village and kachari Bengali, short sentences.
- **Children's handling of chapter 9's opening:** the book says everyone scolded and beat him ("তাড়ন ও পীড়ন",
  "মারধর"). Here: one verbal scolding line, the narrator names the beatings once in a soft half-line, **no hitting
  is shown** (question Q9).
- **Haricharan (`STO-20`, decision 9):** a kachari hand of about 30 who grew the cucumbers; angry bluster, never
  menace: he never swings the bamboo at the child or the cow. Eye-level camera, no handheld, no low angle.
- **Children grow with the timeline (`CHR-09`):** size order in every frame: Balak (six), then Binoy (14–15, about
  one and a half heads taller), then the adults.
- **Camera grammar (`CAM-01`–`CAM-14`):** every move has a story reason and starts on its line; at most one move per
  sentence; about 2 s of hold between moves; close-ups cut 6–8 f before the speaker; faces and key action above
  `y = 820`; no background edge (`kachariKeepInSet`); background calmer than the subjects.
- **Captions (`TTL-14`):** always ONE line. Every line below is written so that each piece between natural breaks
  (danda, `!`, `?`, dash, comma, `<short pause>`) is at most about 44 Bengali characters (longest piece: 44).
  Inner thoughts are captioned in the same style with the chip `বীরু (মনে মনে)` (question Q12).
- **Audio levels (`AUD-01`–`AUD-09`):** voices `-16 LUFS / -1.5 dBTP`; ambient loops `≤ 0.25` (ducked to
  `0.08–0.12` under voice, `0.18–0.24` in pauses); one-shot SFX `0.15–0.45`; music from the AUD-09 library
  (`public/audio/music/ep05/`), 12–18 dB under dialogue while someone speaks, rising to about -22 LUFS in wordless
  moments; outro sparkle at `0.12` (`AUD-08a`).

### 1.1 Book-to-screen map (what the book says, how it is told)

| Book (ch.) | Told by | Notes |
|---|---|---|
| "কৃষ্ণনগর কাছারি।" (8) | Narrator 01a over the kachari wide | The kachari as the father's workplace is from ch. 4 (STO-20) |
| "শিশু বেশ একটু দুষ্টুমি শিখে উঠেছে। একটু ফাঁক পেলেই সবার চোখ এড়িয়ে টুক করে বেরিয়ে যায়। তাই সব সময় তাকে চোখে চোখে রাখতে হয়।" (8) | Narrator 01a (first sentence); Charu 01b and Surendra 01c **[implied]** | Voiced as the family's chat |
| "সেদিন সবাই মিলে বেশ গল্প গুজব করছে। ঐদিন কখন যে শিশু বেরিয়ে গেছে কেউ তা লক্ষ্য করেনি।" (8) | Picture (AG2: he slips out behind them) + Narrator 01d | |
| "হঠাৎ পাশের বাড়ী থেকে বিনয়ের চীৎকার শোনা গেল 'হায় হায়, গেল গেল, হাতটা গেল'!" (8) | **Binoy 01e, book verbatim** | Binoy now speaks (STO-20 kept him silent: Q4) |
| "চীৎকার শুনে সবাই দৌড়ে এসেছে সেই দিকে" (8) | Charu 01f, Surendra 01g **[implied]**, AG4 the run | |
| "…একটা কচ্ছপ শিশুর হাত কামড়ে ধরেছে" (8) | Surendra 02a **[implied]** | |
| "দু'তিন জন দৌড়ে গিয়েছে বালকের হাত ছাড়িয়ে দিতে, কিন্তু দেখা গেল কচ্ছপ ততক্ষণে হাত ছেড়ে দিয়েছে" (8) | Charu 02b **[implied]** + AG5 (picture) | The tortoise has already let go when the hands arrive |
| "শিশুর হাতে কচ্ছপের কামড়ের কোন ক্ষত বা দাগ নাই।" (8) | Charu 02c **[implied]** + the hand insert | Glow beat 1 |
| "বিনয়কে জিজ্ঞেস করে ব্যাপারটা জানা গেল।" (8) | Surendra 02d **[implied]** | |
| Binoy's account: "বা'র থেকে ফিরছিল… কোণের ঘরের দিকে শব্দ শুনে… সুরেন কাকার বাচ্চা ছেলে বীরু কালকের কেনা কচ্ছপগুলো উল্টে উল্টে দিচ্ছে… চুপ করে দাঁড়িয়ে দেখছিল… লেজ ধরে পাশে ধরে নানাভাবে উল্টে দিচ্ছে… লেজ মনে করে… শুঁড় ধরেই ওল্টাতে গেছে, অমনি কচ্ছপটা শিশুর হাত কামড়ে ধরেছে" (8) | **Binoy 02e–02g [implied: the book's narrated account in his own mouth]**, over a flashback | |
| "আর শিশু বলছে 'ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।'" (8) | **Balak 02h, book verbatim** | STO-20 left it out (no recording): Q5 |
| "এমন সময় বিনয় চীৎকার করে উঠেছিল।" (8) | Binoy 02i **[implied]** | |
| "বালক সবেমাত্র পাঁচ বছর পেরিয়ে ছয় বছরে পা দিয়েছে… চতুষ্পার্শ্বের রীতিনীতি বালকের নিজস্ব গতিবিধির সাথে খাপ খাচ্ছে না।" (9) | Narrator 03a | STO-20 left chapter 9's opening out: Q9 |
| "…খেয়াল, অবহেলা, জড়ত্ব, দুষ্টুমি ইত্যাদি নাম দিয়ে বালককে অযথা তাড়ন ও পীড়ন… মারধর… আরও বেশী উদাসীনতার দিকে" (9) | Surendra 03b **[implied]**; Narrator 03c | Verbal only on screen |
| "হয় কলাবাগিচায়, না হয় মাঠের শেষে দেবদারু গাছের নীচে, না হয় নদীর ধারে জামগাছতলায় বসে।" (9) | Narrator 03d + montage of the three places | Two new plates (section 3.3) |
| "বরং বালক কোন একটা কিছু করে আবার একটা সাংঘাতিক অবস্থার সৃষ্টি যে করছে না তাতেই সবাই খুশী।" (9) | Charu 03e **[implied]** | Speaker is our choice: Q10 |
| "সেদিন বালক কাছারী ঘরের পেছনে কলাবাগিচায় বসে খেলা করছে।" (9) | Narrator 04a | "দুপুরে" added to match STO-20's afternoon light |
| "হরিচরণ একটা বাঁশ নিয়ে এসে বালককে জিজ্ঞেস করছে, 'গরুটা কোন দিকে গেছে দেখেছিস?'" (9) | **Haricharan 04b, book verbatim** ("এই বীরু!" added) | |
| "'হরিচরণদা, কি হয়েছে?'" (9) | **Balak 04c, book verbatim** | |
| "বিরাট একটা শশা গাছ, একটা ঝাঁকাতে বেয়ে… ডগায় কচি বড় বহু শশা। গাভীটা শুধু শশাই খায়নি, গাছটির মূলও উচ্ছেদ করেছে।" (9) | Haricharan 04d **[implied: the narrated facts as his answer]** + AG10 (picture) | |
| "বালক ঠিকই জানতো গাভীটা কোথায় রয়েছে। কিন্তু সে ভাবল, এখন যদি সে বলে দেয়, তা হলে তো একেবারেই ওর দফা রফা হবে।" (9) | AG10 (he sees her hide) + **Balak's inner voice 04e [book thought]** | Inner voice or narrator: Q11 |
| "সে নিতান্ত নিরীহ ভাব দেখিয়ে চুপ করে আছে।" (9) | P7 (picture) | |
| "উত্তেজিত হরিচরণ আবার জিজ্ঞেস করছে, 'তাড়াতাড়ি বল কোন দিকে গেছে?'" (9) | **Haricharan 04f, book verbatim** (first half [implied]) | |
| "'জানি' বললে গাভীটি ভীষণ মার খায়, আর 'জানি না' বললেও 'সত্য' যায়। কিন্তু তাতো চলবে না, গাভী এবং সত্য দুটোকেই রাখতে হবে।" (9) | **Balak's inner voice 04g [book narration as thought]** + P8 | |
| "সে বলল, 'দেখলেও বলবো না… আমি ওর খবর বলতে পারবো না।'" (9) | **Balak 04h, 04j, 04k, book verbatim** (split in three, one Haricharan reaction 04i [implied] between) | |
| "উত্তেজিত হরিচরণ অধিকতর উত্তেজিত হয়ে চলে গেল।" (9) | Haricharan 04l **[implied]** + AG12 | |
| "কাছারির সেরেস্তায় এ নিয়ে বেশ খানিকটা জল্পনা কল্পনা চলল" (9) | Haricharan 05a **[implied]** brings the tale to the clerks | |
| "এর মধ্যে একজন বলছে, 'মনে হয় ও খেতেও দেখেছে।'" (9) | **Senior clerk 05b, book verbatim** | |
| "আরেকজন—তিনি একটু চরমপন্থী লোক, তিনি বললেন, 'ও নিজে ধরে নিয়েও খাইয়ে আসতে পারে।'" (9) | **Junior clerk 05c, book verbatim** (lead-in [implied]) | |
| "সুরেনবাবুর এই ছেলেটি যে বিষয়বুদ্ধিহীন একটি অদ্ভূত পদার্থ, তা সেদিন বুঝতে কারো আর বাকী রইল না।" (9) | Senior clerk 05d **[implied, near-verbatim]**, Haricharan 05e **[implied]**, narrator 99 | |

**Our staging, not in the book (all approved before in STO-20 or marked new):** the cow coming to Balak and him
stroking her (STO-20, P9); the tortoises beside a tipped bamboo basket by the corner room (STO-20); Balak's
leaf left on the mat as a motif (new, AG2/Shot 4); the closing wordless moment under the jam tree by the river at
sunset (new, AG14: a place the book names, at a time we choose).

---

## 2. Complete Cast, Rigs, Costumes & Voice Design Table

| # | Character | Caption Chip | Visual Rig / Costume | Voice Speaker ID | Voice Design Prompt (Google AI Studio `gemini-3.8-flash-tts`) |
|---|---|---|---|---|---|
| 1 | **Narrator (Kathak)** | *(none — `TTL-08`)* | Off-screen | `01_Narrator_Kathak` | *(Saved series voice)* Warm, soothing Bengali storyteller in early 40s, affectionate children's audiobook cadence. |
| 2 | **Balak Thakur (Biru, about 6)** | `বীরু`; inner voice `বীরু (মনে মনে)` | `SeatedChild design="plate"` (scenes 01–05) and `StandingChild build="healthy"` (walks in 01 and 03), BAL-26e/26f look (Q1) | `12_Balak_Thakur_Child` | *(Saved series voice)* Clear, sweet, innocent young Bengali boy, calm, fearless, unhurried smile in the voice. Style boxes say "six-year-old". |
| 3 | **Charu (Charushila Devi)** | `মা` | `CAST.charu` Puppet: white sari, red border, sindoor, thin alta (`CHR-01`–`03`); kneel and two-hand hold of Balak's hand (exists in Ghibli Ep 5 scene 01) | `05_Charu` | *(Saved series voice)* Soft-spoken mid-20s rural Bengali mother. |
| 4 | **Surendra (Suren-babu, the father)** | `বাবা` | `CAST.surendra` (shared copy of Ep 2's `SURENDRA`): white kurta, calf-length dhoti, brown shawl, wooden khadam on the veranda (Ep 6 continuity) | `04_Babukaka` | *(Saved series voice)* Kind, gentle early-30s Bengali father, warm baritone. Style boxes raise the urgency or impatience per line. |
| 5 | **Binoy (বিনয়, 14–15)** | `বিনয়` | `CAST.binoy` (exists): short dark hair, unbleached cotton fatua, knee-length dhoti, jute bag over the shoulder | `15_Binoy_Teen` *(NEW, flagged)* | `A bright, quick-talking rural East Bengali teenage boy of about fourteen, voice just beginning to deepen, earnest, excitable and a little sheepish, natural village Bengali.` |
| 6 | **Haricharan (হরিচরণ, about 30)** | `হরিচরণ` | `CAST.haricharan` (exists): lean, dark-skinned, thin mustache, bare-chested, dhoti hitched up (মালকোঁচা), red-white checked gamchha, bamboo pole (`rProp "bamboo"`) | `17_Haricharan` *(NEW, flagged; replaces the old `10_Grumpy_Relative` take)* | `A wiry rural East Bengali working man around thirty, earthy village accent, mid-low pitch, quick-tempered and blustering but comic, never menacing.` |
| 7 | **Senior kachari clerk (বড়বাবু)** | `বড়বাবু` | **New Puppet:** late-50s clerk, round steel spectacles, white dhoti and fatua, a shawl, a reed pen behind the ear, seated at a low desk with red cloth-bound ledgers | `10_Grumpy_Relative` *(reuse, flagged)* | *(Saved series voice)* Slightly nasal, fussy 60s Bengali man, dry tone. Fits the dry "মনে হয়…" |
| 8 | **Junior kachari clerk (মুহুরিবাবু, the "চরমপন্থী")** | `মুহুরিবাবু` | **New Puppet:** early-40s, thin, oiled hair with a centre parting, quick eyebrows, a palm-leaf fan (তালপাখা) in hand | `18_Kachari_Muhuri` *(NEW, flagged)* | `A sharp-tongued, theatrical Bengali estate-office clerk in his early forties, slightly nasal and emphatic, fond of jumping to dramatic conclusions, crisp East Bengal accent.` |
| 9 | **Binoy's mother** | *(silent)* | `CAST.womanA`, at her door in the background of scene 02 (STO-20) | — | — |
| 10 | **The four tortoises** | — | `cinematic/animals/Tortoise.tsx` (exists: turned-over state, bite and release keys) | SFX only | — |
| 11 | **The cow (গাভী)** | — | `cinematic/animals/GentleCow.tsx` (exists: walk, trot, graze, tug, muzzle lower) | SFX only | No bell while she hides. |

**Voice ID numbering note:** `14_` is used twice in the repo (`14_Mangla_Servant` in Ghibli Episode 4,
`14_Ananda_Master` in the Episode 8 script) and `16_Nasiruddin_Haji` is taken, so the new voices take `15`, `17`
and `18` (question Q3). Add them to `01_Series_Bible/AI_Studio_Voice_Design_Master.md` and
`Voice_Settings_and_IDs.csv` only after approval.

---

## 3. Studio Ghibli Watercolor + Sepia-Ink Visual Pipeline (Full Plate, Cutout, Prop & Multiplane Spec)

> **Pipeline isolation (`ghibli-pipeline` skill):** never overwrite `src/episode05/*`, the delivered `Final_Render/`
> or the Ghibli test. The rewrite lives in `remotion_studio/src/ghibli_pipeline/episode05/` (today it reads the
> delivered `src/episode05/timing`; the rewrite gets its own `timing.ts` / `subtitles.ts` there, as Episode 4 did),
> plates in `public/images/ghibli_ep05/`, voices in `public/audio/ep05_ghibli/`, manifest
> `scripts/ghibli_pipeline/manifests/ep05_ghibli.json`, QA stills to `04_Video_Assembly/Ghibli_Test_Render/`.

### 3.1 Mandatory Ghibli Rendering & Motion Standards (All 5 Scenes)
1. **Character sepia-ink contour (`#ghibli-char-ink`):** `<GhibliCharFilterDefs />` in every character
   `<GhibliLayer>`; every `<Puppet>`, `<SeatedChild>`, `<StandingChild>` wrapped in
   `<g filter="url(#ghibli-char-ink)">`. Balak's face via `GhibliBalakFaceDetail`, aura via `GhibliBalakAura` /
   `GhibliBalakGroundGlow` (no outline or glow around the whole body, BAL-26f).
2. **Zoom-proportional depth of field:** `cam.dof = zoomProportionalDof(cam.zoom)` (`0.28` on wides → `1.85` on
   close-ups of Balak's face, the bitten hand, the torn cucumber root, the clerk's ledger).
3. **Zero-slip, foot-locked motion (`ghibliMotion.ts`):** walks and runs (Balak slipping out, the family running in
   scene 01, Binoy coming home in the flashback, Balak walking in scene 03, Haricharan's run-in and stomp-off,
   Haricharan climbing the kachari steps) use `ghibliWalkSpot()` + `ghibliStrideOf()`; standing people shift through
   `withFootLockedSteps()` with `<ContactShadow>` at `POS.x + ACT(f).bodyX`; `|bodyTurn| ≤ 0.36` (`safeBodyTurn()`)
   whenever both arms show.
4. **Never float (`MOT-01`–`MOT-07`):** Charu's two hands hold Balak's hand every frame while she turns it; the
   tortoise's jaws stay on the side of his hand until the release key; Haricharan's bamboo is the Puppet's own
   `rProp`, held every frame; the cow's muzzle meets Balak's raised palm.
5. **Upstage occlusion:** the cow hides behind `banana_clump_sketch` (only an ear and tail between the trunks);
   Balak slips out behind Charu's back and through the fence gap behind the `prop_bamboo_fence` run; Haricharan
   passes behind the trellis posts.
6. **Flashback look (scene 02, Binoy's account):** the same corner set in a warmer, slightly lighter grade with a
   soft feathered vignette (no box, no wipe), entered and left by a 24 f cross-dissolve (`CAM-09`).

### 3.2 Exact 10-Plane Cinematic Multiplane Parallax Stack

| Depth Plane | Parallax / Blur | Kachari compound & family veranda (Sc 01, 03 yard) | Neighbour's corner room (Sc 02 + flashback) | Grove behind the kachari (Sc 03a, 04) | Field's end, riverbank, kachari veranda (Sc 03 montage, 05) |
|---|---|---|---|---|---|
| `0.08` | Sky + slow clouds (`parallaxDrift=+0.004`) | `sky_kachari_morning.png` | `sky_kachari_morning.png` (warmer in flashback) | `sky_grove_afternoon.png` | `sky_village_late_morning.png` (ep06, field), `sky_village_sunset.png` (ep06, river at AG14), `sky_grove_afternoon.png` (veranda) |
| `0.26` | Far horizon (`extraBlur=1.2`) | `far_trees_sketch.png` | `far_trees_sketch.png` | `far_trees_sketch.png` | Far bank and sandbank in `riverbank_jam_back.png` (NEW); `far_trees_sketch.png` |
| `0.45` | Mid-far architecture | `kachari_front_sketch.png` (left), thatch of the family house beyond the fence | `mud_house_main_sketch.png` (Binoy's house) | `kachari_back_wall_sketch.png` | `village_field_edge_back.png` (ep06); `kachari_veranda_inside_sketch.png` (NEW) |
| `0.58` | Primary set back | `ujanchar_veranda_back.png` (ep06, the family veranda) | `mud_house_corner_sketch.png` (the corner room, thatch eave) | Back wall, back door, `CucumberTrellis` (SVG) against it | `riverbank_jam_back.png` water band with animated glints |
| `0.68` | Light & haze | Late-morning sun shafts (`GhibliSunShafts`), dust motes (`GhibliAtmosphericHaze`) | Same, warmer and hazier in flashback | Dappled light through banana leaves, slow-moving leaf shadows | Long sunset rays over the water (AG14); afternoon slant into the veranda (Sc 05) |
| `0.78` | Upstage occluders & micro-life (`groundLocked`) | `tree_mango_sketch.png` + squirrel; `prop_bamboo_fence` run with the gap | `prop_tipped_jhanka.png`, `UjancharKolshi`, crow on the fence | `banana_clump_sketch.png` (the cow's hiding place), butterflies over the cucumber flowers | `tree_debdaru_sketch.png` (NEW), `tree_jamun_sketch.png` (NEW); clerk desk `prop_clerk_desk.png` |
| `0.92` | Floor & static props | `yard_earth_floor_sketch.png`, `madur_mat_veranda_sketch.png` (ep04), the leaf | `yard_earth_floor_sketch.png`, the tortoises' scrape marks | `grove_floor_sketch.png`, pebbles, bitten cucumbers, torn root | `field_floor.png` (ep06); `riverbank_floor_sketch.png` (NEW) with fallen purple jamun fruit |
| `1.00` | Hero plane (crisp) | Charu, Surendra, Balak (`#ghibli-char-ink`), hens | Balak, four tortoises, Charu, Surendra, Binoy, Binoy's mother (door) | Balak, Haricharan, the cow | Balak (montage, AG14); Haricharan and the two clerks (Sc 05) |
| `1.14` | Near-foreground framing (`extraBlur=1.4`) | Veranda post edge | Thatch eave edge, hanging gourd | Banana leaf edges framing over-the-shoulder shots | Veranda pillar edge (Sc 05); reeds at the river edge |
| `1.30` | Extreme foreground bokeh (`extraBlur=3.8`) | `GhibliForegroundBokeh` mango leaves | Grass blades | Banana leaf tip gliding on lateral moves | Debdaru leaves; river reeds |

### 3.2b Per-Scene Parallax, Rack-Focus & Living-World Choreography (STO-22b life layer)
- **Scene 01 (kachari compound → family veranda, late morning):** AG1 opens on the held kachari wide (pigeons lift
  off the tiled roof, a clerk dips his reed pen, the mango tree stirs), then a **motivated lateral truck right**
  (`cam.x: -80 → +120`) past Binoy's house, where the **tipped basket and the tortoises are planted small by the
  corner room**, through the fence gap to the family veranda. Life: hens pecking in the yard, a sparrow on the thatch
  eave, a squirrel down the mango trunk, a towel on the line lifting. Balak slips out in **deep staging** behind his
  chatting parents (they stay sharp, he goes soft at `0.92`, then a **rack focus** to the empty mat and the leaf).
- **Scene 02 (the corner room):** arrival in a held wide with the family entering through the fence gap; hens
  scatter. The hand check is a **macro insert** (`zoom 3.2×`, `dof 1.7`). Binoy's flashback: warmer grade, vignette,
  a slow **push in** on Balak's smiling play (STO-20a), the bite on a hard cut, then back to the present by
  dissolve. Life: dragonfly over the earth, a crow on the fence, a clay kolshi sweating in the shade, the tortoises'
  heads poking in and out.
- **Scene 03 (montage):** three still places, each a held wide with **one slow push** at most: the grove (banana
  leaves lift and settle), the field's end under the debdaru (a kite bird circles high, grass waves), the riverbank
  under the jam tree (a sail far off, a kingfisher dive, fallen jamun fruit). Cross-dissolves 30 f.
- **Scene 04 (the grove, warm early afternoon):** deep grove planes; the cow's hiding clump at `0.78` right; the
  trellis at `0.58` left; the camera never favours the clump while Haricharan is there (the viewer knows; he does
  not). Balak's inner-thought shots: **slow push** into his eyes (`1.0 → 1.6×`), leaves only behind him. Life: two
  white butterflies over the yellow cucumber flowers, a sunbird at the hanging banana flower, moving leaf shadows,
  the cow's ear flicking between trunks.
- **Scene 05 (kachari veranda, later afternoon):** a three-shot staged in depth (Haricharan standing below the plinth
  edge, the junior clerk mid, the senior clerk at the desk); **rack focus** between the clerks on the two guesses.
  Life: pigeons cooing on the roof edge, a ledger page lifting in the breeze, the junior clerk's palm-leaf fan, dust
  in the slant light. AG14 dissolves to the riverbank at sunset.

### 3.3 Complete Ghibli Plate & Cutout Manifest (`ep05_ghibli.json`)

**Reused, already painted (no new work):**
- `public/images/ghibli_ep05/`: `sky_kachari_morning`, `sky_grove_afternoon`, `far_trees_sketch`,
  `yard_earth_floor_sketch`, `grove_floor_sketch`, `kachari_front_sketch`, `kachari_back_wall_sketch`,
  `mud_house_main_sketch`, `mud_house_corner_sketch`, `tree_mango_sketch`, `banana_clump_sketch`,
  `prop_tipped_jhanka`, `prop_bamboo_fence`, `prop_clerk_desk`, `prop_khadam_sandals`, `watercolor_paper_grain`,
  `card_intro_bg_sketch`, `card_source_bg_sketch`, `card_outro_padma_sketch`, `glimpse_ep06_veranda_sketch`.
- `public/images/ghibli_ep06/` (same village, Ujanchar): `ujanchar_veranda_back` (the family veranda),
  `sky_village_late_morning`, `sky_village_sunset`, `village_field_edge_back`, `field_floor`, `bamboo_clump`,
  `prop_clay_kolshi`, `prop_low_stool`, `prop_bamboo_basket`.
- `public/images/ghibli_ep04/`: `madur_mat_veranda_sketch` (the mat the parents sit on).
- Code sets and props already built: `GhibliKachariSet.tsx` (backdrop, floor, wall, trees, fence runs, banana clumps,
  tipped basket), `KrishnanagarKachari` (`CucumberTrellis`, `trellisPoint`, `kachariKeepInSet`), `Tortoise`,
  `GentleCow`, `PebblesArt`, `UjancharKolshi`, `UjancharBush`.

**New images (6), Gemini, logged as in `Ep06_Ghibli_Asset_Sheet.md`.** Style prefix (every image):

> Studio Ghibli–style hand-drawn watercolour and gouache background illustration on warm cold-press watercolour
> paper, delicate sepia and charcoal pencil linework, visible paper tooth, rural East Bengal village in the 1890s,
> humble mud-walled houses with thatched roofs, bamboo, banana and mango trees, no characters, no people, no
> animals, no text, no watermark, 16:9.

Cutout suffix: *isolated on a pure solid #FFFFFF white background, whole object centred with a clean margin on all
sides, no cast-shadow puddle on the white paper.*

| # | File (raw/) | Kind | Size | Prompt (after the prefix) | Used in |
|---|---|---|---|---|---|
| 1 | `riverbank_jam_back.png` | panorama (2–3 panels) | 5040×1320 | A quiet earthen riverbank at a Bengal village: a wide slow brown-green river, a pale sandbank on the far side with a thin line of trees, one small country boat with a patched sail far off, the near bank low with grass and exposed roots, open space on the right for a large tree. Soft light from the left. Eye-level from a seated child's height. | 03 montage, AG14 |
| 2 | `riverbank_floor_sketch.png` | panorama floor | 5440×1200 | Ground-level perspective of a grassy riverbank: short grass, bare earth patches, a few roots, scattered fallen dark-purple jamun fruits and leaves, horizon at the very top edge, clean feathered upper edge. | 03 montage, AG14 |
| 3 | `tree_jamun_sketch.png` | cutout | 1400 px tall | An old jamun (black plum) tree with a thick gnarled dark trunk, low spreading branches and dense glossy dark-green leaves, a few clusters of dark-purple fruit. Side view. *(cutout suffix)* | 03 montage, AG14 |
| 4 | `tree_debdaru_sketch.png` | cutout | 1500 px tall | A tall slender Bengal debdaru tree (Polyalthia longifolia, the "false ashoka"): a straight column-like crown of long drooping wavy narrow leaves, standing alone at the edge of a village field. *(cutout suffix)* | 03 montage |
| 5 | `kachari_veranda_inside_sketch.png` | plate | 3840×2160 (4K for close-ups) | Inside the deep front veranda of a modest 1890s Bengal estate office (kachari): lime-washed walls with damp stains, a dark wooden door and a barred window, a low wooden takhtaposh covered with a white sheet and a long bolster, two low clerk's writing boxes, stacks of red cloth-bound ledgers, brass inkpots with reed pens, square lime-plaster pillars at the frame edges with a sunlit earth compound beyond, warm afternoon light slanting in from the right. Humble, not grand. | 05 |
| 6 | `props_sheet_ep05b.png` | sheet | 2560×1440 | A neat sheet of separate kachari and village props on white: a stack of red cloth-bound ledgers, an open ledger with handwritten Bengali-like scribble lines (no readable text), a brass inkpot with two reed pens, a palm-leaf hand fan, a jute shoulder bag, three young green cucumbers (two bitten), a torn cucumber vine with its root and earth. Each well spaced. *(cutout suffix)* | 02, 04, 05 |

No new plate is needed for the grove, the corner room, the family veranda, the field's end or the cards.

### 3.4 Interactive Zero-Float Ink-Styled SVG Props (`src/ghibli_pipeline/episode05/Ep05GhibliProps.tsx`)
Every prop that is held, turned, torn, bitten or handed is an ink-styled SVG (`stroke="#3A2618"`,
`strokeWidth={1.6}`, warm wash gradients) pinned to IK points, never a cutout:
1. **Tortoises ×4** (`Tortoise.tsx`, exists): T1 turned onto its back by tail and side, legs paddling, righted;
   T2 the biter (head shoots out on "লেজ ভেবে… শুঁড়টা", jaws on the outer edge of the hand below the little finger,
   release as the first hand arrives in AG5); T3, T4 plodding. No blood, wound or mark, ever.
2. **Balak's hand in Charu's hands:** shared `Hand` (MOT-19), child proportions; turned palm up and back in the
   insert (Shot 10).
3. **The leaf (new, tiny):** a mango leaf Balak twirls on the veranda; left on the mat when he slips out (motif:
   the rack focus in Shot 4, Charu's glance in Shot 6).
4. **Cucumber trellis and vine** (`CucumberTrellis`, exists): intact state with yellow flowers and young cucumbers;
   torn state after the cow (vine dragged down, root out of the earth, two bitten cucumbers on the ground). The tug
   is animated in AG10.
5. **Haricharan's bamboo** (Puppet `rProp "bamboo"`, `GESTURES5.bambooUpright` / `bambooCarried`): carried in the
   run, upright while he talks, one thump on the earth in Shot 27 and AG12, carried off.
6. **Pebbles** (`PebblesArt`, exists): Balak's little row in the grove; one pebble set down in P7.
7. **Clerk props (new):** an open red-cloth ledger whose top page lifts in the breeze, a brass inkpot, a reed pen in
   the senior clerk's hand (pauses mid-stroke on 05b), the junior clerk's palm-leaf fan (stops mid-fan on 05c).
8. **Binoy's jute bag** (cast): slips off his shoulder as his hands fly to his head (AG7, flashback).
9. **Surendra's khadam** (Ep 6 continuity): on his feet on the veranda; `khadam_floor` steps as he rises (Shot 7).

---

## 4. Complete Google AI Studio Voice Script (annotated)

- **Workspace:** `https://aistudio.google.com/generate-speech` — **Model:** `gemini-3.8-flash-tts`
- **Save all `.wav` files into:** `03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/02_Audio/Voice_WAVs_Full_Rewrite/`
- **Total voice blocks: 40 WAV files** — **narrator 8** (intro, 6 short bridges, outro) and **32 character lines**
  (Balak 7, Haricharan 7, Charu 5, Surendra 5, Binoy 5, senior clerk 2, junior clerk 1; durations per speaker in
  section 7). The source card reuses the existing `00a_Source_Attribution.wav` (Q16).
- **Est.** = estimated spoken length (narrator about 10.5 characters/s, adults about 13, Binoy about 13.5, Balak about
  11, inner voice about 9.5, plus 0.45 s per `<short pause>`; calibrated on the delivered Episode 5 clips). Replace
  with measured lengths after recording.
- **Source:** *book* = the book's direct speech (verbatim or lightly modernised); **[implied]** = voices what the book
  narrates or clearly implies; *bridge* = narrator.

### Block 00 — Series Intro
- **00_Intro.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Cheerful, bright, welcoming Bengali children's show announcer.` | Est. 6.6 s | *template*
  > ছোটদের বালক ঠাকুরের গল্প। <short pause> পর্ব পাঁচ: কচ্ছপ খেলা ও গাভী রক্ষা।

---

### Story 1 — কচ্ছপের কামড় (Chapter আট; Scenes 01, 02)

- **01a_Narrator_Kachari.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Warm, gentle Bengali storyteller, a playful smile on the last sentence.` | Est. 11.7 s | *bridge* (ch. 8 first lines; workplace from ch. 4)
  > উজানচরের কৃষ্ণনগর কাছারি—বীরুর বাবা সুরেনবাবু এখানেই কাজ করেন। <short pause> আর ছোট্ট বীরু? সে এখন বেশ একটু দুষ্টুমি শিখে উঠেছে!

- **01b_Charu_EyeOnHim.wav** | `05_Charu` (AI Studio Voice: **`Cleo`**) | Style: `Fond, half-exasperated young mother chatting on the veranda, light laugh in the voice.` | Est. 8.2 s | **[implied]** ("একটু ফাঁক পেলেই সবার চোখ এড়িয়ে টুক করে বেরিয়ে যায়। তাই সব সময় তাকে চোখে চোখে রাখতে হয়।")
  > আজকাল ওকে একদণ্ড চোখের আড়াল করার জো নেই! <short pause> একটু ফাঁক পেলেই—সবার চোখ এড়িয়ে টুক করে বেরিয়ে যায়।

- **01c_Surendra_Chuckle.wav** | `04_Babukaka` (AI Studio Voice: **`Achird`**) | Style: `Warm, amused father, chuckling softly, relaxed.` | Est. 5.0 s | **[implied]** (same sentence)
  > দুষ্টুমি শিখেছে তাহলে! <short pause> তবে তো ওকে চোখে চোখেই রাখতে হবে।

- **01d_Narrator_Slip.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Hushed, playful storyteller, like sharing a secret with the children.` | Est. 8.8 s | *bridge* ("সেদিন সবাই মিলে বেশ গল্প গুজব করছে। ঐদিন কখন যে শিশু বেরিয়ে গেছে কেউ তা লক্ষ্য করেনি।")
  > সেদিন সবাই মিলে বেশ গল্পগুজব করছে। <short pause> কখন যে বীরু টুক করে বেরিয়ে গেছে—কেউ টেরই পেল না!

- **01e_Binoy_Shout.wav** | `15_Binoy_Teen` (AI Studio Voice: **`Puck`**) | Style: `Sudden panicked teenage shout from the next house, loud, off-screen.` | Est. 2.5 s | *book, verbatim*
  > হায় হায়, গেল গেল—হাতটা গেল!

- **01f_Charu_Alarm.wav** | `05_Charu` (AI Studio Voice: **`Cleo`**) | Style: `Startled, then a rising fear as she realises her son is gone.` | Est. 4.4 s | **[implied]** ("চীৎকার শুনে সবাই দৌড়ে এসেছে")
  > ও কী! বিনয়ের গলা না? <short pause> বীরু... বীরু কোথায় গেল?!

- **01g_Surendra_Run.wav** | `04_Babukaka` (AI Studio Voice: **`Achird`**) | Style: `Urgent, already getting up to run.` | Est. 3.0 s | **[implied]**
  > পাশের বাড়ি থেকে! চলো, শিগগির চলো!

- **02a_Surendra_Bitten.wav** | `04_Babukaka` (AI Studio Voice: **`Achird`**) | Style: `Shocked gasp, breathless from running.` | Est. 2.9 s | **[implied]** ("লক্ষ্য করে দেখা গেল, একটা কচ্ছপ শিশুর হাত কামড়ে ধরেছে")
  > সর্বনাশ! কচ্ছপে হাত কামড়ে ধরেছে!

- **02b_Charu_FreeHand.wav** | `05_Charu` (AI Studio Voice: **`Cleo`**) | Style: `Frantic, breathless mother rushing in.` | Est. 3.5 s | **[implied]** ("দু'তিন জন দৌড়ে গিয়েছে বালকের হাত ছাড়িয়ে দিতে")
  > ছাড়াও, ছাড়াও—শিগগির হাতটা ছাড়িয়ে দাও!

- **02c_Charu_NoMark.wav** | `05_Charu` (AI Studio Voice: **`Cleo`**) | Style: `Breathless worry melting into astonished relief, very tender.` | Est. 6.6 s | **[implied]** ("শিশুর হাতে কচ্ছপের কামড়ের কোন ক্ষত বা দাগ নাই")
  > দেখি বাবা, দেখি হাতটা... <short pause> ওমা! কোথাও তো একটা দাগও নেই! <short pause> একটা আঁচড়ও না!

- **02d_Surendra_AskBinoy.wav** | `04_Babukaka` (AI Studio Voice: **`Achird`**) | Style: `Puzzled and gentle, turning to the teenage boy.` | Est. 4.3 s | **[implied]** ("বিনয়কে জিজ্ঞেস করে ব্যাপারটা জানা গেল")
  > আশ্চর্য তো! <short pause> বিনয়, কী হয়েছিল রে? খুলে বল তো।

- **02e_Binoy_Account1.wav** | `15_Binoy_Teen` (AI Studio Voice: **`Puck`**) | Style: `Still out of breath, wide-eyed, eager to tell the story.` | Est. 7.3 s | **[implied]** ("বিনয় বা'র থেকে ফিরছিল, হঠাৎ কোণের ঘরের দিকে শব্দ শুনে গিয়ে দেখতে পেল")
  > আমি বাইরে থেকে ফিরছিলাম, কাকা। <short pause> হঠাৎ শুনি, কোণের ঘরের দিকে খুটখাট শব্দ! <short pause> গিয়ে দেখি—

- **02f_Binoy_Account2.wav** | `15_Binoy_Teen` (AI Studio Voice: **`Puck`**) | Style: `Storytelling teenager, amazed, a little laugh in the voice.` | Est. 10.7 s | **[implied]** ("তার সুরেন কাকার বাচ্চা ছেলে বীরু কালকের কেনা কচ্ছপগুলো উল্টে উল্টে দিচ্ছে। এতটুকু বাচ্চার এই কাজ দেখে বিনয় বিশেষ উৎসুক হয়েছিল এবং চুপ করে দাঁড়িয়ে দেখছিল শিশু কি করে।")
  > বীরু কালকের কেনা কচ্ছপগুলো—একটা একটা করে উল্টে দিচ্ছে! <short pause> এইটুকু ছেলের কাণ্ড দেখে আমি তো অবাক। চুপ করে দাঁড়িয়ে দেখতে লাগলাম, ও কী করে।

- **02g_Binoy_Account3.wav** | `15_Binoy_Teen` (AI Studio Voice: **`Puck`**) | Style: `Building suspense, slowing down, then a sudden jolt on the bite.` | Est. 10.0 s | **[implied]** ("উপুড় করা কচ্ছপগুলোকে লেজ ধরে পাশে ধরে নানাভাবে উল্টে দিচ্ছে… লেজ মনে করে শিশু কচ্ছপের শুঁড় ধরেই ওল্টাতে গেছে, অমনি কচ্ছপটা শিশুর হাত কামড়ে ধরেছে")
  > লেজ ধরে, পাশ ধরে—নানাভাবে উল্টে দিচ্ছে। <short pause> তারপর একবার লেজ ভেবে যেই না শুঁড়টা ধরেছে— <short pause> অমনি কচ্ছপটা খপ করে হাত কামড়ে ধরল!

- **02h_Balak_Tortoise.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Playful, unafraid six-year-old gently teasing the tortoise, no pain, a smile in the voice.` | Est. 4.7 s | *book, verbatim* ("ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।")
  > ছাড়লি না, ছাড়লি না— <short pause> দাঁড়া, দেখাচ্ছি মজা!

- **02i_Binoy_Shouted.wav** | `15_Binoy_Teen` (AI Studio Voice: **`Puck`**) | Style: `Sheepish teenager, half laughing at himself.` | Est. 2.9 s | **[implied]** ("এমন সময় বিনয় চীৎকার করে উঠেছিল")
  > আর ওই দেখেই তো আমি চেঁচিয়ে উঠলাম!

---

### Story 2 — গাভী ও সত্য (Chapter নয়; Scenes 03, 04, 05)

- **03a_Narrator_Six.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Tender, thoughtful storyteller, slower pace.` | Est. 10.6 s | *bridge* ("বালক সবেমাত্র পাঁচ বছর পেরিয়ে ছয় বছরে পা দিয়েছে… চতুষ্পার্শ্বের রীতিনীতি বালকের নিজস্ব গতিবিধির সাথে খাপ খাচ্ছে না।")
  > বীরু সবে পাঁচ পেরিয়ে ছয়ে পা দিয়েছে। <short pause> কিন্তু ওর চলন-বলন, ওর চুপচাপ ভাব—আশপাশের কারো সাথেই ঠিক মেলে না।

- **03b_Surendra_Scold.wav** | `04_Babukaka` (AI Studio Voice: **`Achird`**) | Style: `Impatient father scolding across the yard, stern but not raging.` | Est. 6.2 s | **[implied]** ("খেয়াল, অবহেলা, জড়ত্ব, দুষ্টুমি ইত্যাদি নাম দিয়ে বালককে অযথা তাড়ন ও পীড়ন")
  > এই বীরু! ডাকলে সাড়া নেই, কাজের কথায় মন নেই— <short pause> খালি খেয়াল আর দুষ্টুমি!

- **03c_Narrator_Alone.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Gentle, a little wistful, soft on the second phrase.` | Est. 8.9 s | *bridge* ("সবাই মিলে তাকে পদে পদে অপদস্থ ও মারধর করাতে বালক আরও বেশী উদাসীনতার দিকে এগিয়ে চলল")
  > বকুনি তো লেগেই থাকত, <short pause> কখনো কখনো মারও জুটত। <short pause> তাই বীরু আরও চুপচাপ, আরও একা হয়ে গেল।

- **03d_Narrator_Places.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Soft, unhurried, painting three quiet pictures.` | Est. 12.2 s | *bridge* ("হয় কলাবাগিচায়, না হয় মাঠের শেষে দেবদারু গাছের নীচে, না হয় নদীর ধারে জামগাছতলায় বসে। এতটুকু বালক নিৰ্জ্জনে চুপচাপ বসে থাকে")
  > ওকে পাওয়া যেত কখনো কলাবাগিচায়, <short pause> কখনো মাঠের শেষে দেবদারু গাছের নীচে, <short pause> কখনো নদীর ধারে জামগাছতলায়—একা, চুপটি করে বসে।

- **03e_Charu_Relief.wav** | `05_Charu` (AI Studio Voice: **`Cleo`**) | Style: `Tired, relieved sigh, half to herself while working.` | Est. 6.4 s | **[implied]** ("বালক কোন একটা কিছু করে আবার একটা সাংঘাতিক অবস্থার সৃষ্টি যে করছে না তাতেই সবাই খুশী")
  > যাক, চুপচাপ এক কোণে বসে আছে— <short pause> নতুন কোনো কাণ্ড তো বাধাচ্ছে না। তাতেই রক্ষে!

- **04a_Narrator_ThatDay.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Warm, calm, setting a peaceful scene.` | Est. 6.7 s | *bridge* ("সেদিন বালক কাছারী ঘরের পেছনে কলাবাগিচায় বসে খেলা করছে।")
  > সেদিন দুপুরে বীরু কাছারি ঘরের পেছনে, কলাবাগিচায় বসে আপন মনে খেলছিল।

- **04b_Haricharan_Q1.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Out of breath, hot-tempered village man, bamboo in hand.` | Est. 3.7 s | *book* ("গরুটা কোন দিকে গেছে দেখেছিস?"; "এই বীরু!" added)
  > এই বীরু! <short pause> গরুটা কোন দিকে গেছে, দেখেছিস?

- **04c_Balak_WhatHappened.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Calm, innocent, curious six-year-old.` | Est. 2.2 s | *book, verbatim*
  > হরিচরণদা, কী হয়েছে?

- **04d_Haricharan_Cucumber.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Indignant and aggrieved, comically exaggerated grief over his cucumbers.` | Est. 14.7 s | **[implied]** ("বিরাট একটা শশা গাছ, একটা ঝাঁকাতে বেয়ে শাখা-প্রশাখায় ছড়িয়ে পড়েছে। আর তার ডগায় কচি বড় বহু শশা। গাভীটা শুধু শশাই খায়নি, গাছটির মূলও উচ্ছেদ করেছে।")
  > কী হয়েছে? <short pause> আমার অত বড় শশা গাছটা—গোটা ঝাঁকা জুড়ে লতিয়ে উঠেছিল! <short pause> ডগায় ডগায় কচি কচি শশা! <short pause> হতচ্ছাড়া গরু সব খেয়ে গেছে— <short pause> শুধু খায়নি, গাছটা গোড়াসুদ্ধ উপড়ে দিয়েছে!

- **04e_Balak_Inner1.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Soft whispered inner thought, very calm, close to the microphone.` | Est. 6.0 s | *book thought* ("সে ভাবল, এখন যদি সে বলে দেয়, তা হলে তো একেবারেই ওর দফা রফা হবে।")
  > এখন যদি বলে দিই— <short pause> ওর তো একেবারে দফা রফা হয়ে যাবে।

- **04f_Haricharan_Q2.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Impatient and more heated, leaning down.` | Est. 5.0 s | *book* ("তাড়াতাড়ি বল কোন দিকে গেছে?"); first sentence **[implied]** (his silence: "নিরীহ ভাব দেখিয়ে চুপ করে আছে")
  > কী রে, চুপ করে আছিস কেন? <short pause> তাড়াতাড়ি বল, কোন দিকে গেছে?

- **04g_Balak_Inner2.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Whispered inner thought, slow, weighing two things, then quietly decided.` | Est. 10.7 s | *book narration as thought* ("'জানি' বললে গাভীটি ভীষণ মার খায়, আর 'জানি না' বললেও 'সত্য' যায়। কিন্তু তাতো চলবে না, গাভী এবং সত্য দুটোকেই রাখতে হবে।")
  > 'জানি' বললে, গরুটা ভীষণ মার খাবে। <short pause> 'জানি না' বললে, সত্যটা যাবে। <short pause> না—গরুও থাকবে, সত্যও থাকবে।

- **04h_Balak_Truth1.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Calm, gentle, completely firm and respectful six-year-old.` | Est. 7.7 s | *book, verbatim* ("দেখলেও বলবো না, কারণ বলে দিলে আপনি তো আর রক্ষা রাখবেন না। আমি কিছুতেই বলব না।")
  > দেখলেও বলব না। <short pause> কারণ বলে দিলে আপনি তো আর রক্ষা রাখবেন না। <short pause> আমি কিছুতেই বলব না।

- **04i_Haricharan_Sputter.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Flabbergasted splutter.` | Est. 2.0 s | **[implied]** ("উত্তেজিত হরিচরণ")
  > অ্যাঁ! বলবি না মানে?!

- **04j_Balak_Truth2.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Simple, earnest, compassionate, never preachy.` | Est. 11.5 s | *book, verbatim* ("আমি বলে দি আর অমনি আপনি গিয়ে ওকে ধরে লাগান। ও যে শশা গাছ খেয়েছে—তা আপনার গাছ কি আমার গাছ—ও কি বুঝে খেয়েছে।")
  > আমি বলে দিই, আর অমনি আপনি গিয়ে ওকে ধরে লাগান! <short pause> ও যে শশা গাছ খেয়েছে— <short pause> তা আপনার গাছ, কি আমার গাছ—ও কি বুঝে খেয়েছে?

- **04k_Balak_Truth3.wav** | `12_Balak_Thakur_Child` (AI Studio Voice: **`Sola`**) | Style: `Softer and tender, settling; the last sentence quiet and final.` | Est. 10.5 s | *book, verbatim* ("ওর খাওয়া দরকার তাই খেয়েছে। ও কি আর বুঝেছিল যে আপনি ওর জন্য বাঁশ নিয়ে আসবেন। আমি ওর খবর বলতে পারবো না।")
  > ওর খাওয়া দরকার, তাই খেয়েছে। <short pause> ও কি আর বুঝেছিল, আপনি ওর জন্য বাঁশ নিয়ে আসবেন? <short pause> আমি ওর খবর বলতে পারব না।

- **04l_Haricharan_Storm.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Exploding in comic exasperation, turning to stomp away.` | Est. 5.3 s | **[implied]** ("উত্তেজিত হরিচরণ অধিকতর উত্তেজিত হয়ে চলে গেল")
  > বাঃ! খুব ভালো! গরুর হয়ে ওকালতি হচ্ছে! <short pause> যত্তসব অদ্ভুত কাণ্ড!

- **05a_Haricharan_Report.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Still fuming, gossiping to the clerks; mimics a child's voice on the quote.` | Est. 10.3 s | **[implied]** ("কাছারির সেরেস্তায় এ নিয়ে বেশ খানিকটা জল্পনা কল্পনা চলল")
  > শুনেছেন বাবুরা? <short pause> সুরেনবাবুর ছেলে ঠিক জানে গরুটা কোথায়— <short pause> অথচ কিছুতেই বলবে না! <short pause> উল্টে বলে কিনা, 'ও কি বুঝে খেয়েছে!'

- **05b_ClerkA_SawEat.wav** | `10_Grumpy_Relative` (AI Studio Voice: **`Charon`**) | Style: `Dry, knowing, slow; peering over his spectacles.` | Est. 3.2 s | *book, verbatim* ("মনে হয় ও খেতেও দেখেছে।")
  > হুঁ... <short pause> মনে হয়, ও খেতেও দেখেছে।

- **05c_ClerkB_FedIt.wav** | `18_Kachari_Muhuri` (AI Studio Voice: **`Zephyr`**) | Style: `Theatrical, leaning in, dramatic conspiratorial certainty.` | Est. 5.4 s | *book, verbatim* ("ও নিজে ধরে নিয়েও খাইয়ে আসতে পারে।"); lead-in **[implied]**
  > আরে মশাই, শুধু দেখা কেন? <short pause> ও নিজে ধরে নিয়েও খাইয়ে আসতে পারে!

- **05d_ClerkA_Verdict.wav** | `10_Grumpy_Relative` (AI Studio Voice: **`Charon`**) | Style: `Shaking his head, a dry and gently comic verdict.` | Est. 7.3 s | **[implied, near-verbatim]** ("সুরেনবাবুর এই ছেলেটি যে বিষয়বুদ্ধিহীন একটি অদ্ভূত পদার্থ, তা সেদিন বুঝতে কারো আর বাকী রইল না।")
  > যাই বলো, সুরেনবাবুর এই ছেলেটির— <short pause> বিষয়বুদ্ধি বলে কিচ্ছু নেই! <short pause> একটা অদ্ভুত পদার্থ!

- **05e_Haricharan_Agree.wav** | `17_Haricharan` (AI Studio Voice: **`Fenrir`**) | Style: `Emphatic, vindicated.` | Est. 2.0 s | **[implied]** ("বুঝতে কারো আর বাকী রইল না"; optional line, Q14)
  > ঠিক বলেছেন! একদম ঠিক!

---

### Block 99 — Closing & Episode 6 Teaser
- **99_Outro_Sequential.wav** | `01_Narrator_Kathak` (AI Studio Voice: **`Enzo`**) | Style: `Serene, warm, gently smiling storyteller; then warm curiosity for the teaser.` | Est. 31.2 s | *bridge*; teaser text as delivered, split for one-line captions
  > কাছারির বাবুরা ভাবলেন, ছেলেটার বিষয়বুদ্ধি নেই। <short pause> কিন্তু ছোট্ট বীরু সেদিন দুটোকেই বাঁচিয়েছিল— <short pause> অবলা গাভীটিকে, আর সত্যকে। <short pause> ছোটদের বালক ঠাকুরের গল্প— <short pause> আসছে পরের পর্ব: জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী! <short pause> বড় ভাইয়ের মার খেয়েও ছোট্ট ঠাকুর— <short pause> কীভাবে দাদাকে বাবার হাত থেকে বাঁচালেন? <short pause> দেখুন পরের পর্বে!

---

## 5. Scene-by-Scene Complete Visualization, Shot List, Blocking, Pauses & VFX

> **Legend:** `AG` = Action Gap (the story moves wordlessly; choreography on the story clock); `P` = Pause (the
> story holds 1–2 s at a settled moment, life goes on on `lifeF`: breathing, blinks, leaves, animals); `CB` =
> Chapter Break (`CAM-10`). Faces and key action above `y = 820`. Music cue names are files in
> `public/audio/music/ep05/` (AUD-09); SFX paths under `public/audio/`.

---

### Intro & Source Card (0:00 – 0:26.6 | about 638 f)
- **Visuals:** Ghibli Episode 4 title template (title opens on this episode's own place: the banana grove with soft
  morning light, STO-22c), gold pill `পর্ব পাঁচ`, title `কচ্ছপ খেলা ও গাভী রক্ষা`; then the book-page source card
  (chapters আট and নয়). No captions on the title page; the card overlaps scene 01's fade-in with no black frame.
- **Audio:** `00_Intro.wav` + `00a_Source_Attribution.wav`; series theme as Ghibli Episode 4 (`bansuri_relief` over
  `tanpura_drone`, AUD-09); `chime_pop` (0.30).

---

### Scene 01 — `01_kachari_chat_and_slip` (Krishnanagar kachari compound → the family veranda, late morning)
- **Set & Grade:** `GhibliKachariSet` compound view (kachari left, Binoy's house and corner room right, fence gap) →
  `ujanchar_veranda_back` (ep06) with `madur_mat_veranda_sketch`; late-morning grade, sun from the upper left.
- **Duration:** about 60.4 s (about 1,450 f) — voice 43.6 s, AG 11.5 s, pauses 2.5 s.

| Shot / Beat | Audio / Timing | Framing & Camera (`CAM-13`) | Character Blocking, Expressions & Props | VFX, SFX & Music |
|---|---|---|---|---|
| **AG1 (World Open, 4.0 s)** | Wordless (`STO-22` 1) | **Held wide** of the kachari compound, then a **motivated lateral truck right** past Binoy's house (tipped basket and tortoises planted small by the corner room) through the fence gap to the family veranda | Pigeons lift from the kachari roof; a clerk dips his reed pen at `prop_clerk_desk`; hens peck; Charu and Surendra settle on the mat, Balak beside Charu twirling a mango leaf | VFX: sun shafts, dust motes. SFX: `sfx/ep02/birds_village` (0.20), `sfx/ghibli_life/pigeon_flutter` (0.18), `sfx/ep06/hens_cluck_loop` (0.12). Music: `tanpura_drone` fades in |
| **Shot 1** | `01a_Narrator_Kachari` | Truck settles into a **medium wide** of the veranda on "আর ছোট্ট বীরু?" | Balak glances up at the sparrow on the eave with a faint eye-smile | Music: `play_plucks` very low under the voice |
| **Shot 2** | `01b_Charu_EyeOnHim` | **Medium two-shot** Charu and Surendra (cut 6 f before); Balak soft between them | Charu laughs, wags a finger at Balak without looking; Balak's eyes drift to a hen walking through the fence gap | SFX: `sfx/ep02/cloth_rustle` (0.15) |
| **Shot 3 + P1 (1.5 s)** | `01c_Surendra_Chuckle` | Same two-shot, hold | Surendra chuckles; in **P1** both laugh together and turn to each other, their backs to Balak; Balak watches the gap | Music: `play_plucks` rises in P1 |
| **AG2 (The Slip, 3.0 s)** | Wordless comedy | **Hold** the two-shot, **deep staging**: Balak rises (`StandingChild`) behind Charu's back, tiptoes off the plinth and slips through the fence gap (occluded by the fence run) | The leaf drops onto the mat as he rises; the parents keep chatting (mouths in walla) | Music: `cheeky_pluck_3` + `tabla_soft` tiptoe. SFX: soft bare-foot pats (`sfx/ep02/sand_pat` 0.12) |
| **Shot 4 + P2 (1.0 s)** | `01d_Narrator_Slip` | **Rack focus** from the parents to the empty spot and the leaf (no camera move) | The parents chat on (walla: tails of 01b/01c low-passed at -18 dB, or the CC murmur, section 6B); in **P2** the leaf stirs in the breeze | Music: `tanpura_drone` alone |
| **AG3 (Time Passes, 2.0 s)** | Wordless | **Held wide** of the veranda | The post's shadow creeps a little (light shift); a crow caws on the fence; the parents laugh silently | SFX: `sfx/ep06/crow_caw` (0.20) |
| **Shot 5** | `01e_Binoy_Shout` (off-screen) | **Hold**, then **cut** on the shout to a **medium** of both parents' heads snapping toward next door | Hens scatter; Surendra half-rises | Music: **`drum_hit_low`** on the shout (the jolt, AUD-07). SFX: `sfx/ep06/hens_scatter` (0.28) |
| **Shot 6** | `01f_Charu_Alarm` | **Close-up on Charu** (cut 6 f before) | Her eyes go to the empty spot and the leaf; hand to her mouth | Music: `tanpura_drone_low` |
| **Shot 7** | `01g_Surendra_Run` | **Medium** Surendra rising | He springs up, khadam clacking, and points next door | SFX: `sfx/ep06/khadam_floor` steps (0.25) |
| **AG4 (The Run, 2.5 s)** | Wordless action | **Motivated pan** following them through the fence gap | Charu lifts her sari hem and runs (CHR-05–07), Surendra kicks off his khadam on the step and runs barefoot behind her | Music: `drum_pulse_fast` + `tabla_run`. SFX: `sfx/ep02/footsteps_mud` (0.30), dust puffs |

---

### Scene 02 — `02_tortoise_bite_and_binoy` (the neighbour's corner room; Binoy's flashback)
- **Set & Grade:** `GhibliKachariSet` corner view (`mud_house_corner_sketch`, `prop_tipped_jhanka`, kolshi); the
  flashback in a warmer, lighter grade with a feathered vignette.
- **Duration:** about 66.5 s (about 1,596 f) — voice 52.9 s, AG 6.0 s, pauses 4.0 s.

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX, SFX & Music |
|---|---|---|---|---|
| **Shot 8** | `02a_Surendra_Bitten` | **Held wide** on the corner as they burst in (cut on the line) | Binoy at the corner, both hands on his head; Binoy's mother at her door, hand at her mouth; Balak **seated cross-legged** among the four tortoises, T2's jaws on the side of his hand; Balak calm, looking at it | Music: `drum_pulse` (the bite held). SFX: `sfx/ep05/shell_scrape` (0.14) |
| **Shot 9** | `02b_Charu_FreeHand` | **Medium**, Charu dropping to her knees beside Balak (cut 6 f before) | Charu reaches with both hands; Surendra and Binoy step in behind | — |
| **AG5 (Already Free, 2.0 s)** | Wordless (book) | **Medium close** on the hands | Three hands arrive (Charu, Surendra, Binoy) — but T2 has **already opened its jaws**; it draws its head in and plods off toward the basket | Music: pulse stops dead. SFX: `shell_scrape` (0.12) |
| **Shot 10 + P3 (1.5 s) [GLOW BEAT 1]** | `02c_Charu_NoMark` | **Macro insert** of the small hand in Charu's two hands (zoom 3.2×, dof 1.7), turned palm up on "দেখি", then over; cut back to a **medium two-shot** on "ওমা!" | Smooth hand, no mark; Balak looks up at his mother with his calm eye-smile. In **P3** Charu presses his hand to her cheek and lets out a visible sigh (MOT-20) | **Glow beat 1:** halo and rim brighten gently, 3 motes rise (BAL-11). Music: **`bansuri_relief`** in on "দাগও নেই". SFX: `soft_magical_shimmer` (0.15) |
| **Shot 11** | `02d_Surendra_AskBinoy` | **Medium** Surendra turning to Binoy | Surendra crouches, puzzled; Binoy still breathing hard | — |
| **Shot 12** | `02e_Binoy_Account1` | **Medium on Binoy** (cut 6 f before) → on "গিয়ে দেখি—" a **24 f cross-dissolve** into the flashback | Binoy points toward the corner room, eyes wide | Music: `tanpura_drone` warm; dissolve softens the yard sound |
| **Shot 13 (Flashback)** | `02f_Binoy_Account2` (V.O.) | **Medium wide**, warm vignette: Binoy (with his jute bag) comes round the corner and stops; Balak seated among the tortoises | Balak rolls T1 onto its back by tail and side; legs paddle; Binoy watches quietly, head tilted | Music: `play_plucks` + `tabla_soft` (the play). SFX: `shell_scrape` (0.14) |
| **AG6 (The Play, 3.0 s)** | Wordless (STO-20a) | **Slow push in** to a medium close of his smiling face, his hands and the tortoise | Balak rights T1; its head pokes out; his gentle joyful eye-smile, brightest here | SFX: soft shell knock (`sfx/ep02/clay_thud` 0.12) |
| **Shot 14 (Flashback)** | `02g_Binoy_Account3` (V.O.) | **Close, low** at tortoise height (ground line high so the action is above y = 820); **hard cut** on "অমনি" | His hand goes to T2's front end ("লেজ ভেবে"); the head shoots out and the jaws clamp on "খপ করে" | Music: **`tension_rise`** starting 1.3 s before "খপ", landing into **`drum_hit_low`** |
| **Shot 15 (Flashback)** | `02h_Balak_Tortoise` | **Close-up on Balak** (cut 6 f before) | Not hurt, not scared: an amused little frown at the tortoise, teasing it; breathing even | Music: `cheeky_pluck_2` on "দেখাচ্ছি মজা" |
| **AG7 (The Shout, 1.0 s)** | Wordless + echo of `01e` | **Medium** on flashback Binoy → **24 f dissolve** back to the present | Binoy's bag slips off as his hands fly to his head; his mouth opens (the shout as a soft, reverbed echo of 01e at -10 dB) | SFX: `cloth_rustle` (0.15) |
| **Shot 16 + P4 (2.5 s) [Afterglow]** | `02i_Binoy_Shouted` | **Medium wide group** (present) | Binoy scratches his head, sheepish; Surendra laughs and shakes his head; Charu smiles at Balak through damp eyes; Balak looks at T2, which pokes its head out toward him (P4) | Music: `cheeky_pluck_1` on Binoy's line → `tanpura_drone_cs` + `bansuri_compassion` in P4, fading with the picture |

### **Chapter Break (`CB1`, 1.2 s | 29 f)**
- Fade to black (12 f) → hold black (5 f) + `chime_pop` (0.18) → fade in (12 f) on scene 03's world moment.

---

### Scene 03 — `03_six_and_alone` (Ujanchar: the family yard, the path, three quiet places)
- **Set & Grade:** `ujanchar_veranda_back` yard (afternoon); the grove (`grove_floor_sketch`, banana clumps); the
  field's end (`village_field_edge_back`, `field_floor`, `tree_debdaru_sketch` NEW); the riverbank
  (`riverbank_jam_back`, `riverbank_floor_sketch`, `tree_jamun_sketch`, all NEW).
- **Duration:** about 52.3 s (about 1,255 f) — voice 44.3 s, AG 3.0 s, pauses 3.0 s.

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX, SFX & Music |
|---|---|---|---|---|
| **AG8 (World Open, 3.0 s)** | Wordless | **Held wide** of the family yard in afternoon light | The household is busy (Charu crossing with a kolshi, a hen, washing on the line); Balak, a little older now, sits on the veranda step looking at the sky | SFX: `birds_village` (0.18), `hens_cluck_loop` (0.10). Music: `tanpura_drone_low` |
| **Shot 17** | `03a_Narrator_Six` | **Hold**; one slow **push** to a medium on Balak on "চুপচাপ ভাব" | Everyone moves, he is still; a slow blink | — |
| **Shot 18** | `03b_Surendra_Scold` | **Medium** Surendra on the veranda (cut 6 f before) → reaction **medium** on Balak | Surendra calls sternly, hand on hip; Balak lowers his eyes, rises and walks off quietly (no hitting shown) | Music: drone only (no melody under the scolding) |
| **Shot 19** | `03c_Narrator_Alone` | **Wide** of the path behind the kachari, Balak small, walking alone | A long shadow ahead of him; a leaf blows across the path | SFX: `sfx/ep02/wind_soft` (0.12) |
| **Shot 20 a/b/c + P5 (1.5 s)** | `03d_Narrator_Places` | Three **held wides**, a **30 f cross-dissolve** cut on each place word: (a) the grove, (b) the debdaru at the field's end, (c) the jam tree by the river; P5 holds on (c) | Balak seated cross-legged alone in each, hands together in his lap (BAL-26e rest pose); (b) a kite circles high, grass waves; (c) a sail far off, a kingfisher dives, fallen jamun fruit near his knee | Music: **`bansuri_compassion`** across the montage. SFX: `sfx/ep05/banana_leaves` (a), new `chil_kite_call` (b, 0.15), `ambient/padma_river_day` (c, 0.14) + `sfx/ghibli_life/kingfisher_call` (0.15) in P5 |
| **Shot 21 + P6 (1.5 s)** | `03e_Charu_Relief` | **Medium** Charu on the family veranda, glancing toward the grove (cut 6 f before) | She sighs, half smiling, and goes back to cleaning rice in a brass thali; in **P6** a soft 30 f dissolve to the grove | SFX: rice in the thali (`sfx/ep02/rice_spill` 0.12) |

---

### Scene 04 — `04_cucumber_and_bamboo` (the banana grove behind the kachari, warm early afternoon)
- **Set & Grade:** `GhibliKachariSet` grove view (`kachari_back_wall_sketch`, back door, `CucumberTrellis`,
  `banana_clump_sketch` hiding place, `grove_floor_sketch`); warm early-afternoon grade (STO-20).
- **Duration:** about 108.8 s (about 2,611 f) — voice 86.0 s, AG 11.5 s, pauses 6.5 s.

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX, SFX & Music |
|---|---|---|---|---|
| **AG9 (World Open, 3.5 s)** | Wordless | **Held wide** of the grove: back wall and trellis left, banana plants right, Balak seated with his pebbles | Two white butterflies over the yellow cucumber flowers; a sunbird at the banana flower; dappled light moving | SFX: `birds_village` (0.18), `banana_leaves` (0.14). Music: `tanpura_drone` |
| **Shot 22** | `04a_Narrator_ThatDay` | **Hold** | Balak sets a pebble in his little row, a slow blink | — |
| **AG10 (The Cow, 4.0 s)** | Wordless (book: the cucumbers; "বালক ঠিকই জানতো গাভীটা কোথায় রয়েছে") | **Medium** on the trellis → **cut** to **medium** on Balak | The cow tugs the vine, a cucumber in her mouth; the vine sags off the frame and the root tears out of the earth. She ambles past Balak, deeper into the grove, and stops behind the big banana clump; only her ear and tail show. Balak watches her go, then looks back down at his pebbles | Music: `cheeky_pluck_1` and `cheeky_pluck_4` on her tugs. SFX: `sfx/ep05/vine_tear` (0.25), `sfx/ep05/cow_munch` (0.20), `sfx/ep02/hooves_soft` (0.18) |
| **AG11 (Haricharan, 1.5 s)** | Wordless | **Wide** from inside the grove toward the kachari | The back door bangs open; Haricharan runs out with his bamboo and stops short over Balak, panting, scanning the grove | Music: `drum_hit_low` on the door, `drum_pulse_fast` under the run. SFX: `sfx/ep02/door_creak` (0.30), `footsteps_mud` (0.30) |
| **Shot 23** | `04b_Haricharan_Q1` | **Medium close-up** on Haricharan, **eye level** (cut 6 f before) | Sweaty, glaring, bamboo upright in his fist | Music: `tanpura_drone_low` |
| **Shot 24** | `04c_Balak_WhatHappened` | **Close-up** on Balak looking up (cut 6 f before) | Calm, innocent, curious | — |
| **Shot 25** | `04d_Haricharan_Cucumber` | **Two-shot in profile** (Haricharan left, towering; Balak right, seated); **insert cut** on "গোড়াসুদ্ধ উপড়ে": the torn root and two bitten cucumbers | Haricharan jabs toward the trellis, mimes the big vine with both arms, slaps his forehead | Music: `cheeky_pluck_3` on "ডগায় ডগায় কচি কচি শশা!" |
| **Shot 26 + P7 (1.5 s)** | `04e_Balak_Inner1` | **Close-up** on Balak; mouth closed (inner voice) | His eyes never go toward the clump. In **P7** ("নিরীহ ভাব দেখিয়ে চুপ করে আছে") he innocently sets down one pebble | A banana leaf stirs behind him |
| **Shot 27** | `04f_Haricharan_Q2` | **Medium close-up** on Haricharan (cut 6 f before) | He bends lower, impatient; the bamboo end taps the earth once | SFX: `sfx/ep05/bamboo_thump` (0.18) |
| **Shot 28 + P8 (2.0 s)** | `04g_Balak_Inner2` | **Slow push in** to an extreme close-up of Balak's eyes (1.0 → 1.6×), the line's one move | Eyes lower on "জানি", lift on "সত্যটা", settle on "না—" | Music: **`drum_pulse`** heartbeat under the thought, **stops** on "না—"; **P8 is near-silence** (leaves only): the silence before a decision (STO-22 6) |
| **Shot 29** | `04h_Balak_Truth1` | **Close-up** on Balak speaking (hold from P8) | Calm, settled, a small open palm lifts toward the bamboo | — |
| **Shot 30** | `04i_Haricharan_Sputter` | **Cut** to **medium close-up** on Haricharan | Eyes pop, mouth hangs open | Music: `cheeky_pluck_3` (small, comic) |
| **Shot 31** | `04j_Balak_Truth2` | **Two-shot in profile** | Balak gestures gently off left toward the torn trellis (away from the hidden cow) | Music: `bansuri_compassion` enters softly under him |
| **Shot 32** | `04k_Balak_Truth3` | **Slow push** from the two-shot into a medium close-up of Balak (Haricharan's shoulder leaves frame) | A small slow head shake on "ও কি আর বুঝেছিল"; final line quiet, a faint smile | Bansuri settles on Sa |
| **Shot 33** | `04l_Haricharan_Storm` | **Wide two-shot** (cut) | Haricharan throws up his free hand | — |
| **AG12 (He Storms Off, 2.5 s)** | Wordless (book) | **Hold** the wide | One bamboo thump on the earth, he turns and stomps along the path into the kachari back door; Balak watches him go | SFX: `bamboo_thump` (0.22), `footsteps_mud` (0.26), `door_creak` (0.24). Music: `drum_hit_low` soft (0.6) as a grumble |
| **P9 (3.0 s) [GLOW BEAT 2, Afterglow]** | Wordless (STO-20 staging) | **Medium**: Balak left, the banana clump right (the Ep 4 glimpse composition) | The cow's head comes out between the trunks; she steps up and lowers her muzzle; Balak turns, raises his palm and strokes her face and neck; her slow blink, a soft breath out | **Glow beat 2.** Music: `tanpura_drone_cs` + `bansuri_relief` (tail). SFX: `sfx/ep05/cow_breath` (0.15), `soft_magical_shimmer` (0.15). 36 f dissolve to scene 05 |

---

### Scene 05 — `05_sereshta_gossip` (the kachari's front veranda, later afternoon) + riverbank afterglow
- **Set & Grade:** `kachari_veranda_inside_sketch` (NEW) with `prop_clerk_desk` and the ledgers; then
  `riverbank_jam_back` + `sky_village_sunset` for AG14.
- **Duration:** about 39.2 s (about 941 f) — voice 28.2 s, AG 6.5 s, pauses 2.5 s.

| Shot / Beat | Audio / Timing | Framing & Camera | Character Blocking, Expressions & Props | VFX, SFX & Music |
|---|---|---|---|---|
| **AG13 (World Open, 2.5 s)** | Wordless | **Held wide** of the veranda interior, staged in depth | The senior clerk writes in a red ledger; the junior clerk fans himself; pigeons coo on the roof edge; Haricharan stomps up the steps, bamboo on his shoulder | SFX: new `quill_scratch` (0.15), `sfx/ghibli_life/pigeons_coo` (0.14). Music: `tabla_soft` light |
| **Shot 34** | `05a_Haricharan_Report` | **Medium wide three-shot** (cut on the line) | Haricharan gestures toward the back of the kachari; on the quote he puts on a small child's voice and folds his hands mock-innocently | Music: `cheeky_pluck_3` after the quote |
| **Shot 35** | `05b_ClerkA_SawEat` | **Medium close-up** on the senior clerk, **rack focus** from Haricharan | His reed pen stops mid-stroke; he looks up over his spectacles | — |
| **Shot 36 + P10 (1.5 s)** | `05c_ClerkB_FedIt` | **Rack focus** to the junior clerk (no move) | He leans in, fan stopped mid-air, eyebrows high. In **P10** the senior clerk and Haricharan turn slowly to stare at him; a ledger page lifts in the breeze; a pigeon coos | Music: `cheeky_pluck_2` on "খাইয়ে আসতে পারে!", silence in P10 |
| **Shot 37** | `05d_ClerkA_Verdict` | **Medium three-shot** | The senior clerk shakes his head and dips his pen again | Music: `cheeky_pluck_4` tumble on "অদ্ভুত পদার্থ!" |
| **Shot 38 + P11 (1.0 s)** | `05e_Haricharan_Agree` | **Hold** | Haricharan nods hard; all three nod together (P11) | — |
| **AG14 (Afterglow, 4.0 s)** | Wordless | **40 f dissolve** to a **held wide** of the riverbank at sunset, then one slow **push** | Balak sits alone under the jam tree, hands together in his lap, looking at the water; a boat crosses far off; his halo steady (no brightening) | Music: `tanpura_drone` + `bansuri_compassion` settling on Sa. SFX: `ambient/padma_river_day` (0.16), `sfx/ep02/oars_water` far (0.12) |

---

### Block 99 — Closing & Episode 6 Glimpse (about 33.2 s | about 797 f)
- **Visuals:** series outro template (`TTL-09`, `TTL-10a`): the riverbank at sunset continues under the closing,
  then the soft boxless glimpse of **Episode 6** (`glimpse_ep06_veranda_sketch`: Balak by the Ujanchar veranda post,
  his father's wooden khadam on the step, STO-20 decision 14), label `পর্ব ছয়` in cream-gold Baloo Da 2. No pauses.
- **Audio:** `99_Outro_Sequential.wav`; `padma_river_day` (0.15); series theme (0.08 under voice, 0.14 open);
  `soft_magical_shimmer` at `0.12` (`AUD-08a`).

---

## 6. Complete Audio Architecture (Beds, Music Cues & SFX Sourcing)

### A. Ambient Beds (Loops, `≤ 0.25`, Ducked Under Voice)
| Scene | Bed File (`public/audio/`) | Under Voice | In Pause / AG |
|---|---|---|---|
| **01** (compound, veranda) | `sfx/ep02/birds_village.wav` + `sfx/ep06/hens_cluck_loop.wav` | `0.10` / `0.06` | `0.20` / `0.12` |
| **02** (corner room) | `sfx/ep02/birds_village.wav` + `sfx/ep02/wind_soft.wav` (flashback: same, low-passed) | `0.10` / `0.06` | `0.18` / `0.12` |
| **03** (yard, path, montage) | `birds_village` → `sfx/ep05/banana_leaves.wav` → `wind_soft` → `ambient/padma_river_day.wav` | `0.08` | `0.16–0.20` |
| **04** (grove) | `sfx/ep02/birds_village.wav` + `sfx/ep05/banana_leaves.wav` + `sfx/ghibli_life/wind_leaves.wav` | `0.08` / `0.06` / `0.05` | `0.18` / `0.14` / `0.10`; **P8 leaves only (0.10)** |
| **05** (kachari veranda) | `sfx/ep02/birds_village.wav` + `sfx/ghibli_life/pigeons_coo.wav` | `0.08` / `0.06` | `0.16` / `0.14` |
| **AG14, 99** (riverbank, outro) | `ambient/padma_river_day.wav` | `0.10` | `0.16` |

### B. One-Shot SFX List (All Volumes `0.15–0.45`)
- **Already in the repo:** `sfx/ep05/` `shell_scrape`, `vine_tear`, `cow_munch`, `cow_breath`, `bamboo_thump`,
  `banana_leaves`; `sfx/ep02/` `cloth_rustle`, `sand_pat`, `clay_thud`, `footsteps_mud`, `door_creak`, `hooves_soft`,
  `rice_spill`, `oars_water`, `paper_rustle`; `sfx/ep06/` `khadam_floor`, `hens_scatter`, `crow_caw`;
  `sfx/ghibli_life/` `pigeon_flutter`, `pigeons_coo`, `kingfisher_call`, `wind_leaves`, `squirrel_chirp`;
  `sfx/chime_pop`, `sfx/soft_magical_shimmer`.
- **New CC recordings to source (`sfx-from-commons`, save in `public/audio/sfx/ep05/`, credit in `docs/AUDIO_CREDITS.md`):**
  1. `adults_murmur_laugh.wav` — two or three adults chatting and laughing softly, indistinct (Scene 01 walla, AG2–AG3). Stand-in: the tails of 01b/01c, low-passed.
  2. `chil_kite_call.wav` — a black kite's thin call, far (Scene 03 montage b).
  3. `quill_scratch.wav` — a reed or quill pen scratching on paper (Scene 05). Stand-in: `paper_rustle` at 0.12.
  4. `palm_fan_flap.wav` — a palm-leaf hand fan flapping (Scene 05).
  5. `tortoise_hiss_soft.wav` — optional, a tortoise's short hiss as T2 pulls its head in (AG5).

### C. Indian Instrument Music Cues (`public/audio/music/ep05/`, AUD-09)
1. **Scene 01:** `tanpura_drone` + `play_plucks` (chat) → `cheeky_pluck_3` + `tabla_soft` (the slip) → drone alone
   (time passes) → **`drum_hit_low`** (Binoy's shout) → `tanpura_drone_low` (Charu's alarm) → `drum_pulse_fast` +
   `tabla_run` (the run).
2. **Scene 02:** `drum_pulse` (bite held) → stops (already free) → **`bansuri_relief`** ("দাগও নেই", glow 1) →
   flashback `play_plucks` + `tabla_soft` → **`tension_rise` → `drum_hit_low`** (the bite) → `cheeky_pluck_2`
   ("দেখাচ্ছি মজা") → `cheeky_pluck_1` (Binoy sheepish) → `tanpura_drone_cs` + `bansuri_compassion` (afterglow) →
   CB1 `chime_pop`.
3. **Scene 03:** `tanpura_drone_low` (wistful; no melody under the scolding) → **`bansuri_compassion`** across the
   montage → fades in P6.
4. **Scene 04:** `tanpura_drone` → `cheeky_pluck_1` / `cheeky_pluck_4` (the cow's tugs) → `drum_hit_low` (door) +
   `drum_pulse_fast` (the run) → `tanpura_drone_low` (the questions) → `cheeky_pluck_3` (cucumber rant, the
   sputter) → **`drum_pulse`** under the inner dilemma, **stopping on "না—"** → near-silence P8 →
   **`bansuri_compassion`** under Truth 2–3 → soft `drum_hit_low` grumble (he leaves) → `tanpura_drone_cs` +
   `bansuri_relief` tail (glow 2).
5. **Scene 05:** `tabla_soft` light → `cheeky_pluck_3` (after the quote) → `cheeky_pluck_2` (the wild guess) →
   silence (P10) → `cheeky_pluck_4` (the verdict) → AG14 `tanpura_drone` + `bansuri_compassion` settling on Sa →
   outro theme.
- `Divine_Motif` (synthesised) is not used (AUD-09); the glow beats use `tanpura_drone_cs` (C#) with a bansuri
  phrase. The Episode 6 cues in `music/ep06/` (`bansuri_pastoral`, `heartbeat_soft`) are optional alternatives
  for the montage and the dilemma.

---

## 7. Timing Totals (estimates; replace with measured lengths after recording)

| Segment | Voice | Action gaps | Pauses | Other | Total | Frames |
|---|---|---|---|---|---|---|
| Intro + source card | 6.6 s | — | — | template | 26.6 s | 638 |
| 01 kachari chat and slip | 43.6 s | 11.5 s (AG1–AG4) | 2.5 s (P1, P2) | line gaps | 60.4 s | 1,450 |
| 02 tortoise bite and Binoy | 52.9 s | 6.0 s (AG5–AG7) | 4.0 s (P3, P4) | | 66.5 s | 1,596 |
| CB1 | — | — | — | 1.2 s | 1.2 s | 29 |
| 03 six and alone | 44.3 s | 3.0 s (AG8) | 3.0 s (P5, P6) | | 52.3 s | 1,255 |
| 04 cucumber and bamboo | 86.0 s | 11.5 s (AG9–AG12) | 6.5 s (P7–P9) | | 108.8 s | 2,611 |
| 05 sereshta gossip + afterglow | 28.2 s | 6.5 s (AG13, AG14) | 2.5 s (P10, P11) | | 39.2 s | 941 |
| 99 outro + Ep 6 glimpse | 31.2 s | — | — | template | 33.2 s | 797 |
| **Total** | **292.6 s** | **38.5 s** | **18.5 s (11 pauses)** | | **about 388 s = 6:28** | **about 9,317** |

**Runtime split (voice time):**
- **Dialogue: 195.9 s (67% of all voice; 77% of the story's voice)** — Balak 53.3 s (7 lines, 16.7 s of it inner
  voice), Binoy 33.4 s (5), Haricharan 43.0 s (7), Charu 29.1 s (5), Surendra 21.4 s (5), senior clerk 10.5 s (2),
  junior clerk 5.4 s (1).
- **Narration: 96.7 s** — story bridges 58.9 s (6 short blocks: 01a, 01d, 03a, 03c, 03d, 04a) + intro 6.6 s +
  outro 31.2 s.
- **Wordless picture:** 38.5 s of action gaps + 18.5 s of pauses + 1.2 s chapter break = 58.2 s (15%).
- Compared with the delivered cut (1:58.8, 6 voice files, narration about 80% of its 81 s of voice): about 3.3 times longer,
  with the narrator's share in the story cut to about a quarter.

---

## 8. Agent Execution Checklist (Ghibli Pipeline — after approval only)

1. **Voices:** generate the 40 WAVs from section 10 in Google AI Studio → `02_Audio/Voice_WAVs_Full_Rewrite/` →
   `python scripts/normalize_audio.py` (`-16 LUFS / -1.5 dBTP`, voice-loudness skill) → copy to
   `remotion_studio/public/audio/ep05_ghibli/` (with the existing `00a_Source_Attribution.wav`). Save the three new
   voices in AI Studio first (Q3) and record them in the voice master files.
2. **Plates:** generate the 6 new images (section 3.3) into `public/images/ghibli_ep05/raw/`, add them to
   `scripts/ghibli_pipeline/manifests/ep05_ghibli.json`, run
   `python C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/prepare_episode_plates.py --manifest C:/Dipankar/Balak_Thakur_Production/scripts/ghibli_pipeline/manifests/ep05_ghibli.json`,
   check `plateAnchors.ts` and no white halos on the two tree cutouts. Log prompts and dates in an
   `Ep05_Ghibli_Asset_Sheet.md` as Episode 6 did.
3. **SFX:** source the 4–5 CC recordings (section 6B), measure, credit.
4. **Timing generator:** new `scripts/build_ep05_ghibli_timing.js` (modelled on `build_ep04_timing.js`): 5 scenes,
   11 pauses (P1–P11), 14 action gaps (AG1–AG14), 1 chapter break (CB1), the flashback dissolves; writes
   `src/ghibli_pipeline/episode05/timing.ts` and `subtitles.ts` with one-line captions (TTL-14) and chips.
   Never edit the generated files by hand.
5. **Code (one agent per file, agent-dispatch skill, shared brief file):** `Ep05GhibliProps.tsx` (section 3.4),
   `Ep05GhibliCast.tsx` (the two new clerks; Binoy, Haricharan, Surendra from `CAST`), `GhibliKachariSet.tsx`
   (family veranda view, riverbank and field views, veranda interior view), new or rebuilt scene files
   `GhibliScene01KachariChat.tsx` … `GhibliScene05SereshtaGossip.tsx`, `GhibliScene99Outro.tsx` (update),
   `Episode05Ghibli.tsx` (beds, music cues, SFX), registration in `src/ghibli_pipeline/registry.ts` and
   `src/Root.tsx` under a new id (e.g. `Episode05GhibliFull`) so the existing test composition still renders.
6. **QA:** `tsc --noEmit` (judge by own files; `param_bismoy_ep01` is not ours) → stills, contact sheets and short
   clips for lip sync, pauses and the inner-voice shots (mouth closed) via the bundle method with `--gl=angle` →
   director approval → chunked render → final SRT export → `Final_Render` only when the director asks.

**Protected fixes every agent keeps:** shared `Hand`, no outline, correct thumbs (MOT-19); breathing per character,
quicker for Haricharan, a sigh for Charu, quieter while speaking (MOT-20); halo soft and fading, never pulsing,
on Balak only, two brightenings only (BAL-05–BAL-14); Balak in the plate design with no jewellery or marks (BAL-01–
BAL-03, BAL-26e); tortoise jaws and the bamboo in contact (MOT-07); feet planted, foot-locked walks; Balak seated
at the tortoises (STO-20b) with a smooth back curve (STO-20a); size order (CHR-09); one-line captions (TTL-14);
Baloo Da 2 everywhere; no letterbox; the outro glimpse boxless (TTL-10a); Episodes 1–4, the delivered Episode 5 and
the Ghibli Episode 5 test render unchanged.

---

## 9. Open Questions for the Director

Each question gives the recommended answer first.

**Look and cast**
1. **Balak's look in Ghibli Episode 5.** *Recommended:* extend the Ghibli Episode 4 look (BAL-26f, light golden
   skin, refined chadar, `ep04BalakLook.ts`) to Ghibli Episode 5. BAL-26f today says "opt-in for Ghibli Episode 4
   only… do not touch other episode now". *Or:* keep the BAL-26/26e plate look as built in the Ghibli Episode 5 test.
2. **Binoy: neighbour's son or a cousin?** The book: "হঠাৎ পাশের বাড়ী থেকে বিনয়ের চীৎকার" and "তার সুরেন কাকার
   বাচ্চা ছেলে বীরু". "সুরেন কাকা" can mean a father's brother (so a cousin living next door) or a respectful
   "uncle" for a neighbour. *Recommended:* keep him the neighbour's son of about 14–15 (as `CAST.binoy` and STO-20),
   calling Surendra "কাকা". *Or:* make him a cousin (changes nothing in the lines).
3. **New voices.** *Recommended:* save three new AI Studio voices: `15_Binoy_Teen`, `17_Haricharan`,
   `18_Kachari_Muhuri` (prompts in section 2), and reuse `10_Grumpy_Relative` for the senior clerk. The delivered
   Haricharan line was recorded with `10_Grumpy_Relative` (a 60s voice for a man of about 30) and is replaced.
   Note the existing `14_` clash (Mangla and Ananda Master). *Or:* reuse `03_Rama_Boy2` for Binoy and
   `08_Sundar_Thakur` for the junior clerk (no new voices, but Rama's voice is 9 and Sundar is a Vedic-house uncle).
4. **Binoy speaks.** STO-20 kept him silent (the narrator quoted "গেল গেল"). *Recommended:* he speaks his book shout
   verbatim and tells what he saw (the book's own account, [implied] in his mouth). *Or:* silent as before, with the
   narrator telling his account.
5. **Balak's "ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।"** STO-20 left it out for lack of a recording.
   *Recommended:* record it (book verbatim), played as a playful, unafraid tease inside Binoy's flashback. *Or:* leave
   it out again.
6. **Who chats on the veranda.** The book: "সেদিন সবাই মিলে বেশ গল্প গুজব করছে" (no names). *Recommended:* Charu and
   Surendra on their own veranda (they are the ones who run in, STO-20). *Or:* add Binoy's mother visiting (then she
   cannot be at her own door in scene 02).

**Story order and interpretation**
7. **Scene 01–02 order.** *Recommended:* the book's order: the chat, Balak slipping out (seen by us, not by them),
   the shout, the run, the bite found, the tortoise already free, no mark, then Binoy's account as a flashback with
   his voice (the play, the bite, Balak's line, the shout). *Or:* linear (the play and bite first, then the shout and
   the run, and Binoy's account shortened to one line, since the audience saw it).
8. **Where the tortoises were and whose they were.** The book: "কোণের ঘরের দিকে শব্দ শুনে…" and "কালকের কেনা
   কচ্ছপগুলো" (bought yesterday; by whom is not said; most likely for the kitchen). *Recommended:* keep them by the
   neighbour's corner room beside a tipped bamboo basket (STO-20 staging) and let Binoy say only "কালকের কেনা"
   without an owner or purpose. *Or:* make them the family's (then why are they next door?).
9. **Chapter 9's opening (scolding and beating).** STO-20 left it out; STO-23 asks for the book's details. The book:
   "খেয়াল, অবহেলা, জড়ত্ব, দুষ্টুমি ইত্যাদি নাম দিয়ে বালককে অযথা তাড়ন ও পীড়ন করতে কারো কোনরূপ দ্বিধা বা
   সঙ্কোচ হচ্ছে না… সবাই মিলে তাকে পদে পদে অপদস্থ ও মারধর করাতে". *Recommended:* include it gently: one verbal
   scolding (03b), the narrator's soft half-line "কখনো কখনো মারও জুটত", no hitting shown. *Or:* drop the half-line
   about beating; *or:* leave the opening out and keep only the three places.
10. **Who scolds and who is relieved.** The book names "বাপ-মা, আত্মীয়-স্বজন" collectively. *Recommended:* Surendra
    scolds (03b), Charu sighs in relief (03e). *Or:* give 03b to an unnamed relative or the senior clerk (voice
    `10_Grumpy_Relative`), keeping the parents out of it.
11. **Balak's thoughts.** The book narrates his thought ("সে ভাবল, এখন যদি সে বলে দেয়… দফা রফা হবে") and his
    dilemma. *Recommended:* his whispered inner voice (04e, 04g), mouth closed, captioned `বীরু (মনে মনে)`. *Or:* the
    narrator says the same words (one more narration block, less conversation).
12. **Caption chip for thoughts.** *Recommended:* `বীরু (মনে মনে)` in the normal caption style. *Or:* the same chip
    `বীরু` in italics.
13. **"ঝাঁকা".** The book: "বিরাট একটা শশা গাছ, একটা ঝাঁকাতে বেয়ে শাখা-প্রশাখায় ছড়িয়ে পড়েছে". In village use
    a ঝাঁকা for vines is a frame of dry branches or bamboo the vine climbs (a basket is the other meaning).
    *Recommended:* keep the existing bamboo-and-branch trellis (`CucumberTrellis`) and the word "ঝাঁকা" in
    Haricharan's line. *Or:* say "মাচা" (clearer to children today).
14. **Added reactions.** The short reaction lines 04i ("অ্যাঁ! বলবি না মানে?!"), 04l (the storm-off), 05e ("ঠিক
    বলেছেন!") are [implied] by "উত্তেজিত… অধিকতর উত্তেজিত" and "বুঝতে কারো আর বাকী রইল না". *Recommended:* keep
    04i and 04l, keep 05e as optional (cut if it feels like padding). *Or:* cut all three.
15. **The gossip scene.** *Recommended:* show it (book direct speech), on the kachari's front veranda, with Haricharan
    bringing the tale (05a [implied]) and the two clerks' escalating guesses; **Surendra is not present** (the book
    speaks of "সুরেনবাবুর এই ছেলেটি" in his absence). *Or:* Surendra overhears from the doorway (not in the book).
16. **Source card.** *Recommended:* reuse the existing `00a_Source_Attribution.wav` and card (same chapters). *Or:*
    re-record it with the rewrite.

**Picture and staging**
17. **Seated at the tortoises.** The book says "উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে" (standing, bent); STO-20b chose seated.
    *Recommended:* keep seated (STO-20b) in the present and the flashback. *Or:* standing bent in the flashback only.
18. **Glow beats.** *Recommended:* two, as STO-20: the unmarked hand (P3) and the cow lowering her muzzle (P9).
    *Or:* only P9.
19. **The cow coming to Balak (P9).** Our staging, approved in STO-20 (not in the book); it shows no feeding (so the
    clerk's guess "ও নিজে ধরে নিয়েও খাইয়ে আসতে পারে" stays a guess). *Recommended:* keep. *Or:* end the grove on
    Balak alone, the cow's ear just visible.
20. **The montage of three places and the riverbank afterglow.** Two new painted places (the debdaru at the field's
    end, the jam tree by the river: 4 new images). *Recommended:* paint them; the riverbank also carries the closing
    afterglow (AG14) and the outro. *Or:* show only the banana grove (no new plates) and let the narrator name the
    other two.
21. **Balak's leaf motif** (dropped on the mat when he slips out, seen by Charu). *Recommended:* keep (a wordless
    "why", STO-22 2). *Or:* drop it.
22. **Closing words.** The narrator's new closing "কাছারির বাবুরা ভাবলেন, ছেলেটার বিষয়বুদ্ধি নেই। কিন্তু ছোট্ট বীরু
    সেদিন দুটোকেই বাঁচিয়েছিল—অবলা গাভীটিকে, আর সত্যকে।" echoes the book's "গাভী এবং সত্য দুটোকেই রাখতে হবে".
    *Recommended:* use it (gentle irony, not a sermon). *Or:* keep the delivered moral "সত্য বলা আর অসহায় প্রাণীকে
    রক্ষা করা—এই দুটোই মানুষের সবচেয়ে বড় ধর্ম।"
23. **Narrator's first line names the father's workplace** ("বীরুর বাবা সুরেনবাবু এখানেই কাজ করেন"), from chapter 4
    (STO-20), not chapter 8. *Recommended:* keep (it tells children why the family is at a kachari). *Or:* "উজানচরের
    কৃষ্ণনগর কাছারি।" alone.
24. **"দুপুরে"** in 04a (the book gives no time; STO-20 chose warm early-afternoon light). *Recommended:* keep. *Or:*
    drop the word.
25. **Length.** About 6:28 (9,317 f) against the delivered 1:58.8. *Recommended:* accept (the brief: "do not restrict
    length"); trim later from the action gaps if needed. *Or:* a tighter cut of about 5 min without the montage and
    05e.
26. **Life-layer extras.** Pigeons, hens, a squirrel, butterflies, a sunbird, a kite bird, a kingfisher, a boat
    (STO-22b). No hookah in the kachari (left out on purpose for a children's series). *Recommended:* as listed.
    *Or:* add a hookah for period colour.

---

## 10. Ready-to-Paste AI Studio Voice Script (`Voice_WAVs_Full_Rewrite/`, in order)

**Model:** `gemini-3.8-flash-tts` · **Workspace:** https://aistudio.google.com/generate-speech · Select the series
project so the saved voices appear. Save each take under the exact file name.

### 00_Intro.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Cheerful, bright, welcoming Bengali children's show announcer.`
> ছোটদের বালক ঠাকুরের গল্প। <short pause> পর্ব পাঁচ: কচ্ছপ খেলা ও গাভী রক্ষা।

### 01a_Narrator_Kachari.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Warm, gentle Bengali storyteller, a playful smile on the last sentence.`
> উজানচরের কৃষ্ণনগর কাছারি—বীরুর বাবা সুরেনবাবু এখানেই কাজ করেন। <short pause> আর ছোট্ট বীরু? সে এখন বেশ একটু দুষ্টুমি শিখে উঠেছে!

### 01b_Charu_EyeOnHim.wav
- **Speaker:** `05_Charu`
- **Style:** `Fond, half-exasperated young mother chatting on the veranda, light laugh in the voice.`
> আজকাল ওকে একদণ্ড চোখের আড়াল করার জো নেই! <short pause> একটু ফাঁক পেলেই—সবার চোখ এড়িয়ে টুক করে বেরিয়ে যায়।

### 01c_Surendra_Chuckle.wav
- **Speaker:** `04_Babukaka`
- **Style:** `Warm, amused father, chuckling softly, relaxed.`
> দুষ্টুমি শিখেছে তাহলে! <short pause> তবে তো ওকে চোখে চোখেই রাখতে হবে।

### 01d_Narrator_Slip.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Hushed, playful storyteller, like sharing a secret with the children.`
> সেদিন সবাই মিলে বেশ গল্পগুজব চলছে। <short pause> কখন যে বীরু টুক করে বেরিয়ে গেছে—কেউ টেরই পেল না!

### 01e_Binoy_Shout.wav
- **Speaker:** `15_Binoy_Teen`
- **Style:** `Sudden panicked teenage shout from the next house, loud, off-screen.`
> হায় হায়, গেল গেল—হাতটা গেল!

### 01f_Charu_Alarm.wav
- **Speaker:** `05_Charu`
- **Style:** `Startled, then a rising fear as she realises her son is gone.`
> ও কী! বিনয়ের গলা না? <short pause> বীরু... বীরু কোথায় গেল?!

### 01g_Surendra_Run.wav
- **Speaker:** `04_Babukaka`
- **Style:** `Urgent, already getting up to run.`
> পাশের বাড়ি থেকে! চলো, শিগগির চলো!

### 02a_Surendra_Bitten.wav
- **Speaker:** `04_Babukaka`
- **Style:** `Shocked gasp, breathless from running.`
> সর্বনাশ! কচ্ছপে হাত কামড়ে ধরেছে!

### 02b_Charu_FreeHand.wav
- **Speaker:** `05_Charu`
- **Style:** `Frantic, breathless mother rushing in.`
> ছাড়াও, ছাড়াও—শিগগির হাতটা ছাড়িয়ে দাও!

### 02c_Charu_NoMark.wav
- **Speaker:** `05_Charu`
- **Style:** `Breathless worry melting into astonished relief, very tender.`
> দেখি বাবা, দেখি হাতটা... <short pause> ওমা! কোথাও তো একটা দাগও নেই! <short pause> একটা আঁচড়ও না!

### 02d_Surendra_AskBinoy.wav
- **Speaker:** `04_Babukaka`
- **Style:** `Puzzled and gentle, turning to the teenage boy.`
> আশ্চর্য তো! <short pause> বিনয়, কী হয়েছিল রে? খুলে বল তো।

### 02e_Binoy_Account1.wav
- **Speaker:** `15_Binoy_Teen`
- **Style:** `Still out of breath, wide-eyed, eager to tell the story.`
> আমি বাইরে থেকে ফিরছিলাম, কাকা। <short pause> হঠাৎ শুনি, কোণের ঘরের দিকে খুটখাট শব্দ! <short pause> গিয়ে দেখি—

### 02f_Binoy_Account2.wav
- **Speaker:** `15_Binoy_Teen`
- **Style:** `Storytelling teenager, amazed, a little laugh in the voice.`
> বীরু কালকের কেনা কচ্ছপগুলো—একটা একটা করে উল্টে দিচ্ছে! <short pause> এইটুকু ছেলের কাণ্ড দেখে আমি তো অবাক। চুপ করে দাঁড়িয়ে দেখতে লাগলাম, ও কী করে।

### 02g_Binoy_Account3.wav
- **Speaker:** `15_Binoy_Teen`
- **Style:** `Building suspense, slowing down, then a sudden jolt on the bite.`
> লেজ ধরে, পাশ ধরে—নানাভাবে উল্টে দিচ্ছে। <short pause> তারপর একবার লেজ ভেবে যেই না শুঁড়টা ধরেছে— <short pause> অমনি কচ্ছপটা খপ করে হাত কামড়ে ধরল!

### 02h_Balak_Tortoise.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Playful, unafraid six-year-old gently teasing the tortoise, no pain, a smile in the voice.`
> ছাড়লি না, ছাড়লি না— <short pause> দাঁড়া, দেখাচ্ছি মজা!

### 02i_Binoy_Shouted.wav
- **Speaker:** `15_Binoy_Teen`
- **Style:** `Sheepish teenager, half laughing at himself.`
> আর ওই দেখেই তো আমি চেঁচিয়ে উঠলাম!

### 03a_Narrator_Six.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Tender, thoughtful storyteller, slower pace.`
> বীরু সবে পাঁচ পেরিয়ে ছয়ে পা দিয়েছে। <short pause> কিন্তু ওর চলন-বলন, ওর চুপচাপ ভাব—আশপাশের কারো সাথেই ঠিক মেলে না।

### 03b_Surendra_Scold.wav
- **Speaker:** `04_Babukaka`
- **Style:** `Impatient father scolding across the yard, stern but not raging.`
> এই বীরু! ডাকলে সাড়া নেই, কাজের কথায় মন নেই— <short pause> খালি খেয়াল আর দুষ্টুমি!

### 03c_Narrator_Alone.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Gentle, a little wistful, soft on the second phrase.`
> বকুনি তো লেগেই থাকত, <short pause> কখনো কখনো মারও জুটত। <short pause> তাই বীরু আরও চুপচাপ, আরও একা হয়ে গেল।

### 03d_Narrator_Places.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Soft, unhurried, painting three quiet pictures.`
> ওকে পাওয়া যেত কখনো কলাবাগিচায়, <short pause> কখনো মাঠের শেষে দেবদারু গাছের নীচে, <short pause> কখনো নদীর ধারে জামগাছতলায়—একা, চুপটি করে বসে।

### 03e_Charu_Relief.wav
- **Speaker:** `05_Charu`
- **Style:** `Tired, relieved sigh, half to herself while working.`
> যাক, চুপচাপ এক কোণে বসে আছে— <short pause> নতুন কোনো কাণ্ড তো বাধাচ্ছে না। তাতেই রক্ষে!

### 04a_Narrator_ThatDay.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Warm, calm, setting a peaceful scene.`
> সেদিন দুপুরে বীরু কাছারি ঘরের পেছনে, কলাবাগিচায় বসে আপন মনে খেলছে।

### 04b_Haricharan_Q1.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Out of breath, hot-tempered village man, bamboo in hand.`
> এই বীরু! <short pause> গরুটা কোন দিকে গেছে, দেখেছিস?

### 04c_Balak_WhatHappened.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Calm, innocent, curious six-year-old.`
> হরিচরণদা, কী হয়েছে?

### 04d_Haricharan_Cucumber.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Indignant and aggrieved, comically exaggerated grief over his cucumbers.`
> কী হয়েছে? <short pause> আমার অত বড় শশা গাছটা—গোটা ঝাঁকা জুড়ে লতিয়ে উঠেছিল! <short pause> ডগায় ডগায় কচি কচি শশা! <short pause> হতচ্ছাড়া গরু সব খেয়ে গেছে— <short pause> শুধু খায়নি, গাছটা গোড়াসুদ্ধ উপড়ে দিয়েছে!

### 04e_Balak_Inner1.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Soft whispered inner thought, very calm, close to the microphone.`
> এখন যদি বলে দিই— <short pause> ওর তো একেবারে দফা রফা হয়ে যাবে।

### 04f_Haricharan_Q2.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Impatient and more heated, leaning down.`
> কী রে, চুপ করে আছিস কেন? <short pause> তাড়াতাড়ি বল, কোন দিকে গেছে?

### 04g_Balak_Inner2.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Whispered inner thought, slow, weighing two things, then quietly decided.`
> 'জানি' বললে, গরুটা ভীষণ মার খাবে। <short pause> 'জানি না' বললে, সত্যটা যাবে। <short pause> না—গরুও থাকবে, সত্যও থাকবে।

### 04h_Balak_Truth1.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Calm, gentle, completely firm and respectful six-year-old.`
> দেখলেও বলব না। <short pause> বলে দিলে আপনি তো আর রক্ষা রাখবেন না। <short pause> আমি কিছুতেই বলব না।

### 04i_Haricharan_Sputter.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Flabbergasted splutter.`
> অ্যাঁ! বলবি না মানে?!

### 04j_Balak_Truth2.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Simple, earnest, compassionate, never preachy.`
> আমি বলে দিই, আর অমনি আপনি গিয়ে ওকে ধরে লাগান! <short pause> ও যে শশা গাছ খেয়েছে— <short pause> তা আপনার গাছ, কি আমার গাছ—ও কি বুঝে খেয়েছে?

### 04k_Balak_Truth3.wav
- **Speaker:** `12_Balak_Thakur_Child`
- **Style:** `Softer and tender, settling; the last sentence quiet and final.`
> ওর খাওয়া দরকার, তাই খেয়েছে। <short pause> ও কি আর বুঝেছিল, আপনি ওর জন্য বাঁশ নিয়ে আসবেন? <short pause> আমি ওর খবর বলতে পারব না।

### 04l_Haricharan_Storm.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Exploding in comic exasperation, turning to stomp away.`
> বাঃ! খুব ভালো! গরুর হয়ে ওকালতি হচ্ছে! <short pause> যত্তসব অদ্ভুত কাণ্ড!

### 05a_Haricharan_Report.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Still fuming, gossiping to the clerks; mimics a child's voice on the quote.`
> শুনেছেন বাবুরা? <short pause> সুরেনবাবুর ছেলে ঠিক জানে গরুটা কোথায়— <short pause> অথচ কিছুতেই বলবে না! <short pause> উল্টে বলে কিনা, 'ও কি বুঝে খেয়েছে!'

### 05b_ClerkA_SawEat.wav
- **Speaker:** `10_Grumpy_Relative`
- **Style:** `Dry, knowing, slow; peering over his spectacles.`
> হুঁ... <short pause> মনে হয়, ও খেতেও দেখেছে।

### 05c_ClerkB_FedIt.wav
- **Speaker:** `18_Kachari_Muhuri`
- **Style:** `Theatrical, leaning in, dramatic conspiratorial certainty.`
> আরে মশাই, শুধু দেখা কেন? <short pause> ও নিজে ধরে নিয়েও খাইয়ে আসতে পারে!

### 05d_ClerkA_Verdict.wav
- **Speaker:** `10_Grumpy_Relative`
- **Style:** `Shaking his head, a dry and gently comic verdict.`
> যাই বলো, সুরেনবাবুর এই ছেলেটির— <short pause> বিষয়বুদ্ধি বলে কিচ্ছু নেই! <short pause> একটা অদ্ভুত পদার্থ!

### 05e_Haricharan_Agree.wav
- **Speaker:** `17_Haricharan`
- **Style:** `Emphatic, vindicated.`
> ঠিক বলেছেন! একদম ঠিক!

### 99_Outro_Sequential.wav
- **Speaker:** `01_Narrator_Kathak`
- **Style:** `Serene, warm, gently smiling storyteller; then warm curiosity for the teaser.`
> কাছারির বাবুরা ভাবলেন, ছেলেটার বিষয়বুদ্ধি নেই। <short pause> কিন্তু ছোট্ট বীরু সেদিন দুটোকেই বাঁচিয়েছিল— <short pause> অবলা গাভীটিকে, আর সত্যকে। <short pause> ছোটদের বালক ঠাকুরের গল্প— <short pause> আসছে পরের পর্ব: জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী! <short pause> বড় ভাইয়ের মার খেয়েও ছোট্ট ঠাকুর— <short pause> কীভাবে দাদাকে বাবার হাত থেকে বাঁচালেন? <short pause> দেখুন পরের পর্বে!

*(The source card keeps the existing `00a_Source_Attribution.wav`, Q16.)*
