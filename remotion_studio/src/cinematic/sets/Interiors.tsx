import React from "react";
import { clamp, flicker, hash, lerp, TAU } from "../core/anim";
import { Diya, Flame, Garland, Glow, Sparks } from "../fx/Fx";

/* ------------------------------------------------------------------ */
/* Baithakkhana (drawing room) — Kedarkaka's story                     */
/* ------------------------------------------------------------------ */

export const LAMP = { x: 400, y: 250 };

export const BaithakWall: React.FC<{ f: number; tiger: number; jaw: number; flash: number }> = ({ f, tiger, jaw, flash }) => {
  const fl = flicker(f, 2);
  return (
    <g>
      <defs>
        <radialGradient id="baithak-wall" cx={LAMP.x / 1920} cy={LAMP.y / 1080} r="0.9">
          <stop offset="0%" stopColor="#f2d6a2" />
          <stop offset="35%" stopColor="#c9a06a" />
          <stop offset="75%" stopColor="#6e4a30" />
          <stop offset="100%" stopColor="#2e1d14" />
        </radialGradient>
        <linearGradient id="baithak-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2e1e" />
          <stop offset="100%" stopColor="#1c110b" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-200} width={2520} height={1100} fill="url(#baithak-wall)" />
      <rect x={-300} y={-200} width={2520} height={1100} fill="#ffb060" opacity={(fl - 0.86) * 0.6} />
      {/* damp patches / lime-wash texture */}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={i} cx={hash(i) * 2000 - 40} cy={120 + hash(i * 3) * 600} rx={60 + hash(i * 5) * 120} ry={20 + hash(i * 7) * 40} fill="#5a3a24" opacity={0.06} />
      ))}
      {/* ceiling beams (kodi-borga) */}
      <rect x={-300} y={-200} width={2520} height={250} fill="#2a1a12" />
      {Array.from({ length: 28 }, (_, i) => (
        <rect key={i} x={-280 + i * 90} y={-200} width={26} height={250} fill="#3d2618" />
      ))}
      <rect x={-300} y={36} width={2520} height={26} fill="#4a2e1c" />
      {/* window with wooden bars: night + firework flashes */}
      <g transform="translate(1560, 190)">
        <rect x={0} y={0} width={240} height={300} fill="#0b0c22" />
        <rect x={0} y={0} width={240} height={300} fill="#ffb3e0" opacity={flash * 0.6} />
        {[0.3, 0.6].map((k) => (
          <circle key={k} cx={240 * k} cy={60 + k * 60} r={1.6} fill="#fff" opacity={0.8} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={18 + i * 40} y={0} width={10} height={300} fill="#4a2c1a" />
        ))}
        <rect x={-14} y={-14} width={268} height={328} fill="none" stroke="#5a3620" strokeWidth={18} />
      </g>
      {/* framed print + shelf with brass pots */}
      <g transform="translate(1080, 220)">
        <rect x={0} y={0} width={190} height={140} fill="#5a3620" />
        <rect x={12} y={12} width={166} height={116} fill="#d9c49a" />
        <path d="M 12 100 Q 60 60 100 90 T 178 70 L 178 128 L 12 128 Z" fill="#7a9a6a" />
        <circle cx={140} cy={44} r={14} fill="#e8a040" />
      </g>
      <g transform="translate(700, 360)">
        <rect x={0} y={0} width={260} height={12} fill="#4a2c1a" />
        {[30, 100, 175, 230].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={-18} rx={18 + (i % 2) * 6} ry={18} fill="#c9932e" />
            <ellipse cx={x - 6} cy={-24} rx={5} ry={8} fill="#ffe6a0" opacity={0.5} />
          </g>
        ))}
      </g>
      {/* ---- shadow-play on the wall (the story comes alive) ---- */}
      <g opacity={0.62} fill="#2a170e">
        {/* Kedarkaka's own projected silhouette */}
        <ellipse cx={1010} cy={430} rx={95} ry={110} opacity={1 - tiger * 0.8} />
        <path d="M 860 640 Q 1010 500 1160 640 L 1200 820 L 820 820 Z" opacity={1 - tiger * 0.8} />
        {tiger > 0.01 && (
          <g transform={`translate(1060, 470) scale(${lerp(0.4, 1.35, tiger)})`} opacity={tiger}>
            {/* tiger head shadow with opening jaw */}
            <path d="M -150 -40 Q -170 -150 -90 -170 L -70 -120 Q 0 -150 70 -120 L 90 -170 Q 170 -150 150 -40 Q 160 30 110 60 L -110 60 Q -160 30 -150 -40 Z" />
            <g transform={`rotate(${jaw * 22}, -90, 50)`}>
              <path d="M -110 50 Q 0 80 120 50 L 140 70 Q 0 120 -110 70 Z" />
              {[-60, -20, 20, 60].map((x) => (
                <path key={x} d={`M ${x} 56 l 8 -18 l 8 18 Z`} fill="#c9a06a" opacity={0.6} />
              ))}
            </g>
            <ellipse cx={-55} cy={-50} rx={18} ry={10} fill="#c9a06a" opacity={0.85} />
            <ellipse cx={55} cy={-50} rx={18} ry={10} fill="#c9a06a" opacity={0.85} />
          </g>
        )}
      </g>
      {/* floor */}
      <rect x={-300} y={820} width={2520} height={400} fill="url(#baithak-floor)" />
    </g>
  );
};

