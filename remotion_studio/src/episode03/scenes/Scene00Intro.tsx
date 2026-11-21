import React from "react";
import { Scene00Intro as Episode1Intro, SCENE00 } from "../../cinematic/scenes/Scene00Intro";

/** Episode 3 intro: the Episode 1 intro design, with this episode's label and name. */
export const Scene00Intro: React.FC = () => (
  <Episode1Intro scene={SCENE00} episodeLabel="পর্ব তিন" episodeName="পাঁচ বছরের মুখে অমূল্য তত্ত্ব" />
);
