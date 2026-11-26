import React, { useId } from "react";

/**
 * BAL-26f (2026-11-25): Balak's own divine look in Ghibli Episode 4, distinct from every other character (BAL-01..14).
 *
 *  - Ep04BalakDivine: a soft warm-white halo BEHIND the head that fades out to nothing (no ring, no hard or dashed
 *    edge, no rays), and a few slow motes drifting up around him. It does not pulse with breathing; `glow` raises it
 *    gently for the key beat (Scene 04). Draw it before (behind) the figure. Props as GhibliBalakAura (cx, cy, r,
 *    glow, f), plus optional `motes` (count, default 5; 0 = none).
 *  - Ep04BalakGroundGlow: a faint warm pool of light on the ground under him (props as GhibliBalakGroundGlow).
 *  - Ep04BalakInkDefs: the SVG filter "ep04-balak-ink" for the group that holds Balak, in place of
 *    "ghibli-char-ink". ghibli-char-ink's outline (feMorphology dilate 0.72), sun rim (offset 1.8 / 1.35) and bounce
 *    light are in the figure's user units, which the GhibliLayer camera scales by cam.zoom, so in close-ups they
 *    grow into the thick brown-and-yellow band round his whole body. This filter gives the same watercolour mottle,
 *    a fine, smooth warm-brown contour (#8a6044 at 0.55, about 1 screen px, no boil) whatever the zoom, and a faint warm golden rim only on the
 *    upward-facing edges (head, shoulders: the edges facing the halo), never a glow round the whole body.
 *    Pass `zoom` (cam.zoom of the layer he is in) and optionally `rim` (0..1, default 0.5; raise with the glow beat).
 */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const hash = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Ep04BalakDivine: React.FC<{
  cx: number;
  cy: number;
  r: number;
  glow?: number;
  f: number;
  /** Number of slow motes (default 5; 0 = none). */
  motes?: number;
}> = ({ cx, cy, r, glow = 0.72, f, motes = 5 }) => {
  const id = `e4bd-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (glow <= 0.01) return null;
  const g = clamp(glow, 0, 1.2);
  // the halo grows a little and warms on the key beat; no breathing pulse
  const R = r * (1.12 + 0.14 * smooth((g - 0.55) / 0.4));
  const core = 0.5 + 0.32 * smooth((g - 0.4) / 0.6);
  const moteEls: React.ReactElement[] = [];
  for (let i = 0; i < motes; i++) {
    // each mote rises slowly (about 22 s per cycle, staggered), drifting sideways a little, fading in and out
    const period = 520 + 140 * hash(i, 3);
    const ph = ((f + hash(i, 7) * period) % period) / period;
    const ang = (hash(i, 11) * 2 - 1) * 2.3;
    const rad = r * (0.75 + 0.6 * hash(i, 13));
    const x = cx + Math.sin(ang) * rad + 6 * Math.sin(f * 0.011 + i * 2.1);
    const y = cy + Math.cos(ang) * rad * 0.55 + r * 0.5 - ph * r * 1.25;
    const a = Math.sin(Math.PI * ph);
    const sz = (1.4 + 1.1 * hash(i, 17)) * (r / 70);
    moteEls.push(<circle key={i} cx={x} cy={y} r={sz} fill={`url(#${id}-mote)`} opacity={(0.75 * a * a * Math.min(1, g)).toFixed(3)} />);
  }
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffdf6" stopOpacity={core} />
          <stop offset="28%" stopColor="#fff7e2" stopOpacity={core * 0.72} />
          <stop offset="55%" stopColor="#ffeec8" stopOpacity={core * 0.32} />
          <stop offset="78%" stopColor="#ffe6b4" stopOpacity={core * 0.1} />
          <stop offset="100%" stopColor="#ffe6b4" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-mote`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbea" stopOpacity={1} />
          <stop offset="45%" stopColor="#fff1c8" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffe9b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the halo behind the head: soft warm white, fading out, slightly taller than wide */}
      <ellipse cx={cx} cy={cy - r * 0.04} rx={R} ry={R * 1.06} fill={`url(#${id}-halo)`} opacity={Math.min(1, 0.55 + 0.45 * g)} style={{ mixBlendMode: "screen" }} />
      {moteEls}
    </g>
  );
};

export const Ep04BalakGroundGlow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  level?: number;
}> = ({ x, y, rx = 148, ry = 26, level = 0.7 }) => {
  const id = `e4bg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (level <= 0.01) return null;
  return (
    <g pointerEvents="none" opacity={clamp(level, 0, 1)}>
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6dc" stopOpacity={0.4} />
          <stop offset="50%" stopColor="#ffe9b8" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-g)`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

/** Filter id of Ep04BalakInkDefs, for `<g filter={`url(#${EP04_BALAK_INK})`}>` round Balak. */
export const EP04_BALAK_INK = "ep04-balak-ink";

export const Ep04BalakInkDefs: React.FC<{
  /** cam.zoom of the layer Balak is drawn in (the filter divides its sizes by it, so lines stay fine on screen). */
  zoom?: number;
  /** Warm golden rim on the upward-facing edges, 0..1 (default 0.5). */
  rim?: number;
  /** Kept for compatibility (the line boil is gone: it broke fine lines into dots). */
  f?: number;
}> = ({ zoom = 1, rim = 0.5 }) => {
  const z = Math.max(0.3, zoom);
  const u = (px: number) => (px / z).toFixed(3);
  const rimA = clamp(rim, 0, 1);
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id={EP04_BALAK_INK} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          {/* gentle warm watercolour mottle inside his own alpha (no colour noise) */}
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.026" numOctaves="3" seed="23" result="n" />
          <feColorMatrix in="n" type="matrix" values="0.08 0 0 0 0.93  0.075 0 0 0 0.93  0.068 0 0 0 0.92  0 0 0 0 1" result="nt" />
          <feComposite in="nt" in2="SourceAlpha" operator="in" result="ntc" />
          <feBlend in="SourceGraphic" in2="ntc" mode="multiply" result="painted" />
          {/* a fine warm sepia contour (about 0.9 px on screen at any zoom) */}
          <feMorphology in="SourceAlpha" operator="dilate" radius={u(0.8)} result="dil" />
          <feGaussianBlur in="dil" stdDeviation={u(0.35)} result="dilS" />
          <feComposite in="dilS" in2="SourceAlpha" operator="out" result="ringS" />
          <feFlood floodColor="#8a6044" floodOpacity="0.55" result="ink" />
          <feComposite in="ink" in2="ringS" operator="in" result="outerInk" />
          {/* a faint warm golden rim only on edges facing up (toward the halo behind his head), inside his alpha */}
          <feOffset in="SourceAlpha" dx="0" dy={u(2)} result="down" />
          <feComposite in="SourceAlpha" in2="down" operator="out" result="topEdge" />
          <feGaussianBlur in="topEdge" stdDeviation={u(0.7)} result="topEdgeS" />
          <feComposite in="topEdgeS" in2="SourceAlpha" operator="in" result="topEdgeIn" />
          <feFlood floodColor="#ffdf9e" floodOpacity={(0.55 * rimA).toFixed(3)} result="gold" />
          <feComposite in="gold" in2="topEdgeIn" operator="in" result="rimLight" />
          <feMerge result="cel">
            <feMergeNode in="outerInk" />
            <feMergeNode in="painted" />
            <feMergeNode in="rimLight" />
          </feMerge>
          {/* no line boil: a displacement on fine lines breaks them into dots */}
        </filter>
      </defs>
    </svg>
  );
};
