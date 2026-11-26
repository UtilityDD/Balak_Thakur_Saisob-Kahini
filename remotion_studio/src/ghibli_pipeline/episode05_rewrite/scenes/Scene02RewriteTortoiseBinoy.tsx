import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp } from "../../../cinematic/core/anim";
import { Tortoise } from "../../../cinematic/animals/Tortoise";
import { ContactShadow, GhibliLayer, GhibliStage } from "../../GhibliStage";
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
  SUN_MORNING,
  WarmWash,
} from "./RewriteKit";

/**
 * SKELETON · Scene 02 `02_tortoise_bite_and_binoy` (blueprint section 5): the neighbour's corner room, and Binoy's account
 * as a flashback on the same set in a warmer, lighter grade with a feathered vignette (24 f dissolves in and out).
 * Beats: 02a · 02b · AG5 (already free) · 02c + P3 [GLOW BEAT 1] · 02d · 02e → dissolve → 02f · AG6 (the play) · 02g ·
 * 02h · AG7 (the shout) → dissolve back · 02i + P4.
 *
 * SET: the existing Ghibli corner view (GhibliKachariBackdrop view "corner": corner room, Binoy's house, tipped basket).
 * BLOCKING (placeholder): Balak seated cross-legged among the four tortoises at KACHARI.corner.balak (STO-20b), Charu
 * kneeling at his right, Surendra standing behind her, Binoy at the corner (left), Binoy's mother at her door. In the
 * flashback only Balak, the tortoises and Binoy (with his bag) are there. Tortoise bite/release keys and Charu's two-hand
 * hold come in the acting pass (MOT-07): the skeleton shows only where everyone is.
 *
 * CAMERA: Shot 8 held wide (cut on the line); Shot 9 medium on Charu kneeling (6 f before 02b); AG5 medium close on the
 * hands; Shot 10 macro insert of the hand (zoom 3.2) on "দেখি", back to a medium two-shot on "ওমা!", held through P3;
 * Shot 11 medium Surendra; Shot 12 medium Binoy (6 f before 02e); flashback Shot 13 medium wide, AG6 slow push in, Shot 14
 * close and low (hard cut on "অমনি"), Shot 15 close-up Balak (6 f before 02h), AG7 medium on flashback Binoy; Shot 16 +
 * P4 medium wide group in the present.
 */

const SCENE_ID = "02_tortoise_bite_and_binoy";
const C = KACHARI.corner;
const KS = C.adultS; // 1.15
const BAL = C.balak;
const CHARU = { x: C.charuKneel.x + 30, y: C.charuKneel.y };
const SUREN = { x: C.surendraStand.x + 90, y: C.surendraStand.y };
const BINOY = { x: 470, y: 930 };
const MOTHER = C.motherDoor;

