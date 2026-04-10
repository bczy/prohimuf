import type { TileMap, TileType } from "@game/types/tileMap";

const W: TileType = "WALL";
const L: TileType = "WINDOW_LIT";
const D: TileType = "WINDOW_DARK";
const R: TileType = "ROOFTOP";
const B: TileType = "BALCONY";
const O: TileType = "DOOR";

function row(cols: number, ...spec: [number, TileType][]): TileType[] {
  const result: TileType[] = new Array<TileType>(cols).fill(W);
  let cursor = 0;
  for (const [count, type] of spec) {
    for (let i = 0; i < count; i++) {
      if (cursor < cols) result[cursor++] = type;
    }
  }
  return result;
}

function solidRow(cols: number, type: TileType): TileType[] {
  return new Array<TileType>(cols).fill(type);
}

/**
 * Immeuble A — Haussmannien, 12 cols × 18 rows
 * Bâtiment haut, pierre de taille, beaucoup de fenêtres
 */
const BUILDING_A_COLS = 12;
const BUILDING_A_ROWS = 18;

function buildingA(): readonly (readonly TileType[])[] {
  const c = BUILDING_A_COLS;
  return [
    // row 0-1 : toiture zinc
    solidRow(c, R),
    solidRow(c, R),
    // row 2-3 : mansardes
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    // row 4 : frise
    solidRow(c, W),
    // row 5-7 : 3e étage
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 8-10 : 2e étage + balcons
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 11-13 : 1er étage
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 14-15 : soubassement
    solidRow(c, W),
    row(c, [1, W], [1, D], [2, W], [1, L], [2, W], [1, D], [2, W], [1, L], [1, W], [1, W]),
    // row 16-17 : RDC portes
    row(c, [1, W], [1, O], [3, W], [1, O], [3, W], [1, O], [2, W]),
    row(c, [1, W], [1, O], [3, W], [1, O], [3, W], [1, O], [2, W]),
  ];
}

/**
 * Immeuble B — Années 70, 10 cols × 12 rows
 * Plus bas, béton brut, fenêtres larges
 */
const BUILDING_B_COLS = 10;
const BUILDING_B_ROWS = 12;

function buildingB(): readonly (readonly TileType[])[] {
  const c = BUILDING_B_COLS;
  return [
    // row 0 : toit plat
    solidRow(c, R),
    // row 1-3 : 3e étage
    row(c, [1, W], [2, L], [1, W], [2, D], [1, W], [2, L], [1, W]),
    row(c, [1, W], [2, L], [1, W], [2, D], [1, W], [2, L], [1, W]),
    solidRow(c, W),
    // row 4-6 : 2e étage
    row(c, [1, W], [2, D], [1, W], [2, L], [1, W], [2, D], [1, W]),
    row(c, [1, W], [2, D], [1, W], [2, L], [1, W], [2, D], [1, W]),
    solidRow(c, W),
    // row 7-9 : 1er étage
    row(c, [1, W], [2, L], [1, W], [2, D], [1, W], [2, L], [1, W]),
    row(c, [1, W], [2, L], [1, W], [2, D], [1, W], [2, L], [1, W]),
    solidRow(c, W),
    // row 10-11 : RDC
    row(c, [2, W], [2, D], [2, W], [2, D], [2, W]),
    row(c, [1, W], [1, O], [6, W], [1, O], [1, W]),
  ];
}

/**
 * Immeuble C — Petit pavillon/commerce, 8 cols × 8 rows
 * Très bas, style commerce de rue
 */
const BUILDING_C_COLS = 8;
const BUILDING_C_ROWS = 8;

function buildingC(): readonly (readonly TileType[])[] {
  const c = BUILDING_C_COLS;
  return [
    // row 0 : toiture
    solidRow(c, R),
    // row 1-2 : petit étage
    row(c, [1, W], [2, D], [2, W], [2, L], [1, W]),
    row(c, [1, W], [2, D], [2, W], [2, L], [1, W]),
    // row 3 : frise
    solidRow(c, W),
    // row 4-5 : vitrine
    row(c, [1, W], [2, L], [2, D], [2, L], [1, W]),
    row(c, [1, W], [2, L], [2, D], [2, L], [1, W]),
    // row 6-7 : RDC
    solidRow(c, W),
    row(c, [2, W], [1, O], [2, W], [1, O], [2, W]),
  ];
}

/**
 * Immeuble D — Copropriété moderne, 14 cols × 15 rows
 * Taille intermédiaire, balcons nombreux, style contemporain
 */
const BUILDING_D_COLS = 14;
const BUILDING_D_ROWS = 15;

function buildingD(): readonly (readonly TileType[])[] {
  const c = BUILDING_D_COLS;
  return [
    // row 0 : toit
    solidRow(c, R),
    // row 1-3 : 4e étage
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 4-6 : 3e étage + balcons
    row(
      c,
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, B],
      [1, W],
      [1, D],
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, B],
      [1, W],
      [1, D],
      [1, W],
      [1, B],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 7-9 : 2e étage
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 10-12 : 1er étage
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    row(
      c,
      [1, W],
      [1, D],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, L],
      [1, W],
      [1, D],
      [1, W],
      [1, L],
      [1, W],
      [1, W],
    ),
    solidRow(c, W),
    // row 13-14 : RDC
    row(c, [1, W], [1, D], [2, W], [1, D], [2, W], [1, D], [2, W], [1, D], [2, W], [1, W]),
    row(c, [2, W], [1, O], [3, W], [1, O], [3, W], [1, O], [3, W]),
  ];
}

// ── Export des 4 bâtiments comme TileMaps indépendants ──

export const BELLIARD_A: TileMap = {
  name: "Belliard — Haussmannien",
  cols: BUILDING_A_COLS,
  rows: BUILDING_A_ROWS,
  tileW: 1,
  tileH: 1,
  tiles: buildingA(),
};

export const BELLIARD_B: TileMap = {
  name: "Belliard — Années 70",
  cols: BUILDING_B_COLS,
  rows: BUILDING_B_ROWS,
  tileW: 1,
  tileH: 1,
  tiles: buildingB(),
};

export const BELLIARD_C: TileMap = {
  name: "Belliard — Pavillon",
  cols: BUILDING_C_COLS,
  rows: BUILDING_C_ROWS,
  tileW: 1,
  tileH: 1,
  tiles: buildingC(),
};

export const BELLIARD_D: TileMap = {
  name: "Belliard — Copropriété",
  cols: BUILDING_D_COLS,
  rows: BUILDING_D_ROWS,
  tileW: 1,
  tileH: 1,
  tiles: buildingD(),
};

// Gap entre bâtiments en world units
export const BUILDING_GAP = 2;

// Hauteur max de la rue (pour aligner les bases au sol)
export const STREET_HEIGHT = Math.max(
  BUILDING_A_ROWS,
  BUILDING_B_ROWS,
  BUILDING_C_ROWS,
  BUILDING_D_ROWS,
);

export const RUE_BELLIARD = [BELLIARD_A, BELLIARD_B, BELLIARD_C, BELLIARD_D] as const;
