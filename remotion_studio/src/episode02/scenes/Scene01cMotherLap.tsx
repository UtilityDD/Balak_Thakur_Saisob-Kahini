import React from "react";
import { clamp, flicker, hash, lerp, makeActing, noise1, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineDefs } from "../../cinematic/divine/Divine";
import { Bokeh, Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { BASE_POSE, Pose, Puppet, puppetBreath, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { Madur } from "../../cinematic/sets/S05_Sets";
import { cueLocalStory, pausesFor, storyToReal, useStory } from "../../episode/storyClock";
import { EP02_SCENES } from "../timing";

/**
 * Episode 2 · scene 01c — "Mother's Lap" (warm birth ward, quiet).
 * Narration: "Only mother Charu's arms and milk soothe him."
 *  1. Charu sits on a madur; the calm newborn lies on it in front of her lap. She reaches down and
 *     slides her palms under his head and bottom.
 *  2. She lifts him on her arms (eased) into a cradle hold against her chest: near forearm level
 *     under his bottom and thighs, far arm around his back with his head in its crook. Her arm
 *     angles are solved from his body every frame, so both hands touch him whenever he is off the mat.
 *  3. She rocks him slowly; her body and head sway, and the newborn moves with her.
 *  4. She gazes down at him tenderly, then kisses his forehead once near the end.
 * Look rules: the white-gold divine light is used only on Balak Thakur (BabyThakur, steady aura,
 * no pulse with breathing: MOT-20). Charu and the room use warm day and lamp light only. No ornaments on Balak.
 *
 * Clocks (CAM-14, storyClock.ts): every story key below is in authored ("story") frames, read from `f`; the
 * real local frame `lifeF` drives breathing, blinks, the rock after the narration, the lamp and the motes.
 * Inside this file a frame is addressed as (fr, off): story frame fr and life frame fr + off, where
 * off = lifeF - f on the current frame. Puppet samples its acting at fr = f +/- k; the acting closure passes the
 * same off, so the arm angles solved here use exactly the torso (lean, breath) that Puppet draws.
 * Pauses (plan "Scene 01c", approved STO-16):
 *  P1 open, 24 f before "আর মা চারুশীলা…": Charu, seated, gazes down at him on the mat before she reaches
 *     (a soft smile and head tilt rise and settle); he looks up at her; her breath, his blinks.
 *  P2 end, 36 f after "…নেয় না!" (after the 2 s hold already there): the close two-shot holds; she rocks him
 *     very slowly (on the life clock, so it never stops), he looks up at her face, she smiles down.
 */

const SCENE_ID = "01c_mother_lap";
/** Where the narrated content ends (story frames). Every narration-synced key below is unchanged. */
const CONTENT_END = 175;
/** Last frame of the narrated content: the kiss-and-return lands here, as before. */
const LAST = CONTENT_END - 1;
const PAUSES = pausesFor(SCENE_ID);
/** P1: the open pause (frames) before the first line; the life clock runs this far ahead of the story after it. */
const OPEN = PAUSES.find((p) => p.atStory === 0)?.frames ?? 0;
const END_PAUSE = PAUSES.find((p) => p.atStory > 0);
/** Real local frame where P2 (the end pause) begins. */
const P2_START = END_PAUSE ? storyToReal(END_PAUSE.atStory, PAUSES) : Infinity;
/**
 * The scene's story length (real length minus its pauses): it runs on past CONTENT_END by a breathing hold.
 * In that hold and in P2 the last beat holds: Charu keeps him in the cradle and rocks very slowly, both keep
 * their idle life. No new events.
 */
const STORY_FRAMES = Math.max(
  CONTENT_END,
  (EP02_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? CONTENT_END) -
    PAUSES.reduce((s, p) => s + p.frames, 0),
);
const END = STORY_FRAMES - 1;
/** Rock clock: equals the story frame between the pauses and keeps running through P2 (life - P1). */
const rockT = (fr: number, off: number) => fr + off - OPEN;
/** The rock after the narration, 0 just before CONTENT_END rising softly to 1 over 18 frames (rock clock). */
const breathIn = (t: number) => sineInOut((t - (CONTENT_END - 4)) / 18);
/** Slow phase for the rock, 0 at CONTENT_END, so every rock layer starts from rest (rock clock). */
const breathPh = (t: number) => Math.max(0, t - CONTENT_END) * 0.11;
/** P1 moment on the life clock: rises over the pause's first half second and settles as the reach begins. */
const p1K = (life: number) => (OPEN > 0 ? sineInOut(life / 12) * (1 - sineInOut((life - OPEN + 6) / 14)) : 0);
/** P2 moment on the life clock: eases in over 20 frames and holds to the cut. */
const p2K = (life: number) => sineInOut((life - P2_START) / 20);
// Same placement as the lap in Scene01Shashthi: the newborn ends up in Charu's arms over her lap.
const CHARU = { x: 1400, y: 700, s: 1.5 };
/** Charu's body yaw, held for the whole scene (the acting below keys it at f 0 and never changes it). */
const BODY_TURN = -0.3;
/**
 * Stillness 1 switches off the Puppet's follow-through (elbow lag, wrist flick, anticipation dips and the idle
 * layer), so the arm angles solved here are exactly the ones drawn and her hands stay locked on the baby.
 */
const STILLNESS = 1;
/**
 * The madur in front of her lap: where he lies before she lifts him (centre and body rotation). It sits just
 * inside the reach of her seated arms, so her palms can slide under his head and bottom.
 */
const MAT_REST = { x: CHARU.x - 8, y: 618, rot: -4 };
/** f 0 to REACH_END: both arms reach down beside him; REACH_END to UNDER_END: the palms slide under him. */
const REACH_END = 20;
const UNDER_END = 30;
/** The lift runs UNDER_END to LIFT_END (36 frames), eased at both ends; he moves only on her arms. */
const LIFT_END = 66;
/** In her arms he settles a little lower into the cradle, f 83 to 123. */
const SETTLE_START = 83;
const SETTLE_END = 123;
const BABY_S = 1.1;

/**
 * Contact points on the newborn in his own (unscaled) body frame: head at the left (-50, -10), his bottom
 * near (40, 25); +v is the underside of his body (his back, as he lies face up). Her palms sit just under
 * that edge, so each hand shows below his outline and touches it.
 */
const NEAR_MAT = { u: 42, v: 32 }; // near palm under his bottom while he lies on the madur
const NEAR_HOLD = { u: 44, v: 33 }; // near palm under his bottom; the forearm runs on under his thighs
const FAR_MAT = { u: -38, v: 30 }; // far palm under his head and shoulders on the madur
const FAR_HOLD = { u: 14, v: 32 }; // far palm on his back; the far elbow takes his head in its crook
/** Near shoulder angle in the hold (deg), at the chest and after the settle. */
const SH_CHEST = 4;
const SH_LAP = 6;
/** His body rotation in the hold (positive = head up): diagonal against her chest, a little flatter in the lap. */
const RH_CHEST = 18;
const RH_LAP = 13;
/** Her lean when the near forearm is exactly horizontal; when she rocks, the whole hold rocks with her. */
const LEAN_REF = 6;

const WINDOWS = [
  { x: 220, y: 170, w: 260, h: 300 },
  { x: 1000, y: 170, w: 260, h: 300 },
  { x: 1720, y: 170, w: 260, h: 300 },
];

const DAY_LIGHTS: SceneLight[] = [
  { x: 1880, y: 330, color: "#ffc878", intensity: 0.55, radius: 1400 },
  // the niche clay lamp: a soft warm fill that breathes with the flame
  { x: 640, y: 414, color: "#ffb05a", intensity: 0.22, radius: 1100, flicker: 55 },
];

/** Soft lamp flicker factor around 1 (0.8..1.12), shared by the niche glow and the warm grade. */
const lampAt = (f: number) => clamp(1 + 1.1 * (flicker(f, 55) - 0.86), 0.8, 1.12);

function sineInOut(t: number) {
  return (1 - Math.cos(clamp(t) * Math.PI)) / 2;
}
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Charu: head and body acting                                         */
/* ------------------------------------------------------------------ */

// Cue sync, story frames. Cue 0-101 is the lap line ("…কোল বা"): the cue starts at story 0 (after P1), so
// the reach begins on the line and she has him settled in her arms by f 123. Cue 101-170 is the soothing line
// ("দুধ সে কিছুতেই নেয় না!"): the rock starts a few frames before it (f 96).

/** Head and body: the lift leans in; from f 96 she rocks him, then the kiss and the return. */
const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: BODY_TURN, headTurn: -0.15, headTilt: 8, headNod: 6, eyeX: 0.15, eyeY: 0.85, lid: 0.3, smile: 0.55, lean: 3 },
  // lean over him while the palms slide under
  { f: 20, ease: "inOut", in: 20, lean: 9, headNod: 12, eyeY: 0.9, lid: 0.3, smile: 0.6 },
  { f: LIFT_END, ease: "inOut", in: LIFT_END - UNDER_END, lean: 6, headNod: 9, eyeY: 0.92, lid: 0.3, brow: 0.15 },
  // rock: a slow, uneven sway with a drift of the head; the eyes settle on him
  { f: 116, ease: "inOut", in: 20, lean: 5, headNod: 6, headTilt: 12, headTurn: 0.1, eyeX: 0.05, eyeY: 0.88, smile: 0.65, brow: 0.1 },
  { f: 136, ease: "inOut", in: 18, lean: -1, headTilt: 3, headTurn: -0.1, eyeX: -0.05 },
  // kiss: head dips toward his forehead, eyes close, brows soften up
  { f: 152, ease: "inOut", in: 14, lean: 6, headNod: 15, headTurn: 0.2, eyeX: 0, eyeY: 1, lid: 0.75, smile: 0.7, brow: 0.2 },
  // return: lifts back, eyes open again, a soft smile remains
  { f: LAST, ease: "inOut", in: 12, lean: 2, headNod: 6, headTilt: 6, headTurn: 0, eyeX: 0.05, eyeY: 0.88, lid: 0.3, smile: 0.7, brow: 0.1 },
]);
/**
 * Story keys plus the pause moments and the rock after the narration. The rock runs on the rock clock (very
 * slowly and a little unevenly; the lean carries the whole cradle, solved every frame, so her hands stay on him),
 * so it carries on through P2 while the story clock holds.
 */
