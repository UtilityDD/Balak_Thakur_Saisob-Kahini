import React from "react";
import { useCurrentFrame } from "remotion";
import { CharacterId } from "../types/studio";

export type CharacterEmotion =
  | "neutral"
  | "happy"
  | "amazed"
  | "worried"
  | "grumpy"
  | "serene"
  | "loving";

export type CharacterGesture =
  | "idle"
  | "wave"
  | "sparkler"
  | "bell"
  | "bless"
  | "scroll"
  | "platter"
  | "cradle"
  | "pray"
  | "drum"
  | "clarinet"
  | "crossed";

export interface CharacterPalette {
  skin: string;
  skinShadow: string;
  hair: string;
  garment: string;
  garmentShadow: string;
  accent: string;
  scale: number;
  hasMustache?: boolean;
  hasBeard?: boolean;
  hasVeil?: boolean;
  hasSindoor?: boolean;
  hasGlasses?: boolean;
  isElder?: boolean;
  isChild?: boolean;
}

const PALETTES: Record<string, CharacterPalette> = {
  babukaka: {
    skin: "#db9d74",
    skinShadow: "#c4835a",
    hair: "#241c1a",
    garment: "#f7efe2",
    garmentShadow: "#e6dac6",
    accent: "#c78d52",
    scale: 1.0,
    hasMustache: true,
  },
  charu: {
    skin: "#e5ae8a",
    skinShadow: "#cf936d",
    hair: "#1f1818",
    garment: "#fcf8f2",
    garmentShadow: "#ebe2d5",
    accent: "#b8292f",
    scale: 0.96,
    hasVeil: true,
    hasSindoor: true,
  },
  manorama_devi: {
    skin: "#d89a72",
    skinShadow: "#bf815a",
    hair: "#261f1e",
    garment: "#f5efe6",
    garmentShadow: "#e3d9cc",
    accent: "#7c1d26",
    scale: 0.98,
    hasVeil: true,
    hasSindoor: true,
  },
  bhagabati_thakur: {
    skin: "#d1936b",
    skinShadow: "#b87a53",
    hair: "#d1cecc",
    garment: "#faf5eb",
    garmentShadow: "#e8dfd0",
    accent: "#a82424",
    scale: 1.03,
    hasMustache: true,
    isElder: true,
  },
  sundar_thakur: {
    skin: "#d89a72",
    skinShadow: "#bf815a",
    hair: "#3d3533",
    garment: "#f7f1e6",
    garmentShadow: "#e5dccb",
    accent: "#d49b3b",
    scale: 0.99,
    hasMustache: true,
    hasGlasses: true,
  },
  pagol_mystic: {
    skin: "#c98b63",
    skinShadow: "#ad714b",
    hair: "#292220",
    garment: "#e08434",
    garmentShadow: "#bf6821",
    accent: "#9e4714",
    scale: 1.01,
    hasBeard: true,
  },
  grumpy_relative: {
    skin: "#cfa07c",
    skinShadow: "#b58562",
    hair: "#d4d0ce",
    garment: "#f2ece1",
    garmentShadow: "#ded6c8",
    accent: "#6e6862",
    scale: 0.97,
    isElder: true,
  },
  thakurma: {
    skin: "#dba682",
    skinShadow: "#c48d68",
    hair: "#eceae8",
    garment: "#ffffff",
    garmentShadow: "#ebe6df",
    accent: "#d9b88f",
    scale: 0.95,
    hasVeil: true,
    isElder: true,
  },
  gopal: {
    skin: "#d4946a",
    skinShadow: "#ba7b52",
    hair: "#1f1918",
    garment: "#f7f4ec",
    garmentShadow: "#e3ded1",
    accent: "#4e8098",
    scale: 0.72,
    isChild: true,
  },
  rama: {
    skin: "#cc8c62",
    skinShadow: "#b3744b",
    hair: "#211b19",
    garment: "#f2ede2",
    garmentShadow: "#ded7c8",
    accent: "#c96f3b",
    scale: 0.76,
    isChild: true,
  },
};

/** Map 0..1 RMS audio energy to smooth SVG mouth viseme */
function getMouthShape(rms: number, emotion: CharacterEmotion): { rx: number; ry: number; open: boolean } {
  if (rms < 0.06) return { rx: 9, ry: 2, open: false };
  if (rms < 0.18) return { rx: 10, ry: 4.5, open: true };
  if (rms < 0.42) return { rx: 12, ry: 8, open: true };
  if (emotion === "amazed") return { rx: 11, ry: 13, open: true };
  return { rx: 13.5, ry: 11.5, open: true };
}

