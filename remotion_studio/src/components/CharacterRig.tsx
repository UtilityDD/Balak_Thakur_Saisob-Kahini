import React from "react";
import { useCurrentFrame } from "remotion";
import { CharacterId } from "../types/studio";
import { blinkOpenness, clamp, fbm1D, noise1D, seedOf } from "../lib/motion";
import { mix, useMood } from "../lib/mood";
import { RadialGlow, useSvgId } from "./Cinematic";

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

export type Gesture = "idle" | "wave" | "sparkler" | "bell" | "bless" | "scroll";
export type RiggedCharacterId = Exclude<CharacterId, "narrator" | "baby_thakur" | "little_goat">;

/** World-space head position for a rig placed at (x, y): used by the camera to frame speakers. */
export const headPosition = (id: RiggedCharacterId, x: number, y: number) => {
  const s = (PALETTES[id] ?? PALETTES.babukaka).scale;
  return { x, y: y - 12 * s, scale: s };
};

export const CharacterRig: React.FC<{
  id: RiggedCharacterId;
  x: number;
  y: number;
  flipX?: boolean;
  /** 0..1 smoothed speech energy (mouth opening). */
  rms?: number;
  /** 0..1 rising-edge of speech energy: drives nods & brow lifts on stressed syllables. */
  emphasis?: number;
  /** World-space x the character is looking toward (speaker / point of interest). */
  lookAtX?: number;
  gesture?: Gesture;
}> = ({ id, x, y, flipX = false, rms = 0, emphasis = 0, lookAtX, gesture = "idle" }) => {
  const frame = useCurrentFrame();
  const mood = useMood();
  const pal = PALETTES[id] ?? PALETTES.babukaka;
  const seed = seedOf(id);
  const uid = useSvgId(id);
  const flipSign = flipX ? -1 : 1;
  const speaking = rms > 0.06;

  /* --- lighting in rig-local space (mirrored rigs see the light from the other side) --- */
  const lightSide = mood.keyDir * flipSign;
  const garmentLit = mix(pal.garment, mood.key, 0.2);
  const garmentShade = mix(pal.garment, mood.shadow, 0.42);
  const accentShade = mix(pal.accent, mood.shadow, 0.35);
  const skinLit = mix(pal.skin, mood.key, 0.16);
  const skinShade = mix(pal.skin, mood.shadow, 0.34);

  /* --- performance --- */
  const eyeOpen = blinkOpenness(frame, seed);
  const look = lookAtX === undefined ? 0 : clamp((lookAtX - x) / 320, -1, 1) * flipSign;
  // Eyes dart in small saccades between fixations.
  const saccade = (noise1D(Math.floor(frame / 16) + seed, 3) - 0.5) * 0.7;
  const gaze = clamp(look + saccade * 0.4, -1, 1);
  const turn = look * 0.55 + fbm1D(frame / 90, seed) * 0.12;

  const breath = Math.sin(frame * 0.085 + seed);
  const weightShift = fbm1D(frame / 110, seed + 5) * 4;
  // Head lags the breath cycle (overlapping action) and nods on emphasis.
  const headTilt = Math.sin(frame * 0.085 + seed - 0.6) * 1.2 + fbm1D(frame / 60, seed + 9) * 2.2 + rms * 2.4 + turn * 3;
  const nod = emphasis * 3.2 + rms * 1.4;
  const browLift = emphasis * 3.5 + (speaking ? 0.8 : 0) + (gesture === "bless" ? 1.2 : 0);

  const armWave =
    gesture === "wave"
      ? -32 + Math.sin(frame * 0.18) * 14
      : gesture === "bless"
      ? -38 + fbm1D(frame / 40, seed) * 5
      : gesture === "bell"
      ? Math.sin(frame * 0.32) * 14
      : gesture === "sparkler"
      ? -35 + Math.sin(frame * 0.12) * 8 + fbm1D(frame / 18, seed) * 6
      : Math.sin(frame * 0.05 + seed) * 3 + (speaking ? fbm1D(frame / 22, seed + 3) * 9 : 0);
  const leftArm = -Math.sin(frame * 0.05 + seed) * 4 - (speaking ? Math.abs(fbm1D(frame / 26, seed + 4)) * 8 : 0);

  /* --- mouth: continuous opening with vowel width variation --- */
  const open = clamp(rms, 0, 1);
  const vowelW = 0.75 + 0.5 * noise1D(frame / 4 + seed, 7);
  const mouthRx = 6 + 7.5 * vowelW * (0.45 + 0.55 * open);
  const mouthRy = 1.5 + 11 * open * (1.15 - vowelW * 0.3);
  const fx = turn * 5; // feature shift for 2.5D head turn

  const clothLag = fbm1D(frame / 34 - 0.4, seed + 11) * 6 + Math.sin(frame * 0.07 + seed) * 2;

  return (
    <g transform={`translate(${x + weightShift}, ${y}) scale(${flipSign * pal.scale}, ${pal.scale})`}>
      <defs>
        <linearGradient id={`${uid}-garment`} x1={lightSide > 0 ? "1" : "0"} y1="0" x2={lightSide > 0 ? "0" : "1"} y2="0.3">
          <stop offset="0%" stopColor={garmentLit} />
          <stop offset="55%" stopColor={pal.garment} />
          <stop offset="100%" stopColor={garmentShade} />
        </linearGradient>
        <radialGradient id={`${uid}-skin`} cx={0.5 + lightSide * 0.22} cy="0.35" r="0.75">
          <stop offset="0%" stopColor={skinLit} />
          <stop offset="60%" stopColor={pal.skin} />
          <stop offset="100%" stopColor={skinShade} />
        </radialGradient>
        <clipPath id={`${uid}-mouth`}>
          <ellipse cx={fx} cy={-4 + nod * 0.2} rx={mouthRx} ry={mouthRy} />
        </clipPath>
      </defs>

      {/* Contact shadow: tighter and darker under the feet, soft falloff */}
      <ellipse cx={-lightSide * 10} cy="186" rx="66" ry="13" fill={mood.shadow} opacity={0.18} />
      <ellipse cx={-lightSide * 4} cy="184" rx="40" ry="7" fill={mood.shadow} opacity={0.32} />

      {/* Bare feet */}
      <ellipse cx="-16" cy="181" rx="11" ry="5" fill={skinShade} />
      <ellipse cx="18" cy="181" rx="11" ry="5" fill={pal.skin} />

      <g transform={`translate(0, ${breath * 1.6}) scale(1, ${1 + breath * 0.008})`}>
        {/* Torso & garment with form shading */}
        <path
          d={`M -42 35 Q -48 115 ${-54 + clothLag * 0.5} 180 L ${54 + clothLag * 0.5} 180 Q 48 115 42 35 Q 0 22 -42 35 Z`}
          fill={`url(#${uid}-garment)`}
        />
        {/* Cloth fold shadows */}
        <path d={`M -8 60 Q ${-12 + clothLag * 0.3} 120 ${-16 + clothLag * 0.5} 178`} stroke={garmentShade} strokeWidth={5} fill="none" opacity={0.35} strokeLinecap="round" />
        <path d={`M 18 70 Q ${22 + clothLag * 0.3} 128 ${26 + clothLag * 0.5} 178`} stroke={garmentShade} strokeWidth={4} fill="none" opacity={0.28} strokeLinecap="round" />
        {/* Saree border / uttariya shawl */}
        <path d={`M -40 38 Q 0 92 ${46 + clothLag * 0.4} 175 L ${28 + clothLag * 0.4} 178 Q -12 105 -44 52 Z`} fill={pal.accent} opacity={0.92} />
        <path d={`M -40 38 Q 0 92 ${46 + clothLag * 0.4} 175`} stroke={accentShade} strokeWidth={3} fill="none" opacity={0.5} />
        {/* Hanging shawl end: follows through behind the body's motion */}
        <path d={`M -40 40 Q ${-58 + clothLag} 80 ${-52 + clothLag * 1.6} 122 L ${-40 + clothLag * 1.6} 124 Q ${-44 + clothLag} 82 -30 44 Z`} fill={accentShade} />
        {/* Rim light along the lit shoulder */}
        <path d={lightSide > 0 ? "M 26 30 Q 44 34 46 64" : "M -26 30 Q -44 34 -46 64"} stroke={mood.rim} strokeWidth={3} fill="none" opacity={mood.rimStrength * 0.7} strokeLinecap="round" />

        {/* Right arm */}
        <g transform={`translate(36, 48) rotate(${armWave})`}>
          <path d="M -8 0 Q 22 25 44 52 L 32 60 Q 10 34 -10 12 Z" fill={`url(#${uid}-skin)`} />
          <circle cx="40" cy="57" r="9" fill={pal.skin} />
          {gesture === "sparkler" && (
            <g transform="translate(44, 54)">
              <line x1="0" y1="0" x2="36" y2="-46" stroke="#80654a" strokeWidth="3" />
              <RadialGlow cx={36} cy={-46} r={46 + noise1D(frame / 2, seed) * 16} color="#ffd36a" opacity={0.8} />
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i / 8) * Math.PI * 2 + frame * 0.7;
                const len = 10 + noise1D(frame / 1.5 + i * 3, seed + i) * 18;
                return <line key={i} x1={36} y1={-46} x2={36 + Math.cos(a) * len} y2={-46 + Math.sin(a) * len} stroke="#fff3b0" strokeWidth={1.4} strokeLinecap="round" />;
              })}
              <circle cx="36" cy="-46" r={4.5} fill="#ffffff" />
            </g>
          )}
          {gesture === "bell" && (
            <g transform={`translate(42, 64) rotate(${Math.sin(frame * 0.32 - 0.8) * 18})`}>
              <path d="M -8 0 L 8 0 L 12 18 L -12 18 Z" fill="#e6b84c" />
              <path d="M -4 2 L -6 16" stroke="#fff0b0" strokeWidth={2} opacity={0.7} />
              <circle cx="0" cy="20" r="3" fill="#a8822e" />
            </g>
          )}
          {gesture === "bless" && <RadialGlow cx={40} cy={57} r={34} color={mood.key} opacity={0.35 + 0.15 * noise1D(frame / 20, seed)} />}
        </g>

        {/* Left arm */}
        <g transform={`translate(-36, 48) rotate(${leftArm})`}>
          <path d="M 8 0 Q -18 28 -30 58 L -18 62 Q -6 34 10 12 Z" fill={`url(#${uid}-skin)`} />
          <circle cx="-24" cy="60" r="9" fill={skinShade} />
        </g>

        {/* Head & neck */}
        <g transform={`translate(0, ${12 + nod * 0.5}) rotate(${headTilt})`}>
          {pal.hasVeil && (
            /* Ghomta: covers the head and falls to the shoulders on either side, open at the throat */
            <path
              d={`M ${-42 - fx * 0.4} -22 Q 0 -78 ${42 - fx * 0.4} -22 Q 50 18 44 50 L 18 50 Q 20 22 22 0 L -22 0 Q -20 22 -18 50 L -44 50 Q -50 18 -42 -22 Z`}
              fill={`url(#${uid}-garment)`}
            />
          )}
          <rect x="-12" y="-6" width="24" height="28" rx="10" fill={skinShade} />
          {/* Neck occlusion under the jaw */}
          <ellipse cx="0" cy="4" rx="14" ry="5" fill={mood.shadow} opacity={0.25} />

          {pal.hasVeil ? (
            <path d={`M ${-40 - fx * 0.4} -20 Q 0 -74 ${40 - fx * 0.4} -20`} stroke={pal.accent} strokeWidth={5} fill="none" />
          ) : (
            <>
              <path d={`M ${-38 - fx * 0.6} -36 Q 0 -78 ${38 - fx * 0.6} -36 Q 42 -12 34 -4 L -34 -4 Q -42 -12 -38 -36 Z`} fill={pal.hair} />
              <path d={`M ${lightSide * 6} -58 Q ${lightSide * 22} -56 ${lightSide * 30} -40`} stroke={mix(pal.hair, mood.key, 0.5)} strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
            </>
          )}

          {/* Face with key-light modelling; narrows slightly as the head turns */}
          <ellipse cx={fx * 0.3} cy="-24" rx={33 - Math.abs(turn) * 2} ry="37" fill={`url(#${uid}-skin)`} />
          {/* Rim light on the lit cheek */}
          <path
            d={lightSide > 0 ? "M 22 -54 Q 36 -30 24 2" : "M -22 -54 Q -36 -30 -24 2"}
            stroke={mood.rim}
            strokeWidth={2.6}
            fill="none"
            opacity={mood.rimStrength * 0.8}
            strokeLinecap="round"
          />
          {/* Ear on the far side reveals the head turn */}
          <ellipse cx={-30 * Math.sign(turn || 1) + fx * 0.2} cy="-22" rx="5" ry="8" fill={skinShade} opacity={Math.min(1, Math.abs(turn) * 2.5)} />

          {/* Features move together for a 2.5D head turn */}
          <g transform={`translate(${fx}, 0)`}>
            <ellipse cx="-18" cy="-14" rx="7" ry="4" fill="#e87e6b" opacity={0.3 + (speaking ? 0.08 : 0)} />
            <ellipse cx="18" cy="-14" rx="7" ry="4" fill="#e87e6b" opacity={0.3 + (speaking ? 0.08 : 0)} />

            {/* Brows */}
            <path d={`M -20 ${-38 - browLift} Q -13 ${-42 - browLift * 1.2} -6 ${-38 - browLift * 0.6}`} stroke={pal.isElder ? pal.hair : mix(pal.hair, pal.skin, 0.15)} strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d={`M 6 ${-38 - browLift * 0.6} Q 13 ${-42 - browLift * 1.2} 20 ${-38 - browLift}`} stroke={pal.isElder ? pal.hair : mix(pal.hair, pal.skin, 0.15)} strokeWidth={3} fill="none" strokeLinecap="round" />

            {/* Eyes: blink curve, gaze, catch-light */}
            {[-13, 13].map((ex) => (
              <g key={ex} transform={`translate(${ex}, -27) scale(1, ${Math.max(0.06, eyeOpen)})`}>
                <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#fffaf2" />
                <circle cx={gaze * 2.6} cy={0.5} r="4.2" fill="#2a1a14" />
                <circle cx={gaze * 2.6} cy={0.5} r="2.2" fill="#0e0806" />
                <circle cx={gaze * 2.6 + 1.6} cy="-1.6" r="1.5" fill="#ffffff" />
                {/* Upper lid shadow */}
                <path d="M -6.5 -2 Q 0 -9 6.5 -2" stroke={skinShade} strokeWidth={2} fill="none" opacity={0.5} />
              </g>
            ))}

            {pal.isElder && (
              <>
                <path d="M -22 -20 q 4 2 8 0" stroke={skinShade} strokeWidth={1.4} fill="none" opacity={0.6} />
                <path d="M 14 -20 q 4 2 8 0" stroke={skinShade} strokeWidth={1.4} fill="none" opacity={0.6} />
              </>
            )}

            {pal.hasMustache && (
              <path d={`M -14 -12 Q 0 ${-17 - open * 2} 14 -12 Q 6 -9 0 -11 Q -6 -9 -14 -12 Z`} fill={pal.hair} />
            )}

            {/* Mouth: clipped interior with teeth and tongue */}
            {open > 0.08 ? (
              <g>
                <ellipse cx={0} cy={-4 + nod * 0.2} rx={mouthRx} ry={mouthRy} fill="#5a1820" />
                <g clipPath={`url(#${uid}-mouth)`} transform={`translate(${-fx}, 0)`}>
                  <rect x={fx - mouthRx} y={-4 + nod * 0.2 - mouthRy} width={mouthRx * 2} height={Math.min(3.2, mouthRy * 0.45)} fill="#fbf4ea" />
                  <ellipse cx={fx} cy={-4 + nod * 0.2 + mouthRy * 0.75} rx={mouthRx * 0.7} ry={mouthRy * 0.5} fill="#c4505a" />
                </g>
              </g>
            ) : (
              <path d="M -9 -5 Q 0 1 9 -5" stroke="#7a2a2e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            )}
          </g>

          {pal.isChild && !pal.hasVeil && (
            <path d={`M ${-6 - fx * 0.6} -70 q 6 -12 14 -4`} stroke={pal.hair} strokeWidth={4} fill="none" strokeLinecap="round" />
          )}
        </g>
      </g>
    </g>
  );
};

