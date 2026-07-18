import { describe, expect, it } from "vitest";
import { WORLD_HEIGHT, type WindowZone } from "@game/levels/levelArt";
import {
  deriveNearParallaxFactor,
  nearForegroundBandTop,
  MOBILE_PARALLAX_SCALE,
  NEAR_BAND_MARGIN,
} from "../nearParallax";

describe("deriveNearParallaxFactor", () => {
  it("clamps the layer to the facade (0) under reduced motion", () => {
    expect(deriveNearParallaxFactor(-0.2, true)).toBe(0);
    expect(deriveNearParallaxFactor(-0.3, true)).toBe(0);
  });

  it("passes the (core-clamped, negative) factor through untouched on desktop", () => {
    expect(deriveNearParallaxFactor(-0.2, false)).toBe(-0.2);
    expect(deriveNearParallaxFactor(-0.24, false)).toBe(-0.24);
  });

  it("caps the mobile amplitude at 0.7× desktop (UX D9.4)", () => {
    expect(deriveNearParallaxFactor(-0.24, false, true)).toBeCloseTo(-0.24 * 0.7, 10);
    expect(deriveNearParallaxFactor(-0.3, false, true)).toBeCloseTo(
      -0.3 * MOBILE_PARALLAX_SCALE,
      10,
    );
    // Stalingrad's -0.24 on mobile must land under 0.7 × desktop cap (0.30).
    expect(Math.abs(deriveNearParallaxFactor(-0.24, false, true))).toBeLessThanOrEqual(0.7 * 0.3);
  });

  it("reduced motion overrides mobile scaling (still 0)", () => {
    expect(deriveNearParallaxFactor(-0.24, true, true)).toBe(0);
  });
});

describe("nearForegroundBandTop", () => {
  // Belliard-like three-row grid (y-down, facade-normalized): the lowest row
  // sits at y=0.48 with h=0.16, so its bottom edge is 0.56.
  const zones: readonly WindowZone[] = [
    { x: 0.085, y: 0.19, w: 0.085, h: 0.16 },
    { x: 0.35, y: 0.335, w: 0.085, h: 0.16 },
    { x: 0.63, y: 0.48, w: 0.085, h: 0.16 },
  ];

  it("places the band top a fixed margin below the lowest window bottom", () => {
    expect(nearForegroundBandTop(zones)).toBeCloseTo(0.48 + 0.16 / 2 + NEAR_BAND_MARGIN, 10);
  });

  it("uses the spec-gated 0.8 world-unit clearance (D1.2/AC1)", () => {
    // The margin is normalized against the facade height, so the world-space
    // clearance below the lowest window must equal the gated 0.8 units.
    expect(NEAR_BAND_MARGIN * WORLD_HEIGHT).toBeCloseTo(0.8, 10);
  });

  it("keeps the band top strictly BELOW every window row (non-occlusion invariant)", () => {
    const top = nearForegroundBandTop(zones);
    for (const z of zones) {
      // y-down: a larger normalized y is lower on the facade. The band top must
      // be below (greater than) every window's bottom edge, so no object plane
      // whose top sits at/under `top` can ever ride up into a window/cop slot.
      expect(top).toBeGreaterThan(z.y + z.h / 2);
    }
  });

  it("returns a safe lower-half fallback when a level declares no zones", () => {
    expect(nearForegroundBandTop([])).toBeGreaterThan(0.5);
  });
});
