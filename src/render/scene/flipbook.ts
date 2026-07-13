/**
 * Pure, DOM-free, Three-free frame selector for the enemy sprite flipbook.
 *
 * The enemy sprites play short Prohibition-1987-style flips (idle sway, muzzle
 * recoil) driven by the per-file frame counts authored in `levelArt.json`
 * (`enemies.types[*].frames`) at a shared `enemies.fps`. This helper maps an
 * elapsed time to a **1-based** frame index (frame 1 is always the committed,
 * unsuffixed PNG), so the render layer can stay a thin lookup. It is the twin of
 * {@link ./haloFalloff}: no canvas, no DOM, no Three — trivially unit-tested.
 *
 * Degenerate inputs collapse to frame 1: a single-frame sprite, a non-positive
 * fps, or a non-finite / negative clock all hold on the base pose rather than
 * producing a NaN index.
 */
export function flipbookFrame(elapsed: number, frameCount: number, fps: number): number {
  if (frameCount <= 1 || fps <= 0) return 1;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 1;
  return (Math.floor(elapsed * fps) % frameCount) + 1;
}
