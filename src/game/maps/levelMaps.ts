import type { TileMap } from "@game/types/tileMap";
import { RUE_BELLIARD, BUILDING_GAP, STREET_HEIGHT } from "./rue_belliard";
import { STALINGRAD_19 } from "./stalingrad_19";
import { VITRY_94 } from "./vitry_94";

export interface LevelLayout {
  /** Ordered list of building tile maps for this level */
  buildings: readonly TileMap[];
  /** Gap between buildings in world units */
  gap: number;
  /** Total street height used to bottom-align buildings */
  streetHeight: number;
}

/** Map from level id to its layout definition */
export const LEVEL_LAYOUTS: Record<string, LevelLayout> = {
  belliard: {
    buildings: RUE_BELLIARD,
    gap: BUILDING_GAP,
    streetHeight: STREET_HEIGHT,
  },
  stalingrad: {
    buildings: [STALINGRAD_19],
    gap: BUILDING_GAP,
    streetHeight: STALINGRAD_19.rows,
  },
  vitry: {
    buildings: [VITRY_94],
    gap: BUILDING_GAP,
    streetHeight: VITRY_94.rows,
  },
};

export const DEFAULT_LAYOUT: LevelLayout = LEVEL_LAYOUTS.belliard as unknown as LevelLayout;
