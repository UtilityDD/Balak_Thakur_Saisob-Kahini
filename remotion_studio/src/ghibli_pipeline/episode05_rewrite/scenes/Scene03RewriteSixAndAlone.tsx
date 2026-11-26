import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
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
import {
  camAt,
  FigureDefs,
  frameOn,
  PaintedPlate,
  PLATE_RECT,
  plateKeep,
  RIVER_SEAT,
  RiverbankStandIn,
  ramp,
  type Shot,
  shotAt,
  SkelBalakSeated,
  SkelBalakStanding,
  SkeletonTag,
  SkelPuppet,
  span,
  SUN_AFTERNOON,
  WarmWash,
} from "./RewriteKit";

/**
 * SKELETON · Scene 03 `03_six_and_alone` (blueprint section 5): Ujanchar, the family yard in afternoon light, the path, and
 * the three quiet places. Beats: AG8 (world open) · 03a · 03b · 03c · 03d (montage a/b/c, 30 f dissolves on each place
 * word) + P5 · 03e + P6 (30 f dissolve to the grove).
 *
 * SETS (stand-ins until the new plates of blueprint 3.3 are painted):
 *   yard / veranda  ghibli_ep06/ujanchar_veranda_back.png with an afternoon wash
 *   path            ghibli_ep06/village_lane_back.png ("the path behind the kachari")
 *   (a) grove       the existing Ghibli kachari grove view (GhibliKachariBackdrop "grove")
 *   (b) field's end ghibli_ep06/village_field_edge_back.png (the debdaru cutout tree_debdaru_sketch is NOT painted yet)
 *   (c) riverbank   ghibli_ep05/card_outro_padma_sketch.png (riverbank_jam_back / tree_jamun_sketch NOT painted yet)
 * BLOCKING (placeholder): Balak (a little older) seated on the veranda step; Surendra standing on the veranda for the scold;
 * Charu crossing the yard (03e: on the veranda); Balak seated cross-legged alone in each quiet place. No hitting is shown.
 * CAMERA: AG8 held wide; Shot 17 one slow push to Balak on "চুপচাপ ভাব"; Shot 18 medium Surendra (6 f before 03b) → reaction
 * medium Balak; Shot 19 wide of the path, Balak small; Shot 20 a/b/c three held wides cut on the place words (the 30 f
 * dissolves come with the picture pass); Shot 21 medium Charu (6 f before 03e), P6 holds.
 */

const SCENE_ID = "03_six_and_alone";
const K = 0.78;
const STEP = { x: 1180, y: 846 };
const SUREN = { x: 700, y: 812 };
const CHARU_YARD = { x: 1600, y: 930 };
const CHARU_VER = { x: 960, y: 812 };

const PRELOAD = [
  "images/ghibli_ep06/ujanchar_veranda_back.png",
  "images/ghibli_ep06/village_lane_back.png",
  "images/ghibli_ep06/village_field_edge_back.png",
  "images/ghibli_ep05/card_outro_padma_sketch.png",
] as const;