/** Wooden takhat with white sheet + striped bolsters (drawn in front of seated figures' legs). */
export const Takhat: React.FC = () => (
  <g>
    <rect x={260} y={846} width={1560} height={70} fill="#5a3520" />
    <rect x={240} y={822} width={1600} height={34} rx={6} fill="#f4ecdc" />
    <path d="M 240 856 Q 1040 870 1840 856 L 1840 870 Q 1040 884 240 870 Z" fill="#ddd2bd" />
    {[300, 1780].map((x) => (
      <rect key={x} x={x - 18} y={900} width={36} height={120} fill="#3d2414" />
    ))}
  </g>
);

export const Bolster: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-90} y={-36} width={180} height={72} rx={36} fill="#b8452f" />
    {[-60, -30, 0, 30, 60].map((sx) => (
      <rect key={sx} x={sx - 5} y={-36} width={10} height={72} fill="#e9c46a" opacity={0.85} />
    ))}
    <ellipse cx={-90} cy={0} rx={14} ry={36} fill="#8f3322" />
  </g>
);

export const Hookah: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-30} rx={38} ry={34} fill="#3b3b44" />
    <ellipse cx={-10} cy={-42} rx={10} ry={14} fill="#8a8aa0" opacity={0.5} />
    <rect x={-6} y={-150} width={12} height={92} fill="#b08840" />
    <path d="M -24 -150 L 24 -150 L 14 -180 L -14 -180 Z" fill="#7a3a22" />
    <Glow x={0} y={-182} r={16} kind="soft" o={0.5 + 0.3 * Math.sin(f * 0.2)} />
    <path d="M 8 -100 Q 90 -60 140 -140" stroke="#6b3f22" strokeWidth={6} fill="none" />
    {/* curling smoke */}
    {[0, 1, 2].map((k) => {
      const a = ((f + k * 22) % 66) / 66;
      return <circle key={k} cx={Math.sin(a * 6 + k) * 10} cy={-190 - a * 120} r={8 + a * 22} fill="url(#fx-smoke)" opacity={1 - a} />;
    })}
  </g>
);

