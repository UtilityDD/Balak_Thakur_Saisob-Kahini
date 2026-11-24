import React, { useId } from "react";
import { Hand, type HandShape } from "../../cinematic/rig/Hand";
import { STONE_BOWL_UNITS, stoneBowlArt as sharedStoneBowlArt } from "../../cinematic/sets/VedicHouseDay";
import { PLATE_COLORS, PLATE_COLORS_HEALTHY, PLATE_HAIR_TOP, ThakurHeadPlate, ThakurNeckPlate, plateChinY, plateMouthAt } from "../../cinematic/rig/ThakurHeadPlate";

/**
 * Episode 3 seated child rig. Balak Thakur at about five, sitting cross-legged on the ground, drawn
 * as borderless vector shapes with soft form shading (light from the upper left).
 *
 * Costume: soft cream cotton, like a young Brahmin boy's but childlike. A knee-length dhoti wraps
 * the hips (rolled waist, a small front tuck and pleats) and drapes over the thighs and the lap,
 * so the bare shins and feet come out from under the hem. An uttariya (chadar) crosses the chest
 * from the near hip, goes over the far shoulder and falls down the back. Every cloth piece is built
 * from the same joints as the body, so it follows the lean in every pose; free edges stir with the
 * breath and with the speed of the hands. Series rule: no sacred thread, no tilak, no jewellery,
 * no bangles, no anklets (he must not read as Krishna).
 *
 * Face: serene, half-lidded kind eyes with clear catchlights, a calm faint smile, round child
 * cheeks with a soft blush, curly dark hair. Blinks are slow and rare, head and gaze drift is small.
 * No divine light is drawn here; the glow is a separate component (BirulGlow) placed by the scene.
 *
 * Coordinates: (x, y) is the centre of the seat on the ground line. The figure is drawn in local
 * units around that point, about 230 px tall at s = 1, facing right unless `flip` is set.
 *
 * Limbs are single silhouettes built from round-ended, tapered capsules (no stamped circles). Bare skin
 * (arms, shins, feet, neck, torso) has no dark outline (MOT-19): its shade side is the same soft tone the
 * shared Hand uses (skinEdge), so the limbs and the hands read as one body.
 * `pose` picks the action; the hands rest on the knees otherwise. Arms are solved with two-bone IK
 * so the elbows bend naturally. Lean, head angle and hand targets are solved per frame.
 *
 * `prevPose` blends every joint from the previous pose over the first 16 frames of `poseStart`.
 * `f` (frame) drives the poses, expressions and gestures. Breathing, blinks, saccades, idle gaze,
 * glances and idle sway run on the life clock `lifeF ?? f` (seeded schedules and noise, so nothing
 * repeats on a loop).
 *
 * Breathing (MOT-20): about 3 s per breath with a noisy phase, a quicker inhale, a passive tailing
 * exhale and a short rest at the bottom, each breath a little deeper or shallower. Only the shoulders
 * (about 1 px on screen) and the chest wall rise, the uttariya rides with them and the head follows by
 * a fraction, 4 frames late; nothing bobs, tilts or scales. While he speaks (`talk`, or an open
 * `mouth`) the breath is shallow with small quick inhales. `sigh` adds a deep, calm breath on a beat.
 * In the sitCross and idle poses the child also shifts weight every 4 to 6 s, glances at the speaker
 * or the tulsi every 4 to 7 s (eyes leading), swings and fidgets his resting hands (see the idle section).
 *
 * Hands (MOT-19): the series' shared Hand (src/cinematic/rig/Hand.tsx), the adult model scaled to a
 * five-year-old and drawn a touch wider and shorter (plumper palm, softer fingers). Each pose names a
 * HandShape and a wrist turn per hand (near hand side +1, far hand side -1), so the thumb is always on
 * the anatomically correct side; the turn blends along the shortest arc between poses and the resting
 * fingers still curl and uncurl through Hand's `flex`. The forearm ends in a wrist sized to the
 * hand's projected wrist in that view, so arm and hand join without a seam.
 *
 * Body detail: a soft crease at each chubby wrist and ankle, separated toes, rounded
 * cloth-covered knees, a hint of the collarbone and the shoulder blade, lit and shaded sides on every
 * limb, and cloth folds that answer the lean, the breath and the raised arms.
 *
 * Movement: the chest and shoulders rise a little with each breath. Every gesture overlaps: the
 * upper arm leads, the forearm trails it by about 3 frames and the fingers by about 6. The eyes lead
 * the head (the head follows the pose about 5 frames late) and look at what he is working on. The
 * uttariya end and hem trail the body slightly.
 *
 * Expression: `expression` (serene, joyful, thoughtful, compassionate, playful) or, when unset, one
 * derived from the pose (lookUp thoughtful; bless, bowHands and palmRaise compassionate; reaction
 * playful; everything else serene). Expressions blend over 18 frames from `prevExpression` (or the
 * previous pose's expression). Small saccades and slow blinks keep the eyes alive. All restrained.
 *
 * EPISODE 4 POSES (added 2026-11-22; the Episode 3 poses and frames are unchanged, checked pixel for pixel)
 *   Seat: `kneel` 0 cross-legged (default), 1 kneeling back on the heels, 2 up on the knees (shins and soles
 *   behind him). Animate it for a rise; the kneeling hands rest on the thighs in sitCross, idle and lookUp.
 *   Objects: `holding` (HeldObject: clayLump, clayShiva, doll, gobinda, incense, stoneBowl) is drawn from the
 *   drawn wrists every frame (MOT-07), between the far hand and the near hand; the shared Hand grips it (palms
 *   toward it, thumbs toward the camera, MOT-19). Off the hands the scene draws it with `HeldObjectArt` (same
 *   art, same origin; `HELD_OBJECT_BOTTOM` stands it on a surface).
 *   - holdInLap    both hands, on his lap, turned gently to the light. sitCross / idle with `holding` = this.
 *                  `watchHeld` 0 frees the head and eyes for `face` (looking up at his mother, clay in hand).
 *   - holdToChest  hugged to the chest (the doll; the Gobinda held close, considering).
 *   - offerUp      held out in both hands at `reachAt` (default in front of the chest): handing the Gobinda
 *                  back to Sundar, offering the incense in at the door. Leans and bends to reach.
 *   - kneelReach   rises to `kneel` (at least 1.5), bends forward and both hands go out to `reachAt` (default a
 *                  plate on a low pidi, { x: 92, y: -44 }). KNEEL_REACH_T: rise 0-14, reach 4-22, grip 20-26.
 *                  Picking up: `reachFor` the object, then `holding` from poseStart + 26 (hide the scene's copy)
 *                  and switch to holdInLap with prevPose kneelReach and prevPoseStart. Setting down (the doll on
 *                  the plate): `holding` until + 26, then clear it and draw it at `reachAt`. Keep `kneel` at
 *                  1.5 or 2 afterwards to stay up, or leave it at 0 and the next pose sits him back down.
 *   - drinkBowl    self-timed (DRINK_BOWL_T, about 3 s): reach to the big stone bowl on the floor at `reachAt`
 *                  (default DRINK_BOWL_AT), lift it in both hands with a little effort (it is heavy: a slow heave,
 *                  a lean back, a faint tremor while it is up), drink it all in one long draught (bowl
 *                  tips, head back, water runs out, drinkBowlFill(t)), set it back at the same place, hands to the
 *                  lap. The rig draws the bowl through the whole pose; before and after, the scene draws it there
 *                  (HeldObjectArt "stoneBowl", fill 1 before, 0 after: the fopra left alone in it).
 *   - pointIn      a gentle open palm toward `pointAt` (a doorway, the khat, the bowl at his side; asking to
 *                  sit inside). `holding` stays in the far hand on his lap.
 *   - rollClay     rolls the clay between his palms (near palm circling on top). With holding "clayShiva" the
 *                  Shiva is squeezed into a ball over t 0-36; then pass "clayLump".
 *   - toss         "...পেছনে ফেলে দাও!": the near hand flicks up and back beside the shoulder (TOSS_T), the far hand
 *                  keeps `holding` on his lap.
 *   All take `lifeF`, `talk`, `sigh`, expressions and `prevPose` blends like the Episode 3 poses. Facing is +x
 *   (use `flip` to face left); targets are in figure units before the flip, ground at y = 0.
 *
 * BAL-26 "PLATE" DESIGN (added 2026-11-22; `design="plate"`, `age`, default "classic" is unchanged pixel for pixel)
 *   Balak from Episode 5 on, after the director's reference plate 01. The head and neck are the shared
 *   ThakurHeadPlate / ThakurNeckPlate (src/cinematic/rig/ThakurHeadPlate.tsx: one face for every Balak rig), fed with
 *   this rig's gaze, blinks, expressions and mouth; it sits PLATE_HEAD_UP higher on a slim visible neck. Skin and cloth
 *   come from PLATE_COLORS. Costume: a Sundar-like white kurta (crew neck, short sleeves to the elbow; forearms free)
 *   over the cream dhoti — replaces the hanging chadar/capes so arm gestures stay clean; held objects draw over the
 *   sleeves where needed.
 *
 * EPISODE 5 (added 2026-11-22, both designs)
 *   - playPebbles  self-timed (PEBBLES_T): the near hand picks a pebble from the pile (PEBBLE_PILE) and lays it in a
 *                  row (pebbleSlot(i)), PEBBLES_T.count times, then rests. The rig draws the pebble in the fingers;
 *                  the scene draws the ground pebbles with <PebblesArt x y s flip t={f - poseStart} /> BEFORE the rig.
 *   - strokeCow    palm raised to the cow's muzzle at `strokeAt` (pass it every frame; the hand follows it), a breath
 *                  short of it until STROKE_COW_T.touch, then slow strokes along `strokeDir`; the head turns toward
 *                  the near side a little. Default expression compassionate.
 *   - headShake    a prop (start frame on the story clock), not a pose: a slow, small compassionate head shake of
 *                  HEAD_SHAKE_LEN frames over any pose.
 *
 * EPISODE 6 (added 2026-11-22, opt-in; Episodes 3 to 5 render byte-identically). All self-timed from poseStart, starting
 * from the resting hands (from sitCross / idle the prevPose blend is only 6 frames). Props for the scene: seatedEp6Anchors()
 * (same props object) gives the palms, the pinch point, the ball, the note and the head top; draw the ball / note through
 * the `propInHands` slot (world coordinates, between the far and the near hand). Plate design: far UPPER arm + kurta
 * sleeve stay behind the chest; farArmFront promotes only the forearm + hand over the kurta; held props stay over the
 * near sleeve (farOverCape slot kept for props).
 *   - takeBall     TAKE_BALL_T: both hands come up under the ball at `giveAt` (default TAKE_BALL_AT), the giver lets go at
 *                  `take`, he draws it to his lap and keeps it there; joyful. Ball radius BALL_R.
 *   - treasurer    TREASURER_T per step of `pickPlace` (default TREASURER_STEPS on TREASURY_CLOTH): the near hand picks the
 *                  item at `from` and sets it on the heap at `to`; the far hand rests; serene. treasurerAt(t, steps).
 *   - takeNote     TAKE_NOTE_T: palms up for the note at `giveAt` (default TAKE_NOTE_AT), drawn to his chest, he looks at it
 *                  troubled (thoughtful + gentle inner brows); at `foldAt` his hands close round it and he nods (decided).
 *                  `watchHeld` 0 + face.lookX lets him look away (to the village) with the note in his hands. NOTE_SIZE.
 *   - handOnHead   HAND_ON_HEAD_T: the near hand claps to the top of his head (palm on the hair, fingers on the crown), then
 *                  both palms open, empty, held out (the near elbow swings down through depth, elbowSwingF); playful.
 */

export type SeatedPose =
  | "sitCross"
  | "pour"
  | "pickLeaf"
  | "placeFlowerOnFoot"
  | "bowHands"
  | "lookUp"
  | "idle"
  | "bless"
  | "palmRaise"
  | "reaction"
  // Episode 4 (see "EPISODE 4 POSES" below)
  | "kneelReach"
  | "holdInLap"
  | "holdToChest"
  | "offerUp"
  | "drinkBowl"
  | "pointIn"
  | "rollClay"
  | "toss"
  // Episode 5 (see "EPISODE 5" below)
  | "playPebbles"
  | "strokeCow"
  | "handsTo"
  // Episode 6 (see "EPISODE 6" below)
  | "takeBall"
  | "treasurer"
  | "takeNote"
  | "handOnHead";

/**
 * Objects Balak can hold (Episode 4), drawn simply in the series style, no glow on any of them (BAL-05):
 *   clayLump   the clay rolled into a ball (dark grey-brown field clay, finger marks), about 17 units across
 *   clayShiva  Charu's small clay Shivalinga on its clay base with a bel leaf on top, about a hand high
 *   doll       the gaudy painted wooden fair doll (red, yellow, green, big round eyes), about a forearm high
 *   gobinda    the small standing brass Gobinda with the flute on a round base, about 64 units high
 *   incense    a small brass dhoop-dani (cup on a foot, short handle) with a thin curl of smoke
 *   stoneBowl  the wide grey stone bowl with coconut water and the whole fopra in it
 */
export type HeldObject = "clayLump" | "clayShiva" | "doll" | "gobinda" | "incense" | "stoneBowl";

export interface SeatedChildProps {
  x: number;
  y: number;
  s?: number;
  f: number;
  pose?: SeatedPose;
  /** Pose the child is leaving. When set, joints blend from it over the first 16 frames of `poseStart`. */
  prevPose?: SeatedPose;
  flip?: boolean;
  face?: { lookX?: number; smile?: number; eyesDown?: number };
  /**
   * Frame at which the current pose began. The placeFlowerOnFoot timeline runs on the clock
   * t = f - poseStart. Default 0 (absolute frames).
   */
  poseStart?: number;
  /** Mouth opening, 0 = closed soft smile line, 1 = fully open. Default 0. */
  mouth?: number;
  /** Accepted for API compatibility. The glow is drawn by BirulGlow, not by this rig. */
  glow?: number;
  /** Facial expression. Default: derived from the pose (see POSE_EXPRESSION). */
  expression?: SeatedExpression;
  /** Expression being left; blends into `expression` over 18 frames from `expressionStart`. */
  prevExpression?: SeatedExpression;
  /** Frame at which `expression` began. Default `poseStart`. */
  expressionStart?: number;
  /**
   * Frame at which `prevPose` began. When set, the pose being left is evaluated on its own clock, so
   * the blend starts from exactly the pose shown on the frame before the switch (no jump). Pass it
   * whenever `prevPose` is a timed pose (placeFlowerOnFoot, reaction).
   */
  prevPoseStart?: number;
  /**
   * Red hibiscus flowers resting on his feet in the cross-legged seat: 0 = none, 1 to 3 = that many.
   * A fractional value eases the newest one in (e.g. 1.5 = one flower plus the second half grown in).
   * Slot 1 is the top of the near foot, exactly where placeFlowerOnFoot lays its flower. When this
   * prop is set, placeFlowerOnFoot lays the flower and lets go at t = 24 (it no longer carries it back
   * to the basket) and the hand flower is hidden from then on: raise footFlowers by one at
   * poseStart + 24 so the laid flower stays.
   */
  footFlowers?: number;
  /** Draw the rig's own small basket beside the near foot. Default false: the scene owns the basket. */
  showBasket?: boolean;
  /**
   * Wrist target (figure units, ground at y = 0) where the hand picks the flower in placeFlowerOnFoot.
   * Default { x: 84, y: -26 }, just in front of the near foot. Keep it within reach (about 100 units
   * from the near shoulder).
   */
  basketAt?: { x: number; y: number };
  /**
   * Life clock. Breathing, blinks, saccades, idle eye drift and glances, the idle sway and weight
   * shift, and the idle hand drift run on `lifeF ?? f`; poses, expressions, gestures and everything
   * story-driven keep using `f`. Pass a steadily running frame (e.g. the scene frame) when `f` is
   * warped or phase-shifted, so the breath never speeds up, stops or jumps.
   */
  lifeF?: number;
  /**
   * Speech envelope, 0 = silent, 1 = in a spoken line. While speaking the breath becomes shallow
   * with small quick inhales. Default: derived from `mouth` (any open mouth counts as speech).
   */
  talk?: number;
  /**
   * A visible deep, calm breath at a key beat: the sigh's breath curve at frame f (the same clock as
   * `f`), 0 outside the sigh, rising slowly to 1 at the top of the inhale and falling back over a
   * longer exhale. While it runs it replaces the normal breath, and the shoulders settle as he lets
   * the breath go. `sighCurve(start)` builds a ready-made one.
   */
  sigh?: (f: number) => number;
  /**
   * Episode 4. How he sits: 0 = cross-legged (default, Episode 3), 1 = kneeling, sitting back on his heels,
   * 2 = up on his knees. Fractions move between them (animate it over about 12 to 16 frames for a rise). The
   * kneelReach pose kneels by itself (to 1.5 unless this is 1 or more).
   */
  kneel?: number;
  /**
   * Episode 4. The object in his hands (see HeldObject). Drawn by the rig only in the Episode 4 poses: in both
   * hands in holdInLap, holdToChest, offerUp, kneelReach and rollClay; in the far hand on his lap in pointIn
   * and toss. sitCross and idle with `holding` set become holdInLap. drinkBowl always draws the stone bowl
   * itself (from the floor, in his hands, and back on the floor). The object is placed from the drawn hands
   * every frame, so it never floats (MOT-07). When the rig is not holding it, the scene draws it, with
   * HeldObjectArt at the same place.
   */
  holding?: HeldObject;
  /**
   * Episode 4, kneelReach only: the object he is reaching for, which is not yet in his hands (it sets how far
   * apart the hands close). Set `holding` from poseStart + KNEEL_REACH_T.grip on (and hide the scene's copy).
   */
  reachFor?: HeldObject;
  /**
   * Episode 4 target (figure units, ground at y = 0, before `flip`): kneelReach, the centre of the object the
   * hands reach to (default { x: 92, y: -44 }, a plate on a low pidi); drinkBowl, the centre of the bowl
   * standing on the floor (default { x: 66, y: -12 }); offerUp, where the object is held out (default about
   * { x: 80, y: -122 } in front of the chest). Keep it within reach, about 70 to 100 units from the hips;
   * he leans and bends forward as far as he needs (up to about 40 degrees).
   */
  reachAt?: { x: number; y: number };
  /** Episode 4, pointIn: what the open hand shows (figure units). Default { x: 170, y: -120 }: ahead, at chest height. */
  pointAt?: { x: number; y: number };
  /** Episode 4: coconut water left in the stone bowl, 1 = brimming, 0 = empty (default: drinkBowl's own timeline, else 1). */
  heldFill?: number;
  /**
   * Episode 4: how much he looks at the object in his hands in holdInLap, holdToChest and rollClay, 0 to 1
   * (default 1). Set 0 to let `face` (lookX, eyesDown) steer the head and eyes, e.g. looking up at his
   * mother while the clay stays in his hands.
   */
  watchHeld?: number;
  /**
   * BAL-26 (Episode 5 on): "plate" draws Balak from the director's reference plates (01_Series_Bible/
   * Thakur_Reference_Plates, plate 01 at age 6): short straight soft black hair with a side part and a rounded
   * crown, a child-rounded oval face with visible ears and a slim neck, large dark-brown almond eyes with a firm
   * upper lash line, straight dark brows, a small straight nose, a calm closed-lip half smile, warm medium-brown
   * skin, a white chadar over both shoulders with a V at the chest. "classic" (default) is the Episode 3 and 4
   * design, unchanged pixel for pixel.
   */
  design?: SeatedDesign;
  /**
   * BAL-26d (2026-11-23), "plate" design only, opt-in: "healthy" colours seated Balak like StandingChild build="healthy"
   * (the warmer PLATE_COLORS_HEALTHY skin and warm cotton shading, and ThakurHeadPlate `vivid`: bright open eyes), so the
   * seated and the standing boy read as the same child. Body shapes are unchanged. Default "classic" = byte-identical.
   */
  build?: "classic" | "healthy";
  /** "plate" design only: age in years (default 5, 4 to 12). Older lengthens the face and the neck a little. */
  age?: number;
  /**
   * Episode 5: start frame (story clock) of a small, slow compassionate head shake ("ও কি আর বুঝেছে…"), about 44
   * frames (HEAD_SHAKE_LEN); works with any pose and expression. Undefined = none.
   */
  headShake?: number;
  /** Episode 5, strokeCow: the cow's muzzle this frame (figure units, before flip; the hand follows it every frame). */
  strokeAt?: { x: number; y: number };
  /** Episode 5, strokeCow: direction of the stroke along her face and neck (default up and back, toward +x). */
  strokeDir?: { x: number; y: number };
  /**
   * Episode 5, pose "handsTo": where each hand's PALM CENTRE goes, in figure units (the same frame as reachAt and
   * strokeAt: relative to the seat centre (x, y), before `flip`, ground at y = 0, +x the side he faces). Pass them
   * every frame (they may move: a tortoise, Charu's hands); a hand on its target stays on it every frame with no lag.
   * A hand without a target rests (on the knee, or in the lap in the plate design). He leans and bends forward as
   * needed (to the ground about one forearm beyond the knees, x up to about 110), the head follows, eyes on the hands.
   */
  handTargets?: { near?: { x: number; y: number }; far?: { x: number; y: number } };
  /** handsTo: hand shape per hand, "open" (default), "cup" or "grip" (fingers hooked round a rim). */
  handShapes?: { near?: SeatedHandShape; far?: SeatedHandShape };
  /**
   * handsTo: wrist turn per hand in radians (Hand.tsx convention: 0 palm to camera, PI back of the hand, -PI/2 thumb
   * edge, +PI/2 little-finger edge). Default: back of the hand up (resting turn). To grip a shell rim from its two
   * sides use about -1.6 on both (palms toward the shell, thumbs toward the camera).
   */
  handTurns?: { near?: number; far?: number };
  /** 0..1: the near hand turns palm up (a hand held passively in someone's hands; with handsTo near target = her holdAt). */
  palmUp?: number;
  /** Episode 5: story frame of a forced quick blink (about 5 frames), e.g. the blink of surprise at the bite. */
  blinkAt?: number;
  /**
   * Episode 6, takeBall / takeNote: where the giver's hands hold the ball's centre / the folded note when his hands
   * arrive (figure units, before `flip`, ground at y = 0). Defaults TAKE_BALL_AT and TAKE_NOTE_AT. Keep the giver's
   * hands there from TAKE_*_T.reach to TAKE_*_T.take.
   */
  giveAt?: { x: number; y: number };
  /**
   * Episode 6, treasurer: the pick-and-place steps in order, one every TREASURER_T.cycle frames from poseStart: the near
   * hand picks the item lying at `from` and sets it on the heap at `to` (ground points, figure units, before `flip`).
   * Default TREASURER_STEPS. After the last step the hand goes back to rest.
   */
  pickPlace?: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>;
  /** Episode 6, takeNote: story frame at which he folds his hands round the note (default poseStart + TAKE_NOTE_T.fold). */
  foldAt?: number;
  /**
   * Episode 6: the scene's art for what is in his hands (the ball, the note), in WORLD coordinates (the same frame as
   * x, y), drawn by the rig between the far hand and the near hand, so the near fingers come in front of it. Place it
   * from seatedEp6Anchors() for the very same props. Not drawn when unset.
   */
  propInHands?: React.ReactNode;
}

export type SeatedHandShape = "open" | "cup" | "grip";

export type SeatedDesign = "classic" | "plate";

/* ------------------------------------------------------------------ */
/* Breathing (MOT-20)                                                   */
/* ------------------------------------------------------------------ */

/** Mean breath period of a calm five-year-old: about 3 s at 24 fps (2.5 to 3.8 s with the noise). */
const BREATH_P = 72;