const charuActing = (fr: number, off: number): Pose => {
  const k = charuKeys(fr);
  const life = fr + off;
  const a = p1K(life);
  const e = p2K(life);
  const t = rockT(fr, off);
  const b = breathIn(t);
  const ph = breathPh(t);
  return {
    ...k,
    // P1: a tender smile and a small tilt of the head toward him while she gazes down, before she reaches
    // P2: she smiles down at him, brows soft
    smile: k.smile + 0.1 * a + b * 0.05 * (1 - Math.cos(ph * 0.3)) + 0.06 * e,
    brow: k.brow + 0.06 * a + 0.05 * e,
    headTilt: k.headTilt + 3 * a + b * Math.sin(ph * 0.5 + 0.4) * 2.4,
    headNod: k.headNod + 1.5 * a + b * (1 - Math.cos(ph * 0.42)) * 1.2,
    lean: k.lean + 0.6 * a + b * (Math.sin(ph * 0.75) * 1.8 + Math.sin(ph * 0.31 + 0.6) * 0.5 - 0.28),
  };
};

/* ------------------------------------------------------------------ */
/* Charu's arm rig (mirrors Puppet's geometry for this cast member)    */
/* ------------------------------------------------------------------ */

interface Vec {
  x: number;
  y: number;
}

/** Puppet's body proportions for Charu (same formulas as Puppet's bodyFor) and the seated hip height. */
const RIG = (() => {
  const c = CAST.charu;
  const h = c.height;
  const g = c.girth;
  const limbW = 8.8 * h * (c.wiry ? 0.82 : 1) * (0.9 + g * 0.1);
  const thigh = 80 * h;
  const shin = 74 * h;
  const foot = 31 * h;
  // seated legs: thigh 1.42 rad, abduction 0.95 rad, knee 2.7 rad (Puppet's seated leg angles)
  const kneeY = Math.cos(1.42) * Math.cos(0.95) * thigh;
  const soleY = kneeY + Math.cos(1.42 - 2.7) * shin + foot * 0.28;
  return {
    ua: 56 * h,
    // the forearm to the hand plus a third of the hand: the palm centre, which is what touches the baby
    reach: 52 * h - 2 + 37 * h * 0.35,
    sw: 47 * h * (0.85 + g * 0.15),
    limbW,
    torsoLen: 108 * h,
    hipY: -Math.max(soleY, kneeY + limbW * 1.2),
    seed: c.seed,
    child: c.age === "child",
  };
})();

