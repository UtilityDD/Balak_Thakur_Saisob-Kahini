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

---

## Episode 6

Added 2026-11-22 (preparation pass; the Episode 6 plan is still a draft). Files in
`remotion_studio/public/audio/sfx/ep06/` (production worktree); trims, filters, levels, suggested volumes and rejected
candidates in that folder's `README.md`; the downloaded originals and the build recipe (`build_ep06_sfx.py`) in its
`_source/` folder. 48 kHz mono 16-bit WAV, sample peak at most -6 dBFS; one-shots -25 to -35 LUFS, the loop -27 LUFS.
Freesound files were fetched as Freesound's public HQ previews (192 kbps OGG of the original). Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `khadam_earth.wav`, `khadam_step_1.wav` to `khadam_step_3.wav` | "Het rustig lopen van een man op klompen - SoundCloud - Beeld en Geluid.ogg" (a man walking in Dutch wooden clogs) | https://commons.wikimedia.org/wiki/File:Het_rustig_lopen_van_een_man_op_klompen_-_SoundCloud_-_Beeld_en_Geluid.ogg | 8 single steps (8.19 to 14.98 s) re-spaced at about 0.66 s over the recording's background from 22.6 s; singles at 8.81, 9.45, 12.49 s; filtered 180 Hz to 2.4 kHz, 0.92x | Beeld en Geluid | CC BY-SA 3.0 |
| `khadam_floor.wav`, `khadam_floor_step_1.wav`, `khadam_floor_step_2.wav` | "JK Clogs on Concrete.wav" (Freesound 85110) | https://freesound.org/people/cmusounddesign/sounds/85110/ | 0.38 to 4.70 s (8 steps); singles at 1.04 and 2.13 s; filtered 120 Hz to 5 kHz, 0.95x | cmusounddesign | CC BY 4.0 |
| `child_sniff.wav`, `child_sniff_1.wav` | "Sniffles.wav" (Freesound 467203) | https://freesound.org/people/ThunderQuads/sounds/467203/ | 0.40 to 0.88 s and 3.27 to 3.75 s; filtered 250 Hz to 9 kHz, raised 1.12x | ThunderQuads | CC0 |
| `children_far_loop.wav` | "209901 foongaz city-playground-boxhagenerplatz-berlin.wav" (from Freesound 209901; via Commons' MP3 transcode) | https://commons.wikimedia.org/wiki/File:209901_foongaz_city-playground-boxhagenerplatz-berlin.wav | 16.0 to 48.5 s; filtered 350 Hz to 2.2 kHz (no intelligible words), compressed; 30.0 s seamless loop | foongaz | CC0 |
| `ball_thump.wav` | "Big ball bounce" (Freesound 873899) | https://freesound.org/people/cb9382/sounds/873899/ | bounces at 2.15, 3.48, 0.74 s, low-passed 700 Hz | cb9382 | CC0 |
| `marbles_click.wav` | "FX_MARBLES_IN_HAND_MOVING.wav" (Freesound 238889) | https://freesound.org/people/Olichite/sounds/238889/ | 22.40 to 23.40 s | Olichite | CC0 |
| `marbles_click.wav` | "FX_MARBLES_BAG_DROP_ON_CARPET.wav" (Freesound 238887) | https://freesound.org/people/Olichite/sounds/238887/ | 9.50 to 10.25 s (at 0.92 s in the file) | Olichite | CC0 |
| `coins_palm.wav` | "Coins 1 (Gravity Sound).mp3" | https://commons.wikimedia.org/wiki/File:Coins_1_(Gravity_Sound).mp3 | 0.08 to 0.68 s (two coins), high-passed 300 Hz | Gravity Sound | CC BY 4.0 |
| `paper_twist.wav` | "Paper Bag" (Freesound 220941) | https://freesound.org/people/nebulousflynn/sounds/220941/ | 32.85 to 34.75 s, high-passed 200 Hz | nebulousflynn | CC BY 4.0 |
| `jar_lid.wav`, `jar_lid_up.wav`, `jar_lid_down.wav` | "cookie jar large glass with wood lid open close.flac" (Freesound 453847) | https://freesound.org/people/kyles/sounds/453847/ | lift 0.28 to 1.08 s; set-down 8.85 to 9.45 s | kyles | CC0 |

No khadam or Japanese geta recording exists on Commons or Freesound (2026-11-22); Dutch wooden clogs (klompen) are
the closest real sound. No small child's sniff was found (`child_sniff` is an adult's cold sniffle raised in pitch),
no paper twist as such (a paper bag crinkled shut) and no marbles on cloth (a bag of marbles on carpet). The director
should listen to the khadam and the sniff before they are cued. Changed versions of CC BY-SA sounds are shared under
the same licence.