/** Deterministic 0..1 hash of an integer (per-cycle variation). */
const hash01 = (n: number, salt: number): number => {
  let h = (Math.imul(n | 0, 2654435761) ^ Math.imul(salt | 0, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const easeSin = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/**
 * Calm breath at life frame L: 0 = resting at the bottom, about 1 = top of a normal inhale.
 * The phase runs on slow noise (each breath a little longer or shorter), the inhale is the quicker
 * part (about a third of the cycle), the exhale is passive and tails off, and there is a short rest
 * at the bottom. Each cycle has its own depth.
 */
const calmBreath = (L: number): number => {
  const ph =
    L / BREATH_P + 0.15 * Math.sin(L * 0.0109 + 0.6) + 0.11 * Math.sin(L * 0.0067 + 2.3) + 0.03 * Math.sin(L * 0.0231 + 4.1);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.8 + 0.32 * hash01(n, 11);
  const inF = 0.3 + 0.07 * hash01(n, 23);
  const exEnd = 0.78 + 0.09 * hash01(n, 37);
  let v = 0;
  if (u < inF) v = easeSin(u / inF);
  else if (u < exEnd) v = Math.pow(1 - easeSin((u - inF) / (exEnd - inF)), 1.35);
  return depth * v;
};

/**
 * Speaking breath: shallow, a quick small inhale (about 6 frames) then a long slow outflow while the
 * words come, every 1.5 to 2.3 s, so the chest barely moves while he talks.
 */
const speechBreath = (L: number): number => {
  const ph = L / 44 + 0.18 * Math.sin(L * 0.019 + 1.1) + 0.08 * Math.sin(L * 0.0431 + 0.3);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.24 + 0.14 * hash01(n, 53);
  const inF = 0.15;
  const v = u < inF ? easeSin(u / inF) : 1 - easeSin((u - inF) / (1 - inF));
  return depth * v;
};

/**
 * A ready-made sigh curve for the `sigh` prop: from `start`, a slow deep inhale over `inhale` frames,
 * a brief hold at the top, then a longer exhale over `exhale` frames that tails off. 0 outside.
 */
export const sighCurve =
  (start: number, inhale = 30, exhale = 56, hold = 5) =>
    (f: number): number => {
      const t = f - start;
      if (t <= 0) return 0;
      if (t < inhale) return easeSin(t / inhale);
      if (t < inhale + hold) return 1;
      const e = (t - inhale - hold) / exhale;
      if (e >= 1) return 0;
      return Math.pow(1 - easeSin(e), 1.25);
    };

/** Breath of the sigh at its top, relative to a normal inhale. */
const SIGH_DEPTH = 2.3;

/**
 * The breath actually shown at life frame L (story frame sf for the sigh): calm breath, shallow speech
 * breath crossfaded by `speak`, and a sigh that takes over while it runs. `settle` (0..1) is the
 * shoulders letting go during the sigh's exhale.
 */
const breathValue = (
  L: number,
  speak: number,
  sigh: ((f: number) => number) | undefined,
  sf: number,
): { b: number; settle: number } => {
  let b = lerpN(calmBreath(L), speechBreath(L), speak);
  let settle = 0;
  if (sigh) {
    // Sigh weight: full from 8 frames before the sigh rises until about 30 frames after it ends.
    let win = 0;
    for (let k = -30; k <= 8; k += 2) win = Math.max(win, clampN(sigh(sf + k), 0, 1));
    const w = easeSin(win / 0.12);
    if (w > 0) {
      const sv = clampN(sigh(sf), 0, 1);
      b = lerpN(b, SIGH_DEPTH * sv, w);
      const falling = clampN((clampN(sigh(sf - 12), 0, 1) - sv) * 4, 0, 1);
      settle = w * easeSin(falling) * (1 - 0.6 * sv);
    }
  }
  return { b, settle };
};

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

export type SeatedExpression = "serene" | "joyful" | "thoughtful" | "compassionate" | "playful" | "surprised";

/** Expression used when the `expression` prop is not set. */
export const POSE_EXPRESSION: Record<SeatedPose, SeatedExpression> = {
  sitCross: "serene",
  idle: "serene",
  pour: "serene",
  pickLeaf: "serene",
  placeFlowerOnFoot: "serene",
  bless: "compassionate",
  bowHands: "compassionate",
  palmRaise: "compassionate",
  lookUp: "thoughtful",
  reaction: "playful",
  kneelReach: "serene",
  holdInLap: "serene",
  holdToChest: "joyful",
  offerUp: "compassionate",
  drinkBowl: "serene",
  pointIn: "playful",
  rollClay: "serene",
  toss: "playful",
  playPebbles: "serene",
  strokeCow: "compassionate",
  handsTo: "serene",
  takeBall: "joyful",
  treasurer: "serene",
  takeNote: "thoughtful",
  handOnHead: "playful",
};

/** Expression weights; serene is what is left (all zero = serene). */
interface ExprW {
  joy: number;
  thought: number;
  comp: number;
  play: number;
  /** Episode 5: a blink of surprise (plate design: brows up, eyes a touch wider, a small soft 'o'). */
  sur: number;
}
const exprVec = (e: SeatedExpression): ExprW => ({
  joy: e === "joyful" ? 1 : 0,
  thought: e === "thoughtful" ? 1 : 0,
  comp: e === "compassionate" ? 1 : 0,
  play: e === "playful" ? 1 : 0,
  sur: e === "surprised" ? 1 : 0,
});

/** Episode 5: a forced quick blink of about 5 frames starting at t = 0 (0 open, 1 closed). */
const quickBlink = (t: number): number => (t < 0 || t >= 5 ? 0 : t < 2 ? smooth(t / 2) : 1 - smooth((t - 2) / 3));

interface V {
  x: number;
  y: number;
}

interface Prop {
  x: number;
  y: number;
  opacity: number;
  /** Held in the near hand: drawn in the fingers of the drawn (lagged) hand instead of at x, y. */
  held?: boolean;
}

/** Options for the pose solver that come from props. */
interface SolveOpts {
  footFlowers?: number;
  basketAt: V;
  /** Life clock offset (lifeF - f): the idle lean drift and the resting hands' drift run on f + lifeOff. */
  lifeOff?: number;
  /** Episode 4 props (see SeatedChildProps). All undefined in Episode 3, so its poses are untouched. */
  seat?: number;
  holding?: HeldObject;
  reachFor?: HeldObject;
  reachAt?: V;
  pointAt?: V;
  heldFill?: number;
  watchHeld?: number;
  /** "plate" design (BAL-26): head centre (relative to PIVOT) and the mouth in head-local units, for the drink. */
  headCY?: number;
  mouthLocal?: V;
  /** Episode 5, strokeCow: the cow's muzzle (figure units) this frame, and the stroke direction along her face. */
  strokeAt?: V;
  strokeDir?: V;
  /** BAL-26 plate design: resting hands lie together in the lap (plate 01) instead of on the knees. */
  plateRest?: boolean;
  /** Episode 5, handsTo / palmUp (see SeatedChildProps). */
  handTargets?: { near?: V; far?: V };
  handShapes?: { near?: SeatedHandShape; far?: SeatedHandShape };
  handTurns?: { near?: number; far?: number };
  palmUp?: number;
  /** Episode 6 (see SeatedChildProps). */
  giveAt?: V;
  pickPlace?: Array<{ from: V; to: V }>;
  foldAt?: number;
}

/**
 * Episode 6: the ball or the note in his hands. Placed like HeldPose (from the drawn wrists, `ofsF` / `ofsB`, `farW`);
 * `free` = still in the giver's hands at x, y (not yet taken). `fold` 0..1: the hands closed round the note.
 */
interface Hold6 {
  kind: "ball" | "note";
  x: number;
  y: number;
  rot: number;
  farW: number;
  ofsF: V;
  ofsB: V;
  free: boolean;
  fold: number;
}

/**
 * An object in the hands (Episode 4). `x, y, rot` is where the pose puts it; `ofsF` and `ofsB` are the near and
 * far wrists relative to it (already rotated). The drawing places it from the drawn (lagged) wrists, so it stays
 * in the hands; a `free` object (the bowl on the floor before and after drinkBowl's grip) stays at x, y.
 */
interface HeldPose {
  kind: HeldObject;
  x: number;
  y: number;
  rot: number;
  /** Share of the far hand in placing the drawn object: 0.5 = both hands, 1 = the far hand alone. */
  farW: number;
  ofsF: V;
  ofsB: V;
  free?: boolean;
  fill?: number;
  /** rollClay: 0 = still the clay Shiva, 1 = rolled into a ball. */
  morph?: number;
  /** rollClay: the turn of the ball between the palms, degrees. */
  spin?: number;
  opacity?: number;
}

interface Solve {
  lean: number;
  headTilt: number;
  eyeUp: number;
  eyeDown: number;
  front: V;
  back: V;
  /** Unit vector from the wrist toward the fingertips. */
  frontDir: V;
  backDir: V;
  /** 0 = fingers pressed together, 1 = fingers apart. */
  spread: number;
  /** Finger curl of the near (front) and far (back) hands: 0 = straight, 1 = loosely closed. Default 0.3. */
  curl?: number;
  curlB?: number;
  /** Shared-Hand shape and wrist turn (radians, see Hand.tsx) of the near and far hands. Default: relaxed. */
  shapeF?: HandShape;
  shapeB?: HandShape;
  turnF?: number;
  turnB?: number;
  /** 0..1: the palms are joined at the chest (pranam). The far forearm and hand then come in front of the chest. */
  joinW?: number;
  /** Point (figure units) the eyes look at, with its weight 0..1 against the default gaze. */
  gazeAt?: V;
  gazeW?: number;
  /** Pot in the near hand; `opacity` (default 1) fades it while the pour pose blends in or out. */
  pot?: { tilt: number; opacity?: number };
  leaf?: Prop;
  flower?: Prop;
  /** Episode 4: seat (0 cross-legged, 1 on the heels, 2 up on the knees). Undefined = 0. */
  kneel?: number;
  /** Episode 4: forward bend toward the camera (figure units the shoulders come down by). Undefined = 0. */
  drop?: number;
  /** Episode 4: the object in the hands. */
  obj?: HeldPose;
  /** Episode 4: 0..1, how little the forearms trail while both hands carry an object. Undefined = 0. */
  rigid?: number;
  /** Episode 4: above 0.5 the IK keeps the elbows low (offering, gestures). Undefined = 0. */
  elbowDown?: number;
  /** Episode 5: the pebble in the near hand's fingers (playPebbles). */
  pebble?: Prop;
  /** Episode 5: head turn toward the near side, 0..1 (strokeCow). Undefined = 0. */
  turn?: number;
  /** Episode 6: the ball / note in the hands (takeBall, takeNote). */
  hold6?: Hold6;
  /** Episode 6: a troubled knit, added to the brows' inner rise (takeNote). Undefined = none. */
  worry?: number;
  /** Episode 6: the near elbow's swing through depth, 0..1 (see ikSwing in seatedRig). Undefined = the usual bend. */
  elbowSwingF?: number;
  /**
   * Episode 6: plate design, the whole far arm is drawn over the chest wrap (under the far cape), 0..1, so a far hand
   * reaching forward is joined to its shoulder (no forearm floating on the chest). Undefined = behind the torso.
   */
  farArmFront?: number;
  /** Episode 6: plate design, the joined far forearm and hand are drawn again over the near side of the chadar. */
  farOverCape?: boolean;
}

/* ------------------------------------------------------------------ */
/* Palette                                                              */
/* ------------------------------------------------------------------ */

// Warm, luminous child skin that still separates from the warm wall.
const SKIN = "#c68b5c";
const SKIN_LIT = "#dca474"; // lit side of the round forms (forehead, cheeks, chest)
const SKIN_FAR = "#ab7046";
const SKIN_SHADE = "#83522f";
const SKIN_DEEP = "#5c361e";
const SKIN_UNDER = "#2e1a0d"; // deepest core shade, used for contact shadows
const RIM = "#f8d6a2"; // warm rim light on the shoulders and top of the head
const SOLE_NEAR = "#a46a3f"; // sole of the near foot: a shade darker than the skin
const SOLE_FAR = "#804e2b"; // sole of the far foot
const HAIR = "#1c130e";
const HAIR_HI = "#5a4232";
const HAIR_SHEEN = "#a08068";
// Cream cotton for the dhoti and the uttariya.
const CLOTH_LIT = "#fffaf0";
const CLOTH = "#f6efdf";
const CLOTH_MID = "#e7dcc3";
const CLOTH_FOLD = "#d3c4a4";
const CLOTH_SHADE = "#c4b290";
const CLOTH_INNER = "#a99372"; // the slightly darker inner side of a turned fold
const EYE_WHITE = "#fcf8ee";
const EYE_SHADE = "#d9c7b0"; // soft shadow cast by the upper lid on the eye white
const IRIS = "#2d1a0f";
const IRIS_RING = "#7a4a28"; // warm lower half of the iris, keeps the eyes bright
const PUPIL = "#0d0704";
const LASH = "#23130b";
const BROW = "#3a2417";
const MOUTH = "#8e4636";
const MOUTH_DARK = "#4a2016";
const MOUTH_INNER = "#c86a58";
const LIP = "#d98b74";
const BLUSH = "#ec8c80";
const BRASS = "#c48a2e";
const BRASS_DARK = "#8c5a1b";
const WATER = "#9fd0e4";
const LEAF = "#5f9a46";
const LEAF_DARK = "#3f6e2e";
// Red hibiscus (জবা): broad crimson-red petals, a dark wine centre, a long red staminal column with a yellow tip.
const HIB_LIGHT = "#f0473f"; // lit outer petal
const HIB_RED = "#d81f26";
const HIB_DEEP = "#9c0f1a"; // petal base and veins
const HIB_CORE = "#5e0610"; // dark eye at the centre
const HIB_EDGE = "#7d0c16"; // soft edge line
const HIB_COLUMN = "#c8202c";
const HIB_POLLEN = "#ffd23f";
const BASKET = "#a57240";
const BASKET_DARK = "#6e4a26";
const BASKET_RIM = "#c99a5c";
const HEAD_CLEAR = 48; // props (leaf, pot) are kept at least this far from the head centre

/** Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b. */
const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
/**
 * Shade side of a bare-skin shape (MOT-19): the same soft step the shared Hand uses for its parts
 * (skin a third of the way toward the shade), so arms, legs, feet, neck and torso read as one body with
 * his hands. Never a dark brown outline: under the lit copy it shows only as a gentle form shadow along
 * the side away from the light, and as a faint same-hue edge where skin lies over skin.
 */
const SKIN_EDGE_K = 0.34;
const skinEdge = (base: string, shade: string): string => mixHex(base, shade, SKIN_EDGE_K);

/** Skin and cloth colours per design (BAL-26). CLASSIC_PAL is exactly the Episode 3 and 4 constants above. */
interface Pal {
  skin: string;
  skinLit: string;
  skinFar: string;
  skinShade: string;
  skinDeep: string;
  skinUnder: string;
  rim: string;
  soleNear: string;
  soleFar: string;
  clothLit: string;
  cloth: string;
  clothMid: string;
  clothFold: string;
  clothShade: string;
  clothInner: string;
}
const CLASSIC_PAL: Pal = {
  skin: SKIN,
  skinLit: SKIN_LIT,
  skinFar: SKIN_FAR,
  skinShade: SKIN_SHADE,
  skinDeep: SKIN_DEEP,
  skinUnder: SKIN_UNDER,
  rim: RIM,
  soleNear: SOLE_NEAR,
  soleFar: SOLE_FAR,
  clothLit: CLOTH_LIT,
  cloth: CLOTH,
  clothMid: CLOTH_MID,
  clothFold: CLOTH_FOLD,
  clothShade: CLOTH_SHADE,
  clothInner: CLOTH_INNER,
};
/**
 * Plate 01 (age 6, sampled from the plate): warm medium-brown skin a touch more golden than the classic tone
 * (lit #d49862, mid #c98d5c, shade #ab764c on the plate), and white cotton with soft grey-beige shadows.
 */
const PLATE_PAL: Pal = {
  skin: PLATE_COLORS.skin,
  skinLit: PLATE_COLORS.skinLit,
  skinFar: PLATE_COLORS.skinFar,
  skinShade: PLATE_COLORS.skinShade,
  skinDeep: PLATE_COLORS.skinDeep,
  skinUnder: PLATE_COLORS.skinUnder,
  rim: PLATE_COLORS.rim,
  soleNear: PLATE_COLORS.soleNear,
  soleFar: PLATE_COLORS.soleFar,
  clothLit: PLATE_COLORS.clothLit,
  cloth: PLATE_COLORS.cloth,
  clothMid: PLATE_COLORS.clothMid,
  clothFold: PLATE_COLORS.clothFold,
  clothShade: PLATE_COLORS.clothShade,
  clothInner: PLATE_COLORS.clothInner,
};

/** BAL-26d: the plate palette in the healthy colours (PLATE_COLORS_HEALTHY), for build="healthy". */
const PLATE_HEALTHY_PAL: Pal = {
  skin: PLATE_COLORS_HEALTHY.skin,
  skinLit: PLATE_COLORS_HEALTHY.skinLit,
  skinFar: PLATE_COLORS_HEALTHY.skinFar,
  skinShade: PLATE_COLORS_HEALTHY.skinShade,
  skinDeep: PLATE_COLORS_HEALTHY.skinDeep,
  skinUnder: PLATE_COLORS_HEALTHY.skinUnder,
  rim: PLATE_COLORS_HEALTHY.rim,
  soleNear: PLATE_COLORS_HEALTHY.soleNear,
  soleFar: PLATE_COLORS_HEALTHY.soleFar,
  clothLit: PLATE_COLORS_HEALTHY.clothLit,
  cloth: PLATE_COLORS_HEALTHY.cloth,
  clothMid: PLATE_COLORS_HEALTHY.clothMid,
  clothFold: PLATE_COLORS_HEALTHY.clothFold,
  clothShade: PLATE_COLORS_HEALTHY.clothShade,
  clothInner: PLATE_COLORS_HEALTHY.clothInner,
};

/* ------------------------------------------------------------------ */
/* Geometry (figure units, y down, ground at y = 0)                     */
/* ------------------------------------------------------------------ */

/** Unit vector (x, y) normalised. */
const unit = (x: number, y: number): V => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

const PIVOT: V = { x: 0, y: -40 }; // hip centre; the upper body rotates about it
const UPPER = 52; // upper arm length (about 1.1 times the forearm)
const FORE = 47; // forearm length
const HEAD_K = 0.97; // head scale: a large, round child's head (about 1:3.8 of the seated figure)
const HEAD_CY = -142; // head centre relative to PIVOT (absolute y about -182), very short neck below it
/* BAL-26 "plate" design: the head (src/cinematic/rig/ThakurHeadPlate.tsx) sits PLATE_HEAD_UP higher on a slim
   visible neck, a little more with age. */
const PLATE_HEAD_UP = 3;
const SH_FRONT: V = { x: 27, y: -97 }; // shoulder joints relative to PIVOT: narrow, soft child shoulders
const SH_BACK: V = { x: -27, y: -97 };
const DIR_DOWN = unit(0.35, 1);
// Hands resting on the knee tops, used by every pose whose hands are not busy. (Old rest wrists at hip
// height beside the dhoti read as hands on hips, or as a hand hanging in mid-air; they are gone.)
const KNEE_REST_FRONT: V = { x: 54, y: -50 };
const KNEE_REST_BACK: V = { x: -54, y: -50 };
const KNEE_DIR_FRONT = unit(0.9, 0.45); // fingers lie over the knee, pointing forward
const KNEE_DIR_BACK = unit(-0.9, 0.45);
// Hands on the hips for the reaction beat: wrists beside the waist, fingers pointing down.
const HIP_FRONT: V = { x: 40, y: -66 };
const HIP_BACK: V = { x: -40, y: -66 };
const HIP_DIR_FRONT = unit(-0.3, 1);
const HIP_DIR_BACK = unit(0.3, 1);
// Sukhasana. The near leg (knee on the -x side) has its shin on top, running across the lap to the
// +x ankle; the far leg mirrors it. Knees sit about 65 px from the hip centre, at about hip height.
const HIP_NEAR: V = { x: -12, y: -40 };
const HIP_FAR: V = { x: 12, y: -40 };
const KNEE_NEAR: V = { x: -64, y: -30 };
const KNEE_FAR: V = { x: 64, y: -30 };
const ANKLE_NEAR: V = { x: 10, y: -7 }; // ankle of the near leg; its foot lies on the +x side under FOOT_TOP
const ANKLE_FAR: V = { x: -10, y: -7 }; // ankle of the far leg; its foot lies on the -x side
// Leaf pick: the wrist stops here with the fingers pointing down, so the fingertips reach the leaf on
// the ground (LEAF_GROUND). Close enough to the near shoulder that a gentle forward lean reaches it.
const LEAF_WRIST: V = { x: 74, y: -21 };
const LEAF_GROUND: V = { x: 80, y: -5 };
const FOOT_TOP: V = { x: 22, y: -17 }; // centre of the flower when it rests on the top of the near foot
/** Where a hibiscus rests on top of the near (bare) foot, in figure units (before flip): placeFlowerOnFoot's landing. */
export const SEATED_FOOT_TOP: { x: number; y: number } = { x: 22, y: -17 };
// Flowers resting on the feet (footFlowers): near foot top (where placeFlowerOnFoot lays it), the
// far foot's toes, and the crossing of the ankles. [x, y, rotation deg, scale]
const FOOT_FLOWER_SLOTS: Array<[number, number, number, number]> = [
  [22, -16, -12, 1],
  [-27, -12, 24, 0.94],
  [1, -19, 58, 0.9],
];
// The far hand rests on its knee, or slides onto the lap when the body leans forward.
const BACK_KNEE_HAND: V = { x: -50, y: -53 };
const BACK_LAP_HAND: V = { x: -16, y: -62 };
const BACK_LAP_DIR = unit(0.55, 0.84);
const BASKET_HAND: V = { x: 84, y: -26 }; // default basketAt: flower resting in the basket, and the grip point
const BASKET_RIM_Y = -17;
const POUR_TARGET: V = { x: 120, y: -2 }; // where the water lands (tulsi is drawn by the caller)

// Upper body, relative to PIVOT (unrotated). A soft five-year-old's body: narrow rounded shoulders,
// no chest muscles, a little round tummy and no waist taper.
const TORSO_REL: V[] = [
  { x: -11, y: -107 },
  { x: 11, y: -107 },
  { x: 23, y: -104.5 },
  { x: 30.5, y: -98 },
  { x: 31, y: -87 },
  { x: 27.5, y: -71 },
  { x: 28.5, y: -52 },
  { x: 30, y: -34 },
  { x: 27, y: -18 },
  { x: -27, y: -18 },
  { x: -30, y: -34 },
  { x: -28.5, y: -52 },
  { x: -27.5, y: -71 },
  { x: -31, y: -87 },
  { x: -30.5, y: -98 },
  { x: -23, y: -104.5 },
];

// Light rim along the top of the shoulders, relative to PIVOT.
const SHOULDER_RIM_REL: V[] = [
  { x: -30.5, y: -98 },
  { x: -23, y: -104.5 },
  { x: -11, y: -107 },
  { x: 11, y: -107 },
  { x: 23, y: -104.5 },
  { x: 30.5, y: -98 },
];

/*
 * Uttariya across the chest, relative to PIVOT (it rides on the upper body, so it follows the lean).
 * It starts tucked into the dhoti at the near (+x) hip, crosses the chest and goes over the far (-x)
 * shoulder, capping the top of the far arm. The lower edge is the free hem that stirs.
 */
const UTT_UPPER: V[] = [
  { x: -38.5, y: -89 },
  { x: -36, y: -98 },
  { x: -27, y: -106 },
  { x: -15, y: -109.5 },
  { x: -6, y: -107 },
  { x: 5, y: -96 },
  { x: 17, y: -82 },
  { x: 27, y: -67 },
  { x: 32.5, y: -53 },
  { x: 34, y: -38 },
];
const UTT_LOWER: V[] = [
  { x: 30, y: -27 },
  { x: 17, y: -38 },
  { x: 2, y: -52 },
  { x: -13, y: -66 },
  { x: -26, y: -77 },
  { x: -37, y: -82 },
];
/** Unit normal from the uttariya's lower hem into the cloth (up and toward the near side). */
const UTT_IN = unit(0.62, -0.78);

/* Dhoti hip wrap, relative to PIVOT: rides on the upper body and covers the waist and the hips. */
const HIP_WRAP_REL: V[] = [
  { x: -30, y: -36 },
  { x: -15, y: -37 },
  { x: 3, y: -35.5 },
  { x: 17, y: -37 },
  { x: 31, y: -36 },
  { x: 34, y: -25 },
  { x: 35, y: -15.5 },
  { x: 20, y: -12 },
  { x: 3, y: -11 },
  { x: -14, y: -12 },
  { x: -35, y: -15.5 },
  { x: -34, y: -25 },
];

/* Dhoti lap drape, absolute figure units: over the thighs, sagging between the knees. */
const LAP_PTS: V[] = [
  { x: -34, y: -64 },
  { x: 0, y: -66 },
  { x: 34, y: -64 },
  { x: 42, y: -52 },
  { x: 55, y: -43 },
  { x: 58, y: -32 },
  { x: 50, y: -23.5 },
  { x: 26, y: -20.5 },
  { x: 2, y: -19 },
  { x: -24, y: -20.5 },
  { x: -50, y: -23.5 },
  { x: -58, y: -32 },
  { x: -55, y: -43 },
  { x: -42, y: -52 },
];

/* Hair, head-local units (face circle radius 31 at the origin, features centred near x = +4). */
// Hairline curls framing a high, round child's forehead: [x, y, r].
const FRINGE: Array<[number, number, number]> = [
  [-22.5, -11, 4.6],
  [-17.5, -18.5, 5],
  [-9.5, -23, 5.3],
  [0, -25, 5.5],
  [9.5, -25, 5.4],
  [18, -22, 5],
  [25, -15.5, 4.6],
  [29.5, -8.5, 4],
];
// Curls around the crown and the back of the head: angle (deg, 180 = back, 270 = top), lock radius.
const CROWN: Array<[number, number]> = [
  [148, 7],
  [166, 8],
  [184, 8.4],
  [202, 8],
  [220, 8.6],
  [238, 8.2],
  [256, 8.6],
  [274, 8.2],
  [292, 7.8],
  [310, 7.2],
  [326, 6.4],
];
// Soft curls at the nape, behind the ear on the far side: [x, y, r].
const NAPE: Array<[number, number, number]> = [
  [-36, -6, 7],
  [-34.5, 4, 6.4],
  [-31, 12.5, 5.4],
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const pt = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/** Non-periodic wobble in about -1..1, same family as the Episode 2 animal rigs. */
const wob = (f: number, seed: number, rate = 1) =>
  0.55 * Math.sin(f * 0.061 * rate + seed) +
  0.3 * Math.sin(f * 0.1543 * rate + seed * 1.31 + 0.7) +
  0.15 * Math.sin(f * 0.0227 * rate + seed * 2.17);

/** Closed Catmull-Rom spline through the points, as an SVG path. */
const smoothClosed = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + "Z";
};

/** Open Catmull-Rom spline (end points repeated), as an SVG path. */
const smoothOpen = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};

/* Blink schedule: fixed pseudo-random start frames, slow and calm, about every 4.5 to 7 s at 24 fps. */
const BLINK_LEN = 15;
const BLINKS: number[] = (() => {
  const out: number[] = [];
  let seed = 7319;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let t = 60;
  while (t < 40000) {
    out.push(t);
    t += 110 + rnd() * 58;
  }
  return out;
})();

/** 0 = eyes open, 1 = fully closed. */
const blinkAmount = (f: number): number => {
  let lo = 0;
  let hi = BLINKS.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BLINKS[mid] <= f) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (idx < 0) return 0;
  // Each blink lasts a little differently (13 to 18 frames), so they never feel mechanical.
  const len = BLINK_LEN - 2 + ((idx * 2654435761) >>> 0) % 6;
  const u = (f - BLINKS[idx]) / len;
  if (u < 0 || u >= 1) return 0;
  // Lids lower softly, rest a moment, and rise even more slowly.
  if (u < 0.35) return smooth(u / 0.35);
  if (u < 0.45) return 1;
  return 1 - smooth((u - 0.45) / 0.55);
};

/* ------------------------------------------------------------------ */
/* Idle motion: weight shift, head glances, rest-hand swing and fidgets */
/* ------------------------------------------------------------------ */

// Pure functions of f built from seeded schedules, so nothing repeats on a loop.
// Timings assume 24 fps: 4 s = 96 frames, 7 s = 168 frames.
const IDLE_END = 40000;

const mkRng = (seed: number) => {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Index of the last event time <= f, or -1. */
const lastAtOrBefore = (ts: number[], f: number): number => {
  let lo = 0;
  let hi = ts.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= f) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return idx;
};

/**
 * Stepped random track: at each event the value eases from the previous value to a new one over
 * `ease` frames, then holds. Gaps are random in [gapMin, gapMax]. `ease` must not exceed `gapMin`,
 * so each ease finishes before the next event starts.
 */
interface Track {
  ts: number[];
  vs: number[];
  ease: number;
}
const makeTrack = (
  seed: number,
  gapMin: number,
  gapMax: number,
  ease: number,
  pick: (r: number, i: number) => number,
): Track => {
  const rnd = mkRng(seed);
  const ts = [0];
  const vs = [0];
  let t = 0;
  for (let i = 1; t < IDLE_END; i++) {
    t += gapMin + rnd() * (gapMax - gapMin);
    ts.push(t);
    vs.push(pick(rnd(), i));
  }
  return { ts, vs, ease };
};

const trackAt = (tr: Track, f: number): number => {
  const i = lastAtOrBefore(tr.ts, f);
  if (i < 0) return 0;
  const prev = i > 0 ? tr.vs[i - 1] : 0;
  return lerp(prev, tr.vs[i], smooth((f - tr.ts[i]) / tr.ease));
};

/** Hip weight shift: every 4 to 6 s, alternating sides, value about -1.33..1.33 (times 3 px). */
const WEIGHT_TRACK = makeTrack(101, 96, 144, 36, (r, i) => (i % 2 ? 1 : -1) * (0.67 + 0.66 * r));
/** Rest-hand swing from the shoulder, slow and continuous. */
const SWING_F_TRACK = makeTrack(211, 60, 110, 60, (r) => 2 * r - 1);
const SWING_B_TRACK = makeTrack(313, 60, 110, 60, (r) => 2 * r - 1);
/** Small quick fidgets on the knees (eased over 14 frames, every 1.7 to 3.7 s). */
const FIDGET_F_TRACK = makeTrack(409, 40, 90, 14, (r) => 2 * r - 1);
const FIDGET_B_TRACK = makeTrack(517, 50, 110, 14, (r) => 2 * r - 1);
/** Saccades: tiny quick eye jumps (3 frames) every 0.6 to 2 s, then the eyes hold still. */
const SACC_X_TRACK = makeTrack(619, 14, 48, 3, (r) => 2 * r - 1);
const SACC_Y_TRACK = makeTrack(727, 14, 48, 3, (r) => 2 * r - 1);
/** Finger curl drift of the resting hands: slow, unhurried curl and uncurl. */
const CURL_F_TRACK = makeTrack(839, 50, 120, 40, (r) => r);
const CURL_B_TRACK = makeTrack(941, 60, 130, 40, (r) => r);

/** The eyes move this many frames before the head. */
const EYE_LEAD = 4;
const GLANCE_RISE = 10; // frames for the head to turn out
const GLANCE_FALL = 12; // frames for the head to come back

interface Glance {
  t: number;
  deg: number;
  hold: number;
  toTulsi: boolean;
  side: number;
}
/** Glances start 4 to 7 s apart; the longest lasts 73 frames, so two never overlap. */
const GLANCES: Glance[] = (() => {
  const rnd = mkRng(733);
  const out: Glance[] = [];
  let t = 72;
  while (t < IDLE_END) {
    const toTulsi = rnd() < 0.5;
    out.push({
      t,
      deg: toTulsi ? 6 + 4 * rnd() : 5 + 4 * rnd(),
      hold: 30 + Math.floor(22 * rnd()),
      toTulsi,
      side: rnd() < 0.5 ? -1 : 1,
    });
    t += 96 + rnd() * 72;
  }
  return out;
})();
const GLANCE_TS = GLANCES.map((g) => g.t);

/**
 * Head glance in degrees, positive toward the figure's front (the tulsi side). A tulsi glance
 * always turns +x; a speaker glance turns toward the side of `look` (or a fixed random side when
 * look is 0). Rises, holds, and returns.
 */
const glanceDeg = (f: number, look: number): number => {
  const i = lastAtOrBefore(GLANCE_TS, f);
  if (i < 0) return 0;
  const g = GLANCES[i];
  const u = f - g.t;
  let env = 1;
  if (u < GLANCE_RISE) env = smooth(u / GLANCE_RISE);
  else if (u > GLANCE_RISE + g.hold) env = 1 - smooth((u - GLANCE_RISE - g.hold) / GLANCE_FALL);
  const side = g.toTulsi ? 1 : look !== 0 ? Math.sign(look) : g.side;
  return side * g.deg * env;
};

const SH_ABS_FRONT: V = { x: PIVOT.x + SH_FRONT.x, y: PIVOT.y + SH_FRONT.y };
const SH_ABS_BACK: V = { x: PIVOT.x + SH_BACK.x, y: PIVOT.y + SH_BACK.y };

/**
 * Resting wrist target: swung about the shoulder (up to about 2 degrees, about 2 px at the wrist),
 * plus a fidget nudge of up to 1 px.
 */
const restTarget = (rest: V, shoulder: V, swing: number, fidget: number): V => {
  const a = 0.035 * swing;
  const vx = rest.x - shoulder.x;
  const vy = rest.y - shoulder.y;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return {
    x: shoulder.x + vx * ca - vy * sa + 0.8 * fidget,
    y: shoulder.y + vx * sa + vy * ca + 0.5 * fidget,
  };
};

/** Finger direction on the knee, tilted by up to about 4 degrees. */
const fidgetDir = (dir: V, fidget: number): V => {
  const a = 0.07 * fidget;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return unit(dir.x * ca - dir.y * sa, dir.x * sa + dir.y * ca);
};

/* ------------------------------------------------------------------ */
/* Shared Hand (MOT-19): shapes and wrist turns                         */
/* ------------------------------------------------------------------ */

/** Default wrist turn of each Hand preset (mirrors Hand.tsx), used when a pose sets a shape but no turn. */
const SHAPE_TURN: Record<HandShape, number> = {
  relaxed: -2.3,
  open: 0,
  point: -2.0,
  fist: -2.2,
  hold: -1.85,
  pranam: 2.0,
  abhaya: 0,
  cup: 0.15,
};
/** Resting hand over the knee: back of the hand up, seen three-quarter, thumb toward the body and the camera. */
const REST_TURN = -2.35;
/** Finger curl at which each shape is drawn as authored: Solve.curl above or below it becomes Hand's `flex`. */
const SHAPE_CURL: Record<HandShape, [number, number]> = {
  // [curl at flex 0, flex per unit of curl]
  relaxed: [0.3, 13],
  open: [0.07, 6],
  point: [0.3, 0],
  fist: [1, 0],
  hold: [0.62, 4],
  pranam: [0.03, 4],
  abhaya: [0.07, 6],
  cup: [0.45, 6],
};
/** Hand while reaching, gripping and letting go: open with straight fingers, hooked round a held stem, or relaxed. */
const workShape = (curl: number, holding: boolean): HandShape => (holding ? "hold" : curl < 0.17 ? "open" : "relaxed");

/** Wrap an angle to (-PI, PI]. */
const wrapA = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
/** Blend two wrist turns along the shorter arc. */
const lerpA = (a: number, b: number, t: number) => a + wrapA(b - a) * t;

/** Both hands resting: wrists swing and fingers fidget, with the near hand at `frontBase`. */
const restHands = (
  f: number,
  frontBase: V,
): Pick<Solve, "front" | "back" | "frontDir" | "backDir" | "spread" | "curl" | "curlB" | "shapeF" | "shapeB" | "turnF" | "turnB"> => {
  const fF = trackAt(FIDGET_F_TRACK, f);
  const fB = trackAt(FIDGET_B_TRACK, f);
  return {
    front: restTarget(frontBase, SH_ABS_FRONT, trackAt(SWING_F_TRACK, f), fF),
    back: restTarget(KNEE_REST_BACK, SH_ABS_BACK, trackAt(SWING_B_TRACK, f), fB),
    frontDir: fidgetDir(KNEE_DIR_FRONT, fF),
    backDir: fidgetDir(KNEE_DIR_BACK, fB),
    spread: 1 - 0.12 * Math.abs(fF),
    // Relaxed fingers draped over the knee; a fidget briefly opens them.
    curl: clamp(0.24 + 0.26 * trackAt(CURL_F_TRACK, f) - 0.12 * Math.abs(fF), 0.05, 0.6),
    curlB: clamp(0.26 + 0.24 * trackAt(CURL_B_TRACK, f) - 0.1 * Math.abs(fB), 0.05, 0.6),
    shapeF: "relaxed",
    shapeB: "relaxed",
    turnF: REST_TURN + 0.08 * fF,
    turnB: REST_TURN + 0.08 * fB,
  };
};

/**
 * Two-bone IK. `side` picks the elbow bend: +1 bends to the +x side, -1 to the -x side.
 * Upper arm and forearm lengths differ (upper is about 1.1 times the forearm).
 */
const ik = (S: V, T: V, side: number): { E: V; H: V } => {
  let dx = T.x - S.x;
  let dy = T.y - S.y;
  let d = Math.hypot(dx, dy);
  const minD = Math.abs(UPPER - FORE) + 0.5;
  const maxD = UPPER + FORE - 0.5;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  if (d < minD) {
    const k = d < 0.01 ? 0 : minD / d;
    dx = d < 0.01 ? 0 : dx * k;
    dy = d < 0.01 ? minD : dy * k;
    d = minD;
  }
  const ux = dx / d;
  const uy = dy / d;
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(UPPER * UPPER - a * a, 0));
  const bx = S.x + ux * a;
  const by = S.y + uy * a;
  const c1 = { x: bx - uy * h, y: by + ux * h };
  const c2 = { x: bx + uy * h, y: by - ux * h };
  const E = side * c1.x >= side * c2.x ? c1 : c2;
  return { E, H: { x: S.x + dx, y: S.y + dy } };
};

/* ------------------------------------------------------------------ */
/* Episode 4: kneeling, reaching and holding objects                    */
/* ------------------------------------------------------------------ */

const addV = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const subV = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const rotV = (v: V, deg: number): V => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

/** How far the hips rise for a seat value: a little onto the heels, about 28 units up on the knees. */
const kneelLift = (k: number): number => 4 * smooth(clamp(k, 0, 1)) + 28 * smooth(clamp(k - 1, 0, 1));
/** Torso height used by the forward-bend foreshortening (shoulder line to the pivot). */
const BEND_H = 106;

/**
 * Where a body point (relative to PIVOT, as TORSO_REL) sits for a lean (deg), hip lift and forward bend, without
 * breath or sway: the same mapping as the component's mkUp.
 */
const bodyPoint = (rel: V, leanDeg: number, lift: number, drop: number): V => {
  const th = (leanDeg * Math.PI) / 180;
  const ry = rel.y * (1 - drop / BEND_H);
  return {
    x: PIVOT.x + rel.x * Math.cos(th) - ry * Math.sin(th),
    y: PIVOT.y - lift + rel.x * Math.sin(th) + ry * Math.cos(th),
  };
};

/** Comfortable reach of a wrist from its shoulder (IK maximum is UPPER + FORE - 0.5 = 98.5). */
const REACH_OK = 93;

/**
 * The least lean and forward bend that bring both wrists (`wF`, `wB`, figure units) within reach. Searched on a
 * fixed grid, so it is a pure function of its inputs (steady while the target is steady).
 */
const reachFit = (wF: V, wB: V | null, lift: number, minLean: number, maxLean: number, maxDrop: number): { lean: number; drop: number } => {
  let best = { lean: maxLean, drop: maxDrop, cost: Infinity, miss: Infinity };
  for (let lean = minLean; lean <= maxLean + 1e-6; lean += 2) {
    for (let drop = 0; drop <= maxDrop + 1e-6; drop += 4) {
      const sF = bodyPoint(SH_FRONT, lean, lift, drop);
      const sB = bodyPoint(SH_BACK, lean, lift, drop);
      const mF = Math.hypot(wF.x - sF.x, wF.y - sF.y) - REACH_OK;
      const mB = wB ? Math.hypot(wB.x - sB.x, wB.y - sB.y) - REACH_OK : -1;
      const miss = Math.max(mF, mB, 0);
      const cost = lean + 0.7 * drop;
      if (miss < best.miss - 1e-6 || (miss <= best.miss + 1e-6 && cost < best.cost)) best = { lean, drop, cost, miss };
    }
  }
  return { lean: best.lean, drop: best.drop };
};

interface GripSpec {
  /** Half width at the grip: the wrists sit just outside it. */
  hw: number;
  /** Grip height (object units, y down from the object's origin). */
  gy: number;
  /** From the origin down to the bottom of the object (it stands on a surface at y + bottom). */
  bottom: number;
  shape: HandShape;
  curl: number;
  /** Drawing scale of the object (its art is authored small; hw, gy and bottom below are already scaled). */
  k: number;
}
const gripOf = (k: number, hw: number, gy: number, bottom: number, shape: HandShape, curl: number): GripSpec => ({
  hw: hw * k,
  gy: gy * k,
  bottom: bottom * k,
  shape,
  curl,
  k,
});
/**
 * Drawing scale of the big stone bowl (the shared stoneBowlArt of VedicHouseDay, the same bowl as the set's StoneBowl):
 * about 70 figure units across the rim (wider than his head) and 38 tall, so a five-year-old needs both hands.
 */
const STONE_BOWL_K = 1.45;
/** Grip of each object: hands on both sides, palms toward it, thumbs toward the camera (MOT-19). */
const GRIP: Record<HeldObject, GripSpec> = {
  clayLump: gripOf(1.35, 8.5, 1, 8.5, "cup", 0.55),
  clayShiva: gripOf(1.3, 12, 4, 9.5, "cup", 0.5),
  doll: gripOf(1.2, 9.5, 2, 21, "hold", 0.62),
  gobinda: gripOf(1.15, 12.5, 23, 28.5, "cup", 0.16),
  incense: gripOf(1.3, 10.5, 2, 10, "hold", 0.62),
  // the big stone bowl: wrists on its sides just under the thick rim, fingers round the carved belly
  stoneBowl: gripOf(STONE_BOWL_K, 23.6, 7.4, STONE_BOWL_UNITS.bottom, "cup", 0.55),
};
/** Grip used to size the hands when nothing is named. */
const GRIP_DEFAULT: GripSpec = gripOf(1, 13, 2, 10, "cup", 0.5);
/** Side view, thumb edge toward the camera: the near palm faces -x, the far palm +x (both toward the object). */
const GRIP_TURN = -1.62;

type HandSet = Pick<
  Solve,
  "front" | "back" | "frontDir" | "backDir" | "spread" | "curl" | "curlB" | "shapeF" | "shapeB" | "turnF" | "turnB"
> & { ofsF: V; ofsB: V };

/**
 * Both hands on an object at O (rotated rot degrees). `under` 0 = wrists just outside its sides, fingers wrapping
 * down and in (thumbs to the camera); 1 = cupped under it, palms up against its lower flanks, fingers rising up
 * its sides (used once the bowl is lifted, so the far forearm stays below his chin while he drinks).
 */
const gripSet = (kind: HeldObject | undefined, O: V, rot: number, under = 0): HandSet =>
  gripSetSpec(kind ? GRIP[kind] : GRIP_DEFAULT, O, rot, under);
/** gripSet for any grip spec (Episode 6: the ball and the note). */
const gripSetSpec = (g: GripSpec, O: V, rot: number, under = 0): HandSet => {
  const u = clamp(under, 0, 1);
  const sF: V = { x: g.hw + 2.5, y: g.gy - 8 };
  const sB: V = { x: -(g.hw + 2.5), y: g.gy - 8 };
  const uF: V = { x: g.hw * 0.62, y: g.bottom + 2 };
  const uB: V = { x: -g.hw * 0.62, y: g.bottom + 2 };
  const ofsF = rotV(u > 0 ? lerpV(sF, uF, u) : sF, rot);
  const ofsB = rotV(u > 0 ? lerpV(sB, uB, u) : sB, rot);
  const dF = u > 0 ? unit(lerp(-0.42, 0.42, u), lerp(0.91, -0.91, u)) : unit(-0.42, 0.91);
  const dB = u > 0 ? unit(lerp(0.42, -0.42, u), lerp(0.91, -0.91, u)) : unit(0.42, 0.91);
  const turn = u > 0 ? lerpA(GRIP_TURN, -GRIP_TURN, u) : GRIP_TURN;
  return {
    front: addV(O, ofsF),
    back: addV(O, ofsB),
    frontDir: rotV(dF, rot),
    backDir: rotV(dB, rot),
    spread: 0.5,
    curl: g.curl,
    curlB: g.curl,
    shapeF: g.shape,
    shapeB: g.shape,
    turnF: turn,
    turnB: turn,
    ofsF,
    ofsB,
  };
};

/** Lap surface height (figure units) for a seat value: the top of the thighs, rising with the hips. */
const lapTop = (k: number): number => lerp(-66, -58, smooth(clamp(k, 0, 1))) - kneelLift(k);

/** Hands resting on the thighs when kneeling (k = seat), instead of on the cross-legged knees. */
const kneelRestFront = (k: number): V => ({ x: lerp(30, 22, smooth(clamp(k - 1, 0, 1))), y: -44 - 0.75 * kneelLift(k) });
const kneelRestBack = (k: number): V => ({ x: lerp(-12, -14, smooth(clamp(k - 1, 0, 1))), y: -46 - 0.75 * kneelLift(k) });
const KNEEL_DIR_FRONT = unit(0.32, 1);
const KNEEL_DIR_BACK = unit(0.12, 1);

/**
 * Timeline of kneelReach (frames from poseStart): he rises (0 to 14), bends forward while the hands travel out
 * (4 to 22) and close on the object (20 to 26). From `grip` on the object is in his hands: set `holding`.
 */
export const KNEEL_REACH_T = { rise: 14, reach: 22, grip: 26 };

/**
 * Timeline of drinkBowl (frames from poseStart): reach to the bowl on the floor (0 to 10), grip (10 to 13), lift
 * it to his mouth (13 to 25), drink it all in one long draught (25 to 45: the bowl tips, his head goes back, the
 * water runs out), lower it to the same place (45 to 57), let go (57 to 61) and bring the hands back to his lap
 * (61 to 73). The bowl is drawn by the rig through the whole pose; from `release` on it stands where it began.
 */
export const DRINK_BOWL_T = { reach: 10, grip: 13, lift: 25, drinkEnd: 45, lower: 57, release: 61, back: 73 };
/**
 * Where drinkBowl finds the big stone bowl by default (its origin, figure units): in front of his near knee, its foot
 * on the floor (y + HELD_OBJECT_BOTTOM.stoneBowl is about 1). A scene that draws the bowl there before and after the
 * drink places HeldObjectArt "stoneBowl" at x + DRINK_BOWL_AT.x * s, y + DRINK_BOWL_AT.y * s (mirror x when flipped).
 */
export const DRINK_BOWL_AT = { x: 86, y: -28 } as const;

/** Water left in the bowl at drinkBowl time t (frames from poseStart): full until he drinks, then it runs out. */
export const drinkBowlFill = (t: number): number => 1 - smooth((t - DRINK_BOWL_T.lift - 1) / (DRINK_BOWL_T.drinkEnd - DRINK_BOWL_T.lift - 4));

/** Toss timeline (frames from poseStart): the hand rises (0 to 7), flicks back over the shoulder (6 to 12), returns (16 to 30). */
export const TOSS_T = { up: 7, flick: 12, back: 30 };

/**
 * Two-bone IK as `ik`, but the elbow is chosen by side and height: score = side * x + down * y, so with `down`
 * about 1 the elbow stays below a forward reach instead of flipping up (Episode 4 offering and gestures).
 */
const ikPref = (S: V, T: V, side: number, down: number): { E: V; H: V } => {
  const a = ik(S, T, side);
  const b = ik(S, T, -side);
  const sa = side * a.E.x + down * a.E.y;
  const sb = side * b.E.x + down * b.E.y;
  return sa >= sb ? a : b;
};

/** Episode 6 poses (solveEp6). */
const EP6_POSES = new Set<SeatedPose>(["takeBall", "treasurer", "takeNote", "handOnHead"]);

const EP4_POSES = new Set<SeatedPose>(["kneelReach", "holdInLap", "holdToChest", "offerUp", "drinkBowl", "pointIn", "rollClay", "toss"]);

/**
 * Pose solver: lean, head angle, eyes and hand targets for each pose at frame f. The Episode 3 poses go to
 * solveCore unchanged; kneeling only moves their resting hands onto the thighs; the Episode 4 poses go to solveEp4.
 */
function solve(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts): Solve {
  const res = solveAny(pose, f, breath, poseStart, opts);
  const r2 = opts.plateRest ? plateRestHands(res) : res;
  return opts.palmUp !== undefined && opts.palmUp > 0 ? palmUpHand(r2, opts.palmUp) : r2;
}

