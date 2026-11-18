import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Scene 00: Ornate Bengali Title Crest with blooming Alpona, Bansuri & Dhak */
export const Episode01TitleCrest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 85 } });
  const mandalaSpin = frame * 0.18;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
        textAlign: "center",
      }}
    >
      {/* Blooming Golden Alpona Mandala */}
      <svg
        width="680"
        height="680"
        viewBox="-340 -340 680 680"
        style={{
          position: "absolute",
          opacity: 0.24 * pop,
          transform: `scale(${0.7 + 0.3 * pop}) rotate(${mandalaSpin}deg)`,
        }}
      >
        <circle cx="0" cy="0" r="260" fill="none" stroke="#fff8dc" strokeWidth="3" strokeDasharray="16 12" />
        <circle cx="0" cy="0" r="205" fill="none" stroke="#ffe18c" strokeWidth="2" />
        {Array.from({ length: 16 }).map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-145"
            rx="22"
            ry="54"
            fill="none"
            stroke="#fff4c4"
            strokeWidth="2.5"
            transform={`rotate(${i * 22.5})`}
          />
        ))}
      </svg>

      {/* Bansuri Flute & Diya Emblem */}
      <svg
        width="260"
        height="90"
        viewBox="0 0 260 90"
        style={{
          marginBottom: 14,
          opacity: pop,
          transform: `translateY(${(1 - pop) * 20}px)`,
        }}
      >
        <rect x="35" y="42" width="190" height="10" rx="5" fill="#7a421d" />
        <rect x="42" y="44" width="176" height="3" rx="1.5" fill="#d49550" opacity="0.6" />
        {[85, 108, 131, 154, 177, 198].map((hx, i) => (
          <circle key={i} cx={hx} cy="47" r="2.8" fill="#2b1408" />
        ))}
        {/* Floating musical notes */}
        <circle cx="95" cy={24 - Math.sin(frame * 0.1) * 5} r="4.5" fill="#fff8d6" opacity="0.9" />
        <circle cx="155" cy={18 - Math.cos(frame * 0.12) * 5} r="3.8" fill="#fff8d6" opacity="0.85" />
      </svg>

      <div
        style={{
          fontSize: 44,
          color: "#fff8e1",
          fontWeight: 700,
          letterSpacing: "0.02em",
          textShadow: "0 4px 18px rgba(30, 12, 0, 0.45)",
          transform: `scale(${0.85 + 0.15 * pop})`,
          opacity: pop,
        }}
      >
        ছোটদের বালক ঠাকুরের গল্প
      </div>

      <div
        style={{
          marginTop: 18,
          padding: "16px 44px",
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(255,248,225,0.22), rgba(255,214,102,0.12))",
          backdropFilter: "blur(4px)",
          transform: `scale(${0.82 + 0.18 * pop})`,
          opacity: pop,
        }}
      >
        <div
          style={{
            fontSize: 78,
            color: "#142850",
            fontWeight: 900,
            textShadow: "0 4px 0 #ffd166, 0 10px 28px rgba(0,0,0,0.25)",
          }}
        >
          পর্ব ১: যে রাতে ঢাক থেমে গেল
        </div>
      </div>
    </div>
  );
};

