import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { GhibliCutout, GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
} from "../../episode05/GhibliKachariSet";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rScene } from "../timing";
import {
  camAt,
  FigureDefs,
  frameOn,
  MangoLeaf,
  PaintedPlate,
  PLATE_RECT,
  plateKeep,
  ramp,
  type Shot,
  shotAt,
  SkelBalakSeated,
  SkelBalakStanding,
  SkeletonTag,
  SkelPuppet,
  span,
  SUN_MORNING,
} from "./RewriteKit";

/**
 * SKELETON · Scene 01 `01_kachari_chat_and_slip` (blueprint section 5): the Krishnanagar kachari compound, then the family
 * veranda in Ujanchar, late morning. Beats: AG1 (world open) · 01a · 01b · 01c + P1 · AG2 (the slip) · 01d + P2 · AG3 ·
 * 01e (Binoy off-screen) · 01f · 01g · AG4 (the run).
 *
 * SETS: AG1 on the existing Ghibli kachari compound (GhibliKachariBackdrop view "compound"), a held wide and the motivated
 * truck right toward the fence gap; from 01a the family veranda plate `ghibli_ep06/ujanchar_veranda_back.png` (the Episode 6
 * veranda, same village) with the Episode 4 madur mat. The blueprint's single continuous truck from the kachari to the veranda
 * is a CUT here until the set pass joins the two places in one panorama.
 *
 * BLOCKING (placeholder): Charu (left, facing right) and Surendra (right, facing left) seated on the mat; Balak seated behind
 * Charu's back twirling his leaf; in AG2 he stands and leaves to the right (no walk cycle yet: he slides and fades), the leaf
 * stays on the mat. AG4: the parents stand and go right.
 *
 * CAMERA (CAM-13, keyed to spans and caption cues): AG1 held wide + truck; Shot 1 medium wide, a push settling on
 * "আর ছোট্ট বীরু?"; Shot 2 two-shot cut 6 f before 01b, held through 01c, P1, AG2 (deep staging) and 01d + P2; AG3 held
 * wide; Shot 5 cut on the shout to a medium of both parents; Shot 6 close-up on Charu 6 f before 01f; Shot 7 medium on
 * Surendra; AG4 a pan right with the run.
 */

const SCENE_ID = "01_kachari_chat_and_slip";

const PRELOAD = ["images/ghibli_ep06/ujanchar_veranda_back.png", "images/ghibli_ep04/madur_mat_veranda_sketch.png"] as const;

// Veranda layout (world px on the plate drawn at PLATE_RECT): the plinth's front edge at y ~ 800, the yard below it.
const K = 0.78; // adult Puppet scale on the plinth
const CHARU = { x: 640, y: 812 };
const SUREN = { x: 900, y: 812 };
const BALAK = { x: 470, y: 816 };
const MAT = { x: 770, y: 830, h: 150 };
const LEAF = { x: 520, y: 822 };
const EXIT = { x: 1500, y: 860 };

const VERANDA_WIDE: Cam = frameOn(860, 610, 1.0);

