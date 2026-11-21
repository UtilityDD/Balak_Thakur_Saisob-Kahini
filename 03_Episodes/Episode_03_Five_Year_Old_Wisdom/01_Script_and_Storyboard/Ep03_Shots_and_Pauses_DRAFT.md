# Episode 3: Shot List and Pause Table (DRAFT for the director)

Status: **APPROVED by the director on 2026-11-21** (decision STO-17). Answers: 1. Pauses: 2 or 3 per beat in scene 02 (12 pauses, 16.5 s; about 2:16). 2. Charu speaks the scolding line on screen (caption চারুশীলা) and the girls only giggle. 3. The episode is set at the Ujanchar village house: reuse the village-house look of Episode 2's go-saap courtyard instead of the new garden and ochre courtyard sets. 4. The ending holds on Balak's serene face as his glow brightens gently, with Divine_Motif under his last line and its pause. Defaults (director did not object): glow beats only on the pranam and the last line; the scene 01 women join the courtyard wide on "সবাই দেখে"; women with loose damp hair after the bath; day birds in the courtyard; source CC giggle and water-pour recordings; length about 2:16.

(Original draft note, written 2026-11-21 under CAM-13 (camera grammar) and CAM-14
(pauses inside scenes), on the model of the approved Episode 2 plan (STO-16,
`03_Episodes/Episode_02_Shashthi_and_GoShaap/01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md`).
The director's Episode 2 answers carry over as standing preferences: the camera follows the narration strictly and
invents no tension; establishing lines get held wides; the outro and the next-episode glimpse stay as the series
template with **no pauses**; background sound is capped at 0.25 in pauses. The intro and the source card stay as
they are. No code has been changed and nothing has been rendered.

## How to read this

- **Shot list:** one row per narration line or speech. `f` is the line's start in the scene's own frames (24 fps)
  from today's `subtitles.ts`. Those starts are *estimates* (each clip's text spread by character count), and in
  several places the real voice starts later; where the gap is more than about 8 frames the real start, measured
  from the clip's silences, is given as *voice ≈ f*. Once pauses are added every frame moves, so the code must tie
  every camera key to the narration cue, not to a frame number (CAM-13).
- **Camera words:** *hold* = camera still (characters keep breathing and blinking). *cut* = hard cut. *push in* /
  *pull back* = slow eased zoom. *pan* = slow sideways turn. *rack focus* = only the focus changes (not counted as a
  move).
- **Rules used:** one move at most per sentence; about 2 s of hold between moves; a cut or push when the line names a
  new subject; a close-up 6 to 8 frames *before* a speaker's line; a slow push in on an emotional peak; a held wide
  on an establishing view; no drift and no handheld without a reason (CAM-03: handheld only in tense moments, and
  Episode 3 has none).
- **Pauses:** inserted where the voice is already silent (end of a sentence or a clip). The story waits, life goes
  on: breathing (MOT-20), slow blinks for Balak (BAL-14), glances, breeze, the diya flame. Never in the middle of an
  action (the pour, a flower being carried, the bow). *open* = just before a scene's first line; *end* = after its
  last line, added to the hold already there.
- **Balak (five years old):** serene, half-lidded bright eyes, faint smile (BAL-12, BAL-13, BAL-22); his glow stays
  on and steady and **brightens gently only on two key beats**: the pranam to himself and his last line (BAL-11).
- **Sound volumes:** one-shots 0.15 to 0.45, loops 0.25 or below (AUD-02, AUD-03), and no bed above 0.25 in a pause.
  Paths are under `public/audio/`.

## Sounds available