/** Scene 01: Medinimondal Village Landmarks synchronized to narration */
export const MedinimondalVillageLayers: React.FC = () => {
  const frame = useCurrentFrame();

  // Beat 2: Station, Market, Tol & Moktob (frames 250 - 680)
  const landmarksOpacity = interpolate(frame, [230, 275, 650, 710], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Beat 3: Canal & Baidik Bari approach (frames 640 - 920)
  const canalOpacity = interpolate(frame, [620, 670, 880, 940], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Beat 4: 12 Brothers & 1.5 Maund Rice Feast Vignette (frames 880 - 1162)
  const feastOpacity = interpolate(frame, [870, 915, 1130, 1162], [0, 1, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Beat 2: Steamer Station, Bazaar, Tol & Moktob */}
      <g opacity={landmarksOpacity}>
        {/* Small 1920s Riverside Station */}
        <g transform="translate(270, 635)">
          <rect x="0" y="25" width="160" height="75" rx="4" fill="#e8d8c3" />
          <path d="M -16 28 L 80 -18 L 176 28 Z" fill="#8c3b2b" />
          <rect x="35" y="-6" width="90" height="22" rx="3" fill="#1d3557" />
          <text x="80" y="9" textAnchor="middle" fill="#fff8e1" fontSize="13" fontWeight="700">
            মেদিনীমণ্ডল ঘাট
          </text>
        </g>

        {/* Bustling Haat / Market Canopies */}
        <g transform="translate(560, 675)">
          {[0, 110, 220].map((mx, i) => (
            <g key={i} transform={`translate(${mx}, 0)`}>
              <line x1="12" y1="0" x2="12" y2="55" stroke="#6e472b" strokeWidth="4" />
              <line x1="88" y1="0" x2="88" y2="55" stroke="#6e472b" strokeWidth="4" />
              <path
                d="M 0 0 Q 50 -24 100 0 L 92 14 L 8 14 Z"
                fill={i % 2 === 0 ? "#d95d39" : "#f0a202"}
              />
            </g>
          ))}
        </g>

        {/* Tol & Moktob Schoolhouses */}
        <g transform="translate(960, 660)">
          <rect x="0" y="20" width="120" height="60" rx="4" fill="#f2e4cf" />
          <path d="M -12 22 Q 60 -22 132 22 Z" fill="#a67c52" />
          <text x="60" y="54" textAnchor="middle" fill="#4a2c18" fontSize="15" fontWeight="700">
            টোল ও মক্তব
          </text>
        </g>
      </g>

      {/* Beat 3: Canal & Kalirkhil Bridge leading to Baidik Bari */}
      <g opacity={canalOpacity}>
        <path
          d="M 0 880 Q 480 820 960 855 T 1480 780 L 1480 830 Q 960 910 0 940 Z"
          fill="#2d80a6"
          opacity={0.78}
        />
        <g transform="translate(760, 810)">
          <path d="M -70 25 Q 0 -10 70 25" stroke="#6b4423" strokeWidth="10" fill="none" />
          <path d="M -70 10 Q 0 -25 70 10" stroke="#8c5a32" strokeWidth="4" fill="none" />
        </g>
      </g>

      {/* Beat 4: Joint Family & 1.5 Maund Rice Feast Vignette */}
      <g opacity={feastOpacity} transform="translate(560, 640)">
        <ellipse cx="0" cy="40" rx="220" ry="130" fill="#fff6e3" opacity={0.94} />
        <ellipse cx="0" cy="40" rx="212" ry="122" fill="none" stroke="#d98a3c" strokeWidth="4" />
        {/* Steaming Brass Handi Pots */}
        {[-70, 0, 70].map((hx, i) => (
          <g key={i} transform={`translate(${hx}, 50)`}>
            <ellipse cx="0" cy="18" rx="28" ry="22" fill="#c77d2c" />
            <ellipse cx="0" cy="-2" rx="22" ry="8" fill="#fffaf0" />
            {/* Rising steam */}
            <path
              d={`M -6 ${-12 - (frame % 24) * 0.8} Q 4 ${-26 - (frame % 24) * 0.8} -4 ${-40 - (frame % 24) * 0.8}`}
              stroke="#d9c6b0"
              strokeWidth="3"
              fill="none"
              opacity={0.7}
            />
          </g>
        ))}
        <text x="0" y="-32" textAnchor="middle" fill="#6b2d18" fontSize="24" fontWeight="800">
          বারো ভাই ও বিশাল যৌথ পরিবার
        </text>
        <text x="0" y="118" textAnchor="middle" fill="#8a4b24" fontSize="19" fontWeight="700">
          দু’বেলা প্রায় দেড়মণ চালের ভাত রান্না হতো!
        </text>
      </g>
    </svg>
  );
};

/** Scene 02: Akash-Pradip, Baithakkhana Storytelling, Duikha & Kansor */
export const DiwaliCourtyardExtras: React.FC = () => {
  const frame = useCurrentFrame();

  // Baithakkhana vignette (frames 340 - 540)
  const baithakOpacity = interpolate(frame, [320, 360, 510, 560], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Duikha eating gur-muri behind kansor (frames 510 - 780)
  const duikhaOpacity = interpolate(frame, [495, 535, 740, 790], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const coughBounce = Math.abs(Math.sin(frame * 0.38)) * 6;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Tall Bamboo Akash-Pradip (Sky Lantern) */}
      <g transform="translate(360, 760)">
        <line x1="0" y1="0" x2="0" y2="-520" stroke="#5e432c" strokeWidth="7" />
        <circle cx="0" cy="-525" r={46 + Math.sin(frame * 0.2) * 5} fill="#ffcc5c" opacity={0.28} />
        <rect x="-14" y="-545" width="28" height="38" rx="4" fill="#ffe89e" />
        <path d="M -18 -545 L 0 -562 L 18 -545 Z" fill="#9c4a26" />
      </g>

      {/* Baithakkhana Warm Storytelling Vignette */}
      <g opacity={baithakOpacity} transform="translate(1410, 440)">
        <ellipse cx="0" cy="0" rx="195" ry="125" fill="#2b1720" opacity={0.92} />
        <ellipse cx="0" cy="0" rx="188" ry="118" fill="none" stroke="#ffbe55" strokeWidth="3.5" />
        <circle cx="-55" cy="-10" r="24" fill="#d99b72" />
        <path d="M -82 55 Q -55 12 -28 55 Z" fill="#f5efe6" />
        {/* Listening silhouettes */}
        {[25, 75, 115].map((lx, i) => (
          <g key={i} transform={`translate(${lx}, ${10 + (i % 2) * 8})`}>
            <circle cx="0" cy="-12" r="14" fill="#c98b63" />
            <path d="M -18 38 Q 0 5 18 38 Z" fill="#e8dcc8" />
          </g>
        ))}
        <text x="0" y="-76" textAnchor="middle" fill="#ffe3a3" fontSize="20" fontWeight="700">
          বৈঠকখানায় কেদারকাকার মজার গল্প
        </text>
      </g>

      {/* Little Duikha eating Gur-Muri on the back of a brass Kansor */}
      <g opacity={duikhaOpacity} transform={`translate(460, 765)`}>
        <ellipse cx="0" cy="0" rx="170" ry="110" fill="#26141c" opacity={0.9} />
        <ellipse cx="0" cy="0" rx="163" ry="103" fill="none" stroke="#ffbe55" strokeWidth="3" />
        {/* Duikha */}
        <g transform={`translate(-30, ${-coughBounce})`}>
          <circle cx="0" cy="-22" r="21" fill="#d4946a" />
          <circle cx="-6" cy="-25" r="3" fill="#1e1615" />
          <circle cx="6" cy="-25" r="3" fill="#1e1615" />
          <ellipse cx="0" cy="-12" rx="6" ry={3 + coughBounce * 0.7} fill="#782026" />
          <path d="M -22 36 Q 0 -2 22 36 Z" fill="#f5efe6" />
        </g>
        {/* Brass Kansor Gong with Puffed Rice */}
        <ellipse cx="42" cy="18" rx="44" ry="14" fill="#d9a441" />
        <ellipse cx="42" cy="12" rx="28" ry="8" fill="#fff7e6" />
        <circle cx="36" cy="9" r="5" fill="#9c4a1a" />
        <text x="0" y="76" textAnchor="middle" fill="#ffe3a3" fontSize="19" fontWeight="700">
          কাঁসরের উল্টো পিঠে গুড়-মুড়ি!
        </text>
      </g>
    </svg>
  );
};

/** Scene 03: Offscreen Call Waves & Celestial Birth Lotus Bloom */
export const SacredArrivalAura: React.FC<{ callActive: boolean; birthProgress: number }> = ({
  callActive,
  birthProgress,
}) => {
  const frame = useCurrentFrame();

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Offscreen Call Ripples from Mandap direction */}
      {callActive &&
        [0, 1, 2].map((i) => {
          const age = (frame + i * 12) % 36;
          return (
            <circle
              key={i}
              cx={1620}
              cy={480}
              r={40 + age * 8}
              fill="none"
              stroke="#ffd478"
              strokeWidth="3"
              opacity={Math.max(0, 0.55 - age * 0.015)}
            />
          );
        })}

      {/* Celestial Birth Lotus Bloom */}
      {birthProgress > 0 && (
        <g transform="translate(960, 770)" opacity={birthProgress * 0.85}>
          <circle cx="0" cy="0" r={160 * birthProgress} fill="#fff9db" opacity={0.22} />
          <circle cx="0" cy="0" r={95 * birthProgress} fill="#ffffff" opacity={0.32} />
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse
              key={i}
              cx="0"
              cy={-60 * birthProgress}
              rx={18 * birthProgress}
              ry={44 * birthProgress}
              fill="#fff3b0"
              opacity={0.28}
              transform={`rotate(${i * 45 + frame * 0.4})`}
            />
          ))}
        </g>
      )}
    </svg>
  );
};

