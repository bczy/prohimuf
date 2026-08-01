/**
 * Which navigation path boots a level for the align-windows harness (T4).
 *
 * A SHIPPED level is entered the way a player would: title screen → menu
 * wall → click its flyer (FlyerWall.tsx lists exactly LEVELS). A GENERATED
 * level is BY CONSTRUCTION absent from that wall — the menu never lists
 * GENERATED_LEVELS (ADR-0075 §6) — so clicking its name there can only time
 * out. Its ONE reachability seam is `?preview=level&level=<id>`, which boots
 * straight into PLAYING with no menu and no narrative card (the same seam
 * scripts/e2e-generated-level.mjs proves end to end).
 *
 * Pure (no playwright import) so the path choice itself is unit-testable.
 *
 * @param {{ id: string, generated?: boolean }} level
 * @param {string} previewUrl base preview URL, e.g. "http://127.0.0.1:4173/prohimuf/"
 * @returns {{ path: "menu" | "preview-seam", url: string }}
 */
export function bootNavigation(level, previewUrl) {
  if (level.generated) {
    return {
      path: "preview-seam",
      url: `${previewUrl}?preview=level&level=${encodeURIComponent(level.id)}`,
    };
  }
  return { path: "menu", url: previewUrl };
}
