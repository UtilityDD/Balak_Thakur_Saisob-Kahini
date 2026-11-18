import React from "react";
import { useCurrentFrame } from "remotion";
import { CharacterId } from "../types/studio";

export interface CharacterPalette {
  skin: string;
  hair: string;
  garment: string;
  accent: string;
  scale: number;
  hasMustache?: boolean;
  hasVeil?: boolean;
  isElder?: boolean;
  isChild?: boolean;
}

const PALETTES: Record<string, CharacterPalette> = {
  babukaka: { skin: "#d99b72", hair: "#241c1a", garment: "#f7efe2", accent: "#c78d52", scale: 1.0, hasMustache: true },
  charu: { skin: "#e3ab86", hair: "#1f1818", garment: "#fcf8f2", accent: "#b8292f", scale: 0.96, hasVeil: true },
  manorama_devi: { skin: "#d69870", hair: "#261f1e", garment: "#f5efe6", accent: "#7c1d26", scale: 0.98, hasVeil: true },
  bhagabati_thakur: { skin: "#d1936b", hair: "#c7c4c2", garment: "#faf5eb", accent: "#a82424", scale: 1.02, hasMustache: true, isElder: true },
  sundar_thakur: { skin: "#d89a72", hair: "#3d3533", garment: "#f7f1e6", accent: "#d49b3b", scale: 0.99, hasMustache: true },
  pagol_mystic: { skin: "#c98b63", hair: "#292220", garment: "#d98236", accent: "#a6541c", scale: 1.0 },
  grumpy_relative: { skin: "#cfa07c", hair: "#d4d0ce", garment: "#f2ece1", accent: "#6e6862", scale: 0.97, isElder: true },
  thakurma: { skin: "#dba682", hair: "#e8e6e4", garment: "#ffffff", accent: "#d9b88f", scale: 0.94, hasVeil: true, isElder: true },
  gopal: { skin: "#d4946a", hair: "#1f1918", garment: "#f7f4ec", accent: "#4e8098", scale: 0.72, isChild: true },
  rama: { skin: "#cc8c62", hair: "#211b19", garment: "#f2ede2", accent: "#c96f3b", scale: 0.76, isChild: true },
};

/** Map 0..1 RMS audio energy to SVG mouth height/width for smooth lip-sync */
function getMouthShape(rms: number): { rx: number; ry: number; open: boolean } {
  if (rms < 0.08) return { rx: 9, ry: 2, open: false };
  if (rms < 0.22) return { rx: 10, ry: 5, open: true };
  if (rms < 0.45) return { rx: 12, ry: 8.5, open: true };
  return { rx: 13.5, ry: 12, open: true };
}