export const Scene02RewriteTortoiseBinoy: React.FC = () => {
  const f = useCurrentFrame();
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const l2a = span(SCENE_ID, "02a_Surendra_Bitten.wav");
  const l2b = span(SCENE_ID, "02b_Charu_FreeHand.wav");
  const ag5 = span(SCENE_ID, "AG5_already_free");
  const l2c = span(SCENE_ID, "02c_Charu_NoMark.wav");
  const p3 = span(SCENE_ID, "P3");
  const l2d = span(SCENE_ID, "02d_Surendra_AskBinoy.wav");
  const l2e = span(SCENE_ID, "02e_Binoy_Account1.wav");
  const l2f = span(SCENE_ID, "02f_Binoy_Account2.wav");
  const ag6 = span(SCENE_ID, "AG6_the_play");
  const l2g = span(SCENE_ID, "02g_Binoy_Account3.wav");
  const l2h = span(SCENE_ID, "02h_Balak_Tortoise.wav");
  const ag7 = span(SCENE_ID, "AG7_the_shout");
  const l2i = span(SCENE_ID, "02i_Binoy_Shouted.wav");
  const omaAt = ep05rPhraseLocal(SCENE_ID, "ওমা", l2c.from + Math.round(l2c.frames * 0.4));
  const giyeDekhi = ep05rPhraseLocal(SCENE_ID, "গিয়ে দেখি", l2e.to - 30);
  const amoniAt = ep05rPhraseLocal(SCENE_ID, "অমনি", l2g.from + Math.round(l2g.frames * 0.7));

  // flashback window: from the dissolve on "গিয়ে দেখি—" to the dissolve at the end of AG7
  const FB_IN = giyeDekhi;
  const FB_OUT = ag7.to;
  const fb = ramp(f, FB_IN, FB_IN + 24) * (1 - ramp(f, FB_OUT - 12, FB_OUT + 12));
  const inFlashback = f >= FB_IN + 12 && f < FB_OUT;

  const WIDE = { x: 60, y: 80, zoom: 1.0 };
  const SHOTS: Shot[] = [
    { name: "Shot 8", from: 0, view: "corner", cam: WIDE, note: "held wide as they burst in" },
    { name: "Shot 9", from: l2b.from - 6, view: "corner", cam: frameOn(CHARU.x - 60, 760, 1.9), note: "Charu drops to her knees" },
    { name: "AG5", from: ag5.from, view: "corner", cam: frameOn(BAL.x + 60, 860, 2.6), note: "the hands arrive; the tortoise has already let go" },
    { name: "Shot 10 (insert)", from: l2c.from, view: "corner", cam: frameOn(BAL.x + 70, 880, 3.2), note: "macro insert: the small hand in Charu's hands" },
    { name: "Shot 10 · P3 (GLOW 1)", from: omaAt, view: "corner", cam: frameOn((BAL.x + CHARU.x) / 2, 800, 1.9), note: "medium two-shot" },
    { name: "Shot 11", from: l2d.from, view: "corner", cam: frameOn(SUREN.x - 40, 720, 1.8), note: "Surendra turns to Binoy" },
    { name: "Shot 12", from: l2e.from - 6, view: "corner", cam: frameOn(BINOY.x + 40, 720, 2.0), note: "medium Binoy" },
    {
      name: "Shot 13 (flashback)",
      from: FB_IN + 12,
      view: "corner",
      cam: frameOn(BAL.x - 80, 800, 1.45),
      note: "flashback medium wide: Binoy comes round the corner and watches",
    },
    {
      name: "AG6 (flashback)",
      from: ag6.from,
      view: "corner",
      cam: frameOn(BAL.x - 20, 820, 1.6),
      push: { to: frameOn(BAL.x + 20, 840, 2.4), a: ag6.from, b: ag6.to },
      note: "slow push in on his smiling play",
    },
    { name: "Shot 14 (flashback)", from: l2g.from, view: "corner", cam: frameOn(BAL.x + 60, 860, 2.2), note: "close, low at tortoise height" },
    { name: "Shot 14 · hard cut", from: amoniAt, view: "corner", cam: frameOn(BAL.x + 80, 870, 3.0), note: "the jaws clamp on 'খপ করে'" },
    { name: "Shot 15 (flashback)", from: l2h.from - 6, view: "corner", cam: frameOn(BAL.x + 10, 790, 3.2), note: "close-up Balak, teasing" },
    { name: "AG7 (flashback)", from: ag7.from, view: "corner", cam: frameOn(BINOY.x + 40, 720, 2.0), note: "Binoy's hands fly to his head" },
    { name: "Shot 16 · P4", from: l2i.from, view: "corner", cam: frameOn(760, 760, 1.3), note: "medium wide group, afterglow" },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);
  const cam = kachariKeepInSet("corner", { ...raw, focus: 1, dof: zoomProportionalDof(raw.zoom) });

  const glow = ep05GlowBeat(f, p3.from - 6, 30, Math.max(12, p3.frames - 6), 48);
  const tPos = C.tortoises;
  const tortoises = tPos.map((p, i) => (
    <g key={i}>
      <ContactShadow x={p.x} y={p.y + 1} rx={28} ry={9} opacity={0.28} castStretch={1.15} />
      <g filter="url(#ghibli-prop-watercolor)">
        <Tortoise x={p.x} y={p.y} s={1.25} lifeF={f} f={f} view="threeQuarter" flip={i % 2 === 1} seed={i * 7 + 3} variant={i} />
      </g>
    </g>
  ));

  const present = !inFlashback;
  const charuIn = present && f >= l2b.from - 10;
  const binoyHandsOnHead = (present && f < l2b.from) || (inFlashback && f >= ag7.from);

  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.corner, overflow: "hidden" }}>
      <GhibliStage cam={cam} background={KACHARI_BG.corner}>
        <GhibliKachariBackdrop
          view="corner"
          f={f}
          cam={cam}
          veranda={
            present ? <SkelPuppet sceneId={SCENE_ID} role="binoyMother" x={MOTHER.x} y={MOTHER.y} s={MOTHER.s ?? 0.46} f={f} acting={{ mouthHand: 0.5 }} /> : null
          }
        />
        <GhibliKachariFloorLayer view="corner" f={f} />
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} rim={0.5 + 0.3 * glow} />
          <SkelPuppet
            sceneId={SCENE_ID}
            role="binoy"
            x={BINOY.x}
            y={BINOY.y}
            s={KS}
            f={f}
            light={SUN_MORNING}
            acting={{ bodyTurn: 0.2, headHands: binoyHandsOnHead ? 0.8 : 0, headTilt: inFlashback && !binoyHandsOnHead ? 6 : 0 }}
            breathRate={present && f < l2d.to ? 1.6 : 1}
          />
          {tortoises}
          <SkelBalakSeated
            sceneId={SCENE_ID}
            x={BAL.x}
            y={BAL.y}
            s={0.74 * KS}
            f={f}
            glowBeat={glow}
            expression={inFlashback ? "playful" : f >= omaAt ? "joyful" : "serene"}
            lookX={charuIn ? 0.6 : 0.2}
            smile={inFlashback ? 0.45 : 0.25}
            zoom={cam.zoom}
          />
          {present && f >= l2a.from && (
            <SkelPuppet
              sceneId={SCENE_ID}
              role="surendra"
              x={SUREN.x}
              y={SUREN.y}
              s={KS}
              f={f}
              light={SUN_MORNING}
              acting={{ bodyTurn: -0.28, crouch: f >= l2d.from ? 0.25 : 0 }}
              breathRate={f < l2c.to ? 1.6 : 1}
            />
          )}
          {charuIn && (
            <SkelPuppet
              sceneId={SCENE_ID}
              role="charu"
              x={CHARU.x}
              y={CHARU.y}
              s={KS}
              f={f}
              light={SUN_MORNING}
              sitStyle="kneel"
              acting={{ bodyTurn: -0.3, kneel: clamp((f - (l2b.from - 10)) / 16) }}
              breathRate={f < p3.to ? 1.55 : 1}
            />
          )}
        </GhibliLayer>
        <GhibliKachariForegroundAndGrade view="corner" f={f} zoom={cam.zoom} />
      </GhibliStage>
      <WarmWash amount={0.55 * fb} vignette={0.85 * fb} color="#ffd59a" />
      <SkeletonTag
        sceneId={SCENE_ID}
        shot={shot}
        f={f}
        standIn={inFlashback ? "FLASHBACK grade" : f >= dur - 1 ? "" : "tortoise bite/release + Charu's hold: acting pass"}
      />
    </div>
  );
};