/** Scene 04: Dhak Drummer, Clarinet Player & 7 Concentric Uludhwani Waves */
export const MandapAndUludhwani: React.FC<{
  freezeAtFrame: number;
  uludhwaniStartFrame: number;
}> = ({ freezeAtFrame, uludhwaniStartFrame }) => {
  const rawFrame = useCurrentFrame();
  const isFrozen = rawFrame >= freezeAtFrame;
  const frame = isFrozen ? freezeAtFrame : rawFrame;
  const stickSwing = Math.sin(frame * 0.45) * 22;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Manmohan Dhak Drummer (Left of Mandap) */}
      <g transform="translate(560, 710)">
        <ellipse cx="0" cy="170" rx="55" ry="13" fill="#140c14" opacity={0.3} />
        <path d="M -38 30 Q -44 105 -46 168 L 46 168 Q 44 105 38 30 Z" fill="#f2ece1" />
        <circle cx="0" cy="-18" r="28" fill="#c98b63" />
        <path d="M -30 -32 Q 0 -64 30 -32 Z" fill="#1f1918" />
        {/* Traditional Dhak Drum */}
        <ellipse cx="24" cy="72" rx="46" ry="26" fill="#8c3b20" />
        <ellipse cx="-18" cy="72" rx="10" ry="25" fill="#f5eadc" />
        <ellipse cx="66" cy="72" rx="10" ry="25" fill="#f5eadc" />
        {/* Drumsticks (freeze mid-air!) */}
        <line
          x1="12"
          y1="26"
          x2="44"
          y2={54 + stickSwing * 0.4}
          stroke="#e8c89b"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="22"
          x2="62"
          y2={52 - stickSwing * 0.4}
          stroke="#e8c89b"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>

      {/* Clarinet / Shehnai Player (Right of Mandap) */}
      <g transform="translate(1280, 715)">
        <ellipse cx="0" cy="165" rx="52" ry="12" fill="#140c14" opacity={0.3} />
        <path d="M -36 30 Q -42 105 -44 162 L 44 162 Q 42 105 36 30 Z" fill="#ebe3d5" />
        <circle cx="0" cy="-18" r="27" fill="#cfa07c" />
        <path d="M -28 -32 Q 0 -62 28 -32 Z" fill="#292220" />
        {/* Shehnai / Clarinet */}
        <path d="M -12 -6 L -62 22 L -68 32 L -54 30 L -8 -2 Z" fill="#2b211e" />
        <path d="M -62 22 L -74 34 L -56 36 Z" fill="#d9a441" />
      </g>

      {/* 7 Concentric Uludhwani Sound Waves radiating from inner house */}
      {rawFrame >= uludhwaniStartFrame &&
        Array.from({ length: 7 }).map((_, i) => {
          const waveStart = uludhwaniStartFrame + i * 18;
          const age = rawFrame - waveStart;
          if (age < 0 || age > 90) return null;
          const r = 40 + age * 12;
          const op = interpolate(age, [0, 15, 90], [0, 0.72, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <circle
              key={i}
              cx={1520}
              cy={490}
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? "#ffd166" : "#ff9ebb"}
              strokeWidth="4"
              opacity={op}
            />
          );
        })}

      {/* Subtle Freeze-Hold Indicator Badge when drums stop */}
      {isFrozen && (
        <g opacity={interpolate(rawFrame - freezeAtFrame, [0, 18], [0, 0.9], { extrapolateRight: "clamp" })}>
          <rect x="760" y="130" width="400" height="46" rx="23" fill="rgba(20, 10, 24, 0.65)" />
          <text x="960" y="160" textAnchor="middle" fill="#ffe699" fontSize="22" fontWeight="700">
            হঠাৎ ঢাক ও বাঁশি থেমে গেল...
          </text>
        </g>
      )}
    </svg>
  );
};

