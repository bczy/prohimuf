import { describe, it, expect, vi } from "vitest";

/**
 * Pure, DOM-free coverage of the muzzle-flash anchor resolver
 * (Lane A, explosion-alignment fix). Locks the null-collapse contract: the
 * flash anchor is used only when the SHOOTING type entry declares a `muzzle`
 * array AND `muzzle[frame-1]` is a non-null object. Every other case (absent
 * field, null element, out-of-range frame, unknown key) returns null so
 * EnemySprite falls back to its fixed right-side offset.
 *
 * The real levelArt.json ships `muzzle` arrays for every shooting entry; the
 * JSON module is mocked here with a synthetic roster so both the field-present
 * and field-absent branches stay covered (an asset regenerated without
 * re-measured anchors legitimately has no field). Keys mirror baseFileKey():
 * normal cop variant 1 shooting => "enemy_shooting"; biker variant 1 shooting
 * => "enemy_biker_shooting".
 */
// Keep the real manifest for every other key (sizes / world / levels / courier)
// so the modules enemyTextures now transitively pulls in — levelArt.ts and
// assetManifest — still evaluate; override ONLY the enemy roster with the
// synthetic muzzle fixture.
vi.mock("@game/levels/levelArt.json", async (importOriginal) => {
  const actual = await importOriginal<{ default: Record<string, unknown> }>();
  return {
    default: {
      ...actual.default,
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
  };
});

const { muzzleFor } = await import("../enemyTextures");

describe("muzzleFor", () => {
  it("returns the anchor for a shooting frame that declares one", () => {
    expect(muzzleFor("normal", 1, 1)).toEqual({ x: 0.63, y: 0.41 });
  });

  it("returns null for a null element (frame with no anchor)", () => {
    expect(muzzleFor("normal", 1, 2)).toBeNull();
  });

  it("returns null when the entry has no `muzzle` field", () => {
    expect(muzzleFor("biker", 1, 1)).toBeNull();
  });

  it("returns null for an out-of-range frame", () => {
    expect(muzzleFor("normal", 1, 5)).toBeNull();
    expect(muzzleFor("normal", 1, 0)).toBeNull();
  });

  it("returns null for a kind whose key is absent from the roster", () => {
    // riot variant 1 shooting => "enemy_riot_shooting", not in the mock.
    expect(muzzleFor("riot", 1, 1)).toBeNull();
  });
});
