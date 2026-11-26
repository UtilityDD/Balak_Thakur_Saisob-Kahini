import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GESTURES5 } from "../../../cinematic/rig/Puppet";
import { GhibliCutout, GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../../episode05/plateAnchors";
import { ep05rScene } from "../timing";
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
  SkeletonTag,
  SkelPuppet,
  span,
  SUN_AFTERNOON,
  WarmWash,
} from "./RewriteKit";

/**
 * SKELETON · Scene 05 `05_sereshta_gossip` (blueprint section 5): the kachari's front veranda, later afternoon, then the
 * riverbank afterglow. Beats: AG13 (world open) · 05a · 05b · 05c + P10 · 05d · 05e + P11 · AG14 (40 f dissolve to the
 * riverbank at sunset, one slow push).
 *
 * SETS (stand-ins): the veranda interior plate kachari_veranda_inside_sketch is NOT painted yet, so the veranda is the
 * existing kachari front cutout (ghibli_ep05/kachari_front_sketch.png) drawn large, with the clerk's desk cutout; the
 * riverbank (riverbank_jam_back, tree_jamun_sketch) is the Padma outro card ghibli_ep05/card_outro_padma_sketch.png.
 * BLOCKING (placeholder): the senior clerk (বড়বাবু) seated at the desk (right), the junior clerk (মুহুরিবাবু) seated mid,
 * Haricharan standing below the plinth edge (left) with the bamboo on his shoulder; the clerks are stand-in Puppets
 * (listenerB / listenerA) until their own puppets exist (blueprint section 2). Surendra is not present (Q15). AG14: Balak
 * alone under the (future) jam tree, hands in his lap, halo steady.
 * CAMERA: AG13 held wide in depth; Shot 34 medium wide three-shot; Shot 35 MCU senior clerk (the rack focus is a cut in the
 * skeleton); Shot 36 junior clerk, held through P10; Shot 37 medium three-shot; Shot 38 + P11 hold; AG14 held wide + push.
 */

const SCENE_ID = "05_sereshta_gossip";
const FRONT = { x: 960, y: 1185, h: 1500 }; // kachari front cutout: the veranda floor lands at about y 955
const FLOOR_Y = 958;
const SENIOR = { x: 1330, y: FLOOR_Y };
const JUNIOR = { x: 980, y: FLOOR_Y + 4 };
const HARI = { x: 520, y: 1060 };
const KV = 0.92;

const PRELOAD = [
  "images/ghibli_ep05/kachari_front_sketch.png",
  "images/ghibli_ep05/prop_clerk_desk.png",
  "images/ghibli_ep05/sky_grove_afternoon.png",
  "images/ghibli_ep05/card_outro_padma_sketch.png",
] as const;