export const HurricaneLantern: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => {
  const sw = Math.sin(f * 0.06) * 3;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${sw}) scale(${s})`}>
      <line x1={0} y1={-400} x2={0} y2={-40} stroke="#2a1a10" strokeWidth={3} />
      <Glow x={0} y={30} r={220} kind="warm" o={0.55 * flicker(f, 5)} />
      <rect x={-34} y={-44} width={68} height={14} rx={4} fill="#3a2a1a" />
      <ellipse cx={0} cy={30} rx={34} ry={46} fill="#ffe2a0" opacity={0.55} />
      <Flame x={0} y={44} s={1.4} f={f} seed={8} glow={false} />
      <path d="M -36 -30 L -36 80 M 36 -30 L 36 80" stroke="#2a1a10" strokeWidth={5} />
      <rect x={-44} y={76} width={88} height={30} rx={8} fill="#3a2a1a" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Dhaki nook beside the mandap                                        */
/* ------------------------------------------------------------------ */

export const MandapNook: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <radialGradient id="nook-bg" cx="0.35" cy="0.45" r="0.8">
        <stop offset="0%" stopColor="#7a2a1c" />
        <stop offset="50%" stopColor="#3e1612" />
        <stop offset="100%" stopColor="#14080a" />
      </radialGradient>
    </defs>
    <rect x={-300} y={-200} width={2520} height={1500} fill="url(#nook-bg)" />
    {/* red cloth drapes (lal salu) + garlands, within the close-up crop */}
    <g transform="translate(0, 260)">
      <rect x={-300} y={-400} width={2520} height={300} fill="#5a1414" />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M ${-200 + i * 260} -100 Q ${-70 + i * 260} ${40 + Math.sin(f * 0.04 + i) * 6} ${60 + i * 260} -100 Z`}
          fill={i % 2 ? "#b3201e" : "#d8a23a"}
          opacity={0.9}
        />
      ))}
      <Garland x1={-200} y1={-40} x2={700} y2={-40} sag={70} s={1.5} f={f} />
      <Garland x1={700} y1={-40} x2={1700} y2={-40} sag={70} s={1.5} f={f} seed={4} />
      {/* hanging brass bell */}
      <g transform={`translate(1000, -100) rotate(${Math.sin(f * 0.05) * 4})`}>
        <line x1={0} y1={0} x2={0} y2={150} stroke="#6a4a1a" strokeWidth={3} />
        <path d="M -34 200 Q -30 150 0 146 Q 30 150 34 200 Z" fill="#d9a63a" />
        <ellipse cx={-10} cy={176} rx={6} ry={14} fill="#ffe6a0" opacity={0.6} />
        <circle cx={0} cy={206} r={7} fill="#a87420" />
      </g>
    </g>
    {/* carved pillar */}
    <g transform="translate(1540, 0)">
      <rect x={-40} y={-100} width={80} height={900} fill="#3a1e14" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-48} y={40 + i * 100} width={96} height={14} rx={6} fill="#5a3220" />
      ))}
    </g>
    {/* panchapradip lamp stand */}
    <g transform="translate(1320, 640)">
      <rect x={-6} y={-200} width={12} height={200} fill="#c9932e" />
      <ellipse cx={0} cy={0} rx={50} ry={12} fill="#c9932e" />
      {[-48, -24, 0, 24, 48].map((dx, i) => (
        <Flame key={dx} x={dx} y={-200 - Math.abs(dx) * 0.3} s={1.2} f={f} seed={i + 20} />
      ))}
    </g>
    {/* platform + straw mat */}
    <rect x={-300} y={760} width={2520} height={500} fill="#2a140e" />
    <path d="M -100 800 L 2000 800 L 2100 1180 L -200 1180 Z" fill="#9c7638" />
    <path d="M -100 800 L 2000 800 L 2010 812 L -110 812 Z" fill="#6a4a1e" />
    {Array.from({ length: 30 }, (_, i) => (
      <line key={i} x1={-100 + i * 72} y1={800} x2={-200 + i * 78} y2={1180} stroke="#7e5c28" strokeWidth={2} opacity={0.6} />
    ))}
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-150} y1={830 + i * 45} x2={2060} y2={830 + i * 45} stroke="#e0bf72" strokeWidth={2} opacity={0.4} />
    ))}
  </g>
);

