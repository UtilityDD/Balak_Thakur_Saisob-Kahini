import React from "react";
import { staticFile } from "remotion";
import { clamp, EASE, lerp } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { CAST } from "../../../cinematic/rig/cast";
import { type CastMember, type Lighting, type Pose, Puppet } from "../../../cinematic/rig/Puppet";
import { SeatedChild, seatedChildHands, type SeatedChildProps, type SeatedExpression, type SeatedPose } from "../../../episode03/rig/SeatedChild";
import { StandingChild, standingChildJoints, type StandingChildProps, type StandingPose } from "../../../episode05/rig/StandingChild";
import { BN_FONT } from "../../../cinematic/fonts";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer } from "../../GhibliStage";
import { balakLivingBodyTransform } from "../../core/ghibliBalak";
import { EP04G_AFTERNOON_LIGHT, EP04G_MORNING_LIGHT, mouthFromRms } from "../../episode04/Ep04GhibliShared";
import { EP05_BALAK_AGE, EP05_BALAK_LOOK } from "../ep05BalakLook";
import { EP05_BALAK_INK, EP05_GLOW, Ep05BalakDivine, Ep05BalakGroundGlow, Ep05BalakInkDefs, ep05GlowLevel } from "../Ep05BalakDivine";
import { EP05R_SPANS, ep05rRoleRms, ep05rSpan, ep05rTalking } from "../timing";

/**
 * SKELETON KIT for the Ghibli Episode 5 rewrite scenes (STO-23; blueprint section 5). Shared by
 * scenes/Scene0NRewrite*.tsx only. It gives each skeleton scene:
 *   - shot tables keyed to the generated spans and caption cues (Shot, shotAt, camAt: cuts and eased pushes, CAM-13),
 *   - painted full-frame plates for the places that have no layered set yet (PaintedPlate, plateKeep),
 *   - placeholder blocking: Balak seated / standing in the BAL-26f look (EP05_BALAK_LOOK, one switch in ep05BalakLook.ts)
 *     with his restrained halo (Ep05BalakDivine), and the adults as Puppets with a mouth on their own lines,
 *   - a small top-left SKELETON tag (scene, shot, beat, stand-in notes) while SKELETON_LABELS is true.
 * The acting pass replaces the placeholder blocking with the cast components (Ep05RewriteCast) and real choreography.
 * Mouths: the measured voice envelope when the WAV exists, else a placeholder flap during the line's estimated window.
 */

/** Turn the top-left skeleton tag off for the acting pass / final renders. */
export const SKELETON_LABELS = true;

export const SUN_MORNING: Lighting = EP04G_MORNING_LIGHT;
export const SUN_AFTERNOON: Lighting = EP04G_AFTERNOON_LIGHT;

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

export interface Shot {
  /** "AG1", "Shot 4", "P3" ... (blueprint section 5) */
  name: string;
  /** scene-local frame the shot starts (a cut) */
  from: number;
  /** which set / plate the scene draws for this shot */
  view: string;
  cam: Cam;
  /** one eased move inside the shot (zoom-space interpolation, CAM-13) */
  push?: { to: Cam; a: number; b: number };
  /** shown in the skeleton tag */
  note?: string;
}

export const shotAt = (f: number, shots: readonly Shot[]): Shot => {
  let k = 0;
  for (let i = 0; i < shots.length; i++) if (f >= shots[i].from) k = i;
  return shots[k];
};

export const camAt = (f: number, shot: Shot): Cam => {
  if (!shot.push) return shot.cam;
  const a = shot.cam;
  const b = shot.push.to;
  const u = EASE.inOut(clamp((f - shot.push.a) / Math.max(1, shot.push.b - shot.push.a)));
  const z = a.zoom * Math.pow(b.zoom / a.zoom, u);
  const den = 1 / a.zoom - 1 / b.zoom;
  const k = Math.abs(den) < 1e-6 ? u : (1 / a.zoom - 1 / z) / den;
  return { ...a, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), zoom: z };
};