**Episode 3 has no sound beds, music or effects today.** `Episode03.tsx` plays only the voices, and there is no
`sfx/ep03/` folder. Without beds the pauses would be silent, so the plan below needs the beds first (see "Sound beds
this plan needs").

- `sfx/ep02/` (reusable): birds_village (loop, 6 s), wind_soft (loop), cloth_rustle, footsteps_floor (loop),
  water_splash, clay_thud and the rest of the Episode 2 set. Credits: `public/audio/sfx/ep02/README.md`.
- `sfx/`: river_water (4 s), soft_magical_shimmer (2.5 s), temple_bell_drop (2.2 s), chime_pop, padma_river_day.
- `ambient/`: dawn_birds_temple (15 s loop), padma_river_day, bengal_night_crickets, monsoon_rain_courtyard.
- `music/`: Village_Peace_Loop, Warm_Family_Flute, Divine_Motif, Sacred_Night_Ambient, Theme_Intro_Bansuri,
  Festival_Folk_Loop.
- **Missing:** no recording of water poured from a kolsi and no girls' giggle. Both could be sourced as CC
  recordings with the `sfx-from-commons` skill (*director to decide*); the plan does not depend on them.

### Sound beds this plan needs (taken from the manifest, adjusted)

| Scene | Bed | Under the voice | In a pause | Note |
|---|---|---|---|---|
| 01 dawn garden | `ambient/dawn_birds_temple` loop | 0.10 | 0.22 | As in the manifest |
| 01 | `sfx/ep02/wind_soft` loop | 0.10 | 0.15 | River breeze in the kaash |
| 01 | `music/Village_Peace_Loop` | 0.08 | 0.15 | As in the manifest |
| 02 tulsi courtyard | `sfx/ep02/birds_village` loop | 0.10 | 0.20 | Day birds; the manifest's `dawn_birds_temple` is dawn and temple sound in late-morning light (concept question 7) |
| 02 | `music/Warm_Family_Flute` | 0.08 | 0.14 | As in the manifest |

The beds duck under every voice and rise in the pauses, as Episode 2's `ducked()` does, with the open level capped
at 0.25 (Episode 2's `AMBIENT_OPEN = 0.25`). The sounds listed with each pause are added on top.

---

## Scene 01: 01_sharad_flower_gathering (the autumn dawn garden), 15.7 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "শরতের মিষ্টি ভোর।" | Wide: the garden by the terracotta arches, the river and kaash beyond, sunrise haze, the four women small at the flower bushes | Hold (the picture fades in over the source card) | Establishing view: a held wide |
| 2 | 51 (voice ≈ 71) | "শিউলি ফুলের গন্ধে আকাশ-বাতাস ভরে উঠেছে।" | From the wide toward a medium wide on Tuni, who crouches and picks a fallen shiuli from the grass; petals drift across the foreground | One slow push in (1.00 to about 1.10), starting on "শিউলি", landing as she lifts the sprig to look (today about 170); hold | The line names the shiuli and its scent: one push, and Tuni's flower makes the scent visible |
| 3 | 168 (voice ≈ 204) | "বাড়ির মেয়েরা ভোরবেলা স্নান সেরে" | Medium wide: the row of women at the bushes (Sarala, Mina, Tuni, Rekha) | Cut on "বাড়ির মেয়েরা"; hold | The line names the women |
| 4 | 266 | "জবা আর ঝুমকো ফুলের সাজি ভরছে।" | Medium close: Mina's and Rekha's hands dropping red jaba and orange jhumko into their sajhi baskets | One slow push in, starting on "জবা"; hold into the end | The line names the flowers and the baskets |

Note (STO-01): "স্নান সেরে" says the women have just bathed. Today they have neat parted hair; loose, damp hair (or a
gamchha over a shoulder) would show it. *Director to decide.*

**What the current camera does wrong:** its shot changes are fixed at frames 90, 220 and 300, which do not match the
lines (51, 168, 266; the voice even later). The establishing line plays over a dolly in (0 to 60) instead of a held
wide. Line 2 then gets four moves: the end of the dolly, a pull out (72 to 90), a push in (90 to 120) and a slow
glide of the frame (114 to 202). A pull out (202 to 220) lands in the middle of line 3, the pan (220 to 300)
straddles lines 3 and 4, the push to the hands (300 to 330) starts 34 frames into line 4, and the last 18 frames
pull out again with no reason. Handheld shake (0.8) runs through both close shots of a calm dawn (CAM-03), and focus
racks in and out three times. About nine moves in 15.7 s, all on hard-coded frames that will fall out of sync once
pauses go in. The cross-dissolve into scene 02 is 18 frames; CAM-09 asks for about 36 to 48.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…শরতের মিষ্টি ভোর।" | 1.5 s | Held wide: kaash plumes bend in the river breeze, a few shiuli flowers fall from the two trees, the water glints; the women go on picking, small and unhurried | `ambient/dawn_birds_temple` rises to 0.22; `sfx/river_water` 0.18 (one-shot, 4 s) |
| P2 | "…আকাশ-বাতাস ভরে উঠেছে।" | 1.0 s (the voice already has 1.4 s of silence here, so about 2.4 s in all) | The push has landed: Tuni holds the shiuli sprig up to her nose and smiles; Sarala glances across at her | `sfx/ep02/wind_soft` 0.15, birds as above |
| P3 | *end*, after "…সাজি ভরছে।" (added to the 1 s hold already there) | 1.5 s | Close on the brimming baskets; Mina and Rekha share a smile, petals still drifting; then the cross-dissolve into the tulsi courtyard | `music/Village_Peace_Loop` rises to 0.15, birds 0.20 |

**Scene total: 4.0 s**

---

## Scene 02: 02_flowers_on_own_feet (the tulsi courtyard), 41.8 s

This one scene holds three beats with three voice clips: **02A** the narrator (Balak waters the tulsi and lays the
flowers on his own feet), **02B** the scolding, **02C** Balak's answer. The code already treats them as three parts.
At 42 s it is as long as three Episode 2 scenes, so the plan gives each beat its own 2 or 3 pauses (CAM-14 counted
per beat). *Director to decide; the stricter version with only 3 pauses for the whole scene is in the totals.*

**Who speaks in 02B?** The voice was recorded as Charu (voice script speaker `05_Charu`, and the director's decision
in the concept plan puts Charu in this scene), but the file is called `02b_Girls_Tease`, so the caption chip says
"মেয়েরা". Today Charu **and** both girls move their lips to the one voice. This plan assumes **Charu speaks and the
girls only giggle**, with the chip changed to "চারুশীলা". *Director to decide.*

### Shot list

**02A: the flowers on his own feet (narrator)**

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "হঠাৎ সবাই দেখে পাঁচ বছরের ছোট্ট বীরু" | Wide: the courtyard, the tulsi-tala, Balak seated cross-legged at its foot with the kolsi and the dala basket beside him, the women at the right with their full sajhis; on "সবাই দেখে" their heads turn to him | Hold (no creep) | Establishing view, and "everyone sees": the watchers and Balak in one held frame |
| 2 | 88 (voice ≈ 112) | "তুলসীতলায় জল ঢেলে ঝরাপাতা আর ডালা" | Medium: Balak at the tulsi-tala, pouring from the kolsi, then reaching down for the fallen leaf | Cut on "তুলসীতলায়"; hold | The line names the tulsi-tala |
| 3 | 172 | "থেকে ফুল তুলে নিজের পায়ে দিচ্ছে," | From the medium to a medium close of his hands, the basket and his feet | One slow push in (about 1.3x the medium, not today's 2.6x), starting on "নিজের পায়ে"; hold through the flowers | The line's subject is the flowers on his own feet. Frame it so the feet and flowers sit **above y = 820** (CAM-07) |
| 4 | 253 (voice ≈ 277) | "আর নিজেই নিজেকে প্রণাম করছে!" | Medium close-up: Balak's face and joined palms as he bows | Cut on "আর নিজেই"; hold. His glow brightens gently on the bow (key beat 1) | A new action and the beat of wonder: a clean frame for it, no move during the bow |

**02B: the scolding (Charu, the girls giggling)**

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 5 | 333 (voice ≈ 339) | Charu: "ওমা, একি কাণ্ড!" | Medium close-up: Charu, just arrived, hand to her mouth | Cut 6 to 8 f before her voice; hold | Speaker close-up, early |
| 6 | 372 (voice ≈ 382) | Charu: "তুই ঠাকুরের ফুল নিজের পায়ে দিচ্ছিস কেন রে?" | Two-shot: Charu standing at the left, Balak seated by the tulsi at the right, the three hibiscus on his feet clearly in view (above y = 820) | Cut on "তুই"; hold. Balak glances down at the flowers on "নিজের পায়ে" and back up at her | She speaks *to him* about the flowers: both and the flowers in one frame |
| 7 | 492 (voice ≈ 503) | Charu: "দেখিস তোর পাপ হবে," | Medium wide group: Charu leaning in, the two girls behind her giggling behind their hands | Cut on "দেখিস"; hold | The warning is half a tease: the speaker and the teasers together |
| 8 | 542 | Charu: "ভগবান শাপ দেবেন!" | Same group | Hold | Same sentence, no second move |

**02C: Balak's answer**

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 9 | 597 | Balak: "তোদের ভগবান তোদের শাপ দেবে!" | Medium close-up: Balak, an open palm toward the girls (his palmRaise already starts at 589) | Cut 6 to 8 f before his line; hold, sharp from the first frame | Speaker close-up, early |
| 10 | 656 (voice ≈ 677) | Balak: "আমার পায়ে ফুল দিলে তো আমি বেশ টের পাই।" | Same close-up; his eyes go down to his feet on "আমার পায়ে", then his palms come to his chest on "টের পাই" | Hold | Same speaker; his glance and hands carry the line |
| 11 | 740 (voice ≈ 748) | Balak: "তোমাদের মাটির মূর্তি তো নড়েও না, কিছু বোঝেও না!" | Reverse: Charu and the girls facing him, listening, their smiles slowly fading; Balak's shoulder soft in the foreground | Cut on "তোমাদের"; hold | "Your" idols: the line turns to the listeners. No idol is drawn (concept plan), so the picture shows the people it is said to |
| 12 | 842 (voice ≈ 858) | Balak: "আমি ভগবান হলে কিন্তু ফুল কেন," | Medium close-up: Balak again, hands at his chest, gaze lifting for a moment | Cut 6 to 8 f before "আমি"; hold | Back to the speaker for his key thought |
| 13 | 905 (voice ≈ 892) | Balak: "গাছ কেটে নিলেও কাউকে রাগ করতাম না!" | Close-up on his face (about 1.3 to 1.4, CAM-06); his palms join with a small bow of the head at the end | One slow push in, starting on "গাছ কেটে", held through the line and into the end pause; his glow brightens gently (key beat 2) | The emotional peak and the teaching: the one push of the answer |

Thirteen shots; the longest hold is about 6.6 s (shots 9 and 10) and the shortest about 2 s (shot 12).

**What the current camera does wrong:**

- **The frame never rests.** Every shot has its own zoom creep (wide 1.00 to 1.07, medium 1.70 to 1.95, flower close
  2.6 to 2.3, bow 1.9 to 2.0, over-shoulder 1.6 to 1.8, girls 1.4 to 1.6, the answer 1.8 to 2.0 over 17 s), and four
  push-in-and-pull-back pairs sit on top (at 88, 196, 253 and 656). Line 2 gets a glide, a creep, a push and a pull
  back; line 3 gets a glide, a creep out, a push and a pull back; line 4 gets a glide, a push, a pull back and a
  creep. The "soft cuts" are 24-frame zoom glides (1.07 to 1.70 in one second), which read as a rushed zoom, not a
  cut.
- **Handheld shake** (0.4 to 0.8) on every shot after the wide, in a calm, gentle scene (CAM-03).
- **The scolding is shot from behind a black silhouette.** From 333 to 492 Charu is replaced by a dark over-shoulder
  shape, so the speaker's face, her hand to her mouth and her words are never seen. The cut lands on the first
  syllable of "ওমা" instead of 6 to 8 frames before.
- **Focus on the wrong plane.** In that same shot the rack focus turns to the "group" and blurs Balak, but the girls
  (x 1450 to 1620) are at or past the right edge of the frame (it shows about x 200 to 1400) and Charu is the
  silhouette: for about 6 s the only figure clearly in view is out of focus (by reading the code; confirm on a still). On his first line (597 to 617) the focus is still racking back, so he starts
  blurred.
- **The listeners vanish for the whole answer.** 17 s on one creeping medium of Balak while his eyes go back and
  forth to Charu and the girls, who are never seen reacting.
- **The key line gets nothing.** The only push in the answer is on "আমার পায়ে ফুল দিলে" (656 to 740); "গাছ কেটে নিলেও
  কাউকে রাগ করতাম না!" plays on the slow creep.
- **The glow never marks a beat.** It ramps up over the first 30 frames and stays flat; a `level` value for a
  brightening at 650 is computed and not used. Neither the pranam nor the last line lifts it (BAL-11).
- **Timing is on estimates.** All beats (camera, poses, lips) are hard-coded frames taken from the character-share
  caption estimates, which run up to about 1 s early: the pour plays before "তুলসীতলায় জল ঢেলে" is heard, and Balak's
  mouth keeps moving through the 1 s of silence after "তোদের ভগবান তোদের শাপ দেবে!" (about 652 to 677). *Check by
  ear*; the fix is to place the lines from the clip silences.
- **Three mouths, one voice:** Charu and both girls lip-sync the whole of 02b at once.

### Pauses

**02A**

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | *open*, before "হঠাৎ সবাই দেখে…" (after the dissolve has finished) | 1.0 s | Held wide: Balak seated quietly at the foot of the tulsi-tala, breathing, a slow blink; the diya flame; the women at the right chat over their full sajhis, not yet looking | `sfx/ep02/birds_village` rises to 0.20; `music/Warm_Family_Flute` 0.14 |
| P2 | "…নিজের পায়ে দিচ্ছে," | 1.0 s | Medium close holds after the **third** hibiscus is laid (today it lands at 272) and his hand is back on his knee: he looks down at the three red flowers on his feet with a serene, faint smile | Birds 0.18; `sfx/ep02/cloth_rustle` 0.15 as his hand settles |
| P3 | "…নিজেই নিজেকে প্রণাম করছে!" | 2.0 s | Medium close-up holds: his head rises from the bow, palms still joined, eyes soft and half-lidded; his glow brightens gently (key beat 1). In the last second, off screen, Charu's steps approach | `sfx/soft_magical_shimmer` 0.15 as the glow lifts (the manifest's sound for this scene); `sfx/ep02/footsteps_floor` loop 0.15 in the last second, leading into "ওমা" |

**02B**

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | Charu: "ওমা, একি কাণ্ড!" | 1.0 s | Charu's close-up holds: hand still at her mouth, eyes wide, then the hand comes down; behind her the girls turn their heads one after the other | Birds 0.18; `sfx/ep02/cloth_rustle` 0.15 as her hand drops |
| P2 | Charu: "…নিজের পায়ে দিচ্ছিস কেন রে?" | 1.5 s | Two-shot holds: Balak looks down at the hibiscus on his feet, then back up at her, unbothered, faint smile; Charu waits, palm open, brows knit (today's glance at 410 to 460 already does this) | Birds 0.20; `sfx/ep02/wind_soft` 0.12 (the tulsi leaves stir) |
| P3 | Charu: "…ভগবান শাপ দেবেন!" | 1.5 s | Group shot holds: the girls giggle behind their hands, Charu waits for his answer with a half-scolding look; then the cut to Balak 6 to 8 f before his line | Birds 0.20; `sfx/ep02/cloth_rustle` 0.15 (no giggle recording exists; see the decisions) |

**02C**

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | Balak: "…আমি বেশ টের পাই।" | 1.0 s | Close-up holds: his palms at his chest, he looks across at Charu with a soft, compassionate look; a slow blink | Birds 0.18 |
| P2 | Balak: "…কিছু বোঝেও না!" | 1.5 s | The reverse holds: the girls' giggles fade, they glance at each other, unsure; Charu's brow softens; Balak soft in the foreground with a gently amused smile | Birds 0.20; `sfx/ep02/wind_soft` 0.12 |
| P3 | *end*, after "…কাউকে রাগ করতাম না!" (added to the 1 s hold already there) | 2.0 s | The push has landed on his face: palms joined, a small bow of the head, then he looks up, serene; his glow brightens gently (key beat 2). *Option (CAM-12):* cut for the last second to Charu, hand to her chest, eyes wet with wonder. Then today's fade into the outro | `music/Divine_Motif` 0.18, fading in on "গাছ কেটে" and rising in the pause (*director to approve*: it is kept for sacred moments); otherwise `sfx/soft_magical_shimmer` 0.15. Birds 0.15 |

**Scene total: 12.5 s** (02A 4.0 s, 02B 4.0 s, 02C 4.5 s)

---

## Scene 99 and 98: closing sunset and the Episode 4 glimpse

Left as the series template: no pauses and no camera changes (director's Episode 2 answer). Noted only: the
Episode 4 name on the glimpse card ("মূর্তি ও নারিকেল জল") differs from the outro narration ("শিবলিঙ্গ-গোবিন্দ ও
নারিকেলোদক"), as `src/episode03/README.md` already records.

---

## Totals

| Scene | Pauses | Added |
|---|---|---|
| 01 dawn garden | 3 | 4.0 s |
| 02A the flowers on his feet | 3 | 4.0 s |
| 02B the scolding | 3 | 4.0 s |
| 02C Balak's answer | 3 | 4.5 s |
| 99 / 98 outro and glimpse | none (template) | 0 |
| **Total** | **12** | **16.5 s (396 f)** |

**Episode length:** today 2,863 frames (**1:59.3**); planned 3,259 frames (**about 2:15.8**), +13.8 %.
Scene 01 grows from 377 to 473 frames, scene 02 from 1,003 to 1,303.

**Stricter version** (scene 02 counted as one scene, 3 pauses: 02A P3, 02B P2, 02C P3): 6 pauses, 9.5 s (228 f),
3,091 frames, **about 2:08.8** (+8 %, below the 12 to 15 % target).

To shorten the full plan a little: drop 02A P1 (scene 01's end pause already holds before the dissolve, -1.0 s) and
trim 02B P3 to 1.0 s (-0.5 s): 15.0 s, about 2:14.3 (+12.6 %).

---

## Notes for whoever codes this (after approval)

- **The generator needs the pause mechanism.** `scripts/build_ep03_timing.js` has none: it places each clip at its
  SRT time with a 1 s tail and makes one visual scene per manifest scene. Port from `build_ep02_timing.js`: the
  `PAUSES` table (`scene`, `after` snippet, `sec`, `at: "open" | "end"`, optional `clip` + `silence` override),
  splitting clips at measured silences with ffmpeg silencedetect into `NAME_p1..pN.wav` (originals never written),
  `PAUSE_TOL`, shifting everything after each hold point, re-spreading a cue's caption phrases between the real cut
  points, and the exports `EP03_PAUSES` (`sceneId, atStory, frames, startFrame`) and `EP03_CLIP_PARTS`.
- **Where the clips split** (silences in each clip's own seconds, measured with ffmpeg at -35 dB):
  - `01a_Narrator_Dawn`: 2.07-2.72 (01 P1), 7.04-8.48 (01 P2; keep most of the existing silence)
  - `02a_Narrator_Tulsi`: 11.06-11.55 (02A P2). The caption estimate puts the phrase end at 10.54 s, 0.52 s away,
    just outside `PAUSE_TOL`: use the `clip` + `silence` override.
  - `02b_Girls_Tease`: 1.49-2.06 (02B P1), 6.65-7.07 (02B P2)
  - `02c_Toddler_Thakur`: 5.62-6.30 (02C P1), 9.92-10.89 (02C P2)
  - No split needed: 02A P3 and 02B P3 sit between two voice files; the *open* and *end* pauses move a clip or
    lengthen a hold.
- **Captions are early.** The phrase times inside each clip are character-share estimates; in `02c` the second
  sentence is shown about 0.9 s before it is spoken, and in `01a` "বাড়ির মেয়েরা…" about 1.5 s early (it appears in
  the silence). Re-spreading phrases between measured silences (as the Episode 2 generator does at cut points)
  would fix most of it.
- **Story clock.** Scenes 01 and 02 animate on hard-coded local frames (`BEAT`, `BALAK_BEATS`, `BIRU_LINES`,
  `charuKeys`, the cousins' keys, `SHOTS`, `PUSHES`; scene 01's acting and `camAt`). Move them to the story clock
  (`useStory(sceneId).f` from `src/episode/storyClock.ts`) and pass the real local frame to the rigs for breathing
  and blinks, as Episode 2's scenes do. Camera keys come from the cue data.
- **The 02A open pause and the dissolve.** `Episode03.tsx` remaps scene 02's first 18 frames (`Scene02Dissolving`),
  so the open pause must hold the story only after that dissolve has finished. If the dissolve is lengthened to
  36 to 48 frames (CAM-09), adjust both.
- **Speaker chip.** `speakerFor()` maps "Girls" to "মেয়েরা"; change it if the director confirms Charu speaks 02B,
  and give only the speaker a moving mouth.
- **Beds and pause sounds.** Add `SCENE_BEDS`, the ducking (`ducked()`, open level 0.25) and a pause cue list
  anchored to each pause, modelled on `Episode02.tsx`.
- **Protected fixes to keep** (from the scene code): the scene's own basket drawn around the rig's pick point
  (`BASKET_AT`), the carry arc and `PLACE_WARP` of the flower placements, the leaf and kolsi hand-offs
  (`PickLeaf`, `kolsiRestOp`), `footFlowers` so the laid flowers stay, no letterbox (removed after QA), the
  source-card-to-scene-01 overlap with no black frame, and the outro carrying the glimpse (TTL-10a).

---

## For the director to decide

1. **Pauses in scene 02:** 2 or 3 per beat (9 pauses, 12.5 s; episode about 2:15.8), or 3 for the whole scene
   (about 2:08.8)?
2. **Who scolds in 02B:** Charu speaks and the girls only giggle (the voice is Charu's; caption chip "চারুশীলা"), or
   the girls speak?
3. **The ending:** end on Balak's serene face, or cut for the last second to Charu's moved face (CAM-12)?
4. **Divine_Motif** under the last line and its pause (a sacred moment), or only the soft shimmer?
5. **Glow beats:** brighten gently on the pranam (02A P3) and on the last line (02C P3) only?
6. **"সবাই দেখে":** bring the scene 01 women into the courtyard wide so "everyone" is seen, or keep the two girls?
7. **"স্নান সেরে":** show the women with loose, damp hair (or a gamchha) in scene 01?
8. **Sound beds:** approve the bed plan, with day birds (`birds_village`) in the courtyard instead of the manifest's
   `dawn_birds_temple`?
9. **Missing recordings:** source a CC giggle and a water-pour recording, or leave the giggles silent and use
   `water_splash` softly for the pour?
10. **Continuity of the house:** scene 01's terracotta-arched garden and scene 02's ochre-walled courtyard are new
    sets. STO-03 says the inner courtyard is always `CourtyardBack` / `CourtyardFloor`, and STO-10 says later
    Ujanchar scenes reuse the village house. Which house is Episode 3 in? (This plan does not change sets.)
11. **Length:** about 2:15.8, or trim to about 2:14.3 (see Totals)?
