# Director Decisions: Creative and Visual Rules

The binding creative and visual decisions made by the series director while producing Episodes 1 to 3.
Every future iteration and every new episode follows them. Technical and process rules live in
`docs/PIPELINE_DECISIONS.md`; the frame-review checklist built from both files is `docs/QA_CHECKLIST.md`;
the dated history is `docs/decisions/CHANGELOG.md`.

## How to use and update this file

**Using it**
- Read this file before working on any scene, rig, set, card or episode. Brief every agent with the rule IDs that touch its file.
- Each rule is one testable line: a reviewer should be able to pass or fail it by looking at a rendered frame or contact sheet.
- When this file disagrees with an older bible file (`visual_style_guide.md`, `characters.json`, `production_rules.md`, `divine_visual_language.md`), this file wins. Known conflicts are listed at the end.
- Only the director makes rules here. Agents do not add their own preferences or invent rules.

**Updating it**
- Append a new decision in the same session it is made, under the right group, with the next free ID, the date (YYYY-MM-DD) and the episode it was decided in.
- IDs are never reused or renumbered.
- A superseded rule is struck through and replaced, never silently deleted:
  `- ~~**CAM-06** old text~~ *Superseded 2026-12-02 by CAM-11 (reason).*` followed by the new rule.
- In the same session, update `docs/QA_CHECKLIST.md` (add or change the matching check) and add a line to `docs/decisions/CHANGELOG.md`.

**Conventions**
- Frame counts are at 24 fps (the Remotion compositions run at 24 fps). The frame is 1920 x 1080.
- Code paths starting with `src/` are relative to `remotion_studio/`.
- `Ep` is the episode in which the rule was decided. `Ep 1-3` means it was decided during the Episode 1 to 3 sessions and the exact episode was not recorded.
- All rules below were recorded on 2026-11-21 from the director's sessions up to that date.

---

## 1. Balak and the divine (BAL)

