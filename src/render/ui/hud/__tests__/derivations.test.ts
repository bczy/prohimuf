import { describe, it, expect } from "vitest";
import { weaponGlyph, isLowStock, LOW_STOCK_FRACTION } from "../derivations";
import { WEAPON_SPECS } from "@game/types/weapon";

/**
 * Pure regression lock for the weapon-readout view mapping (ADR-0052 §6.2). These are
 * render-side derivations, NOT game rules: `weaponGlyph` is the A/B/C picto (design §1)
 * and `isLowStock` is the fuel-gauge blink threshold — the 0.2 ratio is a HUD constant,
 * but the DENOMINATOR is read from the game's `WEAPON_SPECS`, never copied, so the tests
 * assert against that single source.
 */
describe("weaponGlyph", () => {
  it("maps each weapon kind to its roster glyph (A/B/C)", () => {
    expect(weaponGlyph("base")).toBe("A");
    expect(weaponGlyph("auto")).toBe("B");
    expect(weaponGlyph("spread")).toBe("C");
  });
});

describe("isLowStock", () => {
  it("never warns for the base weapon (∞ stock, W4/AC11)", () => {
    expect(isLowStock("base", 0)).toBe(false);
    expect(isLowStock("base", Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("blinks a special in the last ~20 % of its start stock", () => {
    for (const kind of ["auto", "spread"] as const) {
      const start = WEAPON_SPECS[kind].startStock;
      const threshold = start * LOW_STOCK_FRACTION;
      expect(isLowStock(kind, threshold)).toBe(true); // exactly at the boundary
      expect(isLowStock(kind, threshold - 1)).toBe(true);
      expect(isLowStock(kind, threshold + 1)).toBe(false);
      expect(isLowStock(kind, start)).toBe(false); // full stock never blinks
      expect(isLowStock(kind, 0)).toBe(true); // empty is in the warning zone
    }
  });

  it("keeps the threshold ratio at the documented 0.2", () => {
    expect(LOW_STOCK_FRACTION).toBe(0.2);
  });
});
