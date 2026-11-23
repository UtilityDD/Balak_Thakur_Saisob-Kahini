# Episode 6: cinematic music and sound cue sheet (2026-11-22, re-cut update 2026-11-23)

Status: **for the approved plan STO-21** (`01_Script_and_Storyboard/Ep06_Shots_and_Pauses_DRAFT.md`, approved on its
recommended answers, 2026-11-22). Not yet coded or heard; the director listens in the studio before the render.

**Re-cut update (2026-11-23, STO-22a).** The approved immersive re-cut (`01_Script_and_Storyboard/Ep06_Immersive_Recut_PLAN.md`,
sections 1 and 2) adds wordless moments. The delivered cues M1 to M22 stay below as delivered; rows the re-cut adds
are marked **NEW**, delivered rows it changes are marked **CHANGED (re-cut)** with the change written after
"Re-cut:", and the one delivered cue it drops is marked **REMOVED (re-cut)**. New cues are named by the plan's moment
ids (W1a, W1b, C1, A1, G1; W2, T1, D1, D2, L1a, L1b, R1, G2). **The plan's moment "M1" (the match cut to the lozenge
jar) is cue `MC` here**, so it is never confused with cue M1. Timing source: the re-cut generator
`scripts/build_ep06_timing.js` (3,302 f); the frame numbers quoted in brackets are only that build's values for
checking, the cues are keyed to the ids. A checklist of what `Episode06.tsx` must add is at the end ("For the sound
file").

Cinematic score with Indian instruments (AUD-07) on the model of the Episode 5 cue sheet: tanpura, bansuri, swarmandal
plucks, tabla, a soft low drum. A children's series: tension is light and never frightening. Rules kept: the narration
stays clear (AUD-01); music ducks under every voice and rises in the pauses (AUD-06); loops at 0.25 or below (AUD-03),
one-shots 0.15 to 0.45 (AUD-02); voices at -16 LUFS.

**Keying.** Every cue is keyed to a narration snippet (for `cueLocalStory6`), a pause (P1 ...), an action gap (AG1 ...)
or a named scene action / sound event, never to a frame number. Scene action anchors the scene files should export
(as Episode 5's `S01_TIMES` / `S01_EVENTS`) are written `S01.swat`, `khadam_step_N` and so on. Re-cut gaps and their
beats are the generator's ids: W1 = scene 01's open gap, beats `a_lane_walk` / `b_courtyard_plates`; W2 = scene 02's
open gap, beat `a_world`; L1 = scene 02's gap at P2's point, beats `a_lane_walk` / `b_haystack_duck`. Pause indexes
(sorted by `atStory`, as `pauseWindow` / `pauseStartAbs` take them): scene 01 P1 = 0, P2 (C1) = 1, P3 (G1) = 2
(unchanged); scene 02 **T1 = 0, P2 (D2) = 1, R1 = 2, P3 (G2) = 3** (the delivered open pause P1 is gone, W2 is a gap).

**Levels** are loudness targets in LUFS, as in `Episode05.tsx` (`MUSIC_CUES`, `lufsToVol`): *under* = while any voice
plays (`ducked()`), *open* = no voice, *pause* = inside the named pause. The volume in brackets is the resulting
playback volume for that file. Loops never exceed 0.25 (the code's open cap); one-shot hits are not ducked, so a hit
that falls under a voice gets its *under* level directly. Beds (birds, wind, far children) are the sfx side and follow
the plan's table (scene 01 birds 0.10 under voice, 0.18 in P1, 0.15 in P2, 0.20 in P3; scene 02 birds 0.08 / 0.18,
0.15 in P2, wind 0.06 / 0.10, far children 0.05 / 0.10).
*Erratum (2026-11-23):* the delivered M1 row gave play_plucks' volumes as (0.10 / 0.14); for the -24 LUFS loop, -40 /
-37 LUFS are (0.16 / 0.22). The code uses the LUFS targets, so nothing changes; the bracket was wrong.

**Keys.** Series key Sa = C. Everything below is in C (tanpura_drone, tanpura_drone_low_hot, play_plucks, the cheeky
plucks, the bansuri phrases, Village_Peace_Loop, Warm_Family_Flute, Theme_Intro_Bansuri) except **Divine_Motif (C#)**,
which only ever plays over `tanpura_drone_cs` (C#) and never together with a C cue (M17: Village_Peace_Loop and the C
tanpura are out before it opens). tabla_soft (dayan near C/C#), the drum strokes and tension_rise are unpitched for this
purpose (as in Episode 5). The two new stems are in C (measured, below).
Re-cut: the seven re-cut stems are in C or unpitched (measured: pitch tracks for the bansuri, constant-Q onsets for the
swarmandal); every combination is listed in "Keys of the stems that sound together" below. The G2 rule is the same:
Village_Peace_Loop and the C tanpura reach zero at least 2 frames before Divine_Motif and the C# tanpura open.

---

## Scene 01: the elder brother saved (Ujanchar courtyard, warm afternoon)

Idea: the father's wooden khadam are the rhythm of the tension. From the first clack a soft low drum stroke falls on
**every** khadam step while he searches, so the drum walks with him; when he stops, the drum stops. When he walks off
after Balak's answer the same clacks come back **without** the drum: the danger is gone.
Re-cut: the scene now opens on a wordless walk home (W1) with a pastoral bansuri call that hands over to the
afternoon plucks; in Balak's choice (C1) the khadam pulse turns into his heartbeat and everything thins to near
silence before the narration's "but"; the afterglow (G1) lets bansuri_compassion land its long Sa on the glow.

| Beat | Key (narration / pause / gap / action) | Music | Level: under / open / pause (vol) | Feel |
|---|---|---|---|---|
| **W1a · NEW** | W1 beat `a_lane_walk` (the lane: the boys walk home with their slates, hens cross) [629 to 671] | `ep05/tanpura_drone` as in M1 (from the scene start, fade in 24 f, under the end of the intro's Theme_Intro_Bansuri, which is out by scene start + 24). **`ep06/bansuri_pastoral`** (new, 1.73 s) from W1 start + 20 f (after Theme_Intro_Bansuri's fade, 4 f overlap at its tail), fade in 2 f: Re, a held Sa, then the quick slide r-R-Ga up to Pa about 1.05 s in, so the slide crosses the cut into the courtyard and the call is released on Pa about 32 to 40 f after it starts (inside W1b). Plays out (own 0.2 s fade) | pastoral open -33 (0.22); drone open -37 (0.22) | a call across the fields; the world before the words |
| **W1b · NEW** | W1 beat `b_courtyard_plates` (the courtyard: kitchen smoke, the brass plates, the elder flops down and taps a plate) [671 to 701] | `ep05/play_plucks` (the M1 loop) fades in 18 f from the beat's start, under the pastoral Pa, and runs on as M1 into "একদিন" | plucks open -37 (0.22); then M1's under level | settling into the ordinary afternoon |
| M1 · **CHANGED (re-cut)** | Scene start (fades in under the source card's end) to `S01.swat` (the swat on "মেরে" of "একদিন বড় ভাই অকারণে ছোট ভাইকে মেরে") | `ep05/play_plucks` (loop) over `ep05/tanpura_drone` (loop), fade in 24 f with the picture. **Re-cut:** the drone still starts at the scene start (W1a); play_plucks starts at W1b (fade 18 f) instead of the scene start; both still stop dead on the swat (M2) | plucks -40 / -37 (0.16 / 0.22, see the erratum); drone -44 / -37 (0.10 / 0.22) | an ordinary afternoon, light, small under the scolding |
| M2 | `S01.swat` (the elder's hand lands on Balak's back) | **Everything stops dead**: plucks and drone out in 2 f on the swat frame. Then only birds for the ~0.6 s before the first clack | - | the jolt; silence |
| M3 · K1 note | `khadam_step_1` (the father steps into the khadam at the plinth's foot, about 10 f before "লুকিয়ে পড়ল") | First `ep06/khadam_pulse` stroke, 1 f before the clack (the stroke peaks 0.05 s into the file). It sits in the voice silence after "মেরে", so it gets the open level. **Re-cut (K1, no music change):** this first clack is now heard off screen; the stroke stays on it all the same (keyed to the step event, seen or not). The crow's caw and the hens' scatter (sfx) start 3 to 6 f after the clack, never on it; the second clack (the ground-level shot of the khadam) keeps its M4 stroke | -32 (0.25) | alarm: the elder freezes |
| M3 | Same anchor, running to "বাঁচিয়ে দিলেন" | `ep05/tanpura_drone_low_hot` (loop) fades in under it over 24 f: the dark floor of the whole search. **Re-cut:** P2 level -35 instead of -33, and the thinning before "কিন্তু পিঠের" (C1) | -40 / -36, P1 -34, P2 -33 (0.11 / 0.18 / 0.22 / 0.25); re-cut P2 -35 (0.18), see C1 | tension held |
| M4 | `khadam_step_2 .. N` through shot 2 ("লুকিয়ে পড়ল বাবার পায়ের শব্দ শুনে।"), **P1** (clacks nearer, off screen) and shot 3 ("বাবা এসে জিজ্ঞেস করলেন বড় ছেলে কোথায়—": the father strides in, clack, clack) | One `ep06/khadam_pulse` stroke per step, each 1 f before its clack; alternate feet ±1 dB so it does not sound machine-made. The strokes rise a little as he comes nearer. **The last stroke is his last step** (`S01.fatherStops`, as he stops to look left and right); no stroke while he stands and asks | under voice -38 (0.13); in P1 -33 rising to -32 (0.22 to 0.25); shot 3 under voice -37 (0.14) | the search walks toward Balak |
| M5 · **REMOVED (re-cut)** | **P2** (the insert: the elder peeking, finger to lips, palms joined; ~1.0 s pause plus the 1.0 s voice silence before it) | `ep05/tension_rise`, small: placed so its end lands 2 f before "কিন্তু পিঠের ব্যথা নিয়েও…", 3 f fade-out (no hit follows: it rises and is cut by the narration's "but"). Drone at its P2 level. **Re-cut: dropped.** A rise that peaks into the "but" contradicts the near silence C1 asks for; C1 replaces it | (was -35, 0.18) | (the pleading; will he tell?) |
| **C1 · NEW** | **P2** lengthened to 2.0 s (pause index 1) plus the ~0.46 s voice silence on each side [speech ends ~1013, P2 1024 to 1072, "কিন্তু পিঠের" 1083]: three point-of-view cuts. Events `S01.c1_brother` (his view of the brother's pleading eyes), `S01.c1_father` (up at the father's stern face), `S01.c1_push` (back on Balak, the slow push in); defaults if the scene exports none: P2 start, P2 start + 16 f, P2 start + 32 f | **The pulse turns into a heartbeat.** On `c1_brother` one more `ep06/khadam_pulse` stroke (1 f early): the father has stopped, but the same low stroke comes back, now as Balak's heart. On `c1_father` one **`ep06/heartbeat_soft`** (new: the same stroke, softer and rounder, now lub-dub; 1 f early). On `c1_push` one more heartbeat_soft, softer. Nothing after it. **Silence before the decision:** from the last heartbeat + 10 f the dark drone thins by 12 dB over 8 f and holds there to "কিন্তু পিঠের", then comes back to its under level over 6 f from "কিন্তু পিঠের" (M6). At least 14 f between strokes; the last stroke must start at least 20 f before "কিন্তু পিঠের" so at least ~12 f of near silence remain (move or drop the third one if the cuts run late) | stroke -33 (0.22); heartbeat 1 -34 (0.20); heartbeat 2 -36 (0.16); dark drone in P2 -35 (0.18), thinned to -47 (0.05) | Balak's choice; the audience holds its breath |
| M6 | Shot 4: "কিন্তু পিঠের ব্যথা নিয়েও ছোট্ট ঠাকুর দাদাকে বাঁচিয়ে দিলেন!" up to "বাঁচিয়ে দিলেন" | the dark drone alone under the line and the push-in (no pulse, no melody) | -40 (0.11) | Balak choosing |
| M7 | **Release on "বাঁচিয়ে দিলেন"** | `tanpura_drone_low_hot` crossfades into the bright `ep05/tanpura_drone` over 30 f starting 4 f before the snippet: the dark drone opens out | bright drone -44 / -37 (0.10 / 0.22) | release |
| M8 | Balak's line (01b): "যাও বাবা, আমি বলব না—বললে তো তুমি দাদাকে মারবে!" | bright drone only, low under him (no melody over a child's voice) | -44 (0.10) | gentle, selfless |
| M9 | **AG1** start (`gap a_father_leaves`: he throws up a hand, shakes his head and clacks off to the kachari) | `ep05/bansuri_relief` from AG1 start - 6 f (fade in 20 f). The khadam clacks of his leaving get **no** drum strokes. The phrase climbs to its held Pa during AG1; fade it out over AG2's first 30 f (gone before the compassion phrase) | open -32 (0.25) | relief: the danger walks away |
| M10 · A1 note | **AG2** (`gap b_brother_comes_out`: the elder edges out, sheepish and softened, then grins and runs off laughing) | relief fading out; the bright drone continues. **Re-cut (A1, no new cue):** the brother's one glance back at Balak is left to the drone alone (relief is gone by AG2 + 30 f); that bare moment is the softness. No pluck, no melody | drone -37 (0.22) | a moment's softness |
| M11 · **CHANGED (re-cut, G1)** | **P3** (Balak alone, watches his brother go, wipes his eye, a small forgiving smile; glow beat 1), from AG2's last 12 f | `ep05/bansuri_compassion` (fade in 12 f): its first gesture (Ga Ma Ma Ga ga) descends and settles on Sa about 1.4 s in, so it lands on Sa as the picture starts its fade; `sfx/soft_magical_shimmer` 0.12 with the glow (sfx side); drone under. **Re-cut (G1, P3 now 3.0 s):** key the phrase so its **long held Sa** (2.05 to 2.70 s into the file, 49 f after its start) begins on **glow beat 1** (`S01.glow1`; default P3 start + 36 f, so the phrase starts at P3 start - 13 f [1437], next to the delivered - 12 f): the first gesture and its first Sa fall on the sparrow pecking and Balak watching (the drift in), the long Sa on his smile and the glow. The phrase then ends with its own 10 f fade, tapering the long Sa, at 2.75 s into the file (to = start + 66 f = P3 start + 53 f [1503]), before its low wander (from 2.70 s), instead of running into the chapter-break fade. It is gone as the picture's fade begins (P3's last 18 f): the bright drone, the shimmer (sfx 0.12) and the sparrow's chirps carry the glow through CB1 | compassion open -33 (0.22); drone -37 (0.22) | compassion, grace; then the glow |
| CB1 | Chapter break (P3's last 18 f fade, 8 f of black) | All scene 01 music fades with the picture (fade-out = CB_FADE_OUT + BED_TAIL, as Episode 5); `sfx/chime_pop` 0.18 in the black, alone | - | |

Shot-length note: AG1 + AG2 + P3 are 5.5 s together; the relief phrase (12.3 s) and the compassion phrase (9.5 s) are
both cut short by design: relief by a fade during AG2, compassion by the chapter-break fade. That is why compassion
starts 12 f before P3 (so it reaches Sa inside the picture).
Re-cut: AG1 + AG2 + P3 are now 7.0 s. Relief is unchanged; compassion now plays its first gesture and its long Sa
(2.75 s of the file) and fades by itself just as the chapter-break fade starts, so the fade carries only the drone,
the glow's shimmer and the sparrow.

## Scene 02: the treasurer and the ten rupees (Ujanchar playing field, bright late morning, warmer by the lozenges)

Re-cut: an airy high bansuri opens the field (W2); the tabla stays under the treasury close-ups (T1); two small comic
plucks (the dog-bark jump D1, the haystack duck L1); the "decided" brightening moves to the walk (L1a); a playful
tabla tag under the reactions (R1); one bright pluck on the match cut to the jar (MC); and a longer afterglow (G2):
Village_Peace_Loop stays into P3 and then gives way, with a clean gap, to the C# Divine_Motif on glow beat 2.

| Beat | Key (narration / pause / gap / action) | Music | Level: under / open / pause (vol) | Feel |
|---|---|---|---|---|
| **W2 · NEW** | W2 (open gap 2.5 s, beat `a_world`, replaces the delivered open pause P1: the kite high over the mango trees, the tilt down past the goat and the woman with the water pot to the field) [1547 to 1607; "খেলার সাথীরা" at 1616] | **`ep06/bansuri_field`** (new, 2.49 s) from W2 start + 4 f (fade in 2 f), while the picture fades in from the chapter break: Pa, a meend from komal ni up to high Sa (about 0.6 s in, on the kite), then a long held Dha as the camera tilts down to the field, released before the first line (to = "খেলার সাথীরা" + 2 f, fade 6 f, in case its release touches the voice). Over the bright drone of M12 | bansuri open -33, under -41 (0.22 / 0.09); drone open -37 (0.22) | a bright, airy morning; the kite |
| M12 · **CHANGED (re-cut)** | **P1** (open, 1.0 s: the fade-in from the chapter break, the ball game beyond, Balak sitting quietly) | `ep05/tanpura_drone` fades in with the picture (CB_FADE_IN, on `lifeF`); no melody yet (the beds rise: birds, wind, far children). **Re-cut:** P1 no longer exists; the drone fades in the same way at the start of W2, and bansuri_field (W2) is its melody | -44 / -37 (0.10 / 0.22) | a bright morning |
| M13 | Shot 1: "খেলার সাথীরা তাঁকে ভোলাভালা ভেবে প্রায়ই ঠকাত—"; `S02.ballGiven` (the badly stitched ball handed over, the smirks) and `S02.ballTaken` (Balak takes it in both hands, delighted) | `ep05/cheeky_pluck_3` (4 spaced, whimsical notes) on `ballGiven`, `ep05/cheeky_pluck_2` (5 notes, the last ringing) on `ballTaken`, each 1 f early, each ringing out | under voice -38 (0.13) | gentle humour; his innocence |
| M14 · **CHANGED (re-cut, T1)** | Shot 2: from "কিন্তু দামি জিনিস বা টাকা রাখতে হলে…" to "একদিন এক বন্ধু" | `ep05/tabla_soft` (loop), fade in 18 f on "কিন্তু": the boys bring their things, the treasurer sorts them. It opens in the 1.0 s voice silence after "…বিশ্বাস করত!" and goes out (10 f) on "একদিন". **Re-cut:** that silence now holds **T1** (new 1.5 s pause, index 0 [1850 to 1886]: the treasury in close-up, the top kissed, the cracked marble set apart, Balak lining up and patting the heaps). The tabla simply continues under it at a pause level (ramped over the duck ramp) in place of the delivered +5 dB shape, and still goes out (10 f) on "একদিন". No melody: the marbles' clicks (sfx) are the detail | -43 / -39, silence -38 (0.11 / 0.18 / 0.20); re-cut T1 pause -37 (0.22) | busy, trusted, content |
| M15 · **CHANGED (re-cut, D1)** | Shot 3: "একদিন এক বন্ধু দাদার পকেট থেকে দশ টাকা চুরি করে" | the bright drone crossfades into `ep05/tanpura_drone_low_hot` over 24 f from "একদিন"; two soft `ep06/khadam_pulse` strokes: on `S02.noteOut` (the note slides out of the pocket) and on `S02.glanceBack` (he glances over his shoulder), echoing scene 01's tension, very small. **Re-cut (D1):** see the D1 row; any khadam stroke that would fall within 12 f of `S02.culpritJump` is dropped | drone -41 / -36 (0.10 / 0.18); strokes under voice -39 (0.11) | something wrong, lightly |
| **D1 · NEW** | Inside shot 3: `S02.dogBark` (the off-screen bark, sfx) and `S02.culpritJump` (the culprit jumps, 2 to 4 f after the bark) | **`ep06/pluck_jolt`** (new, 0.49 s: four quick swarmandal strikes, a startled shiver) from `culpritJump` - 1 f: on the jump, not on the bark. **The music holds its breath:** the dark drone dips 5 dB from `dogBark` - 2 f (3 f ramp) to `culpritJump` + 6 f and comes back over 12 f. Comic, never tension: no stroke, no rise | jolt under voice -36 (0.16), in a voice gap -35 (0.18); drone dip to -46 under voice (0.06) | a comic jolt |
| M16 | Shot 4: "তাঁর কাছে রাখতে দিলে," (the note pressed into Balak's hands, the whisper, the friend runs off) | the dark drone alone | -41 (0.10) | |
| M17 · **CHANGED (re-cut, D2)** | **P2** (the dilemma, 1.5 s plus the 0.44 s voice silence: Balak looks from the village to the note and back, then folds his hands round it) | **one questioning bansuri phrase**, `ep06/bansuri_question` (new), from P2 start - 4 f (as his eyes go to the village): Ga, down to Sa, up to Re, a touch of komal ga, and it **hangs on Re**, unresolved. The dark drone rises to its P2 level under it. The phrase (2.58 s) is a little longer than the open window: its held Re's last ~0.5 s ducks under "ঠাকুর চুপিচুপি" (fade 10 f). **Re-cut (D2, P2 now 2.0 s, index 1 [2050 to 2098], and L1 follows it):** the same start; the whole phrase now fits in P2 (his three looks: the note, the boys, the friend's house far off; the breeze lifts the note's corner; leaves rustle, sfx). Its held Re runs on as he folds the note and stands and is faded over 10 f from L1 start (to = L1 start + 10 f [2108], its own end), so it no longer ducks under a voice | phrase open -33 (0.22); drone P2 -33 (0.25) | the question: what is right? |
| **L1a · NEW** (M18 moved here) | L1 beat `a_lane_walk` (L1 = the 2.0 s gap after P2 [2098 to 2146]: Balak walks down the lane, the folded note to his chest) | **Decided, now on the walk:** the dark drone crossfades into the bright `ep05/tanpura_drone` over 30 f from L1 start - 4 f (moved from "ঠাকুর চুপিচুপি", M18). No melody: his footsteps and the lane | bright drone open -37 (0.22), then -44 under "ঠাকুর চুপিচুপি" | a quiet resolve |
| **L1b · NEW** | L1 beat `b_haystack_duck`; event `S02.haystackDuck` (he ducks behind the haystack as the culprit crosses far ahead; default the beat's start [2122]) | **`ep06/pluck_duck`** (new, 1.25 s: four spaced swarmandal notes stepping down, Pa Ga Re Re, the sibling of cheeky_pluck_3) from `haystackDuck` - 1 f: down he goes, tiptoe, then he hurries on. Its last note rings under "ঠাকুর চুপিচুপি" (one-shot, not ducked) | open -35 (0.18) | a light comic beat; চুপিচুপি made visible |
| M18 · **CHANGED (re-cut)** | Shot 5: "ঠাকুর চুপিচুপি সেই টাকা বৌদিকে ফিরিয়ে দিয়ে এলেন।" | **Decided**: the dark drone crossfades back into the bright `tanpura_drone` over 30 f from "ঠাকুর চুপিচুপি"; one very soft `ep05/cheeky_pluck_3` on `S02.glanceBack2` (his one glance back, চুপিচুপি). **Re-cut:** the crossfade now happens at L1a (above), so the bright drone is already there under the line. Keep the glanceBack2 pluck only if it starts at least 36 f after pluck_duck's start; otherwise drop it (the duck already says চুপিচুপি) | drone -44 / -37; pluck under voice -40 (0.10) | a quiet, right thing done |
| M19 | **AG3** (2.5 s, wordless): (a) `S02.handOnHead` (the friend returns with three boys, palm out; Balak claps a hand to his head, opens both palms, empty); (b) `S02.friendStamp` (his face falls, he stamps and stalks off to tell his dada) | `ep05/cheeky_pluck_1` (a quick flurry that stops, ringing) on `handOnHead`, `ep05/cheeky_pluck_4` (a tumble of notes) on `friendStamp`, each 1 f early; bright drone under | plucks open -35 (0.18); drone -37 | the trickster tricked; comedy |
| M20 · **CHANGED (re-cut, R1)** | Shot 6: "সত্য প্রকাশ হতেই বৌদি খুশি হয়ে তাঁকে দু'আনা দিলেন—" | `ep05/tabla_soft` back, fade in 18 f from "সত্য প্রকাশ" (the dada, the gang, the boudi holding up the note), out (14 f) on "আর দয়ালু"; on `S02.coinsInPalm` (≈ "দু'আনা দিলেন") one `ep05/cheeky_pluck_2` (its ringing last note: a small "ta-da"). **Re-cut:** the tabla now goes out at **R1** (fade 8 f ending R1 start + 2 f) instead of on "আর দয়ালু"; the tag (R1 row) takes over; the coin pluck is unchanged and rings into R1 | tabla -43 (0.11); pluck under voice -38 (0.13) | the truth out; a reward |
| **R1 · NEW** | **R1** (new 1.0 s pause after "…দু'আনা দিলেন—", index 2 [2438 to 2462; "আর দয়ালু" at 2471]): the dada's raised eyebrows, the boudi hiding a smile behind her sari's end, the culprit's ears going red | **`ep06/tabla_tag`** (new, 1.28 s: four skipping ki-ta pairs about 0.31 s apart, the first strongest, the last softer and ringing: a chuckle) from R1 start + 2 f. Its pairs fall about 0, 7, 14 and 22 f in, so the last pair lands on the third reaction (the culprit's red ears, `S02.r1_culprit` if exported); it has rung out by "আর দয়ালু" | open -35 (0.19) | the secret out; everyone's face |
| **MC · NEW** (plan moment M1) | The match cut from the folded ten-rupee note (shot 6) to the lozenge jar glinting (shot 7): event `S02.jarCut` | **`ep06/pluck_bright`** (new, 1.31 s: one bright high swarmandal Pa, ringing) from `jarCut` - 2 f (its strike is 0.09 s into the file). One note only: what was taken comes back as sweets. Over Village_Peace_Loop as it fades in (M21) | under voice -36 (0.16); if the cut falls before "আর দয়ালু", open -34 (0.20) | a glint |
| M21 · **CHANGED (re-cut, G2)** | Shots 7 and 8 from "আর দয়ালু ঠাকুর সেই দু'আনা দিয়ে" through "সব বন্ধুদেরই মিষ্টি লজেন্স কিনে খাওয়ালেন!" | `music/Village_Peace_Loop` (loop), fade in 24 f on "আর দয়ালু", over the bright drone. Both go **out before P3**: fade-out 14 f ending 4 f after P3 starts (C must not sound under the C# motif). **Re-cut (G2, P3 now 3.5 s, index 3 [2621 to 2705]):** Village_Peace_Loop and the bright drone now carry on **into P3** at the open level (the boys on the fallen log at sunset, cheeks bulging, legs swinging, the culprit's shy nudge) and fade out over 18 f ending **2 f before Divine_Motif starts** (to = glow2 - 8 f; default [2649]): the key rule holds, no C under C# | VPL -38 / -31 (0.034 / 0.075), open in P3 -31; drone -44 / -37 | warmth, generosity, sweets for all |
| M22 · **CHANGED (re-cut, G2)** | **P3** (2.0 s: the boys suck their lozenges; the culprit's shy smile; Balak's serene smile, glow beat 2), from P3 start - 6 f, carried about 30 f past scene 02's end into the outro (as Episode 5's M16) | `music/Divine_Motif` (fade in 24 f; it has its own 1.2 s swell) over `ep05/tanpura_drone_cs` (C#, fade in 24 f); both fade out 42 f under the series fade into the outro. **Re-cut:** both now start on **glow beat 2** (`S02.glow2` - 6 f; default glow2 = P3 start + 36 f, so the motif starts [2651], about 1.25 s into P3, as the wide pulls back from Balak and the culprit to the whole row) instead of P3 start - 6 f; still carried 30 f past the scene's end with the same 42 f fade (the outro's C bansuri still waits for it, unchanged) | Divine_Motif open -31 (0.16, the plan's 0.15); drone_cs -44 / -37 | grace |

## Outro (99) and the Episode 7 glimpse

Unchanged series template (as Episode 5): `music/Theme_Intro_Bansuri` 0.08 / 0.14 with the outro bed, fade in 24 f;
Divine_Motif's tail (M22) overlaps its opening by about 30 f. No new cues.
Re-cut: unchanged (`motifEnd` is still scene 02's end + 30 f).

## Intro and source card

Unchanged series template: `music/Theme_Intro_Bansuri` 0.08 / 0.14 over the intro and the source card, out over 24 f
as scene 01 fades in (M1 fades in under it; both in C).
Re-cut: unchanged; bansuri_pastoral (W1a) waits 20 f for this fade, so the two flutes barely touch.

---

## Keys of the stems that sound together (re-cut check, 2026-11-23)

| Moment | Stems sounding together | Keys | OK |
|---|---|---|---|
| W1a, W1b | Theme_Intro_Bansuri (tail of its fade), tanpura_drone, bansuri_pastoral, play_plucks | all C (bansuri_pastoral Sa = C5, ends on Pa = G5) | yes |
| C1 | tanpura_drone_low_hot, khadam_pulse, heartbeat_soft | C; strokes unpitched (bayan glide, body about 99 Hz) | yes |
| W2 | tanpura_drone, bansuri_field | C (bansuri_field Pa, ni/Ni, Sa' = C6, Dha = A5) | yes |
| T1 | tanpura_drone, tabla_soft | C; tabla unpitched (dayan near C/C#) | yes |
| D1 | tanpura_drone_low_hot, khadam_pulse, pluck_jolt | C; swarmandal retuned C# to C (pentatonic) | yes |
| D2, L1a | tanpura_drone_low_hot into tanpura_drone, bansuri_question (held Re) | C | yes |
| L1b | tanpura_drone, pluck_duck (Pa Ga Re Re), then cheeky_pluck_3 if kept | C | yes |
| R1 | tanpura_drone, tabla_soft (fading), cheeky_pluck_2 (ringing), tabla_tag | C; tablas unpitched | yes |
| MC | tanpura_drone, Village_Peace_Loop (fading in), pluck_bright (Pa = G6) | C | yes |
| G1 | tanpura_drone, bansuri_compassion | C (compassion settles on Sa) | yes |
| G2 | Village_Peace_Loop + tanpura_drone (C), **then** after at least 2 f of nothing in C, Divine_Motif + tanpura_drone_cs (C#) | C, then C#: never together | yes, by the M21 / M22 timing |

## Stems

**Reused** (Episode 5 score library `public/audio/music/ep05/`, see its README; and the series `music/`):
tanpura_drone, tanpura_drone_low_hot, tanpura_drone_cs, play_plucks, tabla_soft, tension_rise, bansuri_relief,
bansuri_compassion, cheeky_pluck_1 to _4; Village_Peace_Loop, Divine_Motif, Theme_Intro_Bansuri (template).
Not used this time: drum_pulse and drum_pulse_fast (a fixed-tempo loop cannot stay in step with recorded footsteps;
the khadam pulse is struck per step instead), drum_hit_low, tabla_run, Warm_Family_Flute.
Re-cut: tension_rise is no longer used (M5 removed).

Note for `MUSIC_LIB`: `tanpura_drone_low_hot` (-21 LUFS) and the other `_hot` loops are not in the ep05 README; their
loudness is in `Episode05.tsx` (`MUSIC_LIB`: drum_pulse_hot -17, drum_pulse_fast_hot -17, tanpura_drone_low_hot -21).

**New** (`remotion_studio/public/audio/music/ep06/`, made with `_source/build_ep06_music.py` from the Episode 5 source
recordings, the same recipe as Episode 5; README and credits there):

| File | Length | Level | Key | What it is | Cues |
|---|---|---|---|---|---|
| `khadam_pulse.wav` | 0.84 s | -20 LUFS as an 80 bpm train, -8.2 dBTP | - (low, ~C2 body) | One "lub" stroke of drum_pulse (tabla bass stroke -5 st, low-passed, a touch of dhol attack), no "dub"; peak at 0.05 s | M3, M4 (one per khadam step), M15; re-cut also C1 (the first POV cut) |
| `bansuri_question.wav` | 2.58 s | -20.0 LUFS, -10.4 dBTP | C (Sa = C5), ends on Re | The same bansuri recording as relief / compassion (unused bars 11.82 to 14.00 s): Ga Sa Re (ga) Re, the Re held 0.9 s, unresolved | M17 |

MUSIC_LIB entries: `"music/ep06/khadam_pulse": { lufs: -20.0, seconds: 0.84, loop: false }`,
`"music/ep06/bansuri_question": { lufs: -20.0, seconds: 2.58, loop: false }`.

**NEW for the re-cut (2026-11-23)**, same folder and script (`python -I _source/build_ep06_music.py ../ep05/_source . recut`;
the default targets still rebuild only the two stems above, byte-identical). Measured with ffmpeg `ebur128`; the two
delivered stems were not touched.

| File | Length | Level (LUFS / dBTP) | Key | What it is | Cues |
|---|---|---|---|---|---|
| `bansuri_pastoral.wav` | 1.73 s | -20.0 / -8.6 | C, ends on Pa | Bansuri (the same recording, 48.10 to 49.56 s, unused elsewhere): Re, a held Sa, a quick slide r-R-Ga to Pa (about 1.05 s in), released on Pa (1.35 to 1.65 s) | W1a |
| `bansuri_field.wav` | 2.49 s | -20.0 / -12.2 | C, high, ends on Dha | Bansuri (30.00 to 32.10 s, inside bansuri_relief's 3.6 to 6.0 s, which Episode 6 never plays: relief is faded out by about 2.3 s): Pa, komal ni to Ni up to high Sa (C6, about 0.6 s in), Ni ni, a long Dha (A5, 0.95 to 2.35 s), released | W2 |
| `heartbeat_soft.wav` | 0.96 s | -20.0 (a 72 bpm train) / -8.5 | - (unpitched) | One soft lub-dub built from the khadam_pulse stroke (tabla bass stroke 106.84 s, -5 st): lub low-passed 200 Hz with the dhol attack at 0.12, dub = the same stroke low-passed 150 Hz at 0.55, 0.30 s later; lub peak 0.05 s in (start 1 f early), dub at 0.34 s. Built here because no heartbeat recording was found in `sfx/ep06/` (2026-11-23); being the khadam stroke itself is what makes "the pulse turns into a heartbeat" | C1 |
| `pluck_jolt.wav` | 0.49 s | -20.0 / -11.8 | C (swarmandal) | Four quick strikes, a startled shiver; 'Harp Tinkly Riff 2' 4.36 to 4.82 s, -1 st | D1 |
| `pluck_duck.wav` | 1.25 s | -20.0 / -6.9 | C | Four spaced notes stepping down, Pa (0.03 s) Ga (0.43) Re (0.67) low Re (1.06), ringing; 'Harp Whimsical Riff' 2.77 to 3.94 s, -1 st | L1b |
| `pluck_bright.wav` | 1.31 s | -20.0 / -4.6 | C, one high Pa (G6) | One bright flammed strike at 0.09 s (start 2 f early), ringing 1.2 s; 'Harp Tinkly Riff 2' 9.97 to 11.21 s, -1 st | MC |
| `tabla_tag.wav` | 1.28 s | -20.6 / -3.1 (true-peak limited) | - (as tabla_soft) | Four skipping ki-ta pairs (strokes at 0.03, 0.29, 0.60, 0.91 s, each with a second 0.07 s later), the first strongest, the last softer and ringing; 'Tabla drums demo' 149.60 to 150.90 s, low-passed 6.5 kHz like tabla_soft | R1 |

MUSIC_LIB entries: `"music/ep06/bansuri_pastoral": { lufs: -20.0, seconds: 1.73, loop: false }`,
`"music/ep06/bansuri_field": { lufs: -20.0, seconds: 2.49, loop: false }`,
`"music/ep06/heartbeat_soft": { lufs: -20.0, seconds: 0.96, loop: false }`,
`"music/ep06/pluck_jolt": { lufs: -20.0, seconds: 0.49, loop: false }`,
`"music/ep06/pluck_duck": { lufs: -20.0, seconds: 1.25, loop: false }`,
`"music/ep06/pluck_bright": { lufs: -20.0, seconds: 1.31, loop: false }`,
`"music/ep06/tabla_tag": { lufs: -20.6, seconds: 1.28, loop: false }`.

Credits: the same recordings as before (bansuri MayankSingh33 CC BY-SA 4.0; tabla tabladrumsonline CC BY-SA 3.0; dhol
Johnny Kalsi CC BY 3.0; swarmandal luckylittleraven CC0), so the Episode 6 credit line does not change.

**Still needed from other agents:** the khadam recordings (`sfx/ep06/`, the sfx agent) and the scenes' step events
`khadam_step_N` (the father's search, scene 01 shots 2 and 3 and P1) and the leaving steps in AG1, plus the action
anchors named above (`S01.swat`, `S01.fatherStops`, `S02.ballGiven`, `ballTaken`, `noteOut`, `glanceBack`,
`glanceBack2`, `handOnHead`, `friendStamp`, `coinsInPalm`).
Re-cut, from the scene agents (each has a default if missing, given in its row): `S01.c1_brother`, `S01.c1_father`,
`S01.c1_push`, `S01.glow1`; `S02.dogBark`, `S02.culpritJump`, `S02.haystackDuck`, `S02.jarCut`, `S02.glow2`,
optionally `S02.r1_culprit`.

## For the sound file (`src/episode06/Episode06.tsx`): what the re-cut adds (2026-11-23)

1. **MUSIC_LIB:** add the seven entries above. Remove nothing (tension_rise may stay in the library, unused).
2. **Anchors:** `A01.w1 = sceneStart(S01)` (W1 opens the scene), `A01.w1b` = W1 beat `b_courtyard_plates` start;
   `A01.p2 = pauseWindow(S01, 1)` (P2 is still index 1); `A01.glow1` (default `A01.p3 + 36`). `A02.w2 = sceneStart(S02)`;
   `A02.t1 = pauseWindow(S02, 0)`; `A02.l1` = the L1 gap start (EP06_GAPS, scene 02, kind "after", the gap at P2's
   point) and its beat `b_haystack_duck`; `A02.r1 = pauseStartAbs(S02, 2, …)`; **`A02.p3 = pauseStartAbs(S02, 3, …)`
   (was index 2: the new T1 and R1 shift it)**; the dark drone's P2 pause entry stays `{ scene: S02, index: 1 }`;
   `A02.jarCut`, `A02.glow2` (default `A02.p3 + 36`), `A02.dogBark`, `A02.culpritJump`, `A02.haystackDuck`.
3. **New cues** (hits unless a loop is named; `from` is the event minus the lead given in the row):
   W1a `bansuri_pastoral` from `A01.w1 + 20`; W1b play_plucks starts at `A01.w1b` (fade 18) instead of `A01.start`;
   C1 `khadam_pulse` at `c1_brother - 1` (-33), `heartbeat_soft` at `c1_father - 1` (-34) and `c1_push - 1` (-36);
   W2 `bansuri_field` from `A02.w2 + 4` to the first phrase + 2 (fade 6, under -41 / open -33, ducked);
   D1 `pluck_jolt` at `culpritJump - 1` (-36); L1b `pluck_duck` at `haystackDuck - 1` (-35); R1 `tabla_tag` at
   `A02.r1 + 2` (-35); MC `pluck_bright` at `jarCut - 2` (-36 under voice, -34 open).
4. **Changed cues:** M5 tension_rise **removed**. M3-M6 dark drone: P2 pause level -35 and a `shape`
   `[[lastHeart + 10, 0], [lastHeart + 18, -12], [kintu, -12], [kintu + 6, 0]]`. M11 compassion `from = glow1 - 49`,
   `to = from + 66`, `fadeOut: 10`. M14 tabla_soft: drop its silence `shape`, add `pause: [{ scene: S02, index: 0, lufs: -37 }]`.
   M15-M17 dark drone: add the D1 dip `[[dogBark - 2, 0], [dogBark + 1, -5], [culpritJump + 6, -5], [culpritJump + 18, 0]]`
   and end it with the L1a crossfade (`to = A02.l1 - 4 + 30`, `fadeOut: 30`) instead of on "ঠাকুর চুপিচুপি". M15
   strokes: drop any within 12 f of `culpritJump`. M17 bansuri_question `to = A02.l1 + 10`, `fadeOut: 10`. M18 bright
   drone `from = A02.l1 - 4` (fade 30); the glanceBack2 pluck only if it starts at least 36 f after the duck pluck.
   M20 tabla_soft `to = A02.r1 + 2`, `fadeOut: 8`. M21 Village_Peace_Loop and the M18-M21 bright drone `to = glow2 - 8`,
   `fadeOut: 18`. M22 Divine_Motif and tanpura_drone_cs `from = glow2 - 6` (the rest unchanged).
5. **Beds (sfx side) for the music beats:** C1: scene 01 birds from 0.15 (P2) down to 0.04 over the same 8 f as the
   drone thinning (last heartbeat + 10 to + 18), held to "কিন্তু পিঠের", back to 0.10 over 12 f from it. K1: the crow's
   caw and the hens' scatter 3 to 6 f after the first (off-screen) clack, not on its stroke. D1: the bark 2 to 4 f
   before `culpritJump` (the pluck is on the jump). G1: shimmer 0.12 on `glow1`. Everything else in the beds follows
   the plan's sound column.
6. Check: no C cue sounds between `glow2 - 8` and the end of Divine_Motif's fade except the outro's template bansuri
   (unchanged); the C1 near silence is at least 12 f long; every hit stays at or below 0.45.

## Listen before the render

Judged by measurement, not by ear. The director should listen in the studio especially to: the dead stop at the swat
and the first stroke (M2, M3); whether the per-step drum reads as "his footsteps are the danger" rather than as
doubled footsteps (if it doubles, drop the strokes 2 dB or put them only on every step of one foot); the small
tension_rise in P2; and the hanging Re of bansuri_question in scene 02's P2.
Re-cut, also: the khadam stroke turning into the heartbeat in C1 and whether the near silence before "কিন্তু পিঠের"
feels like a held breath (if the heartbeats read too dark, drop them 2 dB; tension_rise is no longer there to check);
the pastoral call (W1a) crossing the cut into the courtyard; the high bansuri over the kite (W2); whether the two
comic plucks (D1, L1b) read as comedy; the tabla tag under the reactions (R1); and the clean C-to-C# hand-over in G2.
