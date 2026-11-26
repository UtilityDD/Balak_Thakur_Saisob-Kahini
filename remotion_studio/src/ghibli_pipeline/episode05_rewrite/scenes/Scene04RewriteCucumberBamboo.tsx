import React from "react";
import { useCurrentFrame } from "remotion";
import { GentleCow } from "../../../cinematic/animals/GentleCow";
import { GESTURES5 } from "../../../cinematic/rig/Puppet";
import { GhibliCharFilterDefs, GhibliLayer, GhibliStage } from "../../GhibliStage";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
} from "../../episode05/GhibliKachariSet";
import { ep05GlowBeat } from "../Ep05BalakDivine";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rScene } from "../timing";
import {
  camAt,
  FigureDefs,
  frameOn,
  ramp,
  type Shot,
  shotAt,
  SkelBalakSeated,
  SkeletonTag,
  SkelPuppet,
  span,
  SUN_AFTERNOON,
} from "./RewriteKit";

/**
 * SKELETON · Scene 04 `04_cucumber_and_bamboo` (blueprint section 5): the banana grove behind the kachari, warm early
 * afternoon. Beats: AG9 · 04a · AG10 (the cow) · AG11 (Haricharan) · 04b · 04c · 04d · 04e (inner voice) + P7 · 04f ·
 * 04g (inner voice) + P8 · 04h · 04i · 04j · 04k · 04l · AG12 (storms off) · P9 [GLOW BEAT 2] (36 f dissolve to 05).
 *
 * SET: the existing Ghibli grove view (GhibliKachariBackdrop "grove": back wall and door, CucumberTrellis, the cow's banana
 * clump). BLOCKING (placeholder): Balak seated with his pebbles at KACHARI.grove.balak; the cow at the trellis in AG10, then
 * hidden behind the clump (only the slot), out again in P9 lowering her muzzle; Haricharan at haricharanStop with the bamboo
 * upright (angry brows, bluster, never swung at the child or the cow), gone after AG12. Inner-voice lines keep Balak's mouth
 * closed (ep05rRoleRms skips them).
 * CAMERA (eye level, no handheld): AG9 held wide; AG10 medium on the trellis → cut to Balak; AG11 wide toward the kachari;
 * close-ups cut 6 f before the speaker (Shots 23, 24, 26, 27, 29, 30); Shot 25 two-shot in profile with the torn-root insert
 * on "গোড়াসুদ্ধ"; Shot 28 the slow push into Balak's eyes (1.0 → 1.6 x), the line's one move; Shot 32 the slow push from
 * the two-shot into Balak; Shot 33 wide two-shot held through AG12; P9 medium, Balak left and the clump right.
 */

const SCENE_ID = "04_cucumber_and_bamboo";
const G = KACHARI.grove;
const B = G.balak;
const BS = 0.74 * (B.s ?? 1.1);
const H = G.haricharanStop;
const HS = H.s ?? 1.1;