/** Barrel dhak with kash-flower plume. */
export const Dhak: React.FC<{ x: number; y: number; f: number; s?: number; tilt?: number }> = ({ x, y, f, s = 1, tilt = -18 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${tilt}) scale(${s})`}>
    <ellipse cx={-130} cy={0} rx={40} ry={95} fill="#efe4cc" />
    <path d="M -130 -95 Q 0 -120 130 -95 L 130 95 Q 0 120 -130 95 Z" fill="#8a2a1a" />
    <path d="M -130 -95 Q 0 -120 130 -95 L 130 -60 Q 0 -84 -130 -60 Z" fill="#a8402a" />
    {/* rope lacing */}
    {Array.from({ length: 10 }, (_, i) => (
      <path key={i} d={`M ${-120 + i * 26} -96 L ${-107 + i * 26} 96`} stroke="#e9d9a8" strokeWidth={3} opacity={0.85} />
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <path key={i} d={`M ${-107 + i * 26} -96 L ${-120 + i * 26} 96`} stroke="#e9d9a8" strokeWidth={3} opacity={0.85} />
    ))}
    <ellipse cx={130} cy={0} rx={40} ry={95} fill="#f4ead6" />
    <ellipse cx={130} cy={0} rx={28} ry={70} fill="#e6d8bc" />
    {/* kash plume */}
    <g transform="translate(0, -110)">
      {Array.from({ length: 13 }, (_, i) => {
        const a = -60 + i * 10 + Math.sin(f * 0.07 + i) * 3;
        return (
          <path
            key={i}
            d="M 0 0 Q 20 -90 6 -170"
            stroke="#fbf8f0"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
            transform={`rotate(${a})`}
          />
        );
      })}
    </g>
  </g>
);

/** Upturned brass kansor used as a plate for gur-muri. `eaten` 0..1, `spill` 0..1. */
export const KansorMuri: React.FC<{ x: number; y: number; s?: number; eaten: number; spill: number }> = ({ x, y, s = 1, eaten, spill }) => {
  const heap = 1 - eaten * 0.6 - spill * 0.3;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <defs>
        <radialGradient id="kansor-brass" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="40%" stopColor="#d9a63a" />
          <stop offset="100%" stopColor="#8a5a14" />
        </radialGradient>
      </defs>
      {/* the convex back of the gong (upside down) */}
      <ellipse cx={0} cy={10} rx={120} ry={34} fill="#6a420c" />
      <ellipse cx={0} cy={0} rx={118} ry={30} fill="url(#kansor-brass)" />
      <ellipse cx={0} cy={0} rx={96} ry={22} fill="none" stroke="#a87420" strokeWidth={3} />
      <circle cx={-90} cy={-8} r={6} fill="#6a420c" />
      {/* muri heap */}
      <path d={`M -80 0 Q -40 ${-60 * heap} 0 ${-66 * heap} Q 40 ${-60 * heap} 80 0 Z`} fill="#f6ead0" />
      {Array.from({ length: 70 }, (_, i) => {
        const px = (hash(i) - 0.5) * 160;
        const lim = 66 * heap * (1 - Math.pow(Math.abs(px) / 82, 2));
        const py = -hash(i * 3) * Math.max(0, lim);
        return <ellipse key={i} cx={px} cy={py} rx={4.2} ry={2.6} fill={hash(i * 5) > 0.5 ? "#fff8e6" : "#ecd8ae"} transform={`rotate(${hash(i * 7) * 180} ${px} ${py})`} />;
      })}
      {/* gur (jaggery) lumps */}
      {[
        [-30, -20],
        [20, -30],
        [44, -10],
      ].map(([gx, gy], i) =>
        i / 3 < 1 - eaten ? <path key={i} d={`M ${gx - 12} ${gy} l 8 -12 l 14 2 l 4 12 l -12 8 Z`} fill="#7a3a12" stroke="#5a2a0a" strokeWidth={1.4} /> : null,
      )}
      {/* spilled muri everywhere (একাকার) */}
      {spill > 0 &&
        Array.from({ length: 90 }, (_, i) => {
          const a = hash(i * 1.9) * TAU;
          const r = 60 + hash(i * 2.7) * 380 * spill;
          return (
            <ellipse
              key={`s${i}`}
              cx={Math.cos(a) * r}
              cy={20 + Math.abs(Math.sin(a)) * r * 0.22}
              rx={4}
              ry={2.5}
              fill="#f6ead0"
              opacity={clamp(spill * 2)}
            />
          );
        })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Inner courtyard (bhetor-bari) — after the reference painting        */
/* ------------------------------------------------------------------ */

/** Old lime-plaster wall: damp stains, flaked patches showing brick, hairline cracks. */
const WallWeathering: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="cy-stain">
        <stop offset="0%" stopColor="#2a140c" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#2a140c" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="cy-damp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e0e08" stopOpacity={0} />
        <stop offset="100%" stopColor="#1e0e08" stopOpacity={0.4} />
      </linearGradient>
    </defs>
    {Array.from({ length: 16 }, (_, i) => (
      <ellipse key={`st${i}`} cx={-260 + hash(i * 3.1) * 2440} cy={300 + hash(i * 5.7) * 380} rx={60 + hash(i * 7.3) * 140} ry={40 + hash(i * 2.9) * 90} fill="url(#cy-stain)" />
    ))}
    {/* rising damp along the plinth */}
    <rect x={-300} y={640} width={2520} height={100} fill="url(#cy-damp)" />
    {Array.from({ length: 7 }, (_, i) => {
      const bx = -120 + i * 330 + 140 + hash(i * 11) * 40;
      const by = 300 + hash(i * 13) * 30;
      if (hash(i * 17) < 0.35) return null;
      const w = 70 + hash(i * 19) * 50;
      const h = 34 + hash(i * 23) * 26;
      return (
        <g key={`br${i}`} opacity={0.5}>
          <clipPath id={`brc${i}`}><path d={`M ${bx} ${by + 6} L ${bx + w * 0.25} ${by - 2} L ${bx + w * 0.55} ${by + 4} L ${bx + w * 0.8} ${by} L ${bx + w} ${by + h * 0.4} L ${bx + w * 0.85} ${by + h} L ${bx + w * 0.5} ${by + h * 0.8} L ${bx + w * 0.2} ${by + h} L ${bx - 4} ${by + h * 0.55} Z`} /></clipPath>
          <g clipPath={`url(#brc${i})`}>
          <rect x={bx - 6} y={by - 4} width={w + 12} height={h + 8} fill="#6a3420" />
          {Array.from({ length: 4 }, (_, r) => (
            <line key={r} x1={bx} y1={by + 4 + r * 9} x2={bx + w} y2={by + 4 + r * 9} stroke="#4a2414" strokeWidth={1.4} opacity={0.8} />
          ))}
          {Array.from({ length: 5 }, (_, k) => (
            <line key={k} x1={bx + 8 + k * 16 + ((k % 2) * 8)} y1={by} x2={bx + 8 + k * 16 + ((k % 2) * 8)} y2={by + h} stroke="#4a2414" strokeWidth={1.2} strokeDasharray="8 10" opacity={0.7} />
          ))}
          </g>
        </g>
      );
    })}
    {Array.from({ length: 9 }, (_, i) => {
      const cx = -200 + hash(i * 29) * 2300;
      const cy = 300 + hash(i * 31) * 300;
      return (
        <path key={`ck${i}`} d={`M ${cx} ${cy} l ${8 + hash(i) * 10} ${14 + hash(i * 2) * 10} l -6 ${12 + hash(i * 3) * 8} l ${10 + hash(i * 4) * 8} ${16 + hash(i * 5) * 12}`} stroke="#2a140c" strokeWidth={1.3} fill="none" opacity={0.5} />
      );
    })}
  </g>
);

