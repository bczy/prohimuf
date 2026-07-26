import { describe, it, expect } from "vitest";
import { SHORT_LANDSCAPE_MAX_H, SHORT_LANDSCAPE_MEDIA } from "../tokens";

/**
 * Locks the ADR-0024 short-landscape breakpoint against drift. The threshold is a
 * single source (`SHORT_LANDSCAPE_MAX_H`) that both TITLE and MENU interpolate into
 * their scoped `<style>` blocks; if the value or the media-query shape ever changes,
 * these assertions fail so the two surfaces cannot silently disagree on where "short"
 * begins.
 */
describe("short-landscape breakpoint (ADR-0024)", () => {
  it("SHORT_LANDSCAPE_MAX_H is the 480px height threshold", () => {
    expect(SHORT_LANDSCAPE_MAX_H).toBe(480);
  });

  it("SHORT_LANDSCAPE_MEDIA interpolates the threshold into the exact query string", () => {
    expect(SHORT_LANDSCAPE_MEDIA).toBe(
      "(orientation: landscape) and (max-height: 480px) and (pointer: coarse)",
    );
  });

  it("SHORT_LANDSCAPE_MEDIA stays derived from SHORT_LANDSCAPE_MAX_H (single source)", () => {
    expect(SHORT_LANDSCAPE_MEDIA).toContain(`max-height: ${SHORT_LANDSCAPE_MAX_H.toString()}px`);
  });
});
