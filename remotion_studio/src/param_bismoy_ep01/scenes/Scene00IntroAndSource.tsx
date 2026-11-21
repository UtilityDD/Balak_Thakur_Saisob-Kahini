import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { CARD_PALETTE } from "../../episode/SeriesCards";

const CinematicWord: React.FC<{
  f: number;
  at: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ f, at, dur = 18, children, style }) => {
  const t = clamp((f - at) / dur);
  const e = EASE.out(t);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: e,
        transform: `translateY(${(1 - e) * 28}px) scale(${0.92 + e * 0.08})`,
        filter: `blur(${(1 - e) * 7}px)`,
        marginRight: "0.26em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Reusable Series 2 Master Intro (290 frames = 12.08s @ 24fps):
 *   - Living, calm (shanto-snigdho) blinking portrait of Balak Thakur (`thakur_intro_blink_24.mp4`)
 *   - Multi-layered #FFF4D6 divine glow & counter-rotating sacred mandala rays masked cleanly BEHIND his head
 *   - Series Title ("পরম বিস্ময় বালক ঠাকুর") + Reference Book Credit ONLY (no Season/Episode text so 100% reusable!)
 */
export const Scene00Intro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const fl = flicker(f, 7);

  const fadeIn = interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [264, 290], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const camScale = track(f, [
    [0, 1.04],
    [110, 1.12],
    [290, 1.16],
  ]);
  const camY = track(f, [
    [0, 22],
    [110, 10],
    [290, -18],
  ]);

  const haloIn = EASE.out(clamp(f / 42));
  const titleBgIn = EASE.inOut(clamp((f - 70) / 36));
  const dividerDraw = EASE.out(clamp((f - 78) / 28));
  const bookCreditIn = EASE.out(clamp((f - 150) / 26));

  const headX = 960;
  const headY = 325;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0806", opacity: Math.min(fadeIn, fadeOut), overflow: "hidden" }}>
      {/* PLANE 1: Living, Calm (Shanto-Snigdho) Blinking Portrait of Balak Thakur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${camY}px) scale(${camScale})`,
          transformOrigin: "50% 42%",
        }}
      >
        <OffthreadVideo
          src={staticFile("video/s2_ep01/thakur_intro_blink_24.mp4")}
          muted
          style={{ width: 1920, height: 1080, objectFit: "cover" }}
        />

        {/* DIVINE GLOW & ROTATING MANDALA BEHIND HIS HEAD (#FFF4D6 — strictly occluded over his face/shoulders) */}
        <svg
          width={1920}
          height={1080}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}
        >
          <defs>
            <radialGradient id="s2-thakur-divine-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF4D6" stopOpacity={0.92} />
              <stop offset="32%" stopColor="#FFE29A" stopOpacity={0.62} />
              <stop offset="68%" stopColor="#F4B458" stopOpacity={0.20} />
              <stop offset="100%" stopColor="#F4B458" stopOpacity={0} />
            </radialGradient>

            <filter id="s2-halo-feather" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" />
            </filter>

            <mask id="s2-behind-head-mask">
              <rect x={0} y={0} width={1920} height={1080} fill="white" />
              <g filter="url(#s2-halo-feather)">
                <ellipse cx={960} cy={315} rx={165} ry={212} fill="black" />
                <path d="M 575 1080 Q 625 620 825 505 L 1095 505 Q 1295 620 1345 1080 Z" fill="black" />
              </g>
            </mask>
          </defs>

          <g mask="url(#s2-behind-head-mask)" opacity={haloIn * (0.92 + 0.08 * fl)}>
            <circle cx={headX} cy={headY} r={470} fill="url(#s2-thakur-divine-halo)" />

            <g transform={`translate(${headX}, ${headY}) rotate(${f * 0.14})`}>
              {Array.from({ length: 16 }, (_, i) => {
                const ang = (i * 360) / 16;
                const rayLen = i % 2 === 0 ? 520 : 400;
                return (
                  <polygon
                    key={`ray-${i}`}
                    points={`0,0 -24,${-rayLen} 24,${-rayLen}`}
                    fill="url(#s2-thakur-divine-halo)"
                    opacity={i % 2 === 0 ? 0.38 : 0.22}
                    transform={`rotate(${ang})`}
                  />
                );
              })}
            </g>

            <g transform={`translate(${headX}, ${headY}) rotate(${-f * 0.22})`} opacity={0.52}>
              <circle cx={0} cy={0} r={265} fill="none" stroke="#FFF4D6" strokeWidth={2.2} strokeDasharray="10 8" />
              <circle cx={0} cy={0} r={298} fill="none" stroke="#F7CE76" strokeWidth={1.4} />
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i * Math.PI * 2) / 24;
                const x1 = Math.cos(a) * 265;
                const y1 = Math.sin(a) * 265;
                const x2 = Math.cos(a) * 298;
                const y2 = Math.sin(a) * 298;
                return <line key={`petal-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFF4D6" strokeWidth={2} />;
              })}
            </g>
          </g>

          {Array.from({ length: 18 }, (_, i) => {
            const mx = 260 + hash(i * 3.1) * 1400 + Math.sin(f * 0.03 + i) * 32;
            const my = ((980 - f * (1.2 + (i % 4) * 0.35) + hash(i * 7.7) * 900) % 980) + 40;
            const op = 0.25 + 0.65 * Math.sin(f * 0.08 + i * 1.9) ** 2;
            return <circle key={`mote-${i}`} cx={mx} cy={my} r={2.2 + (i % 3)} fill="#FFF4D6" opacity={op * haloIn} />;
          })}
        </svg>
      </div>

      {/* PLANE 2: Cinematic Lower-Third Gradient Wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(12,7,4,0.18) 0%, rgba(12,7,4,0.05) 45%, rgba(14,8,5,0.74) 72%, rgba(10,5,3,0.94) 100%)",
          opacity: titleBgIn,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, transparent 52%, rgba(8, 5, 3, 0.56) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* PLANE 3: Reusable Series Name + Reference Book Credit ONLY (no Season/Episode) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 58,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          fontFamily: BN_FONT,
          pointerEvents: "none",
        }}
      >
        <svg width={560} height={24} style={{ marginBottom: 14, opacity: titleBgIn }}>
          <line
            x1={280 - 240 * dividerDraw}
            y1={12}
            x2={280 + 240 * dividerDraw}
            y2={12}
            stroke="#F3D27A"
            strokeWidth={2}
            opacity={0.85}
          />
          <circle cx={280} cy={12} r={5 * dividerDraw} fill="#FFF4D6" />
        </svg>

        <div
          style={{
            position: "relative",
            fontSize: 82,
            fontWeight: 700,
            color: CARD_PALETTE.cream,
            textShadow: `0 4px 26px rgba(10, 4, 2, 0.95), 0 0 ${32 + Math.sin(f * 0.08) * 10}px rgba(242, 168, 68, 0.55)`,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}
        >
          <CinematicWord f={f} at={86}>পরম</CinematicWord>
          <CinematicWord f={f} at={98}>বিস্ময়</CinematicWord>
          <CinematicWord f={f} at={112} style={{ color: CARD_PALETTE.goldSoft }}>বালক</CinematicWord>
          <CinematicWord f={f} at={124} style={{ color: CARD_PALETTE.goldSoft }}>ঠাকুর</CinematicWord>
        </div>

        {/* Reference Book Credit */}
        <div
          style={{
            marginTop: 14,
            opacity: bookCreditIn,
            transform: `translateY(${(1 - bookCreditIn) * 16}px)`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: CARD_PALETTE.goldSoft,
              textShadow: "0 2px 14px rgba(8, 4, 2, 0.95)",
            }}
          >
            অধ্যাপক পি. কে. রায় (রায়দা) রচিত অবিস্মরণীয় গ্রন্থ অবলম্বনে
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              color: "rgba(255, 240, 210, 0.72)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              textShadow: "0 2px 10px rgba(8, 4, 2, 0.9)",
            }}
          >
            Based on “Param Bismoy Balak Thakur” by Prof. P. K. Ray (Indian School of Mines, Dhanbad)
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Episode-Specific Title Card (144 frames = 6.0s @ 24fps) — follows the Reusable Master Intro. */
export const Scene00bSourceCard: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = 144;
  const opacity = Math.min(
    interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 22, frames], [1, 0], { extrapolateLeft: "clamp" })
  );

  const seasonIn = EASE.out(clamp((f - 10) / 22));
  const titleIn = EASE.out(clamp((f - 28) / 26));
  const lineDraw = EASE.out(clamp((f - 18) / 26));

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #2b1810 0%, #140b08 68%, #090506 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Soft glowing golden motes */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 16 }, (_, i) => {
          const mx = 220 + hash(i * 4.7) * 1480 + Math.sin(f * 0.03 + i) * 24;
          const my = 140 + hash(i * 6.3) * 800 + Math.cos(f * 0.025 + i) * 18;
          const op = 0.2 + 0.55 * Math.sin(f * 0.07 + i * 2.1) ** 2;
          return <circle key={`ep-mote-${i}`} cx={mx} cy={my} r={2.2 + (i % 2)} fill="#F3D27A" opacity={op} />;
        })}
      </svg>

      <div
        style={{
          textAlign: "center",
          fontFamily: BN_FONT,
          padding: "48px 80px",
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: CARD_PALETTE.goldSoft,
            letterSpacing: "0.08em",
            opacity: seasonIn,
            transform: `translateY(${(1 - seasonIn) * 18}px)`,
          }}
        >
          সিজন এক • পর্ব এক
        </div>

        <svg width={440} height={22} style={{ margin: "18px auto 16px" }}>
          <line
            x1={220 - 180 * lineDraw}
            y1={11}
            x2={220 + 180 * lineDraw}
            y2={11}
            stroke="#F3D27A"
            strokeWidth={2}
            opacity={0.85}
          />
          <circle cx={220} cy={11} r={4.5 * lineDraw} fill="#FFF4D6" />
        </svg>

        <div
          style={{
            fontSize: 70,
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 4px 28px rgba(0, 0, 0, 0.85), 0 0 34px rgba(242, 168, 68, 0.35)",
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 24}px)`,
          }}
        >
          ভবিষ্যদ্বাণী ও পৈতৃকভিটা
        </div>
      </div>
    </AbsoluteFill>
  );
};
