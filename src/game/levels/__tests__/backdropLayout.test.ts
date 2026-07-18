import { describe, it, expect } from "vitest";
import {
  FACADE_ASPECT,
  PANELS,
  WORLD_HEIGHT,
  TRONCON_GAP,
  getBackdropLayout,
  getLevelPanelZones,
  getWindowZones,
  computeBackdropSlots,
  computeSlotsFromZones,
  tilePanelZones,
} from "@game/levels/levelArt";
import type { WindowSlot } from "@game/types/map";

/**
 * FROZEN cross-lane contract for ADR-0046 (troncon-sequence backdrop mode).
 * Render + tooling build against these exact shapes:
 *   - getBackdropLayout(id) → BackdropLayout (pure geometry, both modes)
 *   - computeBackdropSlots(id, facadeH) → world WindowSlot[]
 *
 * The single-facade path MUST reproduce today's slots byte-for-byte so the
 * fixed levels (stalingrad, vitry) are provably untouched when render migrates
 * off the legacy tilePanelZones → computeSlotsFromZones chain.
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

describe("getBackdropLayout — belliard troncon-sequence geometry", () => {
  // Manifest sequence: troncon-a, troncon-c, troncon-b, troncon-c (padded aspects).
  const ASPECTS = [1.6491, 1.9224, 1.7857, 1.9224];
  const WIDTHS = ASPECTS.map((a) => WORLD_HEIGHT * a);
  const WIDTHS_SUM = WIDTHS.reduce((s, w) => s + w, 0);
  // fullW includes a TRONCON_GAP sky gap between each adjacent pair (n-1 gaps).
  const FULL_W = WIDTHS_SUM + TRONCON_GAP * (WIDTHS.length - 1);

  it("emits 4 variable-width tiles with the declared file sequence", () => {
    const layout = getBackdropLayout("belliard");
    expect(layout.mode).toBe("troncon-sequence");
    expect(layout.tiles.map((t) => t.file)).toEqual([
      "troncon-a",
      "troncon-c",
      "troncon-b",
      "troncon-c",
    ]);
    expect(layout.tiles.map((t) => t.width)).toEqual(WIDTHS);
  });

  it("sums tile widths + inter-tile gaps to fullW", () => {
    const layout = getBackdropLayout("belliard");
    expect(layout.fullW).toBeCloseTo(FULL_W, 12);
    expect(layout.fullW).toBeCloseTo(WIDTHS_SUM + TRONCON_GAP * 3, 6);
  });

  it("places centreX cumulatively and symmetrically about the origin", () => {
    const layout = getBackdropLayout("belliard");
    const tiles = layout.tiles;

    // First tile's left edge is -fullW/2, last tile's right edge is +fullW/2.
    const first = tiles[0];
    const last = tiles[tiles.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    if (first === undefined || last === undefined) return;
    expect(first.centreX - first.width / 2).toBeCloseTo(-FULL_W / 2, 12);
    expect(last.centreX + last.width / 2).toBeCloseTo(FULL_W / 2, 12);

    // Tiles are separated by exactly one TRONCON_GAP of sky:
    // tile_{i+1} left edge − tile_i right edge == TRONCON_GAP.
    for (let i = 0; i < tiles.length - 1; i++) {
      const cur = tiles[i];
      const next = tiles[i + 1];
      if (cur === undefined || next === undefined) continue;
      const rightEdge = cur.centreX + cur.width / 2;
      const leftEdge = next.centreX - next.width / 2;
      expect(Math.abs(leftEdge - rightEdge - TRONCON_GAP)).toBeLessThanOrEqual(EPS);
    }
  });

  it("fallback: with no per-tronçon generated zones, every tile still has zones", () => {
    // Phase-1: the `belliard/troncon-*` generated keys do not exist yet, so each
    // tile falls back to getWindowZones("belliard") — the game must stay playable.
    const layout = getBackdropLayout("belliard");
    const fallback = getWindowZones("belliard");
    expect(fallback.length).toBeGreaterThan(0);
    for (const tile of layout.tiles) {
      expect(tile.zones.length).toBeGreaterThan(0);
    }
    // computeBackdropSlots yields one slot per zone across all tiles.
    const slots = computeBackdropSlots("belliard", FACADE_H);
    const zoneTotal = layout.tiles.reduce((s, t) => s + t.zones.length, 0);
    expect(slots.length).toBe(zoneTotal);
  });
});
