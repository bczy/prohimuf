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
 * TITLE reveal: the motion tokens are a BUDGET, not decoration — the cover must be
 * finished before a player can plausibly have read it, and since the variant is DRAWN at
 * random the player must not be able to feel which one they got from its length. So every
 * variant is held to the same window. `TitleScreen.module.css` derives each letter's delay
 * as `index × stagger`, so a staggered variant's wall-clock total for the 3-letter wordmark
 * is `2 × stagger + duration`; the blast fires all three letters at once, so its total is
 * its cloud's life. These bounds stop a later "make it more dramatic" tweak from silently
 * pushing one variant past the window — or away from its siblings.
 */
describe("TITLE reveal budget", () => {
  const WORDMARK_LETTERS = 3;
  const staggered = (durationMs: number, staggerMs: number): number =>
    (WORDMARK_LETTERS - 1) * staggerMs + durationMs;

  const totals = {
    spray: staggered(MOTION.titleSprayMs, MOTION.titleSprayStaggerMs),
    paint: staggered(MOTION.titlePaintMs, MOTION.titlePaintStaggerMs),
    blast: MOTION.titleBlastMs,
  };

  it("keeps one letter's stroke under the 1s-per-letter ceiling", () => {
    expect(MOTION.titleSprayMs).toBeLessThanOrEqual(1000);
    expect(MOTION.titlePaintMs).toBeLessThanOrEqual(1000);
  });

  it("finishes every variant within the 2–3s window", () => {
    for (const [variant, totalMs] of Object.entries(totals)) {
      expect(totalMs, variant).toBeGreaterThanOrEqual(1500);
      expect(totalMs, variant).toBeLessThanOrEqual(3000);
    }
  });

  it("keeps the three variants within half a second of each other (no tell)", () => {
    const values = Object.values(totals);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(500);
  });

  it("settles the blast's letters well before its cloud clears", () => {
    expect(MOTION.titleBlastSettleMs).toBeLessThan(MOTION.titleBlastMs);
  });
});
