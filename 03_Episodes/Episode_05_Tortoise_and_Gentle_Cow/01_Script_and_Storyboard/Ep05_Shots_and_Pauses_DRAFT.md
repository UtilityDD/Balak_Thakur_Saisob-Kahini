# Episode 5: Shot List, Pause Table and Scene Design (APPROVED 2026-11-22, STO-20)

> **Status: APPROVED 2026-11-22** on the recommended answer to every question below (the director: “proceed with the plan”). Recorded as STO-20.

Status: **DRAFT, not yet approved** (written 2026-11-22). The director's answers to "For the director to decide" at
the end turn this into the approved plan (as STO-19 did for Episode 4). Nothing here is coded yet.

Written under CAM-13 (camera grammar) and CAM-14 (pauses inside scenes), on the model of the approved Episode 4
plan (STO-19) and the Episode 2 and 3 plans (STO-16, STO-17). The director's standing answers carry over: the camera
follows the narration strictly and invents no tension; establishing lines get held wides; the intro, the source
card, the outro and the next-episode glimpse stay as the series template with **no pauses**; background sound is
capped at 0.25 in pauses; separate stories are divided by a chapter break (CAM-10).

STO-18 is applied throughout: **place, people and speakers come from the book**, not from the manifest or the voice
ID a line was recorded with. Source: `book.xlsx` (শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী), sheet 1, column D:
chapter আট "কচ্ছপের সাথে শিশু ঠাকুরের খেলা" (**row 14**) for scene 01, and chapter নয় "গাভীকে প্রহার থেকে
রাক্ষাকল্পে শিশুর সংকল্প" (**row 15**) for scene 02. (Rows 12 and 13 are chapters ছয় and সাত, Episode 4; row 16,
chapter দশ, is the next episode's elder-brother story.)

## How to read this

- **Shot list:** one row per narration line or clause that carries a camera decision. `f` is the line's start in the
  scene's own frames (24 fps) from today's generated `src/episode05/subtitles.ts` (no pauses: 2,477 frames; scene 01
  starts at 639, scene 02 at 1122). Those starts are character-share *estimates*; where the voice differs by more
  than about 8 frames, the start measured from the clip's silences (silencedetect at -32 dB on the played files in
  `public/audio/ep05`) is given as *voice ≈ f* (confirm by ear). Once pauses and gaps go in every frame moves, so
  every camera key must be tied to the narration cue (`cueLocalStory5`, or whatever the timing agent names it), not to
  a frame number (CAM-13).
- **Camera words:** *hold* = camera still (characters keep breathing and blinking). *cut* = hard cut. *push in* /
  *pull back* = slow eased zoom. *rack focus* = only the focus changes (not counted as a move). *dissolve* = slow true
  cross-dissolve (CAM-09). *chapter break* = fade to black, a short hold, a soft chime, a slow fade in on a calm
  establishing view (CAM-10).
- **Rules used:** one move at most per sentence or long clause; about 2 s of hold between moves; a cut when the line
  names a new subject; a close-up 6 to 8 frames *before* a speaker's line; a held wide on an establishing view; no
  drift and no handheld (decision 18); faces and key action above y = 820 (CAM-07; the tortoise shots are low, so the
  ground line sits high in those frames); no background edge (CAM-08); background calmer than the subjects (CAM-11).
- **Pauses (P):** held moments where the voice is already silent. The story waits, life goes on: breathing (MOT-20),
  Balak's slow blinks (BAL-14), glances, leaves, the tortoises' heads, the cow's ears and tail. *open* = before a
  scene's first line; *mid* = between two sentences; *end* = after its last line.
- **Action gaps (AG):** as in Episode 4 (TIM-GAP-01): picture time with no narration in which the **story keeps
  moving**. Two book events in scene 02 have no narration (the cow hiding while Haricharan arrives; Haricharan
  storming off). They are not pauses and are not counted in the pause total.
- **Chapter break (CB):** Episode 5 tells two separate stories from two chapters (the tortoise, the cow), so CAM-10
  applies between scenes 01 and 02.
- **Sound volumes:** one-shots 0.15 to 0.45, loops 0.25 or below (AUD-02, AUD-03), no bed above 0.25 in a pause.
  Paths are under `public/audio/` in the production worktree.

---

## The book, the recordings and who is on screen