/** Scene 05: Horoscope Constellation Glow for Sundar Thakur */
export const HoroscopeConstellationVFX: React.FC<{ active: boolean }> = ({ active }) => {
  const frame = useCurrentFrame();
  if (!active) return null;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <g transform="translate(1030, 510)" opacity={0.78}>
        <circle cx="0" cy="0" r={95 + Math.sin(frame * 0.08) * 10} fill="#ffe484" opacity={0.14} />
        {/* Sacred geometric planetary lines */}
        <polygon
          points="0,-55 48,28 -48,28"
          fill="none"
          stroke="#fff0a8"
          strokeWidth="2"
          opacity={0.7}
          transform={`rotate(${frame * 0.5})`}
        />
        <polygon
          points="0,55 48,-28 -48,-28"
          fill="none"
          stroke="#ffd166"
          strokeWidth="2"
          opacity={0.7}
          transform={`rotate(${-frame * 0.4})`}
        />
        {[
          [0, -55],
          [48, 28],
          [-48, 28],
          [0, 55],
        ].map(([sx, sy], i) => (
          <circle key={i} cx={sx} cy={sy} r="4.5" fill="#ffffff" />
        ))}
      </g>
    </svg>
  );
};

/** Scene 06: Brass Naivedya Offering Thali */
export const NaivedyaOfferingThali: React.FC<{ opacity: number }> = ({ opacity }) => {
  if (opacity <= 0.01) return null;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" opacity={opacity}>
      <g transform="translate(1360, 845)">
        <ellipse cx="0" cy="14" rx="82" ry="20" fill="#140c14" opacity={0.28} />
        <ellipse cx="0" cy="0" rx="76" ry="22" fill="#e0a943" />
        <ellipse cx="0" cy="-3" rx="64" ry="16" fill="#f5c969" />
        {/* Hibiscus & Shiuli Flowers */}
        <circle cx="-26" cy="-8" r="11" fill="#e63946" />
        <circle cx="0" cy="-12" r="12" fill="#fff8eb" />
        <circle cx="26" cy="-7" r="10" fill="#e63946" />
        {/* Sweets */}
        <circle cx="-12" cy="2" r="8" fill="#fff0c2" />
        <circle cx="14" cy="2" r="8" fill="#f2b880" />
      </g>
    </svg>
  );
};

