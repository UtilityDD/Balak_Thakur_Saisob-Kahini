import React from "react";
import { Scene00Intro as Episode1Intro, SCENE00 } from "../../cinematic/scenes/Scene00Intro";

/**
 * Episode 5 intro: the Episode 1 intro design (TTL-02, TTL-04), with this episode's label and name
 * ("পর্ব পাঁচ: কচ্ছপ খেলা ও গাভী রক্ষা", plan STO-20). No captions on this page (TTL-03).
 */
export const Scene00Intro: React.FC = () => (
  <Episode1Intro scene={SCENE00} episodeLabel="পর্ব পাঁচ" episodeName="কচ্ছপ খেলা ও গাভী রক্ষা" />
);
