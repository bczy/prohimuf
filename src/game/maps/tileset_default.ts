import type { Tileset } from "@game/types/tileMap";

// Fanzine flat palette — one coherent building facade
// All "structure" tiles share the same stone/concrete base color.
// Only windows break the palette with warm glow or void black.
export const TILESET_DEFAULT: Tileset = {
  WALL: { color: "#2a1f3d" }, // dark violet plaster — Haussmann night
  ROOFTOP: { color: "#1a1228" }, // slightly darker at the top
  BALCONY: { color: "#241934" }, // iron railing row — between wall and void
  DOOR: { color: "#1a0a0a" }, // heavy dark entrance
  WINDOW_DARK: { color: "#080510" }, // void — no one home, pure black
  WINDOW_LIT: { color: "#ff6600" }, // neon orange glow — someone's there
};
