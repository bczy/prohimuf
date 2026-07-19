import { describe, it, expect, vi, afterEach } from "vitest";
import type { NearForegroundKind } from "@game/levels/levelArt";
import type * as LevelArt from "@game/levels/levelArt";

/**
 * The ADR-0049 game/render seam: typed accessors over the `nearForegroundArt` JSON
 * block, source-hardened like {@link getNearForeground}. The block is written by the
 * tooling lane and may be ABSENT while render builds, so every accessor must degrade
 * to null (render then keeps its procedural fallback). Both states are exercised by
 * MOCKING the JSON module (delete vs inject the block) so the suite is green whether
 * or not the real manifest carries the block yet.
 */

const KINDS: readonly NearForegroundKind[] = [
  "parkingMeter",
  "lamppost",
  "wallaceFountain",
  "trafficLight",
  "bollard",
  "scooter",
  "bench",
  "streetSign",
];

const LENSES = {
  vehicle: [
    { x: 0.29, y: 0.1, rx: 0.11, ry: 0.035 },
    { x: 0.29, y: 0.24, rx: 0.11, ry: 0.035 },
    { x: 0.29, y: 0.38, rx: 0.11, ry: 0.035 },
  ],
  ped: [
    { x: 0.34, y: 0.62, rx: 0.14, ry: 0.05 },
    { x: 0.34, y: 0.8, rx: 0.14, ry: 0.05 },
  ],
};

afterEach(() => {
  vi.doUnmock("@game/levels/levelArt.json");
  vi.resetModules();
});

/** Re-import levelArt with the JSON `nearForegroundArt` block deleted. */
async function importWithoutBlock(): Promise<typeof LevelArt> {
  vi.resetModules();
  vi.doMock("@game/levels/levelArt.json", async (importOriginal) => {
    const actual = await importOriginal<{ default: Record<string, unknown> }>();
    const copy = { ...actual.default };
    delete copy.nearForegroundArt;
    return { default: copy };
  });
  return import("@game/levels/levelArt");
}

/** Re-import levelArt with an injected `nearForegroundArt` block. */
async function importWithBlock(types: Record<string, unknown>): Promise<typeof LevelArt> {
  vi.resetModules();
  vi.doMock("@game/levels/levelArt.json", async (importOriginal) => {
    const actual = await importOriginal<{ default: Record<string, unknown> }>();
    return { default: { ...actual.default, nearForegroundArt: { types } } };
  });
  return import("@game/levels/levelArt");
}

describe("nearForegroundArt accessors — block ABSENT", () => {
  it("nearForegroundArtAsset returns null for every kind", async () => {
    const m = await importWithoutBlock();
    for (const kind of KINDS) {
      expect(m.nearForegroundArtAsset(kind), kind).toBeNull();
    }
  });

  it("trafficLightLenses returns null", async () => {
    const m = await importWithoutBlock();
    expect(m.trafficLightLenses()).toBeNull();
  });
});

describe("nearForegroundArt accessors — block PRESENT", () => {
  it("returns the declared asset path, null for a kind absent from the block", async () => {
    const m = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 6104,
        prompt: "x",
        lenses: LENSES,
      },
      bench: {
        asset: "assets/nearfg/bench.png",
        size: { width: 870, height: 512 },
        seed: 6107,
        prompt: "x",
      },
    });
    expect(m.nearForegroundArtAsset("trafficLight")).toBe("assets/nearfg/trafficLight.png");
    expect(m.nearForegroundArtAsset("bench")).toBe("assets/nearfg/bench.png");
    expect(m.nearForegroundArtAsset("scooter")).toBeNull();
  });

  it("returns null asset for an empty/non-string path (source-hardened)", async () => {
    const m = await importWithBlock({
      bench: { asset: "", size: { width: 870, height: 512 }, seed: 1, prompt: "x" },
      scooter: { asset: 42, size: { width: 768, height: 512 }, seed: 1, prompt: "x" },
    });
    expect(m.nearForegroundArtAsset("bench")).toBeNull();
    expect(m.nearForegroundArtAsset("scooter")).toBeNull();
  });

  it("returns the validated 3+2 lens anchors when well-formed", async () => {
    const m = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
        lenses: LENSES,
      },
    });
    const lenses = m.trafficLightLenses();
    expect(lenses).not.toBeNull();
    expect(lenses?.vehicle).toHaveLength(3);
    expect(lenses?.ped).toHaveLength(2);
    expect(lenses?.vehicle[0]).toEqual({ x: 0.29, y: 0.1, rx: 0.11, ry: 0.035 });
    expect(lenses?.ped[1]).toEqual({ x: 0.34, y: 0.8, rx: 0.14, ry: 0.05 });
  });

  it("returns null lenses when the block has no lenses, or they are malformed", async () => {
    const noLenses = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
      },
    });
    expect(noLenses.trafficLightLenses()).toBeNull();

    const shortArrays = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
        lenses: { vehicle: [{ x: 0.29, y: 0.1, rx: 0.11, ry: 0.035 }], ped: [] },
      },
    });
    expect(shortArrays.trafficLightLenses()).toBeNull();

    const nonFinite = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
        lenses: {
          vehicle: [
            { x: Number.NaN, y: 0.1, rx: 0.11, ry: 0.035 },
            { x: 0.29, y: 0.24, rx: 0.11, ry: 0.035 },
            { x: 0.29, y: 0.38, rx: 0.11, ry: 0.035 },
          ],
          ped: LENSES.ped,
        },
      },
    });
    expect(nonFinite.trafficLightLenses()).toBeNull();
  });

  it('returns null when "lenses" is JSON null (no TypeError in the repaint path)', async () => {
    const m = await importWithBlock({
      trafficLight: { asset: "assets/nearfg/trafficLight.png", size: { width: 226, height: 512 }, seed: 1, prompt: "x", lenses: null },
    });
    expect(m.trafficLightLenses()).toBeNull();
  });

  it("returns null when an anchor has a zero or negative radius (no IndexSizeError)", async () => {
    const zeroRadius = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
        lenses: {
          vehicle: [
            { x: 0.29, y: 0.1, rx: 0, ry: 0.035 },
            { x: 0.29, y: 0.24, rx: 0.11, ry: 0.035 },
            { x: 0.29, y: 0.38, rx: 0.11, ry: 0.035 },
          ],
          ped: LENSES.ped,
        },
      },
    });
    expect(zeroRadius.trafficLightLenses()).toBeNull();

    const negativeRadius = await importWithBlock({
      trafficLight: {
        asset: "assets/nearfg/trafficLight.png",
        size: { width: 226, height: 512 },
        seed: 1,
        prompt: "x",
        lenses: {
          vehicle: LENSES.vehicle,
          ped: [
            { x: 0.34, y: 0.62, rx: 0.14, ry: -0.05 },
            { x: 0.34, y: 0.8, rx: 0.14, ry: 0.05 },
          ],
        },
      },
    });
    expect(negativeRadius.trafficLightLenses()).toBeNull();
  });
});
