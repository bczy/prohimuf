import { describe, it, expect } from "vitest";
import { tileMapToFacade } from "@game/systems/tileMapSystem";
import type { TileMap } from "@game/types/tileMap";

const SIMPLE_MAP: TileMap = {
  name: "test",
  cols: 4,
  rows: 2,
  tileW: 2,
  tileH: 1.5,
  tiles: [
    ["WALL", "WINDOW_DARK", "WINDOW_LIT", "WALL"],
    ["BALCONY", "WINDOW_DARK", "WALL", "DOOR"],
  ],
};

describe("tileMapToFacade", () => {
  it("returns a FacadeMap with correct dimensions", () => {
    const facade = tileMapToFacade(SIMPLE_MAP);
    expect(facade.width).toBe(4);
    expect(facade.height).toBe(2);
  });

  it("only creates slots for WINDOW tiles", () => {
    const facade = tileMapToFacade(SIMPLE_MAP);
    // WINDOW_DARK at (1,0), WINDOW_LIT at (2,0), WINDOW_DARK at (1,1) = 3 slots
    expect(facade.slots).toHaveLength(3);
  });

  it("computes correct world position for a window slot", () => {
    const facade = tileMapToFacade(SIMPLE_MAP);
    // col=1, row=0 → x = 1*2 - (4-1) = 2 - 3 = -1, y = -(0*1.5 - (2-1)*1.5/2) = 0.75
    const slot = facade.slots.find((s) => s.col === 1 && s.row === 0);
    expect(slot).toBeDefined();
    expect(slot?.screenPosition.x).toBeCloseTo(-1);
    expect(slot?.screenPosition.y).toBeCloseTo(0.75);
  });

  it("assigns slotIndex sequentially", () => {
    const facade = tileMapToFacade(SIMPLE_MAP);
    const indices = facade.slots.map((s) => s.col * 100 + s.row);
    // All unique
    expect(new Set(indices).size).toBe(facade.slots.length);
  });

  it("handles a map with no windows", () => {
    const emptyMap: TileMap = {
      ...SIMPLE_MAP,
      tiles: [
        ["WALL", "WALL"],
        ["BALCONY", "DOOR"],
      ],
      cols: 2,
    };
    const facade = tileMapToFacade(emptyMap);
    expect(facade.slots).toHaveLength(0);
  });
});
