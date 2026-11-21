import React from "react";
import { AbsoluteFill } from "remotion";
import { SeriesOutro } from "../../episode/SeriesCards";
import { NextEpisodeGlimpse, OUTRO_WITH_GLIMPSE_FRAMES } from "./Scene98NextEpisode";

/**
 * Episode 3 · Scene 99 — closing dawn card with the next-episode glimpse (TTL-10a).
 * The shared series outro (src/episode/SeriesCards.tsx) runs on through the 98 segment (871 frames in all;
 * Episode03.tsx keeps this scene drawing under it), so its fade to dark lands on the episode's last frame.
 * Over the sunset, the soft, boxless glimpse of Episode 4 melts in on the "আসছে পরের পর্ব" line.
 */
export const Scene99ClosingSequentialOutro: React.FC = () => (
  <AbsoluteFill>
    <SeriesOutro closing="ছোটদের বালক ঠাকুরের গল্প" frames={OUTRO_WITH_GLIMPSE_FRAMES} />
    <NextEpisodeGlimpse />
  </AbsoluteFill>
);
