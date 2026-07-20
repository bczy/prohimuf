/**
 * Barrel for the pre-game print system. Surfaces import tokens + primitives from
 * `@render/ui/print` (ADR-0021 D3). Render-only: no `src/game` symbol, no game rule.
 */
export * from "./tokens";

export { PaperSheet } from "./PaperSheet";
export type { PaperSheetProps } from "./PaperSheet";

export { HalftoneHero } from "./HalftoneHero";
export type { HalftoneHeroProps } from "./HalftoneHero";

export { Stamp } from "./Stamp";
export type { StampProps, StampShape } from "./Stamp";

export { MarkerCircle } from "./MarkerCircle";
export type { MarkerCircleProps } from "./MarkerCircle";

export { TapeCorner } from "./TapeCorner";
export type { TapeCornerProps, Corner } from "./TapeCorner";

export { useRovingIndex, nextRovingIndex } from "./useRovingIndex";
export type { RovingAxis, RovingOptions, RovingIndex } from "./useRovingIndex";

export { useMediaQuery } from "./useMediaQuery";

export { useReducedMotionRoot, unionReducedMotion, REDUCED_MOTION_QUERY } from "./useReducedMotion";

export { flyerEdgePolygon, dogEarCorner, tapeStripPath } from "./flyerGeometry";
export type { FlyerEdge, TapeStrip } from "./flyerGeometry";
