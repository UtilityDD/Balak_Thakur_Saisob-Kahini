import type { PlateLook } from "../../cinematic/rig/ThakurHeadPlate";

/**
 * BAL-26f: the props that switch the shared Balak rigs to the refined new look. Ghibli Episode 4 only.
 * Spread onto EVERY Balak rig in Episode 4: <StandingChild {...EP04_BALAK_LOOK} .../>, <SeatedChild {...EP04_BALAK_LOOK} .../>,
 * and ThakurHeadPlate when used directly. `plateLook: "ref2"` implies StandingChild build "healthy" and SeatedChild
 * design "plate"; other episodes never pass it, so they render unchanged.
 */
export const EP04_BALAK_LOOK: { plateLook: PlateLook } = { plateLook: "ref2" };