- **BAL-01** No tilak or tikka on Balak's forehead, at any age. *Why:* he is divine to his devotees but must not look like Krishna. *Ep 1-3*
- **BAL-02** No bangles and no anklets on Balak. *Why:* must not look like Krishna. *Ep 1-3*
- **BAL-03** No jewellery of any kind and no sacred thread on Balak. *Why:* must not look like Krishna. *Ep 1-3*
- **BAL-04** Balak's hair is curly and dark. *Ep 1-3*
- **BAL-05** Divine light appears on Balak only; no other character, animal, prop or effect carries it. *Ep 1-3*
- **BAL-06** His halo is a soft warm-white radial glow behind his head that fades out to nothing at its edge. *Why:* divine light is restrained. *Ep 1-3*
- **BAL-07** The halo has no hard rings, no dashed rings and no bursting rays. *Why:* restraint. *Ep 1-3*
- **BAL-08** A warm golden rim light sits on his hair, shoulders and back. *Ep 1-3*
- **BAL-09** A faint glow lies on the ground under him. *Ep 1-3*
- **BAL-10** Only a few slow rising motes around him, never a shower. *Ep 1-3*
- **BAL-11** The divine light brightens gently only on key beats (his smile, a miracle reveal); otherwise it stays steady and restrained. *Ep 1-3*
- **BAL-12** His face is serene and kind, with soft half-lidded bright eyes that carry catchlights. *Ep 1-3*
- **BAL-13** He has a faint gentle smile and soft cheeks with a blush. *Ep 1-3*
- **BAL-14** His blinks are slower than other characters' and he holds a peaceful stillness. *Ep 1-3*
- **BAL-15** Episode 2 shows him as a newborn and an infant; in the go-saap scene he is a crawling infant of about 8 to 10 months. *Ep 2*
- **BAL-16** In Episode 3 he is about five years old. The visual age may differ slightly from the narration; that is not a defect. *Ep 3*
- **BAL-17** Five-year-old Balak wears a soft white or cream cotton dhoti, with an uttariya (chadar) wrapped across the chest and over one shoulder like a young Brahmin boy, childlike. *Ep 3*
- **BAL-18** The five-year-old's dhoti and uttariya follow every pose; cloth never stays rigid while the body moves. *Ep 3*
- **BAL-19** Infant Balak wears a soft cotton langot wrapped loosely, with a visible knot, a hanging end and folds. *Ep 2*
- **BAL-20** The langot moves a few frames behind the hips and never reads as a hard, solid band. *Ep 2*
- **BAL-21** Balak's face is designed for his age in each scene (newborn: BabyThakur; crawling infant: FACE_BABY; sitting baby: FACE_TODDLER; five-year-old: SeatedChild), with child proportions: a round, chubby face, natural large eyes with one soft catchlight (no star or sparkle highlights), a tiny nose, rosebud lips and soft curly hair. *Why:* the director asked for beauty and calm true to his age. *Ep 2, decided 2026-11-21*
- **BAL-22** At rest his expression is a serene, knowing calm (soft relaxed lids, slow blinks, a faint smile); when he laughs it is gentle (eyes crinkle, mouth opens softly), never a wide cartoon grin. His divine glow stays on in every scene. *Ep 2, decided 2026-11-21*
- **BAL-25** Baby Balak has ONE face design across every scene (newborn, crawling, sitting): the newborn BabyThakur face in `src/cinematic/divine/Divine.tsx` is the reference; other baby figures copy its construction. A large round cranium; a round, chubby but balanced face (the far cheek rounds modestly when he turns, never a lump or a lopsided swelling); a short soft chin (never tapering to a point); a small button nose; equal big bright warm brown eyes with one catchlight each (the far eye foreshortened at most about 15 to 20 percent), calm lids only slightly lowered, closed only for blinks, sleep or deliberate contentment; awake when the story has him acting (a miracle, play); natural soft lips; a full soft mass of dark curls inside the head outline; no stray cheek lines, no pale hairline seam. *Why:* the director found the go-saap face tapering and other face defects (2026-11-21). *Ep 1-2 on*
- **BAL-24** Balak is the central character of the series and gets the most detail and care of any figure at every age: detailed child anatomy (fingers, toes, soft creases, shading), natural movement with overlapping action and breathing, and a rich but calm range of expression (serene, joyful eye smile, thoughtful, compassionate, playful). *Why:* the director asked that the centre of the series be the most alive. *Ep 2-3, decided 2026-11-21*
- **BAL-23** All faces (Charu, the father, Thakurma, Balak) carry real detail: almond eyes with lids and lashes, shaped brows, a real nose, shaped lips and soft skin shading; Thakurma shows gentle age lines and grey hair. *Why:* the director found the faces too plain. *Ep 2, decided 2026-11-21*

## 2. Other characters and costume (CHR)

- **CHR-01** Charu (the mother) reads as a woman in her mid-20s. *Ep 1-3*
- **CHR-02** Charu wears a white sari with a red border and sindoor. *Ep 1-3*
- **CHR-03** Married women have a thin red alta line on the soles of their feet. *Ep 1-3*
- **CHR-04** Thakurma (the grandmother) wears white and has no alta. *Ep 1-3*
- **CHR-05** Women's feet show below the sari while they walk. *Ep 1-3*
- **CHR-06** In a woman's walk, the planted foot stays fixed, the swing foot lands heel first, and the hem lifts over the forward foot. *Ep 1-3*
- **CHR-07** The sari hem and its red border follow the cloth's curve and folds and sway with the body; never a straight line. *Ep 1-3*

## 3. Body and motion (MOT)

