/**
 * Public barrel of the portrait catalogue (ADR-0080 D1) — the only import surface.
 * Consumers take the data from here, never from `faceCatalogue.data.ts` directly, so the
 * data module stays swappable (`src/game/levels/levels.ts` precedent).
 */
export { FACE_CATALOGUE } from "@game/portraits/faceCatalogue.data";
export { validatePortrait, SEED_SWEEP } from "@game/portraits/validatePortrait";
export type { PortraitPlateManifest } from "@game/portraits/validatePortrait";
export type {
  FaceCatalogue,
  PortraitBand,
  PortraitBandId,
  PortraitVariant,
  VariantDistance,
} from "@game/types/portraitRobot";
