# Episode 2 Audit: Intro to Outro

Scope: narration WAVs and `timing.ts`, SRT and `subtitles.ts` cues, scene code under `remotion_studio/src/episode02/` (scenes, rig/Animals.tsx, Episode02.tsx beds), and the series bible. Read-only; no render, no code edits.

Timestamps are episode frame at 24 fps, then seconds.

## Top five changes

1. **Scene 03: Balak is drawn as a five-year-old, but the narration says he has just learned to crawl.** Replace the crawl figure with an infant (plain white cloth, no dhoti, no curls) matching scenes 01 to 01e.
2. **Scene 03: the go-saap recoils at frame 2526 (105.3 s), just before the child touches it.** That reads as fear and contradicts "একটুও ভয় পেত না". Replace the recoil with a slow head-lift and settle, so the animal leans toward him.
3. **Scene 04: the rice jar floats and is not held.** The base sits at y=930 while the floor is at y=1010, and Babukaka's hands are not keyed to the jar (frames 3075 to 3379). Snap the base to the floor and key both hands to the handles during the lift.
4. **Scene 02: Bagha arrives about 8 s after the narration says he already chased the fox away, and the fight is long and violent over the calm newborn.** Move Bagha's entrance to frame 1688 (70.3 s), cut the fight to about 3 s with no bite or dust, and have the fox leave by frame 1876 (78.2 s).
5. **Sound beds undercut the sacred tone.** `Divine_Motif` is never used, though the bible reserves it for his sacred moments. A "magical shimmer" plays at the fox entrance and at the rice-pot scene start, not on the miracle. Night crickets sit under a daytime scene. Ambience runs at 0.5 under narration at 1.0. Add the motif at the calm-newborn beat, the scene 03 aura ramp and the miracle; drop the shimmers; lower ambience to about 0.2.

## 00_intro (0 to 201; 0 to 8.4 s)

No blocking issues. The card matches the narration and shows no deity or white-gold backdrop.

## 01_shashthi_mystery (188 to 752; 7.8 to 31.3 s)

- **Bed mismatch.** The bed is `deep_bengal_night_crickets`, but the manifest says `golden_daytime`. Use a daytime courtyard bed here and keep crickets for 01e (evening lamp).
- **Missing motif.** The calm-newborn beat has no sacred cue. Add `Divine_Motif` quietly at that beat.
- **Stillness.** At the Charu forehead kiss, hold the camera still for about 1 s.

## 01c_mother_lap (752 to 926; 31.3 to 38.6 s)

- The lap reads well. The narration's "দুধ" (milk) is not shown; keep the lap as the symbol.

## 01d_shashthi_rain (932 to 1135; 38.8 to 47.3 s)

- **Doubled rain.** Ambient rain at 0.5 plus a one-shot `monsoon_rain.wav` at 0.4 at scene start. Keep one rain layer at about 0.2.

## 01e_father_letter (1135 to 1439; 47.3 to 60.0 s)

- Props follow hands (letter, umbrella, pot, blanket, bag). The rear-shot silhouettes with the bright newborn read well. No blocking issues.

## 02a_ujanchar (1406 to 1518; 58.6 to 63.25 s)

- The lower third and dawn light match the narration. Confirm a dissolve or fade at frame 1518, where the fox kitchen starts; otherwise the cut is abrupt.

## 02_fox_and_bagha_dog (1518 to 2339; 63.25 to 97.5 s)

- **Bagha timing (issue 4).** Narration cue 1687 to 1876 (70.3 to 78.2 s) says Bagha chases the fox away. The picture has him enter at local 362 (78.3 s).
- **Fight length.** Local 312 to 670 (76.3 to 91.2 s) is about 15 s of biting, dust (80.5 s, 83.1 s) and tussle over a newborn.
- **Charu line offset.** `timing.ts` places `02b_Charu` at frame 2065 (86.0 s, local 547). The scene header says local 644 (90.1 s). Charu kneels at local 690 to 748 (92.0 to 94.4 s). Start her line at local 690 (frame 2208, 92.0 s), so "তোর মুখে এমন শান্ত হাসি" lands on the smile ramp.
- **Smile lands late.** The narration names the smile at 84.0 to 85.6 s (frames 2017 to 2054). `BABY_SMILE_KEYS` stays at 0.3 until local 700 (92.4 s). Start the ramp at local 470.
- **Aura through the fight.** The newborn aura is 1 from 63.3 to 97.5 s, including the fight. Drop it to about 0.5 during the fight and raise it to 1 at Charu's arrival.
- **Beds.** `soft_magical_shimmer` plays at scene start (63.3 s) under the fox sneaking in, and `Sacred_Night_Ambient` runs under the fight. Use a hearth ambient, and the motif only at Charu's arrival.
- Fox and dog facing is consistent.

