import React from "react";
import { Composition, registerRoot } from "remotion";
import { RefTracedQA } from "./RefTracedQA";

const RefTracedRoot: React.FC = () => (
  <Composition id="ThakurRefTracedQA" component={RefTracedQA} durationInFrames={96} fps={24} width={1920} height={1080} />
);

registerRoot(RefTracedRoot);
