import React from "react";
import { Composition } from "remotion";
import { Episode01 } from "./Episode01";
import { EPISODE_01_TOTAL_FRAMES } from "./data/episode01Data";
import { Episode04Ghibli } from "./ghibli_pipeline/episode04/Episode04Ghibli";
import { EP04G_TOTAL_FRAMES } from "./ghibli_pipeline/episode04/timing";
import { Episode05Ghibli } from "./ghibli_pipeline/episode05/Episode05Ghibli";
import { EP05_TOTAL_FRAMES } from "./episode05/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Studio Ghibli Episode 5 (The Current Production Master) */}
      <Composition
        id="Episode05"
        component={Episode05Ghibli}
        durationInFrames={EP05_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />
      <Composition
        id="Episode05GhibliFull"
        component={Episode05Ghibli}
        durationInFrames={EP05_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />
      <Composition
        id="Episode05Ghibli"
        component={Episode05Ghibli}
        durationInFrames={EP05_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />
      <Composition
        id="Episode05GhibliTest"
        component={Episode05Ghibli}
        durationInFrames={EP05_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />

      {/* Studio Ghibli Episode 4 (The Gold Standard) */}
      <Composition
        id="Episode04GhibliFull"
        component={Episode04Ghibli}
        durationInFrames={EP04G_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />

      {/* Other Episodes */}
      <Composition
        id="Episode01"
        component={Episode01}
        durationInFrames={EPISODE_01_TOTAL_FRAMES}
        fps={24}
        width={1920}
        height={1080}
      />
    </>
  );
};