**Suggested credit line for the Episode 6 video description** (keep only what is cued):

> Sound effects: 'Het rustig lopen van een man op klompen' by Beeld en Geluid (CC BY-SA 3.0) and 'Coins 1' by Gravity Sound (CC BY 4.0), via Wikimedia Commons; 'JK Clogs on Concrete' by cmusounddesign and 'Paper Bag' by nebulousflynn (CC BY 4.0), via Freesound.

Optional (no credit required): playground by foongaz, sniffles by ThunderQuads, big ball bounce by cb9382, marbles by
Olichite, cookie jar by kyles (all CC0).

### Episode 6 immersive re-cut sound effects (STO-22a)

Added 2026-11-23 for the re-cut's wordless moments (hens, crow, sparrow, goat, the off-screen dog, the plate and slate,
the heartbeat). Same folder, format and method as above; details, onsets and suggested volumes in the folder's
`README.md` ("Immersive re-cut"), originals and the recipe (`build_ep06_recut_sfx.py`) in `_source/`. Not yet placed in
code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `hens_cluck_loop.wav` | 'Two Chickens "Talking"' (Freesound 253649) | https://freesound.org/people/SquaredGlasses/sounds/253649/ | call phrases 1.35 to 17.30 s re-sequenced (two re-used at 1.06x and 0.95x); 24 s seamless loop | SquaredGlasses | CC BY 3.0 |
| `hens_cluck_loop.wav` | "Chicken 01.wav" (a domestic chicken, Kerala, India) | https://commons.wikimedia.org/wiki/File:Chicken_01.wav | 0.30 to 9.30 s, tiled under the above at -7 dB | Ganesh Mohan T | CC BY-SA 4.0 |
| `hens_scatter.wav` | "Hens leaving coop.ogg" | https://commons.wikimedia.org/wiki/File:Hens_leaving_coop.ogg | wing flurries 6.80 to 7.55 s and 5.40 to 6.05 s | alys (PDSounds) | Public domain |
| `hens_scatter.wav` | "excited chickens" (Freesound 178096) | https://freesound.org/people/Setuniman/sounds/178096/ | cackles 0.85 to 1.33 s and 8.04 to 8.56 s | Setuniman | CC BY 4.0 |
| `crow_caw.wav`, `crow_takeoff.wav` | "Corvus splendens.ogg" (house crows, India) | https://commons.wikimedia.org/wiki/File:Corvus_splendens.ogg | 1.30 to 2.72 s (two calls); the call at 2.72 to 3.24 s | Vladimir Yu. Arkhipov | CC BY-SA 3.0 |
| `crow_takeoff.wav` | "Pigeon, Flies Away, Flapping Wings" (Freesound 689998) | https://freesound.org/people/Kinoton/sounds/689998/ | 0.35 to 2.84 s, slowed to 0.86x | Kinoton | CC0 |
| `sparrow_chirp.wav` | "House Sparrow.ogg" (India) | https://commons.wikimedia.org/wiki/File:House_Sparrow.ogg | 9.85 to 11.75 s (three chirps) | Gypsypkd | Public domain |
| `goat_bleat.wav` | "Single Goat Bleating 2x" (Freesound 581240) | https://freesound.org/people/Kinoton/sounds/581240/ | first bleat, 0.22 to 1.42 s | Kinoton | CC0 |
| `dog_bark.wav` | "Morning Dog barking far2" (Freesound 723812; a rural village) | https://freesound.org/people/Balaram_Mahalder/sounds/723812/ | 16.40 to 18.10 s (two far barks), filtered 300 Hz to 4 kHz | Balaram_Mahalder | CC0 |
| `plate_clink.wav`, `plate_clink_1.wav` | "small brass sound bowl strike and ring - 3" (Freesound 762646) | https://freesound.org/people/FOSSarts/sounds/762646/ | the strike at 0.26 s, ring damped (62 and 70 dB/s) into two plate taps | FOSSarts | CC0 |
| `slate_tap.wav` | "Brick pick up and put down close mic.aiff" (Freesound 483409) | https://freesound.org/people/vintage2005/sounds/483409/ | the set-down at 7.33 to 7.78 s | vintage2005 | CC0 |
| `slate_tap.wav` | "tap_on_chalkboard.wav" (Freesound 258092) | https://freesound.org/people/joedeshon/sounds/258092/ | the whole tap, twice | joedeshon | CC0 |
| `heartbeat_soft.wav` | "Athletic bradycardia wav.wav" (a resting heart, stethoscope) | https://commons.wikimedia.org/wiki/File:Athletic_bradycardia_wav.wav | beats at 1.88, 3.31, 4.73, 6.10 s re-spaced to 60 bpm, low-passed 500 Hz | Athletearrhythmia | CC0 |