| Clip | Recorded as | Speaks on screen | Present | Book support |
|---|---|---|---|---|
| `01a_Narrator_Tortoise` (19.69 s) | narrator | narrator (no chip) | Balak; Binoy (the witness); then Charu, Surendra and Binoy's mother running in | Place: "কৃষ্ণনগর কাছারি।" (the chapter's first line). "সেদিন সবাই মিলে বেশ গল্প গুজব করছে। ঐদিন কখন যে শিশু বেরিয়ে গেছে কেউ তা লক্ষ্য করেনি। হঠাৎ **পাশের বাড়ী থেকে বিনয়ের চীৎকার** শোনা গেল 'হায় হায়, গেল গেল, হাতটা গেল'! চীৎকার শুনে সবাই দৌড়ে এসেছে সেই দিকে,―গিয়ে দেখতে পেল, কচ্ছপগুলোর মাঝখানে **উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে** শিশু কি যেন করছে। লক্ষ্য করে দেখা গেল, একটা কচ্ছপ শিশুর হাত কামড়ে ধরেছে…" "দু'তিন জন দৌড়ে গিয়েছে বালকের হাত ছাড়িয়ে দিতে, কিন্তু দেখা গেল কচ্ছপ ততক্ষণে হাত ছেড়ে দিয়েছে এবং শিশুর হাতে কচ্ছপের কামড়ের কোন ক্ষত বা দাগ নাই।" Binoy's account: "বিনয় বা'র থেকে ফিরছিল, হঠাৎ **কোণের ঘরের দিকে** শব্দ শুনে গিয়ে দেখতে পেল, তার সুরেন কাকার বাচ্চা ছেলে বীরু **কালকের কেনা কচ্ছপগুলো উল্টে উল্টে দিচ্ছে**… চুপ করে দাঁড়িয়ে দেখছিল শিশু কি করে। এদিকে উপুড় করা কচ্ছপগুলোকে **লেজ ধরে পাশে ধরে** নানাভাবে উল্টে দিচ্ছে। এরকম করতে করতে হঠাৎ একবার **লেজ মনে করে শিশু কচ্ছপের শুঁড় ধরেই** ওল্টাতে গেছে, অমনি কচ্ছপটা শিশুর হাত কামড়ে ধরেছে—আর শিশু বলছে 'ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।' এমন সময় বিনয় চীৎকার করে উঠেছিল।" |
| `02a_Narrator_Cow` (13.00 s) | narrator | narrator | Balak alone in the grove; the cow at the cucumber trellis; Haricharan running in | Age and habit: "বালক **সবেমাত্র পাঁচ বছর পেরিয়ে ছয় বছরে পা দিয়েছে**… এখন প্রশ্নই তাকে দেখা যায়―হয় **কলাবাগিচায়**, না হয় মাঠের শেষে দেবদারু গাছের নীচে, না হয় নদীর ধারে জামগাছতলায় বসে। এতটুকু বালক নিৰ্জ্জনে চুপচাপ বসে থাকে…" The day: "সেদিন বালক **কাছারী ঘরের পেছনে কলাবাগিচায় বসে খেলা করছে**। এর মধ্যে হরিচরণ একটা বাঁশ নিয়ে এসে…" The plant: "বিরাট একটা শশা গাছ, একটা ঝাঁকাতে বেয়ে শাখা-প্রশাখায় ছড়িয়ে পড়েছে। আর তার ডগায় কচি বড় বহু শশা। গাভীটা শুধু শশাই খায়নি, **গাছটির মূলও উচ্ছেদ করেছে**। তাই ক্রুদ্ধ হরিচরণ বংশ হস্তে ধাবমান।" |
| `02b_Haricharan` (3.31 s) | `10_Grumpy_Relative` | **Haricharan, to Balak** (chip হরিচরণ, as today's generator) | Haricharan, Balak (the cow hidden nearby) | "হরিচরণ একটা বাঁশ নিয়ে এসে বালককে জিজ্ঞেস করছে, '**গরুটা কোন দিকে গেছে দেখেছিস?**'" and later "উত্তেজিত হরিচরণ আবার জিজ্ঞেস করছে, '**তাড়াতাড়ি বল কোন দিকে গেছে?**'" The recording ("এই বীরু! তাড়াতাড়ি বল তো, গরুটা কোন দিকে গেছে?") merges the two questions. Speaker right. The book never says he is a relative: Balak calls him "হরিচরণদা" and "আপনি", and the cucumber is "আপনার গাছ" (his plant): a kachari hand who grows vegetables (decision 9). |
| `02c_Thakur_Truth` (12.84 s) | Balak child voice | **Balak, to Haricharan** (chip বীরু) | Balak, Haricharan | Between the questions: "বালক ঠিকই জানতো গাভীটা কোথায় রয়েছে। কিন্তু সে ভাবল, এখন যদি সে বলে দেয়, তা হলে তো একেবারেই ওর দফা রফা হবে… সে নিতান্ত নিরীহ ভাব দেখিয়ে চুপ করে আছে।" "এদিকে বালকের হয়েছে মহা মুশকিল— 'জানি' বললে গাভীটি ভীষণ মার খায়, আর 'জানি না' বললেও 'সত্য' যায়। কিন্তু তাতো চলবে না, গাভী এবং সত্য দুটোকেই রাখতে হবে।" Then: "সে বলল, '**দেখলেও বলবো না**, কারণ বলে দিলে আপনি তো আর রক্ষা রাখবেন না। আমি কিছুতেই বলব না… ও যে শশা গাছ খেয়েছে—**তা আপনার গাছ কি আমার গাছ—ও কি বুঝে খেয়েছে**। ওর খাওয়া দরকার তাই খেয়েছে… **আমি ওর খবর বলতে পারবো না**।'" Afterwards: "উত্তেজিত হরিচরণ অধিকতর উত্তেজিত হয়ে চলে গেল।" The recording condenses the book faithfully. |

**Where Episode 5 happens: the Krishnanagar kachari at Ujanchar, not the Vedic house.** Chapter 4 says "উজানচর
কৃষ্ণনগর—শিশুর পিতা শ্রীসুরেন্দ্রচন্দ্র চক্রবর্তীর কর্মস্থল" and chapter 25 calls him "জামাই সুরেন্দ্র
'কৃষ্ণনগর' থেকে": the kachari (the estate office, with its "সেরেস্তা", where "সুরেনবাবু" works and where the father
goes in chapter 10, "বাবা কাছারীতে চলে গেলেন") is his workplace at Ujanchar Krishnanagar, and the family's small
village house (STO-10) is nearby. Both stories happen in that compound:
- scene 01 at the **neighbouring house** ("পাশের বাড়ী"), by its **corner room** ("কোণের ঘর"), the home of Binoy, who
  calls Surendra "সুরেন কাকা"; the family is chatting in its own house and runs over at Binoy's shout;
- scene 02 in the **banana grove behind the kachari building** ("কাছারী ঘরের পেছনে কলাবাগিচায়").

### Mismatches between the book and the recordings, manifest and SRT (and how the picture stays faithful)

No line needs re-recording; every difference below is solved in the picture.

