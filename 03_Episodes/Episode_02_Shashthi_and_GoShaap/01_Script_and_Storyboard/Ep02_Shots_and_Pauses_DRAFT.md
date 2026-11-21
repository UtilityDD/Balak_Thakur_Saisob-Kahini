# Episode 2: Shot List and Pause Table (DRAFT for the director)

Status: **APPROVED by the director on 2026-11-21** (decision STO-16), with these answers to the questions at the end:
1. Scene 01 opens on a held wide of the Vedic house exterior on the first line, then cuts inside. 2. The departure
moves to a grey rainy day. 3. The news pause stays 3 s. 4. Journey J5 is the riverside track (no ferry). 5. Fox:
straight cuts instead of whip-pans; Charu hurries ("মা ছুটে এসে"). 6. Go-saap: drop the low tension angle and the
hiss jolt. 7. Outro: leave the template untouched, NO outro pauses (so 23 pauses, 36 s; about 5:06). 8. Length:
about 5:06 accepted. 9. Ambient beds capped at 0.25 in pauses.
Written 2026-11-21 under CAM-13 (camera grammar) and CAM-14 (pauses inside scenes). The intro and the source card
stay as they are.

## How to read this

- **Shot list:** one row per narration line. `f` is the line's start in the scene's own frames (24 fps, today's
  timing). Once pauses are added the frames move, so the code must tie every camera key to the narration cue, not
  to a frame number (CAM-13).
- **Camera words:** *hold* = camera still (characters keep breathing and blinking). *cut* = hard cut. *push in* /
  *pull back* = slow eased zoom. *pan* = slow sideways turn. *follow* = camera moves with a moving subject.
  *rack focus* = only the focus changes, the camera stays still (not counted as a move).
- **Rules used:** one move at most per line; about 2 s of hold between moves; a cut or push when the line names a
  new subject; a close-up 6 to 8 frames *before* a speaker's line; a slow push in on an emotional peak; a held wide
  on an establishing view; no drift without a reason.
- **Pauses:** inserted at the end of a sentence while the narrator is silent. The story waits, but life goes on:
  breathing, blinking, glances, wind, lamps. Never in the middle of an action (walking, the fight, the falling pot).
  A few one-sentence scenes have no sentence break inside, so their pauses sit just before the first line (*open*)
  or just after the last one (*end*, added to the hold that is already there).
- **Sound volumes:** one-shots 0.15 to 0.45, loops 0.25 or below (AUD-02, AUD-03). File paths are under
  `public/audio/` (`sfx/ep02/...`, `sfx/...`, `ambient/...`, `music/...`).

## Sounds available

- `sfx/ep02/`: baby_soft_cry (real), birds_village (loop), bullock_bells (loop), cart_wheel_creak (loop), clay_thud,
  cloth_rustle, cot_creak, cow_bell, cow_moo (synthetic placeholder), dog_bark (real), dog_growl (real),
  dog_pant (real, loop), door_creak, fire_crackle (loop), footsteps_floor (loop), footsteps_mud (loop), fox_yip
  (real), hooves_soft (loop), ladle_stir (loop), lantern_hiss (loop), oars_water (loop), paper_rustle, pot_clatter,
  rain_on_thatch (loop), rain_on_umbrella (loop), rice_spill, rope_creak, rope_snap, saap_hiss (real),
  sand_pat (loop), scuffle, thunder_roll, water_splash, whoosh_soft, wind_soft (loop).
  Credits: `public/audio/sfx/ep02/README.md`.
- `sfx/`: chime_pop, cracker_burst, distant_ship_horn, goat_bleat_happy, monsoon_rain (loop), padma_river_day,
  river_water, soft_magical_shimmer, sparkler_crackle, temple_bell_drop, uludhwani.
- `ambient/`: bengal_night_crickets, dawn_birds_temple, monsoon_rain_courtyard, padma_river_day (all loops).
- `music/`: Divine_Motif, Festival_Folk_Loop, Sacred_Night_Ambient, Theme_Intro_Bansuri, Village_Peace_Loop,
  Warm_Family_Flute.

In every pause the scene's ambient bed and music already rise a little (the ducking in `Episode02.tsx`); the sounds
below are added on top.

---

## Scene 01: 01_shashthi_mystery (the cot row), 25 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "মেদিনীমণ্ডলের বিরাট বৈদিক বাড়ি।" | Wide: the Vedic house outside, morning (`BaidikBariDay`) | Hold | The line names the house; an establishing view is held (STO-01, STO-02). *Director to choose, see the end.* |
| 2 | 94 | "লম্বা ঘরে সারি সারি বিছানায় নানা বয়সের শিশুরা শুয়ে থাকে।" | Wide: the long room, far-left cots | Cut on the line, then one slow pan right along the row, ending on Balak's cot; hold | The line names the rows of beds; the pan reads them one by one |
| 3 | 263 | "কিন্তু বাবুকর্তার নতুন খোকাটি যেন সবার চেয়ে আলাদা!" | Medium close-up: Balak, Charu bending to kiss him | Slow push in, starting on "নতুন খোকাটি"; hold through "আলাদা!" | New subject and the emotional line: one push. His glow lifts gently. |
| 4 | 409 | "অন্য বাচ্চারা যখন কাঁদে, সে তখন শান্ত হয়ে শুয়ে থাকে।" | Medium, low across the cots: a crying baby sharp in front, Balak soft behind | Cut 6 to 8 f before the line; on "সে তখন শান্ত" rack focus to Balak; hold into the scene's end | The contrast is told by focus, not by moving the camera |

