import { describe, it, expect, vi } from "vitest";

/**
 * Pure, DOM-free coverage of the muzzle-flash anchor resolver
 * (Lane A, explosion-alignment fix). Locks the null-collapse contract: the flash
 * anchor is used only when the enemy is shooting AND its type entry declares a
 * `muzzle` array AND `muzzle[frame-1]` is a non-null object. Every other case
 * (non-shooting, absent field, null element, out-of-range frame, unknown key)
 * returns null so EnemySprite falls back to its fixed right-side offset.
 *
 * levelArt.json does not ship the `muzzle` field yet, so the JSON module is
 * mocked with a synthetic roster covering both the field-present and
 * field-absent branches. Keys mirror baseFileKey(): normal cop variant 1 while
 * shooting => "enemy_shooting"; biker variant 1 shooting => "enemy_biker_shooting".
 */
vi.mock("@game/levels/levelArt.json", () => ({
  default: {
    enemies: {
      fps: 6,
      types: {
        // Field present: frame 1 anchored, frame 2 explicitly null.
        enemy_shooting: {
          frames: ["", "recoil"],
          muzzle: [{ x: 0.63, y: 0.41 }, null],
        },
        // Field absent: shooting entry with no `muzzle` key at all.
        enemy_biker_shooting: {
          frames: ["", "recoil"],
        },
      },
    },
  },
}));

const { muzzleFor } = await import("../enemyTextures");

describe("muzzleFor", () => {
  it("returns the anchor for a shooting frame that declares one", () => {
    expect(muzzleFor("normal", 1, true, 1)).toEqual({ x: 0.63, y: 0.41 });
  });

  it("returns null for a null element (frame with no anchor)", () => {
    expect(muzzleFor("normal", 1, true, 2)).toBeNull();
  });

  it("returns null when the entry has no `muzzle` field", () => {
    expect(muzzleFor("biker", 1, true, 1)).toBeNull();
  });

  it("returns null when not shooting, even if an anchor exists", () => {
    expect(muzzleFor("normal", 1, false, 1)).toBeNull();
  });

  it("returns null for an out-of-range frame", () => {
    expect(muzzleFor("normal", 1, true, 5)).toBeNull();
    expect(muzzleFor("normal", 1, true, 0)).toBeNull();
  });

  it("returns null for a kind whose key is absent from the roster", () => {
    // riot variant 1 shooting => "enemy_riot_shooting", not in the mock.
    expect(muzzleFor("riot", 1, true, 1)).toBeNull();
  });
});
