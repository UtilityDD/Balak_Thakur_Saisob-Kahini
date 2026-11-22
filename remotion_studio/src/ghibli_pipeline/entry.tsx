import React from "react";
import { Composition, registerRoot } from "remotion";
import { GHIBLI_EPISODES } from "./registry";

const GhibliPipelineRoot: React.FC = () => (
  <>
    {GHIBLI_EPISODES.map((ep) => (
      <Composition
        key={ep.id}
        id={ep.id}
        component={ep.component}
        durationInFrames={ep.durationInFrames}
        fps={ep.fps}
        width={ep.width}
        height={ep.height}
      />
    ))}
  </>
);

registerRoot(GhibliPipelineRoot);