Stand-ins: the crow's wings are a pigeon's (slowed), the slate set-down is a brick on a hard counter with chalk taps
for the slate pencil, the brass-plate tap is a small brass bowl with its ring damped. No crow take-off, thali or
writing-slate recording was found on Commons or Freesound (2026-11-23).

**Suggested credit line, re-cut additions** (keep only what is cued):

> 'Chicken 01' by Ganesh Mohan T (CC BY-SA 4.0) and 'Corvus splendens' by Vladimir Yu. Arkhipov (CC BY-SA 3.0), via Wikimedia Commons; 'Two Chickens "Talking"' by SquaredGlasses (CC BY 3.0) and 'excited chickens' by Setuniman (CC BY 4.0), via Freesound.

Optional (no credit required): hens leaving coop by alys and house sparrow by Gypsypkd (public domain); pigeon wings and
goat by Kinoton, village dog by Balaram_Mahalder, brass bowl by FOSSarts, brick by vintage2005, chalk tap by joedeshon,
heartbeat by Athletearrhythmia (all CC0).

---

## Ghibli life kit

Added 2026-11-25 (STO-22b, the immersive Ghibli world layer; shared by all episodes). Files in
`remotion_studio/public/audio/sfx/ghibli_life/` (production worktree); trims, filters, levels, suggested volumes and
rejected candidates in that folder's `README.md`; the downloaded originals (each with a `meta.json`) and the build
recipe (`build_ghibli_life_sfx.py`, reproduces every file bit for bit) in its `_source/` folder. 48 kHz mono 16-bit
WAV, sample peak at most -6 dBFS; calls -25 to -32 LUFS, loops -27 to -30 LUFS, transients peak-levelled. Freesound
files were fetched as Freesound's public HQ previews (192 kbps OGG of the original). Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `ducks_quack.wav` | "Ducks" (Freesound 416519) | https://freesound.org/people/Zandtekenaar/sounds/416519/ | quacks 6.98 to 7.46, 15.40 to 15.85 (0.93x), 8.06 to 8.52 s | Zandtekenaar | CC0 |
| `water_glide.wav` | "Slow Quiet Water Ripples (remix of 338345)" (Freesound 634753) | https://freesound.org/people/Thimblerig/sounds/634753/ | 8.60 to 32.60 s, 24 s loop | Thimblerig | CC BY 4.0 |
| `water_glide.wav` | "Splashing Water by Oars.wav" (Freesound 338345; the original of the remix above) | https://freesound.org/people/Lubini/sounds/338345/ | (via the remix) | Lubini | CC BY 4.0 |
| `fish_plop.wav` | "Järven ranta, kalat pulahtelevat / Lakeside ... small fish plopping" (Freesound 272366) | https://freesound.org/people/YleArkisto/sounds/272366/ | the plop at 52.78 to 53.28 s | YleArkisto (Yle archive) | CC BY 4.0 |
| `kingfisher_call.wav` | "White-throated kingfisher song recorded in April 2022 at Haripur, Sangli.wav" | https://commons.wikimedia.org/wiki/File:White-throated_kingfisher_song_recorded_in_April_2022_at_Haripur,_Sangli.wav | 2.10 to 3.75 s (two trills) | Sharadapte | CC BY-SA 4.0 |
| `small_splash.wav` | "Splash, Small, A.wav" (Freesound 416710) | https://freesound.org/people/InspectorJ/sounds/416710/ | 0.40 to 1.40 s, 1.08x | InspectorJ | CC BY 4.0 |
| `frog_croak.wav` | "Frog croaking after rain, Kerala.wav" | https://commons.wikimedia.org/wiki/File:Frog_croaking_after_rain,_Kerala.wav | croaks 19.30 to 20.05 and 21.18 to 22.02 s | Vis M | CC BY-SA 4.0 |
| `pond_lapping_loop.wav` | "Tiny waves lapping #3" (Freesound 464801) | https://freesound.org/people/guyburns/sounds/464801/ | 6.0 to 36.0 s, 28 s loop | guyburns | CC0 |
| `rooster_crow.wav` | "rooster crows in the village" (Freesound 627335) | https://freesound.org/people/Garuda1982/sounds/627335/ | the crow at 31.95 to 34.35 s | Garuda1982 | CC0 |
| `dawn_birds_loop.wav` | "2025-04-28_Birbhum_Birdsong_EarlyMorning_SB" (Freesound 804625; Birbhum, West Bengal) | https://freesound.org/people/amuzix/sounds/804625/ | 4.0 to 36.0 s, 30 s loop | amuzix | CC BY 4.0 |
| `pigeons_coo.wav` | "Blue rock pigeon song recorded in May 2012 at Sangli.wav" | https://commons.wikimedia.org/wiki/File:Blue_rock_pigeon_song_recorded_in_May_2012_at_Sangli.wav | coos 1.30 to 2.15 and 3.45 to 4.35 s | Sharadapte | CC BY-SA 4.0 |
| `pigeon_flutter.wav` | "Pigeon, Flies Away, Flapping Wings" (Freesound 689998) | https://freesound.org/people/Kinoton/sounds/689998/ | 0.80 to 3.00 s | Kinoton | CC0 |
| `gecko_tiktiki.wav` | "HouseGeckoChirp.ogg" (Hemidactylus frenatus) | https://commons.wikimedia.org/wiki/File:HouseGeckoChirp.ogg | 0.60 to 3.20 s (nine chirps) | Glueball | CC BY-SA 3.0 |
| `squirrel_chirp.wav` | "Indian palm squirrel sound.wav" (Kerala) | https://commons.wikimedia.org/wiki/File:Indian_palm_squirrel_sound.wav | 4.40 to 6.60 s | Ganesh Mohan T | CC BY-SA 4.0 |
| `night_crickets_loop.wav` | "Crickets at Night" (Freesound 502907; a village in Western India) | https://freesound.org/people/hungryrj/sounds/502907/ | 4.0 to 36.0 s, 30 s loop | hungryrj | CC0 |
| `moth_flutter.wav` | "Moth flies in nocturnal polder 0149 240802_0877" (Freesound 806457) | https://freesound.org/people/klankbeeld/sounds/806457/ | 0.00 to 2.50 s | klankbeeld | CC BY 4.0 |
| `cow_bell_distant.wav` | "Cowbells from Karnataka being played at Janapada Loka.oga" | https://commons.wikimedia.org/wiki/File:Cowbells_from_Karnataka_being_played_at_Janapada_Loka.oga | single strokes at 10.61, 11.35, 12.05 s | Subhashish Panigrahi | CC BY-SA 4.0 |
| `wind_leaves.wav` | "the rush in the trees" (Freesound 706661) | https://freesound.org/people/37735i6/sounds/706661/ | 0.30 to 16.00 s, 14 s loop | 37735i6 | CC0 |

