# Episode 6: Shot List, Pause Table and Scene Design (APPROVED 2026-11-22, STO-21)

> **Status: APPROVED 2026-11-22** on the recommended answer to every question below (the director: "proceed with your plan"). Recorded as STO-21.

Status: **DRAFT, not yet approved** (written 2026-11-22). The director's answers to "For the director to decide" at
the end turn this into the approved plan (as STO-20 did for Episode 5). Nothing here is coded yet.

Written under CAM-13 (camera grammar) and CAM-14 (pauses inside scenes), on the model of the approved Episode 5 plan
(STO-20). Standing answers carry over: the camera follows the narration strictly and invents no tension; establishing
lines get held wides; the intro, the source card, the outro and the next-episode glimpse stay as the series template
with **no pauses**; background sound at most 0.25 in pauses; separate stories are divided by a chapter break (CAM-10);
cinematic score with Indian instruments and a cue sheet (AUD-07); Balak in the reference-plate design (BAL-26).

STO-18 applies throughout: **place, people and speakers come from the book**. Source: `book.xlsx`, sheet 1, column D:
- Scene 01: chapter দশ "পিতার নিগ্রহ থেকে জ্যেষ্ঠ ভ্রাতাকে উদ্ধার" (**row 16**).
- Scene 02: chapter বার "খেলার সাথীকে বালক ঠাকুরের উপযুক্ত শিক্ষা" (**row 18**, its second half: the treasurer and
  the ten-rupee note). The narration's first clause ("ভোলাভালা ভেবে প্রায়ই ঠকাত") summarises chapter এগার
  "উদাসীন অন্যমনস্ক বালক ঠাকুরের সাথে খেলার সাথীদের ব্যবহার" (**row 17**: the stitched ball and glued marbles).
- The first half of chapter বার (the boys on the dheki-ghar roof, "হায়রে, এখানেও পূজো") is **not** narrated and is
  left out. Row 19 (chapter তেরো, লববাবুর পাঠশালা) is the next episode.

## How to read this

- **Shot list:** one row per line or clause that carries a camera decision. Times are **seconds inside the voice
  clip**, measured with silencedetect (-38 dB, 0.12 s) on `02_Audio/Voice_WAVs/*.wav`; the mapping of words to
  speech runs is by sentence order and length (*≈*: confirm by ear). Episode 6 has no `subtitles.ts` yet, so there are
  no scene frames; every camera key must be tied to its narration cue (`cueLocalStory6`), not a frame (CAM-13).
- **Camera words, pauses (P), action gaps (AG), chapter break (CB):** as in the Episode 5 plan. *P* = the story
  waits while life goes on; *AG* = picture time with no narration in which the story keeps moving (TIM-GAP-01); *CB* =
  fade to black, a short hold, a soft chime, a slow fade in (CAM-10).
- **Rules used:** one camera move at most per sentence; about 2 s between moves; a cut when the line names a new
  subject; a close-up 6 to 8 f before a speaker's line; held wides on establishing views; no drift, no handheld; faces
  and key action above y = 820; no background edge; background calmer than the subjects (CAM-07, 08, 11, 13).

---

## The book, the recordings and who is on screen

