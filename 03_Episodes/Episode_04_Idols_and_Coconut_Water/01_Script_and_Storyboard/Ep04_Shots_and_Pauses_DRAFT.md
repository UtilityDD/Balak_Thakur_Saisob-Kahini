# Episode 4: Shot List, Pause Table and Scene Design (DRAFT for the director)

Status: **APPROVED by the director on 2026-11-22** (decision STO-19), answers checked against the book: 1. The
Vedic house (courtyard, a day version of its pond with the mandar tree, a new family shrine room). 2. The priest
is Bhagabati Thakur (book chapter 2), captioned পুরোহিত ঠাকুর. 3. Thakurma's line at home in the family talk.
4. Balak lifts the clay Shiva and rolls it into a ball (book). 5. A silent Harendra Thakur in the family talk.
6. One gentle glow beat on Thakurma's prophecy with the soft Divine_Motif; none in scenes 01 and 03.
7. Scene 03's exchange is WORDLESS (no new recordings). 8. Village_Peace_Loop; birds and breeze at the pond.
9. Chapter breaks (fade to black, soft chime) between the stories. 10. The Episode 5 glimpse: Balak with a calm
cow. 11. The listed book events are left out; the runner who brings the doll is kept. 12. Source CC recordings
for the tap on brass, a drinking sound and pond water. 13. About 2:19.
(Original draft written 2026-11-21; the sections below are the approved plan.)

Written under CAM-13 (camera grammar) and CAM-14 (pauses inside scenes), on the model of the approved Episode 2
and 3 plans (STO-16, STO-17). The director's standing answers carry over: the camera follows the narration
strictly and invents no tension; establishing lines get held wides; the intro, the source card, the outro and the
next-episode glimpse stay as the series template with **no pauses**; background sound is capped at 0.25 in pauses.

The Episode 3 lesson (STO-17a) is applied throughout: **who speaks and who is present follows the book**, not the
voice ID a line was recorded with. Every speaker and every staging fact below is quoted from the source,
`book.xlsx` (শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী): chapter ছয় "পূজার শিবলিঙ্গ ও গোবিন্দ মূর্ত্তি নিয়ে শিশু
ঠাকুরের খেলা" (row 12) for scenes 01 and 02, and chapter সাত "বিগ্রহ অভিষেকের সময় ভোগের নারিকেলোদক পান"
(row 13) for scene 03.

## How to read this

- **Shot list:** one row per narration line or clause that carries a camera decision. `f` is the line's start in
  the scene's own frames (24 fps) from today's generated `src/episode04/subtitles.ts` (2,711 frames, no pauses).
  Those starts are character-share *estimates*; where the real voice differs by more than about 8 frames, the
  start measured from the clip's silences is given as *voice ≈ f* (confirm by ear). Once pauses go in every frame
  moves, so every camera key must be tied to the narration cue (`cueLocalStory4`), not to a frame number (CAM-13).
- **Camera words:** *hold* = camera still (characters keep breathing and blinking). *cut* = hard cut. *push in* /
  *pull back* = slow eased zoom. *rack focus* = only the focus changes (not counted as a move). *dissolve* = slow
  true cross-dissolve (CAM-09). *chapter break* = fade to black, a short hold, a soft chime, a slow fade in on a
  calm establishing view (CAM-10).
- **Rules used:** one move at most per sentence or long clause; about 2 s of hold between moves; a cut when the line
  names a new subject; a close-up 6 to 8 frames *before* a speaker's line; a held wide on an establishing view; no
  drift and no handheld (nothing in Episode 4 is tense, CAM-03); faces and key action above y = 820 (CAM-07); no
  background edge (CAM-08); background calmer than the subjects (CAM-11).
- **Pauses (P):** held moments where the voice is already silent. The story waits, life goes on: breathing
  (MOT-20), Balak's slow blinks (BAL-14), glances, lamp flames, leaves. *open* = before a scene's first line;
  *end* = after its last line.