function getEyebrowOffset(emotion: CharacterEmotion): { lift: number; tilt: number } {
  switch (emotion) {
    case "amazed":
      return { lift: -5, tilt: -8 };
    case "happy":
    case "loving":
      return { lift: -3, tilt: -4 };
    case "worried":
      return { lift: -2, tilt: 12 };
    case "grumpy":
      return { lift: 3, tilt: -16 };
    case "serene":
      return { lift: -1, tilt: 0 };
    default:
      return { lift: 0, tilt: 0 };
  }
}

export const CharacterRig: React.FC<{
  id: Exclude<CharacterId, "narrator" | "baby_thakur" | "little_goat">;
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
  rms?: number;
  gesture?: CharacterGesture;
  emotion?: CharacterEmotion;
  eyeLookX?: number;
  eyeLookY?: number;
  freezeAtFrame?: number;
  opacity?: number;
}> = ({
  id,
  x,
  y,
  scale = 1,
  flipX = false,
  rms = 0,
  gesture = "idle",
  emotion = "neutral",
  eyeLookX = 0,
  eyeLookY = 0,
  freezeAtFrame,
  opacity = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const frame = freezeAtFrame !== undefined && rawFrame > freezeAtFrame ? freezeAtFrame : rawFrame;
  const pal = PALETTES[id] ?? PALETTES.babukaka;
  const isSpeaking = rms > 0.07;

  // Natural 3.5s blink (84 frames at 24fps)
  const blinkMod = (frame + id.length * 13) % 84;
  const eyeScaleY = blinkMod >= 80 ? 0.12 : 1.0;

  // Breathing, speaking nod & cloth sway
  const breathY = Math.sin(frame * 0.085 + id.length) * 3.0;
  const speakLean = isSpeaking ? Math.sin(frame * 0.25) * 1.6 : 0;
  const headTilt =
    Math.sin(frame * 0.055 + id.length) * 1.6 +
    (isSpeaking ? Math.sin(frame * 0.28) * (2.5 + rms * 4.5) : 0);
  const clothSway = Math.sin(frame * 0.07 + id.length) * 5.0;

  const armWave =
    gesture === "wave" || gesture === "bless"
      ? -28 + Math.sin(frame * 0.14) * 11
      : gesture === "bell"
      ? -18 + Math.sin(frame * 0.34) * 15
      : gesture === "sparkler"
      ? -38 + Math.sin(frame * 0.12) * 8
      : gesture === "drum"
      ? -12 + Math.sin(frame * 0.45) * 18
      : gesture === "scroll" || gesture === "platter" || gesture === "cradle"
      ? -14 + Math.sin(frame * 0.06) * 3
      : isSpeaking
      ? -10 + Math.sin(frame * 0.18) * 9
      : Math.sin(frame * 0.06) * 4;

  const mouth = getMouthShape(rms, emotion);
  const brow = getEyebrowOffset(emotion);
  const finalScale = pal.scale * scale;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${flipX ? -finalScale : finalScale}, ${finalScale})`}
      opacity={opacity}
    >
      {/* Soft ground ambient occlusion shadow */}
      <ellipse cx="0" cy="186" rx="64" ry="15" fill="#140c14" opacity={0.32} />

      {/* Torso & Garment (Borderless Painterly) */}
      <g transform={`translate(${speakLean}, ${breathY})`}>
        <path
          d={`M -44 35 Q -50 115 ${-56 + clothSway * 0.4} 182 L ${56 + clothSway * 0.4} 182 Q 50 115 44 35 Q 0 20 -44 35 Z`}
          fill={pal.garment}
        />
        {/* Soft garment fold shading */}
        <path
          d={`M 4 36 Q 16 112 ${26 + clothSway * 0.3} 182 L ${56 + clothSway * 0.4} 182 Q 50 115 44 35 Z`}
          fill={pal.garmentShadow}
          opacity={0.55}
        />
        {/* Saree border / Uttariya shawl */}
        <path
          d={`M -42 38 Q 2 94 48 176 L 28 180 Q -14 106 -46 54 Z`}
          fill={pal.accent}
          opacity={0.92}
        />

        {/* Articulated Right Arm */}
        <g transform={`translate(36, 48) rotate(${armWave})`}>
          <path d="M -8 0 Q 22 25 44 52 L 32 60 Q 10 34 -10 12 Z" fill={pal.skin} />
          <circle cx="40" cy="57" r="9.5" fill={pal.skin} />

          {/* Sparkler (Phuljhuri) */}
          {gesture === "sparkler" && (
            <g transform="translate(44, 54)">
              <line x1="0" y1="0" x2="40" y2="-50" stroke="#80654a" strokeWidth="3.5" />
              <circle cx="40" cy="-50" r={18 + (frame % 4) * 3.5} fill="#ffcf4d" opacity={0.32} />
              <circle cx="40" cy="-50" r={10 + (frame % 4) * 2.5} fill="#ffe985" opacity={0.85} />
              <circle cx="40" cy="-50" r={5} fill="#ffffff" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, si) => (
                <line
                  key={si}
                  x1="40"
                  y1="-50"
                  x2={40 + Math.cos((ang + frame * 11) * (Math.PI / 180)) * (16 + (frame % 3) * 6)}
                  y2={-50 + Math.sin((ang + frame * 11) * (Math.PI / 180)) * (16 + (frame % 3) * 6)}
                  stroke="#fff5a8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}

          {/* Brass Temple Bell (Ghonta) */}
          {gesture === "bell" && (
            <g transform="translate(42, 60)">
              <path d="M -8 0 L 8 0 L 14 20 L -14 20 Z" fill="#e6b84c" />
              <circle cx="0" cy="21" r="4" fill="#c99124" />
            </g>
          )}

          {/* Palm-leaf Horoscope Scroll (Koshthi) */}
          {gesture === "scroll" && (
            <g transform="translate(18, 42) rotate(12)">
              <rect x="-26" y="-8" width="52" height="32" rx="4" fill="#f3dfb6" />
              <line x1="-18" y1="2" x2="18" y2="2" stroke="#8c5a2b" strokeWidth="2" />
              <line x1="-18" y1="10" x2="14" y2="10" stroke="#8c5a2b" strokeWidth="2" />
              <line x1="-18" y1="18" x2="10" y2="18" stroke="#c97b28" strokeWidth="2" />
            </g>
          )}

          {/* Brass Sugar Platter (Chini'r Dala) */}
          {gesture === "platter" && (
            <g transform="translate(10, 56)">
              <ellipse cx="0" cy="4" rx="34" ry="9" fill="#d9a441" />
              <ellipse cx="0" cy="0" rx="22" ry="6" fill="#fffaf0" />
            </g>
          )}
        </g>

        {/* Articulated Left Arm */}
        <g
          transform={`translate(-36, 48) rotate(${
            gesture === "crossed"
              ? 38
              : gesture === "cradle"
              ? -24
              : -Math.sin(frame * 0.06) * 5
          })`}
        >
          <path d="M 8 0 Q -18 28 -30 58 L -18 62 Q -6 34 10 12 Z" fill={pal.skinShadow} />
          <circle cx="-24" cy="60" r="9.5" fill={pal.skin} />
        </g>

        {/* Cradled Baby Thakur (when Manorama cradles) */}
        {gesture === "cradle" && (
          <g transform="translate(8, 88) scale(0.75)">
            <circle cx="0" cy="0" r="56" fill="#fff7cc" opacity={0.32} />
            <ellipse cx="0" cy="10" rx="42" ry="22" fill="#ffffff" />
            <circle cx="-14" cy="0" r="18" fill="#ebbaa0" />
            <path d="M -21 -2 Q -17 -5 -13 -2" stroke="#2c1e1a" strokeWidth="2" fill="none" />
            <path d="M -9 -2 Q -5 -5 -1 -2" stroke="#2c1e1a" strokeWidth="2" fill="none" />
          </g>
        )}

        {/* Head & Neck */}
        <g transform={`translate(0, 12) rotate(${headTilt})`}>
          <rect x="-12" y="-6" width="24" height="28" rx="10" fill={pal.skinShadow} />
          {/* Hair / Veil */}
          {pal.hasVeil ? (
            <path
              d="M -43 -22 Q 0 -78 43 -22 Q 47 28 37 50 L -37 50 Q -47 28 -43 -22 Z"
              fill={pal.garment}
            />
          ) : (
            <path
              d="M -39 -36 Q 0 -80 39 -36 Q 43 -10 35 -2 L -35 -2 Q -43 -10 -39 -36 Z"
              fill={pal.hair}
            />
          )}

          {/* Ears */}
          <ellipse cx="-33" cy="-22" rx="5.5" ry="9" fill={pal.skinShadow} />
          <ellipse cx="33" cy="-22" rx="5.5" ry="9" fill={pal.skinShadow} />

          {/* Face */}
          <ellipse cx="0" cy="-24" rx="33" ry="37" fill={pal.skin} />

          {/* Sindoor for married women */}
          {pal.hasSindoor && (
            <ellipse cx="0" cy="-54" rx="4" ry="3" fill="#c9182b" />
          )}

          {/* Warm cheek blush */}
          <ellipse cx="-18" cy="-15" rx="7.5" ry="4.5" fill="#e87a68" opacity={0.38} />
          <ellipse cx="18" cy="-15" rx="7.5" ry="4.5" fill="#e87a68" opacity={0.38} />

          {/* Expressive Eyebrows */}
          <path
            d={`M -20 ${-39 + brow.lift} Q -13 ${-43 + brow.lift} -6 ${-39 + brow.lift}`}
            stroke={pal.hair}
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${brow.tilt} -13 -39)`}
          />
          <path
            d={`M 6 ${-39 + brow.lift} Q 13 ${-43 + brow.lift} 20 ${-39 + brow.lift}`}
            stroke={pal.hair}
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${-brow.tilt} 13 -39)`}
          />

          {/* Expressive Large Eyes with Blink & Gaze */}
          <g transform={`translate(-13, -27) scale(1, ${eyeScaleY})`}>
            <ellipse cx="0" cy="0" rx="6.8" ry="7.8" fill="#ffffff" />
            <circle cx={1 + eyeLookX * 2.2} cy={eyeLookY * 2.0} r="4.2" fill="#2e1d18" />
            <circle cx={1 + eyeLookX * 2.2} cy={eyeLookY * 2.0} r="2.2" fill="#120c0a" />
            <circle cx={2.4 + eyeLookX * 1.8} cy={-1.8 + eyeLookY * 1.5} r="1.6" fill="#ffffff" />
          </g>
          <g transform={`translate(13, -27) scale(1, ${eyeScaleY})`}>
            <ellipse cx="0" cy="0" rx="6.8" ry="7.8" fill="#ffffff" />
            <circle cx={-1 + eyeLookX * 2.2} cy={eyeLookY * 2.0} r="4.2" fill="#2e1d18" />
            <circle cx={-1 + eyeLookX * 2.2} cy={eyeLookY * 2.0} r="2.2" fill="#120c0a" />
            <circle cx={0.4 + eyeLookX * 1.8} cy={-1.8 + eyeLookY * 1.5} r="1.6" fill="#ffffff" />
          </g>

          {/* Scholar Spectacles (Sundar Thakur) */}
          {pal.hasGlasses && (
            <g stroke="#5c4632" strokeWidth="1.8" fill="none">
              <circle cx="-13" cy="-27" r="9" />
              <circle cx="13" cy="-27" r="9" />
              <line x1="-4" y1="-27" x2="4" y2="-27" />
            </g>
          )}

          {/* Soft Nose */}
          <path d="M 0 -24 Q 3 -17 0 -14" stroke={pal.skinShadow} strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {/* Mustache / Mystic Beard */}
          {pal.hasMustache && (
            <path d="M -15 -11 Q 0 -17 15 -11 Q 7 -8 0 -10 Q -7 -8 -15 -11 Z" fill={pal.hair} />
          )}
          {pal.hasBeard && (
            <path d="M -22 -12 Q 0 22 22 -12 Q 12 4 0 6 Q -12 4 -22 -12 Z" fill={pal.hair} opacity={0.92} />
          )}

          {/* Audio-driven SVG Mouth Viseme */}
          {mouth.open ? (
            <g>
              <ellipse cx="0" cy="-3" rx={mouth.rx} ry={mouth.ry} fill="#782026" />
              <ellipse cx="0" cy={-3 + mouth.ry * 0.35} rx={mouth.rx * 0.55} ry={mouth.ry * 0.35} fill="#c45c62" />
            </g>
          ) : emotion === "grumpy" ? (
            <path d="M -9 -2 Q 0 -7 9 -2" stroke="#782026" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M -9 -5 Q 0 2 9 -5" stroke="#782026" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          )}
        </g>
      </g>
    </g>
  );
};

export const BabyThakurRig: React.FC<{
  x: number;
  y: number;
  scale?: number;
  awakeLooking?: boolean;
}> = ({ x, y, scale = 1, awakeLooking = false }) => {
  const frame = useCurrentFrame();
  const auraPulse = 1 + Math.sin(frame * 0.08) * 0.09;
  const floatY = Math.sin(frame * 0.06) * 3;
  const lookX = awakeLooking ? Math.sin(frame * 0.07) * 2.2 : 0;

  return (
    <g transform={`translate(${x}, ${y + floatY}) scale(${scale})`}>
      {/* Sacred Multi-Layered White-Gold Halo Aura */}
      <circle cx="0" cy="0" r={96 * auraPulse} fill="#fff3b0" opacity={0.14} />
      <circle cx="0" cy="0" r={72 * auraPulse} fill="#fff9db" opacity={0.26} />
      <circle cx="0" cy="0" r={48 * auraPulse} fill="#ffffff" opacity={0.38} />
      {/* Soft white cloth wrap */}
      <ellipse cx="0" cy="12" rx="46" ry="25" fill="#ffffff" />
      <ellipse cx="4" cy="15" rx="34" ry="16" fill="#f5efe6" opacity={0.7} />
      <circle cx="-16" cy="1" r="19.5" fill="#ebbaa0" />
      <ellipse cx="-22" cy="5" rx="4.5" ry="2.5" fill="#e87a68" opacity={0.35} />
      <ellipse cx="-6" cy="5" rx="4.5" ry="2.5" fill="#e87a68" opacity={0.35} />

      {/* Eyes: serene closed OR intelligently looking around (Scene 06) */}
      {awakeLooking ? (
        <g>
          <ellipse cx="-20" cy="-1" rx="3.8" ry="4.2" fill="#ffffff" />
          <circle cx={-20 + lookX} cy="-1" r="2.4" fill="#1e1615" />
          <circle cx={-19.2 + lookX} cy="-2" r="0.9" fill="#ffffff" />
          <ellipse cx="-8" cy="-1" rx="3.8" ry="4.2" fill="#ffffff" />
          <circle cx={-8 + lookX} cy="-1" r="2.4" fill="#1e1615" />
          <circle cx={-7.2 + lookX} cy="-2" r="0.9" fill="#ffffff" />
        </g>
      ) : (
        <g>
          <path d="M -23 0 Q -19 -3 -15 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M -11 0 Q -7 -3 -3 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      )}
      <path d="M -17 9 Q -13 13 -9 9" stroke="#9e4747" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
};

export const LittleGoatRig: React.FC<{
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
}> = ({ x, y, scale = 1, flipX = false }) => {
  const frame = useCurrentFrame();
  const hopY = -Math.abs(Math.sin(frame * 0.14)) * 22;
  const earFlop = Math.sin(frame * 0.28) * 14;
  const tailWag = Math.sin(frame * 0.4) * 18;

  return (
    <g transform={`translate(${x}, ${y + hopY}) scale(${flipX ? -scale : scale}, ${scale})`}>
      <ellipse cx="0" cy={56 - hopY * 0.4} rx="38" ry="9" fill="#1a1018" opacity={0.22} />
      {/* Wagging tail */}
      <path
        d="M 32 10 Q 48 0 46 -10"
        stroke="#f5ede4"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        transform={`rotate(${tailWag} 32 10)`}
      />
      {/* Body & Brown patch */}
      <ellipse cx="0" cy="20" rx="36" ry="23" fill="#f7efe6" />
      <ellipse cx="14" cy="18" rx="15" ry="13" fill="#b87d52" />
      {/* Legs */}
      <rect x="-24" y="34" width="7.5" height="23" rx="3.5" fill="#e8d8c5" />
      <rect x="-10" y="36" width="7.5" height="21" rx="3.5" fill="#e8d8c5" />
      <rect x="14" y="34" width="7.5" height="23" rx="3.5" fill="#e8d8c5" />
      {/* Head, floppy ear & happy smile */}
      <circle cx="-30" cy="0" r="19" fill="#f7efe6" />
      <ellipse cx="-41" cy="3" rx="6.5" ry="14" fill="#b87d52" transform={`rotate(${earFlop} -41 -6)`} />
      <circle cx="-35" cy="-4" r="4" fill="#ffffff" />
      <circle cx="-35.5" cy="-4" r="2.6" fill="#1e1615" />
      <circle cx="-36.2" cy="-5" r="1" fill="#ffffff" />
      <ellipse cx="-46" cy="4" rx="4" ry="3" fill="#e89a8c" />
      <path d="M -42 9 Q -37 13 -32 9" stroke="#7d4a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
};
