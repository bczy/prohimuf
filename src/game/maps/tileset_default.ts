import type { Tileset } from "@game/types/tileMap";

export const TILESET_DEFAULT: Tileset = {
  WALL: { sprite: "tile_wall.png", fallbackColor: "#2d1b4e" },
  WINDOW_DARK: { sprite: "tile_window_dark.png", fallbackColor: "#0d0820" },
  WINDOW_LIT: { sprite: "tile_window_lit.png", fallbackColor: "#ff6600" },
  BALCONY: { sprite: "tile_balcony.png", fallbackColor: "#1a1040" },
  DOOR: { sprite: "tile_door.png", fallbackColor: "#3d0000" },
  ROOFTOP: { sprite: "tile_rooftop.png", fallbackColor: "#111" },
};
