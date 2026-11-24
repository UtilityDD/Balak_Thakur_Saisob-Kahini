import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { SetSkinContext } from "../../cinematic/sets/SetSkin";
import { Episode06 } from "../../episode06/Episode06";
import { GhibliCharFilterDefs } from "../GhibliStage";
import { EP06_GHIBLI_SKIN } from "./GhibliVillageSkin";

/**
 * Episode 6 in the hand-painted (watercolour + sepia-ink) look: a SEPARATE composition.
 *
 * It plays the approved immersive re-cut (STO-22a) unchanged - same scenes, timing, voices, sound, subtitles,
 * camera and acting - and swaps the sets' vector art for the painted plates and cutouts of
 * public/images/ghibli_ep06/ through the opt-in SetSkin. `Episode06` itself is not modified and renders as before.
 * Asset sheet: 03_Episodes/Episode_06_Rescuing_Brother_and_Playmates/01_Script_and_Storyboard/Ep06_Ghibli_Asset_Sheet.md
 */
export const Episode06Ghibli: React.FC = () => (
  <AbsoluteFill>
    {/* Global SVG filter definition (#ghibli-char-ink) so rigged characters match sepia-ink painted sets */}
    <svg width={0} height={0} style={{ position: "absolute", pointerEvents: "none" }} aria-hidden>
      <GhibliCharFilterDefs />
    </svg>
    <SetSkinContext.Provider value={EP06_GHIBLI_SKIN}>
      <Episode06 />
    </SetSkinContext.Provider>
    {/* delicate cold-press paper tooth over everything without muddying highlights */}
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.1 }}>
      <img src={staticFile("images/ghibli_ep06/watercolor_paper_grain.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  </AbsoluteFill>
);
