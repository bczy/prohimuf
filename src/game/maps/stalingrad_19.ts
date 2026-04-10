import type { TileMap, TileType } from "@game/types/tileMap";

/**
 * Stalingrad — 19e arrondissement
 * Grand immeuble haussmannien, 24 colonnes × 40 rangées.
 * Scrollable horizontalement ET verticalement.
 * Structure : 2 toitures + 37 étages de fenêtres + 1 rez-de-chaussée
 */

// Helper to build a window row alternating LIT/DARK with WALL separators
function winRow(pattern: TileType[]): TileType[] {
  // pattern length must be 24
  return pattern;
}

const W: TileType = "WALL";
const L: TileType = "WINDOW_LIT";
const D: TileType = "WINDOW_DARK";
const R: TileType = "ROOFTOP";
const O: TileType = "DOOR";

export const STALINGRAD_19: TileMap = {
  name: "Stalingrad — 19e",
  cols: 24,
  rows: 40,
  tileW: 1,
  tileH: 1,
  tiles: [
    // row 0-1 — double toiture / mansardes
    [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
    [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
    // row 2 — 7e mansardes (fenêtres espacées)
    winRow([W, L, W, W, D, W, W, L, W, W, D, W, W, L, W, W, D, W, W, L, W, W, D, W]),
    // row 3-4 — mur entre toiture et étages
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 5-8 — 6e étage
    winRow([W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, W]),
    winRow([W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 8-11 — 5e étage
    winRow([W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 11-14 — 4e étage
    winRow([W, D, W, L, W, L, W, D, W, D, W, L, W, D, W, L, W, L, W, D, W, L, W, W]),
    winRow([W, D, W, L, W, L, W, D, W, D, W, L, W, D, W, L, W, L, W, D, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 14-17 — 3e étage
    winRow([W, L, W, D, W, D, W, L, W, L, W, D, W, L, W, D, W, D, W, L, W, D, W, W]),
    winRow([W, L, W, D, W, D, W, L, W, L, W, D, W, L, W, D, W, D, W, L, W, D, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 17-20 — 2e étage A
    winRow([W, D, W, L, W, D, W, L, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, D, W, L, W, D, W, L, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 20-23 — 2e étage B (autre immeuble mitoyen)
    winRow([W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, W]),
    winRow([W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 23-26 — 1er étage A
    winRow([W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, W]),
    winRow([W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, L, W, D, W, D, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 26-29 — 1er étage B
    winRow([W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, D, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 29-32 — entresol / mezzanine
    winRow([W, D, W, W, W, L, W, W, W, D, W, W, W, L, W, W, W, D, W, W, W, L, W, W]),
    winRow([W, D, W, W, W, L, W, W, W, D, W, W, W, L, W, W, W, D, W, W, W, L, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 32-35 — soubassement
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    winRow([W, D, W, W, L, W, W, D, W, W, L, W, W, D, W, W, L, W, W, D, W, W, W, W]),
    winRow([W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]),
    // rows 35-37 — rez-de-chaussée commerce
    winRow([W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, W, W]),
    winRow([W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, D, W, W, W, W]),
    // rows 37-39 — rdc portes
    winRow([W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W]),
    winRow([W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W]),
    winRow([W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W, W, O, W, W, W, W, W, W]),
  ],
};