- **MOT-01** A held baby never floats: the holder's arm targets are computed from the baby's position every frame. *Ep 1-3*
- **MOT-02** Cradle hold: one forearm under his bottom and thighs, the other hand on his back or behind his head, both hands touching him. *Ep 1-3*
- **MOT-03** A lift starts only after the hands are under the baby. *Ep 1-3*
- **MOT-04** The holder bends or kneels to reach the baby. *Ep 1-3*
- **MOT-05** The lift is slow and gentle. *Ep 1-3*
- **MOT-06** Feet stay planted; no foot slides on the ground. *Ep 1-3*
- **MOT-07** Contact is always kept: hands on the ground stay on it, objects in hands stay in them. *Ep 1-3*
- **MOT-08** Adults have natural idle life: weight shift, glances with the eyes leading, arm sway with soft elbows, small hand fidgets, cloth lag. *Ep 1-3*
- **MOT-09** Idle life is scaled down during deliberate poses. *Ep 1-3*
- **MOT-10** Pose changes are eased; nothing snaps from one pose to the next. *Ep 1-3*
- **MOT-11** Overlapping action: eyes move before the head, the upper arm before the forearm, and cloth trails the body. *Ep 1-3*
- **MOT-12** A small anticipation dip comes before big moves and a settle after them. *Ep 1-3*
- **MOT-13** No pose stays frozen longer than about 20 frames unless a line calls for it. *Ep 1-3*
- **MOT-14** No stiff, outstretched arms. *Ep 1-3*
- **MOT-15** Gestures start 6 to 8 frames before the narration cue they match and return to rest about 20 frames after it. *Ep 1-3*
- **MOT-16** A crawling infant does a real hands-and-knees crawl: diagonal pairs, trunk roll, bottom wiggle, sliding knees, flat hand slaps, uneven rhythm with pauses, head lifted, soles up. *Ep 2*
- **MOT-19** Hands are anatomically right on every character: the thumb comes from the correct side of the palm for the left and right hand in palm, back and side views, fingers are in proportion, and poses read naturally (rest, hold, namaste, blessing, point, cup). One shared hand drawing (with a chubby baby variant) is used everywhere and checked on a hand QA sheet. Hands carry no dark outline and no line at the wrist: they share the arm's fill, shade and edge so they read as part of the arm, with fingers separated by soft shading only (2026-11-21: the director saw "boundary colour" on palms that looked like an extra fixture). *Why:* the director found palms and fingers odd with mispositioned thumbs (2026-11-21). *All episodes*
- **MOT-20** Breathing is subtle and natural: a slightly irregular rhythm of about 3.5 to 5 s, different per character; the chest and shoulders rise a little and the head follows a touch; nothing bobs or stretches. Emotion changes it (quicker in fright, a visible sigh of relief), and it quiets while a character speaks. Balak's halo does not pulse with breathing; it stays steady and brightens only on key beats. *Why:* the director found the breathing "not good" (2026-11-21). *All episodes*
- **MOT-17** The crawling infant has chubby infant proportions and is shown in three-quarter view. *Ep 2*
- **MOT-18** The crawling infant's torso is never perfectly level or animal-like. *Why:* that version was rejected by the director. *Ep 2*

## 4. Camera, staging and transitions (CAM)

- **CAM-01** The camera is cinematic everywhere: slow push-ins on key beats and pull-backs to let a scene breathe. *Ep 1-3*
- **CAM-02** Scenes use rack focus and parallax layers. *Ep 1-3*
- **CAM-03** Handheld movement is light and used only in tense moments. *Ep 1-3*
- **CAM-04** Letterbox bars appear only for sacred moments. *Ep 1-3*
- **CAM-05** Big events get a short slow-motion beat. *Ep 1-3*
- **CAM-06** On key lines the camera pushes in to about 1.3 to 1.5 on Balak's or Charu's face, eased in over about 18 frames, held through the line, eased out over about 20. *Why:* face close-ups are synced to the narration. *Ep 1-3*
- **CAM-07** Faces and key action stay above the caption band (above y = 820 on the 1080 frame). *Ep 1-3*
- **CAM-08** Zooms and pans never show the edge of a background. *Ep 1-3*
- **CAM-09** Related scenes join with a slow, true cross-dissolve (image to image, about 36 to 48 frames), not a quick fade through black. *Ep 1-3*
- **CAM-10** Separate stories within one episode are divided by a chapter break: fade to black, a short hold, a soft chime, then a slow fade in on a calm establishing view. *Ep 1-3*
- **CAM-11** The background never competes with the main subjects: it is calmer (lower saturation and contrast), softer (depth-of-field blur growing with distance) and slightly dimmer, while the subjects get a warm key light and rim; Balak's glow helps pull the eye to him. *Why:* the director found the busy background stole focus from the child and the go-saaps. *Ep 2, decided 2026-11-21*
- **CAM-13** Camera grammar (2026-11-21, director: moves "not properly logically sync with narrations... not well thought"): every move has a story reason and starts on its narration line: a newly named subject gets a cut or push to it; a speaking character gets a close-up starting 6 to 8 frames before the line; an emotional peak gets a slow push in; an establishing view gets a held wide. At most one move per sentence, at least about 2 s of hold between moves, no aimless drift. Camera keys are tied to the narration cues (subtitle data), not hard-coded frames, so they stay in sync when timing changes. Per-scene shot lists are approved by the director before coding. *Ep 2 on*
- **CAM-12** End an emotional scene on the witness's face when the story is felt through them: in the go-saap scene, the camera ends on Charu at the door, frightened and amazed, with wet, glistening eyes, softening into relief. *Ep 2, decided 2026-11-21*

