import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, makeActing, type PoseKey } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { type CastMember, type Pose, type PuppetAnchors, Puppet, walkPose, walkTravel } from "../../../cinematic/rig/Puppet";
import { type SeatedChildProps, type SeatedPose, SeatedChild, seatedChildHands } from "../../../episode03/rig/SeatedChild";
import { GhibliCharFilterDefs, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { balakLivingBodyTransform, GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { GhibliDappledLight, GhibliGroundCover } from "../../core/GhibliLifeKit";
import { safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import { ep04gSpan, ep04gSpeakRms } from "../timing";
import {
  EP04G_CAST,
  EP04G_POND_LIGHT,
  GhibliEp04ForegroundFinish,
  GhibliPondBackdrop,
  mouthFromRms,
  poseOf,
} from "../Ep04GhibliShared";

/**
 * Scene 02 (02_gobinda_and_mangla): the pond bank under the mandar tree. Blueprint shots AG3, 8, AG4, 9, 10 + P4.
 *
 * LAYOUT (world px, ground line y 935): the mandar trunk stands at x 1300-1470 (cutout at 1360). Balak sits right of it
 * at BAL (facing left, SeatedChild plate age 5, the brass Gobinda in his hands); Mangla squats between him and the
 * trunk at MANG (facing right). When Mangla bolts he runs LEFT, passes BEHIND the trunk (the backdrop's
 * `upstageBehindTree` slot, same ground-locked coordinates, a touch upstage) and off along the bank past the ghat.
 *
 * CLOCKS: no pause in this scene is inside a voice clip (P4 is the 30 f after 02c), so the story clock is the local
 * frame; life (breathing, blinks) runs on the same frame. Mangla's run uses a slightly faster leg clock (RUN_RATE) so his
 * feet stay planted at a comic sprint (walkPose's stride is matched to the travel on that clock).
 *
 * CAMERA (cuts, CAM-13): AG3 held wide (~2 s) -> Shot 8 medium two-shot. A felt push (+0.36, eased, starting on
 * 02a) brings both faces and the Gobinda up to fill the safe frame; soles stay near screen y 790, above the caption.
 * AG4 holds that frame -> Shot 9 medium close (cut 6 f before 02b), a further eased push on the line that stops
 * before Mangla's head or the soles leave the frame -> Shot 10 medium wide (cut on Mangla's jump back), motivated
 * pan left with his sprint, held through P4.
 * GhibliLayer scales about the screen centre, so each zoom is paired with framePair() (cam.x / cam.y) to keep
 * Balak (1790, 940) and Mangla (1615, 935) fully inside, heads clear of the top, feet and the Gobinda above y = 820.
 */

const SCENE_ID = "02_gobinda_and_mangla";

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_pond_day.png",
  "images/ghibli_ep04/pond_far_bank_baidik_sketch.png",
  "images/ghibli_ep04/pond_water_emerald_sketch.png",
  "images/ghibli_ep04/brick_ghat_steps_sketch.png",
  "images/ghibli_ep04/tree_mandar_bloom_sketch.png",
  "images/ghibli_ep04/banana_clump_pond_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

type V = { x: number; y: number };

// Balak downstage on the bank; Mangla a half-step upstage (smaller, higher ground line) so the two-shot has depth.
const BAL = { x: 1790, y: 942, s: 0.94 };
const MANG = { x: 1608, y: 916, s: 0.86 };
const MANGLA: CastMember = EP04G_CAST.mangla;
/** Mangla without the gamchha on his shoulder (it has fallen / is in his fist). */
const MANGLA_BARE: CastMember = { ...EP04G_CAST.mangla, scarf: undefined };
const RUN_RATE = 1.3;

const smooth = (t: number) => EASE.inOut(clamp(t));

/* ------------------------------------------------------------------ */
/* Props: the gamchha and the mandar blossom                            */
/* ------------------------------------------------------------------ */

/** Mangla's red checked gamchha: "fold" over a shoulder edge while falling, "heap" lying on the grass, "hang" from a fist. */
const Gamchha: React.FC<{ x: number; y: number; mode: "fold" | "heap" | "hang"; rot?: number; f: number; dir?: 1 | -1 }> = ({
  x,
  y,
  mode,
  rot = 0,
  f,
  dir = 1,
}) => {
  const red = "#c3442f";
  const shade = "#8e2c1d";
  const trim = "#f2e3c6";
  if (mode === "heap") {
    return (
      <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        <ellipse cx={0} cy={2} rx={34} ry={4} fill="#3e2920" opacity={0.18} />
        <path d="M -32 0 Q -24 -12 -6 -9 Q 8 -15 22 -8 Q 34 -4 30 1 Q 6 4 -32 0 Z" fill={red} stroke={shade} strokeWidth={1.2} />
        <path d="M -20 -2 L -14 -10 M -4 -1 L 2 -11 M 12 -1 L 16 -9" stroke={trim} strokeWidth={1.4} opacity={0.75} />
        <path d="M -26 -4 Q 0 -8 26 -4" stroke={trim} strokeWidth={1.2} fill="none" opacity={0.6} />
      </g>
    );
  }
  if (mode === "fold") {
    return (
      <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
        <rect x={-26} y={-6} width={52} height={12} rx={4} fill={red} stroke={shade} strokeWidth={1.2} />
        <path d="M -14 -6 L -14 6 M 0 -6 L 0 6 M 14 -6 L 14 6" stroke={trim} strokeWidth={1.4} opacity={0.75} />
      </g>
    );
  }
  // hang: from the fist at (x, y), the free end trailing behind the runner (dir = running direction) and fluttering
  const w = Math.sin(f * 0.9) * 6;
  const w2 = Math.sin(f * 0.9 + 1.4) * 8;
  const b = -dir;
  const d = `M 0 0 Q ${b * 16} ${8 + w} ${b * 34} ${10 + w2} L ${b * 38} ${22 + w2} Q ${b * 18} ${20 + w} 0 12 Z`;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <path d={d} fill={red} stroke={shade} strokeWidth={1.2} />
      <path d={`M ${b * 12} ${7 + w * 0.5} L ${b * 12} ${17 + w * 0.6} M ${b * 25} ${9 + w2 * 0.6} L ${b * 26} ${20 + w2 * 0.7}`} stroke={trim} strokeWidth={1.3} opacity={0.75} />
    </g>
  );
};

/** One crimson mandar blossom (a cluster of narrow petals). */
const MandarBlossom: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s})`}>
    {[-50, -22, 0, 24, 52].map((a, i) => (
      <ellipse key={i} cx={0} cy={-9} rx={2.8} ry={10} transform={`rotate(${a})`} fill={i % 2 ? "#c8372d" : "#d9493a"} stroke="#5e1b16" strokeWidth={0.7} />
    ))}
    <circle cx={0} cy={0} r={2.6} fill="#7a3a1c" />
  </g>
);

/**
 * A soft, grounded contact shadow on the grass (drawn OUTSIDE the character ink filter, so it never takes an ink
 * contour and reads as a stand base): a wide feathered cast pool toward the left (the sun is upper right) and a small
 * darker occlusion under the feet, both multiplied into the grass. Front grass blades are laid over its edge by the
 * caller (GhibliGroundCover part="front").
 */
const SoftGroundShadow: React.FC<{ x: number; y: number; rx: number; opacity?: number; id: string }> = ({ x, y, rx, opacity = 1, id }) => (
  <g pointerEvents="none" style={{ mixBlendMode: "multiply" }}>
    <defs>
      <filter id={`${id}-wide`} x="-80%" y="-400%" width="260%" height="900%">
        <feGaussianBlur stdDeviation={rx * 0.28} />
      </filter>
      <filter id={`${id}-near`} x="-70%" y="-350%" width="240%" height="800%">
        <feGaussianBlur stdDeviation={rx * 0.11} />
      </filter>
    </defs>
    <ellipse cx={x - rx * 0.32} cy={y + 4} rx={rx * 1.35} ry={rx * 0.26} fill="#33401c" opacity={0.48 * opacity} filter={`url(#${id}-wide)`} />
    <ellipse cx={x - rx * 0.08} cy={y + 1} rx={rx * 0.72} ry={rx * 0.14} fill="#241d0e" opacity={0.58 * opacity} filter={`url(#${id}-near)`} />
  </g>
);

