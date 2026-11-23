/**
 * Scene-light contract & 7 presets for the Balak Painted-Look Library (05_Rework, Module 6.8).
 * One `ThakurLight` object feeds every painted part (face, hair, cloth, hands, ground shadow, rim)
 * so Balak integrates naturally into any time of day.
 */

export interface ThakurLight {
  name: string;
  /** Horizontal sun direction (+1 = upper-right sun, -1 = upper-left sun). */
  sunDir: 1 | -1;
  /** Warm key / sunlight rim color. */
  sunColor: string;
  /** Rim strength (0..1). */
  rimStrength: number;
  /** Cool or warm environmental bounce light on the shadow side. */
  bounceColor: string;
  /** Bounce strength (0..1). */
  bounceStrength: number;
  /** Cast/contact ground shadow tint. */
  shadowColor: string;
  /** Ground shadow stretch multiplier (higher for low sun like dawn/afternoon gold). */
  shadowStretch: number;
  /** Cloth shadow fold tint (cool blue-lavender in daylight, warm umber in diya light). */
  clothCoolShade: string;
  /** Cloth sunlit highlight tint. */
  clothWarmLit: string;
  /** Skin warmth multiplier (subtle tint shift for time of day). */
  skinWarmth: number;
  /** Ambient breeze strength (0..1) for hair wisps & chadar follow-through. */
  wind: number;
}

export type ThakurLightPreset =
  | "dawn"
  | "morning"
  | "noon"
  | "afternoonGold"
  | "dusk"
  | "diya"
  | "moonlight";

export const THAKUR_LIGHTS: Record<ThakurLightPreset, ThakurLight> = {
  dawn: {
    name: "Sharad Dawn",
    sunDir: 1,
    sunColor: "#ffd38e",
    rimStrength: 0.58,
    bounceColor: "#8b9ec4",
    bounceStrength: 0.30,
    shadowColor: "#3e2b26",
    shadowStretch: 1.45,
    clothCoolShade: "#8a98b8",
    clothWarmLit: "#fff2d6",
    skinWarmth: 0.96,
    wind: 0.45,
  },
  morning: {
    name: "Morning",
    sunDir: 1,
    sunColor: "#ffe8b2",
    rimStrength: 0.52,
    bounceColor: "#8ea8c4",
    bounceStrength: 0.26,
    shadowColor: "#3a251a",
    shadowStretch: 1.15,
    clothCoolShade: "#8996b0",
    clothWarmLit: "#fff8e6",
    skinWarmth: 1.0,
    wind: 0.40,
  },
  noon: {
    name: "Noon",
    sunDir: 1,
    sunColor: "#fff4d6",
    rimStrength: 0.42,
    bounceColor: "#9eb2c4",
    bounceStrength: 0.22,
    shadowColor: "#3a281d",
    shadowStretch: 0.85,
    clothCoolShade: "#94a0b2",
    clothWarmLit: "#fffdf5",
    skinWarmth: 1.02,
    wind: 0.25,
  },
  afternoonGold: {
    name: "Afternoon Gold",
    sunDir: 1,
    sunColor: "#ffdf96",
    rimStrength: 0.66,
    bounceColor: "#7e96ae",
    bounceStrength: 0.28,
    shadowColor: "#3b2316",
    shadowStretch: 1.35,
    clothCoolShade: "#8793ad",
    clothWarmLit: "#fff3d2",
    skinWarmth: 1.04,
    wind: 0.55,
  },
  dusk: {
    name: "Dusk",
    sunDir: 1,
    sunColor: "#f7b57a",
    rimStrength: 0.54,
    bounceColor: "#6d7ea8",
    bounceStrength: 0.36,
    shadowColor: "#2d1f26",
    shadowStretch: 1.5,
    clothCoolShade: "#7582a8",
    clothWarmLit: "#ffdfb8",
    skinWarmth: 0.94,
    wind: 0.50,
  },
  diya: {
    name: "Diya Light",
    sunDir: -1,
    sunColor: "#ffba64",
    rimStrength: 0.70,
    bounceColor: "#5c4a5e",
    bounceStrength: 0.28,
    shadowColor: "#24140d",
    shadowStretch: 1.25,
    clothCoolShade: "#7e6c7a",
    clothWarmLit: "#ffe0a8",
    skinWarmth: 1.05,
    wind: 0.20,
  },
  moonlight: {
    name: "Moonlight",
    sunDir: 1,
    sunColor: "#c8dcf2",
    rimStrength: 0.48,
    bounceColor: "#536888",
    bounceStrength: 0.34,
    shadowColor: "#1b2230",
    shadowStretch: 1.3,
    clothCoolShade: "#6c7f9e",
    clothWarmLit: "#e6f0fa",
    skinWarmth: 0.86,
    wind: 0.35,
  },
};
