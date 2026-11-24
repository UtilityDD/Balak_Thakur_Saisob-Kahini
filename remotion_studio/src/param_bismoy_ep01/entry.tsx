import React from "react";
import { Composition, registerRoot } from "remotion";
import { ParamBismoyEp01 } from "./ParamBismoyEp01";
import { S2_EP01_TOTAL_FRAMES } from "./timing";
import { PAINTED_DEMO_FRAMES, ParamBismoyPaintedDemo } from "./ParamBismoyPaintedDemo";

const Series2Root: React.FC = () => (
  <>
    <Composition
      id="ParamBismoyPaintedDemo"
      component={ParamBismoyPaintedDemo}
      durationInFrames={PAINTED_DEMO_FRAMES}
      fps={24}
      width={1920}
      height={1080}
    />
    <Composition
      id="ParamBismoyEp01"
      component={ParamBismoyEp01}
      durationInFrames={S2_EP01_TOTAL_FRAMES}
      fps={24}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(Series2Root);
