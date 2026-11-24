# Episode 4: cinematic music cue sheet (2026-11-22)

The director asked to bring the new Episode 5 music into Episode 4 too (AUD-07): situation-led scoring with Indian
instruments, gentle and devotional. Episode 4 is three short mischief stories told with a smile: playful, a little
suspense at the coconut water, never fear. One glow beat only, on Thakurma's prophecy (STO-19 answer 6). Rules kept:
the narration stays clear (AUD-01); music ducks under every voice and rises in the pauses (AUD-06); loops at 0.25 or
below (AUD-03), one-shots 0.15 to 0.45 (AUD-02); voices at -16 LUFS. Music under a voice sits about 20 to 24 dB below
it (about -36 to -40 LUFS), in the pauses 13 to 18 dB below (about -29 to -34); the tanpura drones lower still, as a
floor.

Setting: the Vedic house (STO-19): the inner courtyard at the morning puja, the pond with the mandar tree, the
courtyard in the afternoon, the shrine room at the full-moon abhishek. The scene SFX (Charu's bell, the brass taps,
the clay pats, the blossom plop, the runner's steps, the priest's bells, the drink_gulp, the bowl set down), the
shimmer on the glow, the chapter-break chimes and the intro and outro template sounds are unchanged.

Code: `remotion_studio/src/episode04/Episode04.tsx`, `MUSIC_CUES` (exported as `EP04_MUSIC_CUES`), anchored to
narration phrases, the voice clips (`clipSpan4`), the scenes' exported events (`SCENE01_EVENTS`, `S03_SOUND_EVENTS`),
the action-gap beats (`EP04_GAPS`), the 02 dissolve and the pauses; levels are LUFS targets turned into volumes from
each file's measured loudness. Files: `public/audio/music/ep05/` (README there: Sa = C; `tanpura_drone_cs` is in C#
for under the Divine_Motif) and the series music in `public/audio/music/`. The scenes' music moved out of the beds
(Village_Peace_Loop in 01 and 03, the Warm_Family_Flute bed in 02, the separate Divine_Motif block) into this sheet;
the beds keep the ambience (birds, wind, pond water, the lantern hush).

Frames are absolute Episode04 frames on today's timing (scene 01 starts 635, CB1 1400, scene 02 1424, CB2 2066,
scene 03 2090, the outro 2692); the code follows the cues if the timing is rebuilt.

## Intro and source card (0 to 659)
Unchanged series template: `Theme_Intro_Bansuri` (0.14 open, 0.08 under the voice) and the opening `chime_pop`.

## Story 1, scene 01: the clay Shiva and the painted doll (635 to 1406)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M1 | "মা চারুশীলা প্রতিদিন…", P1 (Charu rings her bell), "একদিন মা প্রণাম করতেই" | `Village_Peace_Loop` (series) over a soft `tanpura_drone` (C); the loop slips away as Balak rises; the tanpura carries the whole scene into the CB1 black | the calm daily puja | loop 635-846: -37 under, -31 open, -30 in P1; tanpura 635-1406: -44 under, -37 open, -36 in P3 |
| M2 | "ছোট্ট বীরু চুপিচুপি…": he rises onto his knees, shuffles to the plate, lifts the clay Shiva, sets the doll down (the brass tap) | four whimsical swarmandal notes (`cheeky_pluck_3`) as he rises; a soft tabla tiptoe (`tabla_soft`) under the swap, stopping on the tap | sneaky mischief, light | pluck at 820 (-39, one-shot); tabla 828-962: -41 under (all under the narration) |
| M2 | P2: the cut to Charu staring at the plate, hand to her mouth (the clay pats go on) | a quick swarmandal flurry (`cheeky_pluck_1`) on the cut | Charu's surprise | 1037 (-36, one-shot, rings out by 1095) |
| M3 | Balak: "মা, তুমি তো রোজ…" to "…ওটা আর ফেলতে হবে না!" and P3 (he smiles up, she presses her palm to her forehead) | light, tender swarmandal plucks (`play_plucks`) under him, a little brighter in P3, fading with the picture | innocent, logical | 1093-1406: -41 under, -38 open, -36 in P3 |

CB1 (1400 to 1424): the chime only.

