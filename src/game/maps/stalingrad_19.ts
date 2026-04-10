import type { TileMap, TileType } from "@game/types/tileMap";

/**
 * Stalingrad — 19e arrondissement
 * Grand immeuble haussmannien, 48 colonnes × 40 rangées.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function row(...tiles: TileType[]): readonly TileType[] {
  return tiles;
}

/** Repeat a pattern to fill `count` columns */
function rep(count: number, ...pattern: TileType[]): TileType[] {
  return Array.from({ length: count }, (_, i) => pattern[i % pattern.length] ?? W);
}

/** Build a facade row: left edge, repeating middle, right edge */
function frow(
  left: TileType[],
  mid: TileType[],
  midCount: number,
  right: TileType[],
): readonly TileType[] {
  const middle = Array.from({ length: midCount }, (_, i) => mid[i % mid.length] ?? W);
  return [...left, ...middle, ...right];
}

const W: TileType = "WALL";
const L: TileType = "WINDOW_LIT";
const D: TileType = "WINDOW_DARK";
const R: TileType = "ROOFTOP";
const O: TileType = "DOOR";
const B: TileType = "BALCONY";
const S: TileType = "SHOP";
const F: TileType = "FIRE_ESCAPE";
const A: TileType = "ARCH";

// ── Map definition ────────────────────────────────────────────────────────────

export const STALINGRAD_19: TileMap = {
  name: "Stalingrad — 19e",
  cols: 48,
  rows: 40,
  tileW: 1,
  tileH: 1,
  tiles: [
    // ── rows 0-1 : toiture zinc ──
    row(...rep(48, R)),
    row(...rep(48, R)),

    // ── rows 2-3 : mansardes 7e étage ──
    // Petites fenêtres de lucarne, fire escapes sur les extrémités
    frow([F, L, W], [W, D, W, W, L, W], 42, [W, L, F]),
    frow([F, W, W], [W, W, W, W, W, W], 42, [W, W, F]),

    // ── rows 4-6 : 6e étage ──
    frow([A, W, W], [W, L, W, W, D, W, W, L, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),
    frow([A, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, A]),

    // ── rows 7-9 : 5e étage ──
    frow([W, W, W], [L, W, W, D, W, W, L, W, W], 42, [W, W, W]),
    frow([W, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, W]),
    frow([W, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, W]),

    // ── rows 10-12 : 4e étage — fire escape central ──
    frow([W, W, W], [D, W, W, L, W, F, D, W, W], 42, [W, W, W]),
    frow([W, W, W], [W, W, W, W, W, F, W, W, W], 42, [W, W, W]),
    frow([W, B, W], [W, B, W, W, B, F, W, B, W], 42, [W, B, W]),

    // ── rows 13-15 : 3e étage ──
    frow([A, W, W], [L, W, W, L, W, W, D, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),
    frow([A, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, A]),

    // ── rows 16-18 : 2e étage A ──
    frow([W, W, W], [D, W, W, L, W, W, D, W, W], 42, [W, W, W]),
    frow([W, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, W]),
    frow([W, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, W]),

    // ── rows 19-21 : 2e étage B — rangée avec arches ──
    frow([A, W, W], [L, W, W, D, W, W, L, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),
    frow([A, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, A]),

    // ── rows 22-24 : 1er étage A ──
    frow([W, W, W], [D, W, W, L, W, W, D, W, W], 42, [W, W, W]),
    frow([W, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, W]),
    frow([W, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, W]),

    // ── rows 25-27 : 1er étage B — fire escapes latéraux ──
    frow([F, W, W], [L, W, W, D, W, W, L, W, W], 42, [W, W, F]),
    frow([F, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, F]),
    frow([F, B, W], [W, B, W, W, B, W, W, B, W], 42, [W, B, F]),

    // ── rows 28-30 : entresol / entre-deux ──
    frow([A, W, W], [D, W, W, D, W, W, D, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),

    // ── rows 31-33 : soubassement avec arcades ──
    frow([A, W, W], [D, W, W, D, W, W, D, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),
    frow([A, W, W], [W, W, W, W, W, W, W, W, W], 42, [W, W, A]),

    // ── rows 34-36 : rdc commerces ──
    row(...rep(48, W, S, W, W, S, W, W, S, W)),
    row(...rep(48, W, S, W, W, S, W, W, S, W)),
    row(
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      S,
      W,
      W,
      W,
    ),

    // ── rows 37-39 : portes d'entrée ──
    row(
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
    ),
    row(
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
    ),
    row(
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
      W,
      O,
      W,
      W,
      W,
      W,
    ),
  ],
};