/** Puppet eases every body channel with a 9-frame raised-cosine kernel; the lean used for the arms does the same. */
const LEAN_W = Array.from({ length: 9 }, (_, i) => 0.5 + 0.5 * Math.cos((Math.PI * (i - 4)) / 5));
const leanAt = (fr: number, off: number) => {
  let s = 0;
  let w = 0;
  LEAN_W.forEach((k, i) => {
    s += k * (charuActing(fr + i - 4, off).lean ?? 0);
    w += k;
  });
  return s / w;
};

interface Torso {
  lean: number;
  sx: number;
  sy: number;
  shY: number;
}

/**
 * Her upper-body frame: lean, the lean squash and the breath, exactly as Puppet draws them (MOT-20: no periodic
 * bounce; the shoulders rise by puppetBreath's chest lift on the life clock).
 */
const torsoAt = (fr: number, off: number): Torso => {
  const lean = leanAt(fr, off);
  const bounce = Math.min(0.032, Math.abs(lean) * 0.0028);
  const br = puppetBreath({ t: fr + off, f: fr, seed: RIG.seed, child: RIG.child, stillness: STILLNESS });
  return { lean, sx: CHARU.s * (1 + bounce), sy: CHARU.s * (1 - bounce), shY: RIG.hipY - RIG.torsoLen - br.chest };
};

