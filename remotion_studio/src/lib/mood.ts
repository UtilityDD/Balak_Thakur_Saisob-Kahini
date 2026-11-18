import React from "react";
import { LightingMood } from "../types/studio";

/* ---------- colour helpers ---------- */

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (r: number, g: number, b: number): string =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

export const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};

export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** RGB multipliers 0..1 used by the SVG ambient-tint colour matrix. */
export const tintMatrix = (hex: string, strength: number): string => {
  const [r, g, b] = toRgb(mix("#ffffff", hex, strength)).map((v) => (v / 255).toFixed(3));
  return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
};

/* ---------- lighting rig per mood ---------- */

export interface MoodLight {
  /** Key light colour (sun, diya, lamp, divine glow). */
  key: string;
  /** Key light comes from the left (-1) or right (+1) of frame. */
  keyDir: -1 | 1;
  /** Ambient fill multiplied into characters & props so they sit inside the scene. */
  ambient: string;
  ambientStrength: number;
  /** Shadow colour used for form shading on characters. */
  shadow: string;
  rim: string;
  rimStrength: number;
  /** Aerial-perspective haze between depth planes. */
  fog: string;
  fogStrength: number;
  /** Final colour grade: shadow & highlight tints (soft-light), vignette, grain. */
  gradeShadows: string;
  gradeHighlights: string;
  gradeStrength: number;
  saturate: number;
  contrast: number;
  vignette: number;
  grain: number;
  /** Volumetric light shafts: origin in frame px, or null. */
  godRays: { x: number; y: number; color: string; strength: number } | null;
  isNight: boolean;
}

export const MOOD_LIGHT: Record<LightingMood, MoodLight> = {
  bright_orange_flat: {
    key: "#fff1c9", keyDir: 1, ambient: "#fff1df", ambientStrength: 0.04, shadow: "#9c3b1c",
    rim: "#fff3c4", rimStrength: 0.35, fog: "#ffcf8a", fogStrength: 0.12,
    gradeShadows: "#7a2e1a", gradeHighlights: "#ffe9b0", gradeStrength: 0.18,
    saturate: 1.05, contrast: 1.04, vignette: 0.32, grain: 0.05, godRays: null, isNight: false,
  },
  golden_daytime: {
    key: "#fff0c2", keyDir: 1, ambient: "#fff3e0", ambientStrength: 0.06, shadow: "#6b4a5e",
    rim: "#fff2b8", rimStrength: 0.5, fog: "#d6ecf6", fogStrength: 0.22,
    gradeShadows: "#1d3c5a", gradeHighlights: "#ffd98a", gradeStrength: 0.2,
    saturate: 1.06, contrast: 1.05, vignette: 0.34, grain: 0.045,
    godRays: { x: 1480, y: 210, color: "#fff2c4", strength: 0.32 }, isNight: false,
  },
  deep_indigo_warm_diyas: {
    key: "#ffb85c", keyDir: -1, ambient: "#5d63b0", ambientStrength: 0.42, shadow: "#1b1640",
    rim: "#ffb04a", rimStrength: 0.65, fog: "#2a2552", fogStrength: 0.28,
    gradeShadows: "#0d0b2a", gradeHighlights: "#ffb35c", gradeStrength: 0.26,
    saturate: 1.08, contrast: 1.08, vignette: 0.55, grain: 0.06, godRays: null, isNight: true,
  },
  sacred_midnight_glow: {
    key: "#fff1c4", keyDir: 1, ambient: "#7563c0", ambientStrength: 0.38, shadow: "#1e1248",
    rim: "#ffeab0", rimStrength: 0.7, fog: "#3a2a6a", fogStrength: 0.3,
    gradeShadows: "#120a30", gradeHighlights: "#ffe9a8", gradeStrength: 0.26,
    saturate: 1.05, contrast: 1.07, vignette: 0.58, grain: 0.06,
    godRays: { x: 1180, y: -160, color: "#fff4d0", strength: 0.34 }, isNight: true,
  },
  warm_mandap_lamps: {
    key: "#ffa648", keyDir: 1, ambient: "#a8684f", ambientStrength: 0.32, shadow: "#3a1410",
    rim: "#ffc069", rimStrength: 0.65, fog: "#4a2418", fogStrength: 0.26,
    gradeShadows: "#240a08", gradeHighlights: "#ffb25e", gradeStrength: 0.26,
    saturate: 1.06, contrast: 1.08, vignette: 0.55, grain: 0.06, godRays: null, isNight: true,
  },
  cool_slate_rain: {
    key: "#d6e6f2", keyDir: -1, ambient: "#7f97ae", ambientStrength: 0.38, shadow: "#1c2a3a",
    rim: "#e2f0fb", rimStrength: 0.32, fog: "#8197ab", fogStrength: 0.42,
    gradeShadows: "#142230", gradeHighlights: "#c9dceb", gradeStrength: 0.26,
    saturate: 0.78, contrast: 1.03, vignette: 0.5, grain: 0.07, godRays: null, isNight: false,
  },
  warm_indoor_amber: {
    key: "#ffc77a", keyDir: 1, ambient: "#c08a5e", ambientStrength: 0.26, shadow: "#4a2412",
    rim: "#ffd28e", rimStrength: 0.55, fog: "#5a321c", fogStrength: 0.2,
    gradeShadows: "#2a1206", gradeHighlights: "#ffcf86", gradeStrength: 0.24,
    saturate: 1.04, contrast: 1.06, vignette: 0.5, grain: 0.055,
    godRays: { x: 1460, y: 300, color: "#ffd59a", strength: 0.26 }, isNight: false,
  },
  soft_golden_dawn: {
    key: "#ffc48a", keyDir: 1, ambient: "#f0b0a0", ambientStrength: 0.18, shadow: "#5a2a48",
    rim: "#ffcf96", rimStrength: 0.62, fog: "#f2a77e", fogStrength: 0.3,
    gradeShadows: "#3a1a40", gradeHighlights: "#ffd29a", gradeStrength: 0.22,
    saturate: 1.05, contrast: 1.04, vignette: 0.4, grain: 0.05,
    godRays: { x: 960, y: 470, color: "#ffe2b0", strength: 0.36 }, isNight: false,
  },
};

export const MoodContext = React.createContext<LightingMood>("golden_daytime");
export const useMood = (): MoodLight & { mood: LightingMood } => {
  const mood = React.useContext(MoodContext);
  return { ...MOOD_LIGHT[mood], mood };
};
