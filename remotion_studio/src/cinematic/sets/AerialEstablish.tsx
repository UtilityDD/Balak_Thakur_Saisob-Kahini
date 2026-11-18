/**
 * AerialEstablish
 * ----------------
 * A reusable drone-style establishing shot. The scene is drawn into this
 * component and the component moves a "virtual camera" over it:
 *
 *   f < start          Hold wide overhead framing, zoomed in slightly on the
 *                      subject (scale = FROM_SCALE, no drift, no vignette).
 *   start <= f <= end  Smooth pull-back. Scale eases FROM_SCALE -> TO_SCALE
 *                      with a sine in-out curve (never a linear pan). A subtle
 *                      drift and a light vignette ease in over the same move.
 *   f > end            Hold the final framing (scale = TO_SCALE, full vignette).
 *
 * Only React types and the `interpolate` / `Easing` helpers from 'remotion'
 * are used. The component is self-contained: it has no project imports.
 *
 * Usage (illustrative):
 *   <AerialEstablish f={frame} start={0} end={120}>
 *     <SceneContents />
 *   </AerialEstablish>
 */
import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate } from 'remotion';

export type AerialEstablishProps = {
  /** Current frame number of the composition / sequence. */
  f: number;
  /** Frame at which the pull-back begins. */
  start: number;
  /** Frame at which the pull-back settles. Values <= start are treated as start + 1. */
  end: number;
  /** Scene content to frame. Drawn inside the moving camera. */
  children: ReactNode;
};

/** Zoom before the move (slightly tighter on the house). */
const FROM_SCALE = 1.35;
/** Zoom after the move (full wide establishing framing). */
const TO_SCALE = 1.0;

/** Drift offsets, in percent of the frame, applied at the start of the move. */
const DRIFT_X_FROM = -1.2;
const DRIFT_Y_FROM = 0.8;

/** Peak vignette darkness reached at the end of the move (0 = none, 1 = black). */
const VIGNETTE_MAX = 0.45;

/**
 * Sine in-out easing for every animated value. Using one shared curve keeps
 * scale, drift and vignette moving in step.
 */
const EASE = Easing.inOut(Easing.sin);

export const AerialEstablish = ({ f, start, end, children }: AerialEstablishProps) => {
  // Guard against a degenerate range so interpolate() always gets an increasing input.
  const safeEnd = end > start ? end : start + 1;

  // Shared move progress: 0 before the move, 1 after it. Clamped at both ends,
  // so the shot holds its framing outside the move window.
  const progress = interpolate(f, [start, safeEnd], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pull-back: scale eases from FROM_SCALE down to TO_SCALE.
  const scale = interpolate(progress, [0, 1], [FROM_SCALE, TO_SCALE]);

  // Subtle drift: the camera slides a few percent while it pulls back and
  // settles to zero offset at the end. Easing is shared with the scale.
  const driftX = interpolate(progress, [0, 1], [DRIFT_X_FROM, 0]);
  const driftY = interpolate(progress, [0, 1], [DRIFT_Y_FROM, 0]);

  // Vignette eases in during the move and holds at full strength afterwards.
  const vignetteOpacity = interpolate(progress, [0, 1], [0, VIGNETTE_MAX]);

  // Camera wrapper: scaled from the frame centre so the house stays framed.
  const cameraStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${driftX}%, ${driftY}%) scale(${scale})`,
    transformOrigin: '50% 50%',
    willChange: 'transform',
  };

  // Light vignette overlay. Pointer events are off so it never blocks input.
  const vignetteStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,1) 100%)',
    opacity: vignetteOpacity,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={cameraStyle}>{children}</div>
      <div style={vignetteStyle} />
    </div>
  );
};

export default AerialEstablish;