/**
 * Water-plate lily pads (painted in pond_water_emerald_sketch.png) parallax onto this dry bank under zoom.
 * Soft grass washes (blurred, bank-matched, never pad-shaped) bury those pads so they never float on the lawn.
 */
const DryBankPadCover: React.FC = () => (
  <g pointerEvents="none">
    <defs>
      <filter id="s02-padhide" x="-50%" y="-120%" width="200%" height="340%">
        <feGaussianBlur stdDeviation={18} />
      </filter>
    </defs>
    {/* wide soft grass strip under the mandar bank — matches ep4pb-base mid tones */}
    <ellipse cx={1680} cy={900} rx={420} ry={58} fill="#9fb06a" opacity={0.78} filter="url(#s02-padhide)" />
    <ellipse cx={1580} cy={918} rx={280} ry={42} fill="#90a55d" opacity={0.72} filter="url(#s02-padhide)" />
    <ellipse cx={1820} cy={912} rx={260} ry={40} fill="#849c55" opacity={0.62} filter="url(#s02-padhide)" />
    <ellipse cx={1720} cy={888} rx={200} ry={36} fill="#b3bc80" opacity={0.45} filter="url(#s02-padhide)" />
  </g>
);

/**
 * The rigs draw their own faint ambient-occlusion oval under the feet; passed through the ink filter
 * (ghibli-char-ink) its low-alpha pixels pick up the filter's tan pigment mottle and read as a flat grey stand base.
 * This pre-filter drops every pixel under about 55% alpha (the AO oval peaks near 0.55 and the rig's foot shadows at
 * 0.3) and keeps the opaque figure, so the grounding comes from SoftGroundShadow + grass alone.
 */
const SolidFigureDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={id} x="-25%" y="-15%" width="150%" height="130%" colorInterpolationFilters="sRGB">
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 0 0 0 0 0.45 1 1 1 1" />
      </feComponentTransfer>
    </filter>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

interface SeatKey {
  at: number;
  pose: SeatedPose;
}

const seatAt = (f: number, keys: SeatKey[]) => {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (keys[k].at <= f) i = k;
  const cur = keys[i];
  const prev = i > 0 ? keys[i - 1] : undefined;
  return { pose: cur.pose, poseStart: cur.at, prevPose: prev?.pose, prevPoseStart: prev?.at };
};

export const Scene02GobindaManglaGhibli: React.FC = () => {
  const f = useCurrentFrame();

  const ag3 = ep04gSpan(SCENE_ID, "AG3_pond_open");
  const s2a = ep04gSpan(SCENE_ID, "02a_Balak_ToMangla.wav");
  const ag4 = ep04gSpan(SCENE_ID, "AG4_distant_shouts");
  const s2b = ep04gSpan(SCENE_ID, "02b_Balak_DealMangla.wav");
  const s2c = ep04gSpan(SCENE_ID, "02c_Mangla_Panic.wav");
  const sceneEnd = s2c.to + 30; // P4

  // Phrase beats inside 02a (clip silences: 186-191, 220-226, 257-262, 307-320, 384-391, 409-417)
  const a0 = s2a.from;
  const RAISE = a0 + 188; // "এখন বড় হয়েছি—" : holds the Gobinda up, proud
  const STONE = a0 + 262; // "আর কাল পাথরের গোপালটাকে নিয়ে আসব!"
  const BATH = a0 + 318; // "জ্যেঠামশায়রাও তো ওদের স্নান করান," : pours water over it
  const FEED = a0 + 386; // "খাওয়ান—" : fingers to its mouth
  const HUG = a0 + 412; // "ঠিক আমার পুতুলের মতো!" : hugs it
  const PERK = ag4.from - 2; // distant shouts: ears perk, looks to the house
  const LEAN = ag4.from + 16; // leans in to Mangla
  const OFFER = s2b.from + 66; // "এই পুতুলটা সুন্দর জ্যেঠাকে দিয়ে..." : holds it out to Mangla
  const JUMP = s2c.from; // "ওরে বাবা!" : Mangla jumps back
  const DROP = s2c.from + 10; // the gamchha slips off his shoulder
  const DROP_LAND = DROP + 12;
  const WAVE_A = s2c.from + 20; // "ঠাকুরের গোবিন্দ ছুঁলে আমার হাত খসে পড়বে যে!" : flaps his hands
  const WAVE_B = s2c.from + 92;
  const GRAB = s2c.from + 92; // grabs his gamchha
  const GRIP = GRAB + 12;
  const TURN = s2c.from + 104; // turns to run ("আমি পালালাম—")
  const RUN0 = TURN + 6;
  const BLINK = s2c.to + 8; // P4: Balak's amused blink

  /* ---------------- Mangla ---------------- */
  const hopT = smooth((f - JUMP) / 9);
  const hopX = -42 * hopT;
  const hopY = f >= JUMP && f < JUMP + 9 ? -24 * Math.sin(Math.PI * ((f - JUMP) / 9)) : 0;
  // a little shuffle further back while he protests
  const backX = -16 * smooth((f - (WAVE_A + 20)) / 30);
  const standX = MANG.x + hopX + backX;
  const running = f >= RUN0;
  const runClock = running ? RUN0 + (f - RUN0) * RUN_RATE : f;
  const runOpts = {
    start: RUN0,
    dur: 150,
    fromX: 0,
    toX: -2050,
    scale: MANG.s,
    height: MANGLA.height,
    seed: MANGLA.seed,
    kind: "run" as const,
    startIn: 7,
    stopIn: 8,
    bodyTurn: safeBodyTurn(-0.34),
  };
  const runX = running ? walkTravel(runClock, runOpts).bodyX : 0;
  const manglaX = standX + runX;
  // upstage a little as he passes behind the trunk (x 1470 -> 1300)
  const upT = smooth((1540 - manglaX) / 200);
  const manglaY = MANG.y - 22 * upT;
  const manglaS = MANG.s * (1 - 0.03 * upT);
  const behindTree = running;

  const MK = (k: PoseKey<Pose>): PoseKey<Pose> => k;
  // Soft village squat: kneel + crouch so the dhoti base reads wide (shared Puppet seated/kneel flare).
  // Hands rest on the knees (hold); acting below releases them for reactions. Extra heel-rock / breath keeps him alive.
  const SQUAT = {
    kneel: 1,
    crouch: 0.22,
    bodyTurn: safeBodyTurn(0.28),
    headTurn: 0.08,
    // Resting squat more upright; big leans only on keyed beats below.
    lean: 3,
    smile: 0.28,
    brow: 0.05,
    eyeY: 0.3,
    hold: 1,
    hunch: 0.1,
  };
  const manglaBase = makeActing<Pose>(poseOf(SQUAT), [
    MK({ f: 0, ...SQUAT }),
    // AG3 / start of 02a: idly turning to the boy, weight shifting on the heels
    MK({ f: a0 - 10, in: 18, ease: "inOut", headTurn: 0.14, headTilt: 4, lean: 10, crouch: 0.16 }),
    // Shot 8: his eyes grow wider and wider
    MK({ f: a0 + 70, in: 24, ease: "inOut", brow: 0.28, smile: 0.08, headTilt: -2, crouch: 0.14 }),
    MK({ f: RAISE + 12, in: 16, ease: "inOut", brow: 0.5, smile: 0, lean: 2, headTilt: -4, hunch: 0.18, hold: 0.55, crouch: 0.18 }),
    MK({ f: STONE + 14, in: 14, ease: "backOut", brow: 0.75, lean: -5, mouthHand: -0.9, hunch: 0.35, hold: 0, crouch: 0.22 }),
    MK({ f: BATH + 10, in: 16, ease: "inOut", brow: 0.85, mouthHand: 0, lean: -8, hunch: 0.48, headTurn: 0.28, hold: 1, crouch: 0.2 }),
    MK({ f: FEED + 8, in: 10, ease: "backOut", brow: 0.95, lean: -10, hunch: 0.6, headTilt: -6, crouch: 0.24 }),
    MK({ f: HUG + 20, in: 18, ease: "inOut", brow: 0.9, hunch: 0.48, lean: -8, crouch: 0.18 }),
    // AG4: the shouts from the house - he looks over his shoulder
    MK({ f: PERK + 6, in: 8, ease: "inOut", headTurn: -0.32, brow: 0.7, hunch: 0.32, crouch: 0.16 }),
    MK({ f: LEAN + 8, in: 10, ease: "inOut", headTurn: 0.28, brow: 0.8, crouch: 0.14 }),
    // Shot 9: the Gobinda held out at him - he shrinks back
    MK({ f: OFFER + 6, in: 12, ease: "inOut", lean: -7, hunch: 0.8, brow: 1, headTurn: 0.22, headTilt: -8, crouch: 0.28 }),
    // Shot 10: jumps back, clutching his head
    MK({ f: JUMP + 4, in: 4, ease: "out", kneel: 0, hold: 0, mouthHand: 0, crouch: 0.12, bodyTurn: safeBodyTurn(0.3), lean: -12, hunch: 0.4, headHands: 1, brow: 1, gasp: 0.15, rS: 6, rE: -8, lS: 6, lE: -8 }),
    MK({ f: WAVE_A, in: 6, ease: "inOut", headHands: 0, crouch: 0.1, lean: -6 }),
    MK({ f: GRAB - 4, in: 6, ease: "inOut", crouch: 0.1, rS: 6, rE: -8, lS: 6, lE: -8 }),
    MK({ f: GRAB + 6, in: 8, ease: "inOut", crouch: 0.5, lean: 10, headTurn: 0.1, headTilt: 6 }),
    MK({ f: GRIP + 2, in: 6, ease: "inOut", crouch: 0.14, lean: 0, headTilt: 0 }),
  ]);
  const manglaActing = (): Pose => {
    const p = manglaBase(f);
    // flapping both hands, as if the brass had burnt them
    const flapW = clamp((f - WAVE_A) / 4) * (1 - clamp((f - (WAVE_B - 6)) / 6));
    const flap = flapW > 0 ? Math.sin((f - WAVE_A) * 0.95) : 0;
    const reachW = f < GRAB ? 0 : f < GRAB + 8 ? smooth((f - GRAB) / 8) : f < TURN ? 1 : 1 - smooth((f - TURN) / 6);
    // life while he squats: heel rock, shoulder breath, idle finger fidget — not a frozen cutout
    const squatting = f < JUMP ? 1 : 0;
    const rock = squatting * Math.sin(f * 0.048 + 0.6);
    const bob = squatting * Math.sin(f * 0.078 + 1.9);
    const breath = squatting * Math.sin(f * 0.095 + 0.4);
    const weight = squatting * Math.sin(f * 0.027 + 2.4);
    let out: Pose = {
      ...p,
      bodyTurn: safeBodyTurn(p.bodyTurn + squatting * 0.055 * Math.sin(f * 0.031) + 0.03 * weight),
      lean: p.lean + 4.2 * rock + 1.6 * weight,
      headTilt: p.headTilt + 3.8 * bob,
      headNod: p.headNod + 2.4 * Math.sin(f * 0.056) + 1.5 * breath,
      headTurn: p.headTurn + squatting * 0.05 * Math.sin(f * 0.022 + 1.3),
      hunch: p.hunch + squatting * 0.08 * breath,
      crouch: p.crouch + squatting * 0.05 * Math.sin(f * 0.041 + 1.1),
      rE: p.rE + squatting * 11 * Math.sin(f * 0.039 + 2.2),
      lE: p.lE + squatting * 8 * Math.sin(f * 0.033 + 0.7),
      throwUp: flapW * 0.95 * flap,
      bodyY: p.bodyY + hopY + squatting * 1.8 * breath,
      reach: reachW,
      reachUp: 0,
      rHand: reachW > 0.5 ? "relaxed" : flapW > 0.2 ? "open" : p.rHand,
      lHand: flapW > 0.2 ? "open" : p.lHand,
    };
    // fright breathing in the shoulders while he listens
    if (f >= TURN) {
      const tT = smooth((f - TURN) / 8);
      out = {
        ...out,
        bodyTurn: safeBodyTurn(lerp(out.bodyTurn, -0.34, tT)),
        headTurn: lerp(out.headTurn, -0.28, tT),
        hunch: lerp(out.hunch, 0.22, tT),
      };
    }
    if (running) {
      const w = walkPose(runClock, runOpts);
      out = {
        ...out,
        ...w,
        bodyTurn: safeBodyTurn(w.bodyTurn ?? -0.34),
        crouch: 0.08,
        hunch: 0.22,
        brow: 1,
        reach: 0,
        throwUp: 0,
        headHands: 0,
        // the fist with the gamchha pumps a little less
        rE: (w.rE ?? 0) - 30,
        rHand: "relaxed",
        lHand: "relaxed",
      };
    }
    return out;
  };
  const gamchhaAt: V = { x: MANG.x - 26, y: MANG.y + 1 };
  const manglaAnchors: { a?: PuppetAnchors } = {};
  const manglaCast = f >= DROP ? MANGLA_BARE : MANGLA;
  const manglaRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["02c_Mangla_Panic.wav"], fr);

  const Hold: React.FC = () => {
    const a = manglaAnchors.a;
    if (!a) return null;
    if (f < DROP) return null;
    if (f < DROP_LAND) {
      // slips off the shoulder and drops to the grass
      const t = clamp((f - DROP) / (DROP_LAND - DROP));
      const start = { x: a.cheek.x - 8, y: a.cheek.y + 52 };
      const e = t * t;
      return <Gamchha mode="fold" x={lerp(start.x, gamchhaAt.x, t)} y={lerp(start.y, gamchhaAt.y - 6, e)} rot={-70 * t} f={f} />;
    }
    if (f < GRIP) return <Gamchha mode="heap" x={gamchhaAt.x} y={gamchhaAt.y} f={f} />;
    return <Gamchha mode="hang" x={a.rWrist.x} y={a.rWrist.y + 4} f={f} dir={running ? -1 : 1} />;
  };

  const manglaNode = (
    <g>
      <SoftGroundShadow id="s02-mang-sh" x={manglaX + 6} y={manglaY} rx={(running ? 58 : 92) * (manglaS / MANG.s)} opacity={running ? 0.8 : 1} />
      <g filter="url(#ghibli-char-ink)">
      <g filter="url(#s02-solid)">
      <Puppet
        cast={manglaCast}
        x={manglaX}
        y={manglaY}
        scale={manglaS}
        f={runClock}
        lifeF={f}
        light={EP04G_POND_LIGHT}
        seated={f < JUMP}
        breathRate={f >= JUMP ? 1.9 : f >= LEAN ? 1.55 : f >= STONE ? 1.4 : 1.15}
        mouth={() => mouthFromRms(manglaRms(f), f)}
        talk={() => manglaRms(f)}
        acting={() => manglaActing()}
        reachAt={() => ({ x: gamchhaAt.x + 6, y: gamchhaAt.y - 8 })}
        holdAt={() => {
          // clasped over the knees; drawn up to the chest as he shrinks from the offered Gobinda (Shot 9)
          const up = smooth((f - (OFFER + 2)) / 14);
          return { x: manglaX + lerp(40, 26, up) * manglaS, y: manglaY - lerp(64, 124, up) * manglaS };
        }}
        anchors={(a) => {
          manglaAnchors.a = a;
        }}
      />
      </g>
      <Hold />
      </g>
      <GhibliGroundCover x={manglaX + 4} y={manglaY + 6} w={150} lifeF={f} s={1.25} preset="pond" part="front" litter={false} />
      <GhibliFootstepDust x={manglaX + 30} y={manglaY} activity={running ? 1 : f >= JUMP + 7 && f < JUMP + 16 ? 0.7 : 0} dir={running ? -1 : -1} s={1.1} f={f} />
    </g>
  );

  /* ---------------- Balak ---------------- */
  const seatKeys: SeatKey[] = [
    { at: -40, pose: "holdInLap" },
    { at: RAISE, pose: "offerUp" },
    { at: STONE + 30, pose: "holdInLap" },
    { at: BATH, pose: "pointIn" },
    { at: HUG, pose: "holdToChest" },
    { at: LEAN, pose: "holdInLap" },
    { at: OFFER, pose: "offerUp" },
    { at: JUMP + 30, pose: "holdInLap" },
  ];
  const st = seatAt(f, seatKeys);
  // where the Gobinda is held out: up and proud (RAISE), then out toward Mangla (OFFER)
  const reachAt: V = f < OFFER - 20 ? { x: 52, y: -168 + 3 * Math.sin(f * 0.05) } : { x: 98, y: -128 };
  // the mime: a cupped hand pours water over it in small circles, then fingers to its mouth
  const lapTop: V = { x: 52, y: -92 };
  const pointAt: V =
    f < FEED
      ? { x: lapTop.x + 10 * Math.cos((f - BATH) * 0.32), y: lapTop.y - 34 + 8 * Math.sin((f - BATH) * 0.32) }
      : { x: lapTop.x + 22, y: lapTop.y - 18 + 4 * Math.sin((f - FEED) * 0.6) };
  const balakRms = ep04gSpeakRms(SCENE_ID, ["02a_Balak_ToMangla.wav", "02b_Balak_DealMangla.wav"], f);
  // eyes: on Mangla while he talks to him; on the Gobinda while he plays; to the house at the shouts; after Mangla runs
  const lookAway = f >= PERK && f < LEAN ? smooth((f - PERK) / 6) * (1 - smooth((f - (LEAN - 4)) / 8)) : 0;
  const runLook = running ? 0.95 : 0;
  const lookX = clamp(0.55 - 1.35 * lookAway + runLook * 0.4, -1, 1);
  const watchHeld =
    f < a0
      ? 1
      : st.pose === "pointIn"
        ? 0.9
        : st.pose === "offerUp"
          ? 0.15
          : st.pose === "holdToChest"
            ? 0.4
            : f >= JUMP
              ? 0
              : 0.15;
  const balakExpr = f >= JUMP ? "joyful" : st.pose === "holdToChest" ? "joyful" : "playful";

  const balakProps: SeatedChildProps = {
    x: BAL.x,
    y: BAL.y,
    s: BAL.s,
    flip: true,
    design: "plate",
    age: 5,
    build: "healthy",
    f,
    lifeF: f,
    pose: st.pose,
    poseStart: st.poseStart,
    prevPose: st.prevPose,
    prevPoseStart: st.prevPoseStart,
    holding: "gobinda",
    reachAt,
    pointAt,
    watchHeld,
    face: { lookX, smile: f >= JUMP ? 0.5 : 0.2 },
    expression: balakExpr,
    mouth: balakRms,
    talk: balakRms > 0.06 ? 1 : 0,
    blinkAt: BLINK,
  };
  const hands = seatedChildHands(balakProps);
  // whispering in Shot 9: he leans in a little more
  const whisperLean = f >= LEAN && f < JUMP ? 0.7 : 0;

  /* ---------------- Blossom (AG3) ---------------- */
  const BLOSSOM_LAND = 26;
  const blossomT = clamp((f - 2) / (BLOSSOM_LAND - 2));
  const blossom: V & { rot: number } =
    f < BLOSSOM_LAND
      ? { x: BAL.x + 92 + 30 * Math.sin(blossomT * 5.2), y: lerp(560, 944, blossomT * blossomT), rot: 260 * blossomT }
      : { x: BAL.x + 92 + 30 * Math.sin(5.2), y: 944 - (f < BLOSSOM_LAND + 6 ? 5 * Math.sin(((f - BLOSSOM_LAND) / 6) * Math.PI) : 0), rot: 260 };

  /* ---------------- Camera ---------------- */
  // screen = centre + zoom * (world - cam - centre). Pin world x `cx` to screen centre and the soles to toeSy.
  // Soles read about 10 px below the ground contact, so toeY (not the hip line) is what must clear y = 820.
  const framePair = (cx: number, toeSy: number, z: number): Cam => {
    const toeY = 952;
    return { x: cx - 960, y: toeY - 540 - (toeSy - 540) / z, zoom: z, focus: 1 };
  };

  let cam: Cam = { x: 0, y: 0, zoom: 1, focus: 1 };
  const cutShot9 = s2b.from - 6;
  const cutShot10 = s2c.from - 3;
  if (f < a0) {
    // AG3: held wide (a breath of drift), about two seconds, then the line
    const t = f / Math.max(1, ag3.frames + 48);
    cam = { x: 380 + 14 * t, y: 50, zoom: 1.2 };
  } else if (f < cutShot9) {
    // Shot 8 + AG4: medium two-shot. Felt push starts as Balak speaks; Mangla (upstage squat) + Balak (downstage)
    // fill the frame with depth. Soles ~800, faces well above the caption.
    const push = smooth((f - a0) / 84);
    cam = framePair(lerp(1695, 1715, push), lerp(798, 808, push), lerp(2.35, 2.62, push));
  } else if (f < cutShot10) {
    // Shot 9: MEDIUM CLOSE ON BALAK (speaker). Gobinda large at centre; Mangla's reacting face stays readable at left.
    const push = smooth((f - s2b.from) / 96);
    cam = framePair(lerp(1758, 1768, push), lerp(802, 808, push), lerp(3.15, 3.32, push));
  } else {
    // Shot 10 + P4: stay with Mangla at a medium as he sprints, then settle back on Balak for the blink
    const runT = smooth((f - RUN0) / 40);
    const settle = f < sceneEnd - 40 ? 0 : smooth((f - (sceneEnd - 40)) / 28);
    const cx = lerp(lerp(standX + 30, manglaX + 80, runT), BAL.x - 30, settle);
    cam = framePair(cx, lerp(792, 804, settle), lerp(1.95, 2.15, settle));
  }
  cam.focus = 1;
  cam.dof = zoomProportionalDof(cam.zoom);

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliPondBackdrop f={f} upstageBehindTree={behindTree ? manglaNode : undefined} />

      <GhibliLayer depth={1.0}>
        {/* the grove's warm dappled light: sun-gold rim, leaf shade and moving flecks on the figures (STO-22c) */}
        <GhibliCharFilterDefs f={f} dapple shadeFactor={0.14} sunColor="#ffd98a" bounceColor="#86a070" />
        <SolidFigureDefs id="s02-solid" />
        {/* dry bank under the mandar: cover water-plate lily pads that parallax onto the lawn */}
        <DryBankPadCover />
        <GhibliGroundCover x={1680} y={948} w={520} lifeF={f} preset="pond" part="back" />
        {!behindTree && manglaNode}

        <MandarBlossom x={blossom.x} y={blossom.y} rot={blossom.rot} s={1.1} />

        <GhibliBalakGroundGlow x={BAL.x} y={BAL.y + 5} level={0.45} />
        <g transform={balakLivingBodyTransform({ x: BAL.x, y: BAL.y, f, facing: -1, speechRms: balakRms + whisperLean * 0.4 })}>
          <GhibliBalakAura cx={hands.glowAnchor.cx} cy={hands.glowAnchor.cy} r={hands.glowAnchor.r * 0.62} glow={0.55} f={f} />
          <SoftGroundShadow id="s02-bal-sh" x={BAL.x + 4} y={BAL.y + 2} rx={70} />
          <g filter="url(#ghibli-char-ink)">
            <g filter="url(#s02-solid)">
              <SeatedChild {...balakProps} />
            </g>
            <GhibliBalakLapDetails x={BAL.x} y={BAL.y} s={BAL.s} flip f={f} />
          </g>
        </g>
        <GhibliGroundCover x={1700} y={956} w={420} lifeF={f} preset="pond" part="front" litter={false} />
        <GhibliGroundCover x={BAL.x + 6} y={BAL.y + 8} w={180} lifeF={f + 40} s={1.2} preset="pond" part="front" litter={false} />
        {/* leaf-dapple from the mandar and banana canopy moving over the two of them and the grass */}
        <GhibliDappledLight region={{ x: 1420, y: 640, w: 600, h: 340 }} lifeF={f} mode="shadow" intensity={0.5} squash={0.7} wind={0.8} />
        {/* warm late-morning sun through the canopy gap, from the upper right, washing over the pair */}
        <g pointerEvents="none" style={{ mixBlendMode: "screen" }}>
          <defs>
            <radialGradient id="s02-sunwash" cx="0.62" cy="0.3" r="0.6">
              <stop offset="0%" stopColor="#ffd78c" stopOpacity={0.34} />
              <stop offset="55%" stopColor="#f5c56e" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#f5c56e" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={1760} cy={790} rx={340} ry={240} fill="url(#s02-sunwash)" opacity={0.9 + 0.1 * Math.sin(f * 0.03)} />
        </g>
      </GhibliLayer>

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} petals />
    </GhibliStage>
  );
};

