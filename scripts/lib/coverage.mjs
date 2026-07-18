/**
 * Pure window-COVERAGE predicates for the alignment harness (ADR-0028 iteration 2).
 * No I/O, no playwright — unit-testable in isolation (vitest picks up
 * `scripts/lib/**\/*.test.mjs`).
 *
 * Detection-INDEPENDENT gate, measured from the ART. `misaligned()`
 * (alignment.mjs) compares an applied frame to the DETECTED opening, so a
 * detection UNDER-measurement (a dim second pane read as one pane) or
 * OVER-measurement (two windows + the wall between merged into one run) converges
 * green while the railing visibly frames the wrong thing. These predicates instead
 * compare the frame to warm density sampled directly off `facade.png`, so a
 * half-covered — or wall-straddling — lit window can never converge green again.
 *
 *   - UNDERCOVER(side): an EXTERIOR strip just OUTSIDE the frame edge is still warm
 *     ⇒ the lit window clearly continues past the frame edge, the frame is too narrow.
 *   - OVERCOVER(side):  an INTERIOR strip just INSIDE the frame edge is dark ⇒ the
 *     frame edge sits on unlit wall, the frame is too wide / straddles the gap.
 *
 * `coverStrips` is pure rectangle math (incl. neighbour bounding); `coverDefects`
 * takes the four PRECOMPUTED strip densities. The pixel sampling that turns a strip
 * rectangle into a warm-density number lives in `align-windows.mjs` (impure).
 */

/** Exterior strip warm ≥ this ⇒ the window continues past the edge (UNDERCOVER). */
export const UNDERCOVER_DENS = 0.28;
/** Interior strip warm < this ⇒ the edge sits on unlit wall (OVERCOVER). */
export const OVERCOVER_DENS = 0.07;
/** Exterior strip width as a fraction of the frame width. */
export const EXT_FRAC = 0.35;
/** Interior strip width as a fraction of the frame width. */
export const INT_FRAC = 0.18;

/**
 * Horizontal spans (normalized x, `[x0,x1]`) of the four coverage strips for one
 * frame. `leftBound` / `rightBound` are HARD x limits — a neighbouring opening's
 * inner edge minus a small gap, or the panel edge (0 / 1) — that clamp the EXTERIOR
 * strips so they never reach into an adjacent lit window (which would read as a false
 * UNDERCOVER). Interior strips live inside the frame, so they are never
 * neighbour-bounded. A clamped exterior strip can collapse to empty (`x1 <= x0`); it
 * is returned as-is and the caller samples an empty strip as density 0 (⇒ the window
 * has no room to continue there, so no UNDERCOVER — the safe verdict).
 *
 * Note on the haussmann railing template: it legitimately overhangs the opening by
 * ~`ww·0.05` per side, but the INTERIOR OVERCOVER strip is measured INSIDE `zone.w`
 * (from the frame edge inward), so that fixed decorative overhang is outside the
 * sampled region and never reads as OVERCOVER.
 *
 * @param {{ x: number, w: number }} frame  applied railing frame (normalized, centre form)
 * @param {number} leftBound   hard left x limit for the left exterior strip
 * @param {number} rightBound  hard right x limit for the right exterior strip
 * @returns {{ extLeft:[number,number], extRight:[number,number], intLeft:[number,number], intRight:[number,number] }}
 */
export function coverStrips(frame, leftBound, rightBound, opts = {}) {
  const extFrac = opts.extFrac ?? EXT_FRAC;
  const intFrac = opts.intFrac ?? INT_FRAC;
  const fl = frame.x - frame.w / 2;
  const fr = frame.x + frame.w / 2;
  const extW = extFrac * frame.w;
  const intW = intFrac * frame.w;
  return {
    extLeft: [Math.max(fl - extW, leftBound), fl],
    extRight: [fr, Math.min(fr + extW, rightBound)],
    intLeft: [fl, fl + intW],
    intRight: [fr - intW, fr],
  };
}

/**
 * Coverage verdict from the four PRECOMPUTED strip densities (warm fractions in
 * `[0,1]`). Returns the failing reasons among
 * `UNDERCOVER(left|right)` / `OVERCOVER(left|right)`; `["nan"]` if any input is
 * non-finite (a defect, never a silent pass); `[]` when the frame edges match the art.
 *
 * `tol.suppressOver` drops the OVERCOVER checks: a frame pinned at the railing's
 * MINIMUM (floor-clamped) width is intentionally wider than a sub-floor lit window,
 * so its unavoidable per-side overhang is by-design, not a wall-straddle defect. An
 * actual over-extension / straddle is always well ABOVE the floor width, so this
 * suppression never masks one. UNDERCOVER is never suppressed.
 *
 * @param {{ extLeft:number, extRight:number, intLeft:number, intRight:number }} dens
 * @param {{ underDens?: number, overDens?: number, suppressOver?: boolean }} tol
 * @returns {string[]}
 */
export function coverDefects(dens, tol = {}) {
  const under = tol.underDens ?? UNDERCOVER_DENS;
  const over = tol.overDens ?? OVERCOVER_DENS;
  const { extLeft, extRight, intLeft, intRight } = dens;
  if (![extLeft, extRight, intLeft, intRight].every(Number.isFinite)) return ["nan"];
  const out = [];
  if (extLeft >= under) out.push("UNDERCOVER(left)");
  if (extRight >= under) out.push("UNDERCOVER(right)");
  if (!tol.suppressOver && intLeft < over) out.push("OVERCOVER(left)");
  if (!tol.suppressOver && intRight < over) out.push("OVERCOVER(right)");
  return out;
}