/** A cam that puts world point (wx, wy) of the depth-1 plane at the screen centre at zoom z. */
export const frameOn = (wx: number, wy: number, zoom: number): Cam => ({ x: wx - 960, y: wy - 540, zoom, focus: 1 });

/** Clamp a cam so a depth-1 plate covering `rect` never shows its edge. */
export const plateKeep = (c: Cam, rect: { x: number; y: number; w: number; h: number }): Cam => {
  const z = Math.max(1, c.zoom);
  const hx = 960 / z;
  const hy = 540 / z;
  const x = clamp(c.x, rect.x - 960 + hx + 2, rect.x + rect.w - 960 - hx - 2);
  const y = clamp(c.y, rect.y - 540 + hy + 2, rect.y + rect.h - 540 - hy - 2);
  return { ...c, x, y, zoom: z };
};

/** Name of the line or beat that holds scene-local frame f ("" between items). */
export const beatAt = (sceneId: string, f: number): string => {
  const w = EP05R_SPANS[sceneId] ?? {};
  let best = "";
  for (const [k, v] of Object.entries(w)) if (k !== "open" && k !== "tail" && f >= v.from && f < v.to) best = k;
  return best.replace(/\.wav$/, "");
};

/** Smoothstep window helper: 0 before a, 1 after b. */
export const ramp = (f: number, a: number, b: number): number => EASE.inOut(clamp((f - a) / Math.max(1, b - a)));

export const span = ep05rSpan;

/* ------------------------------------------------------------------ */
/* Mouth                                                               */
/* ------------------------------------------------------------------ */

/** 0..1 mouth level for a role: measured envelope, or a placeholder flap while the line is still an estimate. */
export const roleMouth = (sceneId: string, role: string, f: number): number => {
  const r = ep05rRoleRms(sceneId, role, f);
  if (r > 0) return r;
  return ep05rTalking(sceneId, role, f) ? 0.28 + 0.22 * Math.abs(Math.sin(f * 0.62)) * (0.6 + 0.4 * Math.sin(f * 0.17)) : 0;
};

/* ------------------------------------------------------------------ */
/* Plates                                                              */
/* ------------------------------------------------------------------ */

export interface PlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 16:9 plates drawn 2400 x 1350 round the frame: room for pushes up to about 1.25 x anywhere, more near the centre. */
export const PLATE_RECT: PlateRect = { x: -240, y: -135, w: 2400, h: 1350 };

export const PaintedPlate: React.FC<{ href: string; rect?: PlateRect; depth?: number; blur?: number; opacity?: number }> = ({
  href,
  rect = PLATE_RECT,
  depth = 1,
  blur = 0,
  opacity = 1,
}) => (
  <GhibliLayer depth={depth} extraBlur={blur} opacity={opacity}>
    <image href={staticFile(href)} x={rect.x} y={rect.y} width={rect.w} height={rect.h} preserveAspectRatio="xMidYMid slice" />
  </GhibliLayer>
);

/**
 * Riverbank STAND-IN (riverbank_jam_back, riverbank_floor_sketch and tree_jamun_sketch are not painted yet): the Padma
 * outro card as the river and far bank, with the grove floor laid along the bottom as the near bank Balak sits on.
 * Put Balak at RIVER_SEAT (his face clears the caption band).
 */
export const RIVER_SEAT = { x: 1380, y: 908, s: 0.62 };
export const RiverbankStandIn: React.FC = () => (
  <>
    <PaintedPlate href="images/ghibli_ep05/card_outro_padma_sketch.png" />
    <GhibliLayer depth={1}>
      <image href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")} x={-240} y={846} width={2400} height={420} preserveAspectRatio="none" />
    </GhibliLayer>
  </>
);