export const CourtyardBack: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="cy-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a3e2a" />
        <stop offset="100%" stopColor="#3a2018" />
      </linearGradient>
      <radialGradient id="cy-room" cx="0.5" cy="0.7" r="0.7">
        <stop offset="0%" stopColor="#ffd08a" />
        <stop offset="100%" stopColor="#b8642a" />
      </radialGradient>
    </defs>
    {/* back building */}
    <rect x={-300} y={180} width={2520} height={560} fill="url(#cy-wall)" />
    <WallWeathering />
    {/* cornice with dentils under the balcony */}
    <rect x={-300} y={264} width={2520} height={12} fill="#6a3e28" />
    {Array.from({ length: 126 }, (_, i) => (
      <rect key={`dn${i}`} x={-296 + i * 20} y={276} width={11} height={9} fill="#5a321e" />
    ))}
    <rect x={-300} y={285} width={2520} height={3} fill="#8a5a3a" opacity={0.7} />
    {/* balcony balustrade with diyas */}
    <rect x={-300} y={176} width={2520} height={24} fill="#7a4a30" />
    {Array.from({ length: 60 }, (_, i) => (
      <rect key={i} x={-290 + i * 42} y={200} width={14} height={50} rx={6} fill="#8a5a3a" />
    ))}
    <rect x={-300} y={250} width={2520} height={14} fill="#7a4a30" />
    {Array.from({ length: 34 }, (_, i) => (
      <Flame key={i} x={-260 + i * 74} y={176} s={0.9} f={f} seed={i * 1.3} glow={i % 2 === 0} />
    ))}
    <Garland x1={-300} y1={268} x2={500} y2={268} sag={46} s={1.2} f={f} />
    <Garland x1={500} y1={268} x2={1400} y2={268} sag={46} s={1.2} f={f} seed={1} />
    <Garland x1={1400} y1={268} x2={2220} y2={268} sag={46} s={1.2} f={f} seed={2} />
    {/* arches with lit rooms */}
    {Array.from({ length: 7 }, (_, i) => {
      const ax = -160 + i * 330;
      return (
        <g key={i}>
          <path d={`M ${ax} 740 L ${ax} 470 Q ${ax + 110} 360 ${ax + 220} 470 L ${ax + 220} 740 Z`} fill="url(#cy-room)" opacity={0.85} />
          {/* inner reveal shadow (wall thickness) */}
          <path d={`M ${ax} 740 L ${ax} 470 Q ${ax + 110} 360 ${ax + 220} 470 L ${ax + 206} 476 Q ${ax + 110} 384 ${ax + 14} 476 L ${ax + 14} 740 Z`} fill="#3a1e12" opacity={0.45} />
          {/* moulded archivolt */}
          <path d={`M ${ax - 6} 472 Q ${ax + 110} 344 ${ax + 226} 472`} stroke="#8a5a3a" strokeWidth={9} fill="none" />
          <path d={`M ${ax - 14} 474 Q ${ax + 110} 330 ${ax + 234} 474`} stroke="#4a2818" strokeWidth={2} fill="none" opacity={0.7} />
          {/* keystone */}
          <path d={`M ${ax + 100} 404 L ${ax + 120} 404 L ${ax + 124} 428 L ${ax + 96} 428 Z`} fill="#9a6a44" stroke="#5a321e" strokeWidth={1.2} />
          {i % 2 === 0 && (
            <g transform={`translate(${ax + 110}, 600)`} opacity={0.5}>
              <rect x={-30} y={0} width={60} height={140} fill="#5a2c14" />
              <rect x={-26} y={4} width={24} height={132} fill="#6a3418" />
            </g>
          )}
          <rect x={ax - 46} y={420} width={46} height={320} fill="#5a3422" />
          {/* pillar: lit edge, fluting, moulded base and capital with brackets */}
          <rect x={ax - 46} y={420} width={6} height={320} fill="#7a4a30" opacity={0.8} />
          {[-34, -23, -12].map((dx) => (
            <line key={dx} x1={ax + dx} y1={440} x2={ax + dx} y2={700} stroke="#4a2a1a" strokeWidth={2} opacity={0.55} />
          ))}
          <rect x={ax - 56} y={700} width={66} height={14} fill="#7a4a30" />
          <rect x={ax - 60} y={714} width={74} height={26} fill="#6a3e28" />
          <rect x={ax - 54} y={410} width={62} height={20} fill="#7a4a30" />
          <rect x={ax - 58} y={402} width={70} height={9} fill="#8a5a3a" />
          <path d={`M ${ax - 54} 430 q -10 10 0 22 l 8 -2 q -6 -8 0 -16 Z`} fill="#6a3e28" />
          <path d={`M ${ax + 8} 430 q 10 10 0 22 l -8 -2 q 6 -8 0 -16 Z`} fill="#6a3e28" />
          <Flame x={ax - 23} y={512} s={1.1} f={f} seed={i + 40} />
          <rect x={ax - 32} y={512} width={18} height={6} fill="#c9932e" />
        </g>
      );
    })}
    {/* steps / plinth */}
    <rect x={-300} y={740} width={2520} height={24} fill="#7a5a44" />
    <rect x={-300} y={764} width={2520} height={20} fill="#5a3e2e" />
  </g>
);