- **CAM-14** Pacing: scenes give the audience time to feel. Besides the pauses between scenes, pauses go inside scenes at settled moments (after a reaction, a reveal or an emotional line), 1 to 2 s each, 2 or 3 per scene, filled with ambient sound and effects while the characters keep breathing, blinking and glancing (the story action waits; life continues). Episode 2 target length about 5 minutes (was 4:19). The per-scene pause table is approved by the director before coding. *Why:* the director: "most scenes move faster before user feel and emotionally attached" (2026-11-21). *Ep 2 on*

## 5. Story fidelity and sets (STO)

- **STO-01** Visuals follow the narration literally: what the narration says happens is what the viewer sees. *Ep 2*
- **STO-02** The Vedic house (বৈদিক বাড়ি) is always the existing `BaidikBariDay` set in `src/cinematic/sets/S01_DaySets.tsx`. *Why:* continuity. *Ep 1-3*
- **STO-03** The inner courtyard is always the existing `CourtyardBack` and `CourtyardFloor` in `src/cinematic/sets/Interiors.tsx`. *Why:* continuity. *Ep 1-3*
- **STO-04** A known location is never redrawn; reuse its established set. *Why:* continuity. *Ep 1-3*

Episode 2 applications of STO-01 (also the worked examples for future episodes):

