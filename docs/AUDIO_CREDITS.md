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