Stand-ins: `small_splash` is a small water-filled toy thrown into a pool (no free recording of a kingfisher's dive),
`water_glide` is soft oar ripples (no duck paddling), `pond_lapping_loop` is small lake waves (no ghat steps). Not
found under a free licence: an Indian bullfrog (the Kerala pond frog stands in), a Bengal rooster, a dragonfly buzz
(optional; not made, `moth_flutter` at 0.15 is the nearest). Changed versions of the CC BY-SA sounds must be shared
under the same licence.

**Suggested credit line** (keep only what is cued):

> 'White-throated kingfisher song ... Haripur, Sangli' and 'Blue rock pigeon song ... Sangli' by Sharadapte, 'Frog croaking after rain, Kerala' by Vis M, 'Indian palm squirrel sound' by Ganesh Mohan T and 'Cowbells from Karnataka being played at Janapada Loka' by Subhashish Panigrahi (CC BY-SA 4.0), 'HouseGeckoChirp' by Glueball (CC BY-SA 3.0), via Wikimedia Commons; 'Birbhum Birdsong Early Morning' by amuzix, 'Slow Quiet Water Ripples' by Thimblerig (from 'Splashing Water by Oars' by Lubini), 'Lakeside, small fish plopping' by YleArkisto, 'Splash, Small, A' by InspectorJ and 'Moth flies in nocturnal polder' by klankbeeld (CC BY 4.0), via Freesound.

Optional (no credit required): ducks by Zandtekenaar, waves lapping by guyburns, village rooster by Garuda1982, pigeon
wings by Kinoton, Indian village crickets by hungryrj, wind in trees by 37735i6 (all CC0).

---

## Ghibli Episode 5 rewrite

Added 2026-11-26 for the Ghibli rewrite of Episode 5 (blueprint section 6, "Complete Audio Architecture", list B
items 1 to 5, plus real replacements for the generated `ep02/clay_thud`, `ep02/footsteps_mud` and `ep02/birds_village`
it cues). Files in `remotion_studio/public/audio/sfx/ep05_rewrite/` (production worktree); trims, filters, levels,
suggested volumes, stand-ins and rejected candidates in that folder's `README.md`; the downloaded originals (each with
a `meta.json`) and the build recipe (`build_ep05_rewrite_sfx.py`, reproduces every file bit for bit) in its
`_source/` folder. 48 kHz mono 16-bit WAV, sample peak at most -6 dBFS; calls and beds -28 to -32 LUFS, the shell
knock and the step runs peak-levelled. Freesound files were fetched as Freesound's public HQ previews (192 kbps OGG of
the original). Not yet placed in code.