/** Divine infant: breathing swaddle, rotating aura rays, soft halo pulse. */
export const BabyThakurRig: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const frame = useCurrentFrame();
  const uid = useSvgId("baby");
  const auraPulse = 1 + Math.sin(frame * 0.07) * 0.07;
  const floatY = Math.sin(frame * 0.055) * 3;
  const breathe = 1 + Math.sin(frame * 0.12) * 0.025;

  return (
    <g transform={`translate(${x}, ${y + floatY}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${uid}-ray`}>
          <stop offset="0%" stopColor="#fff6cf" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#fff6cf" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${frame * 0.25})`} opacity={0.5}>
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i} d="M 0 0 L -9 -170 L 9 -170 Z" fill={`url(#${uid}-ray)`} transform={`rotate(${i * 30})`} opacity={0.5 + 0.5 * noise1D(frame / 30 + i, 18)} />
        ))}
      </g>
      <RadialGlow cx={0} cy={0} r={120 * auraPulse} color="#fff1b8" opacity={0.55} />
      <RadialGlow cx={0} cy={0} r={60 * auraPulse} color="#ffffff" opacity={0.6} />

      <ellipse cx="0" cy="30" rx="48" ry="8" fill="#2a1a30" opacity={0.18} />
      <g transform={`scale(${breathe}, ${breathe})`}>
        <ellipse cx="0" cy="12" rx="44" ry="24" fill="#ffffff" />
        <path d="M -30 4 Q 0 22 38 6" stroke="#e8e0d6" strokeWidth={3} fill="none" />
        <path d="M -20 18 Q 8 30 36 16" stroke="#e8e0d6" strokeWidth={2.5} fill="none" />
        <ellipse cx="14" cy="4" rx="7" ry="5" fill="#ebbaa0" />
      </g>
      <circle cx="-16" cy="2" r="19" fill="#ebbaa0" />
      <ellipse cx="-22" cy="-6" rx="9" ry="7" fill="#fff0e4" opacity={0.4} />
      <circle cx="-16" cy="-10" r="2.2" fill="#d9462e" />
      <path d="M -23 0 Q -19 -3 -15 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M -11 0 Q -7 -3 -3 0" stroke="#2c1e1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="-26" cy="6" rx="3.5" ry="2" fill="#e87e6b" opacity={0.4} />
      <ellipse cx="-6" cy="6" rx="3.5" ry="2" fill="#e87e6b" opacity={0.4} />
      <path d="M -17 9 Q -13 13 -9 9" stroke="#9e4747" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Playful kid goat: hop cycle with leg tuck, ear flop, tail wag, blinks. */