/** Puppet's upper-body space (rotated by the lean about the hips) to world, and back. */
const toWorld = (t: Torso, p: Vec): Vec => {
  const r = t.lean * DEG;
  const dy = p.y - RIG.hipY;
  return {
    x: CHARU.x + t.sx * (p.x * Math.cos(r) - dy * Math.sin(r)),
    y: CHARU.y + t.sy * (RIG.hipY + p.x * Math.sin(r) + dy * Math.cos(r)),
  };
};
const toLocal = (t: Torso, w: Vec): Vec => {
  const r = -t.lean * DEG;
  const rx = (w.x - CHARU.x) / t.sx;
  const ry = (w.y - CHARU.y) / t.sy - RIG.hipY;
  return { x: rx * Math.cos(r) - ry * Math.sin(r), y: RIG.hipY + rx * Math.sin(r) + ry * Math.cos(r) };
};

const shoulderOf = (t: Torso, side: 1 | -1): Vec => ({
  x: side * RIG.sw * 0.86 * Math.cos(clamp(BODY_TURN, -1, 1) * 0.95),
  y: t.shY + RIG.limbW,
});

/** Unit vector of an SVG rotation (deg) applied to +y, the way Puppet hangs its limbs. */
const dirOf = (a: number): Vec => ({ x: -Math.sin(a * DEG), y: Math.cos(a * DEG) });

/** Puppet arm angles: S at the shoulder, E at the elbow (E < 0 folds the forearm in across the body). */
interface Arm {
  S: number;
  E: number;
}

/** Elbow and palm centre in world space for the given arm angles (side 1 = her right, the near arm). */
const armFK = (t: Torso, side: 1 | -1, a: Arm) => {
  const sh = shoulderOf(t, side);
  const r1 = -side * a.S;
  const d1 = dirOf(r1);
  const el = { x: sh.x + RIG.ua * d1.x, y: sh.y + RIG.ua * d1.y };
  const d2 = dirOf(r1 - side * a.E);
  return { elbow: toWorld(t, el), palm: toWorld(t, { x: el.x + RIG.reach * d2.x, y: el.y + RIG.reach * d2.y }) };
};

/** Two-bone IK: arm angles that put the palm centre on a world target, elbow bending outward (E < 0). */
const armIK = (t: Torso, side: 1 | -1, target: Vec): Arm => {
  const sh = shoulderOf(t, side);
  const T = toLocal(t, target);
  const vx = T.x - sh.x;
  const vy = T.y - sh.y;
  const { ua, reach } = RIG;
  const d = clamp(Math.hypot(vx, vy), Math.abs(ua - reach) + 1, ua + reach - 0.5);
  const a0 = Math.atan2(-vx, vy) / DEG;
  const alpha = Math.acos(clamp((ua * ua + d * d - reach * reach) / (2 * ua * d), -1, 1)) / DEG;
  const beta = Math.acos(clamp((ua * ua + reach * reach - d * d) / (2 * ua * reach), -1, 1)) / DEG;
  const r1 = side > 0 ? a0 - alpha : a0 + alpha;
  return { S: -side * r1, E: -(180 - beta) };
};

