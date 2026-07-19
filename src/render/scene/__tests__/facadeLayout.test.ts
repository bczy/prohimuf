import { describe, it, expect } from "vitest";
import {
  BLEND,
  FACADE_DRAW_SCALE,
  applyFacadeStretchX,
  backdropPanes,
  facadeDrawScale,
  invertFacadeStretchX,
  stretchAboutCentre,
} from "../facadeLayout";
import { getBackdropLayout } from "@game/levels/levelArt";

/**
 * Pure, DOM-free coverage of the facade intra-panel stretch (ADR-0028 cycle 3).
 * These lock the on-screen railing/slot alignment fix: the render maps enemy
 * slots and railings through `applyFacadeStretchX`, and the harness reader
 * un-maps them through `invertFacadeStretchX`, so the two MUST be exact inverses
 * or the harness (art-space) and the screen would disagree.
 */
describe("facadeLayout stretch", () => {
  const panels = 4;
  const panelW = 10;
  // Panel p's centre in world space (panels tile centred on the origin).
  const centreOf = (p: number): number => (p - (panels - 1) / 2) * panelW;

  it("scale constant matches the seam-crossfade overlap", () => {
    expect(FACADE_DRAW_SCALE).toBeCloseTo(1 + BLEND, 12);
    expect(BLEND).toBeCloseTo(0.08, 12);
  });

  it("is identity at each panel centre (offset 0 ⇒ nothing to stretch)", () => {
    for (let p = 0; p < panels; p++) {
      const centre = centreOf(p);
      expect(applyFacadeStretchX(centre, panelW, panels)).toBeCloseTo(centre, 12);
      expect(invertFacadeStretchX(centre, panelW, panels)).toBeCloseTo(centre, 12);
    }
  });

  it("round-trips apply∘invert to identity across panels and local positions", () => {
    // Local positions kept inside (0.037, 0.963) so the stretch never crosses a
    // nominal panel boundary — the domain the committed zones actually occupy.
    const locals = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
    for (let p = 0; p < panels; p++) {
      for (const u of locals) {
        const worldX = centreOf(p) + (u - 0.5) * panelW;
        const roundTrip = invertFacadeStretchX(
          applyFacadeStretchX(worldX, panelW, panels),
          panelW,
          panels,
        );
        expect(roundTrip).toBeCloseTo(worldX, 10);
        // And the other order too (invert then apply).
        const roundTrip2 = applyFacadeStretchX(
          invertFacadeStretchX(worldX, panelW, panels),
          panelW,
          panels,
        );
        expect(roundTrip2).toBeCloseTo(worldX, 10);
      }
    }
  });

  it("stretch magnitude at a panel edge is exactly 0.04·panelW", () => {
    // Left edge (u=0) of an interior panel classifies cleanly as that panel;
    // its displacement is |−0.5·panelW|·BLEND = 0.5·0.08·panelW = 0.04·panelW.
    for (let p = 1; p < panels; p++) {
      const leftEdge = centreOf(p) - 0.5 * panelW;
      const stretched = applyFacadeStretchX(leftEdge, panelW, panels);
      expect(Math.abs(stretched - leftEdge)).toBeCloseTo(0.04 * panelW, 10);
    }
  });
});

/**
 * ADR-0048: the per-tile stretch primitive + the mode → draw-scale rule. These
 * lock that the mode-agnostic `stretchAboutCentre` reproduces the fixed panel
 * stretch exactly (single-facade non-regression) and collapses to the identity
 * for the tronçon tiles.
 */
describe("stretchAboutCentre / facadeDrawScale (ADR-0048)", () => {
  const panels = 4;
  const panelW = 10;
  const centreOf = (p: number): number => (p - (panels - 1) / 2) * panelW;

  it("facadeDrawScale is FACADE_DRAW_SCALE for single-facade, 1 for troncon", () => {
    expect(facadeDrawScale("single-facade")).toBeCloseTo(FACADE_DRAW_SCALE, 12);
    expect(facadeDrawScale("troncon-sequence")).toBe(1);
  });

  it("is the identity at draw-scale 1 (tronçon tiles never stretch)", () => {
    // Exact at the tile centre (offset 0 ⇒ nothing to scale); the identity up to
    // FP rounding everywhere else — a tronçon tile's slots sit at their art x.
    for (const centreX of [-30, -10, 0, 12.5, 40]) {
      expect(stretchAboutCentre(centreX, centreX, 1)).toBe(centreX);
      for (const worldX of [-17, -3.2, 0, 4.8, 21]) {
        expect(stretchAboutCentre(worldX, centreX, 1)).toBeCloseTo(worldX, 12);
      }
    }
  });

  it("reproduces applyFacadeStretchX exactly for single-facade panels", () => {
    const locals = [0.1, 0.25, 0.5, 0.75, 0.9];
    for (let p = 0; p < panels; p++) {
      for (const u of locals) {
        const worldX = centreOf(p) + (u - 0.5) * panelW;
        const viaGeneral = stretchAboutCentre(worldX, centreOf(p), FACADE_DRAW_SCALE);
        const viaPanel = applyFacadeStretchX(worldX, panelW, panels);
        expect(viaGeneral).toBeCloseTo(viaPanel, 12);
      }
    }
  });
});

/**
 * ADR-0048: the render-side plane list (`backdropPanes`). Asserts the tronçon
 * tiling (one native-width, un-feathered pane per tile at its centreX) AND that
 * the single-facade path is unchanged (1+BLEND stretch, feather on every interior
 * panel), off the FROZEN `getBackdropLayout` geometry.
 */
describe("backdropPanes (ADR-0048)", () => {
  it("single-facade (stalingrad): PANELS stretched, feathered panes", () => {
    const layout = getBackdropLayout("stalingrad");
    const panes = backdropPanes(layout);
    expect(panes.length).toBe(layout.tiles.length);
    panes.forEach((pane, i) => {
      const tile = layout.tiles[i];
      expect(tile).toBeDefined();
      if (tile === undefined) return;
      expect(pane.file).toBe("facade");
      expect(pane.centreX).toBe(tile.centreX);
      expect(pane.width).toBe(tile.width);
      expect(pane.drawScale).toBeCloseTo(FACADE_DRAW_SCALE, 12);
      // Feather every panel after the first (the interior seams crossfade).
      expect(pane.feather).toBe(i > 0);
    });
  });

  it("troncon-sequence (belliard): one native-width, un-feathered pane per tile", () => {
    const layout = getBackdropLayout("belliard");
    const panes = backdropPanes(layout);
    // Plane count == tiles.length; the declared file sequence, in order.
    expect(panes.length).toBe(layout.tiles.length);
    expect(panes.map((p) => p.file)).toEqual(["troncon-a", "troncon-c", "troncon-b", "troncon-c"]);
    panes.forEach((pane, i) => {
      const tile = layout.tiles[i];
      expect(tile).toBeDefined();
      if (tile === undefined) return;
      // Positioned at the tile centreX, native width — NO stretch, NO feather.
      expect(pane.centreX).toBe(tile.centreX);
      expect(pane.width).toBe(tile.width);
      expect(pane.drawScale).toBe(1);
      expect(pane.feather).toBe(false);
    });
  });
});