| Clip | Length | Recorded as | Speaks on screen | Present | Book |
|---|---|---|---|---|---|
| `01a_Narrator_Brother` | 17.37 s | narrator | narrator | Balak, the elder brother (দাদা), the father; two classmates at the fence (shot 1 only) | "সেদিন আবার ঝগড়া বেধেছে দুই ভাইয়ে, অর্থাৎ **পাঠশালা থেকে ফিরে খাবার পেতে দেরী হয়েছে**। বড় ভাই যথাশক্তি তিরস্কার করে যাচ্ছে, আর ছোট ভাই নীরবে তা হজম করে যাচ্ছে… বড় ভাই… অনুজকে বেশ একচোট দিলেন। **ছোট ভাই মার খেয়ে কাঁদতে লাগল**। কান্না শুনে পিতা তাড়াতাড়ি এসেছেন… বড় ছেলেকে খুঁজছেন… ওদিকে বড় ছেলে **বাবার 'খড়মের' শব্দ শুনেই চম্পট দিল**। এদিকে ছোট ভাই আবার দেখে ফেলেছে বড় ভাই কোথায় লুকিয়েছে। বাবা… 'বল ও কোথায়?' … **গুপ্তস্থান থেকে বড় ভাই ইসারায় ছোট ভাইকে অনুরোধ করছে, 'বলিস না আমি কোথায়।'** এদিকে তখনও ছোট ভাইয়ের পিঠের ব্যথা যায় নি। **ব্যথায় তখনও পিঠ বেঁকা করে দাঁড়িয়ে আছে**… **বালক একবার গুপ্তস্থানের দিকে, একবার বাবার দিকে তাকাচ্ছে**।" |
| `01b_Young_Thakur_Forgive` | 5.49 s | Balak child voice | **Balak, to his father** (chip বীরু) | Balak, the father (the brother hidden) | "বালক বলল, '**যাও আমি বলব না, বললে তো তুমি দাদাকে মারবে।**'" The recording adds "বাবা" ("যাও বাবা, আমি বলব না…"): faithful. Afterwards: "বাবা বললেন 'বোকাটা বলবে না আবার মারও খাবে…' **বাবা কাছারীতে চলে গেলেন। বড় ভাই ধীরে সেই গুপ্তস্থান থেকে বেরিয়ে এসে বালকের সামনে দাঁড়াল।** কনিষ্ঠের মহানুভবতায় তার উদ্ধৃত স্বভাবের উপর যেন সাময়িক একটা করুণার প্রলেপ পড়ল… **সে হাসতে হাসতে চলে গেল।**" |
| `02a_Narrator_Friends` | 21.94 s | narrator | narrator | Balak, the playmates, the culprit friend, the friend's boudi | Ch. 11: "খেলতে খেলতে বল ফেটে যেত, অমনি তাড়াতাড়ি সেটাকে যে-সেভাবে সেলাই করে বালককে এনে খেলতে দিয়ে যেত। **বালক অত্যন্ত খুশী হয়ে সরল মনে বলটি খেলতে আরম্ভ করত**…" Ch. 12: "কোন মূল্যবান জিনিষ বিশ্বাস করে কেউ রাখতে হলে সর্বাগ্রে তাকেই খোঁজ করে। **খেলার মাঠে**… treasurer এবং store-keeper সে-ই… খুঁটিনাটি করে সবার সব কিছু বুঝিয়ে দেয় ঠিক ঠিক ভাবে।" "একজন খেলার সাথী তাকে একটা **দশ টাকার নোট** রাখতে দিয়েছে… '**দাদার পকেট থেকে চুরি করে এনেছি।**' বালক তার দাদাকে খুব ভাল করে চিনত এবং সেও দাদা বলেই ডাকত… এদিকে ছেলেটি গেল গ্রামের ভেতর। **বালক পড়েছে মহা ফ্যাসাদে**… আস্তে আস্তে **তাদের বাড়ী গিয়ে তার বৌদিকে** বলছে…" |
| `02b_Narrator_Lozenges` | 10.44 s | narrator | narrator | Balak, the boudi, the friend's dada, the culprit, the playmates, a sweet-seller | "এদিকে তার সেই খেলার সাথী কয়েকজন বন্ধুবান্ধব নিয়ে ফিরে এসেছে… **সুখাসনে উপবিষ্ট বালক হঠাৎ মাথায় হাত দিয়ে** উবু হয়ে বসে বলছে, 'কি বলছিস, ওটা কি এখনও আছে নাকি?'… 'আমি কিন্তু দাদার কাছে গিয়ে সব বলে দেব।'… দাদা পকেট পরীক্ষা করে দেখলেন… '**বৌদিকে দিয়েছিস! আচ্ছা ডাকতো তোর বৌদিকে।**' তারপর বৌদি এলেন। সব রহস্য ফাঁস হয়ে গেল। **অপরাধী পেল উপযুক্ত শাস্তি** আর বালক পেল লজেন্স খাওয়ার জন্য দু আনা পয়সা। অন্যান্য খেলার সাথীরা তো সব দেখে শুনে **'থ'**। শেষ পৰ্য্যন্ত **বালক সবাইকে ডেকে** ঐ দু আনা দিয়ে **মিষ্টি মার্বেল-লজেন্স** খাইয়ে দিল।" |

**Where Episode 6 happens: Ujanchar.** Chapter 10 ends "বাবা **কাছারীতে** চলে গেলেন": the father is at home beside
his Krishnanagar kachari, so scene 01 is the family's **Ujanchar village house** (`UjancharHouse`, STO-10), the same
veranda where Episode 5's outro glimpse showed Balak with the father's khadam on the step. Chapter 12 gives no village:
only "খেলার মাঠ", "গ্রামের ভেতর" and the friend's house ("তাদের বাড়ী"). It follows chapter 10 and 11 in the
Ujanchar years, so the plan puts it at **Ujanchar** too: a village playing field under mango trees (the manifest's
"village field under mango trees") and the friend's house at the village edge (decision 1).

**Whose দাদা and whose বৌদি.** The narration's "এক বন্ধু **দাদার পকেট** থেকে… বৌদিকে ফিরিয়ে দিয়ে এলেন" can be
heard as Balak's own family. The book is clear: the money is from **the friend's own elder brother's** pocket (Balak
also calls him দাদা), and the বৌদি is **that brother's wife, at the friend's house**. The picture shows the friend's
house, never Balak's.

### Mismatches between the book and the recordings, manifest and SRT

No line needs re-recording; each is solved in the picture.