const lerpArm = (a: Arm, b: Arm, k: number): Arm => ({ S: lerp(a.S, b.S, k), E: lerp(a.E, b.E, k) });
/** Her arms at f 0, before the reach: forearms folded in over her lap. */
const REST: Arm = { S: 4, E: -66 };

/* ------------------------------------------------------------------ */
/* The hold: the newborn rides on her near forearm                     */
/* ------------------------------------------------------------------ */

interface BabyPose {
  x: number;
  y: number;
  rot: number;
}

interface UV {
  u: number;
  v: number;
}

const liftAt = (f: number) => sineInOut((f - UNDER_END) / (LIFT_END - UNDER_END)); // 0 on the madur, 1 held
const settleAt = (f: number) => sineInOut((f - SETTLE_START) / (SETTLE_END - SETTLE_START));
const mixUV = (a: UV, b: UV, k: number): UV => ({ u: lerp(a.u, b.u, k), v: lerp(a.v, b.v, k) });

/** His body rotation: lying on the madur, then diagonal (head up) in her arms, rocking with her lean. */
const babyRot = (fr: number, off: number) =>
  fr < UNDER_END
    ? MAT_REST.rot
    : lerp(MAT_REST.rot, lerp(RH_CHEST, RH_LAP, settleAt(fr)) + leanAt(fr, off) - LEAN_REF, liftAt(fr));
/** The rotation BabyThakur actually draws: rot plus its follow-through on rot changes (motion.drot * 0.6). */
const babyRotDrawn = (fr: number, off: number) => {
  const r = babyRot(fr, off);
  return r + clamp((r - babyRot(fr - 1, off)) * 4 * 0.6, -6, 6);
};

/** A point on the newborn's body (body frame UV) in world space. */
const onBaby = (b: Vec, rot: number, c: UV): Vec => {
  const r = rot * DEG;
  return { x: b.x + BABY_S * (c.u * Math.cos(r) - c.v * Math.sin(r)), y: b.y + BABY_S * (c.u * Math.sin(r) + c.v * Math.cos(r)) };
};

/** Near palm target under his bottom while he lies on the madur. */
const NEAR_MAT_W = onBaby(MAT_REST, MAT_REST.rot, NEAR_MAT);
/**
 * Near arm with the palm under his bottom on the madur, solved on every frame against her breathing torso, so at
 * the start of the lift (liftAt 0) the palm is exactly at his contact point and he does not move until it rises.
 */
const nearUnderArm = (fr: number, off: number): Arm => armIK(torsoAt(fr, off), 1, NEAR_MAT_W);
/** Near arm in the cradle: upper arm down, forearm horizontal (at LEAN_REF) under his bottom and thighs. */
const nearHoldArm = (f: number): Arm => {
  const S = lerp(SH_CHEST, SH_LAP, settleAt(f));
  return { S, E: -S + LEAN_REF - 90 };
};
/** Near arm from the slide-under to the cradle, eased: it carries him the whole way. */
const nearLiftArm = (fr: number, off: number): Arm => {
  const k = liftAt(fr);
  if (k >= 1) return nearHoldArm(fr);
  return lerpArm(nearUnderArm(fr, off), nearHoldArm(fr), k);
};

/**
 * Newborn position, computed on every frame. Until UNDER_END he lies still on the madur. From then on he is
 * placed ON her near palm: the near arm is driven (eased from the slide-under pose to the cradle) and his body
 * is positioned so the contact point under his bottom sits on that palm. Her lean, breath and rock carry him.
 */
const babyPose = (fr: number, off: number): BabyPose => {
  if (fr < UNDER_END) return { x: MAT_REST.x, y: MAT_REST.y, rot: MAT_REST.rot };
  const palm = armFK(torsoAt(fr, off), 1, nearLiftArm(fr, off)).palm;
  const off2 = onBaby({ x: 0, y: 0 }, babyRotDrawn(fr, off), mixUV(NEAR_MAT, NEAR_HOLD, liftAt(fr)));
  return { x: palm.x - off2.x, y: palm.y - off2.y, rot: babyRot(fr, off) };
};

