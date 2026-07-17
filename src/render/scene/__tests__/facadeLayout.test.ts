import { describe, it, expect } from "vitest";
import {
  BLEND,
  FACADE_DRAW_SCALE,
  applyFacadeStretchX,
  invertFacadeStretchX,
} from "../facadeLayout";

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
