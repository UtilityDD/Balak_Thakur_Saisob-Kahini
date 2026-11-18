import React from "react";
import { Composition } from "remotion";
import { Episode01 } from "./Episode01";
import { EPISODE_01_TOTAL_FRAMES } from "./data/episode01Data";
import { CastCloseup, CastLineup } from "./cinematic/CastLineup";
import { HeadQA } from "./cinematic/HeadQA";
import { ToddlerQA } from "./cinematic/ToddlerQA";
import { EyeQA, EyeZoom } from "./cinematic/EyeQA";
import { GhomtaQA } from "./cinematic/GhomtaQA";
import { SCENE02, Scene02Demo } from "./cinematic/Scene02Demo";
import { SCENE03, Scene03Demo } from "./cinematic/scenes/Scene03Arrival";
import { SCENE04, Scene04Demo } from "./cinematic/scenes/Scene04Ulu";
import { SCENE00, Scene00Demo } from "./cinematic/scenes/Scene00Intro";
import { SCENE01, Scene01Demo } from "./cinematic/scenes/Scene01Village";
import { SCENE05, Scene05Demo } from "./cinematic/scenes/Scene05Rain";
import { SCENE06, Scene06Demo } from "./cinematic/scenes/Scene06Thakurma";
import { SCENE07, Scene07Demo } from "./cinematic/scenes/Scene07Flowers";
import { SCENE08, Scene08Demo } from "./cinematic/scenes/Scene08Closing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Episode01"
        component={Episode01}
        durationInFrames={EPISODE_01_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />
      {/* Cinematic re-stage demo of Scene 02 (Diwali night) */}
      <Composition
        id="Scene02Demo"
        component={Scene02Demo}
        durationInFrames={SCENE02.durationFrames}
        fps={24}
        width={1920}
        height={1080}
      />
      {/* Scene 03 — first full use of the divine visual language */}
      <Composition id="Scene03Demo" component={Scene03Demo} durationInFrames={SCENE03.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene04Demo" component={Scene04Demo} durationInFrames={SCENE04.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene00Demo" component={Scene00Demo} durationInFrames={SCENE00.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene01Demo" component={Scene01Demo} durationInFrames={SCENE01.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene05Demo" component={Scene05Demo} durationInFrames={SCENE05.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene06Demo" component={Scene06Demo} durationInFrames={SCENE06.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene07Demo" component={Scene07Demo} durationInFrames={SCENE07.durationFrames} fps={24} width={1920} height={1080} />
      <Composition id="Scene08Demo" component={Scene08Demo} durationInFrames={SCENE08.durationFrames} fps={24} width={1920} height={1080} />
      {/* Rig QA sheets */}
      <Composition id="GhomtaQA" component={GhomtaQA} durationInFrames={120} fps={24} width={1920} height={1080} />
      <Composition id="EyeZoom" component={EyeZoom} durationInFrames={120} fps={24} width={1920} height={1080} />
      <Composition id="EyeQA" component={EyeQA} durationInFrames={120} fps={24} width={1920} height={1080} />
      <Composition id="HeadQA" component={HeadQA} durationInFrames={120} fps={24} width={1920} height={1080} />
      <Composition id="ToddlerQA" component={ToddlerQA} durationInFrames={120} fps={24} width={1920} height={1080} />
      <Composition id="CastLineup" component={CastLineup} durationInFrames={240} fps={24} width={1920} height={1080} />
      <Composition id="CastCloseup" component={CastCloseup} durationInFrames={240} fps={24} width={1920} height={1080} />
    </>
  );
};
