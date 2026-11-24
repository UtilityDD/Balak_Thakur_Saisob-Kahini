import React from "react";
import { Composition, registerRoot } from "remotion";
import { Episode03Ghibli } from "./Episode03Ghibli";
import { EP03_TOTAL_FRAMES } from "../../episode03/timing";

const Ep03TracedRoot: React.FC = () => (
  <Composition id="Episode03GhibliTraced" component={Episode03Ghibli} durationInFrames={EP03_TOTAL_FRAMES} fps={24} width={1920} height={1080} />
);

registerRoot(Ep03TracedRoot);
