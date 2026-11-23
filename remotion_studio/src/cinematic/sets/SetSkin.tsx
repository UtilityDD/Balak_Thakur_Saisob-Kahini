import React from "react";
import type { Cam } from "../core/Stage";

/**
 * Opt-in "skin" for the shared sets (UjancharVillageField, UjancharHouse).
 *
 * With no provider (the default, every delivered episode) the sets render exactly as before: each hook below
 * returns undefined and the set draws its own vector art. A variant cut (e.g. the hand-painted
 * `Episode06Ghibli` in src/ghibli_pipeline/episode06/) wraps the unchanged scenes in <SetSkinContext.Provider>
 * and replaces only what it returns a node for. Story, camera, characters, props in hands and timing stay the
 * scene's own.
 */

export type SkinPart = "ground" | "set" | "near";

export interface VillageSkinBackdropArgs {
  view: "field" | "house" | "lane";
  time: "lateMorning" | "afternoon" | "sunset";
  f: number;
  cam?: Cam;
  calm: number;
  far?: React.ReactNode;
  yard?: React.ReactNode;
  mid?: React.ReactNode;
}

export interface VillageSkinPartArgs {
  view: "field" | "house" | "lane";
  part: SkinPart;
  time: "lateMorning" | "afternoon" | "sunset";
  f: number;
  /** the set's own vector drawing of this part (a skin may keep it, wrap it or drop it) */
  original: React.ReactNode;
  /** field slots */
  seller?: React.ReactNode;
  lozengeJar?: boolean;
  log?: boolean;
  logShadows?: Array<{ x: number; h: number; w?: number }>;
  /** lane slots */
  crossing?: React.ReactNode;
  /** house slots */
  doorway?: React.ReactNode;
  inPocket?: React.ReactNode;
  shirt?: boolean;
}

export interface UjancharSkinBackdropArgs {
  f: number;
  time: "morning" | "dawn";
  cam?: Cam;
  calm: number;
  fenceJaba?: boolean;
  cow?: boolean | unknown;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
}

export interface UjancharSkinFloorArgs {
  f: number;
  time: "morning" | "dawn";
  under?: React.ReactNode;
  children?: React.ReactNode;
  original: React.ReactNode;
}

export interface SetSkin {
  /** Apply #ghibli-char-ink SVG filter around floor-plane characters so rigged vectors match ink-painted sets. */
  inkCharacters?: boolean;
  /** replace the whole village backdrop (sky to mid field); return undefined to keep the vector one */
  villageBackdrop?: (a: VillageSkinBackdropArgs) => React.ReactNode | undefined;
  /** replace one floor part (ground / set / near); return undefined to keep the vector one */
  villagePart?: (a: VillageSkinPartArgs) => React.ReactNode | undefined;
  /** replace UjancharHouse backdrop (Scene 01); return undefined to keep the vector one */
  ujancharBackdrop?: (a: UjancharSkinBackdropArgs) => React.ReactNode | undefined;
  /** replace UjancharHouse floor layer (Scene 01); return undefined to keep the vector one */
  ujancharFloor?: (a: UjancharSkinFloorArgs) => React.ReactNode | undefined;
}

export const SetSkinContext = React.createContext<SetSkin | null>(null);

export const useSetSkin = (): SetSkin | null => React.useContext(SetSkinContext);