/** Episode 5: the near hand turned palm up by `p` (0..1), fingers relaxed and soft (a hand held passively). */
const PALM_UP_DIR = unit(0.85, 0.52);
const palmUpHand = (res: Solve, p: number): Solve => ({
  ...res,
  frontDir: unit(lerp(res.frontDir.x, PALM_UP_DIR.x, p), lerp(res.frontDir.y, PALM_UP_DIR.y, p)),
  turnF: lerpA(res.turnF ?? REST_TURN, 0.15, p),
  curl: lerp(res.curl ?? 0.3, 0.22, p),
  shapeF: p > 0.5 ? "relaxed" : (res.shapeF ?? "relaxed"),
});

/**
 * BAL-26 plate design: a resting hand lies loosely in the lap with the other (plate 01) instead of on the knee. Any
 * hand target at (or near) the knee rest moves to the lap, keeping a share of its idle swing and fidget; a hand that
 * works away from the knee fades back to the pose's own target, so actions start from the lap smoothly.
 */
const PLATE_LAP_FRONT: V = { x: 12, y: -55 };
const PLATE_LAP_BACK: V = { x: -5, y: -54 };
const PLATE_LAP_DIR_F = unit(-0.5, 1);
const PLATE_LAP_DIR_B = unit(0.55, 1);
const plateRestHands = (res: Solve): Solve => {
  const move = (p: V, rest: V, lap: V) => {
    const d = Math.hypot(p.x - rest.x, p.y - rest.y);
    const w = 1 - smooth((d - 5) / 16);
    return { w, p: lerpV(p, { x: lap.x + 0.4 * (p.x - rest.x), y: lap.y + 0.4 * (p.y - rest.y) }, w) };
  };
  const F = move(res.front, KNEE_REST_FRONT, PLATE_LAP_FRONT);
  const B = move(res.back, KNEE_REST_BACK, PLATE_LAP_BACK);
  if (F.w <= 0 && B.w <= 0) return res;
  return {
    ...res,
    front: F.p,
    back: B.p,
    frontDir: unit(lerp(res.frontDir.x, PLATE_LAP_DIR_F.x, F.w), lerp(res.frontDir.y, PLATE_LAP_DIR_F.y, F.w)),
    backDir: unit(lerp(res.backDir.x, PLATE_LAP_DIR_B.x, B.w), lerp(res.backDir.y, PLATE_LAP_DIR_B.y, B.w)),
  };
};