export const Scene04RewriteCucumberBamboo: React.FC = () => {
  const f = useCurrentFrame();
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const ag10 = span(SCENE_ID, "AG10_the_cow");
  const ag11 = span(SCENE_ID, "AG11_haricharan");
  const l4b = span(SCENE_ID, "04b_Haricharan_Q1.wav");
  const l4c = span(SCENE_ID, "04c_Balak_WhatHappened.wav");
  const l4d = span(SCENE_ID, "04d_Haricharan_Cucumber.wav");
  const l4e = span(SCENE_ID, "04e_Balak_Inner1.wav");
  const l4f = span(SCENE_ID, "04f_Haricharan_Q2.wav");
  const l4g = span(SCENE_ID, "04g_Balak_Inner2.wav");
  const p8 = span(SCENE_ID, "P8");
  const l4h = span(SCENE_ID, "04h_Balak_Truth1.wav");
  const l4i = span(SCENE_ID, "04i_Haricharan_Sputter.wav");
  const l4j = span(SCENE_ID, "04j_Balak_Truth2.wav");
  const l4k = span(SCENE_ID, "04k_Balak_Truth3.wav");
  const l4l = span(SCENE_ID, "04l_Haricharan_Storm.wav");
  const ag12 = span(SCENE_ID, "AG12_storms_off");
  const p9 = span(SCENE_ID, "P9");
  const gorasuddho = ep05rPhraseLocal(SCENE_ID, "গোড়াসুদ্ধ", l4d.to - 50);
  const cowGone = ag10.from + Math.round(ag10.frames * 0.6);

  const WIDE = { ...G.cam };
  const TWO = frameOn((H.x + B.x) / 2 + 20, 760, 1.75);
  const CU_B = frameOn(B.x + 10, 800, 3.0);
  const MCU_H = frameOn(H.x, 660, 2.3);
  const SHOTS: Shot[] = [
    { name: "AG9", from: 0, view: "grove", cam: WIDE, note: "held wide of the grove" },
    { name: "Shot 22", from: span(SCENE_ID, "04a_Narrator_ThatDay.wav").from, view: "grove", cam: WIDE, note: "hold; a pebble set in the row" },
    { name: "AG10", from: ag10.from, view: "grove", cam: frameOn(G.trellis.x + 260, 760, 1.6), note: "the cow tugs the vine, the root tears" },
    { name: "AG10 · cut", from: cowGone, view: "grove", cam: frameOn(B.x + 120, 790, 1.8), note: "Balak watches her hide, then back to his pebbles" },
    { name: "AG11", from: ag11.from, view: "grove", cam: { ...WIDE, x: -60, zoom: 1.05 }, note: "the door bangs open, Haricharan runs out" },
    { name: "Shot 23", from: l4b.from - 6, view: "grove", cam: MCU_H, note: "MCU Haricharan, eye level" },
    { name: "Shot 24", from: l4c.from - 6, view: "grove", cam: CU_B, note: "CU Balak looking up" },
    { name: "Shot 25", from: l4d.from, view: "grove", cam: TWO, note: "two-shot in profile" },
    { name: "Shot 25 · insert", from: gorasuddho, view: "grove", cam: frameOn(G.trellisRoot.x + 40, 860, 2.8), note: "the torn root, two bitten cucumbers" },
    { name: "Shot 26 · P7", from: l4e.from - 6, view: "grove", cam: CU_B, note: "inner voice: mouth closed; P7 sets down a pebble" },
    { name: "Shot 27", from: l4f.from - 6, view: "grove", cam: MCU_H, note: "he bends lower; the bamboo taps once" },
    {
      name: "Shot 28 · P8",
      from: l4g.from,
      view: "grove",
      cam: frameOn(B.x + 10, 790, 2.8),
      push: { to: frameOn(B.x + 6, 772, 4.48), a: l4g.from, b: l4g.to - 10 },
      note: "slow push into his eyes (1.0 -> 1.6 x); P8 near-silence",
    },
    { name: "Shot 29", from: l4h.from, view: "grove", cam: CU_B, note: "calm, firm; a small open palm" },
    { name: "Shot 30", from: l4i.from, view: "grove", cam: MCU_H, note: "eyes pop" },
    { name: "Shot 31", from: l4j.from, view: "grove", cam: TWO, note: "he gestures off left to the torn trellis" },
    { name: "Shot 32", from: l4k.from, view: "grove", cam: TWO, push: { to: frameOn(B.x + 20, 790, 2.6), a: l4k.from, b: l4k.to - 20 }, note: "slow push into Balak" },
    { name: "Shot 33 · AG12", from: l4l.from, view: "grove", cam: frameOn(H.x + 80, 700, 1.25), note: "wide two-shot; he storms off" },
    { name: "P9 (GLOW 2)", from: p9.from, view: "grove", cam: frameOn(1470, 790, 1.6), note: "the cow comes out and lowers her muzzle" },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);
  const cam = kachariKeepInSet("grove", { ...raw, focus: 1, dof: zoomProportionalDof(raw.zoom) });

  const glow = ep05GlowBeat(f, p9.from + 20, 40, Math.max(10, dur - p9.from - 60), 40);
  const torn = ramp(f, ag10.from + 30, ag10.from + 70);
  const doorOpen = f >= ag11.from && f < ag12.to - 6 ? 1 : 0;
  const hariOn = f >= ag11.from + 10 && f < ag12.from + Math.round(ag12.frames * 0.6);
  const cowAtTrellis = f >= ag10.from - 20 && f < cowGone;
  const cowHidden = f >= cowGone && f < p9.from + 4;
  const cowOut = f >= p9.from + 4;
  const ct = G.cowAtTrellis;
  const hide = G.cowHide;
  const out = G.cowStepOut;

  const slotCow = cowHidden ? (
    <GhibliLayer depth={0.85}>
      <GhibliCharFilterDefs f={f} dapple />
      <g filter="url(#ghibli-char-ink)">
        <GentleCow x={hide.x} y={hide.y} s={hide.s} f={f} lifeF={f} action="idle" flip={hide.flip} seed={5} />
      </g>
    </GhibliLayer>
  ) : null;

  const hariActing = {
    ...GESTURES5.bambooUpright,
    ...GESTURES5.angryBrows,
    bodyTurn: 0.26,
    crouch: f >= l4f.from && f < l4f.to ? 0.18 : 0,
    throwUp: f >= l4l.from && f < ag12.from ? 0.8 : 0,
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.grove, overflow: "hidden" }}>
      <GhibliStage cam={cam} background={KACHARI_BG.grove}>
        <GhibliKachariBackdrop view="grove" f={f} cam={cam} doorOpen={doorOpen} cow={slotCow} />
        <GhibliKachariFloorLayer view="grove" f={f} trellisTorn={torn} />
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} dapple rim={0.5 + 0.3 * glow} />
          {cowAtTrellis && (
            <g filter="url(#ghibli-char-ink)">
              <GentleCow x={ct.x} y={ct.y} s={ct.s} f={f} lifeF={f} action="graze" flip={ct.flip} cucumber chew seed={5} />
            </g>
          )}
          <SkelBalakSeated
            sceneId={SCENE_ID}
            x={B.x}
            y={B.y}
            s={BS}
            f={f}
            glowBeat={glow}
            pose={cowOut ? "strokeCow" : "playPebbles"}
            poseStart={cowOut ? p9.from + 30 : 0}
            expression={f >= l4h.from && f < ag12.to ? "compassionate" : f >= l4e.from && f < p8.to ? "thoughtful" : "serene"}
            lookX={hariOn ? -0.6 : cowOut ? 0.6 : 0}
            smile={cowOut ? 0.35 : 0.15}
            zoom={cam.zoom}
          />
          {hariOn && (
            <SkelPuppet
              sceneId={SCENE_ID}
              role="haricharan"
              x={H.x - 60}
              y={H.y}
              s={HS}
              f={f}
              light={SUN_AFTERNOON}
              acting={hariActing}
              breathRate={1.45}
            />
          )}
          {cowOut && (
            <g filter="url(#ghibli-char-ink)">
              <GentleCow x={out.x + 210} y={out.y} s={out.s} f={f} lifeF={f} action="nuzzle" actionStart={p9.from + 20} flip={out.flip} target={{ x: B.x + 60, y: B.y - 120 }} seed={5} />
            </g>
          )}
        </GhibliLayer>
        <GhibliKachariForegroundAndGrade view="grove" f={f} zoom={cam.zoom} />
      </GhibliStage>
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} standIn="cow / bamboo / pebble choreography: acting pass" />
    </div>
  );
};
