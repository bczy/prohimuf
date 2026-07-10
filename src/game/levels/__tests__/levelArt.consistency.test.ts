import { describe, it, expect } from "vitest";
import { LEVELS } from "@game/levels/levels";
import { PRE_LEVEL_NARRATIVE, POST_LEVEL_NARRATIVE } from "@game/systems/narrativeSystem";
import manifest from "../levelArt.json";

/**
 * Cross-lane contract: keep the gameplay level list (levels.ts), the art
 * manifest (levelArt.json) and the narrative data (narrativeSystem.ts) in sync.
 * A level added to one but not the others — or a delivery pointing at a vehicle
 * archetype the manifest never declares — would break silently in the built
 * game; these assertions turn that into a failing unit test.
 */
describe("levelArt.json ↔ levels.ts ↔ narrative consistency", () => {
  it("declares the exact same level ids + names, in the same order", () => {
    const codeLevels = LEVELS.map((l) => ({ id: l.id, name: l.name }));
    const artLevels = manifest.levels.map((l) => ({ id: l.id, name: l.name }));
    expect(codeLevels).toEqual(artLevels);
  });

  it("only defines narrative for known level ids (keys ⊆ level ids)", () => {
    const levelIds = new Set(LEVELS.map((l) => l.id));
    for (const key of Object.keys(PRE_LEVEL_NARRATIVE)) {
      expect(levelIds.has(key)).toBe(true);
    }
    for (const key of Object.keys(POST_LEVEL_NARRATIVE)) {
      expect(levelIds.has(key)).toBe(true);
    }
  });

  it("every scripted delivery uses a vehicleType the manifest declares", () => {
    const vehicleTypes = new Set(Object.keys(manifest.vehicles.types));
    for (const level of LEVELS) {
      for (const delivery of level.deliveries) {
        expect(vehicleTypes.has(delivery.vehicleType)).toBe(true);
      }
    }
  });

  it("every vehicle asset path is non-empty and unique", () => {
    const assets = Object.values(manifest.vehicles.types).map((v) => v.asset);
    for (const asset of assets) {
      expect(asset.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(assets).size).toBe(assets.length);
  });
});
