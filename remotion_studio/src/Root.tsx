import React from "react";
import { Composition } from "remotion";
import { Episode01 } from "./Episode01";
import { EPISODE_01_TOTAL_FRAMES } from "./data/episode01Data";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Episode01"
      component={Episode01}
      durationInFrames={EPISODE_01_TOTAL_FRAMES}
      fps={24}
      width={1920}
      height={1080}
    />
  );
};
