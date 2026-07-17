import { describe, it, expect } from "vitest";
import { deriveCrtParams } from "../crtParams";
import type { CrtParams, CrtTier } from "../crtParams";

/**
 * Pure, Three-free assertion of the CRT param derivation (ADR-0031 / art §8.2):
 * (1) the lite (mobile) tier is never more expensive than full, (2) reduced
 * motion zeroes both animated amplitudes, and (3) every constant sits in a sane,
 * on-brief range. The qualitative look (bloom quality, hue preservation, halo
 * falloff, no-strobe feel) is verify-skill territory, not asserted here.
 */

const TIERS: readonly CrtTier[] = ["full", "lite"];

describe("deriveCrtParams — perf tiers", () => {
  it("lite never costs more than full (cheaper res + tighter blur radius)", () => {
    const full = deriveCrtParams("full", false);
    const lite = deriveCrtParams("lite", false);
    expect(lite.resScale).toBeLessThanOrEqual(full.resScale);
    expect(lite.bloomRadiusPx).toBeLessThanOrEqual(full.bloomRadiusPx);
  });

  it("keeps the static look identical across tiers (only perf levers differ)", () => {
    const full = deriveCrtParams("full", false);
    const lite = deriveCrtParams("lite", false);
    expect(lite.scanlineDarkening).toBe(full.scanlineDarkening);
    expect(lite.vignetteStrength).toBe(full.vignetteStrength);
    expect(lite.bloomThreshold).toBe(full.bloomThreshold);
    expect(lite.bloomBrightness).toBe(full.bloomBrightness);
  });
});

describe("deriveCrtParams — reduced-motion gate (P6)", () => {
  it.each(TIERS)("zeroes grain AND flicker amplitude for tier %s", (tier) => {
    const p = deriveCrtParams(tier, true);
    expect(p.grainOpacity).toBe(0);
    expect(p.flickerAmplitude).toBe(0);
  });

  it.each(TIERS)("keeps the static ingredients present for tier %s", (tier) => {
    const p = deriveCrtParams(tier, true);
    // Static scanline/vignette/bloom survive reduced motion; only animation stops.
    expect(p.scanlineDarkening).toBeGreaterThan(0);
    expect(p.vignetteStrength).toBeGreaterThan(0);
    expect(p.bloomThreshold).toBeGreaterThan(0);
    expect(p.bloomBrightness).toBeGreaterThan(0);
    expect(p.bloomRadiusPx).toBeGreaterThan(0);
  });

  it.each(TIERS)("has non-zero grain and flicker when motion is allowed (%s)", (tier) => {
    const p = deriveCrtParams(tier, false);
    expect(p.grainOpacity).toBeGreaterThan(0);
    expect(p.flickerAmplitude).toBeGreaterThan(0);
  });
});

describe("deriveCrtParams — sane ranges (§8.2 intensities)", () => {
  const inRange = (v: number, lo: number, hi: number): boolean => v >= lo && v <= hi;

  function assertRanges(p: CrtParams): void {
    // Saturation key strictly inside (0,1): 0 would bloom everything, 1 nothing.
    expect(inRange(p.bloomThreshold, 0.05, 0.95)).toBe(true);
    // Brightness key strictly inside (0,1): ANDed with saturation, gates the glow.
    expect(inRange(p.bloomBrightness, 0.05, 0.95)).toBe(true);
    // 1–2 sprite-pixel halo — a small radius, never a cinematic pyramid.
    expect(inRange(p.bloomRadiusPx, 0.5, 4)).toBe(true);
    // Clearly visible scanline comb trough (the CRT tell, tuned to 0.55 after playtest).
    expect(inRange(p.scanlineDarkening, 0.05, 0.6)).toBe(true);
    // "corners maybe 10–15% darker".
    expect(inRange(p.vignetteStrength, 0.05, 0.2)).toBe(true);
    // Fine, low-opacity toner speckle (0 allowed under reduced motion).
    expect(inRange(p.grainOpacity, 0, 0.15)).toBe(true);
    // Single-digit % breathe, never a strobe (0 allowed under reduced motion).
    expect(inRange(p.flickerAmplitude, 0, 0.1)).toBe(true);
    // Bright/blur run below full framebuffer res.
    expect(inRange(p.resScale, 0.1, 1)).toBe(true);
  }

  it.each(TIERS)("keeps every constant on-brief for tier %s (motion on)", (tier) => {
    assertRanges(deriveCrtParams(tier, false));
  });

  it.each(TIERS)("keeps every constant on-brief for tier %s (reduced motion)", (tier) => {
    assertRanges(deriveCrtParams(tier, true));
  });
});
