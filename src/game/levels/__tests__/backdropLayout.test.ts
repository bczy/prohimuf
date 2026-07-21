import { describe, it, expect } from "vitest";
import {
  FACADE_ASPECT,
  PANELS,
  WORLD_HEIGHT,
  getBackdropLayout,
  getLevelPanelZones,
  getWindowZones,
  computeBackdropSlots,
  computeSlotsFromZones,
  tilePanelZones,
} from "@game/levels/levelArt";
import type { WindowSlot } from "@game/types/map";

/**
 * Cross-lane contract for the backdrop layout (ADR-0048, amended ADR-0057).
 * Render + tooling build against these exact shapes:
 *   - getBackdropLayout(id) → BackdropLayout (pure geometry, all modes)
 *   - computeBackdropSlots(id, facadeH) → world WindowSlot[]
 *
 * The single-facade path MUST reproduce today's slots byte-for-byte so the
 * fixed levels (stalingrad, vitry) are provably untouched when render migrates
 * off the legacy tilePanelZones → computeSlotsFromZones chain — this block is
 * FROZEN.
 *
 * The ADR-0048 tronçon-sequence freeze is LIFTED for belliard (ADR-0057): its
 * backdrop moves from the 4-tile troncon-sequence to a single-wide opaque décor
 * baked in one plane. This file now pins the single-wide contract that lanes B
 * (render) and C (data) build against.
 */

const PANEL_WIDTH = WORLD_HEIGHT * FACADE_ASPECT;
const FACADE_H = WORLD_HEIGHT; // any positive height; geometry scales with it
const EPS = 1e-9;

/** The legacy slot pipeline getBackdropLayout must replace, byte-for-byte. */
function legacySlots(id: string, facadeH: number): WindowSlot[] {
  const zones = tilePanelZones(getLevelPanelZones(id));
  return computeSlotsFromZones(zones, PANEL_WIDTH * PANELS, facadeH);
}

describe("getBackdropLayout — single-facade parity (fixed levels)", () => {
  for (const id of ["stalingrad", "vitry"]) {
    it(`computeBackdropSlots(${id}) === legacy tilePanelZones/computeSlotsFromZones`, () => {
      const got = computeBackdropSlots(id, FACADE_H);
      const legacy = legacySlots(id, FACADE_H);

      expect(got.length).toBe(legacy.length);
      for (let i = 0; i < legacy.length; i++) {
        const a = got[i];
        const b = legacy[i];
        expect(a).toBeDefined();
        expect(b).toBeDefined();
        if (a === undefined || b === undefined) continue;
        expect(a.size).toBeDefined();
        expect(b.size).toBeDefined();
        expect(Math.abs(a.screenPosition.x - b.screenPosition.x)).toBeLessThanOrEqual(EPS);
        expect(Math.abs(a.screenPosition.y - b.screenPosition.y)).toBeLessThanOrEqual(EPS);
        expect(Math.abs((a.size?.x ?? 0) - (b.size?.x ?? 0))).toBeLessThanOrEqual(EPS);
        expect(Math.abs((a.size?.y ?? 0) - (b.size?.y ?? 0))).toBeLessThanOrEqual(EPS);
      }
    });

    it(`getBackdropLayout(${id}) is single-facade with PANELS facade tiles`, () => {
      const layout = getBackdropLayout(id);
      expect(layout.mode).toBe("single-facade");
      expect(layout.tiles.length).toBe(PANELS);
      expect(layout.fullW).toBeCloseTo(PANEL_WIDTH * PANELS, 12);
      for (const tile of layout.tiles) {
        expect(tile.file).toBe("facade");
        expect(tile.width).toBe(PANEL_WIDTH);
      }
    });
  }
});

describe("getBackdropLayout — belliard single-wide (ADR-0057)", () => {
  // Native aspect of street-wide.png (image width/height) = 6418/1248, rounded to
  // 4 decimals per the manifest convention (cf. troncon aspects 1.6491, 1.9224…).
  // This is the frozen contract value lane C must set EXACTLY in the belliard
  // manifest so getBackdropLayout("belliard").tiles[0].width matches byte-for-byte.
  const ASPECT = 5.1426; // = round(6418/1248, 4)
  const WIDTH = WORLD_HEIGHT * ASPECT;

  it("is single-wide with exactly one street-wide tile", () => {
    const layout = getBackdropLayout("belliard");
    expect(layout.mode).toBe("single-wide");
    expect(layout.tiles.length).toBe(1);
    const tile = layout.tiles[0];
    expect(tile).toBeDefined();
    if (tile === undefined) return;
    expect(tile.file).toBe("street-wide");
    expect(tile.width).toBe(WORLD_HEIGHT * ASPECT);
    expect(tile.centreX).toBe(0);
  });

  it("fullW equals the single tile's width, centred on the origin", () => {
    const layout = getBackdropLayout("belliard");
    expect(layout.fullW).toBe(WIDTH);
    const tile = layout.tiles[0];
    if (tile === undefined) return;
    expect(layout.fullW).toBe(tile.width);
    // Left edge -fullW/2, right edge +fullW/2, symmetric about x=0.
    expect(tile.centreX - tile.width / 2).toBeCloseTo(-WIDTH / 2, 12);
    expect(tile.centreX + tile.width / 2).toBeCloseTo(WIDTH / 2, 12);
  });

  it("carries the level's window zones and emits one slot per zone", () => {
    // The single opaque image carries getWindowZones("belliard") (fed by the
    // manifest `belliard.windows`, lane C) — one continuous set, no per-tile split.
    const layout = getBackdropLayout("belliard");
    const zones = getWindowZones("belliard");
    expect(zones.length).toBeGreaterThan(0);
    const tile = layout.tiles[0];
    if (tile === undefined) return;
    expect(tile.zones.length).toBe(zones.length);

    // computeBackdropSlots yields exactly one slot per zone.
    const slots = computeBackdropSlots("belliard", FACADE_H);
    expect(slots.length).toBe(zones.length);
  });
});
