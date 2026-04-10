import type { TileMap, TileType } from "@game/types/tileMap";
import type { FacadeMap, WindowSlot } from "@game/types/map";

const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);

export function tileMapToFacade(map: TileMap): FacadeMap {
  const slots: WindowSlot[] = [];

  // Centre the grid: origin at tile (cols/2, rows/2)
  const offsetX = (map.cols - 1) * map.tileW * 0.5;
  const offsetY = (map.rows - 1) * map.tileH * 0.5;

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
          x: col * map.tileW - offsetX,
          y: -(row * map.tileH - offsetY),
        },
      });
    }
  }

  return { width: map.cols, height: map.rows, slots };
}