export const Scene01RewriteKachariChat: React.FC = () => {
  const f = useCurrentFrame();
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const ag1 = span(SCENE_ID, "AG1_world_open");
  const l1a = span(SCENE_ID, "01a_Narrator_Kachari.wav");
  const l1b = span(SCENE_ID, "01b_Charu_EyeOnHim.wav");
  const ag2 = span(SCENE_ID, "AG2_the_slip");
  const ag3 = span(SCENE_ID, "AG3_time_passes");
  const l1e = span(SCENE_ID, "01e_Binoy_Shout.wav");
  const l1f = span(SCENE_ID, "01f_Charu_Alarm.wav");
  const l1g = span(SCENE_ID, "01g_Surendra_Run.wav");
  const ag4 = span(SCENE_ID, "AG4_the_run");
  const chotto = ep05rPhraseLocal(SCENE_ID, "আর ছোট্ট বীরু", l1a.from + Math.round(l1a.frames * 0.5));

  const TWO_SHOT = frameOn(770, 640, 1.65);
  const SHOTS: Shot[] = [
    {
      name: "AG1",
      from: 0,
      view: "compound",
      cam: { ...KACHARI.compound.cam, x: -80 },
      push: { to: { ...KACHARI.compound.cam, x: 120 }, a: Math.round(ag1.frames * 0.45), b: ag1.to + 8 },
      note: "held wide, then the truck right (cut to the veranda at 01a until the panorama exists)",
    },
    {
      name: "Shot 1",
      from: l1a.from,
      view: "veranda",
      cam: VERANDA_WIDE,
      push: { to: frameOn(760, 640, 1.3), a: chotto, b: chotto + 40 },
      note: "medium wide, settles on 'আর ছোট্ট বীরু?'",
    },
    { name: "Shot 2-3 · P1 · AG2 · Shot 4 · P2", from: l1b.from - 6, view: "veranda", cam: TWO_SHOT, note: "two-shot, deep staging" },
    { name: "AG3", from: ag3.from, view: "veranda", cam: VERANDA_WIDE, note: "held wide, time passes" },
    { name: "Shot 5", from: l1e.from, view: "veranda", cam: frameOn(780, 650, 1.9), note: "cut on the shout: both parents' heads snap" },
    { name: "Shot 6", from: l1f.from - 6, view: "veranda", cam: frameOn(CHARU.x + 10, 620, 3.0), note: "close-up Charu" },
    { name: "Shot 7", from: l1g.from, view: "veranda", cam: frameOn(SUREN.x, 640, 2.0), note: "medium Surendra rising" },
    {
      name: "AG4",
      from: ag4.from,
      view: "veranda",
      cam: frameOn(980, 640, 1.4),
      push: { to: frameOn(1500, 660, 1.4), a: ag4.from, b: dur },
      note: "pan right with the run",
    },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);
  const dof = zoomProportionalDof(raw.zoom);

  if (shot.view === "compound") {
    const cam = kachariKeepInSet("compound", { ...raw, focus: 0.65, dof });
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.compound, overflow: "hidden" }}>
        <GhibliStage cam={cam} background={KACHARI_BG.compound}>
          <GhibliKachariBackdrop view="compound" f={f} cam={cam} />
          <GhibliKachariFloorLayer view="compound" f={f} />
          <GhibliKachariForegroundAndGrade view="compound" f={f} zoom={cam.zoom} />
        </GhibliStage>
        <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
      </div>
    );
  }

  const cam = plateKeep({ ...raw, focus: 1, dof: 0 }, PLATE_RECT);

  /* placeholder blocking */
  const slipT = ramp(f, ag2.from + 8, ag2.to - 4);
  const balakStanding = f >= ag2.from + 4 && f < ag2.to;
  const balakGone = f >= ag2.to;
  const runT = ramp(f, ag4.from, ag4.to);
  const standUp = f >= l1g.from + 8;
  const parentsLaugh = f >= span(SCENE_ID, "P1").from && f < ag3.to;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#e9d6b4", overflow: "hidden" }}>
      <GhibliStage cam={cam} background="#e9d6b4">
        <GhibliPreload files={PRELOAD} />
        <PaintedPlate href="images/ghibli_ep06/ujanchar_veranda_back.png" />
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} />
          <GhibliCutout
            file="images/ghibli_ep04/madur_mat_veranda_sketch.png"
            anchor={{ width: 1529, height: 600, anchorX: 0.5, anchorY: 0.62 }}
            x={MAT.x}
            y={MAT.y}
            targetHeight={MAT.h}
          />
          {(balakGone || balakStanding) && <MangoLeaf x={LEAF.x} y={LEAF.y} />}
          {!balakStanding && !balakGone && (
            <SkelBalakSeated sceneId={SCENE_ID} x={BALAK.x} y={BALAK.y} s={0.74 * K} f={f} lookX={0.4} zoom={cam.zoom} />
          )}
          {balakStanding && (
            <g opacity={1 - clamp((slipT - 0.75) / 0.25)}>
              <SkelBalakStanding
                sceneId={SCENE_ID}
                x={lerp(BALAK.x, EXIT.x, slipT)}
                y={lerp(BALAK.y + 4, EXIT.y, slipT)}
                s={0.56 * K}
                f={f}
                zoom={cam.zoom}
              />
            </g>
          )}
          <SkelPuppet
            sceneId={SCENE_ID}
            role="charu"
            x={standUp ? lerp(CHARU.x, CHARU.x + 900, runT) : CHARU.x}
            y={standUp ? lerp(CHARU.y, 880, runT) : CHARU.y}
            s={K}
            f={f}
            seated={!standUp}
            light={SUN_MORNING}
            acting={{ bodyTurn: standUp ? 0.34 : 0.3, headTurn: parentsLaugh ? 0.25 : 0.1, mouthHand: f >= l1f.from && f < l1f.to ? 0.6 : 0 }}
            breathRate={f >= l1e.from ? 1.6 : 1}
          />
          <SkelPuppet
            sceneId={SCENE_ID}
            role="surendra"
            x={standUp ? lerp(SUREN.x, SUREN.x + 760, runT) : SUREN.x}
            y={standUp ? lerp(SUREN.y, 880, runT) : SUREN.y}
            s={K}
            f={f}
            seated={!standUp}
            sitStyle="crossLegged"
            light={SUN_MORNING}
            acting={{ bodyTurn: standUp ? 0.34 : -0.3, headTurn: parentsLaugh ? -0.25 : -0.1 }}
            breathRate={f >= l1e.from ? 1.5 : 1}
          />
        </GhibliLayer>
        <GhibliGrade warmth={0.26} vignette={0.32} paperOpacity={0.2} />
      </GhibliStage>
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} standIn="veranda plate (ep06) as one flat plane; parents placeholder poses" />
    </div>
  );
};
