/**
 * Pure horizontal-alignment predicate for the window-alignment harness
 * (ADR-0028 amendment 2026-07-17). No I/O, no playwright — so it is unit-testable
 * in isolation (vitest picks up `scripts/lib/**\/*.test.mjs`) while detection and
 * the render loop stay integration-tested via the `--check` gate.
 *
 * The foreground railing (`drawForegroundIronwork`) is painted on `zone.x`/`zone.w`,
 * so those must frame the real measured window opening. `misaligned` reports when the
 * railing frame drifts off the opening beyond the tolerance.
 */

/** Railing-vs-opening tolerance (facade-normalized ≈ 15 px on a 1280-wide panel). */
export const ALIGN_TOL = 0.012;

/**
 * Compare a zone's railing frame (`zone.x` CENTRE, `zone.w` width) against a measured
 * opening (`opening.x` CENTRE, `opening.w` width) by PER-EDGE deltas (story AC 2): the
 * frame's left edge (`x − w/2`) and right edge (`x + w/2`) must each sit within `tol` of
 * the opening's corresponding edge. Misaligned iff `|Δleft| > tol` OR `|Δright| > tol`
 * (strict — a delta exactly equal to `tol` passes). Returns the failing edge(s) —
 * `"left"`, `"right"`, or `"left+right"` when both fail — `"nan"` when any input is
 * non-finite (a defect, never silently `null`), or `null` when both edges are within `tol`.
 *
 * Per-edge (not centre+width) is what actually gates the railing: an asymmetric glow can
 * shift a centroid without moving either measured edge, and a centre-only check would let a
 * frame overhang bare wall on one side while `Δx` stays under tolerance.
 *
 * @param {{ x: number, w: number }} zone     applied railing frame (normalized, centre form)
 * @param {{ x: number, w: number }} opening  measured window opening (normalized, centre form)
 * @param {number} tol                        tolerance, normalized (see ALIGN_TOL)
 * @returns {"left" | "right" | "left+right" | "nan" | null}
 */
export function misaligned(zone, opening, tol) {
  if (![zone.x, zone.w, opening.x, opening.w].every(Number.isFinite)) return "nan";
  const left = Math.abs(zone.x - zone.w / 2 - (opening.x - opening.w / 2)) > tol;
  const right = Math.abs(zone.x + zone.w / 2 - (opening.x + opening.w / 2)) > tol;
  if (left && right) return "left+right";
  if (left) return "left";
  if (right) return "right";
  return null;
}
