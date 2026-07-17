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
 * Compare a zone's railing frame (`zone.x` centre, `zone.w` width) against a measured
 * opening (`opening.x`, `opening.w`). Returns the FIRST failing reason — `"x"` for a
 * shifted centre, `"w"` for a width mismatch — or `null` when both sit within `tol`.
 *
 * @param {{ x: number, w: number }} zone     applied railing frame (normalized)
 * @param {{ x: number, w: number }} opening  measured window opening (normalized)
 * @param {number} tol                        tolerance, normalized (see ALIGN_TOL)
 * @returns {"x" | "w" | null}
 */
export function misaligned(zone, opening, tol) {
  if (Math.abs(zone.x - opening.x) > tol) return "x";
  if (Math.abs(zone.w - opening.w) > tol) return "w";
  return null;
}