export const CourtyardFloor: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="cy-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a4038" />
        <stop offset="100%" stopColor="#2a1c18" />
      </linearGradient>
      <radialGradient id="cy-floor-light" cx="0.5" cy="0.2" r="0.6">
        <stop offset="0%" stopColor="#ffb860" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#ffb860" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-400} y={784} width={2720} height={600} fill="url(#cy-floor)" />
    {/* flagstones in perspective */}
    {Array.from({ length: 8 }, (_, r) => {
      const y = 784 + Math.pow(r / 8, 1.6) * 600;
      return <line key={`h${r}`} x1={-400} y1={y} x2={2320} y2={y} stroke="#3a2824" strokeWidth={2} opacity={0.7} />;
    })}
    {Array.from({ length: 22 }, (_, i) => {
      const x = -400 + i * 130;
      return <line key={`v${i}`} x1={960 + (x - 960) * 0.55} y1={784} x2={960 + (x - 960) * 1.6} y2={1384} stroke="#3a2824" strokeWidth={2} opacity={0.6} />;
    })}
    {/* worn / replaced flagstones and a scuffed walking path */}
    {Array.from({ length: 26 }, (_, i) => {
      const r = Math.floor(hash(i * 3.7) * 7);
      const c = Math.floor(hash(i * 5.3) * 21);
      const y0 = 784 + Math.pow(r / 8, 1.6) * 600;
      const y1 = 784 + Math.pow((r + 1) / 8, 1.6) * 600;
      const xAt = (x: number, y: number) => 960 + (x - 960) * lerp(0.55, 1.6, (y - 784) / 600);
      const xa = -400 + c * 130;
      const xb = xa + 130;
      return (
        <path
          key={`ws${i}`}
          d={`M ${xAt(xa, y0)} ${y0} L ${xAt(xb, y0)} ${y0} L ${xAt(xb, y1)} ${y1} L ${xAt(xa, y1)} ${y1} Z`}
          fill={hash(i * 7.1) > 0.5 ? "#6a4c40" : "#2e1e1a"}
          opacity={0.35 + hash(i * 9.3) * 0.25}
        />
      );
    })}
    <ellipse cx={960} cy={1000} rx={700} ry={150} fill="#7a5a48" opacity={0.12} />
    <rect x={-400} y={784} width={2720} height={26} fill="#120806" opacity={0.35} />
    <rect x={-400} y={784} width={2720} height={600} fill="url(#cy-floor-light)" />
    {/* alpona */}
    <g transform="translate(960, 930) scale(1.5, 0.42)" opacity={0.75}>
      <circle r={190} fill="none" stroke="#fff4dd" strokeWidth={6} strokeDasharray="16 12" />
      <circle r={140} fill="none" stroke="#e24a3a" strokeWidth={5} />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx={0} cy={-88} rx={22} ry={46} fill="none" stroke="#fff4dd" strokeWidth={5} transform={`rotate(${i * 30})`} />
      ))}
      <circle r={30} fill="#f4c542" opacity={0.8} />
    </g>
    {/* diyas on the floor edge */}
    {[-160, 80, 330, 1590, 1830, 2080].map((x, i) => (
      <Diya key={x} x={x} y={800 + (i % 2) * 14} s={1.25} f={f} seed={i + 70} />
    ))}
  </g>
);

