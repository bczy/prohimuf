/**
 * The photo set-piece seam, as the RENDER consumes it (techplan §D-D, §6 Lane B).
 *
 * A re-export barrel over lane A's `@game/types/photoQte`, so the render surfaces name one
 * import path and the game keeps the single declaration. Nothing is declared here beyond
 * the plate's drawn SIZE (see below), and nothing is computed here: the render decides
 * nothing, it draws what the tick produced.
 *
 * The split the types ENFORCE and that this lane must never soften: `PhotoSceneView`
 * (drawn while the scene is live) has no field able to express a verdict, an instant or a
 * role, and `photoSheetView` yields `null` before `CONTACT_SHEET`. The D8 two-beat
 * feedback is therefore a type-level guarantee, not a convention.
 */

export type {
  Box,
  PhotoBracket,
  PhotoCta,
  PhotoFrameRecord,
  PhotoPosture,
  PhotoQtePhase,
  PhotoRejectReason,
  PhotoSceneView,
  PhotoSheetView,
  PhotoVerdict,
} from "@game/types/photoQte";

/**
 * The plate's extent in scene units. `PhotoSceneView.plate` carries the art IDS, not the
 * geometry, so the drawn size has to reach the render some other way — and it is authored
 * data (spec §0: `100.0 × 56.25` su, 16:9), never a render constant. It is therefore a
 * PROP threaded from the bridge, and this interface only names its shape.
 *
 * SEAM NOTE for lane A: once `photoQteSystem` exports the plate extent (the constant the
 * viewfinder clamp already needs internally), `GameScene` reads it from there and this
 * type can alias the game's own. Until then no render file states the numbers.
 */
export interface PlateExtent {
  readonly w: number;
  readonly h: number;
}