export const Scene05RewriteSereshtaGossip: React.FC = () => {
  const f = useCurrentFrame();
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const l5a = span(SCENE_ID, "05a_Haricharan_Report.wav");
  const l5b = span(SCENE_ID, "05b_ClerkA_SawEat.wav");
  const l5c = span(SCENE_ID, "05c_ClerkB_FedIt.wav");
  const p10 = span(SCENE_ID, "P10");
  const l5d = span(SCENE_ID, "05d_ClerkA_Verdict.wav");
  const l5e = span(SCENE_ID, "05e_Haricharan_Agree.wav");
  const ag14 = span(SCENE_ID, "AG14_afterglow");

  const SHOTS: Shot[] = [
    { name: "AG13", from: 0, view: "veranda", cam: frameOn(960, 600, 1.0), note: "held wide in depth; Haricharan stomps up" },
    { name: "Shot 34", from: l5a.from, view: "veranda", cam: frameOn(930, 720, 1.25), note: "medium wide three-shot" },
    { name: "Shot 35", from: l5b.from, view: "veranda", cam: frameOn(SENIOR.x + 20, 760, 2.3), note: "MCU senior clerk (rack focus later)" },
    { name: "Shot 36 · P10", from: l5c.from, view: "veranda", cam: frameOn(JUNIOR.x, 760, 2.1), note: "junior clerk; P10 the others stare" },
    { name: "Shot 37", from: l5d.from, view: "veranda", cam: frameOn(930, 740, 1.35), note: "medium three-shot" },
    { name: "Shot 38 · P11", from: l5e.from, view: "veranda", cam: frameOn(930, 740, 1.35), note: "hold; all three nod" },
    {
      name: "AG14",
      from: ag14.from,
      view: "river",
      cam: frameOn(1080, 560, 1.0),
      push: { to: frameOn(1300, 640, 1.25), a: ag14.from + 30, b: dur },
      note: "riverbank at sunset, Balak alone (dissolve comes with the picture pass)",
    },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);
  const cam = plateKeep({ ...raw, focus: 1, dof: 0 }, PLATE_RECT);

  if (shot.view === "river") {
    return (
      <AbsoluteFill style={{ background: "#3a2436", overflow: "hidden" }}>
        <GhibliStage cam={cam} background="#3a2436">
          <GhibliPreload files={PRELOAD} />
          <RiverbankStandIn />
          <GhibliLayer depth={1}>
            <FigureDefs f={f} zoom={cam.zoom} />
            <SkelBalakSeated sceneId={SCENE_ID} x={RIVER_SEAT.x} y={RIVER_SEAT.y} s={RIVER_SEAT.s} f={f} flip expression="serene" smile={0.15} zoom={cam.zoom} />
          </GhibliLayer>
          <GhibliGrade warmth={0.3} vignette={0.36} paperOpacity={0.2} />
        </GhibliStage>
        <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} standIn="stand-in: Padma outro card for riverbank_jam_back + tree_jamun_sketch" />
      </AbsoluteFill>
    );
  }

  const stare = ramp(f, p10.from, p10.from + 14) * (1 - ramp(f, l5d.from, l5d.from + 12));
  const nod = f >= span(SCENE_ID, "P11").from ? Math.sin((f - span(SCENE_ID, "P11").from) * 0.5) * 6 : 0;
  const hariIn = ramp(f, 0, Math.round(span(SCENE_ID, "AG13_world_open").frames * 0.9));

  return (
    <AbsoluteFill style={{ background: "#e8d2a6", overflow: "hidden" }}>
      <GhibliStage cam={cam} background="#e8d2a6">
        <GhibliPreload files={PRELOAD} />
        <PaintedPlate href="images/ghibli_ep05/sky_grove_afternoon.png" />
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} />
          <GhibliCutout file="images/ghibli_ep05/kachari_front_sketch.png" anchor={GHIBLI_ANCHORS.kachari_front_sketch} x={FRONT.x} y={FRONT.y} targetHeight={FRONT.h} />
          <SkelPuppet
            sceneId={SCENE_ID}
            role="clerkJunior"
            x={JUNIOR.x}
            y={JUNIOR.y}
            s={KV}
            f={f}
            seated
            sitStyle="crossLegged"
            light={SUN_AFTERNOON}
            acting={{ bodyTurn: -0.22, lean: f >= l5c.from && f < l5c.to ? 8 : 0 }}
          />
          <SkelPuppet
            sceneId={SCENE_ID}
            role="clerkSenior"
            x={SENIOR.x}
            y={SENIOR.y}
            s={KV}
            f={f}
            seated
            sitStyle="crossLegged"
            light={SUN_AFTERNOON}
            acting={{ bodyTurn: -0.26, headTurn: -0.1 - stare * 0.3, headNod: nod }}
          />
          <GhibliCutout file="images/ghibli_ep05/prop_clerk_desk.png" anchor={GHIBLI_ANCHORS.prop_clerk_desk} x={SENIOR.x - 150} y={FLOOR_Y + 8} targetHeight={150} />
          <SkelPuppet
            sceneId={SCENE_ID}
            role="haricharan"
            x={HARI.x - 160 * (1 - hariIn)}
            y={HARI.y}
            s={1.0}
            f={f}
            light={SUN_AFTERNOON}
            acting={{ ...GESTURES5.bambooCarried, bodyTurn: 0.26, headTurn: 0.1 + stare * 0.3, headNod: nod }}
          />
        </GhibliLayer>
        <GhibliGrade warmth={0.3} vignette={0.32} paperOpacity={0.2} />
      </GhibliStage>
      <WarmWash amount={0.22} />
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} standIn="stand-in: kachari front cutout for kachari_veranda_inside_sketch; clerks = listenerB / listenerA" />
    </AbsoluteFill>
  );
};
