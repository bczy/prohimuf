import type { TileMap, TileType } from "@game/types/tileMap";
import type { FacadeMap, WindowSlot } from "@game/types/map";

const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);

/**
 * Convert a TileMap to a FacadeMap (list of window slots with world positions).
 *
 * @param map - The tile map to convert.
 * @param worldOffsetX - Optional horizontal offset in world units (for multi-building streets).
 * @param streetHeight - Optional total street height in rows; aligns building base to y=0.
 *   When provided, buildings are bottom-aligned regardless of their row count.
 */
export function tileMapToFacade(map: TileMap, worldOffsetX = 0, streetHeight?: number): FacadeMap {
  const slots: WindowSlot[] = [];

  // Centre the grid horizontally around worldOffsetX
  const localCenterX = (map.cols - 1) * map.tileW * 0.5;

  // Bottom-align: if streetHeight given, shift building up so its base sits at y=0
  // Without streetHeight, center vertically as before
  const rowOffsetY =
    streetHeight !== undefined
      ? -(streetHeight - map.rows) * map.tileH // shift up by gap rows
      : 0;
  const localCenterY = (map.rows - 1) * map.tileH * 0.5;

  for (let row = 0; row < map.rows; row++) {
    const tileRow = map.tiles[row];
    if (tileRow === undefined) continue;
    for (let col = 0; col < map.cols; col++) {
      const tile = tileRow[col];
      if (tile === undefined) continue;
      if (!WINDOW_TYPES.has(tile)) continue;

      slots.push({
        col,
        row,
        screenPosition: {
          x: worldOffsetX + col * map.tileW - localCenterX,
          y: -(row * map.tileH - localCenterY) + rowOffsetY,
        },
      });
    }
  }

  return { width: map.cols, height: map.rows, slots };
}
