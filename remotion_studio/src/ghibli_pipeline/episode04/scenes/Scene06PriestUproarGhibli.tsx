import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, lerp } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Puppet, shoutMouth } from "../../../cinematic/rig/Puppet";
import {
  HeldObjectArt,
  SeatedChild,
  type SeatedChildProps,
  seatedChildHands,
  type SeatedExpression,
  type SeatedPose,
} from "../../../episode03/rig/SeatedChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { balakLivingBodyTransform, GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { ghibliStrideOf, ghibliWalkSpot, safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import { ep04gSpan, ep04gSpeakRms } from "../timing";
import {
  EP04G_CAST,
  EP04G_SHRINE_LIGHT,
  GhibliEp04ForegroundFinish,
  GhibliShrineBackdrop,
  GhibliSmokeCurls,
  mouthFromRms,
  poseOf,
} from "../Ep04GhibliShared";
import {
  blinkAt,
  BOWL_FLOOR,
  BOWL_FLOOR_S,
  DHOOP_SET,
  ramp,
  SHRINE,
  ShrineArchFrame,
  ShrineGobinda,
  ShrineLampLight,
} from "./Scene05DhoopAndCoconutGhibli";

const SCENE_ID = "06_priest_uproar_and_ants";
const SCENE_TOTAL_FRAMES = 1316;

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_purnima_dusk.png",
  "images/ghibli_ep04/thakur_ghar_interior_sketch.png",
  "images/ghibli_ep04/deity_khat_shrine_sketch.png",
  "images/ghibli_ep04/shrine_arch_frame_sketch.png",
  "images/ghibli_ep04/ants_cutaway_vignette_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

/** Cubic Bezier evaluation + tangent angle (deg) for the marching ants trail. */
const evalCubicBezier = (
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): { x: number; y: number; deg: number; nx: number; ny: number } => {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  const len = Math.max(0.001, Math.hypot(dx, dy));
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI, nx: -dy / len, ny: dx / len };
};

/**
 * Soft oval feather for the memory vignette: the painted veranda floor melts into warm cream paper at the edges (no
 * box, no painted border). The vignette is a full cut (opaque once the short dissolve is done), so nothing of the live
 * shrine scene shows through it, and there is no glow or bloom in it (the episode's only glow beat is Scene 04).
 */
const VIGNETTE_MASK = "radial-gradient(ellipse 62% 60% at 50% 50%, #000 58%, rgba(0,0,0,0.6) 78%, transparent 100%)";

/**
 * The memory cutaway ("আমার পুতুলকে খাওয়াতে… সব তো পিঁপড়েরা খায়!"): his painted wooden fair doll lying on its back on
 * the sunlit veranda floor, a tiny nail hole in its painted mouth, grains of rice spilled on the floor by its mouth,
 * and a neat line of tiny sepia-ink ants walking away across the same floor, each carrying a grain toward the doorway.
 * Frame coordinates (1920 x 1080); the plate is scaled up a little so its painted border stays outside the frame.
 */