## 03_lemon_tree_goshaap (2326 to 2922; 96.9 to 121.75 s)

- **Age (issue 1).** Narration: "শিশু তখন হামাগুড়ি দিতে শিখেছে" (just learned to crawl). Picture: the five-year-old rig. The bible gives Ep 2 both "newborn 1–2" and "toddler 2–5"; resolve it there and follow the narration here.
- **Recoil (issue 2).** `SAAP_STATES` sets `recoil` at local 200 (105.3 s) and `sit` at local 344 (111.25 s).
- **Plural mismatch.** Narration says "গো-সাপগুলো" and "তাদের" (several). The picture has one lizard (`LIZ`). Add a second go-saap, or change the narration to "একটি গো-সাপ".
- **Crawl figure.** Built from simple SVG limbs (header note), not the Puppet rig, so it will not match scenes 01 to 04. Use a proper infant crawl rig.
- **Touch.** The header says he pats the head; the narration says he strokes its body (106.9 to 113.7 s). Change the picture to a back stroke.
- The aura ramp at local 230 (106.5 s) comes after the animal settles, which is the right restraint once the recoil is fixed.

## 04_rice_pot_miracle (2909 to 3591; 121.2 to 149.6 s)

- **Jar floats (issue 3).** Jar base y=930, `FLOOR_Y`=1010. The jar hangs 80 px above the floor from the drop (128.1 s) to the set-down (140.8 s).
- **Hands.** Babukaka's keys at local 230 and 440 are `hold`/`relaxed` with no prop. The jar moves on its own track from 135.2 to 138.7 s.
- **Child in the jar.** Narration cue 3220 to 3331 (134.2 to 138.8 s) says the child is inside the jar's mouth. The picture lifts the jar away with the child at x=900. Change the line to "মটকির পাশে দিব্যি বসে হাসছে" (sits beside the jar, laughing).
- **Shimmer desync.** `soft_magical_shimmer` plays at scene start (121.2 s), but the visual shimmer and divine hint start at local 255 to 300 (131.8 to 133.7 s). Move the cue there and pair it with `Divine_Motif`.
- **Bed.** `Sacred_Night_Ambient` sits under a daylit scene. Use a day bed.
- Light is on the toddler only, after the miracle. Good.

## 99_closing_sequential_outro (3578 to 4343; 149.1 to 181.0 s)

- The card shows no deity or human figure, and the closing line matches the narration. No blocking issues.

## Subtitles and SRT

- **Short cues.** "ফিরে এল!" (147.75 to 148.6 s), "ভয় নয়," (149.1 to 150.0 s) and "ঢুকে হাসছে," (137.7 to 138.8 s) are 21 to 26 frames. Merge each into a neighbouring cue.
- **SRT not phrase-cued.** `Episode_02_Shashthi_and_GoShaap_bn.srt` has blocks of 7 to 31 s, while `subtitles.ts` uses 1 to 4 s phrases. Regenerate the SRT from `EP02_CUES`.
- Cue starts otherwise match the narration WAV starts.

## Series bible and characters

- **Fox and Bagha missing.** `characters.json` has no fox or dog entry. Add them with visual prompts so the animals get the same review as the cast.
- **Ep 2 age and divinity conflict.** Table 4 gives Ep 1–2 "newborn, Level 1 steady" and Ep 2–5 "toddler, Level 0". Pick one for Ep 2; this decides issue 1 and the scene 03 aura.