function solveAny(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts): Solve {
  const seat = clamp(opts.seat ?? 0, 0, 2);
  const p: SeatedPose = (pose === "sitCross" || pose === "idle") && opts.holding ? "holdInLap" : pose;
  if (p === "playPebbles" || p === "strokeCow" || p === "handsTo") return solveEp5(p, f, breath, poseStart, opts, seat);
  if (p === "takeBall" || p === "treasurer" || p === "takeNote" || p === "handOnHead") return solveEp6(p, f, breath, poseStart, opts, seat);
  if (EP4_POSES.has(p)) return solveEp4(p, f, breath, poseStart, opts, seat);
  const res = solveCore(pose, f, breath, poseStart, opts);
  if (seat > 0) {
    const kw = smooth(clamp(seat, 0, 1));
    if (pose === "sitCross" || pose === "idle" || pose === "lookUp") {
      const dF = subV(kneelRestFront(seat), KNEE_REST_FRONT);
      const dB = subV(kneelRestBack(seat), KNEE_REST_BACK);
      res.front = { x: res.front.x + kw * dF.x, y: res.front.y + kw * dF.y };
      res.back = { x: res.back.x + kw * dB.x, y: res.back.y + kw * dB.y };
      res.frontDir = unit(lerp(res.frontDir.x, KNEEL_DIR_FRONT.x, kw), lerp(res.frontDir.y, KNEEL_DIR_FRONT.y, kw));
      res.backDir = unit(lerp(res.backDir.x, KNEEL_DIR_BACK.x, kw), lerp(res.backDir.y, KNEEL_DIR_BACK.y, kw));
    }
    res.kneel = seat;
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Episode 5: playPebbles, strokeCow (and the headShake gesture)        */
/* ------------------------------------------------------------------ */

/**
 * playPebbles clock (frames from poseStart). Each cycle: the near hand reaches to the little pile (0 to 14), pinches a
 * pebble (14 to 18, picked at `grip`), carries it in a small arc to the next slot of the row (18 to 34), sets it down
 * and lets go (34 to `release`), and comes back over the pile (40 to 60). After `count` cycles the hand goes back to
 * the knee and rests.
 */
export const PEBBLES_T = { cycle: 60, grip: 16, place: 34, release: 38, count: 5 } as const;
/** The pile of pebbles on the ground (figure units, before flip), and the row slots he lays them in. */
export const PEBBLE_PILE: { x: number; y: number } = { x: 116, y: -3 };
export const pebbleSlot = (i: number): { x: number; y: number } => ({ x: 62 + 9.6 * i, y: -2.8 + (i % 2 ? 0.5 : 0) });
/** How many pebbles lie in the row at playPebbles frame t (from poseStart), and whether one is in his fingers. */
export const pebblesAt = (t: number): { placed: number; carrying: boolean; inPile: number } => {
  const T = PEBBLES_T;
  if (t < T.grip) return { placed: 0, carrying: false, inPile: T.count + 1 };
  const c = Math.floor(t / T.cycle);
  const u = t - c * T.cycle;
  const placed = Math.min(T.count, c + (u >= T.release ? 1 : 0));
  const carrying = c < T.count && u >= T.grip && u < T.release;
  const picked = Math.min(T.count, c + (u >= T.grip ? 1 : 0));
  return { placed, carrying, inPile: T.count + 1 - picked };
};
const PEBBLE_COL = ["#9a9086", "#b3a796", "#8a8178", "#a69c8f", "#968a7c", "#bdb3a4"];
const pebbleEl = (x: number, y: number, i: number, key: string): React.ReactElement => {
  const rx = 3.8 + 0.35 * ((i * 7) % 3);
  const ry = 2.7 + 0.2 * ((i * 5) % 3);
  return (
    <g key={key}>
      <ellipse cx={x + 0.6} cy={y + ry * 0.75} rx={rx * 1.05} ry={ry * 0.45} fill="#3a2a1c" opacity={0.25} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={PEBBLE_COL[i % PEBBLE_COL.length]} />
      <ellipse cx={x - rx * 0.3} cy={y - ry * 0.35} rx={rx * 0.42} ry={ry * 0.3} fill="#ffffff" opacity={0.3} />
    </g>
  );
};
/**
 * The pebbles on the ground for playPebbles (the pile and the row laid so far), in the rig's own frame: pass the same
 * x, y, s and flip as the SeatedChild, and t = frames since the playPebbles poseStart (keep counting after the pose
 * ends, or pass a large t, so the row stays). Draw it BEFORE the SeatedChild (the hand reaches over it). The pebble in
 * his fingers is drawn by the rig.
 */
export const PebblesArt: React.FC<{ x: number; y: number; s?: number; flip?: boolean; t: number }> = ({ x, y, s = 1, flip = false, t }) => {
  const st = pebblesAt(t);
  const pile: Array<[number, number]> = [
    [0, 0],
    [5.4, 0.6],
    [2.6, -2.6],
    [-4.8, 0.8],
    [8.6, -0.6],
    [-1.8, -4.6],
  ];
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(flip ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>
      {pile.slice(0, st.inPile).map(([dx, dy], i) => pebbleEl(PEBBLE_PILE.x + dx, PEBBLE_PILE.y + dy, i, `p${i}`))}
      {Array.from({ length: st.placed }, (_, i) => {
        const p = pebbleSlot(i);
        return pebbleEl(p.x, p.y, i + 2, `r${i}`);
      })}
    </g>
  );
};

/** strokeCow clock: the palm rises toward the muzzle (0 to `raise`), waits a breath short of it, touches at `touch`, then strokes. */
export const STROKE_COW_T = { raise: 20, touch: 32, stroke: 44 } as const;
/** Default muzzle point (figure units, before flip) when the scene passes no strokeAt. */
export const STROKE_COW_AT = { x: 112, y: -112 } as const;

/**
 * Head shake (a slow, small, compassionate "no", about 1.8 s): 0 before `start`, then two and a half soft swings that
 * fade out. Returns -1..1 (the rig turns the features and tilts the head a little with it).
 */
export const HEAD_SHAKE_LEN = 44;
export const headShakeCurve = (t: number): number => {
  if (t <= 0 || t >= HEAD_SHAKE_LEN) return 0;
  const u = t / HEAD_SHAKE_LEN;
  const env = smooth(t / 6) * (1 - smooth((u - 0.55) / 0.45));
  return Math.sin(u * 2.5 * 2 * Math.PI) * env;
};

/** Episode 5 poses. */
function solveEp5(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts, seat: number): Solve {
  const fl = f + (opts.lifeOff ?? 0);
  const idleLean = 3 + 0.8 * wob(fl, 3.1);
  const t = f - poseStart;
  const lift = kneelLift(seat);
  const r = restHands(fl, KNEE_REST_FRONT);
  if (pose === "handsTo") {
    // Each given hand's palm centre goes to its target (two-bone IK), travelling over the first 14 frames (the
    // forearm and fingers overlap only then); on target the forearm is rigid, so the hand stays on it every frame.
    const T = opts.handTargets ?? {};
    const travel = smooth(t / 14);
    const shapeOf = (k?: SeatedHandShape): { shape: HandShape; curl: number } =>
      k === "cup" ? { shape: "cup", curl: 0.45 } : k === "grip" ? { shape: "hold", curl: 0.62 } : { shape: "open", curl: 0.08 };
    // The wrist sits back from the palm centre along the hand; the hand points from the shoulder toward the target,
    // turned down toward the ground the lower the target is.
    const handFor = (tg: V, sh: V): { w: V; d: V } => {
      const dd = unit(tg.x - sh.x, tg.y - sh.y);
      const down = clamp((tg.y + 60) / 50, 0, 1);
      const d = unit(lerp(dd.x, 0.25 * Math.sign(dd.x || 1), 0.5 * down), lerp(dd.y, 1, 0.5 * down));
      return { w: { x: tg.x - d.x * PALM_OFS, y: tg.y - d.y * PALM_OFS }, d };
    };
    const shF0 = { x: PIVOT.x + SH_FRONT.x, y: PIVOT.y + SH_FRONT.y - lift };
    const shB0 = { x: PIVOT.x + SH_BACK.x, y: PIVOT.y + SH_BACK.y - lift };
    const hF = T.near ? handFor(T.near, shF0) : null;
    const hB = T.far ? handFor(T.far, shB0) : null;
    // Lean and forward bend: the least that brings each targeted wrist within reach (grid search, pure).
    let best = { lean: idleLean, drop: 0, miss: Infinity, cost: Infinity };
    for (let lean = Math.round(idleLean); lean <= 38; lean += 2) {
      for (let drop = 0; drop <= 24; drop += 4) {
        const sF = bodyPoint(SH_FRONT, lean, lift, drop);
        const sB = bodyPoint(SH_BACK, lean, lift, drop);
        const mF = hF ? Math.hypot(hF.w.x - sF.x, hF.w.y - sF.y) - REACH_OK : -1;
        const mB = hB ? Math.hypot(hB.w.x - sB.x, hB.w.y - sB.y) - REACH_OK : -1;
        const miss = Math.max(mF, mB, 0);
        const cost = lean + 0.7 * drop;
        if (miss < best.miss - 1e-6 || (miss <= best.miss + 1e-6 && cost < best.cost)) best = { lean, drop, miss, cost };
      }
    }
    const lean = lerp(idleLean, Math.max(idleLean, best.lean), travel);
    const drop = best.drop * travel;
    const sF = shapeOf(opts.handShapes?.near);
    const sB = shapeOf(opts.handShapes?.far);
    const tgs = [T.near, T.far].filter((q): q is V => !!q);
    const gaze = tgs.length ? { x: tgs.reduce((a, q) => a + q.x, 0) / tgs.length, y: tgs.reduce((a, q) => a + q.y, 0) / tgs.length } : undefined;
    const low = gaze ? clamp((gaze.y + 90) / 70, 0, 1) : 0;
    return {
      lean,
      drop,
      headTilt: -0.4 * lean + 7 * low * travel + 1.2 * wob(f, 6.6),
      eyeUp: 0,
      eyeDown: 0.5 * low * travel,
      front: hF ? lerpV(r.front, hF.w, travel) : r.front,
      back: hB ? lerpV(r.back, hB.w, travel) : r.back,
      frontDir: hF ? unit(lerp(r.frontDir.x, hF.d.x, travel), lerp(r.frontDir.y, hF.d.y, travel)) : r.frontDir,
      backDir: hB ? unit(lerp(r.backDir.x, hB.d.x, travel), lerp(r.backDir.y, hB.d.y, travel)) : r.backDir,
      spread: 1,
      curl: hF ? lerp(r.curl ?? 0.3, sF.curl, travel) : r.curl,
      curlB: hB ? lerp(r.curlB ?? 0.3, sB.curl, travel) : r.curlB,
      shapeF: hF && travel > 0.5 ? sF.shape : "relaxed",
      shapeB: hB && travel > 0.5 ? sB.shape : "relaxed",
      turnF: hF ? lerpA(r.turnF ?? REST_TURN, opts.handTurns?.near ?? REST_TURN, travel) : r.turnF,
      turnB: hB ? lerpA(r.turnB ?? REST_TURN, opts.handTurns?.far ?? REST_TURN, travel) : r.turnB,
      gazeAt: gaze,
      gazeW: gaze ? 0.85 * travel : 0,
      rigid: hF || hB ? travel : undefined,
      // A far hand working in front of the body is drawn in front of the chest (as the joined palms are).
      joinW: hB && T.far && T.far.x > -8 ? travel : 0,
      kneel: seat || undefined,
    };
  }
  if (pose === "playPebbles") {
    const T = PEBBLES_T;
    // Wrist targets: the fingertips (wrist + about 20 along DIR_DOWN) reach the pebble on the ground.
    const atGround = (p: V): V => ({ x: p.x - 7, y: p.y - 19 });
    const H: V = { x: 90, y: -36 };
    const c = Math.floor(Math.max(0, t) / T.cycle);
    const u = Math.max(0, t) - c * T.cycle;
    let front: V;
    let reachW: number; // 0 at the knee, 1 working at the ground
    let curl: number;
    let hold = 0;
    let pebble: Prop | undefined;
    if (c >= T.count) {
      const k = smooth((t - T.count * T.cycle) / 18);
      front = lerpV(H, r.front, k);
      reachW = 1 - k;
      curl = lerp(0.3, r.curl ?? 0.3, k);
    } else {
      const pileW = atGround(PEBBLE_PILE);
      const slotW = atGround(pebbleSlot(c));
      // The first cycle starts from the knee; later ones from the hover over the pile.
      const from = c === 0 ? r.front : H;
      if (u < 14) front = lerpV(from, pileW, smooth(u / 14));
      else if (u < 18) front = pileW;
      else if (u < T.place) {
        const s = smooth((u - 18) / (T.place - 18));
        front = { x: lerp(pileW.x, slotW.x, s), y: lerp(pileW.y, slotW.y, s) - 10 * Math.sin(Math.PI * s) };
      } else if (u < 40) front = slotW;
      else front = lerpV(slotW, H, smooth((u - 40) / 20));
      reachW = c === 0 && u < 14 ? smooth(u / 14) : 1;
      hold = smooth((u - 14) / 3) * (1 - smooth((u - T.release + 1) / 3));
      curl = lerp(0.07, 0.55, hold);
      if (u >= T.grip && u < T.release) pebble = { x: front.x, y: front.y, opacity: 1, held: true };
    }
    // A small jiggle of life in the working hand.
    front = { x: front.x + 0.4 * wob(fl, 41.3, 0.8) * reachW, y: front.y + 0.3 * wob(fl, 43.9, 0.8) * reachW };
    const fit = reachFit(front, null, lift, idleLean, 28, 0);
    const lean = lerp(idleLean, fit.lean, reachW) + 1.5 * reachW;
    return {
      lean,
      headTilt: -0.4 * lean + 6 * reachW + 1.2 * wob(f, 6.6),
      eyeUp: 0,
      eyeDown: 0.55 * reachW,
      front,
      back: r.back,
      frontDir: unit(lerp(r.frontDir.x, DIR_DOWN.x, reachW), lerp(r.frontDir.y, DIR_DOWN.y, reachW)),
      backDir: r.backDir,
      spread: 1,
      curl,
      curlB: r.curlB,
      shapeF: reachW < 0.3 ? "relaxed" : hold > 0.5 ? "hold" : curl < 0.17 ? "open" : "relaxed",
      shapeB: "relaxed",
      turnF: REST_TURN,
      turnB: r.turnB,
      gazeAt: pebble ? { x: front.x + 6, y: front.y + 17 } : { x: front.x + 6, y: Math.min(-3, front.y + 20) },
      gazeW: 0.85 * reachW,
      pebble,
      kneel: seat || undefined,
    };
  }
  // strokeCow: palm raised to the cow's lowered muzzle at strokeAt (it moves; the hand follows it every frame),
  // then slow strokes along her face and neck (strokeDir), keeping contact.
  const T = STROKE_COW_T;
  const M = opts.strokeAt ?? STROKE_COW_AT;
  const sd = opts.strokeDir ? unit(opts.strokeDir.x, opts.strokeDir.y) : unit(1, -0.35);
  const dir = unit(0.55, -0.84); // fingers up and forward, palm toward the cow
  const palmAt = (p: V): V => ({ x: p.x - dir.x * 12, y: p.y - dir.y * 12 });
  const raise = smooth(t / T.raise);
  const touch = smooth((t - T.raise) / (T.touch - T.raise));
  const ts = Math.max(0, t - T.touch);
  const strokeS = t > T.touch ? 0.5 - 0.5 * Math.cos((2 * Math.PI * ts) / T.stroke) : 0;
  const amp = 16 * smooth(ts / 10);
  // Short of the muzzle by 6 units until the touch, then on it; the stroke slides along strokeDir.
  const onFace: V = { x: M.x - 6 * (1 - touch) * sd.x + sd.x * amp * strokeS, y: M.y - 6 * (1 - touch) * sd.y + sd.y * amp * strokeS };
  const W = palmAt(onFace);
  const front = lerpV(r.front, W, raise);
  const fit = reachFit(W, null, lift, idleLean, 22, 0);
  const lean = lerp(idleLean, fit.lean, raise) + 0.6 * wob(fl, 5.3, 0.5);
  return {
    lean,
    headTilt: lerp(0, clamp((M.y + 150 + lift) * 0.08, -8, 10), raise) + 1.2 * wob(f, 7.1),
    eyeUp: 0,
    eyeDown: 0.15 * raise,
    front,
    back: r.back,
    frontDir: unit(lerp(r.frontDir.x, dir.x, raise), lerp(r.frontDir.y, dir.y, raise)),
    backDir: r.backDir,
    spread: 1,
    curl: lerp(r.curl ?? 0.3, 0.1 + 0.05 * strokeS, raise),
    curlB: r.curlB,
    shapeF: raise > 0.5 ? "open" : "relaxed",
    shapeB: "relaxed",
    turnF: lerpA(REST_TURN, 1.15, raise),
    turnB: r.turnB,
    gazeAt: M,
    gazeW: 0.9 * raise,
    turn: 0.7 * raise,
    elbowDown: 1,
    kneel: seat || undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Episode 6: takeBall, treasurer, takeNote, handOnHead                 */
/* ------------------------------------------------------------------ */

/** The stitched ball's radius in figure units: about 14 cm across at a six-year-old's hand scale (hand about 21 units). */
export const BALL_R = 11.5;
/**
 * takeBall clock (frames from poseStart): both hands come forward and up to the ball at `giveAt` (0 to `reach`, palms
 * up under it), the giver lets go at `take`, and he draws it to his lap (take to `lap`), where he keeps it in both hands.
 */
export const TAKE_BALL_T = { reach: 14, take: 18, lap: 38 } as const;
/** Default giveAt for takeBall: the ball's centre in the giver's hands, in front of him at chest height. */
export const TAKE_BALL_AT = { x: 88, y: -104 } as const;
const BALL_GRIP: GripSpec = gripOf(1, BALL_R, 0, BALL_R, "cup", 0.48);
const BALL_LAP: V = { x: 20, y: lapTop(0) - BALL_R + 3 };

/** The ten-rupee note folded once (figure units): about 11 x 6 cm, small enough to close both hands round. */
export const NOTE_SIZE = { w: 18, h: 10 } as const;
/**
 * takeNote clock (frames from poseStart): both hands come forward, palms up (0 to `reach`), the friend presses the note in
 * (he lets go at `take`), the hands draw it to his chest (take to `chest`) and he looks down at it, troubled. At `fold`
 * (or the `foldAt` prop) his hands close round it over `foldLen` frames, then a small decided nod.
 */
export const TAKE_NOTE_T = { reach: 14, take: 18, chest: 36, fold: 80, foldLen: 12 } as const;
/** Default giveAt for takeNote: the note in the friend's fingers, in front of him at chest height. */
export const TAKE_NOTE_AT = { x: 90, y: -106 } as const;
const NOTE_CHEST: V = { x: 26, y: -96 };

/**
 * treasurer clock (frames from poseStart), per step of `pickPlace`: the near hand goes to the item (0 to 12), pinches it
 * (picked at `grip`), carries it in a small arc to its heap (16 to `place`), sets it down and lets go at `release`, and
 * lifts to hover over that heap (34 to `cycle`). The far hand rests (in the lap in the plate design, on the knee in the classic).
 */
export const TREASURER_T = { cycle: 40, grip: 14, place: 28, release: 31 } as const;
/**
 * The spread gamchha on the ground in front of his knees (figure units, before flip): four corners of a perspective-
 * flattened quad, near edge first. Draw it BEFORE the SeatedChild (his hand reaches over it); it reaches under his feet a
 * little, so draw his seat on top.
 */
export const TREASURY_CLOTH: ReadonlyArray<{ x: number; y: number }> = [
  { x: 46, y: 8 },
  { x: 128, y: 8 },
  { x: 121, y: -10 },
  { x: 52, y: -10 },
];
/** Default pick-and-place steps (ground points on the cloth): the loose things from the middle into three small heaps. */
export const TREASURER_STEPS: ReadonlyArray<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [
  { from: { x: 96, y: 1 }, to: { x: 64, y: -2 } },
  { from: { x: 102, y: 3 }, to: { x: 80, y: 2 } },
  { from: { x: 92, y: -3 }, to: { x: 64, y: -2 } },
  { from: { x: 106, y: -2 }, to: { x: 112, y: -4 } },
];
/**
 * treasurer state at t = f - poseStart for the steps: `picked` items have left their `from` point, `placed` items lie on
 * their heaps, and while `carrying` item `step` is between his fingers (draw it at seatedEp6Anchors().nearPinch, AFTER
 * the SeatedChild, as a pebble in the fingers).
 */
export const treasurerAt = (
  t: number,
  steps: ReadonlyArray<{ from: { x: number; y: number }; to: { x: number; y: number } }> = TREASURER_STEPS,
): { step: number; carrying: boolean; picked: number; placed: number } => {
  const T = TREASURER_T;
  const n = steps.length;
  if (t < T.grip || n === 0) return { step: 0, carrying: false, picked: 0, placed: 0 };
  const c = Math.floor(t / T.cycle);
  const u = t - c * T.cycle;
  return {
    step: Math.min(c, n - 1),
    carrying: c < n && u >= T.grip && u < T.release,
    picked: Math.min(n, c + (u >= T.grip ? 1 : 0)),
    placed: Math.min(n, c + (u >= T.release ? 1 : 0)),
  };
};

/**
 * handOnHead clock (frames from poseStart): the near hand claps up to the top of his head (0 to `up`, palm flat on the
 * hair, fingers over the crown), stays there, comes off at `off` while both palms open, empty, and are held out a
 * little by `open` ("ওটা কি এখনও আছে নাকি?"). A light comic beat, never a grimace.
 */
export const HAND_ON_HEAD_T = { up: 6, off: 16, open: 28 } as const;

/** 0..1..0 over [0, 1] (a soft bump). */
const bump01 = (u: number): number => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));

/** Episode 6 poses (see the header, "EPISODE 6"). */
function solveEp6(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts, seat: number): Solve {
  const fl = f + (opts.lifeOff ?? 0);
  const idleLean = 3 + 0.8 * wob(fl, 3.1);
  const t = f - poseStart;
  const lift = kneelLift(seat);
  const r0 = restHands(fl, KNEE_REST_FRONT);
  // Plate design: the resting hands lie in the lap (plateRestHands), so every move starts and ends there directly
  // (never via the knees); the lap points keep a share of the idle drift, as plateRestHands does.
  const r = opts.plateRest
    ? {
      ...r0,
      front: { x: PLATE_LAP_FRONT.x + 0.4 * (r0.front.x - KNEE_REST_FRONT.x), y: PLATE_LAP_FRONT.y + 0.4 * (r0.front.y - KNEE_REST_FRONT.y) },
      back: { x: PLATE_LAP_BACK.x + 0.4 * (r0.back.x - KNEE_REST_BACK.x), y: PLATE_LAP_BACK.y + 0.4 * (r0.back.y - KNEE_REST_BACK.y) },
      frontDir: PLATE_LAP_DIR_F,
      backDir: PLATE_LAP_DIR_B,
    }
    : r0;
  const watch = clamp(opts.watchHeld ?? 1, 0, 1);
  /** Hands of a grip set, travelling from rest by w (with a small lift on the way). */
  const fromRest = (hs: HandSet, w: number, arc: number) => ({
    front: { x: lerp(r.front.x, hs.front.x, w), y: lerp(r.front.y, hs.front.y, w) - arc * bump01(w) },
    back: { x: lerp(r.back.x, hs.back.x, w), y: lerp(r.back.y, hs.back.y, w) - arc * bump01(w) },
    frontDir: unit(lerp(r.frontDir.x, hs.frontDir.x, w), lerp(r.frontDir.y, hs.frontDir.y, w)),
    backDir: unit(lerp(r.backDir.x, hs.backDir.x, w), lerp(r.backDir.y, hs.backDir.y, w)),
    turnF: lerpA(r.turnF ?? REST_TURN, hs.turnF ?? REST_TURN, w),
    turnB: lerpA(r.turnB ?? REST_TURN, hs.turnB ?? REST_TURN, w),
  });

  if (pose === "takeBall") {
    const T = TAKE_BALL_T;
    const G = opts.giveAt ?? TAKE_BALL_AT;
    const reach = smooth(t / T.reach);
    const draw = smooth((t - T.take) / (T.lap - T.take));
    const lapB: V = { x: BALL_LAP.x + 0.8 * wob(fl, 14.2, 0.4), y: BALL_LAP.y - lift + 0.4 * wob(fl, 15.9, 0.4) };
    // In the giver's hands until `take`, then drawn to the lap in a soft, happy arc.
    const O: V = { x: lerp(G.x, lapB.x, draw), y: lerp(G.y, lapB.y, draw) - 10 * bump01(draw) };
    const rot = -8 * draw + 2 * wob(fl, 31.3, 0.4) * draw;
    // Palms up under it to receive; round its sides once it is in his lap.
    const hs = gripSetSpec(BALL_GRIP, O, rot, lerp(0.78, 0.2, draw));
    const fit = reachFit(hs.front, hs.back, lift, Math.round(idleLean), 36, 24);
    const lean = lerp(idleLean, Math.max(idleLean, fit.lean), reach) + 3 * draw;
    const m = fromRest(hs, reach, 8);
    return {
      lean,
      drop: fit.drop * reach,
      headTilt: -0.35 * lean + (4 * reach + 6 * draw) * watch + 1.2 * wob(f, 6.6),
      eyeUp: 0,
      eyeDown: (0.15 * reach + 0.3 * draw) * watch,
      ...m,
      spread: 0.5,
      curl: lerp(r.curl ?? 0.3, BALL_GRIP.curl, reach),
      curlB: lerp(r.curlB ?? 0.3, BALL_GRIP.curl, reach),
      shapeF: reach > 0.5 ? "cup" : "relaxed",
      shapeB: reach > 0.5 ? "cup" : "relaxed",
      joinW: reach,
      gazeAt: O,
      gazeW: 0.9 * reach * watch,
      rigid: reach,
      farOverCape: true,
      farArmFront: 1,
      hold6: { kind: "ball", x: O.x, y: O.y, rot, farW: 0.5, ofsF: hs.ofsF, ofsB: hs.ofsB, free: t < T.take, fold: 0 },
      kneel: seat || undefined,
    };
  }

  if (pose === "takeNote") {
    const T = TAKE_NOTE_T;
    const G = opts.giveAt ?? TAKE_NOTE_AT;
    const foldT = (opts.foldAt ?? poseStart + T.fold) - poseStart;
    const reach = smooth(t / T.reach);
    const draw = smooth((t - T.take) / (T.chest - T.take));
    const fold = smooth((t - foldT) / T.foldLen);
    const chest: V = {
      x: NOTE_CHEST.x + 0.6 * wob(fl, 18.3, 0.35) - 4 * fold,
      y: NOTE_CHEST.y - lift - 0.35 * breath + 0.4 * wob(fl, 19.1, 0.35) + 3 * fold,
    };
    const O: V = { x: lerp(G.x, chest.x, draw), y: lerp(G.y, chest.y, draw) - 6 * bump01(draw) };
    // The note tips toward his eyes while he looks at it; it levels as he closes his hands round it.
    const rot = lerp(0, -12, draw) + 9 * fold;
    // Palms up to receive; fingers at its two ends while he looks at it; then both hands cupped round it.
    const hw = lerp(NOTE_SIZE.w / 2 + 0.5, 2.6, fold);
    const spec = gripOf(1, hw, 0, NOTE_SIZE.h / 2, "cup", 0.5);
    const under = t < T.take ? 0.75 : lerp(lerp(0.75, 0.12, draw), 0.85, fold);
    const hs = gripSetSpec(spec, O, rot, under);
    const fit = reachFit(hs.front, hs.back, lift, Math.round(idleLean), 34, 20);
    const lean = lerp(idleLean, Math.max(idleLean, fit.lean), reach * (1 - draw)) + 3 * draw;
    const m = fromRest(hs, reach, 6);
    const holdEnds = draw * (1 - fold);
    // Troubled while he looks at it (gentle brows, the book's "মহা ফ্যাসাদে"); it eases as he decides.
    const worry = 0.8 * smooth((t - T.chest + 6) / 14) * (1 - fold);
    // The decided nod: a small slow dip of the head after the hands close.
    const nod = 4 * bump01((t - foldT - 6) / 16);
    return {
      lean,
      drop: fit.drop * reach * (1 - draw),
      headTilt: -0.35 * lean + (3 * reach + 8 * draw) * watch + nod + 1.2 * wob(f, 6.6),
      eyeUp: 0,
      eyeDown: (0.15 * reach + 0.45 * draw) * watch,
      ...m,
      spread: 0.5,
      curl: lerp(lerp(r.curl ?? 0.3, 0.42, reach), 0.6, holdEnds) + 0.1 * fold,
      curlB: lerp(lerp(r.curlB ?? 0.3, 0.42, reach), 0.6, holdEnds) + 0.1 * fold,
      shapeF: reach < 0.5 ? "relaxed" : holdEnds > 0.5 ? "hold" : "cup",
      shapeB: reach < 0.5 ? "relaxed" : holdEnds > 0.5 ? "hold" : "cup",
      joinW: reach,
      gazeAt: O,
      gazeW: 0.9 * reach * watch,
      rigid: reach,
      farOverCape: true,
      farArmFront: 1,
      worry,
      hold6: { kind: "note", x: O.x, y: O.y, rot, farW: 0.5, ofsF: hs.ofsF, ofsB: hs.ofsB, free: t < T.take, fold },
      kneel: seat || undefined,
    };
  }

  if (pose === "treasurer") {
    const T = TREASURER_T;
    const steps = opts.pickPlace && opts.pickPlace.length ? opts.pickPlace : TREASURER_STEPS;
    const n = steps.length;
    // Wrist targets: the fingertips (wrist + about 20 along DIR_DOWN) reach the ground point; hover a little above it.
    const atGround = (p: V): V => ({ x: p.x - 7, y: p.y - 19 });
    const hover = (p: V): V => ({ x: p.x - 7, y: p.y - 31 });
    const tt = Math.max(0, t);
    const c = Math.floor(tt / T.cycle);
    const u = tt - c * T.cycle;
    let front: V;
    let reachW: number;
    let hold = 0;
    if (c >= n) {
      const k = smooth((tt - n * T.cycle) / 18);
      front = lerpV(hover(steps[n - 1].to), r.front, k);
      reachW = 1 - k;
    } else {
      const fromW = atGround(steps[c].from);
      const toW = atGround(steps[c].to);
      const start = c === 0 ? r.front : hover(steps[c - 1].to);
      if (u < 12) {
        const s = smooth(u / 12);
        front = { x: lerp(start.x, fromW.x, s), y: lerp(start.y, fromW.y, s) - (c === 0 ? 10 : 4) * bump01(s) };
      } else if (u < 16) front = fromW;
      else if (u < T.place) {
        const s = smooth((u - 16) / (T.place - 16));
        front = { x: lerp(fromW.x, toW.x, s), y: lerp(fromW.y, toW.y, s) - 9 * bump01(s) };
      } else if (u < 34) front = toW;
      else front = lerpV(toW, hover(steps[c].to), smooth((u - 34) / (T.cycle - 34)));
      reachW = c === 0 && u < 12 ? smooth(u / 12) : 1;
      hold = smooth((u - 12) / 3) * (1 - smooth((u - T.release + 1) / 3));
    }
    // Careful: a very small living jiggle only.
    front = { x: front.x + 0.3 * wob(fl, 41.3, 0.8) * reachW, y: front.y + 0.25 * wob(fl, 43.9, 0.8) * reachW };
    const curl = lerp(lerp(r.curl ?? 0.3, 0.1, reachW), 0.55, hold);
    const fit = reachFit(front, null, lift, Math.round(idleLean), 30, 8);
    const lean = lerp(idleLean, Math.max(idleLean, fit.lean), reachW) + 2 * reachW;
    return {
      lean,
      drop: fit.drop * reachW,
      headTilt: -0.4 * lean + 7 * reachW + 1.2 * wob(f, 6.6),
      eyeUp: 0,
      eyeDown: 0.6 * reachW,
      front,
      back: r.back,
      frontDir: unit(lerp(r.frontDir.x, DIR_DOWN.x, reachW), lerp(r.frontDir.y, DIR_DOWN.y, reachW)),
      backDir: r.backDir,
      spread: 1,
      curl,
      curlB: r.curlB,
      shapeF: reachW < 0.3 ? "relaxed" : hold > 0.5 ? "hold" : curl < 0.17 ? "open" : "relaxed",
      shapeB: "relaxed",
      turnF: REST_TURN,
      turnB: r.turnB,
      gazeAt: { x: front.x + 6, y: Math.min(-2, front.y + 18) },
      gazeW: 0.9 * reachW,
      kneel: seat || undefined,
    };
  }

  // handOnHead
  const T = HAND_ON_HEAD_T;
  const up = smooth(t / T.up);
  const off = smooth((t - T.off) / (T.open - T.off));
  const onHead = up * (1 - off);
  // The slap lands: a quick small dip of the head and shoulders, then it settles.
  const impact = clamp(1 - Math.abs(t - T.up - 1) / 4, 0, 1);
  const lean = idleLean - 1.5 * onHead + 1.2 * impact - 1.5 * off;
  const headTilt = -0.35 * lean + 2.5 * impact + 3 * off + 1.2 * wob(f, 6.6);
  // Top of the hair this frame (the head turns with the expression's playful tilt, about 2.5 degrees, added by the rig).
  const plateHead = opts.headCY !== undefined;
  const hairTop = (plateHead ? PLATE_HAIR_TOP : -41.5) * HEAD_K;
  const hc = bodyPoint({ x: 0, y: opts.headCY ?? HEAD_CY }, lean, lift, 0);
  const rotH = headTilt + 2.5;
  const dHead = unit(rotV({ x: -0.94, y: 0.34 }, rotH).x, rotV({ x: -0.94, y: 0.34 }, rotH).y);
  // Palm centre a little inside the hair's top edge, toward the near (front) side: the hand lies ON the hair.
  const palmHead = addV(hc, rotV({ x: 5, y: hairTop + 7.5 }, rotH));
  const wristHead: V = { x: palmHead.x - dHead.x * PALM_OFS, y: palmHead.y - dHead.y * PALM_OFS };
  // Open palms, empty, held out a little in front of him.
  const dOpenF = unit(0.45, -0.89);
  const dOpenB = unit(0.12, -0.99);
  const palmOpenF: V = { x: 68 + 0.5 * wob(fl, 21.7, 0.6), y: -92 - lift + 0.4 * wob(fl, 23.1, 0.6) };
  const palmOpenB: V = { x: 16 + 0.5 * wob(fl, 25.3, 0.6), y: -104 - lift + 0.4 * wob(fl, 27.9, 0.6) };
  const wOpenF: V = { x: palmOpenF.x - dOpenF.x * PALM_OFS, y: palmOpenF.y - dOpenF.y * PALM_OFS };
  const wOpenB: V = { x: palmOpenB.x - dOpenB.x * PALM_OFS, y: palmOpenB.y - dOpenB.y * PALM_OFS };
  // Near hand: rest -> head (swinging out round the face, never across it) -> open.
  const toHead: V = { x: lerp(r.front.x, wristHead.x, up) + 34 * bump01(up), y: lerp(r.front.y, wristHead.y, up) };
  const front: V = { x: lerp(toHead.x, wOpenF.x, off) + 16 * bump01(off), y: lerp(toHead.y, wOpenF.y, off) };
  const back: V = lerpV(r.back, wOpenB, off);
  const dirTo = unit(lerp(r.frontDir.x, dHead.x, up), lerp(r.frontDir.y, dHead.y, up));
  return {
    lean,
    headTilt,
    eyeUp: 0.45 * onHead,
    eyeDown: 0,
    front,
    back,
    frontDir: unit(lerp(dirTo.x, dOpenF.x, off), lerp(dirTo.y, dOpenF.y, off)),
    backDir: unit(lerp(r.backDir.x, dOpenB.x, off), lerp(r.backDir.y, dOpenB.y, off)),
    spread: 1,
    curl: lerp(lerp(r.curl ?? 0.3, 0.2, up), 0.07, off),
    curlB: lerp(r.curlB ?? 0.3, 0.07, off),
    shapeF: up > 0.5 && off < 0.5 ? "open" : off >= 0.5 ? "open" : "relaxed",
    shapeB: off > 0.5 ? "open" : "relaxed",
    turnF: lerpA(lerpA(r.turnF ?? REST_TURN, -2.0, up), 0.35, off),
    turnB: lerpA(r.turnB ?? REST_TURN, 0.35, off),
    gazeAt: { x: 230, y: -150 },
    gazeW: 0.45 * off,
    joinW: off,
    farOverCape: true,
    farArmFront: off,
    rigid: onHead,
    // Open palms: the near elbow swings down through depth to his side (the forearm rises to the open hand).
    elbowSwingF: off,
    kneel: seat || undefined,
  };
}

/** Episode 4 poses (see the header, "EPISODE 4 POSES"). */
function solveEp4(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts, seat: number): Solve {
  const fl = f + (opts.lifeOff ?? 0);
  const idleLean = 3 + 0.8 * wob(fl, 3.1);
  const bN = clamp(breath, 0, 2.4);
  const t = f - poseStart;
  const kind = opts.holding;
  const watch = clamp(opts.watchHeld ?? 1, 0, 1);
  const lift = kneelLift(seat);
  /** The object's centre when it rests on his lap (its base sinks a little into the cloth). */
  const lapObj = (k: number, xo: number, kd: HeldObject | undefined): V => ({
    x: xo,
    y: lapTop(k) - (kd ? GRIP[kd].bottom : 8) + 4,
  });
  /** Both hands resting: on the knees cross-legged, on the thighs when kneeling. */
  const rest = (k: number) => {
    const r = restHands(fl, KNEE_REST_FRONT);
    const w = smooth(clamp(k, 0, 1));
    if (w <= 0) return r;
    const dF = subV(kneelRestFront(k), KNEE_REST_FRONT);
    const dB = subV(kneelRestBack(k), KNEE_REST_BACK);
    return {
      ...r,
      front: { x: r.front.x + w * dF.x, y: r.front.y + w * dF.y },
      back: { x: r.back.x + w * dB.x, y: r.back.y + w * dB.y },
      frontDir: unit(lerp(r.frontDir.x, KNEEL_DIR_FRONT.x, w), lerp(r.frontDir.y, KNEEL_DIR_FRONT.y, w)),
      backDir: unit(lerp(r.backDir.x, KNEEL_DIR_BACK.x, w), lerp(r.backDir.y, KNEEL_DIR_BACK.y, w)),
    };
  };
  const heldBoth = (hs: HandSet, O: V, rot: number, extra: Partial<HeldPose> = {}): HeldPose | undefined =>
    kind ? { kind, x: O.x, y: O.y, rot, farW: 0.5, ofsF: hs.ofsF, ofsB: hs.ofsB, ...extra } : undefined;
  /** The far hand alone holds the object on his lap (while the near hand gestures), or rests. */
  const farHold = (k: number): Pick<Solve, "back" | "backDir" | "shapeB" | "turnB" | "curlB" | "obj" | "joinW"> => {
    if (!kind) {
      const r = rest(k);
      return { back: r.back, backDir: r.backDir, shapeB: "relaxed", turnB: r.turnB, curlB: r.curlB, joinW: 0 };
    }
    const rot = -6 + 2 * wob(fl, 31.3, 0.4);
    const O = lapObj(k, 4, kind);
    const hs = gripSet(kind, O, rot);
    return {
      back: hs.back,
      backDir: hs.backDir,
      shapeB: hs.shapeB,
      turnB: hs.turnB,
      curlB: hs.curlB,
      joinW: 1,
      obj: { kind, x: O.x, y: O.y, rot, farW: 1, ofsF: hs.ofsF, ofsB: hs.ofsB },
    };
  };

  switch (pose) {
    case "holdInLap": {
      // The object in both hands on his lap, turned gently to the light; he looks at it (watchHeld).
      const O0 = lapObj(seat, 16, kind);
      const rot = 4 * Math.sin(f * 0.035 + 0.5) + 2 * wob(f, 3.7, 0.5);
      const O = { x: O0.x + 1.2 * wob(fl, 14.2, 0.4), y: O0.y + 0.5 * wob(fl, 15.9, 0.4) };
      const hs = gripSet(kind, O, rot);
      return {
        lean: idleLean + 4 * watch,
        headTilt: (7 + 1.5 * wob(f, 5.9)) * watch + 1.5 * (1 - watch) * wob(f, 5.9),
        eyeUp: 0,
        eyeDown: 0.4 * watch,
        ...hs,
        joinW: 1,
        gazeAt: O,
        gazeW: 0.85 * watch,
        obj: heldBoth(hs, O, rot),
        rigid: 1,
        kneel: seat,
      };
    }
    case "holdToChest": {
      // Hugged to the chest in both arms, tipped into the body; it rides on the breath.
      const g = kind ? GRIP[kind] : GRIP_DEFAULT;
      const rot = -7 + 1.5 * wob(fl, 12.7, 0.4);
      const O = { x: 13 + 0.8 * wob(fl, 12.1, 0.4), y: -106 - lift + 0.25 * (g.bottom - 12) - 0.5 * bN };
      const hs = gripSet(kind, O, rot);
      return {
        lean: 2 + 0.8 * wob(fl, 3.1),
        headTilt: (9 + 1.5 * wob(f, 4.1)) * watch,
        eyeUp: 0,
        eyeDown: 0.5 * watch,
        ...hs,
        joinW: 1,
        gazeAt: O,
        gazeW: 0.6 * watch,
        obj: heldBoth(hs, O, rot),
        rigid: 1,
        elbowDown: 1,
        kneel: seat,
      };
    }
    case "offerUp": {
      // Held out in both hands (to Sundar, into the shrine room); he leans and bends as far as he must.
      const base = opts.reachAt ?? { x: 80, y: -122 - lift };
      const O = { x: base.x + 0.8 * wob(fl, 18.3, 0.4), y: base.y + 0.6 * wob(fl, 19.1, 0.4) - 0.3 * bN };
      const rot = -4;
      const hs = gripSet(kind, O, rot);
      const fit = reachFit(hs.front, hs.back, lift, 4, 34, 28);
      return {
        lean: fit.lean + 0.6 * wob(fl, 3.1),
        drop: fit.drop,
        headTilt: clamp((O.y + 150 + lift) / 8, -6, 10) + 1.2 * wob(f, 6.6),
        eyeUp: 0,
        eyeDown: 0.15,
        ...hs,
        joinW: 1,
        gazeAt: O,
        gazeW: 0.6,
        obj: heldBoth(hs, O, rot),
        rigid: 1,
        elbowDown: 1,
        kneel: seat,
      };
    }
    case "kneelReach": {
      // Up off his seat (to `kneel`, at least half up), bending forward while both hands travel out to reachAt.
      const T = KNEEL_REACH_T;
      const kT = seat >= 1 ? seat : 1.5;
      const k = lerp(seat, kT, smooth(t / T.rise));
      const O = opts.reachAt ?? { x: 92, y: -44 };
      const gk = kind ?? opts.reachFor;
      const g = gk ? GRIP[gk] : GRIP_DEFAULT;
      const end = gripSet(gk, O, 0);
      const fit = reachFit(end.front, end.back, kneelLift(kT), 4, 40, 44);
      const w = smooth((t - 4) / (T.reach - 4));
      const bendW = smooth((t - 2) / 16);
      const O0 = lapObj(k, 16, kind);
      const start = kind ? gripSet(kind, O0, 0) : rest(k);
      const arc = -10 * Math.sin(Math.PI * w); // the hands lift a little over the rim on the way
      let curl: number;
      let shapeF: HandShape;
      if (kind) {
        curl = g.curl;
        shapeF = g.shape;
      } else if (opts.reachFor) {
        const close = smooth((t - (T.reach - 2)) / (T.grip - T.reach + 2));
        curl = lerp(lerp(start.curl ?? 0.3, 0.08, w), g.curl, close);
        shapeF = close > 0.5 ? g.shape : workShape(curl, false);
      } else {
        curl = lerp(start.curl ?? 0.3, 0.08, w) + 0.12 * smooth((t - T.grip) / 10);
        shapeF = workShape(curl, false);
      }
      const front = { x: lerp(start.front.x, end.front.x, w), y: lerp(start.front.y, end.front.y, w) + arc };
      const back = { x: lerp(start.back.x, end.back.x, w), y: lerp(start.back.y, end.back.y, w) + arc };
      const objO = { x: lerp(O0.x, O.x, w), y: lerp(O0.y, O.y, w) + arc };
      const lean = lerp(idleLean, fit.lean, bendW);
      return {
        lean,
        drop: fit.drop * bendW,
        headTilt: -0.35 * lean + 14 * w,
        eyeUp: 0,
        eyeDown: 0.55 * w,
        front,
        back,
        frontDir: unit(lerp(start.frontDir.x, end.frontDir.x, w), lerp(start.frontDir.y, end.frontDir.y, w)),
        backDir: unit(lerp(start.backDir.x, end.backDir.x, w), lerp(start.backDir.y, end.backDir.y, w)),
        spread: lerp(start.spread, 0.5, w),
        curl,
        curlB: curl,
        shapeF,
        shapeB: shapeF,
        turnF: lerpA(start.turnF ?? REST_TURN, GRIP_TURN, w),
        turnB: lerpA(start.turnB ?? REST_TURN, GRIP_TURN, w),
        joinW: kind ? 1 : w,
        gazeAt: O,
        gazeW: 0.9 * w,
        obj: kind ? { kind, x: objO.x, y: objO.y, rot: 0, farW: 0.5, ofsF: end.ofsF, ofsB: end.ofsB } : undefined,
        rigid: kind ? 1 : 0.5,
        kneel: k,
      };
    }
    case "drinkBowl": {
      const T = DRINK_BOWL_T;
      const B = opts.reachAt ?? DRINK_BOWL_AT;
      const g = GRIP.stoneBowl;
      const atB = gripSet("stoneBowl", B, 0);
      const fit = reachFit(atB.front, atB.back, lift, 4, 40, 44);
      // Bend: down to the bowl, up with it, down again to set it back, up after.
      const bend =
        t < T.grip
          ? smooth(t / T.reach)
          : t < T.lift
            ? 1 - smooth((t - T.grip) / (T.lift - T.grip))
            : t < T.drinkEnd
              ? 0
              : t < T.release
                ? smooth((t - T.drinkEnd) / (T.lower - T.drinkEnd))
                : 1 - smooth((t - T.release) / (T.back - T.release));
      // Drinking weight: the bowl comes up, the head goes back while he drinks, and both come down again.
      const upW =
        t < T.grip ? 0 : t < T.lift ? smooth((t - T.grip) / (T.lift - T.grip)) : t < T.drinkEnd ? 1 : t < T.lower ? 1 - smooth((t - T.drinkEnd) / (T.lower - T.drinkEnd)) : 0;
      const drinkW =
        t < T.lift ? 0 : t < T.drinkEnd ? smooth((t - T.lift) / (T.drinkEnd - T.lift)) : t < T.lower ? 1 - smooth((t - T.drinkEnd) / ((T.lower - T.drinkEnd) * 0.6)) : 0;
      const tip = 12 * upW + 36 * drinkW;
      // Heavy: he leans back a little against its weight while it is up.
      const lean = lerp(idleLean, fit.lean, bend) - 3 * upW - 3 * drinkW;
      const drop = fit.drop * bend;
      const headTilt = (-0.35 * lean + 14 * bend) * (1 - upW) + upW * (-5 - 11 * drinkW) + 0.8 * wob(f, 4.4);
      // The bowl's near rim at his lips.
      const hc = bodyPoint({ x: 0, y: opts.headCY ?? HEAD_CY }, lean, lift, drop);
      const ml = opts.mouthLocal;
      const mouth = addV(hc, rotV(ml ? { x: ml.x * HEAD_K, y: ml.y * HEAD_K } : { x: 10.3 * HEAD_K, y: 17.5 * HEAD_K }, headTilt));
      const atMouth = addV(subV(mouth, rotV({ x: -21.2 * g.k, y: -6 * g.k }, -tip)), { x: 1.5, y: 0.5 });
      // A faint tremor in the arms while the heavy bowl is up.
      const tremor = { x: 0.35 * wob(f, 3.7, 4.2) * upW, y: 0.5 * wob(f, 8.1, 4.8) * upW };
      let O: V;
      if (t < T.grip) O = B;
      else if (t < T.lift) {
        // the heave: it comes off the floor slowly, then up to his lips
        const u = smooth(Math.pow(clamp((t - T.grip) / (T.lift - T.grip), 0, 1), 1.45));
        O = addV({ x: lerp(B.x, atMouth.x, u), y: lerp(B.y, atMouth.y, u) - 6 * Math.sin(Math.PI * u) }, tremor);
      } else if (t < T.drinkEnd) O = addV(atMouth, tremor);
      else if (t < T.lower) {
        const u = smooth((t - T.drinkEnd) / (T.lower - T.drinkEnd));
        O = addV({ x: lerp(atMouth.x, B.x, u), y: lerp(atMouth.y, B.y, u) - 4 * Math.sin(Math.PI * u) }, tremor);
      } else O = B;
      const rot = -tip;
      // Both hands on it (MOT-07): the near hand stays on its side, sliding only a little under the belly while it is
      // up; the far hand cups the belly from below, so its forearm stays under his chin while he drinks.
      const sideGrip = gripSet("stoneBowl", O, rot, 0.45 * upW);
      const farGrip = gripSet("stoneBowl", O, rot, upW);
      const onBowl: HandSet = { ...sideGrip, back: farGrip.back, backDir: farGrip.backDir, turnB: farGrip.turnB, ofsB: farGrip.ofsB };
      const r = rest(seat);
      let hands: HandSet;
      let curl: number;
      let shape: HandShape;
      if (t < T.reach) {
        const w = smooth(t / T.reach);
        hands = {
          ...atB,
          front: lerpV(r.front, atB.front, w),
          back: lerpV(r.back, atB.back, w),
          frontDir: unit(lerp(r.frontDir.x, atB.frontDir.x, w), lerp(r.frontDir.y, atB.frontDir.y, w)),
          backDir: unit(lerp(r.backDir.x, atB.backDir.x, w), lerp(r.backDir.y, atB.backDir.y, w)),
          turnF: lerpA(r.turnF ?? REST_TURN, GRIP_TURN, w),
          turnB: lerpA(r.turnB ?? REST_TURN, GRIP_TURN, w),
        };
        curl = lerp(r.curl ?? 0.3, 0.08, w);
        shape = workShape(curl, false);
      } else if (t < T.release) {
        hands = onBowl;
        curl = t < T.grip ? lerp(0.08, g.curl, smooth((t - T.reach) / (T.grip - T.reach))) : t < T.lower ? g.curl : lerp(g.curl, 0.08, smooth((t - T.lower) / (T.release - T.lower)));
        shape = curl > 0.3 ? g.shape : "open";
      } else {
        const w = smooth((t - T.release) / (T.back - T.release));
        hands = {
          ...atB,
          front: lerpV(atB.front, r.front, w),
          back: lerpV(atB.back, r.back, w),
          frontDir: unit(lerp(atB.frontDir.x, r.frontDir.x, w), lerp(atB.frontDir.y, r.frontDir.y, w)),
          backDir: unit(lerp(atB.backDir.x, r.backDir.x, w), lerp(atB.backDir.y, r.backDir.y, w)),
          turnF: lerpA(GRIP_TURN, r.turnF ?? REST_TURN, w),
          turnB: lerpA(GRIP_TURN, r.turnB ?? REST_TURN, w),
        };
        curl = lerp(0.08, r.curl ?? 0.3, w);
        shape = w > 0.5 ? "relaxed" : workShape(curl, false);
      }
      return {
        lean,
        drop,
        headTilt,
        eyeUp: 0,
        eyeDown: 0.5 * bend + 0.85 * drinkW,
        ...hands,
        curl,
        curlB: curl,
        shapeF: shape,
        shapeB: shape,
        joinW: 1,
        gazeAt: B,
        gazeW: 0.9 * bend * (1 - upW),
        obj: {
          kind: "stoneBowl",
          x: O.x,
          y: O.y,
          rot,
          farW: 0.5,
          ofsF: onBowl.ofsF,
          ofsB: onBowl.ofsB,
          free: t < T.grip || t >= T.release,
          fill: opts.heldFill ?? drinkBowlFill(t),
        },
        rigid: 0.5 + 0.5 * smooth((t - T.reach + 4) / 4) * (1 - smooth((t - T.release) / 6)),
        kneel: seat,
      };
    }
    case "pointIn": {
      // A gentle open hand toward pointAt (a doorway, the khat, the bowl): palm up, fingers together.
      const P = opts.pointAt ?? { x: 170, y: -120 - lift };
      const lean = idleLean + 3;
      const sN = bodyPoint(SH_FRONT, lean, lift, 0);
      const d = unit(P.x - sN.x, P.y - sN.y);
      const dist = Math.hypot(P.x - sN.x, P.y - sN.y);
      const reach = clamp(dist - 18, 40, 80);
      // The hand comes out with a small inviting dip, then settles with a slow small sway.
      const inv = 2.5 * Math.sin(clamp(t / 22, 0, 1) * Math.PI);
      const wrist = { x: sN.x + d.x * reach + 0.8 * wob(fl, 24.1, 0.4), y: sN.y + d.y * reach + inv + 0.6 * wob(fl, 22.2, 0.4) };
      const far = farHold(seat);
      return {
        lean,
        headTilt: clamp((P.y + 150 + lift) * 0.08, -8, 12) + 1.2 * wob(f, 7.7),
        eyeUp: 0,
        eyeDown: 0,
        front: wrist,
        frontDir: unit(d.x, d.y - 0.3),
        spread: 0.3,
        curl: 0.1 + 0.03 * wob(f, 13.4, 0.4),
        shapeF: "abhaya",
        turnF: 0.75,
        ...far,
        gazeAt: P,
        gazeW: 0.85,
        elbowDown: 1,
        kneel: seat,
      };
    }
    case "toss": {
      // "...পেছনে ফেলে দাও!": a little toss of the near hand back over his shoulder, then back to rest.
      const T = TOSS_T;
      const upW = smooth(t / T.up) * (1 - smooth((t - 16) / (T.back - 16)));
      const flick = smooth((t - 6) / (T.flick - 6));
      const r = rest(seat);
      // Up beside the near shoulder (clear of the face), then the wrist flicks the fingers open, up and back.
      const top = lerpV({ x: 68, y: -144 - lift }, { x: 66, y: -158 - lift }, flick);
      const dTop = unit(lerp(0.35, -0.45, flick), lerp(-1, -0.9, flick));
      const curl = t < 6 ? lerp(r.curl ?? 0.3, 0.5, smooth(t / 6)) : t < 16 ? lerp(0.5, 0.05, flick) : lerp(0.05, r.curl ?? 0.3, smooth((t - 16) / 14));
      const far = farHold(seat);
      return {
        lean: idleLean - 2 * upW,
        headTilt: -4 * upW + 1.5 * wob(f, 5.1),
        eyeUp: 0.3 * upW,
        eyeDown: 0,
        front: lerpV(r.front, top, upW),
        frontDir: unit(lerp(r.frontDir.x, dTop.x, upW), lerp(r.frontDir.y, dTop.y, upW)),
        spread: 0.8,
        curl,
        shapeF: upW > 0.5 && flick > 0.5 ? "open" : "relaxed",
        turnF: lerpA(r.turnF ?? REST_TURN, 1.5, upW),
        ...far,
        elbowDown: 1,
        kneel: seat,
      };
    }
    case "rollClay":
    default: {
      // Rolling the clay between his palms ("হাতে পাকিয়ে গোল করে ফেলেছে"): the near palm on top circles over
      // the far palm below. Holding the clay Shiva, it is squeezed into a ball over the first 36 frames.
      const O0 = lapObj(seat, 16, "clayLump");
      const ph = (t * 2 * Math.PI) / 14;
      const O = { x: O0.x + 0.9 * Math.cos(ph), y: O0.y - 6 + 0.4 * Math.sin(ph) };
      const top = { x: 8.5 + 3.4 * Math.cos(ph), y: -11.5 + 1.4 * Math.sin(ph) };
      const bot = { x: -8.7 - 1 * Math.cos(ph), y: 10.4 - 0.5 * Math.sin(ph) };
      const morph = kind === "clayShiva" ? smooth(t / 36) : 1;
      return {
        lean: idleLean + 5 * watch,
        headTilt: (9 + 1.5 * wob(f, 3.3)) * watch,
        eyeUp: 0,
        eyeDown: 0.5 * watch,
        front: addV(O, top),
        back: addV(O, bot),
        frontDir: unit(-0.93, 0.36),
        backDir: unit(0.95, -0.2),
        spread: 0.3,
        curl: 0.42,
        curlB: 0.48,
        shapeF: "cup",
        shapeB: "cup",
        turnF: 2.0,
        turnB: -1.15,
        joinW: 1,
        gazeAt: O,
        gazeW: 0.85 * watch,
        obj: kind ? { kind, x: O.x, y: O.y, rot: 0, farW: 0.5, ofsF: top, ofsB: bot, morph, spin: t * 26 } : undefined,
        rigid: 1,
        kneel: seat,
      };
    }
  }
}

/** Episode 3 pose solver (unchanged). */
function solveCore(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts): Solve {
  // Idle drift runs on the life clock. The breath never tilts or bobs the body (MOT-20): it only
  // lifts the chest and shoulders (see mkUp), and hands held at the chest ride up with it.
  const fl = f + (opts.lifeOff ?? 0);
  const jitter = wob(fl, 3.1);
  const idleLean = 3 + 0.8 * jitter;
  const bN = clamp(breath, 0, 2.4);
  // Slow sway of the raised hand, about 6 s per cycle, small amplitude.
  const slowSway = Math.sin(f * 0.0415 + 0.4);
  // The far hand at rest: on its knee when upright, sliding onto the lap as the body leans forward
  // (w = 0..1), with a slow small drift so it never freezes.
  const backRest = (w: number): Pick<Solve, "back" | "backDir" | "shapeB" | "turnB"> => {
    const k = smooth(w);
    const p = lerpV(BACK_KNEE_HAND, BACK_LAP_HAND, k);
    return {
      back: { x: p.x + 0.8 * wob(fl, 21.7, 0.5), y: p.y + 0.5 * wob(fl, 23.1, 0.5) },
      backDir: unit(lerp(KNEE_DIR_BACK.x, BACK_LAP_DIR.x, k), lerp(KNEE_DIR_BACK.y, BACK_LAP_DIR.y, k)),
      shapeB: "relaxed",
      turnB: REST_TURN,
    };
  };

  switch (pose) {
    case "pour": {
      // Pour cycle: the pot tips over the plant, rights itself, tips again.
      const cyc = 0.5 + 0.5 * Math.sin((f * 2 * Math.PI) / 210 + 0.8 + 0.3 * wob(f, 1.2));
      const tilt = 10 + 50 * smooth((cyc - 0.35) / 0.4);
      return {
        lean: 9,
        headTilt: -4 + 2 * wob(f, 6.2),
        eyeUp: 0,
        eyeDown: 0.2,
        front: { x: 88, y: -112 },
        ...backRest(0),
        frontDir: unit(0.6, -0.8),
        spread: 1,
        curl: 0.72, // fingers round the pot's neck
        curlB: 0.32,
        shapeF: "hold", // fingers hooked round the neck, thumb over it, seen from the thumb side
        turnF: SHAPE_TURN.hold,
        gazeAt: POUR_TARGET, // watches the water reach the tulsi
        gazeW: 0.85,
        pot: { tilt },
      };
    }
    case "pickLeaf": {
      // Reach down to the leaf, pick it up, bring it back to the knee. A gentle forward bend (about
      // 24 degrees at most), not a hard sideways lean: the fingertips reach the ground, not the wrist.
      const p = frac((f + 12 * wob(f, 0.4)) / 340);
      const r = smooth(p / 0.3) * (1 - smooth((p - 0.6) / 0.2));
      const front = lerpV(KNEE_REST_FRONT, LEAF_WRIST, r);
      const lean = idleLean + 21 * r;
      const leaf: Prop | undefined =
        p < 0.32
          ? { x: LEAF_GROUND.x, y: LEAF_GROUND.y, opacity: 1 }
          : p < 0.8
            ? { x: front.x, y: front.y, opacity: 1, held: true }
            : undefined;
      // Fingers open on the way down, close on the leaf, and relax once it is back at the knee.
      const holding = smooth((p - 0.27) / 0.06) * (1 - smooth((p - 0.78) / 0.05));
      return {
        lean,
        headTilt: -0.45 * lean + 2 * jitter,
        eyeUp: 0,
        eyeDown: 0.6 * r,
        front,
        ...backRest(0.8 * r),
        frontDir: unit(lerp(KNEE_DIR_FRONT.x, DIR_DOWN.x, r), lerp(KNEE_DIR_FRONT.y, DIR_DOWN.y, r)),
        spread: 1,
        curl: lerp(0.3, 0.06, r * (1 - holding)) + 0.5 * holding,
        curlB: 0.3,
        shapeF: workShape(lerp(0.3, 0.06, r * (1 - holding)) + 0.5 * holding, holding > 0.5),
        turnF: REST_TURN,
        gazeAt: leaf ? { x: leaf.held ? front.x + 6 : leaf.x, y: leaf.held ? front.y + 12 : leaf.y } : front,
        gazeW: 0.35 + 0.6 * r,
        leaf,
      };
    }
    case "placeFlowerOnFoot": {
      // Local clock from the start of this pose (t = 0 at poseStart):
      //   0 to 10    reach into the basket
      //   10 to 14   grip the flower in the basket
      //   14 to 24   carry it to the top of the foot (its foot-flower slot)
      // Without footFlowers (the old beat):
      //   24 to 50   flower rests on the foot top; hand holds it there
      //   50 to 64   hand carries the flower back toward the basket
      //   64 onward  flower dropped in the basket, hand withdraws to the knee
      // With footFlowers (the scene keeps the flowers on the feet):
      //   24 to 30   fingers open and let go; the flower stays on the foot
      //   30 to 44   hand returns to the knee
      const t = f - poseStart;
      const B = opts.basketAt;
      const keep = opts.footFlowers !== undefined;
      // The slot this flower goes to: the next empty one while carrying, the newest one after laying it.
      const nFl = opts.footFlowers ?? 0;
      const slotIdx = clamp(t < 24 ? Math.floor(nFl + 1e-6) : Math.ceil(nFl - 1e-6) - 1, 0, 2);
      const sl = FOOT_FLOWER_SLOTS[slotIdx];
      const place: V = keep ? { x: sl[0], y: sl[1] } : FOOT_TOP;
      // The wrist stays a little above and behind the flower, so the fingers hold it.
      const placeW: V = { x: place.x - 3, y: place.y - 9 };
      const basketW: V = { x: B.x - 3, y: B.y - 8 };
      let front: V;
      if (t < 0) front = KNEE_REST_FRONT;
      else if (t < 10) front = lerpV(KNEE_REST_FRONT, basketW, smooth(t / 10));
      else if (t < 14) front = basketW;
      else if (t < 24) front = lerpV(basketW, placeW, smooth((t - 14) / 10));
      else if (keep) {
        const lift = { x: placeW.x + 2, y: placeW.y - 6 };
        front =
          t < 30
            ? lerpV(placeW, lift, smooth((t - 24) / 6))
            : lerpV(lift, KNEE_REST_FRONT, smooth((t - 30) / 14));
      } else if (t < 50) front = placeW;
      else if (t < 64) front = lerpV(placeW, basketW, smooth((t - 50) / 14));
      else front = lerpV(basketW, KNEE_REST_FRONT, smooth((t - 64) / 8));
      // Lean weight: bent gently over while reaching the basket and the foot, upright otherwise.
      const w = keep
        ? smooth(t / 10) * (1 - smooth((t - 26) / 16))
        : smooth(t / 10) * (1 - smooth((t - 54) / 12));
      const lean = idleLean + 26 * w;
      let flower: Prop | undefined;
      if (keep) {
        // In the basket until gripped, then in the hand; laid on the foot at t = 24, where the
        // footFlowers slot takes over.
        if (t < 24) {
          const inHand = t >= 12;
          flower = inHand
            ? { x: front.x, y: front.y, opacity: 1, held: true }
            : { x: B.x, y: B.y, opacity: smooth((t - 4) / 6) };
        }
      } else {
        const atRest = t < 14 || t >= 64;
        const restOp = t < 14 ? smooth((t - 4) / 6) : 1 - smooth((t - 64) / 5);
        flower =
          t >= 24 && t < 50
            ? { x: FOOT_TOP.x, y: FOOT_TOP.y, opacity: 1 }
            : atRest
              ? { x: B.x, y: B.y, opacity: restOp }
              : { x: front.x, y: front.y, opacity: 1, held: true };
      }
      // Fingers: open while reaching (0-10), close on the stem (10-14), hold until letting go, open,
      // then relax back to rest on the way to the knee.
      const relT = keep ? 24 : 64;
      let curl = 0.3;
      if (t >= 0 && t < 10) curl = lerp(0.3, 0.08, smooth(t / 10));
      else if (t >= 10 && t < 14) curl = lerp(0.08, 0.62, smooth((t - 10) / 4));
      else if (t >= 14 && t < relT) curl = 0.62;
      else if (t >= relT && t < relT + 4) curl = lerp(0.62, 0.1, smooth((t - relT) / 4));
      else if (t >= relT + 4) curl = lerp(0.1, 0.3, smooth((t - relT - 4) / 10));
      const gaze = flower ? (flower.held ? { x: front.x + 4, y: front.y + 9 } : { x: flower.x, y: flower.y }) : place;
      return {
        lean,
        headTilt: -0.4 * lean + 14 * w,
        eyeUp: 0,
        eyeDown: 0.5 * w,
        front,
        ...backRest(0.85 * w),
        frontDir: unit(lerp(KNEE_DIR_FRONT.x, DIR_DOWN.x, w), lerp(KNEE_DIR_FRONT.y, DIR_DOWN.y, w)),
        spread: 1,
        curl,
        curlB: 0.3,
        shapeF: workShape(curl, !!flower?.held && curl > 0.4),
        turnF: REST_TURN,
        gazeAt: gaze, // the eyes stay on the flower
        gazeW: 0.9 * w,
        flower,
      };
    }
    case "bless":
      // Namaste: both palms pressed together at the chest, fingers up, elbows slightly out.
      return {
        lean: 3,
        headTilt: 2 * wob(f, 4.7),
        eyeUp: 0,
        eyeDown: 0.25,
        front: { x: 4.5, y: -113 - 0.6 * bN },
        back: { x: -4.5, y: -113 - 0.6 * bN },
        frontDir: unit(-0.25, -1),
        backDir: unit(0.25, -1),
        spread: 0.3,
        curl: 0.03, // palms and fingers pressed flat together
        curlB: 0.03,
        // Prayer hands: palm to palm, thumbs toward the chest, the little-finger edge and a little of
        // the back of each hand toward the camera.
        shapeF: "pranam",
        shapeB: "pranam",
        turnF: SHAPE_TURN.pranam,
        turnB: SHAPE_TURN.pranam,
        joinW: 1,
      };
    case "bowHands":
      // Same joined palms at the chest, head dips a little.
      return {
        lean: 6,
        headTilt: 8 + 2 * wob(f, 2.2),
        eyeUp: 0,
        eyeDown: 0.45,
        front: { x: 4.5, y: -112 - 0.6 * bN },
        back: { x: -4.5, y: -112 - 0.6 * bN },
        frontDir: unit(-0.25, -1),
        backDir: unit(0.25, -1),
        spread: 0.3,
        curl: 0.03, // palms and fingers pressed flat together
        curlB: 0.03,
        // Prayer hands: palm to palm, thumbs toward the chest, the little-finger edge and a little of
        // the back of each hand toward the camera.
        shapeF: "pranam",
        shapeB: "pranam",
        turnF: SHAPE_TURN.pranam,
        turnB: SHAPE_TURN.pranam,
        joinW: 1,
      };
    case "palmRaise":
      // Blessing, not a wave: near forearm rises from the knee to chest height, palm up and
      // facing out, fingers together. Held steady with a very small slow sway.
      return {
        lean: 2,
        headTilt: 2 * wob(f, 5.2),
        eyeUp: 0,
        eyeDown: 0,
        front: { x: 22 + 1.2 * slowSway, y: -124 - 0.6 * bN },
        ...backRest(0),
        frontDir: unit(0.05, -1),
        spread: 0.25,
        curl: 0.07 + 0.03 * wob(f, 13.4, 0.4), // an open palm, fingers softly together
        curlB: 0.3,
        // Blessing palm to the camera, turned a little toward the girls on his right (thumb toward his
        // midline, as a raised left palm has it).
        shapeF: "abhaya",
        turnF: -0.3,
      };
    case "lookUp":
      // Looking up in thought, head tipped up. Both hands stay on the knees.
      return {
        lean: 1,
        headTilt: -24 + 3 * wob(f, 2.9),
        eyeUp: 1,
        eyeDown: 0,
        ...restHands(fl, KNEE_REST_FRONT),
      };
    case "reaction": {
      // Playful "what?" beat, self-timed from poseStart: both hands go to the hips in 6 frames, hold
      // about 20 frames, and return to the knees over 12 frames. Stays on the knees after that.
      const t = f - poseStart;
      const w = smooth(t / 6) * (1 - smooth((t - 26) / 12));
      const rest = restHands(fl, KNEE_REST_FRONT);
      return {
        lean: 2,
        headTilt: 6 * w,
        eyeUp: 0.5 * w,
        eyeDown: 0,
        front: lerpV(rest.front, HIP_FRONT, w),
        back: lerpV(rest.back, HIP_BACK, w),
        frontDir: unit(lerp(rest.frontDir.x, HIP_DIR_FRONT.x, w), lerp(rest.frontDir.y, HIP_DIR_FRONT.y, w)),
        backDir: unit(lerp(rest.backDir.x, HIP_DIR_BACK.x, w), lerp(rest.backDir.y, HIP_DIR_BACK.y, w)),
        spread: lerp(rest.spread, 0.6, w),
        curl: lerp(rest.curl ?? 0.3, 0.22, w),
        curlB: lerp(rest.curlB ?? 0.3, 0.22, w),
        shapeF: "relaxed",
        shapeB: "relaxed",
        // On the hips the backs of the hands face out, fingers down.
        turnF: lerpA(rest.turnF ?? REST_TURN, -2.7, w),
        turnB: lerpA(rest.turnB ?? REST_TURN, -2.7, w),
      };
    }
    case "idle":
      return {
        lean: 2,
        headTilt: 3 * wob(f, 7.3),
        eyeUp: 0.2 * Math.max(0, wob(f, 9.2)),
        eyeDown: 0,
        ...restHands(fl, { x: KNEE_REST_FRONT.x, y: KNEE_REST_FRONT.y + 2 * wob(f, 8.1) }),
      };
    default:
      // sitCross: upright, hands on knees, a slight forward lean with a slow idle drift.
      return {
        lean: idleLean,
        headTilt: 1.5 * wob(f, 5.9),
        eyeUp: 0,
        eyeDown: 0,
        ...restHands(fl, KNEE_REST_FRONT),
      };
  }
}

const frac = (v: number) => v - Math.floor(v);

/** Blend between two solved poses. e = 0 gives `a`, e = 1 gives `b`. */
const blendSolve = (a: Solve, b: Solve, e: number): Solve => {
  const pickProp = (p?: Prop, q?: Prop): Prop | undefined => {
    if (p && q)
      return {
        x: lerp(p.x, q.x, e),
        y: lerp(p.y, q.y, e),
        opacity: lerp(p.opacity, q.opacity, e),
        held: e < 0.5 ? p.held : q.held,
      };
    if (q) return { ...q, opacity: q.opacity * e };
    if (p) return { ...p, opacity: p.opacity * (1 - e) };
    return undefined;
  };
  const tiltA = a.pot ? a.pot.tilt : 0;
  const tiltB = b.pot ? b.pot.tilt : 0;
  return {
    lean: lerp(a.lean, b.lean, e),
    headTilt: lerp(a.headTilt, b.headTilt, e),
    eyeUp: lerp(a.eyeUp, b.eyeUp, e),
    eyeDown: lerp(a.eyeDown, b.eyeDown, e),
    front: lerpV(a.front, b.front, e),
    back: lerpV(a.back, b.back, e),
    frontDir: unit(lerp(a.frontDir.x, b.frontDir.x, e), lerp(a.frontDir.y, b.frontDir.y, e)),
    backDir: unit(lerp(a.backDir.x, b.backDir.x, e), lerp(a.backDir.y, b.backDir.y, e)),
    spread: lerp(a.spread, b.spread, e),
    curl: lerp(a.curl ?? 0.3, b.curl ?? 0.3, e),
    curlB: lerp(a.curlB ?? 0.3, b.curlB ?? 0.3, e),
    // A hand shape is a replacement drawing: it swaps at the middle of the blend while the wrist turn
    // rotates continuously along the shorter arc.
    shapeF: e < 0.5 ? (a.shapeF ?? "relaxed") : (b.shapeF ?? "relaxed"),
    shapeB: e < 0.5 ? (a.shapeB ?? "relaxed") : (b.shapeB ?? "relaxed"),
    turnF: lerpA(a.turnF ?? REST_TURN, b.turnF ?? REST_TURN, e),
    turnB: lerpA(a.turnB ?? REST_TURN, b.turnB ?? REST_TURN, e),
    joinW: lerp(a.joinW ?? 0, b.joinW ?? 0, e),
    gazeAt: a.gazeAt && b.gazeAt ? lerpV(a.gazeAt, b.gazeAt, e) : (b.gazeAt ?? a.gazeAt),
    gazeW: lerp(a.gazeAt ? (a.gazeW ?? 0) : 0, b.gazeAt ? (b.gazeW ?? 0) : 0, e),
    // The pot fades out over the first half of a blend away from pour (and in over the second half of one into it).
    pot:
      a.pot || b.pot
        ? {
          tilt: lerp(tiltA, tiltB, e),
          opacity: a.pot && b.pot ? 1 : b.pot ? smooth((e - 0.5) / 0.5) : 1 - smooth(e / 0.5),
        }
        : undefined,
    leaf: pickProp(a.leaf, b.leaf),
    flower: pickProp(a.flower, b.flower),
    // Episode 4 (all undefined in Episode 3).
    kneel: a.kneel === undefined && b.kneel === undefined ? undefined : lerp(a.kneel ?? 0, b.kneel ?? 0, e),
    rigid: a.rigid === undefined && b.rigid === undefined ? undefined : lerp(a.rigid ?? 0, b.rigid ?? 0, e),
    elbowDown: a.elbowDown === undefined && b.elbowDown === undefined ? undefined : lerp(a.elbowDown ?? 0, b.elbowDown ?? 0, e),
    drop: a.drop === undefined && b.drop === undefined ? undefined : lerp(a.drop ?? 0, b.drop ?? 0, e),
    obj: blendHeld(a.obj, b.obj, e),
    // Episode 5 (undefined in Episodes 3 and 4).
    pebble: pickProp(a.pebble, b.pebble),
    turn: a.turn === undefined && b.turn === undefined ? undefined : lerp(a.turn ?? 0, b.turn ?? 0, e),
    // Episode 6 (undefined in Episodes 3 to 5).
    hold6:
      a.hold6 && b.hold6 && a.hold6.kind === b.hold6.kind
        ? {
          ...b.hold6,
          x: lerp(a.hold6.x, b.hold6.x, e),
          y: lerp(a.hold6.y, b.hold6.y, e),
          rot: lerp(a.hold6.rot, b.hold6.rot, e),
          ofsF: lerpV(a.hold6.ofsF, b.hold6.ofsF, e),
          ofsB: lerpV(a.hold6.ofsB, b.hold6.ofsB, e),
          fold: lerp(a.hold6.fold, b.hold6.fold, e),
        }
        : (b.hold6 ?? a.hold6),
    worry: a.worry === undefined && b.worry === undefined ? undefined : lerp(a.worry ?? 0, b.worry ?? 0, e),
    farArmFront: a.farArmFront === undefined && b.farArmFront === undefined ? undefined : lerp(a.farArmFront ?? 0, b.farArmFront ?? 0, e),
    elbowSwingF: a.elbowSwingF === undefined && b.elbowSwingF === undefined ? undefined : lerp(a.elbowSwingF ?? 0, b.elbowSwingF ?? 0, e),
    farOverCape: e < 0.5 ? a.farOverCape : b.farOverCape,
  };
};

/**
 * Blend of the held object between two poses: it moves with the hands (never fades while in both poses). An
 * object only one side has fades over the blend, unless it is free (standing on the floor), which stays put.
 */
const blendHeld = (p: HeldPose | undefined, q: HeldPose | undefined, e: number): HeldPose | undefined => {
  if (p && q)
    return {
      kind: e < 0.5 ? p.kind : q.kind,
      x: lerp(p.x, q.x, e),
      y: lerp(p.y, q.y, e),
      rot: lerp(p.rot, q.rot, e),
      farW: lerp(p.farW, q.farW, e),
      ofsF: lerpV(p.ofsF, q.ofsF, e),
      ofsB: lerpV(p.ofsB, q.ofsB, e),
      free: e < 0.5 ? p.free : q.free,
      fill: p.fill === undefined && q.fill === undefined ? undefined : lerp(p.fill ?? 1, q.fill ?? 1, e),
      morph: p.morph === undefined && q.morph === undefined ? undefined : lerp(p.morph ?? 0, q.morph ?? 0, e),
      spin: lerp(p.spin ?? 0, q.spin ?? 0, e),
      opacity: lerp(p.opacity ?? 1, q.opacity ?? 1, e),
    };
  if (q) return q.free ? q : { ...q, opacity: (q.opacity ?? 1) * smooth(e / 0.5) };
  if (p) return p.free ? p : { ...p, opacity: (p.opacity ?? 1) * (1 - smooth(e / 0.5)) };
  return undefined;
};

/* ------------------------------------------------------------------ */
/* Drawing primitives                                                    */
/* ------------------------------------------------------------------ */

/**
 * One round-ended capsule from A (radius rA) to B (radius rB), as a closed SVG subpath.
 * All capsules use the same winding, so a union of them in one path fills with nonzero rule.
 */
const capD = (A: V, B: V, rA: number, rB: number): string => {
  const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
  const ux = (B.x - A.x) / len;
  const uy = (B.y - A.y) / len;
  const nx = -uy;
  const ny = ux;
  const p = (c: V, k: number, r: number) => `${(c.x + nx * r * k).toFixed(2)} ${(c.y + ny * r * k).toFixed(2)}`;
  return (
    `M${p(A, 1, rA)} L${p(B, 1, rB)} A${rB.toFixed(2)} ${rB.toFixed(2)} 0 0 0 ${p(B, -1, rB)} ` +
    `L${p(A, -1, rA)} A${rA.toFixed(2)} ${rA.toFixed(2)} 0 0 0 ${p(A, 1, rA)} Z`
  );
};

/**
 * Tapered limb as one path: the polyline is cut into sub-capsules whose radii interpolate along the
 * chain, so knees, elbows and ankles are round and the outline is smooth (no stamped rings).
 */
const chainD = (
  pts: V[],
  radii: number[],
  o: { grow?: number; dx?: number; dy?: number; sub?: number } = {},
): string => {
  const grow = o.grow ?? 0;
  const dx = o.dx ?? 0;
  const dy = o.dy ?? 0;
  const sub = o.sub ?? 6;
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < sub; k++) {
      const t0 = k / sub;
      const t1 = (k + 1) / sub;
      const A = lerpV(pts[i], pts[i + 1], t0);
      const B = lerpV(pts[i], pts[i + 1], t1);
      const rA = radii[i] + (radii[i + 1] - radii[i]) * t0 + grow;
      const rB = radii[i] + (radii[i + 1] - radii[i]) * t1 + grow;
      d += capD(
        { x: A.x + dx, y: A.y + dy },
        { x: B.x + dx, y: B.y + dy },
        Math.max(0.2, rA),
        Math.max(0.2, rB),
      );
    }
  }
  return d;
};