const AntsOnDollCutawayVignette: React.FC<{ f: number; startF: number; opacity: number }> = ({ f, startF, opacity }) => {
  if (opacity <= 0.005) return null;
  const cf = Math.max(0, f - startF);
  const drift = 1 + 0.03 * clamp(cf / 140, 0, 1);

  // the doll lies flat on the veranda floor (plinth), head toward the right; nail-hole mouth in frame pixels
  const DOLL = { x: 740, y: 728, k: 3.35, rot: 78 };
  const dollArtRot = (DOLL.rot * Math.PI) / 180;
  const mouthLocal = { x: 0, y: -17.0 * 1.55 }; // in the doll art, scaled by 1.55, before rotation
  const mouth = {
    x: DOLL.x + DOLL.k * (mouthLocal.x * Math.cos(dollArtRot) - mouthLocal.y * Math.sin(dollArtRot)),
    y: DOLL.y + DOLL.k * (mouthLocal.x * Math.sin(dollArtRot) + mouthLocal.y * Math.cos(dollArtRot)),
  };
  // ants stay on the floor plane (never climb the wall): from the rice by the mouth, a low curve toward the sill
  const p0: [number, number] = [mouth.x + 36, mouth.y + 28];
  const p1: [number, number] = [mouth.x + 260, mouth.y + 78];
  const p2: [number, number] = [1260, 655];
  const p3: [number, number] = [1460, 575];
  const riceGrains: ReadonlyArray<{ x: number; y: number; rot: number; s: number }> = [
    { x: 14, y: 8, rot: -18, s: 1.05 },
    { x: 30, y: 22, rot: 34, s: 0.95 },
    { x: 44, y: 4, rot: 12, s: 1.0 },
    { x: 56, y: 28, rot: -42, s: 0.92 },
    { x: 8, y: 30, rot: 25, s: 0.88 },
    { x: 70, y: 14, rot: -8, s: 0.96 },
    { x: 24, y: 40, rot: 60, s: 0.9 },
    { x: 40, y: 48, rot: -30, s: 0.86 },
  ];
  const antCount = 10;

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none", background: "#efe2c8" }}>
      <AbsoluteFill style={{ WebkitMaskImage: VIGNETTE_MASK, maskImage: VIGNETTE_MASK }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `scale(${drift.toFixed(4)})` }}>
          <Img
            src={staticFile("images/ghibli_ep04/ants_cutaway_vignette_sketch.png")}
            style={{ position: "absolute", left: "-9%", top: "-9%", width: "118%", height: "118%", objectFit: "cover" }}
          />
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <radialGradient id="ep04g-doll-floor-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5a3a22" stopOpacity={0.5} />
                <stop offset="60%" stopColor="#6a4a2e" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#6a4a2e" stopOpacity={0} />
              </radialGradient>
            </defs>
            {/* soft contact shadow under the doll (grounds it on the plinth; sun high behind camera) */}
            <ellipse cx={DOLL.x + 10} cy={DOLL.y + 34} rx={DOLL.k * 52} ry={DOLL.k * 15} transform={`rotate(${DOLL.rot - 90} ${DOLL.x} ${DOLL.y})`} fill="url(#ep04g-doll-floor-shadow)" />
            <ellipse cx={DOLL.x + 4} cy={DOLL.y + 22} rx={DOLL.k * 32} ry={DOLL.k * 9} transform={`rotate(${DOLL.rot - 90} ${DOLL.x} ${DOLL.y})`} fill="#3d2818" opacity={0.28} />
            {/* the wooden fair doll lying on the veranda floor, the nail hole in its painted smile */}
            <g transform={`translate(${DOLL.x}, ${DOLL.y}) scale(${DOLL.k})`}>
              <HeldObjectArt kind="doll" x={0} y={0} s={1.55} rot={DOLL.rot} />
              <g transform={`rotate(${DOLL.rot}) scale(1.55)`}>
                <circle cx={0} cy={-17.0} r={1.1} fill="#23120b" />
              </g>
            </g>
            {/* grains of rice spilled on the floor by its mouth */}
            {riceGrains.map((g, idx) => (
              <g key={idx} transform={`translate(${(mouth.x + 18 + g.x * 1.25).toFixed(1)}, ${(mouth.y + 28 + g.y * 1.15).toFixed(1)}) rotate(${g.rot}) scale(${(g.s * 1.9).toFixed(2)})`}>
                <ellipse cx={0.8} cy={1.6} rx={4.2} ry={1.8} fill="#5a3e28" opacity={0.34} />
                <ellipse cx={0} cy={0} rx={4.1} ry={1.9} fill="#fffaf0" stroke="#7a5c40" strokeWidth={0.7} />
              </g>
            ))}
            {/* the ants, walking away across the same floor with the rice (tiny, with contact shadows) */}
            {Array.from({ length: antCount }, (_, i) => {
              const rawU = (cf * 0.0038 + i / antCount) % 1;
              const edgeFade = clamp(rawU / 0.05, 0, 1) * clamp((1 - rawU) / 0.08, 0, 1);
              const pt = evalCubicBezier(p0, p1, p2, p3, rawU);
              const sway = Math.sin(cf * 0.19 + i * 2.1) * 1.6;
              const ax = pt.x + pt.nx * sway;
              const ay = pt.y + pt.ny * sway;
              const rotDeg = pt.deg + Math.cos(cf * 0.19 + i * 2.1) * 4.5;
              const sc = 1.55 + (i % 3) * 0.08;
              return (
                <g key={i} opacity={edgeFade} transform={`translate(${ax.toFixed(2)}, ${ay.toFixed(2)}) rotate(${rotDeg.toFixed(2)}) scale(${sc.toFixed(3)})`}>
                  <ellipse cx={0} cy={2.8} rx={7.5} ry={1.7} fill="#4c331f" opacity={0.32} />
                  {[-1, 0, 1].map((legIdx) => {
                    const stride = Math.sin(cf * 0.95 + i * 1.7 + legIdx * 2.15) * 2.1;
                    const lx = legIdx * 2.6 - 0.5;
                    return (
                      <g key={legIdx} stroke="#2f1a0f" strokeWidth={0.95} strokeLinecap="round" fill="none">
                        <path d={`M ${lx.toFixed(1)} -0.6 Q ${(lx + stride * 0.5).toFixed(1)} -4.2 ${(lx + stride).toFixed(1)} -5.6`} />
                        <path d={`M ${lx.toFixed(1)} 0.6 Q ${(lx - stride * 0.5).toFixed(1)} 4.2 ${(lx - stride).toFixed(1)} 5.6`} />
                      </g>
                    );
                  })}
                  <ellipse cx={-6.3} cy={0} rx={4.2} ry={2.6} fill="#3d2214" />
                  <ellipse cx={-0.4} cy={0} rx={2.7} ry={1.75} fill="#462818" />
                  <circle cx={4.4} cy={-0.2} r={2.25} fill="#381f12" />
                  <path
                    d={`M 6.0 -1.2 Q 8.4 ${(-3.6 + Math.sin(cf * 0.45 + i) * 0.7).toFixed(1)} 10.2 -3.2 M 6.1 0.6 Q 8.5 ${(2.8 - Math.sin(cf * 0.45 + i) * 0.7).toFixed(1)} 10.1 2.2`}
                    fill="none"
                    stroke="#2c170d"
                    strokeWidth={0.8}
                    strokeLinecap="round"
                  />
                  <g transform={`translate(8.8, -1.3) rotate(${(-14 + Math.sin(cf * 0.3 + i) * 4).toFixed(1)})`}>
                    <ellipse cx={0} cy={0} rx={4.0} ry={1.85} fill="#fffdf6" stroke="#654931" strokeWidth={0.7} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
      <Img
        src={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", opacity: 0.12 }}
      />
    </AbsoluteFill>
  );
};

/** The priest's hand-bell, set down on the floor at his side (he rang it in Scene 05's AG7). */
const FloorBell: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y}) scale(0.5)`}>
    <ellipse cx={0} cy={1} rx={16} ry={3.5} fill="#1a0c06" opacity={0.3} />
    <path d="M -14 0 Q -13 -18 0 -20 Q 13 -18 14 0 Z" fill="#c4932f" />
    <path d="M -9 -4 Q -8 -15 -1 -17" fill="none" stroke="#f3d58a" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    <ellipse cx={0} cy={0} rx={14} ry={3} fill="#8a5a14" />
    <rect x={-2.6} y={-36} width={5.2} height={18} rx={2} fill="#b58a2e" />
    <circle cx={0} cy={-38} r={3.6} fill="#c99a38" />
  </g>
);

export const Scene06PriestUproarGhibli: React.FC = () => {
  const f = useCurrentFrame();

  const s6a = ep04gSpan(SCENE_ID, "06a_Balak_CoconutConfess.wav");
  const s6b = ep04gSpan(SCENE_ID, "06b_Bhagabati_Explode.wav");
  const s6c = ep04gSpan(SCENE_ID, "06c_Balak_AntsLogic.wav");
  const s6d = ep04gSpan(SCENE_ID, "06d_Family_ScoldShrine.wav");
  const s6e = ep04gSpan(SCENE_ID, "06e_Balak_LegalDefense.wav");
  const p10 = { from: s6a.to, to: s6b.from };
  const p11 = { from: s6e.to, to: SCENE_TOTAL_FRAMES };

  // Line beats inside the clips (local frames, from the subtitle cues)
  const B = {
    confess2: s6a.from + 96, // "তাই আমি নারকেলের জলটা খেয়ে…"
    ae: s6b.from, // "অ্যাঁ?"
    excl: s6b.from + 18, // "!"
    sarbonash: s6b.from + 36, // "সর্বনাশ!"
    ore: s6b.from + 54, // "ওরে সবাই এসে দ্যাখ—"
    babur: s6b.from + 95, // "বাবুর ছেলেটা…"
    chechacchen: s6c.from, // "ও ঠাকুরমশায়, আপনি চেঁচাচ্ছেন কেন?"
    khan: s6c.from + 89, // "ফোপড়াটা আপনিই খান, কাউকে বলব না!"
    putul: s6c.from + 175, // "আমার পুতুলকে খাওয়াতে…"
    pipre: s6c.from + 314, // "তবুও খেল না, সব তো পিঁপড়েরা খায়!"
    ichchhe: s6e.from, // "আমি তো ইচ্ছে করে ঢুকিনি!"
    dhoop: s6e.from + 45, // "ধূপ দেওয়ার কেউ ছিল না—"
    jigges: s6e.from + 88, // "আমি তো ঠাকুরমশায়কে জিজ্ঞেস করেই ভেতরে ঢুকেছি!"
  };

  // Memory cutaway: in on "আমার পুতুলকে খাওয়াতে…", the ants through "সব তো পিঁপড়েরা খায়", back to Balak for the shrug
  const cutawayStart = B.putul + 40;
  const cutawayEnd = B.pipre + 38;
  const cutawayOp =
    f >= cutawayStart && f < cutawayEnd ? EASE.inOut(clamp((f - cutawayStart) / 10, 0, 1)) * EASE.inOut(clamp((cutawayEnd - f) / 10, 0, 1)) : 0;
  const shrugAt = cutawayEnd - 8;

  /* ---------------- Camera ---------------- */
  const cutB = p10.from - 8; // Shot 26: the priest, the bone-dry bowl, P10, the explosion
  const cutC = s6c.from - 6; // Shot 27: medium close on Balak (+ the memory vignette)
  const cutD = s6d.from - 8; // Shot 28: wide doorway, the family rushes in
  const cutE = s6e.from - 6; // Shot 29: medium close on Balak, slow push
  const cutF = p11.from - 4; // P11: reaction cut to the priest, blinking
  const cutG = p11.from + 30; // P11: everyone, smiling
  // frameAt: world point (cx, wy) lands at screen (960, sy) at zoom z. Floors, laps and the bowl stay at screen
  // y <= 810, clear of the caption band and the speaker pill.
  const frameAt = (cx: number, wy: number, sy: number, z: number): Cam => ({ x: cx - 960, y: wy - 540 - (sy - 540) / z, zoom: z, focus: 1.0 });
  let cam: Cam;
  let archOp = 0;
  if (f < cutB) {
    // Shot 25: medium two-shot, Balak and the priest, the bowl between them
    const t = ramp(f, 0, cutB);
    cam = frameAt(lerp(1030, 1040, t), SHRINE.floorY, 800, lerp(1.82, 1.86, t));
  } else if (f < cutC) {
    // Shot 26: medium close on the priest (and the bone-dry bowl at the left), P10, the explosion
    const push = ramp(f, B.ae, B.ae + 26);
    const shake = f >= B.sarbonash && f < B.sarbonash + 44 ? 2.4 * (1 - (f - B.sarbonash) / 44) : 0;
    cam = { ...frameAt(lerp(1110, 1130, push), SHRINE.priestY, lerp(780, 760, push), lerp(2.05, 2.2, push)), shake };
  } else if (f < cutD) {
    // Shot 27: medium close on Balak (+ the memory cutaway)
    const t = ramp(f, cutC, cutD);
    cam = frameAt(lerp(900, 904, t), SHRINE.floorY, 800, lerp(2.1, 2.16, t));
  } else if (f < cutE) {
    // Shot 28: wide doorway, the family rushes in on the veranda
    const t = ramp(f, cutD, cutE);
    cam = frameAt(lerp(900, 908, t), 1000, 810, lerp(1.06, 1.08, t));
    archOp = 1;
  } else if (f < cutF) {
    // Shot 29: medium close on Balak, slow push
    const t = ramp(f, cutE, cutF);
    cam = frameAt(lerp(890, 896, t), SHRINE.floorY, 800, lerp(2.0, 2.24, t));
  } else if (f < cutG) {
    // P11: reaction cut to the priest, blinking
    cam = frameAt(1170, SHRINE.priestY, 790, 2.2);
  } else {
    const t = ramp(f, cutG, SCENE_TOTAL_FRAMES);
    cam = frameAt(lerp(920, 926, t), 1000, 810, lerp(1.1, 1.12, t));
    archOp = 1;
  }
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---------------- Priest ---------------- */
  const priestRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["06b_Bhagabati_Explode.wav"], fr);
  const priestActing = (fr: number) => {
    const rms = priestRms(fr);
    const turnBack = ramp(fr, s6a.from - 2, s6a.from + 16); // Balak's "ঠাকুরমশায়" turns him round
    const reachBowl = ramp(fr, B.confess2 + 20, B.confess2 + 44) * (1 - ramp(fr, p10.from - 10, p10.from + 4));
    const stare = fr >= p10.from - 14 && fr < s6b.from;
    const inB = fr >= s6b.from && fr < s6c.from;
    const jerk = inB ? ramp(fr, B.ae, B.ae + 6) * (1 - ramp(fr, B.excl, B.excl + 10)) : 0;
    // "অ্যাঁ?": comic shock face — brows shot up and drawn together, eyes wide, jaw drop, shoulders hiked
    const shock = inB ? ramp(fr, B.ae - 4, B.ae + 4) * (1 - ramp(fr, B.sarbonash + 14, B.ore)) : 0;
    const head = inB ? ramp(fr, B.excl - 2, B.excl + 8) * (1 - ramp(fr, B.sarbonash - 4, B.sarbonash + 4)) : 0;
    // both palms fly up on the first beat of shock, then "সর্বনাশ!" keeps one arm high
    const fling = inB ? ramp(fr, B.ae - 2, B.ae + 8) * (1 - ramp(fr, B.sarbonash + 6, B.ore)) : 0;
    const up = inB ? Math.max(fling * 0.85, ramp(fr, B.sarbonash - 2, B.sarbonash + 8) * (1 - ramp(fr, B.ore + 4, B.ore + 16))) : 0;
    const shout = inB && fr >= B.ore && fr < B.babur + 4;
    const point = inB && fr >= B.babur + 4 && fr < s6b.to + 6;
    const listenC = fr >= s6c.from && fr < s6d.from;
    const hips = listenC ? ramp(fr, s6c.from + 20, s6c.from + 44) * (1 - ramp(fr, s6d.from - 30, s6d.from - 10)) : 0;
    const offended = fr >= B.khan + 40 && fr < B.khan + 90;
    const atFamily = fr >= s6d.from - 4 && fr < s6e.from;
    const realize = fr >= B.jigges + 30;
    const inP11 = fr >= p11.from;
    const flush =
      fr < p10.from - 14
        ? 0
        : fr < s6b.from
          ? 0.85 * ramp(fr, p10.from - 14, s6b.from) // P10: slowly turning bright red
          : fr < s6c.from
            ? 0.88
            : fr < s6e.from
              ? 0.6
              : lerp(0.5, 0.18, ramp(fr, B.jigges, p11.to));
    const blink = Math.max(
      blinkAt(fr, p10.from + 16, 3.5),
      blinkAt(fr, s6c.from + 140),
      blinkAt(fr, B.jigges + 52, 3.5),
      blinkAt(fr, p11.from + 6, 3.5),
      blinkAt(fr, p11.from + 17, 3.5),
      blinkAt(fr, p11.from + 40, 4),
    );
    const wave = shout ? Math.sin(fr * 0.5) * 14 : point ? Math.sin(fr * 0.42) * 8 * (0.4 + rms) : 0;
    const scratch = inP11 ? ramp(fr, p11.from + 22, p11.from + 34) : 0;
    return poseOf({
      kneel: 0,
      // Keep shock/reach extremes; idle and light speak stay nearly upright (no chronic forward hunch).
      lean: stare
        ? 5
        : reachBowl > 0
          ? 4 + 6 * reachBowl
          : shock > 0.4
            ? -12 * shock
            : jerk > 0
              ? -7 * jerk
              : up > 0
                ? -4
                : shout
                  ? 2.5
                  : point
                    ? 2
                    : hips > 0
                      ? -1
                      : 0.3 * Math.sin(fr * 0.05),
      bodyY: -6 * up + 5 * shock,
      bodyTurn: safeBodyTurn(lerp(0.3, -0.32, turnBack)),
      headTurn: lerp(0.42, shout ? -0.7 : atFamily ? -0.62 : -0.44, turnBack),
      headNod: stare ? 9 : reachBowl > 0 ? 5 : shock > 0.4 ? -10 * shock : jerk > 0 ? -6 * jerk : inP11 ? 2 : 0,
      hunch: 0.88 * shock,
      headTilt: shock > 0.3 ? -5 * shock : inP11 ? -3 : 0,
      eyeX: inP11 ? 0.12 * Math.sin((fr - p11.from) * 0.3) : shock > 0.3 ? -0.1 * shock : 0,
      lid: shock > 0.2 ? 0 : Math.max(blink, turnBack < 0.5 ? 0.66 : 0),
      eyeY: shock > 0.2 ? -0.16 : stare ? 0.55 : reachBowl > 0 ? 0.4 : inB ? 0.04 : 0.12,
      brow: shock > 0.05 ? lerp(0.9, 1.0, shock) : stare ? 0.7 : inB ? 0.78 : offended ? 0.74 : realize || inP11 ? 0.62 : listenC || atFamily ? 0.42 : 0.22,
      browTilt: shock > 0.05 ? 0.85 * shock : listenC || atFamily ? 0.26 : realize ? -0.2 : 0,
      smile: stare || inB || shock > 0.2 ? -0.5 : listenC ? -0.15 : inP11 ? 0.1 : 0.05,
      gasp: shock > 0.05 ? Math.max(0.98 * shock, rms > 0.08 ? 0.45 : 0.88) : stare ? 0.55 + 0.3 * ramp(fr, p10.from, s6b.from) : inB ? (rms > 0.08 ? 0.4 : 0.72) : offended ? 0.4 : realize ? 0.22 : 0,
      flush,
      headHands: Math.max(0.9 * head, 0.55 * fling * (1 - up)),
      throwUp: shout ? -0.85 : fling > 0.2 ? 0.7 * fling : 0,
      hips: 0.9 * hips,
      scratch: 0.85 * scratch,
      reach: reachBowl,
      rHand: point ? "point" : reachBowl > 0.1 ? "open" : inB || atFamily || fling > 0.2 ? "open" : "relaxed",
      lHand: inB || atFamily || fling > 0.2 ? "open" : "relaxed",
      rS: point ? 62 + wave : atFamily ? 40 : lerp(16, 148, up) + wave * 0.5,
      rE: point ? -18 : atFamily ? -40 : lerp(-32, -18, up),
      lS: lerp(14, 142, up) - wave * 0.5,
      lE: lerp(-28, -20, up),
    });
  };

  /* ---------------- Balak ---------------- */
  const balakRms = ep04gSpeakRms(
    SCENE_ID,
    ["06a_Balak_CoconutConfess.wav", "06c_Balak_AntsLogic.wav", "06e_Balak_LegalDefense.wav"],
    f,
  );
  const inP11 = f >= p11.from;
  const familyIn = s6d.from - 18;

  let pose: SeatedPose = "sitCross";
  let prevPose: SeatedPose | undefined;
  let poseStart = 0;
  let pointAt: { x: number; y: number } | undefined;
  let handTargets: SeatedChildProps["handTargets"];
  let kneel = 0;
  let expr: SeatedExpression = "serene";
  let face: SeatedChildProps["face"] = { lookX: 0.36, smile: 0.7 };
  let headShake: number | undefined;

  if (f < B.confess2 + 6) {
    expr = "joyful";
    face = { lookX: 0.38, smile: 0.78 };
  } else if (f < p10.from - 8) {
    // points casually at the empty bowl with the lonely fopra
    pose = "pointIn";
    prevPose = "sitCross";
    poseStart = B.confess2 + 6;
    pointAt = { x: 86, y: -40 };
    expr = "joyful";
    face = { lookX: 0.4, smile: 0.8 };
  } else if (f < B.chechacchen + 6) {
    pose = "sitCross";
    prevPose = "pointIn";
    poseStart = p10.from - 8;
    expr = f >= s6b.from ? "surprised" : "joyful";
    face = { lookX: 0.44, smile: f >= s6b.from ? 0.4 : 0.72 };
  } else if (f < B.khan - 4) {
    // "ও ঠাকুরমশায়, আপনি চেঁচাচ্ছেন কেন?": a calming palm
    pose = "palmRaise";
    prevPose = "sitCross";
    poseStart = B.chechacchen + 6;
    expr = "compassionate";
    face = { lookX: 0.44, smile: 0.55 };
  } else if (f < B.putul + 6) {
    // "ফোপড়াটা আপনিই খান…": leans forward earnestly, offering the fopra in the bowl
    pose = "pointIn";
    prevPose = "palmRaise";
    poseStart = B.khan - 4;
    pointAt = { x: 90, y: -46 };
    kneel = 0.9 * ramp(f, B.khan - 4, B.khan + 12) * (1 - ramp(f, B.putul - 12, B.putul + 6));
    expr = "playful";
    face = { lookX: 0.42, smile: 0.7 };
  } else if (f < shrugAt) {
    pose = "sitCross";
    prevPose = "pointIn";
    poseStart = B.putul + 6;
    expr = "thoughtful";
    face = { lookX: 0.3, smile: 0.5 };
  } else if (f < familyIn) {
    // back to Balak: an innocent little shrug, palms open
    pose = "handsTo";
    prevPose = "sitCross";
    poseStart = shrugAt;
    handTargets = { near: { x: 70, y: -96 }, far: { x: 34, y: -104 } };
    expr = "playful";
    face = { lookX: 0.4, smile: 0.72 };
  } else if (f < B.dhoop) {
    // the family at the doorway: he turns his head to them, calm; "আমি তো ইচ্ছে করে ঢুকিনি!"
    pose = "sitCross";
    prevPose = "handsTo";
    poseStart = familyIn;
    expr = "serene";
    face = { lookX: -0.42, smile: 0.6 };
    headShake = B.ichchhe + 10;
  } else if (f < B.jigges) {
    // "ধূপ দেওয়ার কেউ ছিল না—": a small open hand toward the dhoop-dani
    pose = "pointIn";
    prevPose = "sitCross";
    poseStart = B.dhoop;
    pointAt = { x: 170, y: -40 };
    expr = "serene";
    face = { lookX: 0.1, smile: 0.62 };
  } else if (f < p11.from) {
    // "আমি তো ঠাকুরমশায়কে জিজ্ঞেস করেই ভেতরে ঢুকেছি!": open palm toward the priest, fearless smile
    pose = "pointIn";
    prevPose = "pointIn";
    poseStart = B.jigges;
    pointAt = { x: 170, y: -128 };
    expr = "serene";
    face = { lookX: 0.46, smile: 0.78 };
  } else {
    pose = "sitCross";
    prevPose = "pointIn";
    poseStart = p11.from;
    expr = "joyful";
    face = { lookX: 0.4, smile: 0.92 };
  }

  const balakProps: SeatedChildProps = {
    x: SHRINE.seatX,
    y: SHRINE.floorY,
    s: SHRINE.balakS,
    design: "plate",
    age: 5,
    f,
    lifeF: f,
    pose,
    prevPose,
    poseStart,
    pointAt,
    kneel,
    handTargets,
    handShapes: handTargets ? { near: "open", far: "open" } : undefined,
    handTurns: handTargets ? { near: 0.2, far: -0.2 } : undefined,
    face,
    expression: expr,
    headShake,
    mouth: balakRms,
    talk: balakRms > 0.08 ? 1 : 0,
  };
  const glowAnchor = seatedChildHands(balakProps).glowAnchor;

  /* ---------------- Family rushing to the doorway (on the veranda, in front of the arch) ---------------- */
  const showFamily = f >= familyIn - 2;
  const famY = 1000;
  const sundarSpotFn = ghibliWalkSpot({ x: -300, y: famY, s: 1.0 }, { x: 470, y: famY, s: 1.0 }, familyIn, familyIn + 52, EP04G_CAST.sundar.seed);
  const jyethiSpotFn = ghibliWalkSpot({ x: -200, y: famY, s: 0.98 }, { x: 600, y: famY, s: 0.98 }, familyIn - 4, familyIn + 46, EP04G_CAST.jyethi.seed);
  const charuSpotFn = ghibliWalkSpot({ x: -120, y: famY, s: 0.98 }, { x: 728, y: famY, s: 0.98 }, familyIn, familyIn + 50, EP04G_CAST.charu.seed);
  const sundarSpot = sundarSpotFn(f);
  const jyethiSpot = jyethiSpotFn(f);
  const charuSpot = charuSpotFn(f);
  const sundarStrideFn = ghibliStrideOf(sundarSpotFn, EP04G_CAST.sundar);
  const jyethiStrideFn = ghibliStrideOf(jyethiSpotFn, EP04G_CAST.jyethi);
  const charuStrideFn = ghibliStrideOf(charuSpotFn, EP04G_CAST.charu);
  const jyethiRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["06d_Family_ScoldShrine.wav"], fr);
  const fondAt = (fr: number) => ramp(fr, B.jigges + 40, p11.from + 20);

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliShrineBackdrop f={f} />
      <ShrineGobinda />

      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffcf82" bounceColor="#8c9ab8" />

        {/* the empty stone bowl with the whole fopra, exactly where he set it back in Scene 05 */}
        <ContactShadow x={BOWL_FLOOR.x} y={SHRINE.floorY} rx={36 * (BOWL_FLOOR_S / 0.94)} ry={8.5} opacity={0.32} sunDir={-1} />
        <HeldObjectArt kind="stoneBowl" x={BOWL_FLOOR.x} y={BOWL_FLOOR.y} s={BOWL_FLOOR_S} fill={0} />

        {/* the dhoop-dani where he set it down beside the priest, still smoking */}
        <ContactShadow x={DHOOP_SET.x} y={SHRINE.floorY} rx={17} ry={4.5} opacity={0.3} sunDir={-1} />
        <HeldObjectArt kind="incense" x={DHOOP_SET.x} y={DHOOP_SET.y} s={SHRINE.balakS} lifeF={f} />
        <GhibliSmokeCurls x={DHOOP_SET.x} y={DHOOP_SET.y - 10} f={f} scale={0.6} />

        {/* the hand-bell, put down at his side */}
        <FloorBell x={SHRINE.priestX + 62} y={SHRINE.floorY + 2} />

        {/* Thakurer ashon / khat base */}
        <ContactShadow x={1080} y={SHRINE.floorY} rx={120} ry={18} opacity={0.42} sunDir={-1} />

        {/* Bhagabati Thakur */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={SHRINE.priestX} y={SHRINE.floorY} rx={92} ry={18} opacity={0.48} sunDir={-1} />
          <Puppet
            cast={EP04G_CAST.bhagabati}
            x={SHRINE.priestX}
            y={SHRINE.priestY}
            scale={SHRINE.priestS}
            f={f}
            lifeF={f}
            light={EP04G_SHRINE_LIGHT}
            seated
            mouth={(fr) => {
              // "অ্যাঁ?": the jaw drops wide open in shock (then the line's own lip sync)
              const sm = shoutMouth(fr, B.ae - 2, 30, 5);
              const lm = mouthFromRms(priestRms(fr), fr);
              return sm.open > lm.open ? sm : lm;
            }}
            talk={(fr) => clamp(priestRms(fr) * 1.2, 0, 1)}
            acting={priestActing}
            reachAt={() => ({ x: BOWL_FLOOR.x + 70, y: BOWL_FLOOR.y - 40 })}
          />
        </g>

        {/* Balak before the khat; steady soft light, no glow beat in this scene (BAL-05) */}
        <GhibliBalakGroundGlow x={SHRINE.seatX} y={SHRINE.floorY + 5} level={0.45} />
        <g
          transform={balakLivingBodyTransform({
            x: SHRINE.seatX,
            y: SHRINE.floorY,
            f,
            facing: 1,
            speechRms: balakRms,
            tenderness: inP11 ? 0.45 : 0,
          })}
        >
          <GhibliBalakAura cx={glowAnchor.cx} cy={glowAnchor.cy} r={78} glow={0.55} f={f} />
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={SHRINE.seatX} y={SHRINE.floorY} rx={42} ry={9} opacity={0.28} sunDir={-1} />
            <SeatedChild {...balakProps} />
            {kneel < 0.35 && <GhibliBalakLapDetails x={SHRINE.seatX} y={SHRINE.floorY} s={SHRINE.balakS} f={f} />}
          </g>
        </g>
      </GhibliLayer>

      {/* the lamplight on the people inside */}
      <ShrineLampLight id="s06lamp" f={f} />

      {/* the doorway arch, curtain drawn back (doorway shots only) */}
      <ShrineArchFrame id="s06arch" opacity={archOp} f={f} />

      {/* Sundar, Jyethi and Charu rush to the doorway: on the veranda, outside the threshold */}
      {showFamily && (
        <GhibliLayer depth={1.0}>
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={sundarSpot.x} y={famY} rx={44} ry={10} opacity={0.28} sunDir={-1} />
            <Puppet
              cast={EP04G_CAST.sundar}
              x={sundarSpot.x}
              y={sundarSpot.y}
              scale={sundarSpot.s}
              f={f}
              lifeF={f}
              light={EP04G_SHRINE_LIGHT}
              acting={(fr) => {
                const fond = fondAt(fr);
                const hide = fr >= s6d.from + 30 && fr < B.jigges + 40 ? 1 : 0;
                const chuckle = fr >= p11.from + 4 ? Math.max(0, Math.sin((fr - p11.from) * 0.55)) * (1 - ramp(fr, p11.from + 30, p11.to)) : 0;
                return poseOf({
                  stride: sundarStrideFn(fr),
                  bodyY: -1.5 * chuckle,
                  bodyTurn: safeBodyTurn(0.32),
                  headTurn: lerp(0.38, 0.46, fond),
                  headTilt: lerp(1.0, 4, fond),
                  headNod: hide ? 3 : 0,
                  brow: lerp(0.1, 0.24, fond),
                  smile: hide ? 0.55 : lerp(0.3, 0.92, fond),
                  cheeks: lerp(0.12, 0.5, fond),
                  lid: chuckle * 0.5,
                  mouthHand: hide ? 0.6 * ramp(fr, s6d.from + 30, s6d.from + 44) * (1 - ramp(fr, B.jigges + 20, B.jigges + 40)) : 0,
                  rS: 14,
                  rE: -24,
                  lS: 12,
                  lE: -20,
                });
              }}
            />
          </g>
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={jyethiSpot.x} y={famY} rx={44} ry={10} opacity={0.29} sunDir={-1} />
            <Puppet
              cast={EP04G_CAST.jyethi}
              x={jyethiSpot.x}
              y={jyethiSpot.y}
              scale={jyethiSpot.s}
              f={f}
              lifeF={f}
              light={EP04G_SHRINE_LIGHT}
              mouth={(fr) => mouthFromRms(jyethiRms(fr), fr)}
              talk={(fr) => clamp(jyethiRms(fr) * 1.2, 0, 1)}
              acting={(fr) => {
                const speaking = fr >= s6d.from && fr < s6d.to;
                const fond = fondAt(fr);
                const wag = speaking ? Math.sin(fr * 0.62) * 9 : 0;
                return poseOf({
                  stride: jyethiStrideFn(fr),
                  lean: speaking ? 1.2 : 0.2,
                  bodyTurn: safeBodyTurn(0.32),
                  headTurn: 0.42,
                  brow: speaking ? -0.3 : lerp(-0.1, 0.18, fond),
                  smile: speaking ? -0.1 : lerp(0.15, 0.55, fond),
                  rS: speaking ? 58 + wag : 16,
                  rE: speaking ? -48 + wag * 0.5 : -24,
                  rHand: speaking ? "point" : "relaxed",
                });
              }}
            />
          </g>
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={charuSpot.x} y={famY} rx={45} ry={10} opacity={0.3} sunDir={-1} />
            <Puppet
              cast={EP04G_CAST.charu}
              x={charuSpot.x}
              y={charuSpot.y}
              scale={charuSpot.s}
              f={f}
              lifeF={f}
              light={EP04G_SHRINE_LIGHT}
              acting={(fr) => {
                const fond = fondAt(fr);
                const cover = ramp(fr, s6d.from + 6, s6d.from + 20) * (1 - ramp(fr, B.jigges + 10, B.jigges + 30));
                return poseOf({
                  stride: charuStrideFn(fr),
                  bodyTurn: safeBodyTurn(lerp(0.32, 0.24, fond)),
                  headTurn: lerp(0.38, 0.3, fond),
                  headTilt: lerp(-1.2, 3.2, fond),
                  headNod: 3 * cover,
                  brow: lerp(-0.18, 0.2, fond),
                  gasp: fr < s6d.from + 20 ? 0.24 : 0,
                  smile: lerp(0.28, 0.72, fond),
                  cheeks: lerp(0.2, 0.46, fond),
                  mouthHand: 0.75 * cover,
                  join: fond * 0.5,
                  rHand: fond > 0.35 ? "pranam" : "relaxed",
                  lHand: fond > 0.35 ? "pranam" : "relaxed",
                });
              }}
            />
          </g>
        </GhibliLayer>
      )}

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} warmth={0.3} />

      <AntsOnDollCutawayVignette f={f} startF={cutawayStart} opacity={cutawayOp} />
    </GhibliStage>
  );
};
