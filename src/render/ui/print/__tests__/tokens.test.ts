import { describe, it, expect } from "vitest";
import { MOTION, SHORT_LANDSCAPE_MAX_H, SHORT_LANDSCAPE_MEDIA } from "../tokens";

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

/**
 * TITLE spray reveal: the two tokens are a BUDGET, not decoration — the cover must be
 * finished before a player can plausibly have read it. `TitleScreen.module.css` derives
 * each letter's delay as `index × stagger`, so the wall-clock total for the 3-letter
 * wordmark is `2 × stagger + duration`; both bounds are pinned here so a later "make it
 * more dramatic" tweak can't silently push the cover past its window.
 */
describe("TITLE spray reveal budget", () => {
  const WORDMARK_LETTERS = 3;
  const totalMs = (WORDMARK_LETTERS - 1) * MOTION.titleSprayStaggerMs + MOTION.titleSprayMs;

  it("keeps one letter's can-stroke under the 1s-per-letter ceiling", () => {
    expect(MOTION.titleSprayMs).toBeLessThanOrEqual(1000);
  });

  it("finishes the whole wordmark within the 2–3s window", () => {
    expect(totalMs).toBeGreaterThanOrEqual(1500);
    expect(totalMs).toBeLessThanOrEqual(3000);
  });
});