/** A limb: darker base shape, then a lighter copy nudged toward the light, which leaves the shade on the underside. */
const limb = (pts: V[], radii: number[], base: string, shade: string): React.ReactElement => (
  <g>
    <path d={chainD(pts, radii)} fill={shade} />
    <path d={chainD(pts, radii, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
  </g>
);

/** Midpoint of a to b, pushed `amt` units along the normal: upward when `up`, otherwise downward. */
const bulgeMid = (a: V, b: V, amt: number, up: boolean): V => {
  const m = lerpV(a, b, 0.5);
  const n = unit(-(b.y - a.y), b.x - a.x);
  const sign = (up ? -1 : 1) * Math.sign(n.y);
  return { x: m.x + n.x * sign * amt, y: m.y + n.y * sign * amt };
};

/** Per-limb offsets: `grow` changes every radius, `dx` and `dy` shift the whole limb. */
interface LimbOpts {
  grow?: number;
  dx?: number;
  dy?: number;
}

/**
 * Samples a polyline with tapered radii (radii interpolate linearly along each segment) into
 * centres, radii and unit normals, with the offsets applied to the centres and radii.
 */
const sampleLimb = (pts: V[], radii: number[], o: LimbOpts = {}): { c: V[]; r: number[]; n: V[] } => {
  const grow = o.grow ?? 0;
  const dx = o.dx ?? 0;
  const dy = o.dy ?? 0;
  const per = 8;
  const c: V[] = [];
  const r: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per;
      c.push(lerpV(pts[i], pts[i + 1], t));
      r.push(lerp(radii[i], radii[i + 1], t));
    }
  }
  c.push(pts[pts.length - 1]);
  r.push(radii[radii.length - 1]);
  const n = c.map((_, j) => {
    const a = c[Math.max(0, j - 1)];
    const b = c[Math.min(c.length - 1, j + 1)];
    const t = unit(b.x - a.x, b.y - a.y);
    return { x: -t.y, y: t.x };
  });
  return {
    c: c.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    r: r.map((v) => Math.max(0.2, v + grow)),
    n,
  };
};

/**
 * One filled outline for a tapered limb: the left side out along the polyline, a round end cap,
 * the right side back, and a round start cap. Both caps are half circles, so this is one subpath.
 */
const limbD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const L = c.map((p, j) => ({ x: p.x + n[j].x * r[j], y: p.y + n[j].y * r[j] }));
  const R = c.map((p, j) => ({ x: p.x - n[j].x * r[j], y: p.y - n[j].y * r[j] }));
  const last = c.length - 1;
  let d = `M${pt(L[0])}`;
  for (let j = 1; j <= last; j++) d += ` L${pt(L[j])}`;
  d += ` A${r[last].toFixed(2)} ${r[last].toFixed(2)} 0 0 0 ${pt(R[last])}`;
  for (let j = last - 1; j >= 0; j--) d += ` L${pt(R[j])}`;
  return d + ` A${r[0].toFixed(2)} ${r[0].toFixed(2)} 0 0 0 ${pt(L[0])} Z`;
};

/** The upper side of a tapered limb, as an open curve (used for the lighter top edge). */
const topEdgeD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const top = c.map((p, j) => {
    const s = n[j].y <= 0 ? 1 : -1;
    return { x: p.x + s * n[j].x * r[j], y: p.y + s * n[j].y * r[j] };
  });
  return smoothOpen(top);
};

/**
 * Leg part: the shade silhouette first, then a lit copy nudged up and in. The shade is left as a
 * band along the underside, so each limb reads as one shape with its own form shadow.
 */
const legPaint = (pts: V[], radii: number[], base: string, shade: string): React.ReactElement => (
  <g>
    <path d={limbD(pts, radii)} fill={shade} />
    <path d={limbD(pts, radii, { grow: -1.4, dx: -0.6, dy: -1.3 })} fill={base} />
  </g>
);

/** Warm rim along the upper edge of a near-leg part. */
const edgeLine = (pts: V[], radii: number[], rim: string = RIM): React.ReactElement => (
  <path
    d={topEdgeD(pts, radii, { grow: -1.3 })}
    fill="none"
    stroke={rim}
    strokeWidth={1.1}
    strokeLinecap="round"
    opacity={0.45}
  />
);

/** The lower side of a tapered limb, as an open curve (used for the core shadow line). */
const bottomEdgeD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const bot = c.map((p, j) => {
    const s = n[j].y <= 0 ? -1 : 1;
    return { x: p.x + s * n[j].x * r[j], y: p.y + s * n[j].y * r[j] };
  });
  return smoothOpen(bot);
};

/**
 * Soft, chubby child arm as ONE seamless form: shoulder, a full upper arm, an elbow that bends along
 * a soft curve (never a hinge corner) and a plump forearm narrowing to a soft wrist of radius `wristR`
 * (figure units), which matches the shared Hand's wrist in the current view (see childHand). One shade
 * silhouette and one lit fill, so no outline or colour step shows at the elbow, and no joint pivot is
 * drawn. The light side carries a warm highlight, the shadow side a soft core line, both along one
 * consistent side of the limb. The hand is drawn on top by childHand.
 */
const armPaint = (
  sh: V,
  E: V,
  H: V,
  scale: number,
  base: string,
  shade: string,
  lit: number,
  wristR: number,
  /** Draw only from this centre-line point on (6 = just past the elbow), fills only: the forearm copy. */
  from = 0,
  /** Highlight colour along the lit side (the design's lit skin). */
  litCol: string = SKIN_LIT,
): React.ReactElement => {
  // Centre line: straight upper arm, a quadratic curve through the elbow region, straight forearm.
  const E1 = lerpV(sh, E, 0.78);
  const E2 = lerpV(E, H, 0.24);
  const curve: V[] = [];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const a = lerpV(E1, E, t);
    const b = lerpV(E, E2, t);
    curve.push(lerpV(a, b, t));
  }
  const pts: V[] = [sh, lerpV(sh, E1, 0.5), E1, ...curve, E2, lerpV(E2, H, 0.5), H];
  // Radii by position along the arm: shoulder 9.6, mid upper arm 8.5, elbow 7.1, forearm 6.5, then the
  // wrist, sized to the hand (about 3.5 to 5).
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lens[lens.length - 1] || 1;
  const KEYS: Array<[number, number]> = [
    [0, 9.6],
    [0.26, 8.5],
    [0.52, 7.2],
    [0.75, 6.5],
    [1, wristR / scale],
  ];
  const rAt = (u: number): number => {
    for (let k = 1; k < KEYS.length; k++) {
      if (u <= KEYS[k][0]) {
        const [u0, r0] = KEYS[k - 1];
        const [u1, r1] = KEYS[k];
        return lerp(r0, r1, smooth((u - u0) / (u1 - u0)));
      }
    }
    return KEYS[KEYS.length - 1][1];
  };
  const radii = lens.map((l) => rAt(l / total) * scale);
  // One consistent "upper" side for the edge lines: the side whose normal points up for the whole arm.
  const main = unit(H.x - sh.x, H.y - sh.y);
  const mid = lerpV(sh, H, 0.5);
  // Bend angle at the elbow (radians): 0 = straight arm.
  const uaD = unit(E.x - sh.x, E.y - sh.y);
  const faD = unit(H.x - E.x, H.y - E.y);
  const bend = Math.acos(clamp(uaD.x * faD.x + uaD.y * faD.y, -1, 1));
  const nUp = main.x <= 0 ? 1 : -1; // the left normal (-dir.y, dir.x) points up when dir.x <= 0
  // `start`: first sample drawn (the forearm copy draws only its own part of the same lines).
  const edge = (side: number, grow: number, start = 0): string => {
    const { c, r, n } = sampleLimb(pts, radii, { grow });
    // The same side of the chain all the way along, so the line never jumps across a bent elbow.
    const k = nUp * side;
    const out = c.map((p, j) => ({ x: p.x + k * n[j].x * r[j], y: p.y + k * n[j].y * r[j] }));
    // Trim the ends so the lines fade into the shoulder and the wrist instead of capping them.
    const last = out.length - 4;
    // On the inside of a clearly bent elbow the offset line would fold over itself: there it stops
    // before the bend and starts again after it (the crease is left to the shade).
    const jE = Math.round((c.length - 1) * 0.5); // the elbow sample (E is the middle point of pts)
    const inner = (k * n[jE].x * (mid.x - E.x) + k * n[jE].y * (mid.y - E.y)) > 0;
    if (inner && bend > 0.6) {
      const cut = Math.round((c.length - 1) * (0.14 + 0.08 * Math.min(1, bend / 1.6)));
      const b1 = Math.max(4, jE - cut);
      const first = start < b1 - 1 ? smoothOpen(out.slice(Math.max(3, start), b1)) + " " : "";
      return first + smoothOpen(out.slice(Math.max(Math.min(last - 1, jE + cut), start), last));
    }
    return smoothOpen(out.slice(Math.max(3, start), last));
  };
  // MOT-19: no dark outline. The silhouette is the soft shade-side tone the shared Hand uses, the lit
  // copy nudged toward the light leaves it as a gentle form shadow on the far side; the core shade is a
  // broad, faint band (not a line) inside it, and the warm highlight runs along the lit side.
  const edgeCol = skinEdge(base, shade);
  if (from > 0) {
    const fp = pts.slice(from);
    const fr = radii.slice(from);
    return (
      <g>
        <path d={chainD(fp, fr)} fill={edgeCol} />
        <path d={chainD(fp, fr, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
        <path d={edge(1, -2.2, from * 8)} fill="none" stroke={litCol} strokeWidth={1.6} strokeLinecap="round" opacity={0.3 * lit} />
        <path d={edge(-1, -2.4, from * 8)} fill="none" stroke={shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />
      </g>
    );
  }
  return (
    <g>
      <path d={chainD(pts, radii)} fill={edgeCol} />
      <path d={chainD(pts, radii, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
      <path d={edge(1, -2.2)} fill="none" stroke={litCol} strokeWidth={1.6} strokeLinecap="round" opacity={0.3 * lit} />
      <path d={edge(-1, -2.4)} fill="none" stroke={shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />
    </g>
  );
};

/** Soft highlight on the top of a cloth-covered knee. */
const kneeHi = (k: V, fill: string, opacity: number): React.ReactElement => {
  const side = k.x > 0 ? 1 : -1;
  const cx = k.x - 1.5 * side;
  const cy = k.y - 4.6;
  return (
    <ellipse
      cx={cx.toFixed(2)}
      cy={cy.toFixed(2)}
      rx={4.2}
      ry={2.2}
      fill={fill}
      opacity={opacity}
      transform={`rotate(${(-18 * side).toFixed(1)} ${cx.toFixed(2)} ${cy.toFixed(2)})`}
    />
  );
};

// Thighs are drawn as the cloth over them (the dhoti is roomy, so the tube is wider than the leg).
const THIGH_R = [14, 13.2, 11.6]; // hip, middle, knee
const SHIN_R = [8.4, 7.8, 5.6]; // soft, rounded child shins: knee, calf, ankle
const SHIN_R_PLATE = [11, 10.4, 8.6]; // plate design: the dhoti over the upper shins
/** Plate design: the dhoti over a shin from the knee to about mid-shin, with a soft hem (opaque cotton). */
const shinCloth = (pts: V[], base: string, shade: string, fold: string): React.ReactElement => {
  const knee = pts[0];
  const ank = pts[2];
  const mid = lerpV(knee, ank, 0.5);
  const seg = [knee, lerpV(knee, mid, 0.5), mid];
  const radii = [SHIN_R_PLATE[0], SHIN_R_PLATE[1], 9.6];
  const d = unit(mid.x - knee.x, mid.y - knee.y);
  const n = { x: -d.y, y: d.x };
  const r = radii[2];
  return (
    <g>
      {legPaint(seg, radii, base, shade)}
      <path d={topEdgeD(seg, radii, { grow: -1.8 })} fill="none" stroke={CLOTH_EDGE_LIT} strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
      {/* the hem: a soft rounded edge with a little shade under it on the bare shin */}
      <path d={qd({ x: mid.x + n.x * r, y: mid.y + n.y * r }, { x: mid.x + d.x * r * 0.75, y: mid.y + d.y * r * 0.75 }, { x: mid.x - n.x * r, y: mid.y - n.y * r })} fill="none" stroke={fold} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
};
const CLOTH_EDGE_LIT = "#fffaf0";
const NEAR_THIGH_PTS: V[] = [HIP_NEAR, bulgeMid(HIP_NEAR, KNEE_NEAR, 2.5, true), KNEE_NEAR];
const FAR_THIGH_PTS: V[] = [HIP_FAR, bulgeMid(HIP_FAR, KNEE_FAR, 2.5, true), KNEE_FAR];
const NEAR_SHIN_PTS: V[] = [KNEE_NEAR, bulgeMid(KNEE_NEAR, ANKLE_NEAR, 1.6, false), ANKLE_NEAR];
const FAR_SHIN_PTS: V[] = [KNEE_FAR, bulgeMid(KNEE_FAR, ANKLE_FAR, 1.6, false), ANKLE_FAR];

/* ------------------------------------------------------------------ */
/* Hands: the shared Hand (MOT-19) fitted to a five-year-old              */
/* ------------------------------------------------------------------ */

/** Hand scale (Hand's `L`): about 21 figure units from the wrist to the middle fingertip. */
const HAND_L = 27;
/** A child's hand: the adult model drawn a little wider and shorter (plumper palm, softer fingers). */
const HAND_SX = 1.12;
const HAND_SY = 0.95;
/** Wrist to palm centre along the hand (figure units). */
const PALM_OFS = 0.3 * HAND_L * HAND_SY;
/** Half the palm's width (figure units), for the little-finger edge. */
const PALM_HALF_W = 0.2 * HAND_L * HAND_SX;

/**
 * Forearm radius at the wrist for a hand at wrist turn `turn`: the projected half-width of Hand's
 * wrist (half-width 0.15 L, thickness 0.22 L) in that view, plus a soft margin. So the forearm meets
 * the palm at the same width in palm, back and side views and no cuff or step shows.
 */
const wristRadius = (turn: number): number =>
  (0.15 * HAND_L * Math.abs(Math.cos(turn)) + 0.11 * HAND_L * Math.abs(Math.sin(turn))) * HAND_SX + 0.35;

/**
 * The shared Hand at the end of a forearm. `W` is the wrist (the arm's end), `dir` the unit vector
 * toward the fingertips, `side` +1 for the near arm (the screen-right arm of the front-facing child),
 * -1 for the far arm (its mirror). The hand is clipped just past its wrist line so its outline never
 * crosses the forearm, and the last few units of the forearm (`wristR`, same two-tone fill as armPaint)
 * are drawn again over the wrist, fading out along the hand: the palm grows out of the arm, no seam.
 */
const childHand = (
  id: string,
  W: V,
  dir: V,
  shape: HandShape,
  turn: number,
  side: 1 | -1,
  skin: string,
  shade: string,
  curl: number,
  wristR: number,
  /** Elbow point: the wrist blend follows the forearm up to the wrist, then the hand. */
  elbow: V,
): React.ReactElement => {
  const rot = (Math.atan2(-dir.x, dir.y) * 180) / Math.PI;
  const [c0, k] = SHAPE_CURL[shape];
  const flex = clamp((curl - c0) * k, -4, 4);
  // Wrist blend: the forearm's end from 6 units up the arm (along the forearm, so it lies exactly on
  // the arm drawn by armPaint) to 2.5 units into the hand (along the hand).
  const fa = unit(W.x - elbow.x, W.y - elbow.y);
  const A: V = { x: W.x - fa.x * 6, y: W.y - fa.y * 6 };
  const B: V = { x: W.x + dir.x * 2.5, y: W.y + dir.y * 2.5 };
  const stub = [A, W, B];
  const stubR = [wristR + 0.15, wristR, wristR * 0.96];
  return (
    <g>
      <g transform={`translate(${W.x.toFixed(2)} ${W.y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${HAND_SX} ${HAND_SY})`}>
        <defs>
          <clipPath id={id}>
            <rect x={-40} y={0.3} width={80} height={80} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <Hand shape={shape} L={HAND_L} skin={skin} shade={shade} side={side} flex={flex} turn={turn} />
        </g>
      </g>
      <defs>
        <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={A.x} y1={A.y} x2={B.x} y2={B.y}>
          <stop offset={0} stopColor="#fff" stopOpacity={0} />
          <stop offset={0.3} stopColor="#fff" stopOpacity={1} />
          <stop offset={0.66} stopColor="#fff" stopOpacity={1} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
          <rect x={-400} y={-400} width={800} height={800} fill={`url(#${id}-wg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        <path d={chainD(stub, stubR, { sub: 2 })} fill={skinEdge(skin, shade)} />
        <path d={chainD(stub, stubR, { grow: -1.1, dx: -0.8, dy: -1, sub: 2 })} fill={skin} />
      </g>
    </g>
  );
};

/**
 * Bare foot lying flat on the ground (sole at y = 0), about 36 px long and 12 px tall. The ankle
 * joint is at `ankle` (u = 0) just above the foot, heel at u = -9, toes running out along `toe`
 * (+1 right, -1 left). Heel, arch on top, a darker sole band, and five toe bumps at the front.
 */
const foot = (ankle: V, toe: number, col: string, shade: string, sole: string, lit: string = SKIN_LIT): React.ReactElement => {
  // u runs along the foot from the ankle (+u is the toe end); v is absolute height, sole on the ground line.
  const P = (u: number, v: number): V => ({ x: ankle.x + u * toe, y: v });
  const outline = [
    P(-9.2, -2.6), // heel bottom
    P(-9.6, -6.0), // back of heel
    P(-7.4, -9.4),
    P(-3.2, -11.2), // ankle end sits on the arch
    P(0.6, -11.8), // arch, highest point
    P(5, -10.8),
    P(10, -9.2),
    P(15, -7.2),
    P(19.4, -5.2),
    P(22.8, -3.6),
    P(24.6, -1.8), // big toe
    P(23.8, -0.3),
    P(20.5, 0), // ball of the foot on the ground
    P(13, 0),
    P(5, 0),
    P(-2, 0),
    P(-6.5, 0),
    P(-8.6, -0.7),
  ];
  // Sole: a darker band along the bottom edge.
  const soleBand = [
    P(-8.6, -0.6),
    P(-2, 0),
    P(5, 0),
    P(13, 0),
    P(20.5, 0),
    P(23.4, -0.4),
    P(21, -2.0),
    P(13, -2.1),
    P(5, -2.0),
    P(-3, -2.0),
    P(-7.2, -1.9),
  ];
  // Five toes fanning from the big toe (front, low) back and up along the top of the front edge.
  const toes: Array<[number, number, number]> = [
    [23.4, -2.1, 1.45],
    [21.9, -3.9, 1.2],
    [20.2, -5.2, 1.05],
    [18.4, -6.2, 0.95],
    [16.6, -6.9, 0.85],
  ];
  return (
    <g>
      <path d={smoothClosed(outline)} fill={skinEdge(col, shade)} />
      <path d={smoothClosed(outline.map((p) => ({ x: p.x - 0.5 * toe, y: p.y - 0.9 })))} fill={col} />
      <path d={smoothClosed(soleBand)} fill={mixHex(col, sole, 0.7)} />
      {/* Soft light along the top of the foot, and a gentle shadow under the arch */}
      <path d={smoothOpen([P(-6, -9.6), P(0.6, -10.9), P(8, -9.4), P(15, -6.8)])} fill="none" stroke={lit} strokeWidth={1} strokeLinecap="round" opacity={0.32} />
      <path d={smoothOpen([P(-3, -1.6), P(4, -3), P(11, -2.4)])} fill="none" stroke={shade} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      {/* Chubby ankle: a soft fold where the shin meets the foot, and the round ankle bone */}
      <path d={smoothOpen([P(-6.6, -9.8), P(-3.2, -8.2), P(0.8, -8.7), P(3.6, -10.2)])} fill="none" stroke={shade} strokeWidth={0.7} strokeLinecap="round" opacity={0.5} />
      <circle cx={P(-3.4, -6.4).x.toFixed(2)} cy={(-6.4).toFixed(2)} r={1.5} fill={lit} opacity={0.18} />
      {toes.map(([u, v, r], j) => {
        const c = P(u, v);
        return (
          <g key={j}>
            <circle cx={c.x.toFixed(2)} cy={c.y.toFixed(2)} r={r * 0.95} fill={col} />
            {/* Separation behind each toe, and a faint lit nail */}
            <path
              d={`M${pt(P(u - r * 0.95, v - r * 0.2))} Q${pt(P(u - r * 0.75, v + r * 0.6))} ${pt(P(u - r * 0.2, v + r * 0.95))}`}
              fill="none"
              stroke={shade}
              strokeWidth={0.4}
              strokeLinecap="round"
              opacity={0.55}
            />
            <circle cx={P(u + r * 0.25, v - r * 0.3).x.toFixed(2)} cy={(v - r * 0.3).toFixed(2)} r={r * 0.35} fill={lit} opacity={0.45} />
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Red hibiscus (জবা)                                                    */
/* ------------------------------------------------------------------ */

// One broad petal pointing up (-y) from the centre, about 10.4 long and 10.6 wide, with a soft ruffled
// outer edge (five shallow scallops) and a narrow base.
const HIB_PETAL =
  "M0 0 C-2.6 -1.6 -6 -5.2 -5.3 -8.4 Q-4.6 -10.5 -3 -10.1 Q-2 -11.3 -0.6 -10.6 Q0.6 -11.6 1.7 -10.5 " +
  "Q3.2 -11.2 4.2 -9.8 Q5.8 -9.2 5.3 -7.6 C5.6 -4.8 2.4 -1.5 0 0Z";
// Veins: three soft lines from the base into the petal.
const HIB_VEINS = "M0 -1.2 Q-0.2 -5 -0.5 -8.6 M-0.4 -1.6 Q-2.2 -5 -3.6 -7.6 M0.4 -1.6 Q2.2 -4.8 3.4 -7.4";

/**
 * A red hibiscus seen from above at (x, y): five broad overlapping red petals with ruffled edges,
 * darker toward a wine-dark centre, and the long staminal column with a yellow pollen tip.
 * `gid` is the id of the petal gradient (user-space, centred on the flower). Size about 22 units across
 * at scale 1.
 */
const hibiscus = (
  x: number,
  y: number,
  scale: number,
  rot: number,
  opacity: number,
  gid: string,
  key?: string | number,
): React.ReactElement => (
  <g
    key={key}
    opacity={opacity.toFixed(3)}
    transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(3)})`}
  >
    {/* soft contact shadow */}
    <ellipse cx={0.8} cy={2.2} rx={9.5} ry={6.5} fill={SKIN_UNDER} opacity={0.16} />
    {[0, 72, 144, 216, 288].map((a, i) => (
      <g key={a} transform={`rotate(${a + (i % 2 ? 3 : -3)})`}>
        <path d={HIB_PETAL} fill={`url(#${gid})`} stroke={HIB_EDGE} strokeWidth={0.32} strokeLinejoin="round" />
        <path d={HIB_VEINS} fill="none" stroke={HIB_DEEP} strokeWidth={0.32} strokeLinecap="round" opacity={0.55} />
      </g>
    ))}
    {/* dark eye at the centre */}
    <circle r={2.6} fill={HIB_DEEP} opacity={0.85} />
    <circle r={1.5} fill={HIB_CORE} />
    {/* staminal column: long, slightly curved, red, with a yellow pollen tip */}
    <path d="M0 0 Q2.6 -5.4 6.6 -10.6" fill="none" stroke={HIB_COLUMN} strokeWidth={0.95} strokeLinecap="round" />
    <path d="M0.3 -0.6 Q2.7 -5.6 6.4 -10.2" fill="none" stroke={HIB_LIGHT} strokeWidth={0.35} strokeLinecap="round" opacity={0.7} />
    {[
      [6.9, -11.1, 0.95],
      [5.9, -10.9, 0.7],
      [7.6, -10.3, 0.7],
      [6.3, -9.7, 0.6],
      [7.4, -11.9, 0.55],
      [5.4, -9.9, 0.45],
    ].map(([px, py, pr], j) => (
      <circle key={j} cx={px} cy={py} r={pr} fill={HIB_POLLEN} />
    ))}
    <circle cx={7.1} cy={-11.4} r={0.35} fill="#fff6c8" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Episode 4: kneeling legs and dhoti                                   */
/* ------------------------------------------------------------------ */

interface LegGeom {
  nearThigh: V[];
  farThigh: V[];
  nearShin: V[];
  farShin: V[];
  ankleN: V;
  ankleF: V;
  toeN: number;
  toeF: number;
  /** Kneeling: the foot lies top-down behind him, sole up (drawn flipped). */
  soleUp: boolean;
  lap: V[];
}
const LEGS_CROSS: LegGeom = {
  nearThigh: NEAR_THIGH_PTS,
  farThigh: FAR_THIGH_PTS,
  nearShin: NEAR_SHIN_PTS,
  farShin: FAR_SHIN_PTS,
  ankleN: ANKLE_NEAR,
  ankleF: ANKLE_FAR,
  toeN: 1,
  toeF: -1,
  soleUp: false,
  lap: LAP_PTS,
};
/**
 * Kneeling on the heels, three-quarter view facing +x: the knees come forward onto the ground, the shins run back
 * under him (toward -x) and the feet lie behind, toes pointing back. Up on the knees the hips rise by 28.
 */
const KNEEL_HIP_N: V = { x: -11, y: -44 };
const KNEEL_HIP_F: V = { x: 11, y: -44 };
const KNEEL_KNEE_N: V = { x: -22, y: -11 };
const KNEEL_KNEE_F: V = { x: 40, y: -11 };
const KNEEL_ANKLE_N: V = { x: -64, y: -14 };
const KNEEL_ANKLE_F: V = { x: -44, y: -18 };
/** The dhoti on the heels: from the waist over the short, forward thighs to a hem at the knees (LAP_PTS order). */
const LAP_KNEEL: V[] = [
  { x: -31, y: -64 },
  { x: 0, y: -66 },
  { x: 31, y: -64 },
  { x: 38, y: -52 },
  { x: 46, y: -38 },
  { x: 52, y: -24 },
  { x: 53, y: -11 },
  { x: 38, y: -5 },
  { x: 9, y: -8 },
  { x: -22, y: -5 },
  { x: -37, y: -11 },
  { x: -41, y: -24 },
  { x: -39, y: -38 },
  { x: -34, y: -52 },
];
const kneelLegs = (k: number): LegGeom => {
  const a = smooth(clamp(k, 0, 1));
  const up = 28 * smooth(clamp(k - 1, 0, 1));
  const L = (c: V, h: V, rise: number): V => ({ x: lerp(c.x, h.x, a), y: lerp(c.y, h.y, a) - rise });
  const hipN = L(HIP_NEAR, KNEEL_HIP_N, up);
  const hipF = L(HIP_FAR, KNEEL_HIP_F, up);
  const kneeN = L(KNEE_NEAR, KNEEL_KNEE_N, 0);
  const kneeF = L(KNEE_FAR, KNEEL_KNEE_F, 0);
  const ankleN = L(ANKLE_NEAR, KNEEL_ANKLE_N, 0);
  const ankleF = L(ANKLE_FAR, KNEEL_ANKLE_F, 0);
  // The near foot turns from pointing +x (under the crossed shin) to pointing back; it flips mid-move.
  const toeN = a < 0.5 ? lerp(1, 0.3, a / 0.5) : -lerp(0.3, 1, (a - 0.5) / 0.5);
  const lap = LAP_PTS.map((p, i) => {
    const h = LAP_KNEEL[i];
    const y0 = lerp(p.y, h.y, a);
    const u = clamp((-y0 - 8) / 58, 0, 1); // 0 at the hem, 1 at the waist: the waist rises with the hips
    return { x: lerp(p.x, h.x, a), y: y0 - up * u };
  });
  return {
    nearThigh: [hipN, bulgeMid(hipN, kneeN, 2.5, true), kneeN],
    farThigh: [hipF, bulgeMid(hipF, kneeF, 2.5, true), kneeF],
    nearShin: [kneeN, bulgeMid(kneeN, ankleN, 1.6, false), ankleN],
    farShin: [kneeF, bulgeMid(kneeF, ankleF, 1.6, false), ankleF],
    ankleN,
    ankleF,
    toeN,
    toeF: -1,
    soleUp: a >= 0.5,
    lap,
  };
};

/** A foot lying top-down with the sole up (kneeling): the flat-foot drawing flipped about its own height. */
const soleUpFoot = (el: React.ReactElement): React.ReactElement => <g transform="matrix(1 0 0 -1 0 -11.8)">{el}</g>;

/* ------------------------------------------------------------------ */
/* Episode 4: held objects (no glow on any of them, BAL-05)              */
/* ------------------------------------------------------------------ */

const CLAY = "#6e5a49";
const CLAY_LIT = "#937b66";
const CLAY_DARK = "#4a3b2f";
const BEL = "#4f8a3a";
const BEL_DARK = "#2f5a26";
const DOLL_RED = "#d8352b";
const DOLL_RED_DARK = "#9e2119";
const DOLL_YEL = "#f4c22f";
const DOLL_GRN = "#2e9a4c";
const DOLL_WOOD = "#efcf9f";
const DOLL_WOOD_SHADE = "#c89c68";
const BRASS_LIT = "#f3cf7a";
const SMOKE = "#ddd8d0";

/** The rolled clay: a slightly lumpy ball (radius about 8.3). */
const LUMP_PATH = smoothClosed(
  Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * 2 * Math.PI;
    const r = 8.3 + 0.55 * Math.sin(3 * a + 1) + 0.3 * Math.sin(5 * a + 0.4);
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  }),
);

/** A tiny white flower (five petals, yellow eye). */
const whiteFlower = (x: number, y: number, s: number, key: string): React.ReactElement => (
  <g key={key} transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={0} cy={-1.3} rx={0.95} ry={1.4} fill="#fbf8ef" transform={`rotate(${a})`} />
    ))}
    <circle r={0.7} fill="#f2c94c" />
  </g>
);

/** The clay lump; `spin` turns its finger marks as it rolls. */
const clayLumpArt = (spin: number): React.ReactElement => (
  <g>
    <ellipse cx={0.6} cy={1.2} rx={8.9} ry={8.1} fill={CLAY_DARK} />
    <path d={LUMP_PATH} fill={CLAY} />
    <ellipse cx={-2.6} cy={-3.2} rx={3.8} ry={2.6} fill={CLAY_LIT} opacity={0.55} transform="rotate(-25 -2.6 -3.2)" />
    <g transform={`rotate(${spin.toFixed(1)})`}>
      <path d="M-5 -1.5 Q-1 1.2 4.5 -0.8 M-3.5 3.6 Q0 5 3.6 3.2" stroke={CLAY_DARK} strokeWidth={0.8} fill="none" strokeLinecap="round" opacity={0.55} />
    </g>
  </g>
);

/** Charu's clay Shivalinga: a rounded lingam on a small clay base with its spout, a bel leaf on top, two white flowers. */
const clayShivaArt = (): React.ReactElement => (
  <g>
    <path d="M-12 4 Q-12 9.5 0 9.5 Q12 9.5 12 4 Z" fill={CLAY_DARK} />
    <path d="M10 3 L15.5 4.4 Q16.4 5.8 14.6 6.3 L10.4 5.8 Z" fill={CLAY} />
    <ellipse cx={0} cy={4} rx={12} ry={3.4} fill={CLAY} />
    <path d="M-6 4.5 L-6 -6.5 Q-6 -14.5 0 -14.5 Q6 -14.5 6 -6.5 L6 4.5 Q0 6.5 -6 4.5 Z" fill={CLAY} />
    <path d="M2.4 -13.6 Q6 -11.5 6 -6.5 L6 4.5 Q4.2 5.3 2.8 5.4 Z" fill={CLAY_DARK} opacity={0.45} />
    <ellipse cx={-2.7} cy={-8.5} rx={1.7} ry={3.8} fill={CLAY_LIT} opacity={0.5} />
    <path d="M-4.5 -2 Q-1 -0.8 3.4 -2.4 M-4.8 1.6 Q0 2.8 4.2 1.2" stroke={CLAY_DARK} strokeWidth={0.6} fill="none" strokeLinecap="round" opacity={0.5} />
    {/* bel leaf: three leaflets */}
    <g transform="translate(0 -14.2)">
      {[-52, 0, 52].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx={0} cy={-4.6} rx={2.3} ry={4.8} fill={BEL} />
          <path d="M0 -0.5 L0 -8.6" stroke={BEL_DARK} strokeWidth={0.45} />
        </g>
      ))}
    </g>
    {whiteFlower(-8.5, 3.6, 1, "w1")}
    {whiteFlower(7.8, 4.4, 0.9, "w2")}
  </g>
);

/** The painted wooden fair doll: turned, bell-shaped, red with yellow and green bands, big round eyes, red smile. */
const dollArt = (gid: string): React.ReactElement => {
  const body = "M-6 -12 C-7 -4 -10.5 9 -10.5 18.5 Q0 22.5 10.5 18.5 C10.5 9 7 -4 6 -12 Z";
  return (
    <g>
      <defs>
        <clipPath id={`${gid}-doll`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={DOLL_RED} />
      <g clipPath={`url(#${gid}-doll)`}>
        <rect x={-12} y={2.5} width={24} height={4} fill={DOLL_YEL} />
        <rect x={-12} y={13.5} width={24} height={9} fill={DOLL_GRN} />
        <rect x={-12} y={12.4} width={24} height={1.1} fill={DOLL_YEL} />
        <path d="M3 -12 C4 -4 7 9 7.5 22 L12 22 L12 -12 Z" fill={DOLL_RED_DARK} opacity={0.35} />
      </g>
      {[-4, 0, 4].map((x) => (
        <circle key={x} cx={x} cy={9.5} r={0.9} fill="#fff3d6" />
      ))}
      {/* painted arms */}
      <path d="M-5.6 -9 Q-8 -2 -3 1.5 M5.6 -9 Q8 -2 3 1.5" stroke={DOLL_YEL} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <rect x={-4} y={-15} width={8} height={4} rx={1.5} fill={DOLL_YEL} />
      <circle cx={0} cy={-23.5} r={9} fill={DOLL_WOOD} />
      <path d="M3 -31.5 A9 9 0 0 1 3 -15.5 A10 10 0 0 0 3 -31.5 Z" fill={DOLL_WOOD_SHADE} opacity={0.6} />
      <path d="M-9 -24 Q-9 -33 0 -33 Q9 -33 9 -24 Q5 -29.5 0 -29.5 Q-5 -29.5 -9 -24 Z" fill="#1d1410" />
      {[-3.4, 3.4].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-23} r={2.7} fill="#ffffff" />
          <circle cx={x + 0.2} cy={-22.8} r={1.5} fill="#151010" />
          <circle cx={x + 0.7} cy={-23.5} r={0.5} fill="#ffffff" />
        </g>
      ))}
      <circle cx={-5.8} cy={-19.6} r={1.5} fill={DOLL_RED} opacity={0.55} />
      <circle cx={5.8} cy={-19.6} r={1.5} fill={DOLL_RED} opacity={0.55} />
      <path d="M-3.2 -18.6 Q0 -15.8 3.2 -18.6" stroke={DOLL_RED} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** The small standing brass Gobinda with the flute, on a round base: simple and dignified, no face detail, no glow. */
const gobindaArt = (gid: string): React.ReactElement => {
  const br = `url(#${gid}-brass)`;
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}-brass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={BRASS_LIT} />
          <stop offset="0.45" stopColor={BRASS} />
          <stop offset="1" stopColor={BRASS_DARK} />
        </linearGradient>
      </defs>
      <path d="M-12 24 Q-12 28.5 0 28.5 Q12 28.5 12 24 Z" fill={BRASS_DARK} />
      <ellipse cx={0} cy={24} rx={12} ry={3.2} fill={br} />
      <ellipse cx={-2} cy={23.5} rx={7} ry={1.4} fill={BRASS_LIT} opacity={0.45} />
      {/* dhoti and the crossed legs, a gentle tribhanga sway */}
      <path d="M-5 0 C-6 8 -8 16 -7 23 L7 23 C6.5 16 5.5 8 5 0 Z" fill={br} />
      <path d="M-1 3 Q1.5 12 4 22.5 M-3.5 4 Q-4.5 13 -4.5 22.5" stroke={BRASS_DARK} strokeWidth={0.7} fill="none" opacity={0.7} />
      {/* torso, sash */}
      <path d="M-5.5 0.5 L-6.3 -11.5 Q-6 -15 -3 -15.6 L3 -15.6 Q6 -15 6.3 -11.5 L5.5 0.5 Z" fill={br} />
      <ellipse cx={0} cy={0.2} rx={6} ry={1.6} fill={BRASS_DARK} />
      {/* arms raised to the flute, held across to his right */}
      <path d="M-5.6 -13.4 Q-9.4 -10.6 -6.4 -8.6" stroke={br} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <path d="M5.4 -13.6 Q9.6 -12.8 9.8 -11.2" stroke={br} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <path d="M-9.5 -8.4 L16 -12.8" stroke={BRASS_DARK} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-8.5 -8.9 L15 -13" stroke={BRASS_LIT} strokeWidth={0.5} strokeLinecap="round" opacity={0.8} />
      {/* head, crown and the peacock feather */}
      <rect x={-1.6} y={-17.6} width={3.2} height={2.4} fill={BRASS_DARK} />
      <circle cx={0} cy={-21.5} r={5.6} fill={br} />
      <path d="M-4.4 -25 L-3.2 -31 L0 -29 L3.2 -31 L4.4 -25 Z" fill={br} />
      <path d="M2.4 -30 Q6.4 -36 4.6 -40.5 Q1.4 -36 2.4 -30 Z" fill={BRASS} />
      <circle cx={4.4} cy={-36.6} r={1} fill={BRASS_DARK} />
      {/* soft highlights down the lit side */}
      <path d="M-4.6 -12 L-4.2 -1 M-4.6 2 Q-5.8 12 -5.8 22" stroke={BRASS_LIT} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.6} />
      <circle cx={-2.2} cy={-23.4} r={1.4} fill={BRASS_LIT} opacity={0.55} />
    </g>
  );
};

