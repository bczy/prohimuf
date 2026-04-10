import type { FacadeMap } from "@game/types/map";

// 20 colonnes × 4 rangées — plus large que le viewport (~10 unités visibles)
// screenPosition : x = col * 2 - 19,  y = -(row * 1.5 - 2.25)
const COLS = 20;
const ROWS = 4;

export const FACADE_01: FacadeMap = {
  width: COLS,
  height: ROWS,
  slots: Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      col,
      row,
      screenPosition: { x: col * 2 - (COLS - 2), y: -(row * 1.5 - 2.25) },
    })),
  ).flat(),
};