- **STO-05** No guests reach the Shashthi puja because of the rain: the decorated Vedic house waits, and villagers turn back at the flooded path. *Ep 2*
- **STO-06** The family leaves the Vedic house for Ujanchar after the father's job news. *Ep 2*
- **STO-07** The fox breaks in through the far wall of the baby's room, far from the mother, and flees back out through its hole. *Ep 2*
- **STO-08** The rice pot falls ON the baby and covers him; the frightened parents pull and tip it, and he is seen smiling inside through the pot's mouth. *Ep 2*
- **STO-09** Ujanchar is surrounded by dense jungle. *Ep 2*
- **STO-18** CORRECTION 2026-11-22 (supersedes the location in STO-17 and narrows STO-10): Episode 3 happens at the VEDIC HOUSE, not Ujanchar. The book's chapter 5 opens "নিষ্ঠাবান্ ব্রাহ্মণ পণ্ডিতের বাড়ী। কর্তা ভগবতীঠাকুর…" and the flower-picking girls are "বাড়ীর অল্পবয়স্কা মেয়েরা" filling 8 to 10 baskets for a house where "প্রায় সবাই পূজো করে". Both Episode 3 scenes move to the Vedic house courtyard (CourtyardBack / CourtyardFloor, with the tulsi mancha and big jaba and jhumko trees). Rule: every episode's place, people and speakers come from the book (`book.xlsx` in the repo root), quoted in its plan; never assume a place from the previous episode. *Why:* the director asked to check the source; the Ujanchar setting had been my unchecked recommendation. *Ep 3 on*
- **STO-19** Approved 2026-11-22: the Episode 4 plan (`03_Episodes/Episode_04_Idols_and_Coconut_Water/01_Script_and_Storyboard/Ep04_Shots_and_Pauses_DRAFT.md`), following the book (chapters 6 and 7): all three stories at the Vedic house (the courtyard, a day version of its pond with the mandar tree, a new family shrine room); the coconut-water priest is Bhagabati Thakur (chapter 2: "পুরোহিত ঠাকুর অর্থাৎ বাড়ীর কর্ত্তা ভগবতী ঠাকুর মহাশয়"), captioned পুরোহিত ঠাকুর; scene 3's exchange (the call for dhoop, the asking, the drink) is wordless, told by action and sound; chapter breaks (fade to black, soft chime) between the separate stories; the Gobinda story is Charu's flashback told to the jyethi; Thakurma's "এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে" is said at home in the family talk after Harendra's remark; Balak rolls the clay Shiva into a ball ("হাতে পাকিয়ে গোল করে ফেলেছে"); defaults accepted: one gentle glow beat on Thakurma's prophecy with the soft divine motif, Village_Peace_Loop, birds and breeze at the pond, the Episode 5 glimpse of Balak with a calm cow, minor book events left out, CC recordings for the tap on brass, a drinking sound and pond water. *Ep 4*
- **STO-17a** CORRECTION 2026-11-22 (supersedes the scolding part of STO-17): in the source book the GIRLS who came to pick flowers gather round Balak and scold him together ("সবাই মিলে ওকে চেপে ধরে প্রশ্ন করল, 'তুই ঠাকুরের পূজার ফুল পায়ে দিচ্ছিস কেনরে?…'"), and they threaten to tell his mother, so Charu is NOT in this scene. The eldest girl speaks the line with lip sync while the others crowd round and nod; caption মেয়েরা; the existing recording (voiced "elder sisterly" with Charu's voice ID) is kept. Balak's reply "তোদের ভগবান…" is addressed to the girls. *Why:* the director checked the script; STO-17 had wrongly assumed the voice meant Charu speaks. Also confirmed by the book: Babukaka (বাবুকাকা) is Balak's father, Surendra. *Ep 3*
- **STO-17** Approved 2026-11-21: the Episode 3 shot list and pause plan (`03_Episodes/Episode_03_Five_Year_Old_Wisdom/01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md`; 12 pauses, about 2:16), with: ~~Charu speaks the scolding line~~ (superseded by STO-17a) Charu speaks the scolding line "তুই ঠাকুরের ফুল নিজের পায়ে দিচ্ছিস কেন রে?" on screen (the recorded voice is hers; caption চারুশীলা) while the girls only giggle; Episode 3 is set at the family's Ujanchar village house, reusing the village-house look of Episode 2's go-saap courtyard (one shared set), not new garden or courtyard sets; the main scene ends holding Balak's serene face as his glow brightens gently, with Divine_Motif under his last line and its pause. *Ep 3*
- **STO-16** Approved 2026-11-21: the Episode 2 shot list and pause plan in `03_Episodes/Episode_02_Shashthi_and_GoShaap/01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md` (25 pauses, 38 s, plus an 11 s journey; about 5:08), with: the departure on a grey rainy day (the journey moves from rain to golden afternoon to dusk at Ujanchar) along a riverside track with country boats (no ferry); the camera follows the narration strictly (fox: straight cuts instead of whip-pans, Charu hurrying as the line says she ran; go-saap: no low "tension" angle or hiss jolt the narration does not describe); the episode opens on a held wide of the Vedic house exterior on "মেদিনীমণ্ডলের বিরাট বৈদিক বাড়ি।" before cutting inside; the news pause 3 s; the outro stays as the series template (no added pauses); background sound capped at 0.25 during pauses. *Ep 2*
- **STO-15** The move from the job news to Ujanchar is told at TV pace, not rushed: a held moment for the family's reaction to the news, a farewell at the Vedic house (elders' blessing, a last look back), and a music-led journey montage without narration (bullock cart through paddy fields, time passing, Balak gazing at the sky in Charu's lap) before Ujanchar appears, with a music cue and effects (cart wheels, the bullock's bell, birds). *Why:* the director: "from receiving the new job letter to moving to Ujanchar is too fast... for a real TV episode feel" (2026-11-21). Shot list approved before coding. *Ep 2*
- **STO-14** Episode 2 has an interior scene after the outside rain and before the father's letter (`01d2_shashthi_hands_miracle`): the Shashthi arrangements wait unused for the Brahmins who cannot come, and inside the room by a window the newborn's tiny hand movements control the downpour (faster hands, heavier rain; still hands, lighter rain) while Thakurma and Surendra watch in awe. Voices: 01d2a narrator, 01d2b Thakurma, 01d2c Surendra. *Ep 2, decided 2026-11-21*
- **STO-13** News is shown arriving, not just read: in Episode 2 an early-1900s peon (dak-peon or office messenger, with umbrella and satchel) comes to the Vedic house in the rain, bows, and hands the job letter to the father, who opens it with joy. *Ep 2, decided 2026-11-21*
- **STO-10** In Ujanchar the family lives in a typical small village house (mud walls, thatched roof, a low raised veranda), not the Vedic house; reuse that house for every later Ujanchar scene. *Why:* the story moves them from the big ancestral house to a modest home. *Ep 2, decided 2026-11-21*
- **STO-11** The go-saap scene is in the corner of that house's courtyard (উঠোন), under the lemon tree, with the jungle beyond a bamboo fence; not a riverside or beach. Balak crawls out from the veranda to the lemon tree. *Ep 2, decided 2026-11-21*
- **STO-12** While Balak plays with the go-saaps, Charu watches silently from far away in the background, frightened and amazed (hand over her mouth, holding still), and the camera racks focus to her briefly. *Why:* the viewer feels the danger through the mother while the child stays fearless. *Ep 2, decided 2026-11-21*