**What the current camera does wrong:** it never holds. The dolly starts on frame 0 while the line names the house,
but the picture is the inside of a room. Then a push (262), close-up A (282), a glide to close-up B (344, only
2.5 s later), an ease back (409), focus racks out and back twice (405, 478), close-up C (474) with the base sliding
left under it, and in the breath a drift right plus a push. About eight moves in 25 s, two or three of them inside
line 3 alone, and the closing drift has no reason.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…বিরাট বৈদিক বাড়ি।" | 1.0 s | Held wide of the house: smoke from the kitchen roof, banana leaves stir, a crow crosses | `ambient/dawn_birds_temple` loop 0.20 |
| P2 | "…শিশুরা শুয়ে থাকে।" | 1.5 s | The pan has landed. Charu has just stopped at the cot and looks down at the calm baby; babies cry in the next cots | `sfx/ep02/baby_soft_cry` 0.18 (distant), `sfx/ep02/cot_creak` 0.20 as her hand meets the rail |
| P3 | "…সবার চেয়ে আলাদা!" | 2.0 s | Close on Balak: the kiss lands, Charu's eyes linger on him, he gazes up at her; his glow brightens gently (key beat) | `sfx/ep02/cloth_rustle` 0.20 as she straightens; `sfx/ep02/baby_soft_cry` 0.18 starting at the end, leading into line 4 |

**Scene total: 4.5 s**

---

## Scene 01c: 01c_mother_lap (mother's lap), 9 s

One sentence, no break inside, so one pause before it and one after it.

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "আর মা চারুশীলা ছাড়া আর কারও কোল বা" | Medium two-shot: Charu on the madur, the baby in front of her; she lifts him into her arms | Hold to "মা চারুশীলা", then one slow push in to a close two-shot of both faces | The line names his mother; the lift is the action, so the camera stays calm |
| 2 | 103 | "দুধ সে কিছুতেই নেয় না!" | Close two-shot of both faces | Hold (the kiss lands here) | Same sentence: no second move |

**What the current camera does wrong:** four moves on one sentence: a base push (60 to 160) with a focus change,
close-up D (40), close-up E only 2.5 s later (100), a further push in the breath, and then an ease back over the last
20 frames that lands right on the cut, with no reason.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | *open*, before "আর মা চারুশীলা…" | 1.0 s | Charu seated, gazing down at him on the mat before she reaches; he looks up at her; her breath, his blink | `ambient/bengal_night_crickets` loop 0.15 (soft room tone), `sfx/ep02/cloth_rustle` 0.15 as her hands move |
| P2 | *end*, after "…নেয় না!" (added to the 2 s hold already there) | 1.5 s | Close two-shot: she rocks him very slowly, he looks up at her face, she smiles down | `music/Warm_Family_Flute` loop 0.12 rising under the existing bed |

**Scene total: 2.5 s**

---

## Scene 01d: 01d_shashthi_rain (the downpour outside), 10 s

One long sentence, no break inside.

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "ষষ্ঠীপূজোর দিন সকাল থেকে এমন" | Wide: the decorated Vedic house in the storm, the puja laid out, a woman in the doorway | Hold (no crane) | Establishing view: held wide |
| 2 | 74 | "মুষলধারে বৃষ্টি নামল যে গাঁয়ের কেউ" | Same wide | Hold; the one lightning flash lights the house | The rain is already in frame; nothing new to move to |
| 3 | 168 | "আসতে পারল না।" | Wide toward the flooded village path | One slow pan right, starting on "আসতে", ending on the villagers turning back; hold | The line is about the people who cannot come: the pan finds them |

Note: in today's timing the villagers turn back during line 2 (116 to 152). Their turn should move to line 3 so
the pan meets them (STO-01, STO-05).

