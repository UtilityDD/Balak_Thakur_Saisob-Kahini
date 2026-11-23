import React from "react";
import { noise1 } from "../../cinematic/core/anim";
import { ghibliClock } from "./ghibliActing";

/**
 * Phase 3 Studio Ghibli Secondary Wind-Flutter Overlays (`src/ghibli_pipeline/core/GhibliWindFlutter.tsx`).
 *
 * Non-destructive, hand-inked Miyazaki-style secondary motion ribbons for:
 *  - `GhibliWindClothTail`: fluttering chadar end, saree anchal, or dhoti/gamchha hem that
 *    responds to ambient breeze gusts and character velocity, stepped on twos (12 fps) to match
 *    character cadence.
 *  - `GhibliWindHairWisps`: delicate loose hair strands at the temple/crown fluttering gently in
 *    the breeze during close-ups and quiet pauses (Balak, Charu, village girls).
 */

export const GhibliWindClothTail: React.FC<{
  /** Anchor point in world/SVG coordinates (e.g., shoulder or hip edge). */
  x: number;
  y: number;
  /** Tail length in SVG px. */
  len?: number;
  /** Tail width in SVG px. */
  width?: number;
  /** Base wind direction (+1 = blowing right, -1 = blowing left). */
  dir?: 1 | -1;
  /** Cloth fill color (e.g. "#f4ede0" for Balak's white chadar, "#f7f0e4" for saree). */
  fill?: string;
  /** Optional border/trim color (e.g. "#b5362d" for red saree border). */
  trim?: string;
  /** Current life frame (automatically stepped on twos inside). */
  f: number;
  /** Breeze strength (0..1.5, default 0.7). */
  wind?: number;
  /** Random phase seed. */
  seed?: number;
  opacity?: number;
}> = ({
  x,
  y,
  len = 62,
  width = 22,
  dir = -1,
  fill = "#f3ecde",
  trim,
  f,
  wind = 0.7,
  seed = 19,
  opacity = 0.92,
}) => {
  const cf = ghibliClock(f, "twos");
  const gust = 0.65 + 0.35 * noise1(cf * 0.028, seed * 3.1);
  const wAmp = wind * gust;
  const w1 = Math.sin(cf * 0.14 + seed) * 11 * wAmp;
  const w2 = Math.sin(cf * 0.14 - 1.15 + seed) * 18 * wAmp;
  const lift = Math.abs(Math.sin(cf * 0.07 + seed * 0.5)) * 12 * wAmp;

  const p1x = x + dir * len * 0.42;
  const p1y = y + len * 0.38 - lift * 0.4 + w1 * 0.35;
  const p2x = x + dir * (len * 0.85 + w2 * 0.25);
  const p2y = y + len * 0.72 - lift + w2 * 0.55;

  const d = `M ${x.toFixed(1)} ${y.toFixed(1)}
    Q ${p1x.toFixed(1)} ${(p1y - width * 0.4).toFixed(1)} ${p2x.toFixed(1)} ${(p2y - width * 0.32).toFixed(1)}
    L ${(p2x - dir * width * 0.35).toFixed(1)} ${(p2y + width * 0.48).toFixed(1)}
    Q ${(p1x - dir * width * 0.45).toFixed(1)} ${(p1y + width * 0.52).toFixed(1)} ${(x - dir * width * 0.32).toFixed(1)} ${(y + width * 0.55).toFixed(1)} Z`;

  return (
    <g opacity={opacity}>
      <path d={d} fill={fill} stroke="#3c2416" strokeWidth={1.1} strokeLinejoin="round" strokeOpacity={0.7} />
      {trim && (
        <path
          d={`M ${(x - dir * width * 0.26).toFixed(1)} ${(y + width * 0.44).toFixed(1)} Q ${(p1x - dir * width * 0.38).toFixed(1)} ${(p1y + width * 0.42).toFixed(1)} ${(p2x - dir * width * 0.3).toFixed(1)} ${(p2y + width * 0.38).toFixed(1)}`}
          fill="none"
          stroke={trim}
          strokeWidth={Math.max(2.2, width * 0.16)}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

export const GhibliWindHairWisps: React.FC<{
  /** Head/temple anchor coordinates in SVG space. */
  x: number;
  y: number;
  /** Scale multiplier (matches character scale). */
  s?: number;
  /** Wind direction (+1 right, -1 left). */
  dir?: 1 | -1;
  color?: string;
  f: number;
  wind?: number;
  seed?: number;
}> = ({ x, y, s = 1, dir = -1, color = "#231914", f, wind = 0.65, seed = 31 }) => {
  const cf = ghibliClock(f, "twos");
  const gust = 0.6 + 0.4 * noise1(cf * 0.032, seed);
  const amp = wind * gust;
  const w1 = Math.sin(cf * 0.16 + seed) * 5.5 * amp;
  const w2 = Math.sin(cf * 0.16 - 0.9 + seed) * 8.5 * amp;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)})`}>
      <path
        d={`M 0 0 Q ${(10 + w1 * 0.3).toFixed(1)} ${(-4 + w1 * 0.4).toFixed(1)} ${(21 + w2 * 0.3).toFixed(1)} ${(-1 + w2 * 0.5).toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={`M -2 4 Q ${(8 + w1 * 0.25).toFixed(1)} ${(3 + w1 * 0.35).toFixed(1)} ${(16 + w2 * 0.25).toFixed(1)} ${(6 + w2 * 0.45).toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.75}
      />
    </g>
  );
};