## 6. Animals (ANI)

- **ANI-01** Animals are realistic and readable. *Ep 1-3*
- **ANI-02** Bagha is a strong tan village dog with no stripes. *Ep 1-3*
- **ANI-03** The fox's dark lower legs get a warm rim light so they read against a dark wall. *Ep 2*
- **ANI-04** The cow is a Bengal zebu (humped). *Ep 1-3*
- **ANI-05** The go-saap is a big Bengal monitor lizard with frequent tongue flicks. *Ep 2*
- **ANI-06** The go-saap is frightening to the viewer while the baby plays with it fearlessly. *Ep 2*

## 7. Titles, captions and cards (TTL)

- **TTL-01** All on-screen text uses Baloo Da 2 (`BN_FONT`, `src/cinematic/fonts.ts`). *Ep 1-3*
- **TTL-02** The intro uses the Episode 1 layout: eyebrow, title, gold pill with the episode label, and the episode name animated word by word. *Ep 1*
- **TTL-03** The intro title page shows no narration captions. *Ep 1-3*
- **TTL-04** The intro is kept as it is; do not redesign it. *Ep 1-3*
- **TTL-05** A source card follows right after the title: a centred book-page card with graceful motion. *Ep 1-3*
- **TTL-06** On the source card, the book name is on its own line, the memoir credit on its own line, and the English lines below. *Ep 1-3*
- **TTL-07** Subtitles use the Episode 1 style: a soft dark gradient band, cream text about 44 px with a soft shadow, and a short slide-up. *Ep 1*
- **TTL-08** The narrator gets no speaker chip; a gold chip appears only for named characters. *Ep 1-3*
- **TTL-09** The outro is the sunset with the series title and narration captions. *Ep 1*
- ~~**TTL-10** The outro has a centred framed preview window (about 620 x 350, thin gold border) showing a calm, divine moment from the next episode, with a readable label beneath. *Ep 1*~~ Superseded by TTL-10a on 2026-11-21.
- **TTL-10a** The outro shows the next episode as a soft glimpse, never inside a box: a calm, divine moment from the next episode in a feathered, dreamlike vignette that melts into the outro background, fading in and out gracefully, with the episode label in elegant glowing type (no dark backing). *Why:* the director asked to remove the box. *Ep 2, decided 2026-11-21*
- **TTL-11** Every episode's outro previews the next episode, as Episode 1's outro showed a glimpse of Episode 2. *Ep 1*
- **TTL-12** There is no empty end hold after the outro. *Ep 1-3*
- **TTL-13** No place-name title board appears over a scene when the narration already says the name. *Ep 1-3*

