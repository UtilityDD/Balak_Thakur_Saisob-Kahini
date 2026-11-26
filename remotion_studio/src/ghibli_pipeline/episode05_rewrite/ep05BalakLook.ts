import type { PlateLook } from "../../cinematic/rig/ThakurHeadPlate";

/**
 * BAL-26f in the Ghibli Episode 5 rewrite (director still to confirm, blueprint Q1): the props that switch the shared
 * Balak rigs to the refined new look (light golden skin, short straight side-parted hair, the soft chadar).
 *
 * ONE SWITCH: spread onto EVERY Balak rig of the rewrite, <StandingChild {...EP05_BALAK_LOOK} .../>,
 * <SeatedChild {...EP05_BALAK_LOOK} .../> (Ep05SeatedBalak / Ep05StandingBalak in Ep05RewriteCast.tsx already do).
 * `plateLook: "ref2"` implies StandingChild build "healthy" and SeatedChild design "plate".
 * To revert to the delivered plate look, change this line to `export const EP05_BALAK_LOOK: { plateLook?: PlateLook } = {};`
 * (the type already allows it).
 */
export const EP05_BALAK_LOOK: { plateLook?: PlateLook } = { plateLook: "ref2" };

/** Balak is about six for the whole episode (STO-20, the book: "পাঁচ বছর পেরিয়ে ছয় বছরে"). Pass as the rigs' `age`. */
export const EP05_BALAK_AGE = 6;