export const Scene03RewriteSixAndAlone: React.FC = () => {
  const f = useCurrentFrame();
  const ag8 = span(SCENE_ID, "AG8_world_open");
  const l3a = span(SCENE_ID, "03a_Narrator_Six.wav");
  const l3b = span(SCENE_ID, "03b_Surendra_Scold.wav");
  const l3c = span(SCENE_ID, "03c_Narrator_Alone.wav");
  const l3d = span(SCENE_ID, "03d_Narrator_Places.wav");
  const l3e = span(SCENE_ID, "03e_Charu_Relief.wav");
  const chupchap = ep05rPhraseLocal(SCENE_ID, "চুপচাপ ভাব", l3a.from + Math.round(l3a.frames * 0.6));
  const kola = ep05rPhraseLocal(SCENE_ID, "কলাবাগিচায়", l3d.from + 30);
  const debdaru = ep05rPhraseLocal(SCENE_ID, "মাঠের শেষে", l3d.from + Math.round(l3d.frames * 0.36));
  const nodi = ep05rPhraseLocal(SCENE_ID, "নদীর ধারে", l3d.from + Math.round(l3d.frames * 0.68));
  const scoldReact = l3b.from + Math.round(l3b.frames * 0.62);

  const WIDE = frameOn(960, 600, 1.0);
  const SHOTS: Shot[] = [
    { name: "AG8", from: 0, view: "yard", cam: WIDE, note: "held wide, the yard in afternoon light" },
    { name: "Shot 17", from: l3a.from, view: "yard", cam: WIDE, push: { to: frameOn(STEP.x - 40, 700, 1.7), a: chupchap, b: chupchap + 60 }, note: "one slow push on 'চুপচাপ ভাব'" },
    { name: "Shot 18", from: l3b.from - 6, view: "yard", cam: frameOn(SUREN.x + 20, 640, 2.0), note: "medium Surendra, hand on hip" },
    { name: "Shot 18 · reaction", from: scoldReact, view: "yard", cam: frameOn(STEP.x, 720, 2.2), note: "Balak lowers his eyes" },
    { name: "Shot 19", from: l3c.from, view: "path", cam: frameOn(960, 560, 1.0), note: "wide of the path, Balak small, alone" },
    { name: "Shot 20a", from: kola - 2, view: "grove", cam: { ...KACHARI.grove.cam, x: 140, zoom: 1.15 }, note: "(a) the banana grove" },
    { name: "Shot 20b", from: debdaru - 2, view: "field", cam: frameOn(960, 560, 1.05), note: "(b) the field's end, under the debdaru" },
    { name: "Shot 20c · P5", from: nodi - 2, view: "river", cam: frameOn(960, 560, 1.05), note: "(c) the jam tree by the river; P5 holds" },
    { name: "Shot 21 · P6", from: l3e.from - 6, view: "yard", cam: frameOn(CHARU_VER.x + 40, 650, 1.9), note: "medium Charu on the veranda" },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);

  if (shot.view === "grove") {
    const cam = kachariKeepInSet("grove", { ...raw, focus: 1, dof: zoomProportionalDof(raw.zoom) });
    const B = KACHARI.grove.balak;
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.grove, overflow: "hidden" }}>
        <GhibliStage cam={cam} background={KACHARI_BG.grove}>
          <GhibliKachariBackdrop view="grove" f={f} cam={cam} doorOpen={0} />
          <GhibliKachariFloorLayer view="grove" f={f} />
          <GhibliLayer depth={1}>
            <FigureDefs f={f} zoom={cam.zoom} dapple />
            <SkelBalakSeated sceneId={SCENE_ID} x={B.x} y={B.y} s={0.74 * (B.s ?? 1.1)} f={f} expression="thoughtful" smile={0.1} zoom={cam.zoom} />
          </GhibliLayer>
          <GhibliKachariForegroundAndGrade view="grove" f={f} zoom={cam.zoom} />
        </GhibliStage>
        <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
      </div>
    );
  }

  const cam = plateKeep({ ...raw, focus: 1, dof: 0 }, PLATE_RECT);
  const plate =
    shot.view === "path"
      ? "images/ghibli_ep06/village_lane_back.png"
      : shot.view === "field"
        ? "images/ghibli_ep06/village_field_edge_back.png"
        : shot.view === "river"
          ? "images/ghibli_ep05/card_outro_padma_sketch.png"
          : "images/ghibli_ep06/ujanchar_veranda_back.png";
  const standIn =
    shot.view === "field"
      ? "stand-in: tree_debdaru_sketch not painted yet"
      : shot.view === "river"
        ? "stand-in: Padma outro card for riverbank_jam_back + tree_jamun_sketch (not painted yet)"
        : shot.view === "path"
          ? "stand-in: village_lane_back (ep06) for the path behind the kachari"
          : "veranda plate (ep06), afternoon wash";

  const walkT = ramp(f, l3c.from, l3d.from);
  const balakRisen = f >= l3b.to - 10;

  return (
    <AbsoluteFill style={{ background: "#e6cfa4", overflow: "hidden" }}>
      <GhibliStage cam={cam} background="#e6cfa4">
        <GhibliPreload files={PRELOAD} />
        {shot.view === "river" ? <RiverbankStandIn /> : <PaintedPlate href={plate} />}
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} />
          {shot.view === "yard" && (
            <>
              {(f < l3b.to || f >= l3e.from - 6) && !balakRisen && (
                <SkelBalakSeated sceneId={SCENE_ID} x={STEP.x} y={STEP.y} s={0.74 * K} f={f} expression="thoughtful" smile={0.08} eyesDown={f >= scoldReact ? 0.6 : 0} zoom={cam.zoom} />
              )}
              {balakRisen && f < l3c.from && <SkelBalakStanding sceneId={SCENE_ID} x={STEP.x + 40} y={STEP.y + 30} s={0.56 * K} f={f} flip zoom={cam.zoom} />}
              {f >= l3b.from - 30 && f < l3c.from && (
                <SkelPuppet sceneId={SCENE_ID} role="surendra" x={SUREN.x} y={SUREN.y} s={K} f={f} light={SUN_AFTERNOON} acting={{ hips: 0.6 }} />
              )}
              {f < l3b.from - 30 && <SkelPuppet sceneId={SCENE_ID} role="charu" x={CHARU_YARD.x - 300 * ramp(f, 0, l3a.to)} y={CHARU_YARD.y} s={K * 1.08} f={f} light={SUN_AFTERNOON} />}
              {f >= l3e.from - 6 && <SkelPuppet sceneId={SCENE_ID} role="charu" x={CHARU_VER.x} y={CHARU_VER.y} s={K} f={f} seated light={SUN_AFTERNOON} />}
            </>
          )}
          {shot.view === "path" && <SkelBalakStanding sceneId={SCENE_ID} x={760 + 260 * walkT} y={930} s={0.42} f={f} zoom={cam.zoom} />}
          {shot.view === "field" && <SkelBalakSeated sceneId={SCENE_ID} x={1180} y={905} s={0.5} f={f} expression="thoughtful" smile={0.08} zoom={cam.zoom} />}
          {shot.view === "river" && <SkelBalakSeated sceneId={SCENE_ID} x={RIVER_SEAT.x} y={RIVER_SEAT.y} s={RIVER_SEAT.s} f={f} flip expression="serene" smile={0.12} zoom={cam.zoom} />}
        </GhibliLayer>
        <GhibliGrade warmth={0.3} vignette={0.32} paperOpacity={0.2} />
      </GhibliStage>
      {shot.view === "yard" && <WarmWash amount={0.28} />}
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} standIn={standIn} />
    </AbsoluteFill>
  );
};