| # | Scene | Recording / manifest says | Book says | Picture |
|---|---|---|---|---|
| M1 | 01 | Manifest: father = `babukaka` | পিতা: Surendra, the series' father (Episodes 2 and 5) | `SURENDRA` from the shared cast |
| M2 | 01 | "অকারণে ছোট ভাইকে মেরে" | A quarrel after pathshala because the food was late; the elder scolds, the younger takes it silently, then the elder hits him | Shot 1: both boys back from pathshala with slates, two empty brass plates on the veranda; the elder scolds, Balak silent, then one swat (decision 4) |
| M3 | 01 | "বাবার পায়ের শব্দ শুনে" | "বাবার '**খড়মের**' শব্দ" | The wooden khadam: the father steps into them at the plinth's foot (where Episode 5's glimpse left them), and their clack is what the elder hears |
| M4 | 01 | Not told | Balak cries after the blow; "তখনও কেঁদে কেঁদে বলছে" | Wet eyes, one sniff, the back of a hand to his eye; no sobbing; calm and gentle by his line (decision 3) |
| M5 | 01 | Not told | The elder's signal from hiding: "বলিস না" | P2: an insert of the elder peeking out, finger to his lips, palms joined |
| M6 | 01 | Not told | "একবার গুপ্তস্থানের দিকে, একবার বাবার দিকে তাকাচ্ছে"; his back bent with pain | Shot 4: he stands bent, a hand at his back, eyes going once to the hiding place and once up to his father |
| M7 | 01 | Not recorded | His half-answer "গেলত—"; the father's "বোকাটা বলবে না আবার মারও খাবে…" | Left out (no new recordings); the father's exasperation is shown silently in AG1 (decision 6) |
| M8 | 01 | Not told | The father goes to the kachari; the elder comes out, softened for a moment, then goes off laughing; Balak's unrecorded "দেখলে—বাবা তোমায় মারবে বলে আমি বলিনি" | AG1 and AG2, wordless (decision 5) |
| M9 | 01 | Not told | "সমপাঠীরা সব ছুটে পালিয়েছে" | Two classmates watching at the fence gap scatter at the khadam's clack (shot 2); they are among scene 02's playmates (decision 8) |
| M10 | 02 | "ভোলাভালা ভেবে প্রায়ই ঠকাত" | Ch. 11: a burst ball stitched up any old way is handed to him; he plays with it happily; it bursts; they demand a new ball's price | Shot 1: only the handing over: a friend gives him the badly stitched ball, the others smirk behind their hands, Balak takes it delighted (decision 9) |
| M11 | 02 | "দামি জিনিস বা টাকা রাখতে হলে সবাই তাঁকেই বিশ্বাস করত" | The treasurer and store-keeper at the playing field; he hands back every item exactly | Shot 2: the boys leave their marbles, a top, coins and a folded shirt with him on a spread gamchha before the game |
| M12 | 02 | Not told | Balak asks where the note is from; the friend admits stealing it | The friend whispers with a sly glance (mouth only, no sync); the confession is not heard |
| M13 | 02 | "দাদার পকেট… বৌদিকে" | The friend's elder brother and his wife | The friend's house (see above) |
| M14 | 02 | Not told | The friend returns with his gang; Balak, seated, claps a hand to his head: "ওটা কি এখনও আছে নাকি?"; the friend threatens to tell his dada | AG3 (decision 10) |
| M15 | 02 | "সত্য প্রকাশ হতেই" | The dada checks his pocket, calls Balak; Balak's honest "হ্যাঁ, নিয়েছি"; the friends giggle; "বৌদিকে দিয়ে দিয়েছি"; the boudi is called; all comes out | Shot 6 compresses it: the dada, hands on hips; the boudi comes out holding up the note; the culprit's head drops |
| M16 | 02 | Not told | "অপরাধী পেল উপযুক্ত শাস্তি" | Only his hanging head and his dada's hand on his shoulder (decision 11) |
| M17 | 02 | "মিষ্টি লজেন্স" | "মিষ্টি **মার্বেল-লজেন্স**" (round, marble-like) | Round coloured lozenges from a glass jar at a sweet stall, in a paper twist (ঠোঙা) |
| M18 | 02 | "সব বন্ধুদেরই" | "বালক সবাইকে ডেকে" | Every playmate gets one, the culprit last (our staging, decision 12) |
| M19 | 02 | Manifest characters `gopal`, `rama` | Unnamed Ujanchar playmates | New village boys; `gopal` and `rama` are the Vedic house's children of Episode 1 |
| M20 | both | Manifest bed `padma_river_day` (a flowing river) | A courtyard and a field | Birds and a breeze (decision 15) |