/** A small brass dhoop-dani: a cup on a short foot with a handle, charcoal in it. The smoke is drawn separately. */
const incenseArt = (gid: string): React.ReactElement => (
  <g>
    <defs>
      <linearGradient id={`${gid}-brassi`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={BRASS_LIT} />
        <stop offset="0.45" stopColor={BRASS} />
        <stop offset="1" stopColor={BRASS_DARK} />
      </linearGradient>
    </defs>
    <path d="M8.5 0.5 L22 -4" stroke={BRASS_DARK} strokeWidth={3} strokeLinecap="round" />
    <path d="M9 -0.3 L21.5 -4.6" stroke={BRASS_LIT} strokeWidth={0.8} strokeLinecap="round" opacity={0.7} />
    <circle cx={22.6} cy={-4.3} r={2.1} fill={BRASS} />
    <path d="M-3 5.5 L-2.2 8 L-6 10 L6 10 L2.2 8 L3 5.5 Z" fill={BRASS_DARK} />
    <ellipse cx={0} cy={10} rx={6} ry={1.4} fill={BRASS} />
    <path d="M-10 -3.5 Q-9.5 5 0 6 Q9.5 5 10 -3.5 Z" fill={`url(#${gid}-brassi)`} />
    <ellipse cx={0} cy={-3.5} rx={10} ry={2.6} fill={BRASS_LIT} />
    <ellipse cx={0} cy={-3.3} rx={8.4} ry={1.9} fill="#3b2c22" />
    <circle cx={-2.5} cy={-3.6} r={0.8} fill="#8a8178" />
    <circle cx={2.2} cy={-3.1} r={0.7} fill="#8a8178" />
  </g>
);

/** A thin curl of incense smoke rising straight up from (x, y), drifting on the life clock L. */
const smokeArt = (x: number, y: number, L: number, gid: string): React.ReactElement => {
  const H = 58;
  const wisps = [0, 1, 2].map((i) => {
    const pts: V[] = [];
    for (let j = 0; j <= 9; j++) {
      const amp = 0.4 + j * 0.62;
      pts.push({
        x: x + (i - 1) * 0.6 + amp * Math.sin(L * 0.055 + j * 0.72 + i * 2.1) + 0.25 * j * Math.sin(L * 0.017 + i),
        y: y - (j * H) / 9,
      });
    }
    return smoothOpen(pts);
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}-smoke`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y - H}>
          <stop offset="0" stopColor={SMOKE} stopOpacity={0.75} />
          <stop offset="0.5" stopColor={SMOKE} stopOpacity={0.35} />
          <stop offset="1" stopColor={SMOKE} stopOpacity={0} />
        </linearGradient>
      </defs>
      {wisps.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${gid}-smoke)`} strokeWidth={[1.6, 1.1, 0.8][i]} strokeLinecap="round" />
      ))}
    </g>
  );
};

/**
 * The big carved grey-brown stone bowl with coconut water (`fill` 1 brimming .. 0 empty) and the big whole fopra in
 * it: the one shared drawing (stoneBowlArt in src/cinematic/sets/VedicHouseDay.tsx), in its own bowl units.
 */
const stoneBowlArt = (gid: string, fill: number): React.ReactElement => sharedStoneBowlArt(gid, fill);

/** Draw a held object in its own units (origin at its grip centre, y down). */
const heldArt = (kind: HeldObject, gid: string, fill: number, morph: number, spin: number): React.ReactElement => (
  <g transform={`scale(${GRIP[kind].k})`}>{heldArtRaw(kind, gid, fill, morph, spin)}</g>
);
const heldArtRaw = (kind: HeldObject, gid: string, fill: number, morph: number, spin: number): React.ReactElement => {
  switch (kind) {
    case "clayLump":
      return clayLumpArt(spin);
    case "clayShiva": {
      // Being rolled: the Shiva is squeezed down and the ball takes its place.
      const m = clamp(morph, 0, 1);
      if (m <= 0.001) return clayShivaArt();
      return (
        <g>
          {m < 0.999 && (
            <g opacity={(1 - smooth((m - 0.35) / 0.4)).toFixed(3)} transform={`translate(0 ${(4 * m).toFixed(2)}) scale(${(1 - 0.35 * m).toFixed(3)} ${(1 - 0.6 * m).toFixed(3)})`}>
              {clayShivaArt()}
            </g>
          )}
          <g opacity={smooth((m - 0.2) / 0.5).toFixed(3)}>{clayLumpArt(spin)}</g>
        </g>
      );
    }
    case "doll":
      return dollArt(gid);
    case "gobinda":
      return gobindaArt(gid);
    case "incense":
      return incenseArt(gid);
    case "stoneBowl":
    default:
      return stoneBowlArt(gid, fill);
  }
};

/**
 * From an object's origin (its grip centre) down to its base, in figure units: stand one on a surface at height
 * Y with its origin at Y - HELD_OBJECT_BOTTOM[kind] (times the rig scale).
 */
export const HELD_OBJECT_BOTTOM: Record<HeldObject, number> = {
  clayLump: GRIP.clayLump.bottom,
  clayShiva: GRIP.clayShiva.bottom,
  doll: GRIP.doll.bottom,
  gobinda: GRIP.gobinda.bottom,
  incense: GRIP.incense.bottom,
  stoneBowl: GRIP.stoneBowl.bottom,
};

/**
 * The same objects for the scene to draw where the rig is not holding them (on Charu's plate, on the khat, in
 * Sundar's hands, the bowl back on the floor): identical drawing, so a hand-over shows no jump. (x, y) is the
 * object's origin (its grip centre) in the scene's units, `s` the same scale as the SeatedChild's `s`. `lifeF`
 * drives the incense smoke; `fill` the coconut water (default 1).
 */