| File | Source recording | Source URL | Part used | Author | Licence |
|---|---|---|---|---|---|
| `adults_murmur_laugh.wav` | "Family Meal Babbling 2.wav" (Freesound 32368) | https://freesound.org/people/Walter_Odington/sounds/32368/ | 58.60 to 72.10 s, low-passed 1.4 kHz, 12 s loop | Walter_Odington | CC0 |
| `run_barefoot_pair.wav`, `run_barefoot_single.wav` | "Running barefoot, Foley" (Freesound 850273) | https://freesound.org/people/Wigglesworth/sounds/850273/ | 0.95 to 3.35 s (0.94x) + 4.95 to 7.35 s (1.06x); 7.70 to 9.75 s (0.92x) | Wigglesworth | CC0 |
| `shell_knock.wav` | "Coconut Shell Galloping 02" (Freesound 879311) | https://freesound.org/people/loganzsound/sounds/879311/ | clicks at 4.33 and 4.64 s, 0.75x | loganzsound | CC0 |
| `tortoise_scrabble.wav` | "Hand digging dirt, leaves crunch.wav" (Freesound 260130) | https://freesound.org/people/SpliceSound/sounds/260130/ | 0.10 to 2.30 s, 1.1x | SpliceSound | CC0 |
| `tortoise_hiss_soft.wav` | "Reptiles - Snake; Mexican Black Kingsnake, Short Hiss and Lunge" (Freesound 846337) | https://freesound.org/people/TheKingOfGeeks360/sounds/846337/ | 0.07 to 0.43 s, 0.6x | TheKingOfGeeks360 | CC0 |
| `chil_kite_call.wav` | "Black kite song recorded in March 2022 at Pune.wav" | https://commons.wikimedia.org/wiki/File:Black_kite_song_recorded_in_March_2022_at_Pune.wav | 6.00 to 9.50 s (two calls) | Sharadapte | CC BY-SA 4.0 |
| `afternoon_birds_loop.wav` | "Nasik Ambience.wav" (Freesound 584126; afternoon, Nasik, India) | https://freesound.org/people/seventhsamurai/sounds/584126/ | 43.0 to 75.0 s, 30 s loop | seventhsamurai | CC0 |
| `quill_scratch.wav` | "Quill pen writing on hard paper various speed.wav" (Freesound 194905) | https://freesound.org/people/marcoman89/sounds/194905/ | 5.40 to 10.10 s | marcoman89 | CC0 |
| `palm_fan_flap.wav` | "Fluttering Chinese Fan 01" (Freesound 508674) | https://freesound.org/people/leonelmail/sounds/508674/ | six single flaps (4.83 to 5.90 s), 0.6x, set 0.45 s apart | leonelmail | CC0 |

Stand-ins (no free recording of the real thing): `shell_knock` is a coconut shell (no tortoise shell),
`tortoise_scrabble` a hand scratching earth (no tortoise claws), `tortoise_hiss_soft` a kingsnake's hiss slowed (no
tortoise hiss), `palm_fan_flap` single flaps of a paper fan slowed and spaced out (no palm-leaf or slow hand fanning),
the runs a barefoot foley run low-passed for earth (no outdoor barefoot run), `adults_murmur_laugh` a restaurant family
meal low-passed until no language can be heard (no Bengali domestic chat). Changed versions of the CC BY-SA sound
must be shared under the same licence.

**Suggested credit line** (only if `chil_kite_call` is cued):

> 'Black kite song recorded in March 2022 at Pune' by Sharadapte (CC BY-SA 4.0), via Wikimedia Commons.

Optional (no credit required): family meal talk by Walter_Odington, barefoot running by Wigglesworth, coconut shells
by loganzsound, digging in earth by SpliceSound, kingsnake hiss by TheKingOfGeeks360, Nasik afternoon by
seventhsamurai, quill writing by marcoman89, fluttering fan by leonelmail (all CC0, via Freesound).
