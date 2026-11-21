// Frame-accurate timing for Series 2 (Param Bismoy Balak Thakur) — Season 1, Episode 01
// Computed from real normalized 48kHz WAV durations at 24 fps.

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
  { sceneId: "02_padma_kaulipara_warning", component: "Scene02PadmaKaulipara", startFrame: 2210, durationFrames: 1165 },
  { sceneId: "03_pagol_monsoon_omen", component: "Scene03PagolMonsoonBaidikBari", startFrame: 3375, durationFrames: 1140 },
  { sceneId: "99_closing_sequential_outro", component: "Scene99Outro", startFrame: 4515, durationFrames: 950 },
];

export const S2_EP01_TOTAL_FRAMES = 5465;

export const S2_EP01_AUDIO: S2Audio[] = [
  // 00_intro (0..290)
  { file: "00_Intro.wav", startFrame: 8, frames: 273 },

  // 01_lokenath_prophecy (434..2210)
  { file: "01a_Narrator_1919.wav", startFrame: 446, frames: 623 },
  { file: "01b_Lokenath_Prophecy.wav", startFrame: 1085, frames: 573 },
  { file: "01c_Jogesh_Awe.wav", startFrame: 1674, frames: 276 },
  { file: "01d_Lokenath_Smile.wav", startFrame: 1964, frames: 228 },

  // 02_padma_kaulipara_warning (2210..3375)
  { file: "02a_Narrator_Lineage.wav", startFrame: 2222, frames: 429 },
  { file: "02b_Harnath_Wife.wav", startFrame: 2667, frames: 276 },
  { file: "02c_Villager_Shock.wav", startFrame: 2959, frames: 179 },
  { file: "02d_Harnath_Wife_Lead.wav", startFrame: 3152, frames: 205 },

  // 03_pagol_monsoon_omen (3375..4515)
  { file: "03a_Narrator_Charu.wav", startFrame: 3387, frames: 483 },
  { file: "03b_Pagol_Omen.wav", startFrame: 3886, frames: 277 },
  { file: "03c_Charu_Wonder.wav", startFrame: 4180, frames: 300 },

  // 99_closing_sequential_outro (4515..5465)
  { file: "99_Outro_Sequential.wav", startFrame: 4527, frames: 900 },
];