export const TulsiMancha: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-90} y={-60} width={180} height={60} fill="#8a5a3a" />
    <rect x={-70} y={-200} width={140} height={140} fill="#9a6a48" />
    <path d="M -40 -60 L -40 -150 Q 0 -190 40 -150 L 40 -60 Z" fill="#3a2016" />
    <Diya x={0} y={-62} s={1.2} f={f} seed={99} />
    <rect x={-100} y={-216} width={200} height={18} fill="#7a4a30" />
    {Array.from({ length: 14 }, (_, i) => {
      const a = -80 + i * 12 + Math.sin(f * 0.05 + i) * 3;
      return (
        <g key={i} transform={`translate(0, -216) rotate(${a})`}>
          <line x1={0} y1={0} x2={0} y2={-110 - (i % 3) * 20} stroke="#3e6b2e" strokeWidth={3} />
          {[0.4, 0.7, 1].map((k) => (
            <ellipse key={k} cx={0} cy={(-110 - (i % 3) * 20) * k} rx={10} ry={5} fill="#4f8a3a" />
          ))}
        </g>
      );
    })}
    <Garland x1={-100} y1={-150} x2={100} y2={-150} sag={20} s={0.9} f={f} />
  </g>
);

/** Ground spinner (charkhi). */
export const Charkhi: React.FC<{ x: number; y: number; f: number; start: number; s?: number }> = ({ x, y, f, start, s = 1 }) => {
  const age = f - start;
  if (age < 0) return null;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <Glow x={0} y={0} r={110} kind="white" o={0.45} />
      <circle r={9} fill="#d8342c" transform={`rotate(${age * 40})`} />
      <Sparks f={f} start={start} seed={7} spin={0.9} cfg={{ rate: 6, life: 14, speed: [6, 10], angle: [0, 0.4], gravity: 0.25, drag: 0.85, colors: ["#ffffff", "#fff2a0", "#ffb03a", "#ff6a1a"], width: 2.2 }} />
    </g>
  );
};

/** Fountain cracker (tubri / anar). */
export const Tubri: React.FC<{ x: number; y: number; f: number; start: number; s?: number }> = ({ x, y, f, start, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -18 0 L 18 0 L 10 -40 L -10 -40 Z" fill="#c8402e" />
    <rect x={-18} y={-14} width={36} height={6} fill="#f4c542" />
    {f >= start && (
      <g transform="translate(0, -42)">
        <Glow x={0} y={-40} r={130} kind="white" o={0.5} />
        <Sparks
          f={f}
          start={start}
          seed={13}
          cfg={{ rate: 10, life: 30, speed: [8, 15], angle: [-Math.PI / 2 - 0.28, -Math.PI / 2 + 0.28], gravity: 0.55, drag: 0.95, colors: ["#ffffff", "#fff6c0", "#ffd25a", "#ff8a2a"], width: 2.2, streak: 2 }}
        />
      </g>
    )}
  </g>
);