export const HeldObjectArt: React.FC<{
  kind: HeldObject;
  x: number;
  y: number;
  s?: number;
  rot?: number;
  fill?: number;
  lifeF?: number;
  flip?: boolean;
  opacity?: number;
}> = ({ kind, x, y, s = 1, rot = 0, fill = 1, lifeF = 0, flip = false, opacity = 1 }) => {
  const gid = "ho" + useId().replace(/[^A-Za-z0-9_-]/g, "");
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(flip ? -s : s).toFixed(4)} ${s.toFixed(4)})`} opacity={opacity}>
      {kind === "incense" && smokeArt(rotV({ x: 0, y: -5 * GRIP.incense.k }, rot).x, rotV({ x: 0, y: -5 * GRIP.incense.k }, rot).y, lifeF, gid)}
      <g transform={`rotate(${rot.toFixed(2)})`}>{heldArt(kind, gid, fill, 0, 0)}</g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

/** Idle weight: full in sitCross and idle, half while pouring or picking up, none while the hands are busy. */
const CALM: Record<SeatedPose, number> = {
  sitCross: 1,
  idle: 1,
  pour: 0.5,
  pickLeaf: 0.5,
  placeFlowerOnFoot: 0,
  bless: 0,
  bowHands: 0,
  palmRaise: 0,
  lookUp: 0,
  reaction: 0,
  kneelReach: 0,
  holdInLap: 0.6,
  holdToChest: 0.5,
  offerUp: 0,
  drinkBowl: 0,
  pointIn: 0.3,
  rollClay: 0.3,
  toss: 0,
  playPebbles: 0.3,
  strokeCow: 0,
  handsTo: 0,
  takeBall: 0.3,
  treasurer: 0.3,
  takeNote: 0.4,
  handOnHead: 0,
};

/** React useId values contain ':' (or other punctuation), which breaks url(#...) references. */
const safeId = (id: string) => "sc3" + id.replace(/[^A-Za-z0-9_-]/g, "");

/** Short curved stroke helper: quadratic from a through control c to b. */
const qd = (a: V, c: V, b: V) => `M${pt(a)} Q${pt(c)} ${pt(b)}`;

/** One curly lock: a round lock with a small ringlet highlight. */
const curl = (cx: number, cy: number, r: number, key: string | number): React.ReactElement => (
  <g key={key}>
    <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={HAIR} />
    <path
      d={`M${(cx - r * 0.55).toFixed(2)} ${(cy + r * 0.05).toFixed(2)} A${(r * 0.55).toFixed(2)} ${(r * 0.55).toFixed(2)} 0 0 1 ${(cx + r * 0.3).toFixed(2)} ${(cy - r * 0.5).toFixed(2)}`}
      fill="none"
      stroke={HAIR_HI}
      strokeWidth={Math.max(0.8, r * 0.2).toFixed(2)}
      strokeLinecap="round"
      opacity={0.75}
    />
  </g>
);

/**
 * Cloth over a thigh: shade silhouette, lit cloth nudged toward the light, a hem around the knee
 * end (the shin comes out from under it), two soft wrap folds near the knee and a knee highlight.
 */
const thighCloth = (pts: V[], radii: number[], base: string, shade: string, fold: string, lit: string = CLOTH_LIT): React.ReactElement => {
  const hip = pts[0];
  const knee = pts[2];
  const d = unit(knee.x - hip.x, knee.y - hip.y);
  let n: V = { x: -d.y, y: d.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y }; // n points up
  const r = radii[2];
  const at = (t: number, along: number, across: number): V => {
    const c = lerpV(pts[1], knee, t);
    return { x: c.x + d.x * along + n.x * across, y: c.y + d.y * along + n.y * across };
  };
  // Hem: an arc just inside the round knee end.
  const hemA = { x: knee.x + n.x * r * 0.92 + d.x * r * 0.1, y: knee.y + n.y * r * 0.92 + d.y * r * 0.1 };
  const hemC = { x: knee.x + d.x * r * 1.05, y: knee.y + d.y * r * 1.05 };
  const hemB = { x: knee.x - n.x * r * 0.92 + d.x * r * 0.1, y: knee.y - n.y * r * 0.92 + d.y * r * 0.1 };
  return (
    <g>
      {legPaint(pts, radii, base, shade)}
      <path d={topEdgeD(pts, radii, { grow: -1.6 })} fill="none" stroke={lit} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
      <path d={qd(at(0.35, 0, r * 0.85), at(0.35, 4, 0), at(0.35, 1, -r * 0.6))} fill="none" stroke={fold} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
      <path d={qd(at(0.7, 0, r * 0.8), at(0.7, 3.5, -r * 0.1), at(0.7, 0.5, -r * 0.7))} fill="none" stroke={fold} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
      <path d={qd(hemA, hemC, hemB)} fill="none" stroke={shade} strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
      {/* Round kneecap under the cloth: a soft dome of light and a crescent of shade beneath it */}
      <ellipse cx={(knee.x + n.x * r * 0.25 - d.x * 2).toFixed(2)} cy={(knee.y + n.y * r * 0.25 - d.y * 2).toFixed(2)} rx={r * 0.75} ry={r * 0.6} fill={lit} opacity={0.22} />
      <path d={qd(at(1, -3, -r * 0.85), at(1, 2.5, -r * 1.05), at(1, r * 0.75, -r * 0.35))} fill="none" stroke={shade} strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
      {kneeHi(knee, lit, 0.45)}
    </g>
  );
};

/**
 * The rig's per-frame solve (pose, breath, lean, head, gaze and arms), shared by SeatedChild and seatedChildHands so
 * the exported hand points are exactly the drawn ones.
 */
function seatedRig(props: SeatedChildProps) {
  const {
    f,
    pose = "sitCross",
    prevPose,
    face,
    poseStart = 0,
    mouth = 0,
    expression,
    prevExpression,
    expressionStart,
    prevPoseStart,
    footFlowers,
    basketAt,
    lifeF,
    talk,
    sigh,
    kneel,
    holding,
    reachFor,
    reachAt,
    pointAt,
    heldFill,
    watchHeld,
    design = "classic",
    age = 5,
    headShake,
    strokeAt,
    strokeDir,
    handTargets,
    handShapes,
    handTurns,
    palmUp,
    blinkAt,
    giveAt,
    pickPlace,
    foldAt,
    build,
  } = props;
  // BAL-26: the "plate" design (Episode 5 on). Everything below is the classic design unless `plate` is set.
  const plate = design === "plate";
  const PAL = plate ? (build === "healthy" ? PLATE_HEALTHY_PAL : PLATE_PAL) : CLASSIC_PAL;
  const ageY = clamp(age - 5, -1, 7);
  /** Plate: the head sits higher on a slim, visible neck (more with age); 0 in the classic design. */
  const headUp = plate ? PLATE_HEAD_UP + 1.2 * ageY : 0;
  const headCY = HEAD_CY - headUp;
  // Life clock: breathing, blinks, saccades, idle eye drift, glances and idle sway run on L.
  const lifeOff = lifeF === undefined ? 0 : lifeF - f;
  const L = f + lifeOff;
  const solveOpts: SolveOpts = {
    footFlowers: footFlowers === undefined ? undefined : clamp(footFlowers, 0, FOOT_FLOWER_SLOTS.length),
    basketAt: basketAt ? { x: basketAt.x, y: basketAt.y } : BASKET_HAND,
    lifeOff,
    seat: kneel,
    holding,
    reachFor,
    reachAt: reachAt ? { x: reachAt.x, y: reachAt.y } : undefined,
    pointAt: pointAt ? { x: pointAt.x, y: pointAt.y } : undefined,
    heldFill,
    watchHeld,
    headCY: plate ? headCY : undefined,
    mouthLocal: plate ? plateMouthAt(age) : undefined,
    strokeAt: strokeAt ? { x: strokeAt.x, y: strokeAt.y } : undefined,
    strokeDir: strokeDir ? { x: strokeDir.x, y: strokeDir.y } : undefined,
    plateRest: plate ? true : undefined,
    handTargets: handTargets ? { near: handTargets.near ? { x: handTargets.near.x, y: handTargets.near.y } : undefined, far: handTargets.far ? { x: handTargets.far.x, y: handTargets.far.y } : undefined } : undefined,
    handShapes,
    handTurns,
    palmUp: palmUp === undefined ? undefined : clamp(palmUp, 0, 1),
    giveAt: giveAt ? { x: giveAt.x, y: giveAt.y } : undefined,
    pickPlace: pickPlace ? pickPlace.map((q) => ({ from: { x: q.from.x, y: q.from.y }, to: { x: q.to.x, y: q.to.y } })) : undefined,
    foldAt,
  };
  const look = clamp(face?.lookX ?? 0, -1, 1);
  const smileBase = clamp(face?.smile ?? 0.5, 0, 1);
  const faceDown = clamp(face?.eyesDown ?? 0, 0, 1);

  // Expression weights, blended over 18 frames from the expression being left.
  const curExpr = expression ?? POSE_EXPRESSION[pose];
  const fromExpr =
    prevExpression ?? (expression === undefined && prevPose ? POSE_EXPRESSION[prevPose] : undefined);
  const eStart = expressionStart ?? poseStart;
  const eu = fromExpr && fromExpr !== curExpr ? smooth((f - eStart) / (fromExpr === "surprised" || curExpr === "surprised" ? 12 : 18)) : 1;
  const ea = exprVec(fromExpr ?? curExpr);
  const eb = exprVec(curExpr);
  const ex: ExprW = {
    joy: lerp(ea.joy, eb.joy, eu),
    thought: lerp(ea.thought, eb.thought, eu),
    comp: lerp(ea.comp, eb.comp, eu),
    play: lerp(ea.play, eb.play, eu),
    sur: lerp(ea.sur, eb.sur, eu),
  };
  // A soft laugh: the mouth opens gently and breathes with an irregular rhythm. Lip-sync (mouth) wins when larger.
  const laugh = ex.joy * (0.3 + 0.07 * wob(f, 12.3, 2.2));
  const mouthOpen = clamp(Math.max(clamp(mouth, 0, 1), laugh), 0, 1);
  const smile = clamp(
    smileBase + 0.45 * ex.joy + 0.22 * ex.comp + 0.28 * ex.play - 0.3 * ex.thought + 0.03 * wob(f, 10.7, 0.3),
    0,
    1.15,
  );

  // Breathing (MOT-20): a child's breath of about 3 s, slightly irregular, quicker in than out with a
  // short rest at the bottom; shallow with small quick inhales while he speaks; an optional sigh.
  // breathAt(ff) takes a story frame; the breath itself runs on the life clock.
  const speak = clamp(talk ?? smooth(clamp(mouth, 0, 1) / 0.3), 0, 1);
  const breathAt = (ff: number) => breathValue(ff + lifeOff, speak, sigh, ff);
  const breathNow = breathAt(f);
  /** Breath amount now: 0 at rest, about 1 at a normal inhale, up to about 2.3 at the top of a sigh. */
  const bN = breathNow.b;

  // Pose, with a 16-frame ease from the previous pose when one is given.
  const solveAt = (ff: number): Solve => {
    const br = breathAt(ff).b;
    const cur = solve(pose, ff, br, poseStart, solveOpts);
    if (prevPose && prevPose !== pose) {
      // Episode 6 poses start from the resting hands themselves: from sitCross / idle they take only a 6-frame blend,
      // so a quick gesture (the clap to the head) keeps its own timing. Every other blend is 16 frames, as before.
      const u = clamp((ff - poseStart) / (EP6_POSES.has(pose) && (prevPose === "sitCross" || prevPose === "idle") ? 6 : 16), 0, 1);
      if (u < 1) {
        // The pose being left runs on its own clock (prevPoseStart), so at u = 0 the blend starts from
        // exactly the pose shown on the frame before the switch and keeps moving as it fades out.
        // Without prevPoseStart a timed placeFlowerOnFoot is taken at its hold point (old behaviour).
        const prevClock =
          prevPoseStart ?? (prevPose === "placeFlowerOnFoot" ? ff - 36 : poseStart);
        const prev = solve(prevPose, ff, br, prevClock, solveOpts);
        return blendSolve(prev, cur, smooth(u));
      }
    }
    return cur;
  };
  const sol = solveAt(f);
  // Overlapping action: the forearm reads the pose 3 frames late, the fingers 6, the head 5;
  // the eyes read it 2 frames early, so they arrive first.
  const before = solveAt(f - 3);
  const fingerLag = solveAt(f - 6);
  const headLag = solveAt(f - 5);
  const eyeLead = solveAt(f + 2);
  // Cloth stir: the free edges move more while the hands or the body are moving.
  const handSpeed =
    (Math.hypot(sol.front.x - before.front.x, sol.front.y - before.front.y) +
      0.6 * Math.hypot(sol.back.x - before.back.x, sol.back.y - before.back.y)) /
    3;
  const stir = clamp(0.22 * handSpeed + 0.1 * (Math.abs(sol.lean - before.lean) / 3), 0, 1.5);
  const flut = (seed: number, amp: number) => amp * ((0.35 + stir) * wob(L, seed, 1.3) + 0.3 * (bN - 0.5));

  // Calm weight eases with the pose blend. The weight shift is up to 4 px at the head and grows with height.
  const blendU = prevPose && prevPose !== pose ? clamp((f - poseStart) / 16, 0, 1) : 1;
  const calm =
    prevPose && prevPose !== pose && blendU < 1 ? lerp(CALM[prevPose], CALM[pose], smooth(blendU)) : CALM[pose];
  // The lap cloth follows the hip shift 6 frames late.
  const shiftLag = 3 * trackAt(WEIGHT_TRACK, L - 6) * calm;

  /*
   * Upper body transform at frame ff: lean about the hips, a small irregular idle sway that grows
   * toward the head (life clock), and the breath. The breath never moves the body as a whole and
   * never scales it: the shoulders rise about 0.8 units (1 px at s = 1.25) on a normal inhale, the
   * chest wall rises about 0.5 and comes forward a touch, and the head follows by about 0.35 units,
   * 4 frames late. In a sigh the shoulders settle a little below rest as he lets the breath go.
   */
  const mkUp = (leanDeg: number, ff: number, hipLift = 0, bendDrop = 0) => {
    // Episode 4: the hips rise when he kneels (hipLift), and a forward bend toward the camera foreshortens the
    // upper body (bendDrop: the shoulder line comes down by that much). Both are 0 in Episode 3.
    const fs = 1 - bendDrop / BEND_H;
    const th = (leanDeg * Math.PI) / 180;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const lf = ff + lifeOff;
    const sw = 1.2 * wob(lf, 0.9, 0.7) + 0.45 * wob(lf, 17.3, 0.23);
    const sh = 3 * trackAt(WEIGHT_TRACK, lf) * calm;
    const br = ff === f ? breathNow : breathAt(ff);
    const b = br.b;
    const settle = br.settle;
    const bHead = breathAt(ff - 4).b;
    return (r: V): V => {
      const h = clamp(-r.y / 106, 0, 1);
      // Shoulder caps (both sides, not the neck), the chest wall below them, and the head and neck top.
      const shoulder = clamp(1 - Math.abs(r.y + 100) / 15, 0, 1) * clamp((Math.abs(r.x) - 6) / 14, 0, 1);
      const chest = clamp(1 - Math.abs(r.y + 86) / 22, 0, 1);
      const head = clamp((-r.y - 106) / 22, 0, 1);
      const lift = 0.8 * b * shoulder + 0.5 * b * chest * (1 - shoulder) + 0.35 * bHead * head;
      const sink = 0.45 * settle * Math.max(shoulder, 0.6 * head);
      const rx = r.x + (r.x > 0 ? 0.25 * b * chest : 0);
      const ry = (r.y - lift + sink) * fs;
      return {
        x: PIVOT.x + rx * cs - ry * sn + (sw + sh) * h,
        y: PIVOT.y - hipLift + rx * sn + ry * cs,
      };
    };
  };
  const up = mkUp(sol.lean, f, kneelLift(sol.kneel ?? 0), sol.drop ?? 0);
  const upPrev = mkUp(before.lean, f - 3, kneelLift(before.kneel ?? 0), before.drop ?? 0);
  /** A cloth point that trails the body: pulled back toward where it was 3 frames ago by k. */
  const drag = (r: V, k: number): V => {
    const a = up(r);
    const b = upPrev(r);
    const dx = clamp((b.x - a.x) * k, -4, 4);
    const dy = clamp((b.y - a.y) * k, -4, 4);
    return { x: a.x + dx, y: a.y + dy };
  };

  // Head: a serene stillness. Very small slow drift, softened glances. It follows the pose 5 frames
  // behind the eyes, and tilts gently with the expression (a kind tilt when compassionate).
  const headTurn = 2.6 * wob(L, 2.7, 0.45) + 0.7 * calm * glanceDeg(L, look) + 4.5 * look;
  const headSway = 0.7 * Math.sin(L * 0.029 + 0.6) + 0.45 * wob(L, 8.8, 0.45);
  const headC = up({ x: 0, y: headCY });
  const exprTilt = 4 * ex.comp + 2.5 * ex.play - 2.5 * ex.thought + 1.2 * ex.joy * wob(f, 15.1, 1.4);
  // Episode 5: the head shake gesture and a pose's turn toward the near side (both exactly 0 in Episodes 3 and 4).
  const shake = headShake === undefined ? 0 : headShakeCurve(f - headShake);
  const poseTurn = lerp(sol.turn ?? 0, headLag.turn ?? 0, 0.7);
  const headRot = lerp(sol.headTilt, headLag.headTilt, 0.7) + headTurn + headSway + exprTilt + 1.6 * shake;
  const sx = clamp(look * 2.5 + headTurn * 0.15 + 2.6 * shake + 2.4 * poseTurn, -3, 3);
  const eyeDown = clamp(faceDown + lerp(sol.eyeDown, eyeLead.eyeDown, 0.6), 0, 1);
  const eyeUp = lerp(sol.eyeUp, eyeLead.eyeUp, 0.6);
  // The eyes start the glance EYE_LEAD frames before the head (they read the glance curve further ahead).
  // The head carries most of a turn toward the speaker; the eyes add only a little, so a resting
  // look never reads as a sideways side-eye.
  const gazeBase = look * 1.2 + 0.2 * wob(L, 6.1, 0.6) + 0.12 * calm * glanceDeg(L + EYE_LEAD, look);
  const gyBase = 0.35 - 1.6 * eyeUp + 1.1 * eyeDown;
  // Looking at what he is working on (water, leaf, flower), in head-local terms.
  const tgtW = eyeLead.gazeAt ? clamp(eyeLead.gazeW ?? 0, 0, 1) : 0;
  let tgx = gazeBase;
  let tgy = gyBase;
  if (eyeLead.gazeAt && tgtW > 0) {
    const ang =
      Math.atan2(eyeLead.gazeAt.y - headC.y, eyeLead.gazeAt.x - headC.x) - (headRot * Math.PI) / 180;
    tgx = 2.3 * Math.cos(ang);
    tgy = 0.35 + 2 * Math.sin(ang);
  }
  // Small saccades on top; the thoughtful gaze settles slightly down (unless the pose looks up).
  const thinkDown = ex.thought * (1 - clamp(eyeUp, 0, 1)) * (1 - tgtW);
  const gazeX = clamp(lerp(gazeBase, tgx, tgtW) - 0.3 * thinkDown + 0.3 * trackAt(SACC_X_TRACK, L) - 0.7 * shake, -2.3, 2.3);
  const gazeY = clamp(lerp(gyBase, tgy, tgtW) + 0.9 * thinkDown + 0.22 * trackAt(SACC_Y_TRACK, L), -1.7, 2.6);
  const blink = blinkAt === undefined ? blinkAmount(L) : Math.max(blinkAmount(L), quickBlink(f - blinkAt));

  // Arms: shoulders follow the upper body (and lift a little when the hand rises), hands follow the
  // pose targets. The upper arm leads; the forearm angle trails it and the fingers trail further.
  const shoulderAt = (rel: V, tgt: V): V => {
    const p = up(rel);
    // Lifts a little when the hand rises; drops and reaches forward a little when the hand goes far down.
    const down = smooth((tgt.y - p.y - 80) / 25);
    return { x: p.x + 2 * down * clamp((tgt.x - p.x) / 12, -1, 1), y: p.y - 1.8 * smooth((p.y + 30 - tgt.y) / 30) + 3.5 * down };
  };
  const shF = shoulderAt(SH_FRONT, sol.front);
  const shB = shoulderAt(SH_BACK, sol.back);
  // Episode 4: while both hands carry an object the forearms trail much less (`rigid`), so the hands stay on it
  // in a quick lift; `elbowDown` prefers the lower elbow for offering and gesturing. Both unset in Episode 3.
  const lagK = sol.rigid ? 0.75 * (1 - 0.85 * clamp(sol.rigid, 0, 1)) : 0.75;
  const elbowDown = (sol.elbowDown ?? 0) > 0.5 ? 1.2 : 0;
  const ikA = (S: V, T: V, side: number) => (elbowDown > 0 ? ikPref(S, T, side, elbowDown) : ik(S, T, side));
  // Episode 6: the near elbow swings through depth about the shoulder-wrist line (0 = the usual bend, 1 = the opposite
  // bend; in between the upper arm and forearm foreshorten), so it can go from raised to low without a jump. The wrist
  // stays exactly on its target. Undefined in every earlier pose (the usual IK, unchanged).
  const ikSwing = (S: V, T: V, side: number, sw: number | undefined) => {
    const r0 = ikA(S, T, side);
    if (sw === undefined) return r0;
    const d = unit(r0.H.x - S.x, r0.H.y - S.y);
    const k = (r0.E.x - S.x) * d.x + (r0.E.y - S.y) * d.y;
    const b = { x: S.x + d.x * k, y: S.y + d.y * k };
    const c = Math.cos(Math.PI * clamp(sw, 0, 1));
    return { E: { x: b.x + (r0.E.x - b.x) * c, y: b.y + (r0.E.y - b.y) * c }, H: r0.H };
  };
  const swingF = sol.elbowSwingF;
  const overlapArm = (sh: V, tgt: V, lagTgt: V, side: number): { E: V; H: V } => {
    const sw = side > 0 ? swingF : undefined;
    const now = ikSwing(sh, tgt, side, sw);
    const lag = ikSwing(sh, lagTgt, side, sw);
    const dn = unit(now.H.x - now.E.x, now.H.y - now.E.y);
    const dl = unit(lag.H.x - lag.E.x, lag.H.y - lag.E.y);
    const dd = unit(lerp(dn.x, dl.x, lagK), lerp(dn.y, dl.y, lagK));
    if (dd.x === 0 && dd.y === 0) return now;
    return { E: now.E, H: { x: now.E.x + dd.x * FORE, y: now.E.y + dd.y * FORE } };
  };
  const armB = overlapArm(shB, sol.back, before.back, -1);
  const armF = overlapArm(shF, sol.front, before.front, 1);
  const dirLag = (a: V, b: V) => unit(lerp(a.x, b.x, 0.55), lerp(a.y, b.y, 0.55));
  const frontDir = dirLag(sol.frontDir, fingerLag.frontDir);
  const backDir = dirLag(sol.backDir, fingerLag.backDir);
  const curlF = lerp(sol.curl ?? 0.3, fingerLag.curl ?? 0.3, 0.6);
  const curlB = lerp(sol.curlB ?? 0.3, fingerLag.curlB ?? 0.3, 0.6);
  // Shared Hand: the shape follows the lagged fingers (a replacement drawing, swapped once the trailing
  // fingers get there), the wrist turn trails like the finger direction.
  const shapeF: HandShape = (fingerLag.shapeF ?? "relaxed");
  const shapeB: HandShape = (fingerLag.shapeB ?? "relaxed");
  const turnF = lerpA(sol.turnF ?? REST_TURN, fingerLag.turnF ?? REST_TURN, 0.55);
  const turnB = lerpA(sol.turnB ?? REST_TURN, fingerLag.turnB ?? REST_TURN, 0.55);
  // Joined palms: the far forearm and hand are drawn again in front of the chest (fading in with the pose).
  const joinOp = smooth(lerp(sol.joinW ?? 0, fingerLag.joinW ?? 0, 0.5));
  return {
    plate,
    PAL,
    ageY,
    headUp,
    headCY,
    lifeOff,
    L,
    solveOpts,
    look,
    smileBase,
    faceDown,
    curExpr,
    ex,
    laugh,
    mouthOpen,
    smile,
    speak,
    breathAt,
    breathNow,
    bN,
    sol,
    before,
    fingerLag,
    headLag,
    eyeLead,
    stir,
    flut,
    blendU,
    calm,
    shiftLag,
    mkUp,
    up,
    upPrev,
    drag,
    headTurn,
    headSway,
    headC,
    exprTilt,
    shake,
    poseTurn,
    headRot,
    sx,
    eyeDown,
    eyeUp,
    thinkDown,
    tgtW,
    gazeX,
    gazeY,
    blink,
    shF,
    shB,
    armB,
    armF,
    frontDir,
    backDir,
    curlF,
    curlB,
    shapeF,
    shapeB,
    turnF,
    turnB,
    joinOp,
  };
}

export const SeatedChild: React.FC<SeatedChildProps> = ({
  x,
  y,
  s = 1,
  f,
  pose = "sitCross",
  prevPose,
  flip = false,
  face,
  poseStart = 0,
  mouth = 0,
  expression,
  prevExpression,
  expressionStart,
  prevPoseStart,
  footFlowers,
  showBasket = false,
  basketAt,
  lifeF,
  talk,
  sigh,
  kneel,
  holding,
  reachFor,
  reachAt,
  pointAt,
  heldFill,
  watchHeld,
  design = "classic",
  age = 5,
  headShake,
  strokeAt,
  strokeDir,
  handTargets,
  handShapes,
  handTurns,
  palmUp,
  blinkAt,
  giveAt,
  pickPlace,
  foldAt,
  propInHands,
  build,
}) => {
  const uid = safeId(useId());
  const {
    plate,
    PAL,
    ageY,
    headUp,
    headCY,
    lifeOff,
    L,
    solveOpts,
    look,
    smileBase,
    faceDown,
    curExpr,
    ex,
    laugh,
    mouthOpen,
    smile,
    speak,
    breathAt,
    breathNow,
    bN,
    sol,
    before,
    fingerLag,
    headLag,
    eyeLead,
    stir,
    flut,
    blendU,
    calm,
    shiftLag,
    mkUp,
    up,
    upPrev,
    drag,
    headTurn,
    headSway,
    headC,
    exprTilt,
    shake,
    poseTurn,
    headRot,
    sx,
    eyeDown,
    eyeUp,
    thinkDown,
    tgtW,
    gazeX,
    gazeY,
    blink,
    shF,
    shB,
    armB,
    armF,
    frontDir,
    backDir,
    curlF,
    curlB,
    shapeF,
    shapeB,
    turnF,
    turnB,
    joinOp,
  } = seatedRig({
    x,
    y,
    s,
    f,
    pose,
    prevPose,
    flip,
    face,
    poseStart,
    mouth,
    expression,
    prevExpression,
    expressionStart,
    prevPoseStart,
    footFlowers,
    showBasket,
    basketAt,
    lifeF,
    talk,
    sigh,
    kneel,
    holding,
    reachFor,
    reachAt,
    pointAt,
    heldFill,
    watchHeld,
    design,
    age,
    headShake,
    strokeAt,
    strokeDir,
    handTargets,
    handShapes,
    handTurns,
    palmUp,
    blinkAt,
    giveAt,
    pickPlace,
    foldAt,
    build,
  });

  const torso = TORSO_REL.map(up);
  const shoulderRim = SHOULDER_RIM_REL.map(up);
  const neckBase = up({ x: 0, y: -100 });
  const neckTop = up({ x: 0, y: -124 - headUp });

  /* ---- Uttariya (chest band and the end falling down the back) ---- */
  const lowerRel = UTT_LOWER.map((p, i) => {
    const w = i === 0 ? 0.3 : 1 - 0.12 * Math.abs(i - 3);
    const k = flut(31 + 1.7 * i, 1.1) * w;
    return { x: p.x + UTT_IN.x * k, y: p.y + UTT_IN.y * k };
  });
  const upperRel = UTT_UPPER.map((p, i) => {
    const k = flut(51 + 1.3 * i, 0.35);
    return { x: p.x - UTT_IN.x * k, y: p.y - UTT_IN.y * k };
  });
  // The free lower hem trails the body slightly; the tucked end (i = 0) stays put.
  const lowerAbs = lowerRel.map((p, i) => drag(p, i === 0 ? 0 : 0.45));
  const bandPts = [...upperRel.map(up), ...lowerAbs];
  const innerFold = [
    ...lowerAbs,
    ...lowerRel
      .map((p, i) => drag({ x: p.x + UTT_IN.x * 3.6, y: p.y + UTT_IN.y * 3.6 }, i === 0 ? 0 : 0.45))
      .reverse(),
  ];
  const bandShadow = [...lowerAbs, ...lowerAbs.map((p) => ({ x: p.x + 1.4, y: p.y + 3.2 })).reverse()];
  const relUp = (pts: V[]) => smoothOpen(pts.map(up));

  // The end over the far shoulder hangs down the back with gravity (straight down, whatever the lean),
  // and trails the body when it moves.
  const tA = up({ x: -21, y: -108 });
  const tB = up({ x: -40.5, y: -92 });
  const tBp = upPrev({ x: -40.5, y: -92 });
  const tv: V = { x: clamp((tBp.x - tB.x) * 1.3, -5, 5), y: clamp((tBp.y - tB.y) * 0.8, -3, 3) };
  const swing = 1.3 * wob(L, 4.4, 0.5) + 0.5 * (bN - 0.5) + 2.4 * stir * wob(L, 9.9, 1.6);
  const TAIL = 80;
  const tail: V[] = [
    tA,
    tB,
    { x: tB.x - 6 + 0.5 * swing + 0.5 * tv.x, y: tB.y + TAIL * 0.45 + 0.5 * tv.y },
    { x: tB.x - 8 + swing + tv.x, y: tB.y + TAIL + tv.y },
    { x: tB.x + 1 + swing + tv.x, y: tB.y + TAIL + 4 + tv.y },
    { x: tB.x + 8 + 0.9 * swing + tv.x, y: tB.y + TAIL + 1 + tv.y },
    { x: tA.x - 3 + 0.6 * swing + 0.5 * tv.x, y: tA.y + TAIL * 0.55 + 0.5 * tv.y },
  ];

  /* ---- Dhoti ---- */
  // Episode 4: kneeling moves the legs and the lap drape (cross-legged geometry exactly as before at 0).
  const kneelNow = clamp(sol.kneel ?? 0, 0, 2);
  const legs = kneelNow > 0 ? kneelLegs(kneelNow) : LEGS_CROSS;
  const kneelW = smooth(clamp(kneelNow, 0, 1));
  const lap = legs.lap.map((p, i) => (i >= 6 && i <= 10 ? { x: p.x, y: p.y + flut(71 + i, 0.45) } : p));
  const hipWrap = HIP_WRAP_REL.map(up);
  const knot = up({ x: 3, y: -33.5 });

  // Pot and water stream (pour pose).
  // Keep props clear of the head: push a point out to HEAD_CLEAR from the head centre if it is inside.
  const clearOf = (p: V): V => {
    const dx = p.x - headC.x;
    const dy = p.y - headC.y;
    const d = Math.hypot(dx, dy);
    if (d >= HEAD_CLEAR) return p;
    if (d < 1e-3) return { x: headC.x + HEAD_CLEAR, y: p.y };
    return { x: headC.x + (dx / d) * HEAD_CLEAR, y: headC.y + (dy / d) * HEAD_CLEAR };
  };
  const potCenter = clearOf({ x: armF.H.x + 4, y: armF.H.y - 7 });
  // A prop held in the near hand sits in the fingers of the drawn (lagged) hand; one lying on the
  // ground, on the foot or in the basket stays exactly where the pose puts it.
  const inFingers = (k: number): V => ({ x: armF.H.x + frontDir.x * k, y: armF.H.y + frontDir.y * k });
  const leafPos = sol.leaf ? clearOf(sol.leaf.held ? inFingers(12) : { x: sol.leaf.x, y: sol.leaf.y }) : null;
  const flowerPos: V | null = sol.flower
    ? sol.flower.held
      ? inFingers(12.5)
      : { x: sol.flower.x, y: sol.flower.y }
    : null;
  const tilt = sol.pot ? sol.pot.tilt : 0;
  const tr = (tilt * Math.PI) / 180;
  const tip: V = {
    x: potCenter.x + 20 * Math.cos(tr) + 6 * Math.sin(tr),
    y: potCenter.y + 20 * Math.sin(tr) - 6 * Math.cos(tr),
  };
  const potOpacity = sol.pot ? (sol.pot.opacity ?? 1) : 0;
  const streamOpacity = sol.pot ? smooth((tilt - 30) / 15) * potOpacity : 0;

  // Face expression shaping (head-local units).
  // Upper lids: a soft, slight lowering at rest (about 15 to 25 percent of the eye), never a heavy
  // flat lid. Joy narrows the eyes from below (cheeks), the playful eyes open a little wider.
  const lidAdd = 0.05 * ex.joy + 0.04 * ex.comp - 0.06 * ex.play + 0.05 * ex.thought;
  /** Lower lid lift: the cheeks push the lower lids up when he smiles warmly or laughs (both eyes alike). */
  const lowLift = clamp(0.9 * ex.joy + 0.25 * ex.comp + 0.3 * ex.play, 0, 1);

  /*
   * Eye: a soft, level almond opening (a child's round eye, no upswept cat-eye corner), clearly open
   * with the upper lid lowered only slightly, a large warm iris and one clear catchlight. The upper lid
   * is an arched curve whose height sets the opening; the iris is clipped to the opening, so the lid
   * shows the face skin itself. A closed eye is a soft downward curve.
   */
  const EIN = 0.5; // inner corner y
  const EOUT = 0.1; // outer corner y
  const ALMOND = `M-6.4 ${EIN} Q0 -8.9 6.4 ${EOUT} Q0 6.6 -6.4 ${EIN}Z`;
  const eyeAt = (cx: number, cy: number, idx: number, scaleX: number): React.ReactElement => {
    const gx = gazeX;
    const gy = gazeY;
    // Resting lid: about 17 percent of the opening; lowers with a downward look, lifts looking up.
    const rest = clamp(0.2 + 0.18 * eyeDown - 0.2 * eyeUp + lidAdd, 0.04, 0.9);
    const k = Math.max(rest, blink);
    const apex = lerp(-4.7, 3.6, k); // lid height at the middle of the eye
    const c = 2 * apex - (EIN + EOUT) / 2; // quadratic control point for that apex
    const lid = `M-6.4 ${EIN} Q0 ${c.toFixed(2)} 6.4 ${EOUT}`;
    // Lower lid: rises with the cheeks (a warm smile or a laugh crinkles the eyes), the same on both eyes.
    const lift = lowLift;
    const lowC = Math.max(6.6 - 3.4 * lift, c + 0.6);
    const below = `M-6.4 ${EIN} Q0 ${c.toFixed(2)} 6.4 ${EOUT} Q0 ${lowC.toFixed(2)} -6.4 ${EIN}Z`;
    const lowMid = (EIN + EOUT) / 4 + lowC / 2; // y of the lower lid at the middle of the eye
    const hlY = Math.max(gy - 1.2, apex + 1.2);
    const eId = `${uid}-e${idx}`;
    const lId = `${uid}-l${idx}`;
    return (
      <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${scaleX} 1)`}>
        <clipPath id={eId}>
          <path d={ALMOND} />
        </clipPath>
        <clipPath id={lId}>
          <path d={below} />
        </clipPath>
        {k < 0.92 && (
          <g clipPath={`url(#${eId})`}>
            <g clipPath={`url(#${lId})`}>
              <path d={ALMOND} fill={EYE_WHITE} />
              <ellipse cx={0} cy={apex.toFixed(2)} rx={7} ry={1.6} fill={EYE_SHADE} opacity={0.45} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={3.95} fill={IRIS} />
              <circle cx={gx.toFixed(2)} cy={(gy + 1.25).toFixed(2)} r={2.6} fill={IRIS_RING} opacity={0.6} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={1.7} fill={PUPIL} />
              <circle cx={(gx + 1.2).toFixed(2)} cy={hlY.toFixed(2)} r={1.4} fill="#ffffff" />
            </g>
          </g>
        )}
        {/* Soft upper-lid crease, fading as the lid lowers */}
        <path
          d="M-5 -4.6 Q0.4 -8.6 5.6 -4.8"
          fill="none"
          stroke={PAL.skinShade}
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={(0.4 * (1 - k)).toFixed(3)}
        />
        {/* Lash line along the lid edge */}
        <path d={lid} fill="none" stroke={LASH} strokeWidth={k > 0.9 ? 1.4 : 1.25} strokeLinecap="round" />
        {/* Lower lid, rising with the cheek; a soft fullness of the cheek just beneath it */}
        <path
          d={`M-4.4 ${(3.3 - 1.2 * lift).toFixed(2)} Q0.2 ${(lowMid + 2.1 - 0.4 * lift).toFixed(2)} 4.8 ${(3 - 1.1 * lift).toFixed(2)}`}
          fill="none"
          stroke={PAL.skinShade}
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={(0.28 + 0.22 * lift).toFixed(3)}
        />
        {lift > 0.02 && (
          <path
            d={`M-3.6 ${(lowMid + 3.4).toFixed(2)} Q0.4 ${(lowMid + 4.8).toFixed(2)} 4.4 ${(lowMid + 3.4).toFixed(2)}`}
            fill="none"
            stroke={PAL.skinLit}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={(0.35 * lift).toFixed(3)}
          />
        )}
        {/* Laugh crinkles at the outer corner: two tiny soft lines, only when joyful */}
        {ex.joy > 0.02 && (
          <path
            d="M7.6 0.6 Q8.9 1.4 9.2 2.8 M7.2 2.4 Q8.2 3.4 8.2 4.6"
            fill="none"
            stroke={PAL.skinShade}
            strokeWidth={0.6}
            strokeLinecap="round"
            opacity={(0.45 * ex.joy).toFixed(3)}
          />
        )}
      </g>
    );
  };

  const flowerOpacity = sol.flower ? sol.flower.opacity : 0;
  // Flowers on the feet: whole ones for the integer part, the newest grows in with the fraction.
  const nFoot = solveOpts.footFlowers ?? 0;
  const footFlowerEls = FOOT_FLOWER_SLOTS.map(([fx0, fy0, rot, sc], i) => {
    const amt = clamp(nFoot - i, 0, 1);
    if (amt <= 0.001) return null;
    const e = smooth(amt);
    return hibiscus(fx0, fy0 - 2 * (1 - e), sc * (0.7 + 0.3 * e), rot, e, `${uid}-hib`, `ff${i}`);
  });
  const leafOpacity = sol.leaf ? sol.leaf.opacity : 0;

  // Face features (head-local units), centred near x = sx + 4.
  const fx = (v: number) => (sx + v).toFixed(2);
  // Brows: relaxed and symmetric. They lift a little in joy and when playful (bright, open face); the
  // inner ends rise very softly when compassionate (kind, never worried).
  const browLift = 1.4 * eyeUp + 0.8 * ex.joy + 0.2 * ex.thought + 0.7 * ex.play;
  const browLiftN = browLift;
  // Episode 6: a pose's troubled knit (takeNote) adds to the inner rise; exactly the old value when unset.
  const browInner = sol.worry === undefined ? 0.45 * ex.comp : 0.45 * ex.comp + lerp(sol.worry, headLag.worry ?? sol.worry, 0.5);
  // Mouth shape.
  const mW = 1 + 0.12 * ex.joy + 0.05 * ex.comp + 0.08 * ex.play - 0.1 * ex.thought; // pressed lips are a touch narrower
  const mx = (v: number) => fx(6.3 + (v - 6.3) * mW);
  const cornerUp = 0.9 * Math.max(0, smile - 0.5);
  const pressed = 0.6 * ex.thought;
  const cheekUp = 1.6 * ex.joy + 0.6 * ex.comp + 0.6 * ex.play;
  // Body detail anchors.
  const leanW = smooth((sol.lean - 10) / 25); // 0 upright, 1 bent well forward
  const farArmRaise = smooth((shB.y + 40 - sol.back.y) / 30);
  const nearArmRaise = smooth((shF.y + 40 - sol.front.y) / 30);
  const belly = up({ x: -5, y: -60 });
  const chinShade = up({ x: 2, y: -112 });

  /* ================================================================== */
  /* BAL-26 "plate" design (Episode 5 on): head, neck shadow and chadar   */
  /* ================================================================== */
  // Built only when `plate` is set; the classic design never reaches this code.
  let plateHeadEl: React.ReactElement | null = null;
  let plateNeckShade: React.ReactElement | null = null;
  let plateWrapEl: React.ReactElement | null = null;
  let plateCapeB: React.ReactElement | null = null;
  let plateCapeShadows: React.ReactElement | null = null;
  let plateCapeF: React.ReactElement | null = null;
  let plateArmOverB: React.ReactElement | null = null;
  let plateArmOverF: ((extra: React.ReactElement | null) => React.ReactElement) | null = null;
  if (plate) {
    /* ---- Head: the shared plate head (one face for every Balak rig, BAL-26), fed with this rig's face state ---- */
    plateHeadEl = (
      <ThakurHeadPlate
        x={headC.x}
        y={headC.y}
        rot={headRot}
        scale={HEAD_K}
        age={age}
        {...(build === "healthy" ? { colors: PLATE_COLORS_HEALTHY, vivid: true } : {})}
        state={{
          turn: sx / 3,
          gazeX,
          gazeY,
          blink,
          lid: clamp(0.16 + 0.18 * eyeDown - 0.2 * eyeUp + lidAdd - 0.14 * ex.sur, 0.04, 0.9),
          lowLift: lowLift * (1 - ex.sur),
          joy: ex.joy,
          comp: ex.comp,
          thought: ex.thought,
          play: ex.play,
          browLift: browLift + 2.6 * ex.sur,
          browInner,
          smile: clamp(smile - 0.45 * ex.sur, 0, 1.15),
          mouthOpen: Math.max(mouthOpen, 0.4 * ex.sur),
          mouthW: mW * (1 - 0.4 * ex.sur),
          pressed,
          cheekUp,
        }}
      />
    );
    const chinY = plateChinY(age);

    /* ---- Neck shadow under the chin ---- */
    const ns = up({ x: 3, y: headCY + (chinY - 4) * HEAD_K });
    plateNeckShade = <ellipse cx={ns.x.toFixed(2)} cy={ns.y.toFixed(2)} rx={11} ry={4.6} fill={PAL.skinShade} opacity={0.5} />;

    /* ---- White kurta (Sundar-like): round collar, tubular torso, short sleeves to the elbow; no hanging chadar. */
    const shirtRel: V[] = [
      { x: -28, y: -98 },
      { x: -26, y: -106 },
      { x: -14, y: -111 },
      { x: -6, y: -109.5 },
      { x: 0, y: -108 },
      { x: 6, y: -109.5 },
      { x: 14, y: -111 },
      { x: 26, y: -106 },
      { x: 28, y: -98 },
      { x: 30, y: -84 },
      { x: 29, y: -66 },
      { x: 29.5, y: -46 },
      { x: 28, y: -28 },
      { x: 26, y: -15 },
      { x: -26, y: -15 },
      { x: -28, y: -28 },
      { x: -29.5, y: -46 },
      { x: -29, y: -66 },
      { x: -30, y: -84 },
    ];
    const shirtPts = shirtRel.map(up);
    plateWrapEl = (
      <g>
        <path d={smoothClosed(shirtPts)} fill={PAL.clothShade} />
        <path d={smoothClosed(shirtPts.map((q) => ({ x: q.x - 0.9, y: q.y - 1 })))} fill={`url(#${uid}-cloth)`} />
        {/* Round collar band */}
        <path d={relUp([{ x: -11, y: -110 }, { x: 0, y: -107 }, { x: 11, y: -110 }])} fill="none" stroke={PAL.clothShade} strokeWidth={1.45} strokeLinecap="round" opacity={0.6} />
        <path d={relUp([{ x: -9, y: -108.5 }, { x: 0, y: -106 }, { x: 9, y: -108.5 }])} fill="none" stroke={PAL.clothLit} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <path d={relUp([{ x: -16, y: -94 }, { x: -4, y: -76 }, { x: 6, y: -56 }])} fill="none" stroke={PAL.clothFold} strokeWidth={1.05} strokeLinecap="round" opacity={0.4} />
        <path d={relUp([{ x: 15, y: -92 }, { x: 6, y: -72 }, { x: -4, y: -52 }])} fill="none" stroke={PAL.clothLit} strokeWidth={1.05} strokeLinecap="round" opacity={0.45} />
        <path d={relUp([{ x: -20, y: -38 }, { x: 0, y: -34 }, { x: 20, y: -38 }])} fill="none" stroke={PAL.clothShade} strokeWidth={1.15} strokeLinecap="round" opacity={0.4} />
      </g>
    );

    /** Short kurta sleeve over the upper arm to just past the elbow. */
    const shirtSleeve = (shP: V, E: V, side: number, lit: boolean): React.ReactElement => {
      const d0 = unit(E.x - shP.x, E.y - shP.y);
      let nrm: V = { x: -d0.y, y: d0.x };
      if (side * nrm.x - nrm.y < 0) nrm = { x: -nrm.x, y: -nrm.y };
      const rSh = 11.5;
      const rEl = 10.2;
      const cuff: V = { x: E.x + d0.x * 5, y: E.y + d0.y * 5 };
      const mid: V = { x: lerp(shP.x, E.x, 0.5), y: lerp(shP.y, E.y, 0.5) };
      const pts: V[] = [
        { x: shP.x - d0.x * 8, y: shP.y - d0.y * 8 },
        { x: shP.x + nrm.x * rSh, y: shP.y + nrm.y * rSh },
        { x: mid.x + nrm.x * (rEl + 1), y: mid.y + nrm.y * (rEl + 1) },
        { x: cuff.x + nrm.x * rEl, y: cuff.y + nrm.y * rEl },
        { x: cuff.x - nrm.x * rEl * 0.88, y: cuff.y - nrm.y * rEl * 0.88 },
        { x: mid.x - nrm.x * (rEl + 0.5), y: mid.y - nrm.y * (rEl + 0.5) },
        { x: shP.x - nrm.x * rSh * 0.92, y: shP.y - nrm.y * rSh * 0.92 },
      ];
      return (
        <g>
          <path d={smoothClosed(pts)} fill={lit ? PAL.cloth : PAL.clothMid} />
          <path d={smoothClosed(pts.map((q) => ({ x: q.x - 0.7, y: q.y - 0.8 })))} fill={`url(#${uid}-cloth)`} opacity={0.92} />
          <path
            d={smoothOpen([
              { x: cuff.x + nrm.x * rEl * 0.8, y: cuff.y + nrm.y * rEl * 0.8 },
              { x: cuff.x - nrm.x * rEl * 0.7, y: cuff.y - nrm.y * rEl * 0.7 },
            ])}
            fill="none"
            stroke={PAL.clothShade}
            strokeWidth={1.15}
            strokeLinecap="round"
            opacity={0.55}
          />
          <path
            d={smoothOpen([
              { x: shP.x + nrm.x * rSh * 0.4, y: shP.y + nrm.y * rSh * 0.4 },
              { x: mid.x + nrm.x * rEl * 0.3, y: mid.y + nrm.y * rEl * 0.3 },
            ])}
            fill="none"
            stroke={PAL.clothLit}
            strokeWidth={1.05}
            strokeLinecap="round"
            opacity={0.45}
          />
        </g>
      );
    };
    plateCapeB = shirtSleeve(shB, armB.E, -1, true);
    plateCapeF = shirtSleeve(shF, armF.E, 1, false);
    plateCapeShadows = null;
    plateArmOverB = null;
    // Held props / far-over redraw in front of the near sleeve (no cape clip / elbow tongue).
    plateArmOverF = (extra: React.ReactElement | null) => (extra ? <g>{extra}</g> : <g />);
  }

  // Episode 4: the held object, placed from the drawn (lagged) wrists so it stays in the hands (MOT-07); an object
  // standing free on the floor stays where the pose puts it.
  let heldEl: React.ReactElement | null = null;
  const ho = sol.obj;
  if (ho && (ho.opacity ?? 1) > 0.01) {
    const P: V = ho.free
      ? { x: ho.x, y: ho.y }
      : lerpV(subV(armF.H, ho.ofsF), subV(armB.H, ho.ofsB), ho.farW);
    const fillNow = clamp(heldFill ?? ho.fill ?? 1, 0, 1);
    const smokeAt = addV(P, rotV({ x: 0, y: -5 * GRIP.incense.k }, ho.rot));
    heldEl = (
      <g opacity={(ho.opacity ?? 1).toFixed(3)}>
        {ho.kind === "incense" && smokeArt(smokeAt.x, smokeAt.y, L, `${uid}-ho`)}
        <g transform={`translate(${P.x.toFixed(2)} ${P.y.toFixed(2)}) rotate(${ho.rot.toFixed(2)})`}>
          {heldArt(ho.kind, `${uid}-ho`, fillNow, ho.morph ?? 0, ho.spin ?? 0)}
        </g>
      </g>
    );
  }

  // Episode 6: the scene's art for what is in his hands, drawn in world coordinates (undone rig transform).
  const propEl = propInHands ? (
    <g transform={`scale(${(1 / (flip ? -s : s)).toFixed(6)} ${(1 / s).toFixed(6)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`}>{propInHands}</g>
  ) : null;
  // Episode 6 (plate): the far forearm and hand that work in front of the chest come over the near side of the chadar
  // too (drawn again with the near forearm), so a ball or note held in both hands is never cut by the cape's edge.
  const farOverEl =
    plate && sol.farOverCape && joinOp > 0.01 ? (
      <g opacity={joinOp.toFixed(3)}>
        <g mask={`url(#${uid}-joinmask)`}>{armPaint(shB, armB.E, armB.H, 0.98, PAL.skinFar, PAL.skinDeep, 0.55, wristRadius(turnB), 6, PAL.skinLit)}</g>
        {childHand(`${uid}-hcB4`, armB.H, backDir, shapeB, turnB, -1, PAL.skinFar, PAL.skinDeep, curlB, wristRadius(turnB), armB.E)}
      </g>
    ) : null;
  const heldAll = propEl ? (
    <>
      {heldEl}
      {propEl}
    </>
  ) : (
    heldEl
  );

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(flip ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>
      {/* Balak glow: drawn by BirulGlow (src/episode03/rig/BirulGlow.tsx), placed by the scene. Nothing is drawn here. */}
      <defs>
        <linearGradient id={`${uid}-torso`} x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0" stopColor={PAL.skinLit} />
          <stop offset="0.5" stopColor={PAL.skin} />
          <stop offset="1" stopColor={PAL.skinFar} />
        </linearGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PAL.clothLit} />
          <stop offset="0.55" stopColor={PAL.cloth} />
          <stop offset="1" stopColor={PAL.clothMid} />
        </linearGradient>
        <radialGradient id={`${uid}-face`} gradientUnits="userSpaceOnUse" cx={-7} cy={-9} r={46}>
          <stop offset="0" stopColor={PAL.skinLit} />
          <stop offset="0.55" stopColor={PAL.skin} />
          <stop offset="1" stopColor={PAL.skinFar} />
        </radialGradient>
        <radialGradient id={`${uid}-hib`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={11}>
          <stop offset="0" stopColor={HIB_CORE} />
          <stop offset="0.22" stopColor={HIB_DEEP} />
          <stop offset="0.55" stopColor={HIB_RED} />
          <stop offset="1" stopColor={HIB_LIGHT} />
        </radialGradient>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0" stopColor={BLUSH} stopOpacity={0.5} />
          <stop offset="0.6" stopColor={BLUSH} stopOpacity={0.22} />
          <stop offset="1" stopColor={BLUSH} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Uttariya end falling down the back, behind everything */}
      {!plate && (
        <>
          <path d={smoothClosed(tail)} fill={PAL.clothMid} />
          <path d={smoothClosed(tail.map((p) => ({ x: p.x - 1.2, y: p.y - 0.6 })))} fill={PAL.cloth} opacity={0.9} />
          <path
            d={smoothOpen([
              lerpV(tA, tB, 0.6),
              { x: tB.x - 2 + 0.7 * swing + 0.5 * tv.x, y: tB.y + TAIL * 0.5 + 0.5 * tv.y },
              { x: tB.x - 1 + swing + tv.x, y: tB.y + TAIL - 2 + tv.y },
            ])}
            fill="none"
            stroke={PAL.clothInner}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.55}
          />
        </>
      )}

      {/* Bare shins and feet in depth order: far foot and shin, the near shin's cast shadow, near foot and shin */}
      {plate ? (
        <>
          {/* Plate design: both bare feet in front of the crossed shins (the hibiscus lands on them, Ep 3); the dhoti
              comes down from the knees to about mid-shin, so the lower shins, ankles and feet show */}
          {legs.soleUp ? soleUpFoot(foot(legs.ankleF, legs.toeF, PAL.skinFar, PAL.skinDeep, PAL.soleFar, PAL.skinLit)) : foot(legs.ankleF, legs.toeF, PAL.skinFar, PAL.skinDeep, PAL.soleFar, PAL.skinLit)}
          {legPaint(legs.farShin, SHIN_R, PAL.skinFar, skinEdge(PAL.skinFar, PAL.skinDeep))}
          {shinCloth(legs.farShin, PAL.clothMid, PAL.clothShade, PAL.clothFold)}
          <path d={limbD(legs.nearShin, SHIN_R, { dx: 2, dy: 3, grow: 0.8 })} fill={PAL.skinUnder} opacity={0.3} />
          {legs.soleUp ? soleUpFoot(foot(legs.ankleN, legs.toeN, PAL.skin, PAL.skinShade, PAL.soleNear, PAL.skinLit)) : foot(legs.ankleN, legs.toeN, PAL.skin, PAL.skinShade, PAL.soleNear, PAL.skinLit)}
          {legPaint(legs.nearShin, SHIN_R, PAL.skin, skinEdge(PAL.skin, PAL.skinShade))}
          <path d={topEdgeD(legs.nearShin, SHIN_R, { grow: -2.8 })} fill="none" stroke={PAL.skinLit} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
          {shinCloth(legs.nearShin, PAL.cloth, PAL.clothShade, PAL.clothFold)}
        </>
      ) : (
        <>
          {legs.soleUp ? soleUpFoot(foot(legs.ankleF, legs.toeF, PAL.skinFar, PAL.skinDeep, PAL.soleFar, PAL.skinLit)) : foot(legs.ankleF, legs.toeF, PAL.skinFar, PAL.skinDeep, PAL.soleFar, PAL.skinLit)}
          {legPaint(legs.farShin, SHIN_R, PAL.skinFar, skinEdge(PAL.skinFar, PAL.skinDeep))}
          <path d={limbD(legs.nearShin, SHIN_R, { dx: 2, dy: 3, grow: 0.8 })} fill={PAL.skinUnder} opacity={0.3} />
          {legs.soleUp ? soleUpFoot(foot(legs.ankleN, legs.toeN, PAL.skin, PAL.skinShade, PAL.soleNear, PAL.skinLit)) : foot(legs.ankleN, legs.toeN, PAL.skin, PAL.skinShade, PAL.soleNear, PAL.skinLit)}
          {legPaint(legs.nearShin, SHIN_R, PAL.skin, skinEdge(PAL.skin, PAL.skinShade))}
          {edgeLine(legs.nearShin, SHIN_R, PAL.rim)}
          {/* Round calves: a soft light on the lit side of each shin, deeper core shade below */}
          <path d={topEdgeD(legs.farShin, SHIN_R, { grow: -2.6 })} fill="none" stroke={PAL.skin} strokeWidth={1.6} strokeLinecap="round" opacity={0.28} />
          <path d={topEdgeD(legs.nearShin, SHIN_R, { grow: -2.8 })} fill="none" stroke={PAL.skinLit} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
          <path d={bottomEdgeD(legs.nearShin, SHIN_R, { grow: -2.6 })} fill="none" stroke={PAL.skinShade} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />
        </>
      )}

      {/* Dhoti: soft contact shadow on the shins, then the cloth over each thigh down to the knee */}
      <path d={limbD(legs.farThigh, THIGH_R, { dx: 1.5, dy: 3.2, grow: 0.3 })} fill={PAL.skinUnder} opacity={0.24} />
      <path d={limbD(legs.nearThigh, THIGH_R, { dx: 1.5, dy: 3.2, grow: 0.3 })} fill={PAL.skinUnder} opacity={0.24} />
      {thighCloth(legs.farThigh, THIGH_R, PAL.clothMid, PAL.clothInner, PAL.clothShade, PAL.clothLit)}
      {thighCloth(legs.nearThigh, THIGH_R, PAL.cloth, PAL.clothShade, PAL.clothFold, PAL.clothLit)}

      {/* Dhoti lap drape: over the thighs, sagging between the knees, front pleats. Follows half the hip shift. */}
      <g transform={`translate(${(shiftLag * 0.5).toFixed(2)} 0)`}>
        <path d={smoothClosed(lap)} fill={PAL.clothShade} />
        <path d={smoothClosed(lap.map((p) => ({ x: p.x - 0.5, y: p.y - 0.8 })))} fill={`url(#${uid}-cloth)`} />
        {/* Shade on the side away from the light */}
        <path
          d={smoothClosed([{ x: 16, y: -62 }, lap[2], lap[3], lap[4], lap[5], lap[6], lap[7], { x: 20, y: -30 }])}
          fill={PAL.clothShade}
          opacity={0.32}
        />
        {(() => {
          const crossFolds = (
            <>
              {/* Soft shadow under the hip wrap */}
              <ellipse cx={1} cy={-47} rx={31} ry={5} fill={PAL.clothShade} opacity={0.45} />
              {/* Tension folds from the hips toward the knees, sag folds between the knees */}
              <path
                d="M-29 -58 Q-43 -49 -55 -40 M29 -58 Q43 -49 55 -40 M-53 -37 Q-30 -26 -5 -29 M53 -37 Q32 -26 15 -29 M-47 -28 Q-26 -22.5 -5 -23.5 M47 -28 Q29 -22.5 16 -23.5"
                fill="none"
                stroke={PAL.clothFold}
                strokeWidth={1.25}
                strokeLinecap="round"
                opacity={0.85}
              />
              <path d="M-50 -39 Q-28 -29 -6 -31.5" fill="none" stroke={PAL.clothLit} strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />
              {!plate && (
                <>
                  {/* Front pleats (kochi): a narrow fan falling from the tuck, darker inner folds */}
                  <path
                    d={smoothClosed([
                      { x: -1, y: -56 },
                      { x: 11, y: -56 },
                      { x: 16, y: -20 + flut(81, 0.4) },
                      { x: 7, y: -18 },
                      { x: -3, y: -19.5 + flut(83, 0.4) },
                    ])}
                    fill={PAL.clothMid}
                  />
                  <path d="M3.5 -55 Q3 -37 2 -19 M7.5 -55 Q9 -37 10.5 -19" fill="none" stroke={PAL.clothInner} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
                  <path d="M0 -55 Q-1 -37 -2 -19.5 M5.5 -55 Q6 -37 6.2 -18.5" fill="none" stroke={PAL.clothLit} strokeWidth={1} strokeLinecap="round" opacity={0.8} />
                </>
              )}
            </>
          );
          if (kneelW <= 0) return crossFolds;
          // Kneeling (Episode 4): the dhoti falls from the waist to the knees; long folds and the kochi pleats
          // run down to the hem. The cross-legged folds fade out as he kneels.
          const top = -56 - kneelLift(kneelNow) * 0.95;
          const kneelFolds = (
            <>
              <ellipse cx={1} cy={top + 9} rx={30} ry={4.5} fill={PAL.clothShade} opacity={0.4} />
              <path
                d={`M-24 ${top} Q-28 ${top + 24} -27 -14 M26 ${top} Q32 ${top + 24} 38 -14 M-12 ${top + 4} Q-14 ${top + 26} -10 -9`}
                fill="none"
                stroke={PAL.clothFold}
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.8}
              />
              <path d={`M-19 ${top + 2} Q-22 ${top + 24} -20 -12`} fill="none" stroke={PAL.clothLit} strokeWidth={1.1} strokeLinecap="round" opacity={0.8} />
              <path
                d={smoothClosed([
                  { x: 0, y: top },
                  { x: 11, y: top },
                  { x: 17, y: -8 + flut(81, 0.4) },
                  { x: 8, y: -6 },
                  { x: -2, y: -7.5 + flut(83, 0.4) },
                ])}
                fill={PAL.clothMid}
              />
              <path d={`M4 ${top + 1} Q4.5 ${top + 22} 4 -7 M8 ${top + 1} Q10 ${top + 22} 12 -7`} fill="none" stroke={PAL.clothInner} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
              <path d={`M1 ${top + 1} Q0.5 ${top + 22} 0 -7.5`} fill="none" stroke={PAL.clothLit} strokeWidth={1} strokeLinecap="round" opacity={0.8} />
            </>
          );
          return (
            <>
              {kneelW < 0.999 && <g opacity={(1 - kneelW).toFixed(3)}>{crossFolds}</g>}
              <g opacity={kneelW.toFixed(3)}>{kneelFolds}</g>
            </>
          );
        })()}
      </g>

      {/* Red hibiscus flowers resting on his feet (footFlowers); the newest eases in with the fraction */}
      {footFlowerEls}

      {/* The rig's own small basket (off by default: the scene owns the basket) */}
      {showBasket && sol.flower && (
        <g transform={`translate(${(solveOpts.basketAt.x - BASKET_HAND.x).toFixed(2)} ${(solveOpts.basketAt.y - BASKET_HAND.y).toFixed(2)})`}>
          <path d={`M64 ${BASKET_RIM_Y} Q66 -3 76 -2 L92 -2 Q102 -3 104 ${BASKET_RIM_Y} Z`} fill={BASKET} />
          <path d={`M66 -12 L102 -12 M68 -7 L100 -7`} fill="none" stroke={BASKET_DARK} strokeWidth={1.2} />
          <ellipse cx={84} cy={BASKET_RIM_Y} rx={20} ry={4.5} fill={BASKET_RIM} />
        </g>
      )}

      {/* Far arm and hand, behind the torso: soft and rounded, no hard joints.
          Plate: far kurta sleeve with it, so the upper arm stays behind the chest in side / ¾ view. */}
      {armPaint(shB, armB.E, armB.H, 0.98, PAL.skinFar, PAL.skinDeep, 0.55, wristRadius(turnB), 0, PAL.skinLit)}
      {childHand(`${uid}-hcB`, armB.H, backDir, shapeB, turnB, -1, PAL.skinFar, PAL.skinDeep, curlB, wristRadius(turnB), armB.E)}
      {plateCapeB}

      {/* Neck: short and soft, behind the torso so only its top shows */}
      {plate ? (
        <ThakurNeckPlate base={neckBase} top={neckTop} scale={HEAD_K} {...(build === "healthy" ? { colors: PLATE_COLORS_HEALTHY } : {})} />
      ) : (
        limb([neckBase, neckTop], [8.6, 8.2], PAL.skin, skinEdge(PAL.skin, PAL.skinShade))
      )}

      {/* Torso: soft child body, a gentle gradient instead of a hard form split (no dark outline, MOT-19) */}
      <path d={smoothClosed(torso)} fill={skinEdge(PAL.skinFar, PAL.skinShade)} />
      <path d={smoothClosed(torso.map((p) => ({ x: p.x - 1.6, y: p.y - 1.1 })))} fill={`url(#${uid}-torso)`} />
      <ellipse cx={belly.x.toFixed(2)} cy={belly.y.toFixed(2)} rx={13} ry={10} fill={PAL.skinLit} opacity={0.22} />
      {!plate && <path d={smoothOpen(shoulderRim)} fill="none" stroke={PAL.rim} strokeWidth={1.2} strokeLinecap="round" opacity={0.45} />}
      {!plate && <path d={smoothOpen([torso[2], torso[3], torso[4]])} fill="none" stroke={PAL.rim} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />}
      {/* Soft chest light, a touch brighter as the chest rises (it does not grow) */}
      <ellipse
        cx={up({ x: 10, y: -86 }).x.toFixed(2)}
        cy={up({ x: 10, y: -86 }).y.toFixed(2)}
        rx={11}
        ry={8}
        fill={PAL.skinLit}
        opacity={(0.16 + 0.03 * Math.min(bN, 1.5)).toFixed(3)}
      />
      {/* A hint of the near collarbone, from the neck to the shoulder, with light along its top */}
      <path d={relUp([{ x: 3, y: -101.5 }, { x: 12, y: -100.4 }, { x: 22, y: -101.2 }])} fill="none" stroke={PAL.skinShade} strokeWidth={0.9} strokeLinecap="round" opacity={0.32} />
      <path d={relUp([{ x: 4, y: -103 }, { x: 12, y: -102 }, { x: 21, y: -102.6 }])} fill="none" stroke={PAL.skinLit} strokeWidth={0.9} strokeLinecap="round" opacity={0.3} />
      {/* The shoulder blade, a soft curve on the back just below the cloth edge */}
      <path
        d={relUp([{ x: -27.5, y: -80 }, { x: -24, y: -73 }, { x: -25.5, y: -64 }])}
        fill="none"
        stroke={PAL.skinDeep}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={(0.22 + 0.12 * farArmRaise).toFixed(3)}
      />
      {/* Little tummy: a soft fold appears above the waist when he bends forward */}
      <path
        d={relUp([{ x: -24, y: -42 }, { x: -14, y: -40 - 1.5 * leanW }, { x: -2, y: -41 }])}
        fill="none"
        stroke={PAL.skinShade}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={(0.45 * leanW).toFixed(3)}
      />

      {/* Head's soft shadow at the base of the neck */}
      {plate ? plateNeckShade : <ellipse cx={chinShade.x.toFixed(2)} cy={chinShade.y.toFixed(2)} rx={8.5} ry={3.2} fill={PAL.skinShade} opacity={0.4} />}

      {/* Plate: white kurta body. Classic: uttariya across the chest. */}
      {plate && plateWrapEl}
      {!plate && (
        <>
          <path d={smoothClosed(bandShadow)} fill={PAL.skinDeep} opacity={0.3} />
          <path d={smoothClosed(bandPts)} fill={PAL.clothShade} />
          <path d={smoothClosed(bandPts.map((p) => ({ x: p.x - 0.9, y: p.y - 1.1 })))} fill={`url(#${uid}-cloth)`} />
          <path d={smoothClosed(innerFold)} fill={PAL.clothInner} opacity={0.5} />
          <path
            d={relUp([
              { x: -32, y: -96 },
              { x: -18, y: -97 },
              { x: -2, y: -84 },
              { x: 14, y: -64 },
              { x: 25, y: -44 },
            ])}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.25}
            strokeLinecap="round"
            opacity={0.85}
          />
          <path
            d={relUp([
              { x: -34, y: -88 },
              { x: -20, y: -84 },
              { x: -6, y: -71 },
              { x: 8, y: -54 },
              { x: 18, y: -40 },
            ])}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.7}
          />
          <path
            d={relUp(upperRel.slice(2, 9).map((p) => ({ x: p.x + 1.4, y: p.y + 1.6 })))}
            fill="none"
            stroke={PAL.clothLit}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.95}
          />
          {/* Fold where the cloth turns over the far shoulder */}
          <path
            d={relUp([
              { x: -35, y: -95 },
              { x: -29, y: -100 },
              { x: -21, y: -103 },
            ])}
            fill="none"
            stroke={PAL.clothShade}
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* Folds that answer the body: the cloth bunches at the near hip when he bends forward, and pulls
          over the far shoulder toward the elbow when that arm rises */}
          <path
            d={`${relUp([{ x: 14, y: -50 }, { x: 20, y: -47 }, { x: 26, y: -48 }])} ${relUp([{ x: 9, y: -44 }, { x: 17, y: -40 }, { x: 25, y: -41 }])}`}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={(0.8 * leanW).toFixed(3)}
          />
          <path
            d={`M${pt(up({ x: -30, y: -100 }))} Q${pt(lerpV(up({ x: -34, y: -94 }), armB.E, 0.15))} ${pt(lerpV(up({ x: -36, y: -88 }), armB.E, 0.25))}`}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={(0.25 + 0.5 * farArmRaise).toFixed(3)}
          />
        </>
      )}
      {/* The near shoulder's skin creases softly toward the armpit when the near arm lifts */}
      <path
        d={`M${pt(up({ x: 24, y: -90 }))} Q${pt(lerpV(up({ x: 27, y: -86 }), armF.E, 0.12))} ${pt(lerpV(up({ x: 28, y: -82 }), armF.E, 0.2))}`}
        fill="none"
        stroke={PAL.skinShade}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={(0.35 * nearArmRaise).toFixed(3)}
      />

      {/* Dhoti hip wrap: rolled waist, a small front tuck, folds from the tuck. Rides on the upper body. */}
      <path d={smoothClosed(hipWrap)} fill={`url(#${uid}-cloth)`} />
      <path d={smoothClosed([hipWrap[3], hipWrap[4], hipWrap[5], hipWrap[6], hipWrap[7]])} fill={PAL.clothShade} opacity={0.3} />
      <path d={smoothOpen(hipWrap.slice(6, 11))} fill="none" stroke={PAL.clothShade} strokeWidth={1.1} strokeLinecap="round" opacity={0.45} />
      {!plate && (
        <>
          <path
            d={relUp([
              { x: 3, y: -31 },
              { x: 0, y: -20 },
              { x: -5, y: -9 },
            ])}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.15}
            strokeLinecap="round"
          />
          <path
            d={relUp([
              { x: 5, y: -31 },
              { x: 10, y: -20 },
              { x: 15, y: -9.5 },
            ])}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1.15}
            strokeLinecap="round"
          />
          <path
            d={relUp([
              { x: -27, y: -30 },
              { x: -18, y: -21 },
              { x: -9, y: -10 },
            ])}
            fill="none"
            stroke={PAL.clothFold}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.7}
          />
          <path d={smoothOpen(hipWrap.slice(0, 5).map((p) => ({ x: p.x, y: p.y + 2 })))} fill="none" stroke={PAL.clothMid} strokeWidth={3.2} strokeLinecap="round" />
          <path d={smoothOpen(hipWrap.slice(0, 5).map((p) => ({ x: p.x - 0.3, y: p.y + 0.9 })))} fill="none" stroke={PAL.clothLit} strokeWidth={1.4} strokeLinecap="round" />
          <ellipse
            cx={knot.x.toFixed(2)}
            cy={knot.y.toFixed(2)}
            rx={4.4}
            ry={3}
            fill={PAL.clothMid}
            transform={`rotate(${sol.lean.toFixed(2)} ${knot.x.toFixed(2)} ${knot.y.toFixed(2)})`}
          />
          <ellipse cx={(knot.x - 0.8).toFixed(2)} cy={(knot.y - 0.8).toFixed(2)} rx={2.4} ry={1.4} fill={PAL.clothLit} opacity={0.9} />
        </>
      )}
      {/* Plate: far forearm + hand only over the kurta (upper arm + sleeve stay behind the chest). */}
      {plate && (sol.farArmFront ?? 0) > 0.3 && (
        <g opacity={smooth(((sol.farArmFront ?? 0) - 0.3) / 0.4).toFixed(3)}>
          {armPaint(shB, armB.E, armB.H, 0.98, PAL.skinFar, PAL.skinDeep, 0.55, wristRadius(turnB), 6, PAL.skinLit)}
          {childHand(`${uid}-hcB5`, armB.H, backDir, shapeB, turnB, -1, PAL.skinFar, PAL.skinDeep, curlB, wristRadius(turnB), armB.E)}
        </g>
      )}
      {plateArmOverB}

      {/* Pot and water stream (pour) */}
      {sol.pot && potOpacity > 0.01 && (
        <g opacity={potOpacity.toFixed(3)}>
          <path
            d={`M${pt(tip)} Q${(tip.x + 4).toFixed(2)} ${((tip.y + POUR_TARGET.y) / 2).toFixed(2)} ${pt(POUR_TARGET)}`}
            fill="none"
            stroke={WATER}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="2.5 4"
            strokeDashoffset={(-f * 1.8).toFixed(2)}
            opacity={(0.9 * streamOpacity).toFixed(3)}
          />
          <g transform={`translate(${potCenter.x.toFixed(2)} ${potCenter.y.toFixed(2)}) rotate(${tilt.toFixed(2)})`}>
            <path d="M9 -3 L19 -8 L21 -4 L10 3 Z" fill={BRASS_DARK} />
            <ellipse rx={13} ry={11} fill={BRASS} />
            <ellipse cy={-10} rx={7} ry={2.4} fill={BRASS_DARK} />
            <ellipse cx={-4} cy={-2} rx={3} ry={5} fill="#e7bb62" opacity={0.6} />
          </g>
        </g>
      )}

      {/* Head: curly hair behind, round child face, ear, hairline, serene features, curls on top. */}
      {plate ? (
        plateHeadEl
      ) : (
        <g transform={`translate(${headC.x.toFixed(2)} ${headC.y.toFixed(2)}) rotate(${headRot.toFixed(2)}) scale(${HEAD_K})`}>
          {/* Hair mass, fuller toward the back of the head */}
          <circle cx={-3} cy={-6} r={33} fill={HAIR} />
          <ellipse cx={-13} cy={-2} rx={26} ry={30} fill={HAIR} />
          {NAPE.map(([cx, cy, r], i) => curl(cx, cy, r, `n${i}`))}

          {/* Face: shade silhouette, then the lit face with a soft radial falloff; round cheeks */}
          <circle r={31} fill={PAL.skinShade} />
          <ellipse cx={4.5} cy={9} rx={27} ry={22} fill={PAL.skinShade} />
          <circle cx={-1.4} cy={-1.3} r={29.6} fill={`url(#${uid}-face)`} />
          <ellipse cx={3.3} cy={7.8} rx={25.8} ry={20.8} fill={`url(#${uid}-face)`} />
          {/* Forehead glow */}
          <ellipse cx={fx(0)} cy={-12} rx={14} ry={7} fill={PAL.skinLit} opacity={0.3} />

          {/* Ear on the far side */}
          <ellipse cx={-26.5} cy={3} rx={5} ry={7} fill={PAL.skinFar} />
          <path d="M-25 -1.5 Q-28.5 2.5 -25.5 7" fill="none" stroke={PAL.skinShade} strokeWidth={1.2} strokeLinecap="round" />

          {/* Hair cap with a soft shadow on the forehead, then the curly fringe */}
          <path
            d="M-35 9.6 L-24.5 5.6 C-22.5 -4.4 -18.5 -14.4 -9.5 -19.4 C-0.5 -23.9 12 -23.9 20 -19.4 C26 -15.4 29 -9.4 31 -2.4 L35 -6.4 C35 -31 18 -41.5 -4 -41.5 C-27 -41.5 -38 -27 -36.5 -6.4 Z"
            fill={PAL.skinShade}
            opacity={0.3}
          />
          <path
            d="M-35 8 L-24.5 4 C-22.5 -6 -18.5 -16 -9.5 -21 C-0.5 -25.5 12 -25.5 20 -21 C26 -17 29 -11 31 -4 L35 -8 C35 -31 18 -41.5 -4 -41.5 C-27 -41.5 -38 -27 -36.5 -8 Z"
            fill={HAIR}
          />
          <ellipse cx={-8} cy={-35.5} rx={13} ry={3.4} fill={HAIR_SHEEN} opacity={0.24} transform="rotate(-8 -8 -35.5)" />

          {/* Eyes: far eye a little narrower (three-quarter turn) */}
          {eyeAt(sx - 5.4, 2.4, 0, 0.88)}
          {eyeAt(sx + 13, 2.4, 1, 1)}

          {/* Brows: thin, soft, gently arched; shaped by the expression */}
          <path
            d={`M${fx(-10.2)} ${(-7.6 - 0.3 * browLift).toFixed(2)} Q${fx(-5.4)} ${(-10.6 - browLift).toFixed(2)} ${fx(-0.8)} ${(-8.6 - browInner - 0.5 * browLift).toFixed(2)} M${fx(7.6)} ${(-8.6 - browInner - 0.5 * browLiftN).toFixed(2)} Q${fx(13)} ${(-11 - browLiftN).toFixed(2)} ${fx(18.6)} ${(-7.8 - 0.3 * browLiftN).toFixed(2)}`}
            fill="none"
            stroke={BROW}
            strokeWidth={1.35}
            strokeLinecap="round"
            opacity={0.72}
          />

          {/* Blush on the round cheeks, which lift and catch the light when he smiles */}
          <ellipse cx={fx(-8)} cy={(10.5 - cheekUp).toFixed(2)} rx={6 * (1 + 0.12 * ex.joy)} ry={4.2} fill={`url(#${uid}-blush)`} />
          <ellipse cx={fx(17.5)} cy={(10.5 - cheekUp).toFixed(2)} rx={7 * (1 + 0.12 * ex.joy)} ry={4.6} fill={`url(#${uid}-blush)`} />
          {cheekUp > 0.05 && (
            <ellipse cx={fx(16.5)} cy={(8.6 - cheekUp).toFixed(2)} rx={4.2} ry={2.2} fill={PAL.skinLit} opacity={(0.18 * cheekUp).toFixed(3)} />
          )}

          {/* Small soft nose */}
          <path d={`M${fx(6.4)} 7.6 Q${fx(8.8)} 11 ${fx(5.6)} 12.3`} fill="none" stroke={PAL.skinShade} strokeWidth={1.25} strokeLinecap="round" opacity={0.7} />
          <circle cx={fx(5.3)} cy={8.8} r={1.1} fill={PAL.skinLit} opacity={0.7} />

          {/* Mouth. Closed: a calm, faint smile with a soft lower lip (pressed and narrower in thought,
            lifted on the near side when playful). Open: rounded, crossfaded by mouthOpen (speech or a soft laugh). */}
          <g opacity={(1 - mouthOpen).toFixed(3)}>
            <path
              d={`M${mx(2)} ${(16.8 - cornerUp).toFixed(2)} Q${mx(6.3)} ${(18.4 + 1.8 * smile - 0.9 * pressed).toFixed(2)} ${mx(10.6)} ${(16.8 - cornerUp).toFixed(2)}`}
              fill="none"
              stroke={MOUTH}
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            {/* Tiny matching upturns at BOTH corners: a symmetric, gentle smile (never a one-sided smirk) */}
            <path
              d={`M${mx(10.5)} ${(16.85 - cornerUp).toFixed(2)} Q${mx(11.3)} ${(16.5 - cornerUp).toFixed(2)} ${mx(11.6)} ${(15.9 - cornerUp).toFixed(2)} M${mx(2.1)} ${(16.85 - cornerUp).toFixed(2)} Q${mx(1.3)} ${(16.5 - cornerUp).toFixed(2)} ${mx(1)} ${(15.9 - cornerUp).toFixed(2)}`}
              fill="none"
              stroke={MOUTH}
              strokeWidth={0.8}
              strokeLinecap="round"
              opacity={clamp(0.45 * smile, 0, 0.6).toFixed(3)}
            />
            <ellipse
              cx={mx(6.3)}
              cy={(20.2 - 0.6 * pressed).toFixed(2)}
              rx={(2.5 * mW * (1 - 0.15 * pressed)).toFixed(2)}
              ry={0.95}
              fill={LIP}
              opacity={(0.45 - 0.1 * pressed).toFixed(3)}
            />
            {pressed > 0.02 && (
              <path d={`M${mx(4.6)} 22.6 Q${mx(6.3)} 23.4 ${mx(8)} 22.6`} fill="none" stroke={PAL.skinShade} strokeWidth={0.7} strokeLinecap="round" opacity={(0.25 * pressed).toFixed(3)} />
            )}
          </g>
          {mouthOpen > 0.01 && (
            <g opacity={mouthOpen.toFixed(3)}>
              <path
                d={`M${mx(2.4)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Q${mx(6.2)} ${(16.2 + 0.4 * ex.joy).toFixed(2)} ${mx(10.2)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Q${mx(9.8)} ${(17.6 + 4 * mouthOpen).toFixed(2)} ${mx(6.2)} ${(18 + 4.6 * mouthOpen).toFixed(2)} Q${mx(2.6)} ${(17.6 + 4 * mouthOpen).toFixed(2)} ${mx(2.4)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Z`}
                fill={MOUTH_DARK}
              />
              {/* A glimpse of small upper teeth in a soft laugh */}
              {ex.joy > 0.05 && mouthOpen > 0.15 && (
                <path
                  d={`M${mx(3.6)} ${(17 - 0.5 * cornerUp).toFixed(2)} Q${mx(6.2)} ${(17.1 + 0.4 * ex.joy).toFixed(2)} ${mx(8.9)} ${(17 - 0.5 * cornerUp).toFixed(2)} Q${mx(6.2)} ${(18.1 + 0.4 * ex.joy).toFixed(2)} ${mx(3.6)} ${(17 - 0.5 * cornerUp).toFixed(2)} Z`}
                  fill={EYE_WHITE}
                  opacity={(0.6 * ex.joy * smooth((mouthOpen - 0.15) / 0.15)).toFixed(3)}
                />
              )}
              <ellipse cx={mx(6.2)} cy={(17.5 + 3 * mouthOpen).toFixed(2)} rx={2.3 * mW} ry={(0.6 + 1.1 * mouthOpen).toFixed(2)} fill={MOUTH_INNER} />
            </g>
          )}
          {/* Soft chin */}
          <path d={`M${fx(3.6)} 24 Q${fx(6.2)} 25.4 ${fx(8.8)} 24`} fill="none" stroke={PAL.skinShade} strokeWidth={0.9} strokeLinecap="round" opacity={0.3} />

          {/* Curly fringe along the hairline, then the crown curls on the silhouette */}
          {FRINGE.map(([cx, cy, r], i) => curl(cx, cy, r, `f${i}`))}
          {CROWN.map(([a, r], i) => {
            const rad = (a * Math.PI) / 180;
            return curl(-3 + Math.cos(rad) * 31.5, -6 + Math.sin(rad) * 31.5, r, `c${i}`);
          })}
        </g>
      )}

      {/* Pranam: the far forearm and hand in front of the chest and the cloth, so both palms read joined.
          The forearm copy fades in from 14 to 20 units past the elbow (a soft mask, where nothing overlaps
          the arm), so the elbow and upper arm drawn behind show unchanged and no seam shows. */}
      {joinOp > 0.01 && (
        <g opacity={joinOp.toFixed(3)}>
          <defs>
            <linearGradient id={`${uid}-joingrad`} gradientUnits="userSpaceOnUse" x1={14} y1={0} x2={20} y2={0}>
              <stop offset={0} stopColor="#fff" stopOpacity={0} />
              <stop offset={1} stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`${uid}-joinmask`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
              <rect
                x={0}
                y={-60}
                width={200}
                height={120}
                fill={`url(#${uid}-joingrad)`}
                transform={`translate(${armB.E.x.toFixed(2)} ${armB.E.y.toFixed(2)}) rotate(${((Math.atan2(armB.H.y - armB.E.y, armB.H.x - armB.E.x) * 180) / Math.PI).toFixed(2)})`}
              />
            </mask>
          </defs>
          <g mask={`url(#${uid}-joinmask)`}>{armPaint(shB, armB.E, armB.H, 0.98, PAL.skinFar, PAL.skinDeep, 0.55, wristRadius(turnB), 6, PAL.skinLit)}</g>
          {childHand(`${uid}-hcB2`, armB.H, backDir, shapeB, turnB, -1, PAL.skinFar, PAL.skinDeep, curlB, wristRadius(turnB), armB.E)}
        </g>
      )}

      {/* Episode 4: the held object, between the far hand (behind it) and the near hand (in front); Episode 6: the
          scene's propInHands in the same slot */}
      {heldAll}

      {/* Near arm and hand, in front of the head so the thinking hand reads at the chin */}
      {armPaint(shF, armF.E, armF.H, 1.02, PAL.skin, PAL.skinShade, 1, wristRadius(turnF), 0, PAL.skinLit)}
      {childHand(`${uid}-hcF`, armF.H, frontDir, shapeF, turnF, 1, PAL.skin, PAL.skinShade, curlF, wristRadius(turnF), armF.E)}
      {/* Plate: near kurta sleeve, then held props / far-over redraw in front */}
      {plateCapeF}
      {plateArmOverF && plateArmOverF(farOverEl ? <>{farOverEl}{heldAll}</> : heldAll)}

      {/* Leaf (pickLeaf) and flower (placeFlowerOnFoot): drawn after the hand so they read in it */}
      {sol.leaf && leafPos && leafOpacity > 0.01 && (
        <g opacity={leafOpacity} transform={`translate(${leafPos.x.toFixed(2)} ${leafPos.y.toFixed(2)}) rotate(-18)`}>
          <ellipse rx={9} ry={4.2} fill={LEAF} />
          <path d="M-7 0 L6 0" stroke={LEAF_DARK} strokeWidth={0.9} />
        </g>
      )}
      {sol.flower && flowerOpacity > 0.01 &&
        hibiscus(
          (flowerPos ?? sol.flower).x,
          (flowerPos ?? sol.flower).y,
          sol.flower.held ? 0.92 : 1,
          sol.flower.held ? -30 + (Math.atan2(frontDir.y, frontDir.x) * 180) / Math.PI * 0.3 : -12,
          flowerOpacity,
          `${uid}-hib`,
        )}
      {/* Episode 5: the pebble between the near hand's fingertips (playPebbles) */}
      {sol.pebble && sol.pebble.opacity > 0.01 && (() => {
        const pp = inFingers(16);
        return (
          <g opacity={sol.pebble.opacity.toFixed(3)}>
            <ellipse cx={pp.x.toFixed(2)} cy={pp.y.toFixed(2)} rx={3.8} ry={2.7} fill="#a69c8f" />
            <ellipse cx={(pp.x - 0.9).toFixed(2)} cy={(pp.y - 0.7).toFixed(2)} rx={1.2} ry={0.7} fill="#ffffff" opacity={0.3} />
          </g>
        );
      })()}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Episode 5: drawn hand points for attaching props and other hands       */
