import { describe, it, expect } from "vitest";
import { buildingIronStyle, clusterZonesByBuilding, type IronZone } from "../foregroundArt";
import type { IronworkStyle } from "@game/levels/levelArt";

/**
 * Per-building ironwork variation (render-side, no game-data change). These lock
 * the two pure primitives the drawing path leans on: clustering a tile's zones
 * into buildings by x-gap, and the deterministic per-building style assignment.
 */

const zone = (x: number): IronZone => ({ x, y: 0.5, w: 0.05, h: 0.1 });

describe("clusterZonesByBuilding", () => {
  it("splits on a gap wider than the threshold, keeps a tight run together", () => {
    // Two buildings: a tight run near the left, a wide sky gap, then a second run.
    const zones = [
      zone(0.08),
      zone(0.14),
      zone(0.2),
      zone(0.6), // 0.4 gap → new building
      zone(0.66),
      zone(0.72),
    ];
    const clusters = clusterZonesByBuilding(zones);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toHaveLength(3);
    expect(clusters[1]).toHaveLength(3);
  });

  it("returns ORIGINAL indices (into the input), left→right by x", () => {
    // Input order is scrambled; clustering sorts by x but yields source indices.
    const zones = [zone(0.7), zone(0.1), zone(0.72), zone(0.16)];
    const clusters = clusterZonesByBuilding(zones);
    expect(clusters).toEqual([
      [1, 3], // x = 0.1, 0.16
      [0, 2], // x = 0.7, 0.72
    ]);
  });

  it("keeps a regularly-fenestrated facade as ONE building (gaps below threshold)", () => {
    const zones = [zone(0.1), zone(0.16), zone(0.22), zone(0.28), zone(0.34)];
    expect(clusterZonesByBuilding(zones)).toHaveLength(1);
  });

  it("a gap exactly at the threshold does NOT split (strict >)", () => {
    const zones = [zone(0.1), zone(0.19)]; // gap 0.09 == default threshold
    expect(clusterZonesByBuilding(zones, 0.09)).toHaveLength(1);
  });

  it("handles empty and singleton inputs", () => {
    expect(clusterZonesByBuilding([])).toEqual([]);
    expect(clusterZonesByBuilding([zone(0.3)])).toEqual([[0]]);
  });
});

describe("buildingIronStyle", () => {
  const wroughtIron: readonly IronworkStyle[] = ["haussmann", "artdeco", "croix", "plain"];

  it("is deterministic (stable across calls / mounts)", () => {
    for (let t = 0; t < 4; t++) {
      for (let b = 0; b < 6; b++) {
        expect(buildingIronStyle("haussmann", t, b)).toBe(buildingIronStyle("haussmann", t, b));
      }
    }
  });

  it("only ever returns wrought-iron styles (never the concrete hlm parapet)", () => {
    for (let t = 0; t < 5; t++) {
      for (let b = 0; b < 8; b++) {
        expect(wroughtIron).toContain(buildingIronStyle("haussmann", t, b));
      }
    }
  });

  it("gives consecutive buildings of a tile visibly different styles", () => {
    for (let t = 0; t < 5; t++) {
      for (let b = 0; b < 7; b++) {
        expect(buildingIronStyle("haussmann", t, b)).not.toBe(
          buildingIronStyle("haussmann", t, b + 1),
        );
      }
    }
  });

  it("falls back cleanly for a level style outside the rotation (hlm)", () => {
    // hlm is not in the wrought-iron rotation; base index falls back to 0, so the
    // assignment stays well-defined and in-palette.
    expect(wroughtIron).toContain(buildingIronStyle("hlm", 0, 0));
  });
});