## Story 2, scene 02: the Gobinda at the pond, Thakurma's words (1424 to 2072)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M4 | The fade-in on the pond (P1: the mandar blossom drops, Balak turns the brass Gobinda to the light), "আরেকদিন তো পিতলের গোবিন্দ মূর্তি নিয়ে পুকুরপাড়ে চলে গেল!" | the warm `tanpura_drone` (C) and light `play_plucks` come up with the fade-in | the little runaway with the idol, playful | tanpura 1424-1772: -44 under, -37 open, -36 in P2; plucks 1424-1556: -41 under, -36 in P1 |
| M5 | "সুন্দর জ্যেঠা তখন মিষ্টি কথায় বুঝিয়ে…" to "…তবেই গোবিন্দ উদ্ধার করলেন।", P2 (a) Sundar draws the Gobinda to his chest, Charu's sigh of relief | `Warm_Family_Flute` (series) takes over from the plucks, rises in P2 and dims across the dissolve | sweet coaxing, then relief | 1534-1791: -38 under, -31 open, -30 in P2; fades over the dissolve 1742-1791 |
| M5b | P2 (b) the dissolve to the courtyard: Harendra shakes his head (his "কি যে কালাপাহাড় এল আমাদের ঘরে" is silent), Thakurma: "তোরা ওকে যতই কালাপাহাড় বলিস— দেখিস," | the tanpura darkens (`tanpura_drone_low` crossfades in over the dissolve) with one soft low tabla stroke (`drum_hit_low`) as the courtyard appears, gone before Thakurma speaks | grumbling, a little stern | low drone 1742-1887: -40 open, -44 under; stroke at 1762 (-42, cut with a fade by 1791) |
| M6 | "এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!" and P3 (Balak looks up, his glow brightens gently: the episode's one key beat) | `Divine_Motif` (C#, series) over `tanpura_drone_cs` (C#), in 6 frames before the phrase, rising in P3, fading with the picture into CB2; the `soft_magical_shimmer` SFX on the glow lift | grace | 1887-2072: motif -37 under, -32 in P3; drone -44 under, -36 in P3 |

Every C layer (the warm and the low tanpura, the flute) is out by 1887, where the C# layers come in; the C# layers are
out by 2072, before scene 03's C tanpura. CB2 (2066 to 2090): the chime only.

## Story 3, scene 03: the coconut water (2090 to 2698)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M7 | AG1 (the rite, the priest's bell, Thakurma walks off), "ধুপ! ধুপ কই?", P1 (nobody answers), AG2a (Balak brings the dhoop) | the warm `tanpura_drone` (C) under the rite and the bells; it sinks to a floor in P1 (the silence of no answer), opens in P2 and P3, out with the series fade | the full-moon abhishek, devotional | 2090-2698: -44 under, -39 open, -44 in P1, -37 in P2, -36 in P3 |
| M8 | AG2b: Balak points inside with raised brows (asking to sit); the priest nods without looking | four whimsical notes (`cheeky_pluck_3`) | mischief seeded | 2295 (-39, one-shot) |
| M9 | AG2c to AG2d: his eyes stop on the stone bowl; he lifts it and drinks it all in one draught ("এক চুমুকে"), sets it back; P2 he sits back, content | a light rising roll (`tension_rise`, tabla over a low dhol) cresting as the bowl reaches his lips, then a 5-note swarmandal statement (`cheeky_pluck_2`) on the gulp, its last note ringing into P2 | mischievous suspense, then the comic release | rise 2335-2368 (-38, crest at 2366); pluck at 2366 (-37, rings to about 2424); the drink_gulp SFX lands at 2366 |
| M10 | Balak: "ঠাকুরমশায়, আপনার ঠাকুর তো মুখ দিয়ে খায় না— তাই আমি নারকেলের জলটা খেয়ে ফোপড়াটা ওর জন্য রেখে দিয়েছি!" and P3 (the priest reddens; the boy smiles innocently) | a tender bansuri phrase (`bansuri_compassion`) swells in softly under him and settles on Sa in P3; the tanpura carries the last second into the outro | gentle wisdom | 2450-2678: -40 under, -34 open, -33 in P3 |

## Outro (2692 to 3335)
Unchanged series template: `deep_padma_river_day` and `Theme_Intro_Bansuri`, the outro shimmer.

## Sources
Recordings and credits: `remotion_studio/public/audio/music/ep05/README.md` and `docs/AUDIO_CREDITS.md`. Used here:
the tanpura (sankalp, CC0), the swarmandal plucks (luckylittleraven, CC0), the tabla and the drum stroke
(tabladrumsonline, CC BY-SA 3.0; the stroke's and the roll's dhol from Johnny Kalsi, CC BY 3.0), the bansuri
(MayankSingh33, CC BY-SA 4.0). Credit line for the Episode 4 video description:

> Music recordings: 'Tabla drums demo' by tabladrumsonline (CC BY-SA 3.0); 'DHOL BEAT' by Johnny Kalsi (CC BY 3.0); 'Indian Folk Classical Flute Music (2)' by MayankSingh33 (CC BY-SA 4.0); via Wikimedia Commons. Tanpura by sankalp and swarmandal by luckylittleraven (CC0), via Freesound.