/** Scene 07: Dawn Heart-Sparkle & Flower Offering */
export const DawnGreetingVFX: React.FC<{ showHeart: boolean }> = ({ showHeart }) => {
  const frame = useCurrentFrame();
  if (!showHeart) return null;
  const floatY = Math.sin(frame * 0.1) * 8;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <g transform={`translate(1095, ${715 + floatY})`}>
        <circle cx="0" cy="0" r="28" fill="#ffe699" opacity={0.28} />
        <path
          d="M 0 12 C -14 0 -22 -12 -12 -20 C -5 -26 0 -18 0 -14 C 0 -18 5 -26 12 -20 C 22 -12 14 0 0 12 Z"
          fill="#ff758f"
          opacity={0.9}
        />
      </g>
    </svg>
  );
};

/** Scene 08: Respectful Closing Moral & Next Episode Preview Card */
export const ClosingMoralAndNextPreview: React.FC = () => {
  const frame = useCurrentFrame();

  const nameOpacity = interpolate(frame, [60, 110, 440, 490], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const moralOpacity = interpolate(frame, [470, 520, 880, 930], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nextOpacity = interpolate(frame, [910, 960, 1340, 1380], [0, 1, 1, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
      }}
    >
      {/* Beat 1: Sacred Name */}
      <div
        style={{
          position: "absolute",
          top: 170,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: nameOpacity,
          transform: `translateY(${(1 - nameOpacity) * 16}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "16px 46px",
            borderRadius: 20,
            background: "rgba(255, 248, 225, 0.16)",
            border: "2px solid rgba(255, 224, 130, 0.55)",
            color: "#fff8dc",
            fontSize: 48,
            fontWeight: 800,
            textShadow: "0 4px 18px rgba(0,0,0,0.45)",
          }}
        >
          শ্রীশ্রীঠাকুর বালক ব্রহ্মচারী
        </div>
      </div>

      {/* Beat 2: Poetic Moral Card */}
      <div
        style={{
          position: "absolute",
          top: 155,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: moralOpacity,
          transform: `translateY(${(1 - moralOpacity) * 16}px)`,
        }}
      >
        <div
          style={{
            padding: "22px 48px",
            borderRadius: 22,
            background: "rgba(18, 12, 32, 0.62)",
            border: "1.5px solid rgba(255, 214, 120, 0.45)",
            color: "#fff6dc",
            fontSize: 34,
            fontWeight: 700,
            textAlign: "center",
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          সরল ভালোবাসা • সব জীবের প্রতি মমতা • শান্ত সুন্দর মন
        </div>
      </div>

      {/* Beat 3: Next Episode Preview Card */}
      <div
        style={{
          position: "absolute",
          top: 135,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: nextOpacity,
          transform: `scale(${0.92 + 0.08 * nextOpacity})`,
        }}
      >
        <div
          style={{
            padding: "24px 52px",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(20, 28, 58, 0.84), rgba(54, 28, 66, 0.84))",
            border: "2px solid rgba(255, 209, 102, 0.7)",
            color: "#fff8e6",
            textAlign: "center",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ fontSize: 24, color: "#ffd166", fontWeight: 700 }}>আসছে পরের পর্ব ২</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginTop: 8 }}>
            রহস্যময় শৈশব ও গো-সাপ!
          </div>
          <div style={{ fontSize: 22, color: "#e8e2f5", marginTop: 6 }}>
            উজানচর কৃষ্ণনগরে ছোট্ট শিশু ঠাকুরের অলৌকিক খেলা
          </div>
        </div>
      </div>
    </div>
  );
};