/**
 * Both arms on frame fr. Before UNDER_END the arms reach down beside him (blended from the rest pose), then the
 * palms slide in under his head and bottom. From UNDER_END the near arm carries him and the far arm is solved
 * every frame onto his body: under his head and shoulders at first, then on his back with his head in the crook.
 */
const charuArmsAt = (fr: number, off: number): { r: Arm; l: Arm } => {
  const t = torsoAt(fr, off);
  const b = babyPose(fr, off);
  const rot = babyRotDrawn(fr, off);
  if (fr < UNDER_END) {
    const out = 1 - sineInOut((fr - REACH_END) / (UNDER_END - REACH_END)); // 1 beside him, 0 slid under
    const near = onBaby(b, rot, NEAR_MAT);
    const far = onBaby(b, rot, FAR_MAT);
    const reach = sineInOut(fr / REACH_END);
    return {
      r: lerpArm(REST, armIK(t, 1, { x: near.x + 26 * out, y: near.y + 10 * out }), reach),
      l: lerpArm(REST, armIK(t, -1, { x: far.x - 26 * out, y: far.y + 10 * out }), reach),
    };
  }
  return { r: nearLiftArm(fr, off), l: armIK(t, -1, onBaby(b, rot, mixUV(FAR_MAT, FAR_HOLD, liftAt(fr)))) };
};

/** Charu's acting with the solved arms and a slow, unsynchronised drift in head and eyes (life clock). */
const charuFrame = (fr: number, off: number): Partial<Pose> => {
  const body = charuActing(fr, off);
  const arms = charuArmsAt(fr, off);
  const life = fr + off;
  return {
    ...body,
    rS: arms.r.S,
    rE: arms.r.E,
    lS: arms.l.S,
    lE: arms.l.E,
    rHand: "hold",
    lHand: "hold",
    headTilt: (body.headTilt ?? 0) + noise1(life * 0.02, 4) * 1.2,
    eyeX: (body.eyeX ?? 0) + noise1(life * 0.031, 6) * 0.04,
  };
};

/* ------------------------------------------------------------------ */
/* Camera (approved shot list, plan "Scene 01c"; CAM-13)               */
/*  1. "আর মা চারুশীলা ছাড়া আর কারও কোল বা": medium two-shot of Charu  */
/*     on the madur with the newborn in front of her, held through P1  */
/*     and the first words; on "মা চারুশীলা" (the line's start + 10)   */
/*     ONE slow eased push in to a close two-shot of both faces, landing */
/*     as the next line starts. The rack focus rides the same push.    */
/*  2. "দুধ সে কিছুতেই নেয় না!": hold the close two-shot (the kiss lands */
/*     here), through the 2 s hold and P2 to the cut. No ease-back.     */
/* The close framing is fixed: the average of both faces over the       */
/* settled cradle (f 123 to the end), so the rock and the kiss play     */
/* inside a still frame. Keys come from the subtitle cues.              */
/* ------------------------------------------------------------------ */

/** Charu's head centre in world space: neck top minus about 0.92 head radius, nodded, carried by her lean. */
const HEAD_R = 41 * Math.sqrt(CAST.charu.height);
const NECK = 11 * CAST.charu.height;
const charuHeadAt = (fr: number, off: number): Vec => {
  const t = torsoAt(fr, off);
  return toWorld(t, { x: 0, y: t.shY - NECK - HEAD_R * 0.9 + (charuActing(fr, off).headNod ?? 0) });
};
/** Balak's head centre (BabyThakur head offset -50, -10 in his body frame). */
const balakHeadAt = (fr: number, off: number): Vec => onBaby(babyPose(fr, off), babyRotDrawn(fr, off), { u: -50, v: -10 });

const LINE_1 = cueLocalStory("আর মা চারুশীলা", SCENE_ID) ?? { from: 0, to: 101 };
const LINE_2 = cueLocalStory("দুধ সে কিছুতেই", SCENE_ID) ?? { from: 101, to: 170 };
/** The push starts on "মা চারুশীলা" (after the short "আর") and lands as line 2 begins. */
const PUSH_IN = LINE_1.from + 10;
const PUSH_END = Math.max(PUSH_IN + 48, LINE_2.from);
/** Medium two-shot: Charu on the madur and the newborn in front of her. */
const WIDE = { x: 375, y: 0, zoom: 1.04 };
/** Close two-shot: both faces (weight 0.5) at this screen point and zoom. */
const CLOSE_ZOOM = 1.9;
const CLOSE_SCR = { x: 960, y: 460 };
const CLOSE: { x: number; y: number; zoom: number } = (() => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let fr = SETTLE_END; fr <= END; fr += 3) {
    const b = balakHeadAt(fr, OPEN);
    const c = charuHeadAt(fr, OPEN);
    x += (b.x + c.x) / 2;
    y += (b.y + c.y) / 2;
    n++;
  }
  x /= n;
  y /= n;
  return { x: x - 960 - (CLOSE_SCR.x - 960) / CLOSE_ZOOM, y: y - 540 - (CLOSE_SCR.y - 540) / CLOSE_ZOOM, zoom: CLOSE_ZOOM };
})();

