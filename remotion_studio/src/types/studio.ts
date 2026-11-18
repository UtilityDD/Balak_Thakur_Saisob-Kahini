import type { EaseName } from "../lib/motion";

export type LightingMood =
  | "bright_orange_flat"
  | "golden_daytime"
  | "deep_indigo_warm_diyas"
  | "sacred_midnight_glow"
  | "warm_mandap_lamps"
  | "cool_slate_rain"
  | "warm_indoor_amber"
  | "soft_golden_dawn";

export type CharacterId =
  | "narrator"
  | "gopal"
  | "rama"
  | "babukaka"
  | "charu"
  | "manorama_devi"
  | "bhagabati_thakur"
  | "sundar_thakur"
  | "pagol_mystic"
  | "grumpy_relative"
  | "thakurma"
  | "baby_thakur"
  | "little_goat";

export interface AudioClipMeta {
  file: string;
  durationSec: number;
  frames: number;
  rmsEnvelope: number[];
  speaker: CharacterId;
  subtitleBn: string;
}

export interface SceneTiming {
  sceneId: string;
  startFrame: number;
  durationFrames: number;
  lighting: LightingMood;
  ambientBed: string;
  musicCue: string;
  sfx: string[];
  clips: Array<AudioClipMeta & { offsetFrame: number }>;
}

export interface CameraKeyframe {
  frame: number;
  x: number;
  y: number;
  zoom: number;
  rotateDeg?: number;
  /** Easing used to arrive at this keyframe from the previous one. */
  ease?: EaseName;
}