**What the current camera does wrong:** it moves for the whole scene: a crane down (0 to 72), only 16 frames of hold,
a pan right (88 to 150), a push in (150 to 201) that starts 18 frames before its line with no hold after the pan,
then another push through the breath to zoom 1.62. Three moves in one sentence. A handheld shake that grows to 2.4
runs throughout, but CAM-03 keeps handheld for tense moments only.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | *open*, before the first line | 1.0 s | Held wide: rain sheets across the decorated gate, garlands swing in the wind, the alpana starts to run | `sfx/ep02/rain_on_thatch` loop 0.22, `sfx/ep02/wind_soft` loop 0.15, `sfx/ep02/thunder_roll` 0.30 (distant) |
| P2 | *end*, after "…আসতে পারল না।" (added to the 1.5 s hold already there) | 1.0 s | Cut to medium: the empty decorated veranda, the puja lamps flickering alone in the gusts; hold | `sfx/monsoon_rain` loop 0.22 (as today's breath), `sfx/ep02/thunder_roll` 0.30 |

**Scene total: 2.0 s**

---

## Scene 01d2: 01d2_shashthi_hands_miracle (the baby's hands and the rain), 44 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 14 | "গ্রামের ব্রাহ্মণরা নবজাতককে পায়ের ধুলো দিতে আসবেন বলে সব আয়োজন ছিল—" | Wide of the room: the waiting asans, plates and pradip, the family, the baby by the window | Hold about 3 s, then one slow push in along the empty asans and plates, starting on "সব আয়োজন" | The line names the waiting arrangements |
| 2 | 195 | "অথচ এক ফোঁটা বৃষ্টিও থামছে না!" | Medium: the big window pouring, the baby's cot under it | Cut on the line; hold | The rain is the new subject |
| 3 | 274 | "আর ঘরের ভেতর আত্মীয়রা হঠাৎ এক অদ্ভুত কাণ্ড দেখে অবাক—" | Medium group: the relatives by the other window | Cut on the line; hold (on "অদ্ভুত কাণ্ড" their heads turn to the baby) | The line names the relatives |
| 4 | 427 | Thakurma: "ওরে তোরা এদিকে এসে দ্যাখ!" | Close-up: Thakurma, beckoning, then pointing | Cut 6 to 8 f before her line; hold | Speaker close-up, early |
| 5 | 483 | Thakurma: "খোকা যেমন ছোট্ট হাত দুটো জোরে নাড়ছে, বাইরে বৃষ্টিও অমনি মুষলধারে বাড়ছে!" | MATCH shot: the baby in front, the window behind him | Cut on "খোকা"; hold | Hands and rain in one frame: the picture proves the line |
| 6 | 646 | Thakurma: "আবার হাত থামালেই বৃষ্টি কমে আসছে—" | Same MATCH shot | Hold (no cut) | Same frame for waving and stopping, so cause and effect is plain |
| 7 | 720 | Thakurma: "এ কি মানুষের কাজ রে!" | Close-up: Thakurma, hand to cheek, eyes wet | Cut 6 to 8 f before; one slow push in | Emotional peak of her speech |
| 8 | 780 | Surendra: "বড় আশ্চর্য মা!" | Close-up: Surendra, turned to his mother | Cut 6 to 8 f before his line; hold | Speaker close-up, early |
| 9 | 823 | Surendra: "কারও পদধূলি যেন ও নিতে চাইল না—" | Same close-up (his eyes go to the baby) | Hold | Same speaker, no reason to move |
| 10 | 912 | Surendra: "প্রকৃতিই যেন ওর ইশারায় খেলছে!" | MATCH shot: one slow gesture of the baby's hand, the rain answers | Cut on the line; hold. After the line, cut to the warm two-shot of Charu and the baby for the scene's end hold | The line points to the baby's gesture |

Ten shots instead of fifteen, each held 2 s or more.

**What the current camera does wrong:** 15 hard cuts in 44 s, about one every 3 s; shot J lasts 1.4 s and shot I
1.9 s. Every shot also creeps its zoom, so the frame is never still. Two cuts (I and J) fall inside one Thakurma
sentence ("বাইরে বৃষ্টিও অমনি মুষলধারে বাড়ছে"). Thakurma's close-ups (G, L) cut on her first syllable and
Surendra's only 4 frames early, instead of 6 to 8. Cut C lands in the middle of a phrase. Cutting away from the
MATCH shot between "waving" and "stopping" weakens the miracle.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…এক ফোঁটা বৃষ্টিও থামছে না!" | 1.5 s | Hold on the pouring window; Thakurma, at the edge of frame, sighs and looks out at the rain | Scene rain as now (its level follows his hands), plus `sfx/ep02/thunder_roll` 0.25 (distant) |
| P2 | Thakurma: "…মুষলধারে বাড়ছে!" | 1.0 s | Hold the MATCH shot: his hands still waving hard, the heaviest downpour, one soft flash; at the edge of frame Thakurma's eyes go from the baby to the window and back | Scene rain at its heaviest, `sfx/ep02/thunder_roll` 0.30 |
| P3 | Thakurma: "…এ কি মানুষের কাজ রে!" | 2.0 s | Hold on Thakurma's close-up: eyes wet, she turns to Surendra; the rain has softened to a drizzle; the baby's glow brightens gently (key beat), seen soft behind her | Scene drizzle, `sfx/ep02/cloth_rustle` 0.15 (her hand to her cheek); `music/Sacred_Night_Ambient` bed rises as now |

**Scene total: 4.5 s**

---

## From the letter to Ujanchar: 01e_father_letter, NEW 02a0_journey_to_ujanchar, 02a_ujanchar

Director's direction (2026-11-21): "From receiving the new job letter to moving to Ujanchar is too fast; it needs to
be intuitive, adding music and sound effects, whichever is suitable, for a real TV episode feel." This section
plans the whole stretch as one sequence. It replaces the separate 01e and 02a plans of the first draft.

**Today:** 01e 13.7 s and 02a 7.1 s, about 21 s, with the cart ride squeezed into 3 s inside 02a.
**Planned:** 01e about 19.7 s, a new music-led journey of 11 s, 02a about 8.6 s, about 39.5 s in all (+18.5 s).

Light across the stretch: rainy grey day at the house (not dusk as today), drizzle at the farewell, clearing on the
road to a golden afternoon, dusk gold at Ujanchar (as 02a is now), night in the fox scene. *Director to confirm the
departure moves from dusk to a grey rainy day, so the time passing on the road reads.*

### 01e_father_letter: the news lands, the farewell (about 19.7 s)

| # | Time | Line | Shot | Camera | Picture | Why |
|---|---|---|---|---|---|---|
| 1 | 1.0 s, **pause (open)** | none | Medium two-shot at the main door, rainy grey day | Hold | Surendra in the doorway looks out at the rain; the lamp flickers behind him; the peon's umbrella appears at the edge | Lets the new chapter settle after the miracle |
| 2 | 2.5 s | "অন্নপ্রাশনের আগেই বাবা" | Same two-shot | Hold | The peon arrives, closes his umbrella, bows and presents the letter with both hands | The handover plays in a still frame |
| 3 | 4.1 s | "সুরেন্দ্রচন্দ্রের নতুন চাকরির খবর এল—" | Medium close-up: Surendra | One slow push in, starting on "সুরেন্দ্রচন্দ্রের" (to about 1.4, not today's 4.2) | He takes the letter on "খবর", opens it and reads | The line names the father |
| 4a | 1.0 s, **pause: the news lands** | none | Same close-up | Hold | His face lifts with quiet joy; he raises the letter toward the lamp; behind him, soft, the peon bows and leaves | His joy first |
| 4b | 2.0 s, same pause | none | Medium wide of the doorway | Cut (motivated: he turns and calls inside) | He calls into the house. Charu, Balak in her arms, and Thakurma come to the door: surprise, then joy; Charu glances back into the house, a touch of sadness at leaving; Balak looks at his father, calm | The family hears the news. Today's lamp-room lift is replaced by this. |
| 5 | 3.8 s | "সবাইকে নিয়ে তিনি চলে গেলেন উজানচর" | Wide: the front of the Vedic house (`BaidikBariDay`) | Cut on the line; one slow pan following the family toward the gate | Out of the main door and down the steps: Surendra with umbrella and bundle, Charu holding Balak, Thakurma with a basket; a woman waves from the door | "Everyone": a wide that shows them all; the pan follows their walk |
| 6 | 1.1 s | "কৃষ্ণনগরে।" | Medium wide at the gate | Cut on the line; hold | Two elders wait at the gate and raise their hands in blessing over the family (nobody but Charu touches Balak) | The blessing at the gate |
| 7 | 2.0 s, **pause: the farewell** | none | Same medium wide | Hold | The blessing finishes; Charu turns for a last look back at the house, eyes wet, Balak in her arms; the rain eases to a drizzle | The farewell needs a held beat |
| 8 | 2.2 s | none (today's end hold) | Rear wide: the family as silhouettes | Cut; hold (no pull-back) | Through the gate to the waiting cart; they climb on and sit; the cart starts to roll. Cross-dissolve (CAM-09, about 40 f) into the journey | Hands over to the road |

New time in 01e: 1.0 + 3.0 + 2.0 = **6.0 s**. The news pause is 3 s, not 2 s, because three people must react in
it; *the director can shorten it to 2 s by dropping shot 4a.*

### NEW 02a0_journey_to_ujanchar: the journey (11.0 s, no narration, music-led)

A new inserted scene between 01e and 02a (suggested component `Scene02a0Journey`, no voice clip). It reuses the
bullock cart rig and the riders from 02a (`rig/BullockCart.tsx`; Surendra and Thakurma from Scene01eFather). The
cart travels left to right in every wide, the same screen direction as the family's walk, so it reads as one
journey.

| # | Time | Shot | Camera | Picture | Light |
|---|---|---|---|---|---|
| J1 | 2.0 s (the first 1.7 s under the dissolve from 01e) | Wide: a village road through green paddy fields, the cart small in frame | Hold; the cart crosses the frame | Drizzle thins and stops; puddles on the road; egrets in the paddy | Rainy grey |
| J2 | 1.5 s | Close-up: the turning wheel | Hold; the wheel turns in frame | Spokes turning through mud, drops flicking off the rim | Grey, brightening |
| J3 | 2.0 s | Medium: the bullock's head | Hold | Its head nods with each step, the neck bell swings; the clouds break | First sun |
| J4 | 2.5 s | Medium close-up: Balak in Charu's lap on the cart | One slow push in (the montage's emotional beat) | Balak gazes up at the sky as birds cross; his soft glow; Charu looks down at him and smiles (only she holds him) | Golden afternoon |
| J5 | 1.5 s | Wide: the riverside track, country boats on the water | Hold; the cart crosses the frame | Optional instead: a ferry crossing (cart on a wide country boat). The riverside track is simpler to draw and fits Ujanchar's river. | Late gold |
| J6 | 1.5 s plus a 40 f dissolve | Wide, a little high: the cart rounds a bend | Hold | The forest-ringed Ujanchar village comes into view in the distance, no name board; dissolve into the 02a wide | Dusk gold, matching 02a |

Shots J2 to J6 each hold at least 1.5 s. A montage with no narration is the one place shorter holds are fine: one
move (the J4 push) in 11 s.

### 02a_ujanchar: arrival (about 8.6 s)

| # | Time | Line | Shot | Camera | Picture |
|---|---|---|---|---|---|
| 1 | 4.6 s | "চারদিকে জঙ্গলঘেরা উজানচর কৃষ্ণনগর।" (starts 0.6 s in) | Wide aerial: the village ringed by dense jungle, the river, the low sun (STO-09) | Hold, no push (comes in by the dissolve from J6) | Smoke from the huts, mist on the river |
| 2 | 2.5 s (today's end hold) + 1.5 s **pause (end)** | none | Same wide | Hold | Birds fly home into the far forest; the light dims toward dusk; then today's cross-dissolve into the night kitchen |

Today's cart-ride shot at the start of 02a (frames 0 to 84) is dropped: the journey carries the cart now. The line
already starts 0.6 s in, so dropping the ride saves no time; the only new time in 02a is the 1.5 s end pause.

### What the current camera does wrong here

- 01e: about nine moves in 14 s (a track on the peon, a push, a 4.2x punch-in on the father, a push with a Charu
  close-up in and out within 2 s, a dolly with a Balak close-up in and out within 2 s, a pull-back, a drift). The
  Balak close-up sits on "সবাইকে নিয়ে তিনি চলে গেলেন", a line about the father leading everyone. The cuts at 102 and
  196 fall in the middle of sentences.
- 02a: the line naming Ujanchar plays over the close cart shot; the wide arrives only near the end of the line, then
  pushes in and keeps drifting, so the establishing view is never held.

### Sound plan for the stretch

**Music (one thread, never more than 0.25):**

| Where | Cue | Level | How |
|---|---|---|---|
| 01e lines 1 to 3 | `music/Village_Peace_Loop` (today's 01e bed) | 0.08 under the voice | As now |
| 01e pause 4 (the news lands) | same | rises 0.08 to 0.18 over 1 s | The soft swell on the father's joy |
| 01e lines 5 and 6 | same | ducks to 0.08 | Under the narration |
| 01e pause 7 (farewell) and shot 8 | same | rises to 0.14, then fades out over the dissolve | The parting |
| Journey J1 to J6 | `music/Warm_Family_Flute` (13.2 s), started from its top on J1 | fades in 0 to 0.20 over J1, 0.22 at J4 (Balak and the sky), 0.20 through J6 | Carries the journey with no narration |
| 02a line | same, continuing | ducks to 0.10 under "চারদিকে জঙ্গলঘেরা…" | One pass of the 13.2 s file ends about 2 s into 02a, so the music resolves under the narration; if its ending is not a natural close, fade it over 1.5 s |
| 02a end pause | 02a's beds as now | | Birds and river take over |

Warm_Family_Flute is already 02a's music, so the thread continues naturally. Theme_Intro_Bansuri is the series
theme, kept for the intro and outro. Divine_Motif is not used here (sacred moments only).

**Effects:**

| Where | File | Volume | Note |
|---|---|---|---|
| 01e 1 to 4 | `sfx/ep02/rain_on_thatch` loop | 0.18 | Steady rain at the door |
| 01e 1 to 3 | `sfx/ep02/lantern_hiss` loop | 0.15 | The lamp behind Surendra |
| 01e 3 | `sfx/ep02/paper_rustle` | 0.30 | Opening the letter (as now) |
| 01e 4a | `sfx/ep02/rain_on_umbrella` loop | 0.15 | The peon leaves under his umbrella |
| 01e 4b | `sfx/ep02/door_creak` | 0.25 | Charu and Thakurma come to the door |
| 01e 5 | `sfx/ep02/footsteps_mud` loop | 0.18 | The walk to the gate |
| 01e 6 | `sfx/temple_bell_drop` | 0.18 | A soft auspicious bell on the elders' blessing |
| 01e 7 to 8 | `sfx/ep02/rain_on_umbrella` loop | 0.18 falling to 0.10 | The rain easing to a drizzle |
| 01e 8 | `sfx/ep02/cot_creak` | 0.20 | The cart deck takes their weight (as now) |
| J1 | `sfx/ep02/rain_on_thatch` loop | 0.15 fading to 0 over 2 s | The last of the rain |
| J1 to J6 | `sfx/ep02/cart_wheel_creak` loop | 0.20 (0.25 on J2, 0.15 under J4) | The wheels, all the way |
| J1 to J6 | `sfx/ep02/hooves_soft` loop | 0.15 | The bullock's steps |
| J2 | `sfx/ep02/water_splash` | 0.15 | The wheel through a puddle |
| J3 | `sfx/ep02/bullock_bells` loop | 0.20 | The neck bell, from J3 on |
| J3 | `sfx/ep02/cow_bell` | 0.20 | One clear ring as the bell swings in close |
| J3 to J5 | `sfx/ep02/wind_soft` loop | 0.15 | Open fields |
| J4 | `sfx/ep02/birds_village` loop | 0.18 | The birds he watches |
| J5 | `sfx/river_water` | 0.20 | The river beside the track |
| J5 | `sfx/ep02/oars_water` loop | 0.15 | A boatman rowing past |
| J6 | `sfx/ep02/birds_village` loop | 0.15, fading | Birds settling at dusk; hands over to 02a's beds |

Today's breath cues after 01e (`rain_on_umbrella`, `cart_wheel_creak`) move into this plan; 02a's cart sounds (the
ride, frames 7 to 72) are no longer needed there.

### Added length

| Part | Added |
|---|---|
| 01e pauses (open 1.0, news 3.0, farewell 2.0) | 6.0 s |
| New journey | 11.0 s |
| 02a end pause | 1.5 s |
| **Stretch total** | **18.5 s** (today about 21 s, planned about 39.5 s) |

Of this, 7.5 s are pauses (counted in the episode pause total below) and 11 s is the new journey scene. The
brief estimated about 14 s; the journey at 11 s plus the held news and farewell beats come to 18.5 s, so
other pauses were trimmed a little (see the totals).

---

## Scene 02: 02_fox_and_bagha_dog (the fox and Bagha), 36 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "একদিন মা রান্নাঘরে ব্যস্ত," | Medium: Charu stirring at the hearth | Hold | The line names her and the kitchen |
| 2 | 75 | "আর ঘর কেটে এক শেয়াল ঢুকে পড়েছে!" | Low wide of the baby's room: the hole in the far wall and the khat with the baby in one frame | Cut on the line (instead of the whip-pan); hold while the fox scratches through and creeps in | New subject: the fox |
| 3 | 169 | "ঠিক তখনই বাড়ির বিশ্বস্ত কুকুর বাঘা" | Same room wide | Hold; Bagha runs into the held frame from the left | He enters the frame; the camera does not have to find him |
| 4 | 270 | "ছুটে এসে শেয়ালকে তাড়িয়ে দিল!" | Same room wide | Hold, light handheld only during the tussle (CAM-03); the fox flees out through its hole (STO-07) | The chase is the action; a still frame keeps it readable |
| 5 | 359 | "মা ছুটে এসে দেখেন—" | Room, from the khat toward the doorway | Cut 6 to 8 f before the line; hold as Charu hurries in and stops | The line names her running in |
| 6 | 410 | "ছোট্ট শিশুটি একটুও ভয় না পেয়ে মিষ্টি হাসছে!" | Close-up: Balak on the khat, seen a little from above (her view) | Cut on "ছোট্ট শিশুটি"; hold; his smile widens and his glow lifts on "মিষ্টি হাসছে" | New subject, seen through her eyes |
| 7 | 547 | Charu: "হায় ভগবান!" | Medium two-shot from the khat side: Charu standing above, Balak below | Cut 6 to 8 f before her line; hold | Speaker shot, early |
| 8 | 583 | Charu: "ও আমার সোনা মানিক, তোর মুখে এমন শান্ত হাসি দেখে আমার প্রাণ ফিরে এল!" | Close two-shot of both faces (she kneels, hand on his chest) | One slow push in, starting on "তোর মুখে এমন শান্ত হাসি", held through "প্রাণ ফিরে এল!" and into the end hold | Emotional peak |

Note: the line says "মা ছুটে এসে" (mother came running), but today Charu walks slowly to the khat (330 to 540). For
STO-01 she should hurry, then slow only in the last steps.

**What the current camera does wrong:** three whip-pans in 6 s (68, 171, 202). The second whip leaves the room for the
kitchen just as the line names Bagha, so his entry is missed; the third lands in the middle of a line. A fight zoom
and a shake are laid over the whips, and a slow push (1.00 to 1.06) creeps under the whole scene. At Charu's
arrival there are four moves in 4 s: a close-in (548), a pull-back (576 to 612), a push (640) and her close-up
(636). Her close-up starts 1 frame after "হায় ভগবান" instead of before it. The end hold eases back with no reason.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…শেয়াল ঢুকে পড়েছে!" | 1.0 s | Room wide holds: the fox stops mid-room, low, sniffing; Balak turns his head and looks at it, calm and curious | `ambient/bengal_night_crickets` loop 0.18, `sfx/ep02/fire_crackle` loop 0.15 (from the kitchen, off screen) |
| P2 | "…শেয়ালকে তাড়িয়ে দিল!" | 2.0 s | First half: Bagha barks once more at the hole, then turns back to the khat and looks at the baby. Second half: cut to the kitchen, Charu's head lifts at the noise, fright on her face, the ladle slips | `sfx/ep02/dog_bark` 0.25, `sfx/ep02/dog_pant` loop 0.20, `sfx/ep02/pot_clatter` 0.30 (the ladle) |
| P3 | "…মিষ্টি হাসছে!" | 2.0 s | Hold on Balak's close-up, then Charu's hand comes into frame toward her chest; he looks up at her and smiles; his glow brightens gently (key beat) | `music/Divine_Motif` loop 0.22, moved to start here (today it starts on her line); `sfx/ep02/cloth_rustle` 0.15 |

**Scene total: 5.0 s**

---

## Scene 03: 03_lemon_tree_goshaap (the go-saaps under the lemon tree), 28 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "শিশু তখন হামাগুড়ি দিতে শিখেছে।" | Low medium at his eye level: Balak crawling down the veranda step | Follow him at an even pace (no zoom change); stop when he stops | The line is about his crawling: the move follows him |
| 2 | 79 | "বাড়ির উঠোনের কোণে লেবুগাছের তলায় রোদ পোহাতে আসত বড় বড় গো-সাপ।" | Wide: the courtyard corner, lemon tree, three go-saaps basking, bamboo fence and jungle beyond, Balak small at left, Charu at the door (STO-11) | Cut on the line; hold | The line names the place and the go-saaps: a held establishing wide |
| 3 | 241 | "ছোট্ট ঠাকুর হামাগুড়ি দিয়ে গিয়ে তাদের গায়ে হাত বুলিয়ে খেলতেন!" | Wide, then a close two-shot: his face and the go-saap's head | Hold while he crawls to them; on "তাদের গায়ে হাত বুলিয়ে" one slow push in to the two-shot | The stroking is the heart of the story: a push on it |
| 4 | 403 | "আর আশ্চর্যের কথা—" | Same two-shot | Hold | Builds to the wonder line |
| 5 | 446 | "গো-সাপগুলোও চুপচাপ শুয়ে আদর খেত, একটুও ভয় পেত না!" | Medium wide: all the go-saaps lying calm around him, Charu far behind at the door | One slow pull back, starting on "গো-সাপগুলোও"; hold. Then the existing cut to Charu's close-up (CAM-12) in the end hold | "The go-saaps" (all of them) lay quietly: the pull back shows them all |

**What the current camera does wrong:** the camera never stops in 25 s. It follows the crawl with a lag, blends
into two new framings (160, 236), adds a "tension" push (150 to 404) and a look-back push (154 to 266), racks focus
twice, jolts on the hiss (266), orbits sideways (313 to 423), drifts out (428 to 512), goes into a pet close-up
(476), pushes to his face (516) with a giggle close-up on top (527), and pulls back (548 to 596). That is ten
layered moves, several running at once, none held for 2 s. The low "tension" angle and the hiss jolt add a danger
the narration does not mention; the narration says the go-saaps were calm.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…হামাগুড়ি দিতে শিখেছে।" | 1.5 s | He stops on the sand (one of the crawl's slow spots), sits back on his heels, looks around and back at the veranda; the camera stops with him | `sfx/ep02/birds_village` loop 0.15 (as now), `sfx/ep02/cow_bell` 0.18 (the cow lifts its head) |
| P2 | "…বড় বড় গো-সাপ।" | 1.5 s | Held wide: a go-saap's slow tongue flick, Balak looks at them; focus racks briefly to Charu at the door, hand over her mouth, then back (STO-12) | `sfx/ep02/wind_soft` loop 0.15 (as now), leaves rustling in it |
| P3 | "…হাত বুলিয়ে খেলতেন!" | 2.0 s | Hold the two-shot: a slow stroke, the go-saap closes its eyes and settles flat on the sand; his glow brightens gently (key beat) | `sfx/ep02/sand_pat` loop 0.15 (his soft pats), birds as now |

**Scene total: 5.0 s**

---

## Scene 04: 04_rice_pot_miracle (the rice pot), 30 s

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "একদিন ঘরের বিশাল চালের মটকি দড়ি" | Wide: the room, the toddler on the floor, the big pot hanging above him | Hold; on "বিশাল চালের মটকি" one slow push in to a medium that still holds both the pot and the child | The line names the pot |
| 2 | 78 | "ছিঁড়ে সোজা এসে পড়ল ছোট্ট শিশুর ওপর!" | Same medium | Hold: the rope snaps and the pot falls on him inside the frame (slow-motion beat, CAM-05; a small landing jolt) | The frame already holds pot and child, so no move is needed |
| 3 | 168 | "বাবা-মা তো ভয়ে চিৎকার করে উঠলেন!" | Medium wide two-shot: both parents crying out, then rushing to the pot | Cut 6 to 8 f before the line; hold | One cut on both parents instead of a glide from one face to the other |
| 4 | 248 | "কিন্তু মটকি তুলে দেখা গেল—" | Medium: the pot, both parents kneeling, gripping and tipping it onto its side | Cut on the line; hold | New action, a clear frame for it |
| 5 | 311 | "শিশুটি মটকির মুখ দিয়ে দিব্যি ভেতরে ঢুকে হাসছে," | Close-up: Balak smiling inside the pot's mouth, both parents' heads leaning in above | One slow push in, starting on "শিশুটি"; his glow lifts | The reveal is the emotional peak |
| 6 | 423 | "গায়ে একটা আঁচড়ও লাগেনি!" | Same close-up | Hold | Same sentence, no second move |
| 7 | 494 | Babukaka: "নারায়ণের অপার কৃপা!" | Close-up: Babukaka, relieved | Cut 6 to 8 f before his line; hold | Speaker close-up, early |
| 8 | 546 | Babukaka: "এত বড় বিপদ থেকে আমার খোকা আজ অক্ষত ফিরে এল!" | Wide: the whole family around the tipped pot | One slow pull back, starting on "আমার খোকা"; hold into the end | The blessing covers the whole family and closes the story |

**What the current camera does wrong:** the narration starts while the screen is still black (line 1 at frame 0,
the picture fades in from 12 to 41). Inside "বাবা-মা তো ভয়ে চিৎকার" the camera does three things: Charu's
close-up (156), a glide to Babukaka's close-up 1.3 s later (186) and a pull back to the wide (161 to 241). Then a
push (241 to 304), a tilt (253 to 300), a second push (300 to 395) and the toddler close-up (314) overlap.
Babukaka's close-up goes in (488) while the base pulls back (487 to 570): two moves in opposite directions. The end
hold drifts. In its favour: most close-ups already start before their lines.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | *open*, before "একদিন ঘরের…" | 1.0 s | The chapter break's slow fade in (CAM-10) on the held wide: the toddler patting rice grains on the floor, the pot hanging quietly above, the rope turning a little | `sfx/ep02/rope_creak` 0.20, `ambient/padma_river_day` loop 0.12 (as now) |
| P2 | "…ছোট্ট শিশুর ওপর!" | 2.0 s | Hold on the covered pot: dust settles, warm light leaks from under the rim, a hush | `sfx/ep02/rice_spill` 0.20 (a last trickle of grains), then near silence |
| P3 | "…আঁচড়ও লাগেনি!" | 2.0 s | Hold the close-up: the parents look at each other, then at him, eyes wet with relief, Charu's hand on her chest; he pats the rice and smiles up at them; his glow brightens gently (key beat) | `sfx/ep02/rice_spill` 0.15 (his pat), `sfx/temple_bell_drop` 0.20 near the end, leading into "নারায়ণের অপার কৃপা" |

**Scene total: 5.0 s**

---

## Scene 99: 99_closing_sequential_outro (closing sunset and next-episode glimpse), 32 s

The outro follows the Episode 1 template. These changes are small; *director to choose whether to touch it at all.*

### Shot list

| # | f | Line | Shot | Camera | Why |
|---|---|---|---|---|---|
| 1 | 0 | "ভয় নয়, সরল নির্মল ভালোবাসাই যেকোনো প্রাণী ও মানুষকে আপন করে নেয়—" | The sunset over the river, series title | Hold | A calm closing view |
| 2 | 172 | "সত্যিকারের সাহস জন্ম নেয় শান্ত মন থেকে।" | Same | One slow push in (1.00 to 1.04), starting on the line | The moral is the emotional close |
| 3 | 278 | "ছোটদের বালক ঠাকুরের গল্প—" | Same | Hold | Series name |
| 4 | 344 | "আসছে পরের পর্ব: পাঁচ বছরের মুখে অমূল্য তত্ত্ব!" | The Episode 3 glimpse melts in under the title | Hold (the glimpse's dissolve is not a camera move) | Preview |
| 5 | 464 | "কীভাবে পাঁচ বছরের ছোট্ট বীরু … তা জানতে চোখ রাখুন পরের পর্বে!" | Same, then the fade to dark | Hold | Invitation, then the end |

**What the current camera does wrong:** gentle but aimless. A constant 60 px pan runs across the whole outro, a
second drift inside the water-shimmer layer goes the other way, a push runs under the glimpse, and the glimpse has
its own drift and zoom: four slow drifts at once, none motivated by a line.

### Pauses

| # | After | Length | Picture | Sound |
|---|---|---|---|---|
| P1 | "…শান্ত মন থেকে।" | 1.0 s (the voice file already has 1.5 s of silence here, so about 2.5 s in all) | Held sunset: birds cross the sky, the sun's shimmer on the river | `ambient/padma_river_day` loop 0.20, `music/Theme_Intro_Bansuri` as now |
| P2 | "…অমূল্য তত্ত্ব!" | 1.0 s | The glimpse holds on Balak's namaste in Episode 3's tulsi scene | `sfx/soft_magical_shimmer` 0.15 (today it plays at the outro's start; it could move here) |

**Scene total: 2.0 s**

---

## Totals

| Scene | Pauses | Added |
|---|---|---|
| 01 cot row | 3 | 4.5 s |
| 01c mother's lap | 2 | 2.5 s |
| 01d rain outside | 2 | 2.0 s |
| 01d2 hands miracle | 3 | 4.5 s |
| 01e father's letter | 3 | 6.0 s |
| **02a0 journey (new scene)** | none, music-led | **11.0 s** |
| 02a Ujanchar | 1 | 1.5 s |
| 02 fox and Bagha | 3 | 5.0 s |
| 03 go-saap | 3 | 5.0 s |
| 04 rice pot | 3 | 5.0 s |
| 99 outro | 2 | 2.0 s |
| **Pauses** | **25** | **38.0 s** |
| **Pauses + journey** | | **49.0 s** |

**Episode length:** today 6,227 frames (4:19.5); planned about 7,403 frames (**about 5:08**).

The first draft had 41 s of pauses. To make room for the journey, five pauses were trimmed by 0.5 s each
(01 P1, 01c P1, 01d P1, 01d2 P2, 04 P1). To land nearer 5:00 (about 5:01), the director could also: drop the outro
pauses (-2.0 s), drop the 01c and 01d end holds (-2.5 s), shorten the news pause to 2 s (-1.0 s) and drop journey
shot J5 (-1.5 s).

---

## Notes for whoever codes this (after approval)

- **Pauses are inserted time.** The timing generator (`scripts/build_ep02_timing.js`) adds the frames and splits a
  voice clip at the silence between sentences, the way it already makes `_p1` / `_p2`. Everything after a pause
  moves later, so camera keys and sound cues must be tied to the narration cues (CAM-13), not to frame numbers.
- **Where the clips split** (silences measured with ffmpeg in the clip's own seconds):
  - `01a_Narrator_p1`: 3.99-4.44 (01 P1), 11.02-11.54 (01 P2), 16.68-17.30 (01 P3)
  - `01d2a_Narrator_Inside`: 10.55-11.44 (01d2 P1)
  - `01d2b_Thakurma_Rain`: 9.09-9.32 (01d2 P2; a short gap, cut in its middle)
  - `01b_Narrator_Rain_p2`: 5.65-6.34 (01e news pause)
  - `02a_Narrator_Fox_p2`: the subtitle times do not line up with the silences in this clip; the nearest are 7.42-8.00
    (fox P1) and 13.83-14.24 (fox P2). Check by ear before splitting.
  - `03a_Narrator_Goshaap`: 2.66-3.15 (P1), 10.16-10.88 (P2), 16.00-16.46 (P3)
  - `04a_Narrator_Motki`: 7.34-8.00 (rice pot P2)
  - `99_Outro_Sequential`: 11.24-12.75 (outro P1), 19.78-20.59 (outro P2)
  - No split needed: 01d2 P3, fox P3 and rice pot P3 sit between two separate voice files; the *open* and *end*
    pauses only move a clip or lengthen a hold.
- **New scene:** `02a0_journey_to_ujanchar` goes into the scene list between `01e_father_letter` and `02a_ujanchar`,
  with no voice clip.
- **Pause sounds** need their own cue list anchored to each pause, like today's `BREATH_CUES`.
- **A level to check:** the ambient beds open to 0.45 in every pause today (`AMBIENT_OPEN` in `Episode02.tsx`). They
  are loops, and AUD-03 sets loops at 0.25 or below.

---

## For the director to decide

1. **Scene 01, first line:** show the Vedic house from outside on "মেদিনীমণ্ডলের বিরাট বৈদিক বাড়ি।" (STO-01), or
   keep the scene inside the cot room?
2. **Departure light:** move the departure from dusk to a grey rainy day, so the journey's time passing (grey, gold,
   dusk) reads?
3. **The news pause:** 3 s as planned (three people react), or 2 s?
4. **Journey shot J5:** a riverside track (simpler) or a ferry crossing?
5. **Fox scene:** straight cuts instead of the three whip-pans? Charu to hurry to the khat, since the line says she
   came running ("মা ছুটে এসে")?
6. **Go-saap scene:** drop the low "tension" angle and the hiss jolt, since the narration says the go-saaps were calm?
7. **Outro:** add its two small pauses, or leave the Episode 1 template untouched?
8. **Length:** keep about 5:08, or trim to about 5:01 (see Totals)?
9. **Ambient level in pauses:** cap the beds at 0.25 (AUD-03) instead of today's 0.45?
