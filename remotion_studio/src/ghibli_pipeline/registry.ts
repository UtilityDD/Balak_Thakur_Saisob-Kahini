/**
 * Generic Ghibli Pipeline Episode Registry (`src/ghibli_pipeline/registry.ts`).
 *
 * Register every Ghibli-style episode composition here (both legacy episodes converted to Ghibli
 * and upcoming episodes). `src/ghibli_pipeline/entry.tsx` and `src/Root.tsx` read from this
 * registry so any agent can add `Episode01GhibliTest`, `Episode02GhibliTest`, `Episode04GhibliTest`, etc.
 * in one place without duplicating boilerplate.
 */

import React from "react";
import { EP03_TOTAL_FRAMES } from "../episode03/timing";
import { Episode03Ghibli } from "./episode03/Episode03Ghibli";

export interface GhibliEpisodeSpec {
  /** Remotion Composition ID (e.g. "Episode03GhibliTest"). */
  id: string;
  /** Episode number or slug (e.g. "ep03"). */
  slug: string;
  /** Root React component for the Ghibli episode. */
  component: React.FC;
  /** Total frame count at 24 fps. */
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export const GHIBLI_EPISODES: readonly GhibliEpisodeSpec[] = [
  {
    id: "Episode03GhibliTest",
    slug: "ep03",
    component: Episode03Ghibli,
    durationInFrames: EP03_TOTAL_FRAMES,
    fps: 24,
    width: 1920,
    height: 1080,
  },
];