- **Action gaps (AG):** new in this plan. Two book events in scene 03 have no narration at all (Thakurma leaving
  the shrine; Balak handing in the dhoop, going in and drinking the coconut water). They need picture time in which
  the **story keeps moving**, so they are not pauses and are not counted in the pause total (see "Notes for
  whoever codes this").
- **Chapter breaks (CB):** Episode 4 tells three separate stories from two chapters (the clay Shiva, the Gobinda,
  the coconut water; "আরেকদিন তো…" starts another day), so CAM-10 applies between scenes 01 and 02 and between 02
  and 03.
- **Balak (five years old):** "তাঁর পঞ্চমবর্ষী এই অদ্ভুত পুত্রকে" (ch. 6). The Episode 3 `SeatedChild` design:
  cream dhoti and uttariya (BAL-16, BAL-17), curly dark hair, no tilak, jewellery, thread, bangles or anklets
  (BAL-01 to BAL-04); serene, half-lidded bright eyes, faint smile (BAL-12, BAL-13, BAL-22). In these stories he is
  *playful and logical*, never naughty-faced: an innocent, matter-of-fact calm while the grown-ups fret. His glow
  (`BirulGlow`) stays on and steady and **brightens gently only once** in the episode, on Thakurma's prophecy
  (scene 02, P3; director to confirm, decision 6).
- **Sound volumes:** one-shots 0.15 to 0.45, loops 0.25 or below (AUD-02, AUD-03), no bed above 0.25 in a pause.
  Paths are under `public/audio/` in the production worktree.

## The book, the recordings and who is on screen

| Clip | Recorded as | Speaks on screen | Present | Book support |
|---|---|---|---|---|
| `01a_Narrator_Shiva` | narrator | narrator (no chip) | Charu, Balak | "বাড়ীতে মা প্রতিদিন মাটি দিয়ে শিবলিঙ্গ তৈরী করে পুজো করেন। পুজো শেষ করে অনেকটা সময় মাটিতে উপুড় হয়ে প্রণাম করেন, বালক বিস্মিত হয়ে তাকিয়ে থাকে।" "যেমন মা পূজো শেষ করে সাষ্টাঙ্গে প্রণাম করছেন অমনি বালক পুজোর টাট থেকে মাটির শিব তুলে নিয়ে তার হাতের 'গলৈয়াতে' (মেলায়) কেনা রঙচঙে কাঠের পুতুলটি বসিয়ে রেখেছে।" |
| `01b_Toddler_Thakur_Clay` | Balak child voice | **Balak, to his mother** (chip বীরু) | Charu, Balak | "পুতুলটি টাটে রাখতে গিয়ে একটু শব্দ হওয়াতে মা চমকে চেয়ে দেখেন টাটে শিব নেই…" Then: "বালক কিন্তু তার কথা অনর্গল বলে যাচ্ছে―'সদ্য লাঙ্গল দেওয়া ক্ষেত থেকে আমাকে দিয়ে মাটির ঢেলাগুলো আনিয়ে সেগুলোকে পূজো করে ঘরের পেছনে ফেলে দেয়… আর এর বদলে তোমাকে আমার পুতুলটাওতো দিয়ে গেছি… তুমি এখন আমার পুতুলটা দিয়েই কাজ চালিয়ে নেও, তাহলে এটাকে আর ফেলে দিতে হবে না।'" The recording matches the book. |
| `02a_Narrator_Pond` | narrator | narrator | Balak under the mandar tree; Sundar jyetha; Charu and other family on the bank; one runner | "খুঁজতে খুঁজতে দেখা গেল পুকুরের ধারে মান্দার গাছের নীচে বসে…" "সবাই খোঁজ পেয়েছে, গিয়ে পুকুরের এধার থেকে বলছে…" "সুন্দর জ্যেঠা বলল, 'তুই খুব লক্ষ্মী ছেলে, ওটা আমায় দিয়ে দে, তোকে আরো একটা নূতন পুতুল কিনে দেব―কেমন?'" "তখন একজন দৌড়ে গিয়ে সেই কাঠের পুতুলটাকে এনে দিল।" "'না তোমাকে দেব না, সুন্দর জ্যেঠাকে দেব।' তারপর বাচ্চার হাত থেকে ঠাকুর নিয়ে সুন্দর ঠাকুর চলে গেলেন।" Charu is there: she tells this story in the book ("সবাই ওকে খুঁজতে বেরিয়ে পড়ল… আর আমি এরপর ওকে ধরে…"). |
| `02b_Thakurma_Blessing` | Thakurma | **Thakurma, to the family** (chip ঠাকুরমা, as Episode 2 and today's generator) | Thakurma, Harendra Thakur and the family, later, at home | "বাড়ীর সবাই এ ব্যাপারে আলাপ আলোচনা করতে লাগল। হরেন্দ্র ঠাকুর বললেন, 'কি যে কলাপাহাড় এল আমাদের ঘরে―'। ঠাকুমা বললেন, 'তোরা কালাপাহাড়ই বলিস আর যাই বলিস―দেখিস, এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে।'" So the line is **not said at the pond** (the manifest puts Thakurma there): it answers Harendra Thakur in a family talk afterwards. "তোরা" is the family. |
| `03a_Bhagabati_Dhoop` | Bhagabati Thakur's voice ID | **the priest** (chip পুরোহিত ঠাকুর, as today's generator) | the priest; Balak on the veranda; Thakurma leaving | "সেদিন পূর্ণিমা উপলক্ষে বিশেষ অভিষেক হচ্ছে। ঠাকুমা এই মাত্র ঠাকুরের ঘর থেকে কি কাজে ভেতরের দিকে গেলেন। সেখানে তখন আর কেউ নেই, শুধু বাবুর ঐ বাচ্চা বারান্দায় বসে বসে মনোযোগ সহকারে দেখছে পুরোহিত ঠাকুর কি করেন।" "হঠাৎ পুরোহিত ঠাকুর 'ধুপ' 'ধুপ' বলে চীৎকার করে উঠলেন। সামনে কেউ নেই, ভেতর থেকেও কোন প্রত্যুত্তর এলো না।" Chapter 7 never names the priest. Chapter 2 does name the house priest: "পুরোহিত ঠাকুর অর্থাৎ বাড়ীর কর্ত্তা ভগবতী ঠাকুর মহাশয়". So drawing him as Bhagabati Thakur (cast `bhagabati`) is supported but inferred (decision 2). |
| `03b_Toddler_Coconut` | Balak child voice | **Balak, to the priest** (chip বীরু) | the priest, Balak, alone in the shrine room | "হঠাৎ দেখল সামনে একটা বড় পাথরের বাটিতে নারকেল জল, তার সাথে বড় একটা আস্ত 'ফোপড়া'। পুরোহিত ঠাকুর যখন 'এতে গন্ধে পুষ্পে' করতে ব্যস্ত, বালক তখন আস্তে আস্তে পাথরের বাটি তুলে সম্পূর্ণ নারকেল জলটাই এক চুমুকে শেষ করে 'ফোপড়া' শুদ্ধ বাটিটা আবার যথাস্থানে রেখে দিল। তারপর ঠাকুর মশায়কে বলছে, 'ঠাকুর মশায়, আপনার ঠাকুর তো কিছুই খায় না, আমি তাই নারকেলের জলটা খেয়ে 'ফোপড়াটা' তার জন্য রেখে দিয়েছি।'" |

**Where Episode 4 happens: the Vedic house, not Ujanchar.** Every person in these chapters belongs to the joint
family at Medinimandal: Bhagabati Thakur is "কর্তা" of "নিষ্ঠাবান্ ব্রাহ্মণ পণ্ডিতের বাড়ী" (ch. 5), Charu's
sister-in-law is "জ্যেঠী ভগবতী ঠাকুরের স্ত্রী" (ch. 6), and Sundar, Harendra, Thakurma, the servant Mangla, the
family deities on "ঠাকুরের খাট" and "পুকুরের ধারে মান্দার গাছ" are all part of that house. Chapter 5 (Episode 3's
story) even says "বৈদিক বাড়ীতে ফুলের এত অভাব হয়নি". Ujanchar was only the father's posting, a small rented
"বাসা" with parents and children ("উজানচর কৃষ্ণনগর—শিশুর পিতা শ্রীসুরেন্দ্রচন্দ্র চক্রবর্তীর কর্মস্থল",
ch. 4). So this plan sets Episode 4 at the Vedic house with its established sets (STO-02, STO-03, STO-04). This
differs from the director's Episode 3 choice of Ujanchar (STO-17); decision 1.

**Book events left out because the narration does not tell them** (STO-01, and the standing answer "invents no
tension"): the elder brother fetching Balak back and the jyethi's remarks (ch. 6, scene 01); Charu's slaps ("দু'একটা
চড়চাপড়"; not for this series); Balak rolling the clay Shiva into a ball ("হাতে পাকিয়ে গোল করে ফেলেছে"; decision
4); the servant Mangla and the threat to throw the Gobinda in the pond ("আর একটু এলেই আমি এটা পুকুরে ছুঁড়ে ফেলে
দেব"); the priest's angry shout and the crowd afterwards (ch. 7). Each is listed as an option in the decisions.

---

## Scene designs and shared looks

### Props (one design each, reused wherever they appear)

- **Clay Shivalinga (মাটির শিবলিঙ্গ):** small (about a hand high), hand-shaped from dark grey-brown field clay with
  finger marks, a rounded lingam on a small clay base, one bel leaf on top, two white flowers, on Charu's brass
  টাট (a round brass puja plate) with a tiny diya and a small brass bell beside it. No glow (BAL-05).
- **Balak's wooden doll (গলৈয়ার আহ্লাদী):** a fairground wooden doll about the height of his forearm, simply turned
  and painted in bright red, yellow and green with big round painted eyes and a red smile ("রঙচঙে কাঠের পুতুল").
  The same doll in scenes 01 and 02. It must read as a toy, cheerful and a little gaudy beside the clay Shiva.
- **Brass Gobinda (পিতলের গোবিন্দ মূর্তি):** a small standing brass figure (about 25 cm) of Gobinda with a flute,
  simplified and dignified (no detailed face), on a small round base; warm brass highlights only, **no glow or
  halo** (divine light is Balak's alone, BAL-05). It is a holy object: handled with two hands by the adults.
  The same idol sits back on the deities' khat in scene 03 (continuity).
- **Stone bowl and fopra:** a wide grey stone bowl (পাথরের বাটি) brimming with clear coconut water, a whole
  off-white spongy coconut apple ("আস্ত ফোপড়া") in it; two cut green coconuts beside.
- **Dhoop:** a small brass dhoop-dani with a thin curl of smoke, standing just outside the shrine door where
  Thakurma left it (placement is ours; the book only says Balak gave it).

### Characters

| Who | Rig | Note |
|---|---|---|
| Balak, about five | `SeatedChild` (Episode 3) | All of Balak's staging is designed seated or kneeling, so no standing or walking five-year-old rig is needed. New poses needed: `kneelReach` (up on his knees, reaching to the plate), `holdInLap` (the clay, the doll or the Gobinda in both hands), `offerUp` (holding an object out with both hands), `drinkBowl` (two-hand lift, tip, set down), `pointIn`. |
| Charu | `CAST.charu` Puppet | White sari, red border, sindoor (CHR-02). New pose: a kneeling pranam, forehead to the floor, palms joined forward (the book's "সাষ্টাঙ্গে প্রণাম"; for a woman a kneeling pranam reads right). |
| Sundar jyetha | `SUNDAR` from Episode 1 (`cinematic/scenes/Scene05Rain.tsx`: spectacles, white kurta, brown shawl) | Move it to a shared cast entry rather than redraw (continuity). |
| Thakurma | `THAKURMA` from Episode 2 (`episode02/scenes/Scene01eFather.tsx`) | White, grey hair, age lines (CHR-04, BAL-23). |
| The priest | `CAST.bhagabati` (Episode 1) | Silver-streaked hair, white mustache; bare-chested with a namaboli shawl for the rite. Caption পুরোহিত ঠাকুর (decision 2). |
| Harendra Thakur | new elder figure, silent | Only a head-shake and open palms (his "কালাপাহাড়" is not recorded). Decision 5. |
| Runner (a cousin) | a child or youth Puppet (for example Episode 1's Vedic house boys, older now) | Brings the wooden doll, scene 02 only. |
| Family on the bank / in the courtyard | `CAST` women and elders | Two or three figures, background, calmer (CAM-11). |

### Sets

| Scene | Place (book) | Set | New work |
|---|---|---|---|
| 01 | Charu's daily Shiva puja at home ("বাড়ীতে মা প্রতিদিন…") | The Vedic house **inner courtyard**: `CourtyardBack` + `CourtyardFloor` + `TulsiMancha` (`src/cinematic/sets/Interiors.tsx`, STO-03); Charu at her puja on the veranda plinth | A **morning day grade** for the courtyard (Episode 1 only showed it at night): cool-warm morning light, the arch rooms unlit, soft sun across the floor. A light variant, not a redraw (as Ujanchar has morning and dawn). |
| 02A | "পুকুরের ধারে মান্দার গাছের নীচে" | The **Vedic house pond**, already established at night in front of the house (`NearVillage` in `Exteriors.tsx`, "pukur (pond) in front of Baidik Bari") | A **day pond set** drawn to match it: brick ghat steps at left, still green water with reflections, `BaidikBariDay` roofline beyond the water, and a **mandar (coral) tree** in red bloom on the right bank with Balak under it. New, because the book names the place and it has never been seen by day. |
| 02B | the family talk afterwards (no place named; at home) | The same **inner courtyard**, afternoon grade | None beyond the day grade. |
| 03 | "ঠাকুরের ঘর" and its "বারান্দা" | Veranda: the courtyard arcade (`CourtyardBack`), one arch dressed as the shrine door (threshold, a curtain tied back, lamplight inside). Interior: **new `ThakurGhar` set** | New interior: whitewashed walls with a red-oxide dado, a carved wooden khat for the family deities (the brass Gobinda, a small stone Gopal, a shalagram on a tiny throne, all small and unlit by any glow), brass lamps, a conch, copper kosha-kushi, flowers and bel leaves, and the stone bowl. Door light from the courtyard. Purnima is not shown (the narration does not say it). |

---

## Sounds available (production worktree `remotion_studio/public/audio/`)

- `ambient/` (loops, 15 s): `dawn_birds_temple`, `padma_river_day`, `bengal_night_crickets`, `monsoon_rain_courtyard`.
- `music/`: `Village_Peace_Loop` (15 s), `Warm_Family_Flute` (13 s), `Festival_Folk_Loop` (11 s), `Divine_Motif`
  (36 s), `Theme_Intro_Bansuri` (15 s), `Sacred_Night_Ambient` (14 s).
- `sfx/`: `chime_pop` (1.2 s), `soft_magical_shimmer` (2.5 s), `temple_bell_drop` (2.2 s), `river_water` (4 s),
  `uludhwani`, `goat_bleat_happy`, `cracker_burst`, `sparkler_crackle`, `distant_ship_horn`, `monsoon_rain`,
  `padma_river_day` (20 s).
- `sfx/ep02/` (credits in its README): `birds_village` (loop 6 s), `wind_soft` (loop 6 s), `cloth_rustle`,
  `footsteps_floor`, `footsteps_mud`, `clay_thud`, `paper_rustle`, `pot_clatter`, `water_splash`, `door_creak`,
  `cow_bell`, `cow_moo`, `whoosh_soft` and the rest of the Episode 2 set.
- `sfx/ep03/` (credits in its README): `girls_giggle`, `water_pour`.
- `ep04/`: the eight voices plus `00a_Source_Attribution.wav`, levelled (TIM-EP04-01).
- **Missing** (none is required; stand-ins named): a small wooden object set down on a brass plate (stand-in
  `clay_thud` at 0.15); a child's soft drinking gulp (no stand-in: leave it silent under the music); pond lapping or frogs (stand-in `river_water` at 0.12, which sounds a little like a
  flowing river); the priest's soft murmured mantra under the rite (would be a new voice clip, decision 7). All can
  be sourced as CC recordings with `sfx-from-commons`.

### Sound beds

| Scene | Bed | Under voice | In a pause | Note |
|---|---|---|---|---|
| 01 courtyard morning | `ambient/dawn_birds_temple` | 0.10 | 0.22 | The manifest's bed; right for a morning puja |
| 01 | `music/Festival_Folk_Loop` | 0.06 | 0.12 | The manifest's music, kept low for the playful mischief (decision 8: or `Village_Peace_Loop`) |
| 02A pond | `sfx/ep02/birds_village` | 0.10 | 0.20 | The manifest's `padma_river_day` is a flowing river; a still pond needs birds and breeze |
| 02A | `sfx/ep02/wind_soft` | 0.08 | 0.12 | Mandar leaves |
| 02A and 02B | `music/Warm_Family_Flute` | 0.08 | 0.15 | The manifest's music, continuous through the dissolve |
| 02B courtyard afternoon | `sfx/ep02/birds_village` | 0.08 | 0.18 | |
| 03 shrine room | `ambient/dawn_birds_temple` | 0.08 | 0.18 | Faint, from the courtyard outside |
| 03 | `music/Festival_Folk_Loop` | 0 | 0.12 | Enters softly at the drink (AG, beat d) for the gentle comedy; ducked under Balak's line at 0.06 |

The beds duck under every voice and rise in the pauses (Episode 3's `ducked()`, `DUCK_RAMP` 10, open level capped
at 0.25). Chapter breaks: beds fade out with the picture and the next scene's beds fade in with it; the chime is
`sfx/chime_pop` at 0.18 in the black (CAM-10).

---

## Intro and source card

Unchanged series template (TTL-02 to TTL-06): "পর্ব চার: শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক", no captions on the title
page, the source card after it. No pauses. The card overlaps scene 01's fade-in with no black frame, as in Episode 3.

---

## Scene 01: 01_clay_shiva_and_doll (the clay Shiva and the wooden doll), 28.4 s

**Design.** The Vedic house inner courtyard on a clear morning. On the veranda plinth, Charu (bathed, her sari end
over her head) sits on a small asana before a low wooden pidi with her brass টাট: the little clay Shivalinga she has
made, bel leaves, white flowers, a diya and a small bell. Balak sits a little behind her and to the side, cross-
legged, his painted wooden doll in his lap, watching her with wide, wondering eyes ("বালক বিস্মিত হয়ে তাকিয়ে
থাকে"). The tulsi mancha stands in the courtyard behind, soft and out of focus. Nobody else is present.

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "মা চারুশীলা প্রতিদিন মাটির শিবলিঙ্গ গড়ে পূজো করতেন।" | Wide: the courtyard veranda in morning light; Charu at her puja offering a bel leaf to the clay Shivalinga, Balak watching behind her with his doll; the tulsi mancha soft behind | Hold (fades in under the source card's end) | Establishing view and the daily habit: a held wide. Frame so the plate reads clearly (lower third, above y = 820) |
| 2 | 121 (voice ≈ 113) | "একদিন মা প্রণাম করতেই" | Medium, low: the brass টাট and the clay Shiva in the foreground at left; Charu beyond it going down into her kneeling pranam, forehead to the floor; Balak behind her | Cut on "একদিন"; hold | A new moment ("one day") and the bow the line names. The bow hides her eyes from the plate, which the next clause needs |
| 3 | 121 (voice ≈ 167) | "ছোট্ট বীরু চুপিচুপি" | Same frame: Balak glances at his bowed mother, rises onto his knees and shuffles forward to the plate, quiet, the doll in one hand | Hold | The action plays inside the frame; no second move in 2.2 s (about 2 s rule) |
| 4 | 196 (voice ≈ 215) | "পূজোর থালায় মাটির শিব সরিয়ে" | Close: the plate; Balak's small hands lift the clay Shivalinga carefully off it and hold it in his lap | Cut on "পূজোর থালায়"; hold | The line names the plate and the clay Shiva: a clean close for the action |
| 5 | 270 (voice ≈ 259) | "বসিয়ে দিল মেলায় কেনা রঙচঙে কাঠের পুতুল!" | Same close: he sets the gaudy wooden doll on the plate where the Shiva was; a tiny tap of wood on brass (≈ 290); the doll sits there grinning beside the diya and the bel leaves | Hold through the line (about 4.7 s of the doll, as the narration describes it) | The doll is the subject of the whole clause; the tap is the book's "একটু শব্দ" |
| 6 | 392 | Balak: "মা," | Medium close-up: Balak on his knees beside the plate, the lump of clay in his hands, looking up at his mother | Cut 6 to 8 f before his voice (≈ 385); hold | Speaker close-up, early |
| 7 | 392 (voice ≈ 425) | Balak: "তুমি তো রোজ ক্ষেতের মাটি দিয়ে শিব গড়ে পুজো করে পেছনে ফেলে দাও!" | Same close-up; on "পেছনে ফেলে দাও" a little toss of his hand over his shoulder (starting 6 to 8 f before the words, MOT-15) | Hold | Same speaker; his gesture carries the line. Innocent, logical, smiling (the voice script's style) |
| 8 | 533 (voice ≈ 559) | Balak: "আমি তো আমার পুতুলটা তোমায় দিয়ে গেলাম," | Two-shot across the plate: Charu, sitting up, stern, hands on her knees (her scolding is silent); Balak pointing at the doll on the plate | Cut on "আমি তো"; hold | The line turns to the trade and to her: both people and the doll in one frame |
| 9 | 616 (voice ≈ 621) | Balak: "ওটা আর ফেলতে হবে না!" | Same two-shot; Balak beams, pleased with his idea | Hold into the end pause | Same sentence's punchline; no move |

Four cuts in 28 s; the shortest hold is about 2.2 s (shot 3 inside shot 2's frame), the longest about 7 s (shot 1).

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…গড়ে পূজো করতেন।" (the voice already has 0.7 s of silence here, so about 1.7 s in all) | 1.0 s | Held wide: Charu rings the little bell once and lays a white flower on the Shivalinga; Balak, chin tilted, watches her, slow blink; the diya flame; a leaf of the tulsi stirs | `sfx/temple_bell_drop` 0.15 (her small bell); `ambient/dawn_birds_temple` rises to 0.22 |
| P2 | "…রঙচঙে কাঠের পুতুল!" (clip boundary 01a / 01b) | 2.0 s | Cut at the start of the pause to the medium two-shot: Charu's head has come up from her pranam at the tap and she stares at the plate, eyes wide, hand rising to her mouth: no Shiva, the grinning doll; Balak sits back on his heels with the clay lump, unbothered, faint smile. Then the cut to his close-up 6 to 8 f before "মা," | `sfx/ep02/cloth_rustle` 0.15 as she sits up; birds 0.20 |
| P3 | *end*, after "…ফেলতে হবে না!" | 1.0 s | The two-shot holds: Balak smiles up at her; Charu, speechless, presses her palm to her forehead. Then chapter break 1 | `music/Festival_Folk_Loop` 0.12, birds 0.20, both fading with the picture |

**Scene total: 4.0 s.** Glow: steady (no key beat; decision 6).

**Chapter break 1 (CB1, 1.0 s, not a pause):** fade to black over the last 18 f of P3's picture, 8 f of black with
`sfx/chime_pop` 0.18, then scene 02 fades in over 30 f during its open pause.

---

## Scene 02: 02_gobinda_pond_and_thakurma (the Gobinda at the pond; Thakurma's words), 21.3 s

Two beats in one scene: **02A** at the pond (narrator), **02B** in the courtyard later that day (Thakurma), joined by
a slow cross-dissolve inside P2.

**Design 02A.** The Vedic house pond on a bright late morning: the brick ghat at left, still green water holding the
house's reflection, and on the right bank the mandar tree in red bloom. Balak sits under it, cross-legged, the small
brass Gobinda in both hands in his lap, turning it to the light and talking to it softly (no voice). Sundar jyetha,
Charu and one or two relatives come down to the near bank ("পুকুরের এধার থেকে"); a young cousin runs up later with
the wooden doll.

**Design 02B.** The inner courtyard in afternoon light. The elders sit and stand on the veranda talking it over:
Harendra Thakur shakes his head, palms up (silent); Thakurma sits on a low stool. Across the courtyard by the tulsi
mancha, Balak sits with his wooden doll, unaware (his presence is our staging, decision 5).

### Shot list

**02A: the Gobinda at the pond (narrator)**

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "আরেকদিন তো পিতলের গোবিন্দ মূর্তি নিয়ে পুকুরপাড়ে চলে গেল!" | Wide: the pond, the ghat, the house across the water, the mandar tree; Balak under it in the right third, the brass Gobinda glinting in his hands (he is about 300 px tall so the idol reads) | Hold (fades in from black during the open pause) | Establishing view of a new place and "another day": a held wide, with both named things (the Gobinda, the pond) in it |
| 2 | 98 (voice ≈ 79) | "সুন্দর জ্যেঠা তখন মিষ্টি কথায় বুঝিয়ে" | Medium wide: Sundar jyetha comes down the bank and crouches a few steps from Balak, open palm, a soft coaxing smile; Charu and a relative wait on the ghat steps behind, hands clasped; Balak holds the Gobinda to his chest, considering | Cut on "সুন্দর জ্যেঠা"; hold | The line names Sundar: cut to him and the child together. His "sweet words" are gestures; his mouth stays soft and closed under the narration |
| 3 | 150 (voice ≈ 163) | "তাঁর কাঠের পুতুল ফিরিয়ে দিয়ে" | Medium two-shot in profile, Sundar left, Balak right: the cousin (who ran in at the end of shot 2) puts the painted doll into Sundar's hand, and Sundar holds it out to Balak | Cut on "তাঁর কাঠের পুতুল"; hold | The doll is named: the exchange framed close enough to read both objects |
| 4 | 205 (voice ≈ 208) | "তবেই গোবিন্দ উদ্ধার করলেন।" | Same two-shot: Balak takes his doll in one hand and lays the Gobinda in Sundar's two hands (both hands on it, MOT-07) | Hold into P2 | Same sentence; no second move (only about 1.9 s after the cut) |

**02B: Thakurma's words**

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 5 | 271 | Thakurma: "তোরা ওকে যতই কালাপাহাড় বলিস— দেখিস," | Medium close-up: Thakurma on the veranda, raising a hand to quiet the grumbling | Cut 6 to 8 f before her voice (≈ 264), after the dissolve has settled on the courtyard wide; hold | Speaker close-up, early. She answers the family ("তোরা") |
| 6 | 373 (voice ≈ 355, confirm by ear: the dash is not a silence) | Thakurma: "এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!" | Over Thakurma's shoulder (soft, left) across the courtyard to Balak by the tulsi mancha with his doll, sharp | Cut on "এই কালাপাহাড়ই"; hold through the line and P3 | "This" Kalapahar: the picture shows whom she means. The prophecy is felt on the child |

Five camera changes in 21 s (four cuts and the dissolve); the shortest hold between moves is about 3.5 s (shot 2 to
shot 3).

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | *open*, before "আরেকদিন তো…" | 1.0 s | The fade-in from chapter break 1 lands on the held wide: ripples cross the still water, a red mandar flower drops onto it; Balak under the tree turns the brass Gobinda to the light, a slow blink. The fade runs on `lifeF` (it plays while the story holds) | `sfx/ep02/birds_village` rising to 0.20; `sfx/river_water` 0.12 (stand-in for pond lapping) |
| P2 | "…গোবিন্দ উদ্ধার করলেন।" (clip boundary 02a / 02b) | 3.0 s | (a) 1.5 s at the pond: Sundar draws the Gobinda to his chest with both hands and closes his eyes with a small bow of the head; Balak hugs his wooden doll, happy; on the steps Charu lets out a visible sigh of relief (MOT-20). (b) 1.5 s: a slow cross-dissolve (36 f, CAM-09) into the courtyard wide: the elders talking on the veranda, Harendra shaking his head, Thakurma on her stool; Balak small by the tulsi mancha | `sfx/ep02/cloth_rustle` 0.15 on the hand-over; `music/Warm_Family_Flute` rises to 0.15 and carries the dissolve; birds cross-fade from pond to courtyard |
| P3 | *end*, after "…কৈলাসপতি হয়ে উঠবে!" | 2.0 s | The over-shoulder shot holds: Balak looks up from his doll toward the elders with his serene, faint smile; his glow brightens gently (the episode's one key beat, BAL-11); Thakurma's soft shoulder nods once. Then chapter break 2 | `sfx/soft_magical_shimmer` 0.15 as the glow lifts (or `music/Divine_Motif` 0.15, decision 6); flute 0.12 fading with the picture |

**Scene total: 6.0 s.**

**Chapter break 2 (CB2, 1.0 s, not a pause):** as CB1, into scene 03's opening action gap.

---

## Scene 03: 03_coconut_water_abhishek (the coconut water), 11.6 s today

**Design.** The family shrine room of the Vedic house on the day of a special abhishek, late morning. Inside, the
priest (Bhagabati Thakur's figure, decision 2) sits before the deities' khat with the rite laid out: lamps, conch,
copper vessels, flowers, and the stone bowl of coconut water with the fopra. Outside, on the veranda edge by the
door, Balak sits with his chin on his knees, watching; he is forbidden to go in ("তার ঘরে ঢোকা বারণ"). The
narration has no line for the drink; the action is told in picture, in the order the book gives, before Balak's line
explains it.

### Shot list (with the action gaps)

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| AG1 | open, 2.5 s | (no voice) | Wide from the courtyard: the shrine door with lamplight inside, the priest at the rite seen through it; Thakurma steps out over the threshold with an empty brass tray and walks off into the house (book: "ঠাকুমা এই মাত্র ঠাকুরের ঘর থেকে… ভেতরের দিকে গেলেন"); Balak alone on the veranda edge, watching inside | Hold (fades in from black) | Establishing view of a new place, and the book's "সেখানে তখন আর কেউ নেই" |
| 1 | 0 | Priest: "ধুপ! ধুপ কই?" | Medium, inside: the priest looks up from the rite and calls toward the inner door, hand out | Cut 6 to 8 f before his voice; hold | Speaker close-up, early |
| AG2a | after P1, about 3.0 s | (no voice) | Medium, veranda: Balak sees the smoking dhoop-dani by the door, picks it up in both hands, kneels up at the threshold and holds it in; the priest's hand reaches back and takes it without looking; his head nods twice (the book's "হুঁ হুঁ") | Cut; hold | The book's first exchange, told in action |
| AG2b | about 1.5 s | (no voice) | Same frame: Balak points inside with raised brows (asking to sit); the priest nods again without looking up | Hold | The book's "আমি ঘরে বসব?" / "হুঁ হুঁ", in action |
| AG2c | about 1.0 s | (no voice) | Inside, medium wide: Balak now seated on the floor near the offerings, looking about carefully ("বিশেষ যত্ন সহকারে নিরীক্ষণ"); his eyes stop on the big stone bowl and the fopra | Cut (a time cut across the threshold); hold | He has gone in; the new subject is the bowl |
| AG2d | about 2.0 s | (no voice) | Two-shot: the priest, eyes closed, absorbed in "এতে গন্ধে পুষ্পে", sprinkling flowers; Balak lifts the stone bowl in both hands, drinks it all in one long draught ("এক চুমুকে"), and sets it back in its place with the fopra | Cut; hold | The drink, plainly seen, both people in frame |
| 2 | 60 | Balak: "ঠাকুরমশায়," | Medium close-up: Balak beside the bowl, sweet and pleased | Cut 6 to 8 f before his voice (after P2); hold | Speaker close-up, early |
| 3 | 81 (voice ≈ 89) | Balak: "আপনার ঠাকুর তো মুখ দিয়ে খায় না—" | Two-shot: the priest opens his eyes and turns to him; Balak gestures toward the deities' khat | Cut on "আপনার ঠাকুর"; hold | The line turns to the priest and his deities: both in frame |
| 4 | 145 (voice ≈ 143; "ফোপড়াটা" ≈ 190) | Balak: "তাই আমি নারকেলের জলটা খেয়ে ফোপড়াটা ওর জন্য রেখে দিয়েছি!" | Close: the stone bowl, empty but for the fopra, Balak's small hand presenting it | Cut on "ফোপড়াটা"; hold into P3 | The line names the fopra: show what he left |

Today the scene is 279 frames; with the two action gaps (10.0 s) and three pauses (4.0 s) it becomes about 25.6 s.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…ধুপ কই?" (clip boundary 03a / 03b, before AG2) | 1.0 s | The priest's medium holds: he waits, glancing at the empty inner doorway; nobody comes ("ভেতর থেকেও কোন প্রত্যুত্তর এলো না"); the lamp flames lean in the draught | `ambient/dawn_birds_temple` 0.18 only: the silence of no answer |
| P2 | end of AG2, before "ঠাকুরমশায়," | 1.0 s | The two-shot holds: Balak sits back, licks his lips, content, hands in his lap; the fopra alone in the empty bowl; the priest still lost in the rite, eyes closed | `music/Festival_Folk_Loop` 0.12 (entered at AG2d); `sfx/ep02/cloth_rustle` 0.15 as Balak settles |
| P3 | *end*, after "…রেখে দিয়েছি!" | 2.0 s | Cut at the start of the pause to the two-shot: the priest looks from the bowl to the boy and back, his face slowly reddening ("ঠাকুর মশায়তো চটে একেবারে লাল"), his mouth falling open; Balak beside him smiles innocently, quite sure he has done the sensible thing. Then the series fade into the outro | `sfx/temple_bell_drop` 0.15 (the priest's bell knocks once as his hand drops), flute or folk loop 0.12 fading with the picture |

**Scene total: 4.0 s** (plus 10.0 s of action gaps). Glow: steady (decision 6).

---

## Scene 99: closing outro and the Episode 5 glimpse

Left as the series template (TTL-09, TTL-10a, TTL-11, TTL-12): no pauses, no camera changes. The glimpse of Episode 5
("কচ্ছপ খেলা ও গাভী রক্ষা") is a calm, boxless moment; suggested: Balak's hand resting on the neck of a calm humped
Bengal cow in soft light (ANI-04), the label "পর্ব পাঁচ" in glowing cream-gold type (decision 10). As
TIM-EP04-01 records, Episode 4 has no separate `98_next_episode` segment; the glimpse is a layer inside the outro.
Note for continuity: Episode 3's glimpse of Episode 4 shows a clay Shivalinga by a pond at sunset; the Shivalinga
prop above should match it.

---

## Totals

| Scene | Pauses | Added by pauses | Other added time | Frames today → planned |
|---|---|---|---|---|
| Intro, source card | none (template) | 0 | | 635 → 635 |
| 01 clay Shiva and doll | 3 | 4.0 s | CB1 1.0 s | 682 → 778 (+24 for CB1) |
| 02 Gobinda at the pond; Thakurma | 3 | 6.0 s | CB2 1.0 s | 511 → 655 (+24 for CB2) |
| 03 coconut water | 3 | 4.0 s | AG1 2.5 s + AG2 7.5 s | 279 → 615 |
| 99 outro and Episode 5 glimpse | none (template) | 0 | | 643 → 643 |
| **Total** | **9** | **14.0 s (336 f)** | **12.0 s (288 f)** | **2,711 → about 3,335** |

- **Episode 4 today:** the SRT runs **1:32.9** (92.856 s, voices only, no source card); the generated timeline
  (`build_ep04_timing.js`, TIM-EP04-01, with the source card) is **2,711 frames (1:53.0)**.
- **Pauses:** 14.0 s = **12.4 %** of the 2,711-frame episode (Episode 3's measure: 13.8 %), or 15.1 % of the SRT's
  92.9 s.
- **Planned length:** about **3,335 frames (about 2:19.0)**: 3,047 frames (2:07.0) with the pauses, plus 10.0 s of
  action gaps in scene 03 and 2.0 s of chapter breaks. Report the generator's number when it runs (dissolve and
  tail overlaps change it by a few frames).
- **Trimmed version** (if the director wants it shorter): scene 01 P2 1.5 s and scene 02 P2 2.5 s (a 24 f
  dissolve, below CAM-09's 36 f): 13.0 s of pauses (11.5 %), about 3,311 frames (2:18.0).

---

## Notes for whoever codes this (after approval)

- **Generator (`scripts/build_ep04_timing.js`, in the worktree, untracked).** Its `PAUSES` is empty (TIM-EP04-01);
  its header comment still describes Episode 3 and should be tidied when the table goes in. Entries:
  - `{ scene: "01_clay_shiva_and_doll", after: "গড়ে পূজো করতেন।", sec: 1.0, clip: "01a_Narrator_Shiva.wav", silence: [3.988, 4.701] }`
    (the caption estimate ends at 5.04 s, 0.70 s from the silence's middle, beyond `PAUSE_TOL`: name it)
  - `{ scene: "01_clay_shiva_and_doll", after: "কাঠের পুতুল!", sec: 2.0 }` (clip boundary, no cut)
  - `{ scene: "01_clay_shiva_and_doll", at: "end", sec: 1.0 }`
  - `{ scene: "02_gobinda_pond_and_thakurma", at: "open", sec: 1.0 }`
  - `{ scene: "02_gobinda_pond_and_thakurma", after: "গোবিন্দ উদ্ধার করলেন।", sec: 3.0 }` (clip boundary)
  - `{ scene: "02_gobinda_pond_and_thakurma", at: "end", sec: 2.0 }`
  - `{ scene: "03_coconut_water_abhishek", after: "ধুপ! ধুপ কই?", sec: 1.0 }` (clip boundary; then AG2, then P2)
  - scene 03 P2 (1.0 s at the end of AG2, before "ঠাকুরমশায়,") and `{ scene: "03_coconut_water_abhishek", at: "end", sec: 2.0 }`
  - No clip needs cutting except `01a`; every other pause sits at a clip boundary or an open or end.
- **Action gaps need a new generator kind.** A pause holds the story clock; AG1 and AG2 need time in which `f`
  keeps running. Suggested: a `GAPS` table, `{ scene, at: "open", sec: 2.5 }` and
  `{ scene, after: "ধুপ! ধুপ কই?", sec: 7.5 }`, that lengthens the scene's *authored* timeline (03b and everything
  after move later, as an `INSERTS` lead does) without holding `f`, exported as `EP04_GAPS` so the scene can key
  AG2's beats (a to d) inside it. At the 03a/03b boundary the order is P1 hold 1.0 s, AG2 7.5 s running, P2 hold
  1.0 s, then 03b. Fallback if that is too much work: one 9.5 s pause at the boundary with the AG2 action driven on
  `lifeF` inside `pause.t` (the Episode 3 scene 01 method).
- **Chapter breaks** (CAM-10): 1.0 s inserted after scene 01's and scene 02's end pauses (an Episode 2 style
  `BREATHS` entry), exported for `Episode04.tsx` to draw the black and place `chime_pop`. Today's 1 s `TAIL` overlaps
  each next scene by 0.55 s; at these two joins it must fade through black, not cross-dissolve. The fade-ins of
  scenes 02 and 03 run on `lifeF`, because they play during an open pause or an action gap.
- **Measured silences** (silencedetect -45 dB / 0.12 s on the played 48 kHz files in `public/audio/ep04`, seconds;
  the clause mapping is from the sentence order and lengths, confirm by ear):
  - `01a_Narrator_Shiva` (15.87 s): 1.28-1.40, **3.99-4.70 (sentence end, P1)**, 5.52-5.77, 6.82-6.97 (after
    "প্রণাম করতেই"), 7.89-8.15, 8.80-8.96 (after "চুপিচুপি"), 10.62-10.78 (after "শিব সরিয়ে"), 15.54-end.
  - `01b_Toddler_Thakur_Clay` (11.09 s): 0.90-1.38 (after "মা,"), 1.88-2.03, 4.65-4.86, **6.19-6.97 (sentence end;
    room for an optional extra pause)**, 9.09-9.56 (after "দিয়ে গেলাম,"), 10.64-end.
  - `02a_Narrator_Pond` (10.86 s): 2.06-2.18, 3.16-3.31 (sentence end, only 0.15 s, not used), 6.65-6.79, 8.47-8.67
    (after "ফিরিয়ে দিয়ে"), 10.46-end.
  - `02b_Thakurma_Blessing` (8.99 s): 6.70-6.85, 8.72-end. The dash after "বলিস" is **not** a silence: no pause can
    go inside this line.
  - `03a_Bhagabati_Dhoop` (2.04 s): "ধুপ!" 0-0.56, silence 0.56-1.02, "ধুপ কই?" 1.02-1.76.
  - `03b_Toddler_Coconut` (8.15 s): "ঠাকুরমশায়," 0-0.89, silence 0.89-1.22, 3.24-3.45 (after "খায় না—"), 7.73-end.
- **Captions:** today's phrase chunks are character-share splits that cross clauses ("সরিয়ে বসিয়ে দিল মেলায় কেনা
  রঙচঙে"), and the "একদিন…" caption starts about 0.3 s after the voice. The cut at P1 re-spreads 01a's phrases;
  check the rest by ear. Chips বীরু (01b, 03b), ঠাকুরমা (02b), পুরোহিত ঠাকুর (03a) are already what the generator
  writes (confirm after decision 2). Only the speaker's mouth moves; Sundar's coaxing is gesture only.
- **Story clock:** `useStory4`, `cueLocalStory4`, `clipSpan4`, `pausesFor4` exist in `src/episode/storyClock.ts`
  (TIM-EP04-01). Choreography, mouths and camera keys on `f`; `lifeF` to every Puppet, `SeatedChild`, `BirulGlow`,
  lamp flames, water and leaves (blinks on `lifeF`, PIT-03).
- **What must be built** (none exists): `src/episode04/Episode04.tsx` (timeline, beds, SFX, pause and break sounds),
  `scenes/Scene00Intro`, `Scene01ClayShivaAndDoll`, `Scene02GobindaPondAndThakurma`, `Scene03CoconutWaterAbhishek`,
  `Scene99ClosingSequentialOutro` (template + Episode 5 glimpse), registration in `src/Root.tsx`; the props above;
  the day courtyard grade, the day pond set with the mandar tree and the `ThakurGhar` interior (one new set file,
  with a keep-in-set camera clamp like `ujancharKeepInSet`, CAM-08); `SeatedChild` poses `kneelReach`, `holdInLap`,
  `offerUp`, `drinkBowl`, `pointIn`; Charu's kneeling pranam on the Puppet; `SUNDAR` and `THAKURMA` moved to a shared
  cast. Suggested agents (agent-dispatch, one per file): the three scene files, the sets file, `SeatedChild.tsx`
  (shared with Episode 3: its existing poses and Episode 3's frames must not change), the Puppet pose for the pranam,
  and `Episode04.tsx` for sound last.
- **Protected fixes every agent keeps:** the shared `Hand` with no outline and correct thumbs (MOT-19);
  `puppetBreath` breathing, quieter while speaking (MOT-20); `BirulGlow` soft falloff, no rings or rays, never
  pulsing with breath (BAL-06, BAL-07); no glow on any idol, prop or other character (BAL-05); Balak with no tilak,
  jewellery, thread, bangles or anklets (BAL-01 to BAL-03); objects stay in hands (MOT-07); the intro, the source
  card overlap with no black frame, and the outro glimpse with no box (TTL-10a); no letterbox (CAM-04: nothing here
  is a sacred reveal); Baloo Da 2 for all text (TTL-01).

---

## For the director to decide

1. **Where Episode 4 happens.** The book places all three stories in the Medinimandal **Vedic house** (Bhagabati,
   Sundar, Harendra, Thakurma, the family shrine and the pond belong there; Ujanchar was only the father's posting).
   This plan uses the Vedic house courtyard, a day version of its pond and a new shrine room. Approve, or set it at
   the Ujanchar house to match your Episode 3 choice (STO-17)? (At Ujanchar the shrine room, the pond and the joint
   family have no place in the book.)
2. **The priest in scene 03.** Draw him as Bhagabati Thakur (chapter 2 names him as the house priest; chapter 7 says
   only "পুরোহিত ঠাকুর") with the caption **পুরোহিত ঠাকুর** (the book's word, today's generator), or caption him
   ভগবতী ঠাকুর, or make him an unnamed family priest?
3. **Thakurma's line.** In the book she says it at home in the family talk after Harendra Thakur's "কালাপাহাড়"
   remark, not at the pond. This plan dissolves to the courtyard for it. Approve, or keep her at the pond as the
   manifest has it (one set, simpler)?
4. **The clay Shiva.** Balak lifts it off the plate and holds it (the narration's "সরিয়ে"), or also rolls it into a
   ball as the book says ("হাতে পাকিয়ে গোল করে ফেলেছে")?
5. **Who is in the courtyard (02B).** A silent Harendra Thakur shaking his head (a new elder figure), and Balak by the
   tulsi mancha so that "এই কালাপাহাড়" points at him (our staging; the book does not say he was there)?
6. **Glow and motif.** One gentle glow beat in the whole episode, on Thakurma's prophecy (02 P3), with
   `soft_magical_shimmer`, or `Divine_Motif` there? None in scenes 01 and 03 (mischief, told plainly)?
7. **Scene 03's wordless action (10 s).** Keep the dhoop, the asking and the drink wordless (no new recordings), or
   record the book's short lines and insert them: Balak "ঠাকুর মশায়, আমি ধুপ দেব?" and "আমি ঘরে বসব?", the
   priest's "হুঁ হুঁ", and optionally a soft murmured "এতে গন্ধে পুষ্পে…" under the rite?
8. **Music and beds.** `Festival_Folk_Loop` (the manifest's) low under scenes 01 and 03, or the calmer
   `Village_Peace_Loop`? Birds and breeze at the pond instead of the manifest's river bed `padma_river_day`?
9. **Chapter breaks.** Fade to black with a soft chime between all three stories (CAM-10: separate stories), or slow
   cross-dissolves?
10. **The Episode 5 glimpse.** Balak's hand on a calm humped cow (the "গাভী রক্ষা" story), or the tortoise?
11. **Book events left out.** Confirm leaving out the elder brother and the jyethi (01), Charu's slaps (01), the
    servant Mangla and the threat to throw the Gobinda in the pond (02), and the priest's shout and the crowd (03).
    The runner who brings the doll to Sundar is kept (book: "একজন দৌড়ে গিয়ে…"); or should Sundar simply hold it?
12. **Missing sounds.** Source CC recordings for the wooden tap on brass, a soft drinking gulp and pond water, or use
    the stand-ins (`clay_thud`, silence, `river_water`)?
13. **Length.** About 2:19 (9 pauses, 14.0 s, plus 10 s of scene 03 action and 2 s of chapter breaks), or the
    trimmed 2:18?
