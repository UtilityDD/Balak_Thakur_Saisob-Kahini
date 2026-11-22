# Episode 3: cinematic music cue sheet (2026-11-22)

The director asked to bring the new Episode 5 music into Episode 3 (AUD-07): situation-led scoring with Indian
instruments, gentle and devotional. Episode 3 is a calm story with a light, half-teasing scolding: no fear, no hits, no
heartbeat. Rules kept: the narration stays clear (AUD-01); music ducks under every voice and rises in the pauses
(AUD-06); loops at 0.25 or below (AUD-03), one-shots 0.15 to 0.45 (AUD-02); voices at -16 LUFS. Music under a voice
sits about 18 to 24 dB below it (about -34 to -40 LUFS), in the pauses 12 to 16 dB below (about -28 to -32); the
tanpura drones lower still, as a floor.

Setting: the Vedic house courtyard at an autumn dawn (STO-18); the girls of the house scold Balak for laying the puja
flowers on his own feet (STO-17a); his five-year-old's wisdom in reply. The scene SFX (pick rustles, the pour, cloth,
footsteps, the girls' giggles, the shimmer) and the intro and outro template sounds are unchanged.

Code: `remotion_studio/src/episode03/Episode03.tsx`, `MUSIC_CUES` (anchored to narration phrases, the
`02c_Toddler_Thakur` clip, Balak's beats and the pauses; levels are LUFS targets turned into volumes from each file's
measured loudness). Files: `public/audio/music/ep05/` (README there: Sa = C; `tanpura_drone_cs` is in C# for under
the Divine_Motif) and the series music in `public/audio/music/`.

Frames are absolute Episode03 frames on today's timing (scene 01 starts 638, scene 02 at 1098, the outro at 2388);
the code follows the cues if the timing is rebuilt.

## Intro and source card (0 to 662)
Unchanged series template: `Theme_Intro_Bansuri` (0.14 open, 0.08 under the voice) and the opening `chime_pop`.

## Scene 01: the autumn dawn, the flower gathering (638 to 1116)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M1 | "শরতের মিষ্টি ভোর।" to "…সাজি ভরছে।" and the end pause P3 | `Village_Peace_Loop` (series) over a soft `tanpura_drone` (C); the loop rises in P3 and fades over the dissolve; the tanpura carries on into the courtyard | calm autumn dawn, unhurried | loop 638-1116: -37 under voice, -31 open, -30 in P3; tanpura from 638: -44 under, -37 open |

## Scene 02A: the ritual at the tulsi (1098 to 1522)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M2 | The dissolve, the open pause P1, "হঠাৎ সবাই দেখে…" (the girls turn and walk over) | `Warm_Family_Flute` (series) over the tanpura | a child at peace in the courtyard | 1098-1521: -38 under, -31 open |
| M3 | The pour ("তুলসীতলায় জল ঢেলে…"), the fallen leaf, the three hibiscus laid on his own feet; brightest in P2 as he looks down at them | light, tender swarmandal plucks (`play_plucks`); the flute dips 5 dB under them | innocence, a little ritual of his own | 1214-1424: -41 under, -37 open, -36 in P2 |
| M4 | "আর নিজেই নিজেকে প্রণাম করছে!" and P3 (glow beat 1) | the plucks fall away on the bow; the flute comes back and it and the tanpura bloom a little in P3; the `soft_magical_shimmer` SFX with the glow | wonder, stillness | flute -30, tanpura -36 in P3 (1474-1522) |

## Scene 02B: the girls scold him (1522 to 1877)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M5 | The cut to the eldest girl, "ওমা, একি কাণ্ড!", and P1 (first giggle) | flute out; a quick swarmandal flurry (`cheeky_pluck_1`) on the cut, then four whimsical notes (`cheeky_pluck_3`) with the giggle, gone by "তুই" | cheeky surprise | pluck 1 at 1526, on the cut to the eldest girl (-38), pluck 3 at 1572 (-37), one-shots |
| M6 | "তুই ঠাকুরের ফুল নিজের পায়ে দিচ্ছিস কেন রে?", P2, "দেখিস তোর পাপ হবে, ভগবান শাপ দেবেন!" | the tanpura darkens (`tanpura_drone_low` crossfades in) and a soft tabla figure (`tabla_soft`) walks under the scolding | stern but light, half teasing, never scary | low drone 1586-1905: -44 under, -41 open; tabla 1594-1849: -43 under, -39 open, -38 in P2 |
| — | P3, the held pause before his answer (the girls giggle; the eldest waits) | the tabla stops as the pause begins; the low drone alone, very soft | the held breath | low drone -40 in P3 (1841-1877) |

## Scene 02C: Balak's calm, wise answer (1877 to 2387)
| Beat | Moment | Music | Feel | Frames, level |
|---|---|---|---|---|
| M7 | "তোদের ভগবান তোদের শাপ দেবে!" | the warm `tanpura_drone` (C) returns under his first words as the low drone fades | calm returns | 1875-2269: -44 under, -37 open, -36 in P1 and P2 |
| M7 | "আমার পায়ে ফুল দিলে তো আমি বেশ টের পাই।", P1, "তোমাদের মাটির মূর্তি তো নড়েও না, কিছু বোঝেও না!", P2 | a tender bansuri phrase (`bansuri_compassion`) swells in softly under him, rises in P1 and settles on Sa in P2 as the girls glance at each other, unsure | compassion, gentle wisdom | 1962-2190: -40 under, -34 open, -33 in P1 and P2 |
| M8 | "আমি ভগবান হলে কিন্তু ফুল কেন," | the tanpura alone, fading out before the last line (C and C# never overlap) | a breath before the teaching | out by 2269 |
| M8 | "গাছ কেটে নিলেও কাউকে রাগ করতাম না!" and the end pause P3 (glow beat 2) | `Divine_Motif` (C#, series, STO-17 answer 4) over `tanpura_drone_cs` (C#), in with his glow 6 frames before "গাছ কেটে" is heard, rising in P3, fading over the first second of the outro | grace | 2269-2411: motif -36 under, -30 in P3; drone -44 under, -36 in P3 |

## Outro (2388 to 3259)
Unchanged series template: `deep_padma_river_day` and `Theme_Intro_Bansuri`, the outro shimmer.

## Sources
Recordings and credits: `remotion_studio/public/audio/music/ep05/README.md` and `docs/AUDIO_CREDITS.md`. Used here:
the tanpura (sankalp, CC0), the swarmandal plucks (luckylittleraven, CC0), the tabla (tabladrumsonline, CC BY-SA 3.0),
the bansuri (MayankSingh33, CC BY-SA 4.0). Credit line for the Episode 3 video description:

> Music recordings: 'Tabla drums demo' by tabladrumsonline (CC BY-SA 3.0); 'Indian Folk Classical Flute Music (2)' by MayankSingh33 (CC BY-SA 4.0); via Wikimedia Commons. Tanpura by sankalp and swarmandal by luckylittleraven (CC0), via Freesound.
