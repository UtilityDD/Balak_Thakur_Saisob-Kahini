# Audio Credits

The versioned record of every third-party sound recording used in the series. The audio folder
(`remotion_studio/public/audio/`) and the README files inside it are gitignored, so this file is the copy
that survives in git. Keep it in step with the README in each episode's sound folder (SFX-03, SFX-04 in
`docs/PIPELINE_DECISIONS.md`).

---

## Episode 2

Copied on 2026-11-21 from `remotion_studio/public/audio/sfx/ep02/README.md` (section "Recorded sounds
(replaced the placeholders) and required credits"), in the ep01run worktree.

All are real recordings from Wikimedia Commons, trimmed and converted to 48 kHz mono. The first four are
levelled to a -6 dBFS peak; `saap_hiss.wav` and `dog_pant.wav` (added 2026-11-21) are levelled by loudness as
noted. The generated placeholders they replaced are kept in `_placeholders_backup/` in that folder
(`dog_pant.wav` is new and replaced nothing).

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `dog_bark.wav` | "Barking of a dog.ogg" | https://commons.wikimedia.org/wiki/File:Barking_of_a_dog.ogg | first 1.0 s | Amada44 | CC BY-SA 3.0 |
| `dog_growl.wav` | "Dogs' Expectation about Signalers' Body Size by Virtue of Their Growls, pone.0015175.s006.ogg" | https://commons.wikimedia.org/wiki/File:Dogs%27-Expectation-about-Signalers%27-Body-Size-by-Virtue-of-Their-Growls-pone.0015175.s006.ogg | first 2.0 s | Faragó T, Pongrácz P, Miklósi Á, Huber L, Virányi Z, Range F | CC BY 2.5 |
| `fox_yip.wav` | "Bellender Fuchs.ogg" (barking red fox) | https://commons.wikimedia.org/wiki/File:Bellender_Fuchs.ogg | first call, 1.0 s | Jugrü | CC BY-SA 3.0 |
| `baby_soft_cry.wav` | "Crying newborn baby.ogg" | https://commons.wikimedia.org/wiki/File:Crying_newborn_baby.ogg | 13.0 to 16.5 s | the_yura | CC0 (no credit required) |
| `saap_hiss.wav` | "Alligatorhiss.ogg" (American alligator hiss; no monitor-lizard or snake hiss recording was found on Commons) | https://commons.wikimedia.org/wiki/File:Alligatorhiss.ogg | 1.60 to 2.84 s (1.24 s); high-passed at 450 Hz, de-clicked, 0.08 s fade in, 0.45 s fade out, levelled to -16.3 LUFS (matches the placeholder), true peak -1.8 dBTP | U.S. Fish and Wildlife Service (federal employee; uploaded by Borisblue) | Public domain (PD-USGov-FWS, no credit required) |
| `dog_pant.wav` | "Viltspar hund med skank.oga" (Basset Hound after tracking) | https://commons.wikimedia.org/wiki/File:Viltspar_hund_med_skank.oga | 13.33 to 16.27 s (2.94 s loop); band-passed 250 Hz to 6 kHz, light noise reduction, 20 ms loop crossfade, levelled to -24.2 LUFS, peak -4.4 dBFS | Cali1008 | Public domain (PD-self, no credit required) |

**Suggested credit line for the Episode 2 video description** (copied as written in the README):

> Sound effects: 'Barking of a dog' by Amada44 (CC BY-SA 3.0); dog growl by Faragó et al., PLoS ONE 2010 (CC BY 2.5); 'Bellender Fuchs' by Jugrü (CC BY-SA 3.0); all via Wikimedia Commons.

`baby_soft_cry.wav` (CC0), `saap_hiss.wav` and `dog_pant.wav` (public domain) are not in the credit line; adding
them is optional.

**Still placeholders (generated, not recordings):** `cow_moo.wav`. When a recording replaces it, add it to this table and to the credit line.

**Not yet placed:** `dog_pant.wav` has no cue in `src/episode02/Episode02.tsx` yet.

---

## Licence obligations

- **CC BY** (for example CC BY 2.5): credit the author, name the licence and link to the source. The video description credit line covers this.
- **CC BY-SA** (for example CC BY-SA 3.0): credit exactly as for CC BY. In addition, if the sound itself is changed (trimmed, filtered, pitched, mixed into a new sound file) and that changed sound is shared on its own, it must be shared under the same licence (share alike).
- **CC0**: no credit and no conditions. Recording the source here is still required so the origin is traceable.
- Only CC0, CC BY and CC BY-SA recordings from Wikimedia Commons are used (SFX-02). Do not add a recording under any other licence.

---

## How to add new entries (per episode)

1. Fetch the recording through the web-fetch agent, not plain curl, and never put the user's email in a User-Agent (WEB-01, WEB-02).
2. Drop it into the episode's sound folder under the placeholder's file name (SFX-06), and record source, author and licence in that folder's README (SFX-03).
3. In the same session, add or extend the episode's section here: file name, source recording title, source URL, part used (seconds), author, licence.
4. Write or update the episode's suggested credit line, covering every CC BY and CC BY-SA recording (SFX-04).
5. Remove the file from the episode's "still placeholders" list.
6. If a recording is replaced or dropped, strike its row through and note the date; do not delete it silently.

---

## Episode 3

Added 2026-11-21. Files in `remotion_studio/public/audio/sfx/ep03/` (production worktree); details and trims in that
folder's `README.md`. 48 kHz mono 16-bit WAV, levelled to about -24 LUFS. Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| girls_giggle.wav | "Short clip of girl laughing.wav" (originally from Freesound) | https://commons.wikimedia.org/wiki/File:Short_clip_of_girl_laughing.wav | 0.04 to 1.24 s (1.20 s; one girl, four soft rising giggles) | lmbubec | CC0 |
| water_pour.wav | "Water flowing pouring trickling.ogg" (basin poured into a bucket; PDSounds record 221) | https://commons.wikimedia.org/wiki/File:Water_flowing_pouring_trickling.ogg | 21.80 to 22.55 s joined to 90.10 to 92.45 s with a 0.12 s crossfade, low-passed at 7 kHz (2.98 s) | stephan (transferred by Fæ) | Public domain |

No recording of several girls giggling together, and none of water poured onto soil, was found on Commons
(2026-11-21); the closest clean recordings above were used.

**Suggested credit line for the Episode 3 video description:** none required (CC0 and public domain). Optional:

> Sound effects: girl's giggle by lmbubec (CC0); water pour by stephan (public domain); via Wikimedia Commons.

---

## Episode 4

Added 2026-11-21. Files in `remotion_studio/public/audio/sfx/ep04/` (production worktree); details, trims and
rejected candidates in that folder's `README.md`. 48 kHz mono 16-bit WAV; one-shots levelled to about -24 LUFS,
the loop to -30 LUFS. Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| brass_tap.wav | "Tibetan Singing Bowl hit 4.5inch.flac" (small metal bowl struck once) | https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac | 0.08 to 1.38 s (1.30 s); high-passed at 120 Hz, ring damped at 55 dB/s from 0.12 s to read as a light tap on a brass plate | דג בלי מלח (Commons user, own work) | CC BY-SA 4.0 |
| drink_gulp.wav | "Drinking a glass of wat.ogg" ("Drinking a glass of water", PDSounds record 680) | https://commons.wikimedia.org/wiki/File:Drinking_a_glass_of_wat.ogg | 7.75 to 9.95 s (2.20 s; one long gulp and a small swallow); band-limited 80 Hz to 7 kHz, light noise reduction, -6 dBFS limiter | ezwa (transferred by Fæ) | Public domain |
| pond_water.wav | "17650 thoschi issyk-kul.ogg" (Lake Issyk-Kul shore, originally Freesound 17650) | https://commons.wikimedia.org/wiki/File:17650_thoschi_issyk-kul.ogg | 134.5 to 144.5 s, made into a 9.50 s loop (last 0.5 s crossfaded over the start); high-passed at 80 Hz | thoschi | CC0 |

No recording of a tap on a brass plate, of a child drinking in one gulp, or of a bird-free pond bank was found on
Commons (2026-11-21); the closest clean recordings above were used.

**Suggested credit line for the Episode 4 video description:**

> Sound effects: 'Tibetan Singing Bowl hit 4.5inch' by דג בלי מלח (CC BY-SA 4.0), via Wikimedia Commons.

Optional (no credit required): drinking water by ezwa (public domain); Issyk-Kul lake shore by thoschi (CC0).

---

## Episode 5

Added 2026-11-22. Files in `remotion_studio/public/audio/sfx/ep05/` (production worktree); trims, filters, levels and
rejected candidates in that folder's `README.md`; the downloaded originals and the build recipe
(`build_ep05_sfx.py`) in its `_source/` folder. 48 kHz mono 16-bit WAV, sample peak at most -6 dBFS; one-shots
-24 to -30 LUFS, the loop -27 LUFS. Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `shell_scrape.wav` | "Dragging a hose once (Gravity Sound).wav" | https://commons.wikimedia.org/wiki/File:Dragging_a_hose_once_(Gravity_Sound).wav | 1.25 to 2.05 s (the scrape); filtered 150 Hz to 3.2 kHz, slowed to 0.8x | Gravity Sound | CC BY 4.0 |
| `shell_scrape.wav` | "Hollow log knocking (Gravity Sound).wav" | https://commons.wikimedia.org/wiki/File:Hollow_log_knocking_(Gravity_Sound).wav | 3.17 to 3.47 s (one knock, at 1.02 s in the file); low-passed 1.8 kHz, -12 dB | Gravity Sound | CC BY 4.0 |
| `vine_tear.wav` | "Rustling leaves (Gravity Sound).wav" | https://commons.wikimedia.org/wiki/File:Rustling_leaves_(Gravity_Sound).wav | 2.05 to 3.85 s (the leafy pull); filtered 150 Hz to 5 kHz | Gravity Sound | CC BY 4.0 |
| `vine_tear.wav`, `cow_munch.wav` | "Tearing mint.ogg" (PDSounds record 570) | https://commons.wikimedia.org/wiki/File:Tearing_mint.ogg | vine_tear: 5.70 to 6.40 s (stem snaps, 0.9x); cow_munch: five tears (1.13 to 1.55, 12.70 to 13.09, 18.93 to 19.30, 7.64 to 7.88, 17.35 to 17.60 s), 0.7x, filtered 400 Hz to 3.5 kHz, gated | hugh | Public domain |
| `bamboo_thump.wav` | "Hollow stick hit 2 (Gravity Sound).wav" | https://commons.wikimedia.org/wiki/File:Hollow_stick_hit_2_(Gravity_Sound).wav | 0.625 to 0.925 s (the hit); low-passed 3.5 kHz | Gravity Sound | CC BY 4.0 |
| `bamboo_thump.wav` | "Land in Gravel (Gravity Sound).mp3" | https://commons.wikimedia.org/wiki/File:Land_in_Gravel_(Gravity_Sound).mp3 | 0.055 to 0.175 s (low thud only, low-passed 450 Hz, -4 dB) | Gravity Sound | CC BY 4.0 |
| `cow_breath.wav` | "Horse sound effect.wav" (via Commons' MP3 transcode) | https://commons.wikimedia.org/wiki/File:Horse_sound_effect.wav | 110.25 to 111.05 s (one soft breath); filtered 200 Hz to 3 kHz, lowered to 0.85x, tempo 0.8x (1.20 s) | Zagzav12 | CC0 |
| `banana_leaves.wav` | "Bourne woods windy 2020-05-05 0757.mp3" | https://commons.wikimedia.org/wiki/File:Bourne_woods_windy_2020-05-05_0757.mp3 | 17.0 to 33.6 s; filtered 180 Hz to 1.9 kHz (48 dB/oct, removes the birdsong); 15.0 s seamless loop | Robert EA Harvey | CC BY-SA 4.0 |

No tortoise or turtle shell sound, no cow chewing or tearing grass, no cow breath or snort, no bamboo pole on earth
and no broad leaves in a breeze were found on Commons (2026-11-22). `cow_munch.wav` is a constructed stand-in (leaf
tears pitched down), `cow_breath.wav` is a horse's breath, and the others are built from the closest real recordings
above. The director should listen to them before they are cued.

**Suggested credit line for the Episode 5 video description:**

> Sound effects: 'Dragging a hose once', 'Hollow log knocking', 'Rustling leaves', 'Hollow stick hit 2' and 'Land in Gravel' by Gravity Sound (CC BY 4.0); 'Bourne woods windy 2020-05-05' by Robert EA Harvey (CC BY-SA 4.0); via Wikimedia Commons.

Optional (no credit required): tearing mint by hugh (public domain); horse breath by Zagzav12 (CC0). Only the
recordings whose files are actually cued need to stay in the final credit line.

## Episode 5 music

Added 2026-11-22. Files in `remotion_studio/public/audio/music/ep05/` (production worktree); lengths, levels, loop
points and uses in that folder's `README.md`; the downloaded originals and the build recipe (`build_ep05_music.py`)
in its `_source/` folder. 48 kHz stereo 16-bit WAV; loops -24 LUFS (low drone -28), one-shots -20 LUFS, true peak at
most -3 dBTP. Series key Sa = C (`tanpura_drone_cs.wav` in C# for under Divine_Motif). Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `tanpura_drone.wav`, `tanpura_drone_low.wav`, `tanpura_drone_cs.wav` | "Tanpura 10" (Freesound 153262) | https://freesound.org/people/sankalp/sounds/153262/ | 9.00 to 40.82 s; -1 semitone for the C versions; low version low-passed with an octave-down layer | sankalp | CC0 |
| `play_plucks.wav` | "Harp Tinkly Riff 1.wav" (Freesound 415429, swarmandal) | https://freesound.org/people/luckylittleraven/sounds/415429/ | 0.04 to 7.79 s plus ring; -1 semitone | luckylittleraven | CC0 |
| `cheeky_pluck_1.wav`, `cheeky_pluck_4.wav` (and `cheeky_plucks.wav`) | "Harp Tinkly Riff 2.wav" (Freesound 415432) | https://freesound.org/people/luckylittleraven/sounds/415432/ | 0.03 to 2.40 s; 7.66 to 9.88 s; -1 semitone | luckylittleraven | CC0 |
| `cheeky_pluck_2.wav` | "Harp Short 4.wav" (Freesound 415477) | https://freesound.org/people/luckylittleraven/sounds/415477/ | 0.03 to 2.30 s; -1 semitone | luckylittleraven | CC0 |
| `cheeky_pluck_3.wav` | "Harp Whimsical Riff.wav" (Freesound 415433) | https://freesound.org/people/luckylittleraven/sounds/415433/ | 1.48 to 2.78 s; -1 semitone | luckylittleraven | CC0 |
| `tabla_soft.wav`, `tabla_run.wav`, `tension_rise.wav`, `drum_hit_low.wav`, `drum_pulse.wav`, `drum_pulse_fast.wav` | "Tabla drums demo.oga" | https://commons.wikimedia.org/wiki/File:Tabla_drums_demo.oga | 47.47 to 57.34 s (loop); 13.47 to 16.15 s (run, roll); bass stroke 106.84 to 108.69 s, pitched down for the hit and pulses | tabladrumsonline | CC BY-SA 3.0 |
| `tension_rise.wav`, `drum_hit_low.wav`, `drum_pulse.wav`, `drum_pulse_fast.wav` | "DHOL BEAT.wav" | https://commons.wikimedia.org/wiki/File:DHOL_BEAT.wav | 82.00 to 83.30 s (low-passed rumble); 53.20 to 53.36 s (stroke attack) | Johnny Kalsi | CC BY 3.0 |
| `bansuri_relief.wav`, `bansuri_compassion.wav` | "Indian Folk Classical Flute Music (2).wav" | https://commons.wikimedia.org/wiki/File:Indian_Folk_Classical_Flute_Music_(2).wav | 26.85 to 37.25 s; 2.35 to 10.40 s; -2.92 semitones, high-passed 240 Hz, light noise reduction | MayankSingh33 | CC BY-SA 4.0 |

The Freesound files were fetched as Freesound's public HQ previews (192 kbps OGG of the original), as the WAV
downloads need a login. Changed versions of CC BY-SA sounds are shared under the same licence. The series music
(Theme_Intro_Bansuri, Warm_Family_Flute and the other loops in `music/`) is synthesised by `scripts/synthesize_audio.py`
and needs no credit.

**Suggested credit line for the Episode 5 video description** (keep only what is cued):

> Music recordings: 'Tabla drums demo' by tabladrumsonline (CC BY-SA 3.0); 'DHOL BEAT' by Johnny Kalsi (CC BY 3.0); 'Indian Folk Classical Flute Music (2)' by MayankSingh33 (CC BY-SA 4.0); via Wikimedia Commons. Tanpura by sankalp and swarmandal by luckylittleraven (CC0), via Freesound.