**Book events left out because the narration does not tell them** (STO-01): the opening portrait of the two brothers
(the pampered elder, "অবহেলায় বৰ্দ্ধিত বনবল্লরীর ন্যায়" Balak); "গেলত—"; the father's remark; Balak's words to the
brother afterwards; the rest of chapter 11 (the ball bursting, the glued marbles, "শয়তানি না করে বলে নিলেই তো
ভালো হয়"); the dheki-ghar story of chapter 12; the dada's questioning and Balak's "হ্যাঁ, নিয়েছি" (decision 13).

---

## Balak in Episode 6

- **Age: about six**, as in Episode 5 (one design, BAL-26, plate `01_Thakur_Age06_Child_Ujanchar.jpg`). The book
  gives no new age; he now goes to the pathshala with his brother. Same face, hair, white dhoti and chadar, barefoot.
- **Character:** scene 01 hurt but not resentful; teary at first, then quiet and firm, and his answer is gentle and
  selfless. Scene 02 simple and absent-minded with the ball, careful as treasurer, troubled for a moment by the stolen
  note, then content and generous. Never a grin (BAL-22). Glow on and steady; it brightens gently on two key beats
  (decision 7).
- **Rigs and poses** (both exist from Episode 5: `StandingChild`, `SeatedChild design="plate" age={6}`):

| Rig | Pose / action | Scene, shot | Notes |
|---|---|---|---|
| `StandingChild` | `standScolded`: upright, head a little low, hands loosely together, eyes down while the elder scolds | 01: 1 | New |
| | `hurtBack`: after the swat, bent forward a little at the waist, one hand reaching round to the small of his back, the other on his knee; teary eyes, a sniff | 01: 1, P1, 4, 5 | The book's "ব্যথায় পিঠ বেঁকা করে দাঁড়িয়ে আছে". The back must read as **one smooth curve** (STO-20a). Breathing a little quick and uneven at first, settling (MOT-20) |
| | `glanceHideThenFather`: eyes, then head, go to the hiding place, then up to the father | 01: 4 | Eyes lead (MOT-13) |
| | `talk` with a small head shake, the hand still at his back | 01: 5 | Breath quieter while speaking (MOT-20) |
| | `wipeEye`: the back of the free hand to one eye, then a small forgiving smile | 01: AG2, P3 | |
| | `standQuiet` (exists), `holdOut` (both hands holding the note out at chest height) | 02: 5 | `holdOut` is new |
| | `giveOut`: turns from boy to boy, putting a lozenge in each palm; prop contact every frame (MOT-07) | 02: 7, P3 | New; no walk cycle needed (he turns on the spot, the boys come to him) |
| `SeatedChild` (plate, 6) | `sitCross` and `takeBall`: both hands receive the ball, a delighted look | 02: 1 | |
| | `treasurer`: cross-legged before a spread gamchha, sorting each boy's things into small heaps | 02: 2, P1 | The book's "সুখাসনে উপবিষ্ট" |
| | `takeNote`, then looking at the folded note in his hands, thoughtful | 02: 4, P2 | |
| | `handOnHead`, then both palms open, empty | 02: AG3 | The book's "মাথায় হাত দিয়ে" |

---

## Scene designs and shared looks

### Characters

| Who | Rig | Note |
|---|---|---|
| Balak, about six | `StandingChild` and `SeatedChild` in the plate design | See above |
| **The elder brother (দাদা)** | **New** Puppet child: about nine | Not named in these chapters (decision 2). The pampered son ("বাপ-মায়ের নয়নের মণি"): a little taller and plumper than Balak, neat oiled hair, a printed cotton shirt (জামা) over a knee-length dhoti (better dressed than Balak's plain white), a slate under his arm. Bluster when scolding; frightened at the khadam; pleading from hiding; sheepish, then a grin. Silent: mouth only while scolding (the narrator speaks), no sync |
| The father, Surendra | `SURENDRA` (shared cast since Episode 5) | **New: the khadam on his feet** (wooden soles with a toe peg) and their clack on each step. Stern, searching, impatient; exasperated at Balak's answer, then walks off to the kachari. He never strikes anyone |
| Two classmates | New village boys (variants of one child Puppet) | Shot 1 only, small at the fence gap; scatter at the clack |
| **Playmates (4 or 5)** | New village boys, the same family of designs | Barefoot, short dhoti or half-pants, some bare-chested, one in a vest; a ball, marbles, a top (লাট্টু) |
| **The culprit friend** | One of the playmates, distinct | A little older than Balak, a red gamchha tied at the waist, a sly look; whispers, grins, then angry, then shamefaced. No chip (he never speaks in the recordings) |
| The friend's dada | `CAST.listenerA` restyled (a young man of about 22: shirt, dhoti) | Hands on hips; a hand on his brother's shoulder |
| The friend's boudi | `CAST.womanB` with a ghomta | Young married woman: sindoor, a coloured sari over the head; surprised, then warm; holds up the note, gives two coins |
| The sweet-seller | `CAST.listenerB` | An older man behind his stall, tips lozenges into a paper twist |

### Props

- **Khadam (খড়ম):** move `Khadam` out of `episode05/scenes/Scene99ClosingSequentialOutro.tsx` into a shared prop so the
  father wears the same pair. Two brass thalis (empty) on the veranda. Two slates (স্লেট) with wooden frames.
- **Stitched ball:** a worn cloth-and-rubber ball with a crude zigzag seam of thick thread.
- **Treasury:** a spread checked gamchha with glass marbles, a wooden top with its string, a few copper coins, a folded
  shirt.
- **The ten-rupee note:** a generic large old paper note, pale blue-grey with a printed border and "১০" (no real
  currency design). **Two annas:** two small silver coins. **Lozenges:** round coloured marble-lozenges in a glass jar
  with a wooden lid; a paper twist (ঠোঙা).
- **The dada's shirt on a peg** (shot 3 insert): a white shirt hanging from a bamboo peg on the friend's veranda, with a
  breast pocket.

### Sets

| Scene | Place | Set | New work |
|---|---|---|---|
| 01 | The family's Ujanchar house (ch. 10, "বাবা কাছারীতে চলে গেলেন") | **`UjancharHouse`** (shared set, never redrawn) | Props only: the thalis, slates, and the hiding place (decision 2): the **far side of the hut**, round its corner wall end, so the elder can peek out. The father leaves through the fence gap toward the kachari |
| 02 | "খেলার মাঠ" and "তাদের বাড়ী" | **New `UjancharVillageField` set**, two views: (a) the **playing field** at the village edge: a beaten-earth and grass field, two big mango trees (Balak's seat under the near one), a few huts and the jungle beyond, a small thatched **sweet stall** (মুদির দোকান) at the field's edge; (b) the **friend's house**: a courtyard and veranda built from `UjancharHouse`'s own pieces and materials (as Episode 5's neighbour corner), with the shirt on its peg | Same thatch, mud walls, bamboo and grade as Ujanchar (CAM-11). A keep-in-set clamp like `ujancharKeepInSet` (CAM-08) |

### Light

Scene 01: the Ujanchar **"dawn" light read as warm afternoon gold** (the boys are back from pathshala and waiting for
food; it is also the light of Episode 5's glimpse of this scene, so the two episodes join). Scene 02: bright late
morning at the field, warm afternoon by the lozenges (decision 14).

---

## Sounds

Available (production worktree `public/audio/`): `sfx/ep02/` birds_village (loop), wind_soft (loop), footsteps_mud,
footsteps_floor, cloth_rustle, clay_thud, door_creak and others; `sfx/ep05/` bamboo_thump, shell_scrape and others;
`music/` Village_Peace_Loop, Warm_Family_Flute, Divine_Motif, Theme_Intro_Bansuri; the Episode 5 score library
`music/ep05/` (tanpura drones, bansuri_compassion, bansuri_relief, play_plucks, cheeky_plucks, tabla_soft, tabla_run,
drum_pulse, tension_rise, drum_hit_low).

**Missing, to source as CC recordings (sfx-from-commons, decision 16):** **wooden sandals (khadam) on earth and on a mud
floor** (the key sound of scene 01; Japanese geta recordings are the nearest match), a soft child's sniff, children
playing far off (no intelligible words), a ball's thump on earth, glass marbles clicking, coins clinking into a palm,
a paper twist rustling, a glass jar's lid. Stand-ins if none: `footsteps_floor` pitched for the khadam, `clay_thud`
0.15 for the ball, silence for the rest.

### Sound beds and score (AUD-07; the full cue sheet `02_Audio/Ep06_Music_Cue_Sheet.md` is written after approval)

| Scene | Bed | Under voice | In a pause | Note |
|---|---|---|---|---|
| 01 | `sfx/ep02/birds_village` | 0.10 | 0.20 | Afternoon courtyard |
| 01 | Score | | | Shot 1 a light `play_plucks` that stops dead at the swat; from the first khadam clack a soft `drum_pulse` in step with the clacks (tension under the father's search); `tension_rise` small under P2; out on "বাঁচিয়ে দিলেন"; `bansuri_relief` as the father walks off (AG1); `bansuri_compassion` with the glow in P3 |
| 02 | `birds_village` + `wind_soft` | 0.08 + 0.06 | 0.18 + 0.10 | Mango leaves |
| 02 | Children far off (new) | 0.05 | 0.10 | Under the field shots only |
| 02 | Score | | | `cheeky_plucks` on the stitched ball, `tabla_soft` under the treasurer, a held tanpura with one questioning bansuri phrase in P2 (the dilemma), `cheeky_plucks` in AG3, `Village_Peace_Loop` from the lozenges, `Divine_Motif` 0.15 in P3 |

Beds duck under every voice and rise in pauses (`ducked()`, open level at most 0.25). Chapter break: beds fade with
the picture, `sfx/chime_pop` 0.18 in the black, scene 02's beds fade in with it.

---

## Intro and source card

Series template (TTL-02 to TTL-06): "পর্ব ছয়: জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী", no captions on the title page,
then the source card (`00a_Source_Attribution.wav`, as Episode 5), overlapping scene 01's fade-in with no black frame.
No pauses.

---

## Scene 01: 01_saving_elder_brother, about 23.8 s of voice today

**Design.** The Ujanchar courtyard on a warm afternoon. The two boys are just back from the pathshala; their slates lie
on the veranda edge beside two empty brass plates. Two classmates loiter at the fence gap. Inside the open door, the
father; his khadam rest at the plinth's foot.

### Shot list

| # | Clip time | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 01a 0.37 | "একদিন বড় ভাই অকারণে ছোট ভাইকে মেরে" (to ≈ 3.91) | Wide on the courtyard (fades in under the source card's end): the elder scolding with a jabbing finger, Balak standing silent, eyes down; the empty plates and slates on the veranda; two classmates at the fence gap. On "মেরে" (≈ 3.4) one swat of the elder's open hand on Balak's back: Balak bends forward, a hand going round to his back | Hold | Establishing a known place: a held wide. The blow is one quick swat, seen whole in the wide, never in close-up (decision 4) |
| 2 | 01a ≈ 4.48 | "লুকিয়ে পড়ল বাবার পায়ের শব্দ শুনে।" (to 6.99) | Medium on the veranda end: the father's feet step down into the khadam at the plinth's foot, **clack** (the sound starts about 10 f before "লুকিয়ে"); the elder freezes, eyes wide, and darts round the far corner of the hut; the classmates scatter out through the gap | Cut on "লুকিয়ে"; hold | The line names the hiding and the footsteps; the khadam are the book's ("খড়মের শব্দ") and Episode 5's glimpse |
| 3 | 01a 8.00 | "বাবা এসে জিজ্ঞেস করলেন বড় ছেলে কোথায়—" (to 11.40) | Wide two-shot: the father strides into the courtyard (clack, clack), looks left and right, then bends toward Balak, a hand out, asking (no mouth sync: the narrator quotes him) | Cut on "বাবা এসে"; hold | A new subject enters; his search reads in the wide |
| 4 | 01a 12.43 | "কিন্তু পিঠের ব্যথা নিয়েও ছোট্ট ঠাকুর দাদাকে বাঁচিয়ে দিলেন!" (to 17.23) | Medium on Balak, bent, a hand at his back, teary: his eyes go once toward the hut's corner, then up to his father (M6); the father's legs and khadam at frame edge | Cut on "কিন্তু"; then a slow push in from "ছোট্ট ঠাকুর" (≈ 14.3) to a medium close-up, settling before 01b | The sentence's one move, toward his choice; the close-up is in place well before his line |
| 5 | 01b 0.25 | Balak: "যাও বাবা, আমি বলব না—বললে তো তুমি দাদাকে মারবে!" (to 4.98) | Medium close-up on Balak, looking up, eyes wet but steady, a small head shake on "আমি বলব না" | Hold (the push of shot 4 has settled) | Speaker close-up, in place early |

### Pauses and action gaps

| # | Kind | After | Length | Picture | Sound |
|---|---|---|---|---|---|
| P1 | mid | "…শব্দ শুনে।" (01a sentence silence 6.99-8.00, already 1.0 s) | 1.5 s | Shot 2 holds, then a cut to Balak alone in the courtyard: bent, his hand at his back, a sniff, the back of his other hand to one eye; the khadam clacks come nearer off screen | `drum_pulse` soft in step with the clacks; birds 0.18 |
| P2 | mid | "…বড় ছেলে কোথায়—" (01a silence 11.40-12.43, already 1.0 s) | 1.0 s | Cut to an insert: the elder peeking round the hut's corner, finger to his lips, palms joined, pleading (the book's "বলিস না আমি কোথায়") | A small `tension_rise`; birds 0.15 |
| AG1 | gap | after 01b (the scene's last line) | 2.0 s | Two-shot: the father throws up a hand, shakes his head (the unrecorded "বোকাটা…", no mouth), turns and walks out through the fence gap toward the kachari, clacking | Khadam fading; `bansuri_relief` |
| AG2 | gap | after AG1 | 2.0 s | The elder edges out from the corner, stands before Balak, sheepish, a moment of softness on his face; then he grins and runs off laughing (mouth open, no sound beyond a faint far laugh, decision 5) | `cloth_rustle` 0.15; footsteps_mud 0.2 |
| P3 | end | after AG2 | 1.5 s | Medium close-up: Balak alone, his hand still at his back; he watches his brother go, wipes his eye and gives a small forgiving smile; his glow brightens gently (key beat 1, forgiveness). Then chapter break | `bansuri_compassion` 0.15, `soft_magical_shimmer` 0.12; birds 0.20 fading |

**Scene: pauses 4.0 s, action gaps 4.0 s.** Four cuts and one push in about 24 s of voice; the shortest hold between
moves is about 2.5 s (shot 2).

**Chapter break (CB1, 1.0 s):** as Episode 5: fade to black over P3's last 18 f, 8 f of black with `chime_pop` 0.18,
scene 02 fades in over 30 f in its open pause (on `lifeF`).

---

## Scene 02: 02_treasurer_and_ten_rupees, about 32.8 s of voice today

**Design.** The Ujanchar playing field on a bright late morning: two big mango trees, the field running to a line of
huts and the jungle, a small sweet stall at its edge. The playmates play with a ball; Balak sits cross-legged under the
near mango tree. The friend's house is a few steps into the village.

### Shot list

| # | Clip time | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 02a 0.36 | "খেলার সাথীরা তাঁকে ভোলাভালা ভেবে প্রায়ই ঠকাত—" (to ≈ 3.96) | Medium wide under the mango tree: a playmate hands seated Balak a badly stitched ball; behind him two others smirk behind their hands; Balak takes it in both hands, delighted (M10) | Hold (in place from the open pause) | The clause literally; one trick stands for "প্রায়ই" |
| 2 | 02a 4.54 | "কিন্তু দামি জিনিস বা টাকা রাখতে হলে সবাই তাঁকেই বিশ্বাস করত!" (to 9.82) | Wide on the field: the boys come one by one and leave their marbles, top, coins and a folded shirt on Balak's spread gamchha, then run onto the field | Cut on "কিন্তু"; hold | A turn in the sentence and a new action: everyone, so a wide |
| 3 | 02a 10.81 | "একদিন এক বন্ধু দাদার পকেট থেকে দশ টাকা চুরি করে" (to ≈ 14.9) | Insert at the friend's veranda: a white shirt on a bamboo peg; the culprit's hand slides a big note out of its pocket; he glances over his shoulder | Cut on "একদিন"; hold | The narration names the theft: shown literally, small and quick |
| 4 | 02a ≈ 14.9 | "তাঁর কাছে রাখতে দিলে," (to 16.76) | Two-shot under the mango tree: the friend crouches, presses the folded note into Balak's hands, whispers with a sly glance (mouth only, M12), and runs off toward the village | Cut on "তাঁর কাছে" (key by the voice); hold into P2 | Back to Balak, the keeper |
| 5 | 02a 17.20 | "ঠাকুর চুপিচুপি সেই টাকা বৌদিকে ফিরিয়ে দিয়ে এলেন।" (to 21.85) | The friend's house: Balak at the veranda's foot, glancing back once (চুপিচুপি), holds the note up in both hands; the boudi bends to him, surprised; she takes it and her face softens | Cut on "ঠাকুর চুপিচুপি"; hold | A new place, named by the line |
| 6 | 02b 0.22 | "সত্য প্রকাশ হতেই বৌদি খুশি হয়ে তাঁকে দু'আনা দিলেন—" (to 3.91) | The friend's courtyard: the dada, hands on hips; the culprit; the gang behind; the boudi comes out holding up the note, smiling; the culprit's head drops, his dada's hand on his shoulder (M15, M16); she bends and puts two small coins in Balak's palm (on "দু'আনা দিলেন", ≈ 2.6) | Cut on "সত্য প্রকাশ"; hold | The reveal; everyone involved in one frame |
| 7 | 02b 4.63 | "আর দয়ালু ঠাকুর সেই দু'আনা দিয়ে" (to 6.30) | The sweet stall at the field's edge: Balak holds up the coins; the sweet-seller tips round coloured lozenges from a glass jar into a paper twist | Cut on "আর দয়ালু"; hold | The buying, literally |
| 8 | 02b 6.45 | "সব বন্ধুদেরই মিষ্টি লজেন্স কিনে খাওয়ালেন!" (to 10.26) | Medium wide by the stall: the playmates crowd round, palms out, amazed ("থ"); Balak puts a lozenge in each palm; the culprit hangs back last, and Balak holds one out to him too (decision 12) | Cut on "সব বন্ধুদেরই"; hold into P3 | The line names all the friends |

### Pauses and action gaps

| # | Kind | After | Length | Picture | Sound |
|---|---|---|---|---|---|
| P1 | open | before "খেলার সাথীরা…" | 1.0 s | The fade-in from the chapter break lands on the medium wide under the mango tree: the boys' ball game beyond, leaves moving, Balak sitting quietly, a slow blink | Birds rising to 0.18, wind 0.10, far children 0.10 |
| P2 | mid | "…রাখতে দিলে," (02a silence 16.76-17.20) | 1.5 s | Shot 4 holds after the friend runs off: Balak alone, looking from the village to the note in his hands and back: troubled, thinking (the book's "মহা ফ্যাসাদে"); then he folds his hands round it, decided | Held tanpura and one questioning bansuri phrase; birds 0.15 |
| AG3 | gap | at the 02a / 02b boundary | 2.5 s | Back under the mango tree: (a, 1.5 s) the friend returns with three boys and holds out his palm; Balak, seated, claps a hand to his head and opens both palms, empty (the book's "মাথায় হাত দিয়ে"); (b, 1.0 s) the friend's face falls, then he stamps a foot and stalks off toward his house (to tell his dada) | `cheeky_plucks`; footsteps_mud 0.2 |
| P3 | end | after "…কিনে খাওয়ালেন!" | 2.0 s | Medium: the boys suck their lozenges, cheeks bulging, grinning; the culprit looks at the sweet in his palm, then at Balak, and a shy smile comes; Balak's serene smile, his glow brightens gently (key beat 2, trust and generosity). Then the series fade into the outro | `Divine_Motif` 0.15; birds 0.18 and `Village_Peace_Loop` fading with the picture |

**Scene: pauses 4.5 s, action gap 2.5 s.** Seven cuts in about 33 s of voice, no camera moves (the story moves by
places); the shortest hold is about 1.9 s (shot 4, kept short because the next cut is a new place).

---

## Scene 99: closing outro and the Episode 7 glimpse

Series template (TTL-09, TTL-10a, TTL-11, TTL-12): no pauses, no camera changes. The glimpse of Episode 7 ("পর্ব
সাত: লববাবুর পাঠশালা", the manifest's `next_episode_title_bn`) fades in on "আসছে পরের পর্ব" in the same feathered,
boxless vignette with glowing cream-gold Baloo Da 2. Suggested (decision 17), from chapter 13's own description and
with no new character: **Lababu's pathshala** as the book draws it, "বেশ নূতন টিনের বাংলো প্যাটার্ণের চৌচালা ঘর,
বেড়ায় রং দেওয়া", seen through its open door: a row of palm-leaf mats (চাটাই) with slates on them, a low raised
bamboo platform (মাচা) at the back, and a teacher's cane (বেত) resting on a low desk; six-year-old Balak sitting on a
mat with a slate, in soft morning light. "শুরু হচ্ছে সিজন দুই" is in the voice only (no on-screen text).

---

## Totals (estimates; the generator gives the real numbers)

| Part | Pauses | Added by pauses | Other added time | Frames today → planned |
|---|---|---|---|---|
| Intro, source card | none | 0 | | about 629 |
| 01 elder brother | 3 | 4.0 s | AG1 2.0 s + AG2 2.0 s, CB1 1.0 s | about 571 → 763 |
| 02 treasurer and ten rupees | 3 | 4.5 s | AG3 2.5 s | about 802 → 970 |
| 99 outro and Episode 7 glimpse | none | 0 | | about 596 |
| **Total** | **6** | **8.5 s (204 f)** | **7.5 s (180 f)** | **about 2,585 → about 2,970 (about 2:03.8)** |

- The SRT runs 1:28.0 (voices only, no source card). Pauses are about 7.9 % of the episode (Episode 5: 9.2 %); the
  voices already carry 1.0 s silences after "…শব্দ শুনে।", "…কোথায়—" and "…বিশ্বাস করত!".
- **Fuller version:** add a 1.5 s mid pause after "…বিশ্বাস করত!" (Balak sorting the treasury neatly, the book's
  "খুঁটিনাটি করে… ঠিক ঠিক ভাবে"): about 3,006 frames (2:05.3).

---

## Notes for whoever codes this (after approval)

- **Voices first:** the Episode 6 WAVs are not levelled (-19.5 to -24.7 LUFS integrated). Run the voice-loudness step
  (-16 LUFS / -1.5 dBTP, lengths kept), then copy them and `00a_Source_Attribution.wav` to `public/audio/ep06/`.
- **Generator:** `scripts/build_ep06_timing.js`, copied from `build_ep05_timing.js`, writes `src/episode06/timing.ts`
  and `subtitles.ts`; add `EP06_CLOCK` and the "6" helpers (`useStory6`, `cueLocalStory6`, `gapState6`,
  `breakState6`) to `src/episode/storyClock.ts`. Scene ids `S01 = "01_saving_elder_brother"`,
  `S02 = "02_treasurer_and_ten_rupees"`.
  - PAUSES: `{ scene: S01, after: "শব্দ শুনে।", sec: 1.5, clip: "01a_Narrator_Brother.wav", silence: [6.992, 7.998], note: "P1" }`,
    `{ scene: S01, after: "কোথায়—", sec: 1.0, clip: "01a_Narrator_Brother.wav", silence: [11.403, 12.431], note: "P2" }`,
    `{ scene: S01, at: "end", sec: 1.5, note: "P3 (after AG1, AG2): forgiveness; glow beat 1; then CB1" }`,
    `{ scene: S02, at: "open", sec: 1.0, note: "P1" }`,
    `{ scene: S02, after: "রাখতে দিলে,", sec: 1.5, clip: "02a_Narrator_Friends.wav", silence: [16.760, 17.204], note: "P2: the dilemma" }`,
    `{ scene: S02, at: "end", sec: 2.0, note: "P3: lozenges for all; glow beat 2" }`.
  - GAPS: `{ scene: S01, at: "end", sec: 4.0, beats: [{ id: "a_father_leaves", sec: 2.0 }, { id: "b_brother_comes_out", sec: 2.0 }], note: "AG1+AG2" }`,
    `{ scene: S02, after: "ফিরিয়ে দিয়ে এলেন।", sec: 2.5, beats: [{ id: "a_friend_returns", sec: 1.5 }, { id: "b_friend_stalks_off", sec: 1.0 }], note: "AG3 (clip boundary 02a/02b)" }`.
  - BREAKS: `[{ after: S01, sec: 1.0 }]`.
- **Captions:** check the phrase splits against the voice at "লুকিয়ে পড়ল" (≈ 4.48), "কিন্তু পিঠের" (12.43),
  "একদিন এক বন্ধু" (10.81), "ঠাকুর চুপিচুপি" (17.20), "আর দয়ালু" (4.63); anchor them to the voice where the
  character-share estimate is off. Chip বীরু on 01b. Only Balak's mouth syncs; the elder's scolding, the father's
  asking and the friend's whisper are mouth shapes without sync.
- **What must be built:** `src/episode06/Episode06.tsx` (timeline, beds, score, SFX), `scenes/Scene00Intro`,
  `Scene01SavingElderBrother`, `Scene02TreasurerAndTenRupees`, `Scene99ClosingSequentialOutro` (template + Episode 7
  glimpse), registration in `src/Root.tsx`; the `UjancharVillageField` set file (field, stall, friend's house from
  Ujanchar pieces); `StandingChild` new poses (`standScolded`, `hurtBack`, `glanceHideThenFather`, `wipeEye`,
  `holdOut`, `giveOut`) and `SeatedChild` new poses (`takeBall`, `treasurer`, `takeNote`, `handOnHead`) without
  changing any existing pose (Episodes 3 to 5); `cast.ts`: the elder brother, the village boys and the culprit,
  restyles for the dada and boudi; khadam on Surendra's feet and the shared `Khadam` prop; the Episode 6 cue sheet.
  One agent per file (agent-dispatch); `Episode06.tsx` sound last.
- **Protected fixes every agent keeps:** shared `Hand`, no outline, correct thumbs (MOT-19); `puppetBreath`, quicker
  in fright (the elder at the clack), a little uneven for Balak's hurt, quieter while speaking (MOT-20); `BirulGlow`
  soft falloff, no rings or rays, never pulsing (BAL-06, BAL-07); no glow on anyone else (BAL-05); Balak in the BAL-26
  design, no tilak, jewellery, thread, bangles or anklets; the bent back one smooth curve (STO-20a); props in contact
  (MOT-07); feet planted (MOT-06); intro, source card overlap, boxless glimpse (TTL-10a); no letterbox (CAM-04); Baloo
  Da 2 (TTL-01); Episodes 1 to 5 untouched.

---

## For the director to decide

Each question gives my recommended answer first.

1. **Where.** *Recommended:* both stories at Ujanchar: scene 01 in the family's `UjancharHouse` courtyard (the book's
   father goes off to the kachari), scene 02 at a new Ujanchar playing field with the friend's house nearby. *Or:*
   scene 02 at the Vedic house's village (the book names no village for chapter 12).
2. **The elder brother.** *Recommended:* a new boy of about nine, pampered and a little plump, in a printed shirt,
   unnamed (the book does not name him here); he hides round the far corner of the hut. *Or:* give him a name or a
   different age, or another hiding place (a straw stack by the fence).
3. **Balak's tears.** *Recommended:* the book says he cried: wet eyes, a sniff and a hand to his eye, no sobbing; calm
   by his line. *Or:* no tears, only the hurt back.
4. **The blow.** *Recommended:* one quick swat on the back, seen in the wide, then Balak bent with his hand at his back
   (the narration's "মেরে"). *Or:* not shown: cut in on Balak already bent.
5. **After his line (AG1, AG2).** *Recommended:* the father throws up his hand and clacks off to the kachari; the elder
   comes out, sheepish and softened, then grins and runs off laughing (as the book). *Or:* end on the father leaving.
6. **Unrecorded lines** ("গেলত—", the father's "বোকাটা…", Balak's "দেখলে…" to his brother). *Recommended:* leave
   them out; no new recordings.
7. **Glow beats.** *Recommended:* two gentle beats: the forgiving smile (scene 01 P3) and the lozenges for everyone
   (scene 02 P3, with `Divine_Motif`). *Or:* only the scene 01 beat.
8. **Classmates in scene 01.** *Recommended:* two at the fence who scatter at the clack (the book's "সমপাঠীরা সব ছুটে
   পালিয়েছে"), the same boys as scene 02's playmates. *Or:* leave them out.
9. **"ঠকাত" picture.** *Recommended:* one trick from chapter 11: the badly stitched ball handed to him, the others
   smirking, Balak delighted. *Or:* the glued marble instead, or only the boys laughing behind his back.
10. **The friend's return (AG3, 2.5 s).** *Recommended:* show it wordlessly: the friend wants the money back, Balak
    claps a hand to his head and shows empty palms, the friend stalks off. *Or:* leave it out and cut straight to the
    reveal.
11. **The culprit's punishment.** *Recommended:* only his hanging head and his dada's hand on his shoulder. *Or:* his
    dada holds his ear (a mild, comic touch).
12. **Lozenges for the culprit too.** *Recommended:* yes, last, with his shy smile in P3 (it fits the outro's
    "ক্ষমা"; the book says "সবাইকে ডেকে"). *Or:* only the other boys.
13. **Book events left out:** confirm leaving out the brothers' portrait, the rest of chapter 11, the dheki-ghar story,
    and the dada's questioning with Balak's "হ্যাঁ, নিয়েছি". *Recommended:* leave them out.
14. **Light.** *Recommended:* scene 01 warm afternoon gold (Ujanchar "dawn" light, matching Episode 5's glimpse);
    scene 02 bright late morning, warming toward the lozenges. *Or:* both golden daytime as the manifest.
15. **Beds and score.** *Recommended:* birds and breeze instead of the river bed; the score as in the table (play,
    the khadam pulse, relief, compassion, playful plucks, the divine motif), written up as a cue sheet. *Or:* the
    manifest's `Warm_Family_Flute` and `Village_Peace_Loop` only.
16. **Missing sounds.** *Recommended:* source CC recordings, above all the wooden khadam. *Or:* the stand-ins.
17. **The Episode 7 glimpse.** *Recommended:* Lababu's new tin chouchala pathshala through its open door, mats and
    slates, the cane on the desk, Balak on a mat; no Lababu (he needs a design first). *Or:* include Lababu, stern at
    his desk.
18. **Length.** *Recommended:* about 2:03.8 (6 pauses, 8.5 s; 7.5 s of action gaps and the break). *Or:* the fuller
    2:05.3.