export const LittleGoatRig: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const phase = frame * 0.14;
  const hop = Math.abs(Math.sin(phase));
  const hopY = -hop * 22;
  const squash = 1 + (1 - hop) ** 6 * 0.08;
  const earFlop = Math.sin(phase * 2 - 0.6) * 14;
  const tail = Math.sin(frame * 0.6) * 22;
  const legTuck = hop * 10;
  const eye = blinkOpenness(frame, 777);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="58" rx={36 * (1 - hop * 0.35)} ry={6 * (1 - hop * 0.35)} fill="#2a1a20" opacity={0.25} />
      <g transform={`translate(0, ${hopY}) scale(${2 - squash}, ${squash})`}>
        <path d={`M 30 10 l 10 ${-10 + tail * 0.2} l 4 6 Z`} fill="#e6d6c3" transform={`rotate(${tail} 30 10)`} />
        <rect x="-22" y="34" width="7" height={22 - legTuck} rx="3" fill="#e6d6c3" transform={`rotate(${-hop * 20} -18 34)`} />
        <rect x="14" y="34" width="7" height={22 - legTuck} rx="3" fill="#e6d6c3" transform={`rotate(${hop * 20} 18 34)`} />
        <ellipse cx="0" cy="20" rx="34" ry="22" fill="#f5ede4" />
        <ellipse cx="14" cy="18" rx="14" ry="12" fill="#b87d52" />
        <ellipse cx="0" cy="32" rx="28" ry="8" fill="#d8c8b8" opacity={0.6} />
        <circle cx="-30" cy="0" r="18" fill="#f5ede4" />
        <path d="M -34 -16 l -4 -10 l 5 2 Z" fill="#c9b49a" />
        <ellipse cx="-40" cy="2" rx="6" ry="13" fill="#b87d52" transform={`rotate(${earFlop} -40 -6)`} />
        <g transform={`translate(-35, -4) scale(1, ${Math.max(0.08, eye)})`}>
          <circle r="3.5" fill="#1e1615" />
          <circle cx="1" cy="-1" r="1" fill="#ffffff" />
        </g>
        <ellipse cx="-46" cy="6" rx="3" ry="2" fill="#d9a0a0" />
      </g>
    </g>
  );
};