export const CharacterRig: React.FC<{
  id: Exclude<CharacterId, "narrator" | "baby_thakur" | "little_goat">;
  x: number;
  y: number;
  flipX?: boolean;
  rms?: number;
  gesture?: "idle" | "wave" | "sparkler" | "bell" | "bless" | "scroll";
}> = ({ id, x, y, flipX = false, rms = 0, gesture = "idle" }) => {
  const frame = useCurrentFrame();
  const pal = PALETTES[id] ?? PALETTES.babukaka;

  // Natural 3.5s blink (84 frames at 24fps)
  const blinkMod = (frame + id.length * 13) % 84;
  const eyeScaleY = blinkMod >= 80 ? 0.12 : 1.0;

  // Breathing & head tilt
  const breathY = Math.sin(frame * 0.09 + id.length) * 3.0;
  const headTilt = Math.sin(frame * 0.06 + id.length) * 1.8 + rms * 3.5;
  const clothSway = Math.sin(frame * 0.07 + id.length) * 5.0;
  const armWave =
    gesture === "wave" || gesture === "bless"
      ? -24 + Math.sin(frame * 0.14) * 10
      : gesture === "bell"
      ? Math.sin(frame * 0.3) * 12
      : gesture === "sparkler"
      ? -35 + Math.sin(frame * 0.12) * 8
      : Math.sin(frame * 0.06) * 4;

  const mouth = getMouthShape(rms);

  return (
    <g transform={`translate(${x}, ${y}) scale(${flipX ? -pal.scale : pal.scale}, ${pal.scale})`}>
      {/* Soft ground ambient shadow */}
      <ellipse cx="0" cy="185" rx="58" ry="14" fill="#1a1018" opacity={0.28} />

      {/* Torso & Garment (Borderless) */}
      <g transform={`translate(0, ${breathY})`}>
        <path
          d={`M -42 35 Q -48 115 ${-54 + clothSway * 0.4} 180 L ${54 + clothSway * 0.4} 180 Q 48 115 42 35 Q 0 22 -42 35 Z`}
          fill={pal.garment}
        />
        {/* Saree border / Uttariya shawl */}
        <path
          d={`M -40 38 Q 0 92 46 175 L 28 178 Q -12 105 -44 52 Z`}
          fill={pal.accent}
          opacity={0.9}
        />

        {/* Articulated Right Arm */}
        <g transform={`translate(36, 48) rotate(${armWave})`}>
          <path d="M -8 0 Q 22 25 44 52 L 32 60 Q 10 34 -10 12 Z" fill={pal.skin} />
          <circle cx="40" cy="57" r="9" fill={pal.skin} />
          {gesture === "sparkler" && (
            <g transform="translate(44, 54)">
              <line x1="0" y1="0" x2="36" y2="-46" stroke="#80654a" strokeWidth="3" />
              <circle cx="36" cy="-46" r={10 + (frame % 4) * 3} fill="#ffe478" opacity={0.85} />
              <circle cx="36" cy="-46" r={5} fill="#ffffff" />
            </g>
          )}
          {gesture === "bell" && (
            <path d="M 34 62 L 50 62 L 54 80 L 30 80 Z" fill="#e6b84c" />
          )}
        </g>

        {/* Articulated Left Arm */}
        <g transform={`translate(-36, 48) rotate(${-Math.sin(frame * 0.06) * 5})`}>
          <path d="M 8 0 Q -18 28 -30 58 L -18 62 Q -6 34 10 12 Z" fill={pal.skin} />
          <circle cx="-24" cy="60" r="9" fill={pal.skin} />
        </g>

        {/* Head & Neck */}
        <g transform={`translate(0, 12) rotate(${headTilt})`}>
          <rect x="-12" y="-6" width="24" height="28" rx="10" fill={pal.skin} />
          {/* Hair / Veil */}
          {pal.hasVeil ? (
            <path d="M -42 -22 Q 0 -76 42 -22 Q 46 28 36 48 L -36 48 Q -46 28 -42 -22 Z" fill={pal.garment} />
          ) : (
            <path d="M -38 -36 Q 0 -78 38 -36 Q 42 -12 34 -4 L -34 -4 Q -42 -12 -38 -36 Z" fill={pal.hair} />
          )}

          {/* Face */}
          <ellipse cx="0" cy="-24" rx="33" ry="37" fill={pal.skin} />
          {/* Warm cheek blush */}
          <ellipse cx="-18" cy="-16" rx="7" ry="4" fill="#e87e6b" opacity={0.35} />
          <ellipse cx="18" cy="-16" rx="7" ry="4" fill="#e87e6b" opacity={0.35} />

          {/* Expressive Large Eyes with Blink */}
          <g transform={`translate(-13, -27) scale(1, ${eyeScaleY})`}>
            <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#ffffff" />
            <circle cx="1" cy="0" r="4" fill="#1e1615" />
            <circle cx="2.5" cy="-1.5" r="1.5" fill="#ffffff" />
          </g>
          <g transform={`translate(13, -27) scale(1, ${eyeScaleY})`}>
            <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#ffffff" />
            <circle cx="-1" cy="0" r="4" fill="#1e1615" />
            <circle cx="0.5" cy="-1.5" r="1.5" fill="#ffffff" />
          </g>

          {/* Mustache */}
          {pal.hasMustache && (
            <path d="M -14 -12 Q 0 -17 14 -12 Q 6 -9 0 -11 Q -6 -9 -14 -12 Z" fill={pal.hair} />
          )}

          {/* Audio-driven SVG Mouth Viseme */}
          {mouth.open ? (
            <ellipse cx="0" cy="-4" rx={mouth.rx} ry={mouth.ry} fill="#782026" />
          ) : (
            <path d="M -9 -5 Q 0 1 9 -5" stroke="#782026" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          )}
        </g>
      </g>
    </g>
  );
};

export const BabyThakurRig: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const auraPulse = 1 + Math.sin(frame * 0.08) * 0.08;
  const floatY = Math.sin(frame * 0.06) * 3;

  return (
    <g transform={`translate(${x}, ${y + floatY}) scale(${scale})`}>
      {/* Sacred White-Gold Halo Aura */}
      <circle cx="0" cy="0" r={78 * auraPulse} fill="#fff7cc" opacity={0.22} />
      <circle cx="0" cy="0" r={52 * auraPulse} fill="#ffffff" opacity={0.34} />
      {/* Soft white cloth wrap */}
      <ellipse cx="0" cy="12" rx="44" ry="24" fill="#ffffff" />
      <circle cx="-16" cy="2" r="19" fill="#ebbaa0" />
      {/* Serene peaceful eyes & soft smile */}
      <path d="M -23 0 Q -19 -3 -15 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M -11 0 Q -7 -3 -3 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M -17 9 Q -13 13 -9 9" stroke="#9e4747" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
};

export const LittleGoatRig: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const hopY = -Math.abs(Math.sin(frame * 0.14)) * 22;
  const earFlop = Math.sin(frame * 0.28) * 14;

  return (
    <g transform={`translate(${x}, ${y + hopY})`}>
      <ellipse cx="0" cy="20" rx="34" ry="22" fill="#f5ede4" />
      <ellipse cx="14" cy="18" rx="14" ry="12" fill="#b87d52" />
      <circle cx="-30" cy="0" r="18" fill="#f5ede4" />
      <ellipse cx="-40" cy="2" rx="6" ry="13" fill="#b87d52" transform={`rotate(${earFlop} -40 -6)`} />
      <circle cx="-35" cy="-4" r="3.5" fill="#1e1615" />
      <rect x="-22" y="34" width="7" height="22" rx="3" fill="#e6d6c3" />
      <rect x="14" y="34" width="7" height="22" rx="3" fill="#e6d6c3" />
    </g>
  );
};