| # | Scene | Recording / manifest says | Book says | Picture |
|---|---|---|---|---|
| M1 | 01 | Narration: "কৃষ্ণনগরের কাছারি বাড়িতে"; manifest: "Krishnanagar courtyard corner" | The kachari compound, but the play is at the **neighbour's house**, by its corner room | Open on a held wide of the kachari compound (the narration's place), then cut to the neighbour's corner |
| M2 | 01 | Narration: "সবাই তো 'গেল গেল' বলে ছুটে এল" | **Binoy alone** shouts "হায় হায়, গেল গেল, হাতটা গেল"; the others run at his shout | Binoy, hands on his head, mouth open in a shout (no lip sync: the narrator quotes him) while the others run in silently (decision 2) |
| M3 | 01 | Binoy is not named | Binoy is the witness who watched quietly, then shouted | Binoy appears silently: he comes round the corner, watches, shouts (decision 2) |
| M4 | 01 | Manifest: "flipping tortoises gently; one tortoise playfully pinches his finger" | He **turns the tortoises over by tail and side**, grabs the head ("শুঁড়") thinking it is the tail, and the tortoise **bites his hand** and holds on | A real bite, clamped on the side of his hand, held; no blood, no pain on his face (decision 4) |
| M5 | 01 | Manifest: no posture | "উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে": **standing, bent over** the tortoises | A standing child pose bent at the hips (decision 10) |
| M6 | 01 | Not recorded | Balak says "ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।" | Left out: his mouth stays closed; his amused, unworried look in P2 carries it (decision 5) |
| M7 | 01 | Narration order: bite, everyone runs, no mark, *then* "the tortoise has let go" | The tortoise had already let go when two or three reached him | The release happens as Charu reaches him (shot 5); the last clause shows the tortoise, already free, plodding away (the narration's perfect tense "ছেড়ে দিয়েছে") |
| M8 | 01 | Not told | The tortoises were "কালকের কেনা" (bought yesterday, for the kitchen) | Not shown or hinted; they sit by the corner room beside a tipped bamboo basket |
| M9 | 02 | Manifest: "6-year-old toddler_thakur **standing firm**" | "**বসে** খেলা করছে": seated, playing | Seated throughout (the existing seated rig in the new design) |
| M10 | 02 | Narration: "কলাবাগিচায়"; manifest: "banana grove behind courtyard" | "**কাছারী ঘরের পেছনে** কলাবাগিচায়" | The grove behind the kachari building; its back wall and back door are in the wide |
| M11 | 02 | Narration: "শশা গাছ খেয়ে ফেলায়" | The cow ate the cucumbers **and tore out the plant's root** | The cow at the trellis, a cucumber in her mouth, the vine pulled down and its root torn up |
| M12 | 02 | Not told | "বালক ঠিকই জানতো গাভীটা কোথায় রয়েছে" | AG1: the cow walks past Balak into the grove and stands hidden; he sees her go and says nothing |
| M13 | 02 | Recording merges Haricharan's two questions; Balak's "হরিচরণদা, কি হয়েছে?" is not recorded | Two questions, with Balak's question and the cucumber explanation between | One exchange; the narrator has already given the cucumber reason, so nothing is lost |
| M14 | 02 | Not told | Balak's dilemma (truth and the cow) and his innocent silence | P2: a held close-up on Balak's thoughtful face before he answers (his eyes never go to the cow) |
| M15 | 02 | Not told | "উত্তেজিত হরিচরণ অধিকতর উত্তেজিত হয়ে চলে গেল" | AG2: Haricharan throws up his hand, thumps the bamboo once and stomps back to the kachari |
| M16 | 02 | Voice ID `10_Grumpy_Relative` | Not a relative ("হরিচরণদা", "আপনি", "আপনার গাছ") | A kachari hand who grows vegetables; chip হরিচরণ (decision 9) |
| M17 | 99 | Outro teaser names the elder-brother story | Chapter 10 ("পিতার নিগ্রহ থেকে জ্যেষ্ঠ ভ্রাতাকে উদ্ধার") and chapter 11 (the playmates) | The glimpse is from chapter 10 (decision 14) |

**Book events left out because the narration does not tell them** (STO-01; "invents no tension"): the chapter 9
opening (Balak scolded and beaten by everyone, neglected, sitting alone also "মাঠের শেষে দেবদারু গাছের নীচে" or
"নদীর ধারে জামগাছতলায়"); the family's chatting before Binoy's shout; the kachari gossip afterwards ("কাছারির
সেরেস্তায় এ নিয়ে বেশ খানিকটা জল্পনা কল্পনা চলল…", "মনে হয় ও খেতেও দেখেছে", "ও নিজে ধরে নিয়েও খাইয়ে
আসতে পারে"). Decision 11.

---

## Balak in Episode 5

- **Age:** **six** in scene 02, stated by the book ("সবেমাত্র পাঁচ বছর পেরিয়ে ছয় বছরে পা দিয়েছে", ch. 9). Chapter
  8 gives no age ("শিশু বেশ একটু দুষ্টুমি শিখে উঠেছে"); it falls between the five-year-old chapters 6 and 7 and the
  six-year-old chapter 9, and the narration says "ছোট্ট বীরু". **One design for the whole episode, about six.**
- **Reference plate:** `01_Series_Bible/Thakur_Reference_Plates/01_Thakur_Age06_Child_Ujanchar.jpg`, the exact age,
  and its setting is already this episode's world: banana plants, a bamboo fence and a thatched Ujanchar hut behind a
  child sitting cross-legged on a mat. BAL-26: short straight soft black hair with a side part and a neat rounded
  crown (no curls), large dark-brown almond eyes with one catchlight, straight dark brows, small straight nose, calm
  closed-lip half smile, warm medium-brown skin, visible ears, slim neck; plain white dhoti and a white chadar wrapped
  across the chest and over both shoulders; barefoot; no jewellery, tilak, thread or marks (BAL-01 to BAL-03). The
  design agent is building this now as an opt-in design on the seated rig.
- **Character in these stories:** curious and absorbed with the tortoises, unbothered by the bite (scene 01); quiet,
  inward and firm, compassionate toward the cow and respectful to Haricharan (scene 02). Never naughty-faced, never a
  cartoon grin (BAL-22). His glow (`BirulGlow`) stays on and steady and brightens gently only on key beats (decision 6).
- **Poses and actions the scenes need** (so the rig work can follow):

| Rig | Pose / action | Scene, shot | Notes |
|---|---|---|---|
| **New standing child rig** (the seated rig cannot stand) | `standBend`: standing, feet apart and planted, bent forward at the hips, knees softly bent, both hands down at tortoise height (the shells are at ground level) | 01: shots 1, 2, 4 | The book's "উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে". Feet never slide (MOT-06). Chadar stays wrapped; its end and the dhoti hem hang with gravity in the bend (BAL-18) |
| | `turnTortoise`: both hands at the shell's rim (one by the tail, one at the side), rolls it over onto its back, then rights it again | 01: shot 2, P1 | Object contact every frame (MOT-07): the tortoise is drawn from his hands while he holds it |
| | `reachGrab`: one hand goes to the tortoise's front end (he thinks it is the tail) | 01: shot 3 | Gesture starts 6 to 8 f before "হঠাৎ" (MOT-15) |
| | `bitten`: the near hand held at ground level by the tortoise's jaws, the body still bent, the free hand on his knee; face: a blink of surprise, then a calm, slightly amused regard; breathing steady (no fright) | 01: shot 3, P2, shot 4 | His hand follows the tortoise's head, not the other way round |
| | `rise` and `handInHands`: straightens to stand as Charu kneels; his hand lies passive in her two hands while she turns it palm up and back | 01: shot 5, P3 | Charu's hands hold his hand every frame; shared `Hand` (MOT-19) with the child proportions |
| | `standIdle`: upright, arms loose, glances (eyes leading), weight shifts | 01: shot 6, P3 | No frozen pose over about 20 f (MOT-13) |
| **Seated rig** (`episode03/rig/SeatedChild.tsx`, in the BAL-26 design) | `sitCross` and a new `playPebbles`: cross-legged, one hand picks up a pebble and sets it in a little row on the earth | 02: open P1, shots 1, 2, AG1 | The plate's pose; the existing seat and idle life |
| | `lookUp` (exists) with a thoughtful expression | 02: AG1 b, shots 5, 6, P2 | Up at Haricharan; in P2 his eyes lower for a moment and lift again, **never toward the cow** |
| | `talk` with `palmRaise` (exists): a small open palm lifted toward the bamboo | 02: shots 7, 8 | Speaking calm and firm; breath shallow while speaking (MOT-20) |
| | a gentle point off left (the existing `pointIn` may serve): toward the torn trellis, away from where the cow hides | 02: shot 9 | |
| | a small slow head shake (new head motion) | 02: shot 10 | "ও কি আর বুঝেছে…" |
| | `strokeCow` (new): turns a little, palm raised to the cow's lowered muzzle, then strokes her face and neck; the hand follows her moving head every frame | 02: P3 | The Episode 4 glimpse composition (Balak left, cow right, his palm raised) |

No walking or running Balak is needed in Episode 5. The standing rig is also what Episode 6 needs (Balak stands before
his father, his back bent with pain, in chapter 10).

---

## Scene designs and shared looks

### Animals

**The tortoises (কচ্ছপ), four of them** (ANI-01: realistic and readable). Bengal freshwater pond turtles, about
25 to 30 cm long: a domed dark olive-brown shell with soft yellow flecks and growth rings on the scutes, a pale yellow
plastron with dark blotches (seen when one is turned over), grey-olive skin with yellow spots on the head, small dark
eyes with a lid, a short beak, short clawed webbed feet and a short pointed tail. Seen in side and three-quarter views,
so the rig needs a turned-over state (the plastron view with the legs in the air), not only a top view. No glow
(BAL-05). What they do, per shot:

| Shot | Tortoise action |
|---|---|
| 01 shot 1 (wide) | Four tortoises by the corner room beside a tipped bamboo basket, small in frame; one being turned |
| 01 shot 2, P1 | **T1** turned onto its back by Balak, legs paddling in the air, head stretching out to right itself; Balak rights it; it pulls its head in, then pokes it out. **T2, T3** plod slowly a few steps, heads swaying; **T4** sits with its head half in, blinking |
| 01 shot 3 | **T2**, Balak reaches for its front end: the head shoots out and the jaws clamp on the outer edge of his hand (below the little finger), and hold. No blood, no wound, ever |
| 01 P2, shot 4 | T2 holds on, neck stretched, eye on Balak, still; the others keep plodding |
| 01 shot 5 | As Charu's hands come in, T2 opens its jaws and draws its head back a little (the release) |
| 01 shot 6, P3 | T2 turns away and plods calmly back to the others ("চুপচাপ"), head half in; in P3 all four settle by the basket |

**The cow (গাভী)** (ANI-04: a humped Bengal zebu). The same animal the series already has: Episode 2's Ujanchar cow
(`Cow` / `UjancharCowLayer` in `src/cinematic/sets/UjancharHouse.tsx`: fawn-brown hide with white patches, hump,
dewlap, short horns), which is also the cow in Episode 4's outro glimpse of this episode (Balak seated left, the cow on
the right facing him, his palm raised, warm low light). Today she can only idle (static legs, head, ear and tail
motion), so she needs a **walking and grazing extension** of that rig, not a new cow. No bell sound while she hides (a
bell would give her away). No glow (BAL-05). What she does, per shot:

| Shot | Cow action |
|---|---|
| 02 shot 3 | At the trellis: head down, tears at the vine with a tug, a young cucumber in her mouth, chewing; the vine sags off the bamboo frame and its root comes up out of the earth |
| 02 shot 4 | Throws up her head at Haricharan's (silent) shout, ears forward, then turns and trots off into the banana plants (a four-beat walk speeding to a trot) |
| 02 AG1 a | Walks past seated Balak deeper into the grove and stops behind a big clump of banana plants, out of sight of the path; only her flicking ear and swishing tail show between the trunks (the viewer knows where she is) |
| 02 shots 5 to 11 | Hidden in the soft background, chewing her cud, ear flicks (not distracting: CAM-11) |
| 02 P3 | Steps out from the banana trunks, lowers her muzzle to Balak, slow blink, breathes out (a soft snort) while he strokes her face |

### Characters

| Who | Rig | Note |
|---|---|---|
| Balak, about six | New standing child rig (scene 01) and `SeatedChild` (scene 02), both in the BAL-26 design | See "Balak in Episode 5" |
| Binoy (বিনয়) | New Puppet cast member: a youth of about 14 or 15 | Book: "বা'র থেকে ফিরছিল", calls Surendra "সুরেন কাকা". Short dark hair, a plain cotton fatua and a knee-length dhoti, a cloth bag over his shoulder (coming home from outside). Curious, then alarmed (both hands on his head, mouth open: the shout, no lip sync), then puzzled (scratches his head). Silent (decision 2) |
| Charu | `CAST.charu` Puppet | White sari, red border, sindoor (CHR-02); hurries in (walk with the hem lifting, CHR-05 to CHR-07), kneels, takes Balak's hand in both hands and turns it palm up and back; a visible sigh of relief (MOT-20) |
| Surendra (the father) | `SURENDRA` from Episode 2 (`episode02/scenes/Scene01eFather.tsx`) | Hurries in behind Charu, bends to look. Move him to a shared cast entry rather than redraw (as Sundar and Thakurma for Episode 4). Decision 3 |
| Binoy's mother | `CAST.womanA` | At her door in the background, a hand at her mouth; silent, calmer (CAM-11) |
| Haricharan (হরিচরণ) | New Puppet cast member: a working man of about 30 | A kachari hand who grows the vegetables (decision 9): lean, dark-skinned, short black hair, a thin moustache, a dhoti hitched up for work (মালকোঁচা), bare-chested with a gamchha on one shoulder, a long bamboo pole (বাঁশ) about his own height in his fist (prop held every frame, MOT-07). Angry bluster, not menace: knitted brows, flared nostrils, quick agitated breathing (MOT-20); he never swings the bamboo at anyone. Needs a hurried run-in, a stop, a jab of the hand, a bamboo thump, a turn and a stomping walk-off |
| A clerk at the kachari | a `CAST` adult, far background | Optional: bent over a ledger on the kachari veranda in scene 01's establishing wide, to show what the building is |

### Props

- **Bamboo basket (ঝাঁকা/ঝুড়ি):** a big shallow woven basket tipped on its side by the corner room (where the
  tortoises were kept under it; our staging).
- **Cucumber trellis:** a bamboo frame (মাচা) about waist-high at the grove's edge against the kachari's back wall,
  a big cucumber vine spread over it with yellow flowers and many young cucumbers at the tips (the book's "বিরাট
  একটা শশা গাছ… তার ডগায় কচি বড় বহু শশা"); after the cow: the vine dragged down, leaves torn, the root out of the
  ground, a few bitten cucumbers on the earth. Two states, or one animated pull in shot 3.
- **Haricharan's bamboo pole:** green-brown, knotted, a little taller than him.
- **Pebbles:** a few round river pebbles in a little row before Balak (his quiet play; the book says only "বসে খেলা
  করছে").

### Sets

| Scene | Place (book) | Set | New work |
|---|---|---|---|
| 01 shot 1 | "কৃষ্ণনগর কাছারি" | **New `KrishnanagarKachari` set**, compound view: the kachari building at left (a long single-storey lime-washed brick building on a raised plinth, a tiled or tin roof, a deep front veranda with square pillars, a low desk with ledgers, a bench), the neighbour's mud house at right with its corner room, a bamboo fence with a gap toward the family's own house (only a bit of its thatch beyond the fence), a big mango or jackfruit tree, jungle beyond (STO-09) | The kachari has never been shown and the book names it (so STO-04 does not forbid it). Late-morning light |
| 01 shots 2 to 6 | "পাশের বাড়ী… কোণের ঘর" | The same set, the **neighbour's courtyard corner**: the corner room's mud wall and thatch eave, a low veranda plinth, clay pots, beaten-earth yard, the tipped basket | Must match the Ujanchar village house exactly (same thatch, mud walls, bamboo posts and fence, colours, CAM-11 grade): build it from `UjancharHouse.tsx`'s pieces and materials, not a new style. If those pieces are not exported, the `UjancharHouse.tsx` owner exports them (one agent per file) |
| 02 | "কাছারী ঘরের পেছনে কলাবাগিচায়" | The same set, the **back of the kachari**: its back wall and back door at left, the cucumber trellis against it, a narrow path from the door; the banana grove filling the frame to the right (rows of tall banana plants with torn old leaves hanging, a hanging banana flower, dappled light, `Banana` from `S01_DaySets.tsx` as the base plant), Balak under the plants | Warm early-afternoon light, so the scene's end tableau has the warm low light of the Episode 4 glimpse (decision 17). Deep grove planes for the hidden cow; a keep-in-set camera clamp like `ujancharKeepInSet` (CAM-08) |
| (alternative) | | Scene 01 in the family's own `UjancharHouse` courtyard, at its hut's corner | Cheaper, but the book says the next-door house (decision 1) |

---

## Sounds available (production worktree `remotion_studio/public/audio/`)

- `ambient/` (loops): `dawn_birds_temple`, `padma_river_day`, `bengal_night_crickets`, `monsoon_rain_courtyard`.
- `music/`: `Village_Peace_Loop`, `Warm_Family_Flute`, `Festival_Folk_Loop`, `Divine_Motif`, `Theme_Intro_Bansuri`,
  `Sacred_Night_Ambient`.
- `sfx/`: `chime_pop`, `soft_magical_shimmer`, `temple_bell_drop`, `river_water`, and the rest.
- `sfx/ep02/` (credits in its README): `birds_village` (loop), `wind_soft` (loop), `footsteps_mud`, `footsteps_floor`,
  `cloth_rustle`, `clay_thud`, `sand_pat`, `door_creak`, `cow_bell`, `cow_moo`, `hooves_soft`, `whoosh_soft`,
  `scuffle` and the rest.
- `sfx/ep04/`: `brass_tap`, `drink_gulp`, `pond_water`.
- `ep05/`: the six voices plus `00a_Source_Attribution.wav`, levelled (the timing agent's work this round).
- **Missing** (none is required; stand-ins named): a tortoise shell scraping on earth and a soft shell knock when
  one is turned (stand-in `sand_pat` 0.12 and `clay_thud` 0.15); a cow tearing a vine and munching (no good
  stand-in; leave it under the birds); a bamboo pole thumped on earth (stand-in `clay_thud` 0.2); a soft cow snort or
  breath (stand-in: a very low `cow_moo` at 0.12, or silence). All can be sourced as CC recordings with
  `sfx-from-commons` (decision 13).

### Sound beds

| Scene | Bed | Under voice | In a pause | Note |
|---|---|---|---|---|
| 01 compound, late morning | `sfx/ep02/birds_village` | 0.10 | 0.20 | The manifest's `padma_river_day` is a flowing river; a yard needs birds |
| 01 | `music/Village_Peace_Loop` | 0.06 | 0.12 | The manifest's music; ducks to 0 on "হঠাৎ" (the bite) and returns from shot 5 (the unmarked hand) |
| 02 grove, afternoon | `sfx/ep02/birds_village` | 0.08 | 0.18 | |
| 02 | `sfx/ep02/wind_soft` | 0.08 | 0.12 | Banana leaves |
| 02 | `music/Warm_Family_Flute` | 0.06 | 0.12 | The manifest's music under the quiet grove (open P1 to shot 3); fades out as Haricharan bursts in (shot 4) |
| 02 P3 | `music/Divine_Motif` | | 0.15 | The end beat (decision 6); fades with the picture into the outro |

The beds duck under every voice and rise in the pauses (`ducked()`, `DUCK_RAMP` 10, open level capped at 0.25). The
chapter break: beds fade out with the picture, `sfx/chime_pop` at 0.18 in the black, scene 02's beds fade in with it
(CAM-10).

---

## Intro and source card

Unchanged series template (TTL-02 to TTL-06): "পর্ব পাঁচ: কচ্ছপ খেলা ও গাভী রক্ষা", no captions on the title page,
the source card after it. No pauses. The card overlaps scene 01's fade-in with no black frame, as in Episodes 3 and 4.

---

## Scene 01: 01_tortoise_play (the tortoise), 20.1 s today

**Design.** The Krishnanagar kachari compound on a clear late morning. The neighbour's courtyard corner by the corner
room: mud wall, thatch eave, a tipped bamboo basket, four tortoises on the beaten earth. Balak stands bent over them,
absorbed, turning one over and back. Binoy comes home round the corner of the house and stops to watch. The family
(Charu, Surendra) is in its own house beyond the bamboo fence; Binoy's mother inside her door.

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "কৃষ্ণনগরের কাছারি বাড়িতে একদিন" | Wide: the kachari compound in late-morning sun: the kachari's long veranda at left (a clerk with ledgers, small), the neighbour's mud house at right with its corner room; by the corner, small, Balak bent over the tortoises beside the tipped basket (his glow helps find him); jungle beyond the fence | Hold (fades in under the source card's end) | Establishing view of the named place: a held wide. No place-name board (TTL-13) |
| 2 | 72 (voice ≈ 74) | "ছোট্ট বীরু কচ্ছপদের সাথে খেলা করছিল।" | Medium: Balak standing bent over the four tortoises, rolling T1 onto its back by tail and side (its legs paddle) and righting it, the others plodding; at the left edge Binoy comes round the corner of the house and stops, curious | Cut on "ছোট্ট বীরু"; hold | The line names Balak and the tortoises. Binoy's quiet watching is the book's ("চুপ করে দাঁড়িয়ে দেখছিল") |
| 3 | 157 (voice ≈ 156) | "হঠাৎ একটা কচ্ছপ তার হাত কামড়ে ধরল!" | Close, low at tortoise height: Balak's hands come down to T2; one goes to its front end; its head shoots out and the jaws clamp on the side of his hand, and hold; Balak's face in the upper frame, a blink of surprise | Cut on "হঠাৎ"; hold | A sudden event; the subject is the bite. Ground line high in frame so the action sits above y = 820 |
| 4 | 238 (voice ≈ 241) | "সবাই তো 'গেল গেল' বলে ছুটে এল—" | Wide on the corner (closer than shot 1): Binoy, both hands on his head, mouth open in a shout; Charu and Surendra hurry in through the gap in the bamboo fence; Binoy's mother at her door; Balak still bent, his hand held by the tortoise | Cut on "সবাই"; hold | The line names everyone running: a wide shows them come. Only the narrator's voice; no mouth syncs (M2) |
| 5 | 309 | "কিন্তু দেখা গেল হাতে একটুও দাগ নেই," | Medium close two-shot: Charu kneels and reaches for him; T2 opens its jaws and lets go as her hands arrive; Balak straightens; she turns his small hand palm up, then over: smooth, no mark (on "দাগ নেই", voice ≈ 366); Balak looks up at her with his calm faint smile | Cut on "কিন্তু"; hold | The reveal the line names; the hand big enough to read |
| 6 | 391 (voice ≈ 398) | "আর কচ্ছপও চুপচাপ হাত ছেড়ে দিয়েছে!" | Close, low: T2, already free, head half drawn in, turns and plods calmly back toward the others; Balak's bare feet soft in the background | Cut on "আর কচ্ছপও"; hold into P3 | The line names the tortoise (M7) |

Five cuts in 20 s; the shortest hold between moves is about 2.8 s (shot 4 to shot 5), the longest about 5 s (shot 2
with P1).

### Pauses

| # | Kind | After | Length | Picture | Sound |
|---|---|---|---|---|---|
| P1 | mid | "…খেলা করছিল।" (`01a`, sentence silence 5.88-6.46 s; the voice already has 0.8 s of quiet here, so about 2.3 s in all) | 1.5 s | Shot 2 holds: Balak rights T1 and watches its head poke out, a slow blink and a faint smile; T3 and T4 plod; Binoy, at the corner, tilts his head, watching quietly | `sand_pat` 0.12 (shell on earth, stand-in); `birds_village` rises to 0.20 |
| P2 | mid | "…কামড়ে ধরল!" (`01a`, sentence silence 9.65-10.05 s) | 1.0 s | Shot 3 holds: T2 hangs on, neck stretched; Balak, still bent, looks it in the eye, calm, a little amused (the book's unrecorded "ছাড়লি না…": no mouth movement); his breathing stays even | Music already ducked to 0; birds 0.18: the quiet before the shout |
| P3 | end | after "…হাত ছেড়ে দিয়েছে!" | 2.0 s | Cut at the start of the pause to the group, medium: Charu holds his hand to her cheek and lets out a visible sigh of relief (MOT-20); Surendra bends to look, puzzled; Binoy scratches his head; Balak looks past them at the tortoises with his serene smile; his glow brightens gently on the unmarked hand (decision 6). Then chapter break 1 | `sfx/ep02/cloth_rustle` 0.15 as Charu settles; `soft_magical_shimmer` 0.15 with the glow (decision 6); `Village_Peace_Loop` 0.12 and birds 0.20 fading with the picture |

**Scene total: 4.5 s.**

**Chapter break 1 (CB1, 1.0 s, not a pause):** fade to black over the last 18 f of P3's picture, 8 f of black with
`sfx/chime_pop` 0.18, then scene 02 fades in over 30 f during its open pause (the fade runs on `lifeF`).

---

## Scene 02: 02_banana_grove_cow_rescue (the cow in the banana grove), 30.5 s today

**Design.** The banana grove behind the kachari on a warm, still early afternoon: the kachari's back wall and back
door at left with the cucumber trellis against it, a narrow path from the door, rows of tall banana plants to the
right, torn old leaves hanging, dappled light. Balak sits cross-legged on the earth under the plants with a few
pebbles, quiet and alone. The cow eats at the trellis; Haricharan comes out of the kachari's back door with his bamboo.

### Shot list (with the action gaps)

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "ছয় বছরের বীরু তখন কলাবাগিচায়" | Wide: the grove behind the kachari (its back wall and door at left, the trellis there, small), Balak seated under the banana plants in the right third, setting a pebble in his little row | Hold (fades in from black during the open pause) | Establishing view of a new place and the six-year-old: a held wide |
| 2 | 78 (voice ≈ 84) | "চুপচাপ বসে থাকতে ভালোবাসত।" | From the wide toward a medium wide on Balak: his hands still, he looks up into the leaves, serene | Slow push in from "চুপচাপ", settling in the voice's own 1.8 s of quiet after the sentence | The habitual quiet: a gentle emotional push (CAM-01), the sentence's one move |
| 3 | 145 (voice ≈ 171) | "একদিন শশা গাছ খেয়ে ফেলায়" | Medium: the trellis at the grove's edge: the cow tears at the vine, a cucumber in her mouth, the vine sagging off the bamboo frame, its root coming up out of the earth | Cut on "একদিন" (the estimate is about 1 s early: key it by the voice); hold | A new subject; the clause literally (M11) |
| 4 | 230 (voice ≈ 224: "হরিচরণ" is the last word of today's caption phrase) | "হরিচরণ বাঁশ হাতে গরুটিকে মারতে ছুটে এল।" | Wide from inside the grove toward the kachari: Haricharan bursts out of the back door with his bamboo, running; in the mid-ground the cow throws up her head and turns to trot off into the banana plants | Cut on "হরিচরণ" by the voice; hold into AG1 | The line names Haricharan and his bamboo; the cow's flight is caused by him |
| AG1 a | 2.5 s gap at the 02a / 02b boundary: beat a 1.5 s | (no voice) | Medium on Balak: the cow ambles past him, deeper into the grove, and stops behind a big clump of banana plants out of sight of the path; only an ear and her tail show between the trunks; Balak watches her go, then looks back down at his pebbles | Cut; hold | The book's "বালক ঠিকই জানতো গাভীটা কোথায় রয়েছে" (M12), told in picture |
| AG1 b | beat b 1.0 s | (no voice) | Same frame: Haricharan pounds in from the left and stops short over Balak, panting, the bamboo in his fist, scanning the grove | Hold | His arrival, the book's "হরিচরণ একটা বাঁশ নিয়ে এসে" |
| 5 | 323 | Haricharan: "এই বীরু!" | Medium close-up: Haricharan, eye level, sweaty, glaring down, the bamboo upright beside him | Cut 6 to 8 f before his voice; hold | Speaker close-up, early. No low "menace" angle (decision 18) |
| 6 | 350 | Haricharan: "তাড়াতাড়ি বল তো, গরুটা কোন দিকে গেছে?" | Same close-up; he jabs his free hand toward the grove (starting 6 to 8 f before "কোন দিকে", voice ≈ 378) | Hold | Same speaker |
| 7 | 413 | Balak: "দেখলেও বলব না হরিচরণদা!" | Close-up on Balak (held from P2), looking up, calm and settled | Hold | Speaker close-up, already in place from the pause |
| 8 | 464 (voice ≈ 467) | Balak: "বলে দিলে তো আপনি ওকে মারবেন।" | Two-shot in profile: Haricharan left, towering with the bamboo; Balak right, seated, looking up, a small open palm lifted toward the bamboo | Cut on "বলে দিলে"; hold | The line turns to Haricharan and the bamboo: both in frame |
| 9 | 525 (voice ≈ 530) | Balak: "ওর খিদে পেয়েছিল, তাই খেয়েছে—" | Same two-shot; Balak gestures gently off left, toward the torn trellis (away from the hidden cow) | Hold | Same sentence group; his gesture never betrays the cow |
| 10 | 588 | Balak: "ও কি আর বুঝেছে আপনার গাছ না আমার গাছ?" | From the two-shot into a medium close-up on Balak (Haricharan's shoulder leaving frame left); a small slow head shake, compassionate | Slow push in from the line's start, settling by its end | The emotional peak of his plea: a slow push (CAM-13) |
| 11 | 669 (voice ≈ 662) | Balak: "আমি ওর খবর বলতে পারব না!" | The pushed-in close-up holds: calm, final, a faint smile | Hold into AG2 | His decision, on his face |
| AG2 | 2.5 s gap after the last line | (no voice) | Cut to the wide two-shot: Haricharan, more agitated, throws up his free hand, thumps the bamboo end on the ground once, turns and stomps off along the path into the kachari's back door; Balak watches him go | Cut; hold | The book's "উত্তেজিত হরিচরণ অধিকতর উত্তেজিত হয়ে চলে গেল" (M15) |

Today the scene is 732 frames before the outro starts (745 with the 13 f overlap); with the two action gaps (5.0 s)
and three pauses (5.0 s) it becomes about 40.5 s.

### Pauses

| # | Kind | After | Length | Picture | Sound |
|---|---|---|---|---|---|
| P1 | open | before "ছয় বছরের বীরু…" | 1.0 s | The fade-in from chapter break 1 lands on the held wide: banana leaves lift and settle in the breeze, dappled light moves over the earth; Balak sets a pebble in his row, a slow blink. The fade runs on `lifeF` | `sfx/ep02/birds_village` rising to 0.18, `wind_soft` 0.12, `Warm_Family_Flute` 0.12 |
| P2 | mid | "…গরুটা কোন দিকে গেছে?" (clip boundary 02b / 02c) | 2.0 s | Cut at the start of the pause to the close-up on Balak: he looks up at Haricharan, quiet; his eyes lower for a moment (never toward the cow), a slow blink, and lift again, calm and settled: the book's dilemma ("'জানি' বললে গাভীটি ভীষণ মার খায়, আর 'জানি না' বললেও 'সত্য' যায়… গাভী এবং সত্য দুটোকেই রাখতে হবে"). In the soft background a banana leaf stirs | Birds 0.15 only; no music: the held breath of the scene. Haricharan's quick breathing is off screen |
| P3 | end | after AG2 | 2.0 s | Cut to the medium: Balak alone under the banana plants; behind him the cow's head comes out between the trunks; she steps up and lowers her muzzle to him; he turns, raises his palm and strokes her face and neck (the Episode 4 glimpse composition: Balak left, the cow right); his glow brightens gently (the episode's key beat, decision 6); the cow's slow blink, a soft breath out. Then the series fade into the outro | `music/Divine_Motif` 0.15 (or `soft_magical_shimmer` 0.15, decision 6); a soft cow breath 0.12 (decision 13); birds 0.18 fading with the picture |

**Scene total: 5.0 s** (plus 5.0 s of action gaps).

---

## Scene 99: closing outro and the Episode 6 glimpse

Left as the series template (TTL-09, TTL-10a, TTL-11, TTL-12): no pauses, no camera changes. The glimpse of Episode 6
("জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী", the manifest's `next_episode_title_bn`) is a calm, boxless moment in the
same feathered vignette as Episodes 3 and 4, fading in on "আসছে পরের পর্ব", with the label "পর্ব ছয়" and the name
in glowing cream-gold Baloo Da 2 and no backing. Suggested (decision 14): six-year-old Balak (BAL-26 design) standing
quietly by a veranda post of the Ujanchar house in warm low gold light (`UjancharHouse`, "dawn" light read as evening
gold), a pair of wooden khadam (the father's sandals, chapter 10's "বাবার 'খড়মের' শব্দ") resting on the step below;
his soft halo only. This needs no new character design; the alternative (the two brothers side by side) needs the
elder brother's design first. As in Episode 4, the glimpse is a layer inside the outro (no separate `98` segment).

---

## Totals

| Scene | Pauses | Added by pauses | Other added time | Frames today → planned |
|---|---|---|---|---|
| Intro, source card | none (template) | 0 | | 639 → 639 |
| 01 tortoise | 3 | 4.5 s | CB1 1.0 s | 483 → 615 |
| 02 cow in the banana grove | 3 | 5.0 s | AG1 2.5 s + AG2 2.5 s | 732 → 972 |
| 99 outro and Episode 6 glimpse | none (template) | 0 | | 623 → 623 |
| **Total** | **6** | **9.5 s (228 f)** | **6.0 s (144 f)** | **2,477 → about 2,849** |

- **Episode 5 today:** the SRT runs **1:23.1** (83.107 s, voices only, no source card); the generated timeline
  (`build_ep05_timing.js`, with the source card) is **2,477 frames (1:43.2)**.
- **Pauses:** 9.5 s = **9.2 %** of the 2,477-frame episode (Episode 4: 12.4 %, Episode 3: 13.8 %), or 11.4 % of the
  SRT's 83.1 s. Episode 5's voices already carry long natural silences (1.8 s after "…ভালোবাসত।", 0.8 s after
  "…খেলা করছিল।"), which is why the pause total can stay lower.
- **Planned length:** about **2,849 frames (about 1:58.7)**. Report the generator's number when it runs (the tail
  overlaps change it by a few frames).
- **Fuller version** (if the director wants more breathing room): scene 01 P2 1.5 s and scene 02 P1 1.5 s: 10.5 s of
  pauses (10.2 %), about 2,873 frames (1:59.7).

---

## Notes for whoever codes this (after approval)

- **Generator (`scripts/build_ep05_timing.js`, in the worktree; the timing agent's file this round).** Its `PAUSES`,
  `GAPS` and `BREAKS` are empty. Entries (scene ids as the generator: `S01 = "01_tortoise_play"`,
  `S02 = "02_banana_grove_cow_rescue"`):
  - `{ scene: S01, after: "খেলা করছিল।", sec: 1.5, clip: "01a_Narrator_Tortoise.wav", silence: [5.878, 6.457], note: "P1" }`
    (the estimate is 0.07 s off, inside `PAUSE_TOL`; naming the silence is belt and braces)
  - `{ scene: S01, after: "কামড়ে ধরল!", sec: 1.0, clip: "01a_Narrator_Tortoise.wav", silence: [9.646, 10.051], note: "P2" }`
  - `{ scene: S01, at: "end", sec: 2.0, note: "P3: the unmarked hand; then chapter break 1" }`
  - `{ scene: S02, at: "open", sec: 1.0, note: "P1: fade in from black on the grove" }`
  - `{ scene: S02, after: "কোন দিকে গেছে?", sec: 2.0, note: "P2 (clip boundary 02b/02c): Balak's dilemma" }`
  - `{ scene: S02, at: "end", sec: 2.0, note: "P3 (after AG2): the cow comes to Balak; the glow beat" }`
  - GAPS: `{ scene: S02, after: "মারতে ছুটে এল।", sec: 2.5, beats: [{ id: "a_cow_hides", sec: 1.5 }, { id: "b_haricharan_arrives", sec: 1.0 }], note: "AG1 (clip boundary 02a/02b)" }`
  - GAPS: `{ scene: S02, after: "খবর বলতে পারব না!", sec: 2.5, beats: [{ id: "a_haricharan_leaves", sec: 2.5 }], note: "AG2" }`.
    This hold point is the scene's last phrase (the clip's end, no next clip in the scene). If the generator's
    `after` does not resolve there, give GAPS an `at: "end"` kind whose hold point is the end pause's, ordered gap
    first, then the end pause (the same order as `afterGap` at a mid point).
  - BREAKS: `[{ after: S01, sec: 1.0 }]`.
  - Only `01a` is cut (twice); every other hold sits at a clip boundary, an open or an end.
- **Captions:** two phrase splits cross clauses and lead the voice: "একদিন শশা গাছ খেয়ে ফেলায় হরিচরণ / বাঁশ হাতে
  গরুটিকে মারতে ছুটে এল।" should split after "ফেলায়" (the voice has a 0.1 s gap at 9.23-9.32 s), and the "একদিন…"
  phrase starts about 1 s before the voice (the char-share estimate does not see the 1.8 s silence after
  "ভালোবাসত।"; the voice resumes at about 7.13 s). Ask the generator to anchor these two phrase starts to the voice.
  Chips হরিচরণ (02b) and বীরু (02c) are already what the generator writes. Only the speaker's mouth moves; Binoy's
  shout and Haricharan's off-line muttering are mouth shapes without sync, not speech.
- **Measured silences** (silencedetect -45 dB / 0.12 s on the played 48 kHz files in `public/audio/ep05`, seconds;
  word mapping from a second pass at -32 dB and the sentence order, confirm by ear; the full list is in
  `scripts/ep05_silences.txt`):
  - `01a_Narrator_Tortoise` (19.69 s): 2.87-3.10 (after "একদিন"), 3.88-4.02 (after "ছোট্ট বীরু"), **5.88-6.46
    (sentence end, P1)**, **9.65-10.05 (sentence end, P2)**, 12.71-12.88 (after "ছুটে এল—"), 14.26-14.39 (after
    "কিন্তু দেখা গেল"), 15.11-15.24 (before "দাগ নেই"), 16.14-16.53 (after "দাগ নেই,"), 17.94-18.07, 19.44-end.
    Word starts: "ছোট্ট বীরু" 3.10, "হঠাৎ" 6.49, "সবাই" 10.05, "কিন্তু" 12.88, "দাগ নেই" 15.24, "আর কচ্ছপও" 16.58.
  - `02a_Narrator_Cow` (13.00 s): speech 0.08-5.34, then quiet (room tone above -45 dB) to 7.13 with true silences
    6.44-6.69 and 6.78-7.03; "চুপচাপ" 3.50, "একদিন" 7.13, "শশা গাছ খেয়ে ফেলায়" 7.91-9.23, "হরিচরণ…" from 9.32,
    12.62-end.
  - `02b_Haricharan` (3.31 s): "এই বীরু!" 0.11-0.63, 1.02-1.14 silence, "তাড়াতাড়ি বল তো," 1.14-1.74, "গরুটা কোন দিকে
    গেছে?" 1.90-2.98, 3.00-end.
  - `02c_Thakur_Truth` (12.84 s): 1.89-2.24 (after "হরিচরণদা!"), 4.36-4.88 (after "মারবেন।"), 7.07-7.28 (after
    "খেয়েছে—"), 10.12-10.35 (after "আমার গাছ?"), 12.55-end. Word starts: "বলে দিলে" 2.27, "ওর খিদে" 4.89, "তাই
    খেয়েছে" 6.34, "ও কি আর" 7.31, "আমি ওর খবর" 10.39. Room for optional extra pauses after "হরিচরণদা!" or
    "মারবেন।" if the director wants Haricharan's reactions held; not planned.
- **Story clock:** the Episode 5 equivalents of `useStory4`, `cueLocalStory4`, `gapState4`, `breakState4` in
  `src/episode/storyClock.ts` (the timing agent is adding them this round). Choreography, mouths and camera keys on
  `f`; `lifeF` to every Puppet, both Balak rigs, `BirulGlow`, the tortoises, the cow, leaves and light (blinks on
  `lifeF`, PIT-03; Haricharan's `talk` must read silent across P2). AG1 keys its beats a and b from the gap state.
- **What must be built** (none exists): `src/episode05/Episode05.tsx` (timeline, beds, SFX, pause, gap and break
  sounds), `scenes/Scene00Intro`, `Scene01TortoisePlay`, `Scene02BananaGroveCowRescue`,
  `Scene99ClosingSequentialOutro` (template + Episode 6 glimpse), registration in `src/Root.tsx`; the
  `KrishnanagarKachari` set file (compound wide, neighbour corner built from Ujanchar pieces, grove behind the kachari
  with the trellis and keep-in-set clamp); the standing child rig in the BAL-26 design (new file) and the seated rig's
  new poses (`playPebbles`, head shake, `strokeCow`) on top of the design agent's work; the tortoise rig (four
  instances, turned-over state, bite and release); the cow's walk, trot, graze and muzzle-lower (an extension of the
  Ujanchar `Cow`, so its file owner does it); Binoy and Haricharan cast entries; `SURENDRA` moved to the shared cast;
  Charu's kneel and hand-turn. Suggested agents (agent-dispatch, one per file): the two scene files, the set file,
  the standing rig, `SeatedChild.tsx` (shared with Episodes 3 and 4: their poses and frames must not change), an
  animals file (tortoise) plus the `UjancharHouse.tsx` owner for the cow and any exported hut pieces, `cast.ts` for
  the new people, and `Episode05.tsx` for sound last.
- **Protected fixes every agent keeps:** the shared `Hand` with no outline and correct thumbs (MOT-19); `puppetBreath`
  breathing, quicker for Haricharan's agitation, quieter while speaking (MOT-20); `BirulGlow` soft falloff, no rings or
  rays, never pulsing with breath (BAL-06, BAL-07); no glow on any animal, prop or other character (BAL-05); Balak in
  the BAL-26 design with no tilak, jewellery, thread, bangles or anklets (BAL-01 to BAL-03, BAL-26); objects and the
  tortoise's jaws stay in contact (MOT-07); feet planted in the bend (MOT-06); the intro, the source card overlap with
  no black frame, and the outro glimpse with no box (TTL-10a); no letterbox (CAM-04); Baloo Da 2 for all text (TTL-01);
  Episodes 1 to 4 untouched (BAL-26: they keep their delivered designs).

---

## For the director to decide

Each question gives my recommended answer first.

1. **Where the stories happen.** *Recommended:* the Krishnanagar kachari compound at Ujanchar (the book's "কৃষ্ণনগর
   কাছারি"): scene 01 opens on a held wide of the kachari, then plays at the corner room of the **neighbour's house**
   ("পাশের বাড়ী… কোণের ঘর"), built from the Ujanchar village house's own pieces; scene 02 in the banana grove
   **behind the kachari** ("কাছারী ঘরের পেছনে"). One new set file. *Or:* play scene 01 in the family's own Ujanchar
   courtyard (`UjancharHouse`, cheaper, but the book says next door).
2. **Binoy.** *Recommended:* show him silently as the book's witness: he watches, then shouts with both hands on his
   head (no voice; the narrator quotes "গেল গেল") while the others run in. *Or:* leave him out and let "everyone"
   look alarmed as the narration says.
3. **Who runs in.** *Recommended:* Charu and Surendra from the family's house, Binoy's mother at her door (the book's
   "সবাই… দু'তিন জন"; none are named). *Or:* Charu alone.
4. **The tortoise play and bite.** *Recommended:* as the book, gently: he rolls one onto its back by tail and side and
   always rights it; the bite clamps on the side of his hand, held, with no blood, no wound and no pain on his face.
   *Or:* soften it further (he only lifts and pats them, and the bite is a quick nip).
5. **Balak's unrecorded words** "ছাড়লি না, ছাড়লি না—দাঁড়া দেখাচ্ছি মজা।" *Recommended:* leave them out (no new
   recordings); his amused calm in P2 carries the moment. *Or:* record the line and insert it in P2.
6. **Glow beats and motif.** *Recommended:* two gentle beats, one per story: the unmarked hand (scene 01 P3, BAL-11's
   "miracle reveal", with `soft_magical_shimmer` 0.15) and the cow coming to him (scene 02 P3, with `Divine_Motif`
   0.15). *Or:* only the scene 02 beat, as Episode 4 had one.
7. **Scene 02's wordless action (5 s).** *Recommended:* two action gaps: AG1 2.5 s (the cow hides behind the banana
   plants as Balak watches; Haricharan arrives) and AG2 2.5 s (Haricharan storms off), no new recordings. *Or:* fold
   them into the pauses (then the story clock holds and the action runs on `lifeF`).
8. **The end tableau.** *Recommended:* the cow comes out and lowers her muzzle, and Balak strokes her (our staging,
   echoing Episode 4's glimpse and the outro's "অসহায় প্রাণীকে রক্ষা করা"). *Or:* end on Balak alone, the cow's ear
   just visible behind the leaves.
9. **Haricharan.** *Recommended:* a kachari hand of about 30 who grew the cucumbers (dhoti hitched up, gamchha,
   bamboo pole), angry bluster but no menace, chip হরিচরণ; the book never calls him a relative, despite the voice ID.
   *Or:* an older relative of the household.
10. **A standing Balak for scene 01.** *Recommended:* build a standing child rig in the BAL-26 design (the book's
    "উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে"; Episode 6 needs a standing Balak too). *Or:* stage him kneeling up on his knees
    with the existing seated rig (saves work, departs from the book).
11. **Book events left out.** Confirm leaving out the chapter 9 opening (the beatings and neglect, the other sitting
    places), the family's chat before the shout, and the kachari gossip afterwards. *Recommended:* leave them out.
12. **Music and beds.** *Recommended:* `Village_Peace_Loop` in scene 01 (out from the bite to the unmarked hand),
    `Warm_Family_Flute` under the quiet grove until Haricharan bursts in, `Divine_Motif` at the end; birds and breeze
    instead of the manifest's river bed `padma_river_day`. *Or:* the manifest's beds as written.
13. **Missing sounds.** *Recommended:* source CC recordings for the tortoise shell on earth, the cow tearing and
    munching the vine, a bamboo thump and a soft cow breath. *Or:* the stand-ins (`sand_pat`, `clay_thud`, silence, a
    low `cow_moo`).
14. **The Episode 6 glimpse.** *Recommended:* Balak standing by a veranda post of the Ujanchar house in warm gold
    light with the father's wooden khadam on the step below (chapter 10's "খড়মের শব্দ"; no new design needed). *Or:*
    the two brothers side by side (needs the elder brother's design first).
15. **Chapter break.** *Recommended:* fade to black with a soft chime between the tortoise and the cow stories
    (CAM-10, two chapters). *Or:* a slow cross-dissolve.
16. **Length.** *Recommended:* about 1:58.7 (6 pauses, 9.5 s, plus 5 s of scene 02 action and a 1 s break). *Or:*
    the fuller 1:59.7.
17. **Light.** *Recommended:* scene 01 late morning; scene 02 warm early afternoon, so the end tableau carries the warm
    low light of Episode 4's glimpse. *Or:* both golden daytime as the manifest says.
18. **Camera in the Haricharan exchange.** *Recommended:* eye-level, no handheld and no low "menace" angle (the book
    plays it as bluster against a calm child). *Or:* a light handheld on Haricharan's close-up (CAM-03 allows it in
    tense moments).
