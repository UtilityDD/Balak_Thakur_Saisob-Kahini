import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Bundled Bengali display face (Baloo Da 2, SIL OFL — see public/fonts/OFL-BalooDa2.txt).
 * Rounded, child-friendly, with full conjunct (যুক্তাক্ষর) shaping. Bundled so renders never
 * depend on whatever Bengali fonts the render machine happens to have.
 */
export const BN_FONT = "'Baloo Da 2', 'Noto Sans Bengali', 'Nirmala UI', 'Vrinda', sans-serif";

let started = false;

/** Blocks rendering until the font is loaded, so no frame is drawn with the fallback. */
export function ensureBanglaFont() {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading Baloo Da 2");
  const face = new FontFace("Baloo Da 2", `url(${staticFile("fonts/BalooDa2-Variable.ttf")}) format("truetype")`, {
    weight: "400 800",
  });
  face
    .load()
    .then(() => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((err) => {
      console.error("Baloo Da 2 failed to load, falling back", err);
      continueRender(handle);
    });
}

ensureBanglaFont();