/* ------------------------------------------------------------------ */
/* Room (same warm birth ward as the cot scene, without the cribs)     */
/* ------------------------------------------------------------------ */

const RoomWindow: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} fill="#4a2c18" />
    <rect x={x} y={y} width={w} height={h} fill="url(#ep2s1c-sky)" />
    {/* far village: a green band with banana-leaf silhouettes */}
    <rect x={x} y={y + h * 0.66} width={w} height={h * 0.34} fill="#6f7f4a" opacity={0.75} />
    <path d={`M ${x + w * 0.2} ${y + h * 0.7} q 18 -70 58 -58 q -34 14 -54 58 Z`} fill="#4f6a3a" />
    <path d={`M ${x + w * 0.62} ${y + h * 0.72} q 22 -80 70 -64 q -38 16 -62 66 Z`} fill="#4f6a3a" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={x + 22 + (i * (w - 44)) / 3} y={y} width={9} height={h} fill="#5a3820" />
    ))}
    <rect x={x} y={y + h} width={w} height={14} fill="#6a4228" />
  </g>
);

const BackWall: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <GlowDefs />
    <defs>
      <linearGradient id="ep2s1c-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c9a070" />
        <stop offset="70%" stopColor="#a9774a" />
        <stop offset="100%" stopColor="#6e4628" />
      </linearGradient>
      <linearGradient id="ep2s1c-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a9a898" />
        <stop offset="60%" stopColor="#dcc48e" />
        <stop offset="100%" stopColor="#e9d3a0" />
      </linearGradient>
    </defs>
    {/* the wall runs on below the floor line so the parallax never opens a gap at the skirting */}
    <rect x={-800} y={-300} width={3800} height={1300} fill="url(#ep2s1c-wall)" />
    {/* plaster patches and hairline cracks */}
    {Array.from({ length: 16 }, (_, i) => (
      <ellipse
        key={i}
        cx={-300 + hash(i * 3.3) * 2800}
        cy={-40 + hash(i * 5.1) * 560}
        rx={60 + hash(i * 7.7) * 140}
        ry={30 + hash(i * 2.2) * 70}
        fill="#4a2c18"
        opacity={0.04 + hash(i) * 0.04}
      />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M ${-100 + i * 650 + hash(i) * 120} ${80 + hash(i * 2) * 120} l 10 22 l -7 18 l 12 26`}
        stroke="#3a2214"
        strokeWidth={1.4}
        fill="none"
        opacity={0.35}
      />
    ))}
    {/* dado: darker lower band of the wall */}
    <rect x={-800} y={560} width={3800} height={200} fill="#5a3820" opacity={0.35} />
    {WINDOWS.map((w) => (
      <RoomWindow key={w.x} x={w.x} y={w.y} w={w.w} h={w.h} />
    ))}
    {/* niche with a clay lamp: steady, warm light */}
    <path d="M 600 430 L 600 350 Q 640 310 680 350 L 680 430 Z" fill="#3a2214" />
    <Glow x={640} y={400} r={260} kind="warm" o={0.16 * lampAt(f)} />
    <Glow x={640} y={414} r={80 * (0.96 + 0.04 * lampAt(f))} kind="warm" o={0.5 * lampAt(f)} />
    <Flame x={640} y={424} s={1} f={f} seed={55} />
    <rect x={620} y={428} width={40} height={8} rx={4} fill="#8a4a24" />
    {/* shelf with brass pots */}
    <rect x={1500} y={300} width={260} height={14} fill="#5a3820" />
    {[1530, 1600, 1680].map((x, i) => (
      <g key={x} transform={`translate(${x}, 300)`}>
        <ellipse cx={0} cy={-22 - i * 2} rx={20 + (i % 2) * 6} ry={24 + (i % 2) * 4} fill={i % 2 ? "#c9932e" : "#a87420"} />
        <rect x={-8} y={-52 - i * 3} width={16} height={8} fill="#8a6018" />
      </g>
    ))}
  </g>
);

const Floor: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="ep2s1c-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a4e2c" />
        <stop offset="100%" stopColor="#3e2412" />
      </linearGradient>
    </defs>
    <rect x={-800} y={860} width={3800} height={300} fill="url(#ep2s1c-floor)" />
    <rect x={-800} y={856} width={3800} height={8} fill="#2e1a0c" opacity={0.6} />
  </g>
);


/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene01cMotherLap: React.FC = () => {
  // f: story clock (holds in P1 and P2); lifeF: real local frame (breathing, blinks, rock, lamp, motes)
  const { f, lifeF } = useStory(SCENE_ID);
  const off = lifeF - f;

  // Camera: medium two-shot held, then one slow push in to the close two-shot (story clock), held to the cut.
  const push = sineInOut((f - PUSH_IN) / (PUSH_END - PUSH_IN));
  const cam: Cam = {
    x: lerp(WIDE.x, CLOSE.x, push),
    y: lerp(WIDE.y, CLOSE.y, push),
    zoom: lerp(WIDE.zoom, CLOSE.zoom, push),
    // rack focus with the push: the depth of field opens so the back wall and lamp soften behind them
    focus: lerp(0.85, 1, push),
    dof: lerp(1.2, 7, push),
  };

  const p = babyPose(f, off);
  const pPrev = babyPose(f - 1, off);
  // follow-through: the newborn's limbs and head lag the bundle's velocity
  const motion = { dx: (p.x - pPrev.x) * 4, dy: (p.y - pPrev.y) * 4, drot: (p.rot - pPrev.rot) * 4 };

  // a tender smile grows toward the kiss; he looks up at her (more in P1, and up at her face in P2)
  const babySmile = track(f, [
    [0, 0.45],
    [104, 0.55],
    [152, 0.75],
  ]);
  const babyLookY =
    track(f, [
      [0, -0.2],
      [70, -0.4],
      [152, -0.5],
    ]) -
    0.25 * p1K(lifeF) -
    0.1 * p2K(lifeF);
  const babyHeadRoll = track(f, [
    [0, -22],
    [104, -18],
    [152, -14],
  ]);
  // after the narration his head nestles a touch with her rock (rock clock, so it carries on through P2)
  const rt = rockT(f, off);
  const babyRoll = babyHeadRoll + breathIn(rt) * Math.sin(breathPh(rt) * 0.4) * 1.5;

  return (
    <Stage cam={cam} background="#3a2818" opacity={clamp(lifeF / 14)}>
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.45}>
          <BackWall f={lifeF} />
        </Layer>
        <Layer depth={1}>
          <DivineDefs />
          <Floor />
          <Madur x={CHARU.x} y={675} s={1.1} />
          <Puppet
            cast={CAST.charu}
            f={f}
            lifeF={lifeF}
            x={CHARU.x}
            y={CHARU.y}
            scale={CHARU.s}
            seated
            acting={(fr) => charuFrame(fr, off)}
            light={{ keySide: 1, rim: "#ffcf87", rimStrength: 0.45 }}
            stillness={STILLNESS}
          />
          {/* the newborn: calm, with the only divine light in the scene (steady aura, MOT-20) */}
          <BabyThakur
            f={f}
            lifeF={lifeF}
            x={p.x}
            y={p.y}
            s={BABY_S}
            open={1}
            aura={1}
            rot={p.rot}
            headRoll={babyRoll}
            smile={babySmile}
            lookX={0.2}
            lookY={babyLookY}
            turn={0.15}
            wiggle={0.15}
            motion={motion}
          />
        </Layer>
        <Layer depth={1.35}>
          <Bokeh f={lifeF} n={8} seed={37} color="#ffc46b" area={[-600, -200, 4000, 1300]} size={[6, 20]} rise={0.3} />
        </Layer>
        <Grade warmth={0.45 * (0.93 + 0.07 * lampAt(lifeF))} vignette={0.6} bloomAt={[50, 46]} grain={0.05} />
      </SceneLights.Provider>
    </Stage>
  );
};