/** Warm late-afternoon / flashback wash over a whole frame (no box, a feathered vignette: blueprint 3.1 item 6). */
export const WarmWash: React.FC<{ amount: number; vignette?: number; color?: string }> = ({ amount, vignette = 0, color = "#ffcf8a" }) => {
  if (amount <= 0.001 && vignette <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: color, mixBlendMode: "soft-light", opacity: amount }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 72% 66% at 50% 46%, rgba(255,240,210,0) 55%, rgba(120,70,30,0.55) 100%)",
          opacity: vignette,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Cast (placeholder blocking)                                         */
/* ------------------------------------------------------------------ */

export const ROLE_CAST: Record<string, CastMember> = {
  charu: CAST.charu,
  surendra: CAST.surendra,
  binoy: CAST.binoy,
  haricharan: CAST.haricharan,
  binoyMother: CAST.womanA,
  // placeholders until the new clerk puppets exist (blueprint section 2, rows 7 and 8)
  clerkSenior: CAST.listenerB,
  clerkJunior: CAST.listenerA,
};

export const SkelPuppet: React.FC<{
  sceneId: string;
  role: keyof typeof ROLE_CAST | string;
  x: number;
  y: number;
  s: number;
  f: number;
  flip?: boolean;
  seated?: boolean;
  sitStyle?: "crossLegged" | "kneel";
  light?: Lighting;
  acting?: Partial<Pose>;
  breathRate?: number;
  shadow?: boolean;
  opacity?: number;
}> = ({ sceneId, role, x, y, s, f, flip, seated, sitStyle, light = SUN_MORNING, acting, breathRate, shadow = true, opacity }) => {
  const cast = ROLE_CAST[role];
  if (!cast) return null;
  const m = roleMouth(sceneId, role, f);
  return (
    <g>
      {shadow && <ContactShadow x={x} y={y + 2} rx={(seated ? 58 : 34) * s} ry={9 * s} opacity={0.3} castStretch={1.15} />}
      <g filter="url(#ghibli-char-ink)">
        <Puppet
          cast={cast}
          f={f}
          lifeF={f}
          x={x}
          y={y}
          scale={s}
          flip={flip}
          seated={seated}
          sitStyle={sitStyle}
          light={light}
          acting={acting ? () => acting : undefined}
          mouth={() => mouthFromRms(m, f)}
          talk={() => m}
          breathRate={breathRate}
          opacity={opacity}
        />
      </g>
    </g>
  );
};

/** Defs every skeleton figure layer needs: the character ink and Balak's own fine ink at this zoom. */
export const FigureDefs: React.FC<{ f: number; zoom: number; dapple?: boolean; rim?: number }> = ({ f, zoom, dapple, rim = 0.5 }) => (
  <>
    <GhibliCharFilterDefs f={f} dapple={dapple} />
    <Ep05BalakInkDefs zoom={zoom} rim={rim} />
  </>
);

/** Seated Balak (BAL-26f look, age 6, STO-20b seated), his halo behind the head and a faint ground glow. */
export const SkelBalakSeated: React.FC<{
  sceneId: string;
  x: number;
  y: number;
  s: number;
  f: number;
  flip?: boolean;
  /** 0 = rest, 1 = a glow beat (ep05GlowBeat) */
  glowBeat?: number;
  pose?: SeatedPose;
  poseStart?: number;
  expression?: SeatedExpression;
  lookX?: number;
  smile?: number;
  eyesDown?: number;
  zoom?: number;
}> = ({ sceneId, x, y, s, f, flip, glowBeat = 0, pose = "sitCross", poseStart = 0, expression, lookX = 0, smile = 0.2, eyesDown = 0, zoom = 1 }) => {
  const m = roleMouth(sceneId, "balak", f);
  const props: SeatedChildProps = {
    x,
    y,
    s,
    f,
    lifeF: f,
    flip,
    design: "plate",
    age: EP05_BALAK_AGE,
    build: "healthy",
    pose,
    poseStart,
    expression,
    face: { lookX, smile, eyesDown },
    mouth: m,
    talk: m > 0.06 ? 1 : 0,
    ...EP05_BALAK_LOOK,
  };
  const g = seatedChildHands(props).glowAnchor;
  return (
    <g transform={balakLivingBodyTransform({ x, y, f, facing: flip ? -1 : 1, speechRms: m })}>
      <Ep05BalakDivine cx={g.cx} cy={g.cy} r={g.r * 0.7} glow={ep05GlowLevel("halo", glowBeat)} f={f} />
      <ContactShadow x={x} y={y + 2} rx={62 * s} ry={12 * s} opacity={0.3} castStretch={1.15} />
      <Ep05BalakGroundGlow x={x} y={y + 4} rx={150 * s} ry={26 * s} level={ep05GlowLevel("ground", glowBeat)} />
      <g filter={`url(#${EP05_BALAK_INK})`}>
        <SeatedChild {...props} inkZoom={zoom} />
      </g>
    </g>
  );
};

