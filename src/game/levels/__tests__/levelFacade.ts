import type { FacadeMap, WindowSlot } from "@game/types/map";
import { getBackdropLayout, WORLD_HEIGHT } from "@game/levels/levelArt";
import { facadeDrawScale, stretchAboutCentre } from "@render/scene/facadeLayout";

/**
 * TEST FIXTURE ONLY — the REAL runtime facade of a shipped level.
 *
 * `GameScene` composes the `FacadeMap` the tick actually receives from
 * `getBackdropLayout(id)` and then remaps every slot x through the render-side
 * facade stretch (`stretchAboutCentre` at `facadeDrawScale(mode)` — 1.08 for
 * `single-facade`, identity for the wide/tronçon modes), so that cops sit in the
 * windows as the facade IMAGE draws them. `computeBackdropSlots` is the nominal,
 * un-stretched geometry and is therefore NOT what the game runs on.
 *
 * The delivery-assault reservation and ADR-0071's reachability bound are both
 * claims about the geometry the game runs on (ADR-0071:116 names the 1.08
 * draw-scale explicitly as what eats vitry's margin), so the fixture goes through
 * the SAME pure helper the scene uses rather than re-declaring the factor. It is
 * imported by tests only — no `src/game` production module reads `@render`.
 */
export function levelFacade(id: string, facadeH: number = WORLD_HEIGHT): FacadeMap {
  const layout = getBackdropLayout(id);
  const drawScale = facadeDrawScale(layout.mode);
  const slots: WindowSlot[] = [];
  let col = 0;
  for (const tile of layout.tiles) {
    for (const z of tile.zones) {
      const exactX = tile.centreX + (z.x - 0.5) * tile.width;
      slots.push({
        col: col++,
        row: 0,
        screenPosition: {
          x: stretchAboutCentre(exactX, tile.centreX, drawScale),
          y: (0.5 - z.y) * facadeH,
        },
        size: { x: z.w * tile.width, y: z.h * facadeH },
      });
    }
  }
  return { width: slots.length, height: 1, slots };
}