/* ------------------------------------------------------------------ */

export interface SeatedHandPoints {
  /** Palm centres and wrists of the near and far hands, in world (screen) coordinates, exactly as drawn this frame. */
  nearPalm: { x: number; y: number };
  farPalm: { x: number; y: number };
  nearWrist: { x: number; y: number };
  farWrist: { x: number; y: number };
  /** The near hand's little-finger edge at the palm's middle (world): where a tortoise's jaw takes hold. */
  nearLittleEdge: { x: number; y: number };
  /** Unit vectors from wrist toward the fingertips (world; x already mirrored when flipped). */
  nearDir: { x: number; y: number };
  farDir: { x: number; y: number };
  /** Head centre (world) and a BirulGlow placement: <BirulGlow cx={g.cx} cy={g.cy} r={g.r} glow={...} f={lifeF} />. */
  head: { x: number; y: number };
  glowAnchor: { cx: number; cy: number; r: number };
}

/**
 * Where the rig draws its hands this frame, for the same props as the <SeatedChild> it describes (pass the very same
 * object). Uses the rig's own solve (seatedRig), so the points match the drawing exactly, including the forearm overlap,
 * pose blends, breath and flip.
 */
/**
 * Episode 3: world position of foot-flower slot i (0, 1, 2: the flowers placeFlowerOnFoot lays on his feet, the same
 * slots the rig draws for `footFlowers`), for a rig at x, y, s, flip; slot -1 = SEATED_FOOT_TOP.
 */
export const seatedFootFlowerAt = (i: number, at: { x: number; y: number; s?: number; flip?: boolean }): { x: number; y: number; rot: number; scale: number } => {
  const s = at.s ?? 1;
  const kx = at.flip ? -s : s;
  const sl = i < 0 ? [SEATED_FOOT_TOP.x, SEATED_FOOT_TOP.y, -12, 1] : FOOT_FLOWER_SLOTS[Math.max(0, Math.min(FOOT_FLOWER_SLOTS.length - 1, Math.round(i)))];
  return { x: at.x + kx * sl[0], y: at.y + s * sl[1], rot: at.flip ? -sl[2] : sl[2], scale: sl[3] * s };
};

export const seatedChildHands = (props: SeatedChildProps): SeatedHandPoints => {
  const R = seatedRig(props);
  const s = props.s ?? 1;
  const kx = props.flip ? -s : s;
  const W = (p: V) => ({ x: props.x + kx * p.x, y: props.y + s * p.y });
  const D = (d: V) => unit(kx * d.x, s * d.y);
  const palm = (H: V, d: V): V => ({ x: H.x + d.x * PALM_OFS, y: H.y + d.y * PALM_OFS });
  // Little-finger edge: across the palm, on the side away from the thumb (Hand.tsx: near hand, screen x of the thumb
  // = +cos(turn) in hand space), at the palm's middle.
  const d = R.frontDir;
  const rot = Math.atan2(-d.x, d.y);
  const lx = -Math.cos(R.turnF) * PALM_HALF_W;
  const ly = PALM_OFS;
  const edge = { x: R.armF.H.x + lx * Math.cos(rot) - ly * Math.sin(rot), y: R.armF.H.y + lx * Math.sin(rot) + ly * Math.cos(rot) };
  const head = W(R.headC);
  return {
    nearPalm: W(palm(R.armF.H, R.frontDir)),
    farPalm: W(palm(R.armB.H, R.backDir)),
    nearWrist: W(R.armF.H),
    farWrist: W(R.armB.H),
    nearLittleEdge: W(edge),
    nearDir: D(R.frontDir),
    farDir: D(R.backDir),
    head,
    glowAnchor: { cx: head.x, cy: head.y, r: 140 * s },
  };
};

/* ------------------------------------------------------------------ */
/* Episode 6: anchors for the ball, the note, the pinched item, the head */
/* ------------------------------------------------------------------ */

export interface SeatedEp6Anchors {
  /** Palm centres of the near and far hands (world), exactly as drawn this frame: the ball's two contact points. */
  nearPalm: { x: number; y: number };
  farPalm: { x: number; y: number };
  /**
   * Between the near hand's fingertips (world): where a small item sits while the treasurer carries it (draw it AFTER the
   * SeatedChild, centred here), and the hand's contact point on the cloth when it picks or sets one down.
   */
  nearPinch: { x: number; y: number };
  /** takeBall: the ball's centre and radius (world). `inHands` false while the giver still holds it (at giveAt). */
  ball?: { x: number; y: number; r: number; inHands: boolean };
  /**
   * takeNote: the folded note's centre (world), its angle in degrees (mirrored when flipped), its size (world units), and
   * `fold` 0..1 (his hands closed round it: draw it a little smaller or let the near hand hide it). `inHands` as for ball.
   */
  note?: { x: number; y: number; rot: number; w: number; h: number; inHands: boolean; fold: number };
  /** Top of the hair on the head's axis (world): where the palm lands in handOnHead. */
  headTop: { x: number; y: number };
  /** Head centre (world) and the BirulGlow placement, as seatedChildHands. */
  head: { x: number; y: number };
  glowAnchor: { cx: number; cy: number; r: number };
}

/**
 * Episode 6 anchors for the same props as the <SeatedChild> they describe (pass the very same object, including
 * `design`, `age` and the clocks). Uses the rig's own solve, so the points match the drawing exactly (forearm overlap,
 * pose blends, breath, flip). Draw the ball / note at these points through the rig's `propInHands` slot (between the far
 * and the near hand), and the treasurer's carried item at `nearPinch` after the rig.
 */
export const seatedEp6Anchors = (props: SeatedChildProps): SeatedEp6Anchors => {
  const R = seatedRig(props);
  const s = props.s ?? 1;
  const kx = props.flip ? -s : s;
  const W = (p: V) => ({ x: props.x + kx * p.x, y: props.y + s * p.y });
  const palm = (H: V, d: V): V => ({ x: H.x + d.x * PALM_OFS, y: H.y + d.y * PALM_OFS });
  const head = W(R.headC);
  const hairTop = (R.plate ? PLATE_HAIR_TOP : -41.5) * HEAD_K;
  const out: SeatedEp6Anchors = {
    nearPalm: W(palm(R.armF.H, R.frontDir)),
    farPalm: W(palm(R.armB.H, R.backDir)),
    nearPinch: W({ x: R.armF.H.x + R.frontDir.x * 16, y: R.armF.H.y + R.frontDir.y * 16 }),
    headTop: W(addV(R.headC, rotV({ x: 0, y: hairTop }, R.headRot))),
    head,
    glowAnchor: { cx: head.x, cy: head.y, r: 140 * s },
  };
  const h6 = R.sol.hold6;
  if (h6) {
    const P: V = h6.free ? { x: h6.x, y: h6.y } : lerpV(subV(R.armF.H, h6.ofsF), subV(R.armB.H, h6.ofsB), h6.farW);
    const c = W(P);
    if (h6.kind === "ball") out.ball = { x: c.x, y: c.y, r: BALL_R * s, inHands: !h6.free };
    else
      out.note = {
        x: c.x,
        y: c.y,
        rot: props.flip ? -h6.rot : h6.rot,
        w: NOTE_SIZE.w * s,
        h: NOTE_SIZE.h * s,
        inHands: !h6.free,
        fold: h6.fold,
      };
  }
  return out;
};