/** Standing Balak (BAL-26f look, healthy build). `pose` defaults to standQuiet. No walk cycle in the skeleton. */
export const SkelBalakStanding: React.FC<{
  sceneId: string;
  x: number;
  y: number;
  s: number;
  f: number;
  flip?: boolean;
  glowBeat?: number;
  pose?: StandingPose;
  poseStart?: number;
  zoom?: number;
  headScale?: number;
}> = ({ sceneId, x, y, s, f, flip, glowBeat = 0, pose = "standQuiet", poseStart = 0, zoom = 1, headScale = 1.35 }) => {
  const m = roleMouth(sceneId, "balak", f);
  const props: StandingChildProps = {
    x,
    y,
    s,
    f,
    lifeF: f,
    flip,
    age: EP05_BALAK_AGE,
    build: "healthy",
    sturdy: true,
    headScale,
    pose,
    poseStart,
    mouth: m,
    talk: m > 0.06 ? 1 : 0,
    ...EP05_BALAK_LOOK,
  };
  const j = standingChildJoints(props);
  const r = EP05_GLOW.haloR * j.headScale;
  return (
    <g>
      <Ep05BalakDivine cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={r} glow={ep05GlowLevel("halo", glowBeat)} f={f} />
      <ContactShadow x={x} y={y + 2} rx={40 * s} ry={9 * s} opacity={0.3} castStretch={1.15} />
      <Ep05BalakGroundGlow x={x} y={y + 4} rx={110 * s} ry={20 * s} level={ep05GlowLevel("ground", glowBeat)} />
      <g filter={`url(#${EP05_BALAK_INK})`}>
        <StandingChild {...props} inkZoom={zoom} />
      </g>
    </g>
  );
};

/** A small leaf (the motif Balak leaves on the mat, blueprint 3.4 item 3). */
export const MangoLeaf: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = -12, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -16 0 Q -4 -7 16 0 Q -4 7 -16 0 Z" fill="#6f8a3a" stroke="#3A2618" strokeWidth={1.1} />
    <path d="M -15 0 L 15 0" stroke="#3A2618" strokeWidth={0.7} opacity={0.6} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Skeleton tag                                                        */
/* ------------------------------------------------------------------ */

export const SkeletonTag: React.FC<{ sceneId: string; shot: Shot; f: number; standIn?: string }> = ({ sceneId, shot, f, standIn }) => {
  if (!SKELETON_LABELS) return null;
  const beat = beatAt(sceneId, f);
  return (
    <div
      style={{
        position: "absolute",
        left: 18,
        top: 14,
        padding: "6px 12px",
        borderRadius: 6,
        background: "rgba(20,12,6,0.55)",
        color: "#ffe9c4",
        fontFamily: `${BN_FONT}, sans-serif`,
        fontSize: 20,
        lineHeight: 1.3,
        pointerEvents: "none",
        maxWidth: 1100,
      }}
    >
      <div style={{ fontWeight: 700 }}>
        SKELETON · {sceneId} · {shot.name}
        {beat ? ` · ${beat}` : ""} · f{Math.round(f)}
      </div>
      {shot.note || standIn ? <div style={{ fontSize: 16, opacity: 0.85 }}>{[shot.note, standIn].filter(Boolean).join(" · ")}</div> : null}
    </div>
  );
};
