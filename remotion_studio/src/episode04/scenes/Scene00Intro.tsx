import React from "react";
import { Scene00Intro as Episode1Intro, SCENE00 } from "../../cinematic/scenes/Scene00Intro";

/**
 * Episode 4 intro: the Episode 1 intro design (TTL-02, TTL-04), with this episode's label and name (the title in
 * Episode 4's scenes_manifest.json and SRT: "পর্ব চার: শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক"). No captions on this page (TTL-03).
 */
export const Scene00Intro: React.FC = () => (
  <Episode1Intro scene={SCENE00} episodeLabel="পর্ব চার" episodeName="শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক" />
);
