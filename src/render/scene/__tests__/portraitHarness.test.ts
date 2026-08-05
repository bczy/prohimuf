import { describe, it, expect, vi } from "vitest";
import { PORTRAIT_PREVIEW_SEED, resolvePortraitSeed } from "../portraitHarness";

/**
 * `?preview=portrait` (hand-off §3.3 step 3b). The seam's whole value is that a
 * capture is REPRODUCIBLE and that the URL can still pin a board — the two must
 * compose, which is what these boundaries pin.
 */
describe("resolvePortraitSeed", () => {
  it("boots a preview on a fixed seed, so two captures show the same board", () => {
    const draw = vi.fn(() => 12345);
    expect(resolvePortraitSeed("?preview=portrait", true, draw)).toBe(PORTRAIT_PREVIEW_SEED);
    expect(draw).not.toHaveBeenCalled();
  });

  it("lets ?portraitSeed win on a preview boot — the two compose", () => {
    expect(resolvePortraitSeed("?preview=portrait&portraitSeed=42", true, () => 12345)).toBe(42);
  });

  it("honours ?portraitSeed on a real run too (the determinism proof)", () => {
    expect(resolvePortraitSeed("?portraitSeed=7", false, () => 12345)).toBe(7);
  });

  it("draws once on a real run with no seed in the URL", () => {
    const draw = vi.fn(() => 12345);
    expect(resolvePortraitSeed("", false, draw)).toBe(12345);
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("falls back rather than yielding NaN on a malformed seed", () => {
    expect(resolvePortraitSeed("?portraitSeed=abc", true, () => 12345)).toBe(PORTRAIT_PREVIEW_SEED);
    expect(resolvePortraitSeed("?portraitSeed=", false, () => 12345)).toBe(12345);
  });
});
