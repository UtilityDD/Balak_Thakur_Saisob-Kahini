// Frame-accurate timing for Series 2 (Param Bismoy Balak Thakur) — Season 1, Episode 01
// Computed from real normalized 48kHz WAV durations at 24 fps (with Sola Lady Narrator across all 5 narrator blocks).

export const S2_EP01_FPS = 24;

export interface S2Scene {
  sceneId: string;
  component: string;
  startFrame: number;
  durationFrames: number;
}

export interface S2Audio {
  file: string;
  startFrame: number;
  frames: number;
}

export const S2_EP01_SCENES: S2Scene[] = [
  { sceneId: "00_intro", component: "Scene00Intro", startFrame: 0, durationFrames: 290 },
  { sceneId: "00b_source_attribution", component: "Scene00bSourceCard", startFrame: 290, durationFrames: 144 },
  { sceneId: "01_lokenath_prophecy", component: "Scene01LokenathProphecy", startFrame: 434, durationFrames: 1776 },
  { sceneId: "02_padma_kaulipara_warning", component: "Scene02PadmaKaulipara", startFrame: 2210, durationFrames: 1380 },
  { sceneId: "03_pagol_monsoon_omen", component: "Scene03PagolMonsoonBaidikBari", startFrame: 3590, durationFrames: 1246 },
  { sceneId: "99_closing_sequential_outro", component: "Scene99Outro", startFrame: 4836, durationFrames: 784 },
];

export const S2_EP01_TOTAL_FRAMES = 5620;

export const S2_EP01_AUDIO: S2Audio[] = [
  // 00_intro (0..290) — Reusable Master Series Intro (Sola announces Series Title as it reveals at f=86)
  { file: "00_Master_Intro.wav", startFrame: 86, frames: 87 },

  // 00b_source_attribution / Episode Title Card (290..434)
  { file: "00b_Ep01_Title.wav", startFrame: 292, frames: 142 },

  // 01_lokenath_prophecy (434..2210) — Lady Narrator (Sola) + Baba Lokenath (Knox) + Jogesh (Bodi)
  { file: "01a_Narrator_1919.wav", startFrame: 446, frames: 628 },
  { file: "01b_Lokenath_Prophecy.wav", startFrame: 1085, frames: 573 },
  { file: "01c_Jogesh_Awe.wav", startFrame: 1674, frames: 276 },
  { file: "01d_Lokenath_Smile.wav", startFrame: 1964, frames: 228 },

  // 02_padma_kaulipara_warning (2210..3590) — Lady Narrator (Sola) + Harnath's Wife (Cleo) + Villager (Daro)
  { file: "02a_Narrator_Lineage.wav", startFrame: 2222, frames: 644 },
  { file: "02b_Harnath_Wife.wav", startFrame: 2882, frames: 276 },
  { file: "02c_Villager_Shock.wav", startFrame: 3174, frames: 179 },
  { file: "02d_Harnath_Wife_Lead.wav", startFrame: 3367, frames: 206 },

  // 03_pagol_monsoon_omen (3590..4836) — Lady Narrator (Sola) + Pagol (Zali) + Charushila (Lumi)
  { file: "03a_Narrator_Charu.wav", startFrame: 3602, frames: 589 },
  { file: "03b_Pagol_Omen.wav", startFrame: 4207, frames: 278 },
  { file: "03c_Charu_Wonder.wav", startFrame: 4501, frames: 300 },

  // 99_closing_sequential_outro (4836..5620) — Lady Narrator (Sola)
  { file: "99_Outro_Sequential.wav", startFrame: 4848, frames: 734 },
];
