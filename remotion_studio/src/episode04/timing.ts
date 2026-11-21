// Generated from 02_Audio/Voice_WAVs/audio_durations.json and 01_Script_and_Storyboard/scenes_manifest.json.
// Frames = round(duration_sec * 24). Clips are laid back to back with a 0.3 s (7 frame) gap after each clip.
// Each scene spans its clips plus the gap after its last clip. Do not edit by hand.
export const EP04_FPS = 24;
export interface Ep04Scene { sceneId: string; component: string; startFrame: number; durationFrames: number }
export const EP04_SCENES: Ep04Scene[] = [
  { sceneId: "00_intro", component: "Scene00Intro", startFrame: 0, durationFrames: 173 },
  { sceneId: "01_clay_shiva_and_doll", component: "Scene01ClayShivaAndDoll", startFrame: 173, durationFrames: 661 },
  { sceneId: "02_gobinda_pond_and_thakurma", component: "Scene02GobindaPondAndThakurma", startFrame: 834, durationFrames: 491 },
  { sceneId: "03_coconut_water_abhishek", component: "Scene03CoconutWaterAbhishek", startFrame: 1325, durationFrames: 259 },
  { sceneId: "99_closing_sequential_outro", component: "Scene99ClosingSequentialOutro", startFrame: 1584, durationFrames: 626 },
];
export const EP04_TOTAL_FRAMES = 2210;
export interface Ep04Audio { file: string; startFrame: number; frames: number }
export const EP04_AUDIO: Ep04Audio[] = [
  { file: "00_Intro.wav", startFrame: 0, frames: 166 },
  { file: "01a_Narrator_Shiva.wav", startFrame: 173, frames: 381 },
  { file: "01b_Toddler_Thakur_Clay.wav", startFrame: 561, frames: 266 },
  { file: "02a_Narrator_Pond.wav", startFrame: 834, frames: 261 },
  { file: "02b_Thakurma_Blessing.wav", startFrame: 1102, frames: 216 },
  { file: "03a_Bhagabati_Dhoop.wav", startFrame: 1325, frames: 49 },
  { file: "03b_Toddler_Coconut.wav", startFrame: 1381, frames: 196 },
  { file: "99_Outro_Sequential.wav", startFrame: 1584, frames: 619 },
];
