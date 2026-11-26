/**
 * Balak's divine look in the Ghibli Episode 5 rewrite (BAL-05..14, BAL-26f): the SAME components as Ghibli Episode 4,
 * re-exported under Episode 5 names so the rewrite never imports from episode04 directly (and one place to change).
 *
 *  - Ep05BalakDivine      soft warm-white halo BEHIND the head that fades out (no ring, rays or hard edge) + a few slow
 *                         motes; never pulses with breathing. Props: cx, cy, r, glow (0..1.2, default 0.72), f, motes.
 *                         Draw it BEFORE (behind) the figure.
 *  - Ep05BalakGroundGlow  faint warm pool of light on the ground under him. Props: x, y, rx, ry, level.
 *  - Ep05BalakInkDefs     the fine zoom-independent sepia contour filter for the group holding Balak
 *                         (`<g filter={`url(#${EP05_BALAK_INK})`}>`), in place of ghibli-char-ink. Props: zoom, rim.
 *  - ep05GlowBeat         the episode's two gentle brightenings (P3 the unmarked hand, P9 the cow): 0 at rest, rising
 *                         over `rise` frames to 1, held, then easing back over `fall` (story clock).
 *  - EP05_GLOW            resting / beat levels for the halo, ground glow and rim, so every scene uses the same values.
 */
export {
  Ep04BalakDivine as Ep05BalakDivine,
  Ep04BalakGroundGlow as Ep05BalakGroundGlow,
  Ep04BalakInkDefs as Ep05BalakInkDefs,
  EP04_BALAK_INK as EP05_BALAK_INK,
} from "../episode04/Ep04BalakDivine";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};

/** Resting and beat levels (lerp with ep05GlowBeat). */
export const EP05_GLOW = {
  halo: { rest: 0.55, beat: 0.95 },
  ground: { rest: 0.38, beat: 0.68 },
  rim: { rest: 0.5, beat: 0.8 },
  /** halo radius in head units: r = HALO_R * headScale (StandingChild joints.headScale) or ~ 64 * s for SeatedChild */
  haloR: 64,
} as const;

/**
 * One glow beat on the story clock: 0 before `at`, a gentle rise over `rise` frames (default 48, 2 s) to 1, held for
 * `hold` frames (default 72), eased back over `fall` (default 60). Never pulses. Sum two beats with Math.max.
 */
export const ep05GlowBeat = (f: number, at: number, rise = 48, hold = 72, fall = 60): number =>
  smooth((f - at) / rise) * (1 - smooth((f - at - rise - hold) / fall));

/** Lerp a level between rest and beat for k in 0..1. */
export const ep05GlowLevel = (which: "halo" | "ground" | "rim", k: number): number =>
  EP05_GLOW[which].rest + (EP05_GLOW[which].beat - EP05_GLOW[which].rest) * clamp01(k);