## 8. Audio feel (AUD)

Loudness targets and sourcing method are in `docs/PIPELINE_DECISIONS.md` (PAU, SFX).

- **AUD-01** The narration stays clear over every sound effect and loop. *Ep 1-3*
- **AUD-02** Sound-effect volume is 0.15 to 0.45. *Why:* keeps the narration clear. *Ep 1-3*
- **AUD-03** Looping sounds are at volume 0.25 or below. *Why:* keeps the narration clear. *Ep 1-3*
- **AUD-04** Animal voices and the baby's cry use real recordings in preference to generated sounds. *Ep 1-3*
- **AUD-05** Pacing: scenes must not move on with the voice before the audience can feel them. After each scene's narration, hold the scene for a breath of about 1 to 2.5 seconds (longest on scenic and emotional moments) before the next scene; split a narration clip at the silence between sentences when it spans a scene boundary. *Why:* the director found the scenes too fast. *Ep 2, decided 2026-11-21*
- **AUD-06** During those breaths the scene keeps living (idle motion, a slow camera drift, the divine glow pulsing) and its sound rises: the ambient bed and music duck under the narration and come up in the pauses, with sound effects that fit the scene. *Ep 2, decided 2026-11-21*

---

## Known conflicts with older bible files (this file wins)

Found on 2026-11-21. The older files were not edited; fix them when the director asks.

1. `characters.json` `toddler_thakur` describes a "4-year-old" in a "simple white cotton dhoti", and `production_rules.md` section 2 says "plain white dhoti" for ages 3 to 5. Episode 3 Balak is about five, in a white or cream dhoti with an uttariya (BAL-16, BAL-17).
2. `characters.json` `young_balak_thakur` ("shoulder-length dark wavy hair") and `adolescent_balak_thakur` ("flowing dark hair") conflict with curly dark hair (BAL-04). Confirm with the director before those ages are designed.
3. `characters.json` `pagol_mystic` has a "soft white rain glow", which conflicts with divine light on Balak only (BAL-05). `production_rules.md` section 3 already agrees with BAL-05.
4. `characters.json` `baby_thakur` ("glowing aura around him") and `visual_style_guide.md` section 5.4 ("volumetric halo around baby_thakur, floating golden dust motes") describe a fuller aura than the restrained halo behind the head with a few motes (BAL-06, BAL-10).
5. `divine_visual_language.md` (currently only in the ep01run worktree) allows "slow rotating rays" at Level 2 and "full radiance" and bloom at Level 3, which conflicts with no bursting rays or hard rings and gentle brightening (BAL-07, BAL-11). Its Level 0 ("no aura" for most screen time) also differs from the restrained halo and rim light described in BAL-06 to BAL-09. Confirm with the director how the planned Level 3 moments should look under these rules.
6. `visual_style_guide.md` section 3 caps the push-in at 1.00 to 1.12; face close-ups on key lines go to about 1.3 to 1.5 (CAM-06).
7. `visual_style_guide.md` section 3 `dramatic_freeze_hold` (decelerate into complete stillness) is allowed only where a line calls for it; otherwise no frozen pose beyond about 20 frames (MOT-13).
8. `visual_style_guide.md` section 4.2 gives everyone a 3.0 to 4.5 s blink with a 120 ms close-open; Balak blinks more slowly (BAL-14).
9. `visual_style_guide.md` section 4.3 sets cloth lag at 1 to 2 frames; the infant langot trails the hips by a few frames (BAL-20).
10. Gap, not a contradiction: `characters.json` `charu` has no sindoor and no alta (CHR-02, CHR-03).
11. Clarification: `production_rules.md` section 2 gives the newborn a plain white wrap. That still stands for the newborn; the langot (BAL-19, BAL-20) applies to infant Balak.
