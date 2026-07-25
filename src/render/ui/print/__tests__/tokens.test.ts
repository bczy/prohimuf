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
 * TITLE reveal: the motion tokens are a BUDGET, not decoration. `TitleScreen.module.css`
 * derives each letter's delay as `index × stagger`, so a staggered variant's wall-clock total
 * for the 3-letter wordmark is `2 × stagger + duration`; the blast fires all three letters at
 * once, so its total is its cloud's life.
 *
 * The three variants used to be held to ONE shared ~2s window, so the player could not feel
 * from its length which one they had drawn. That parity was traded away on 2026-07-25
 * (Bertrand): the paint variant now has to READ as a hand with a can — one line at a time, a
 * silence while the arm travels, a second pass in the other colour — and a gesture that long
 * cannot be squeezed into a spray's budget. So each variant gets its OWN window instead, and
 * the "no tell" guard now covers only the two that reveal on the spot. The bounds still stop a
 * later "make it more dramatic" tweak from pushing a variant out of its lane, and the hard cap
 * (6s) is what keeps the cover from holding a player who wants to get on with it — the surface
 * is click-through at any instant, but the wordmark must be finished before they wonder.
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
  // Per-variant windows (ms). The paint's is deliberately the long one.
  const WINDOWS = {
    spray: [1500, 2500],
    blast: [1500, 3500],
    paint: [3000, 6000],
  } as const;

  it("keeps one can-stroke under the 1s ceiling", () => {
    // The spray lays a letter in one stroke; the paint's unit of gesture is one PASS (the
    // six lines of a single colour over one letter). Neither may outstay a second.
    expect(MOTION.titleSprayMs).toBeLessThanOrEqual(1000);
    expect(MOTION.titlePaintPassMs).toBeLessThanOrEqual(1000);
  });

  it("finishes every variant inside its own window", () => {
    for (const [variant, totalMs] of Object.entries(totals)) {
      const [min, max] = WINDOWS[variant as keyof typeof WINDOWS];
      expect(totalMs, variant).toBeGreaterThanOrEqual(min);
      expect(totalMs, variant).toBeLessThanOrEqual(max);
    }
  });

  it("keeps the two on-the-spot variants within a second of each other (no tell)", () => {
    expect(Math.abs(totals.spray - totals.blast)).toBeLessThanOrEqual(1000);
  });

  it("makes the paint the slowest variant, and caps it at 6s", () => {
    expect(totals.paint).toBeGreaterThan(Math.max(totals.spray, totals.blast));
    expect(totals.paint).toBeLessThanOrEqual(6000);
  });

  it("settles the blast's letters well before its cloud clears", () => {
    expect(MOTION.titleBlastSettleMs).toBeLessThan(MOTION.titleBlastMs);
  });
});

/**
 * The paint variant's RHYTHM (Bertrand, 2026-07-25: "c'est ce rythme qui vend le réalisme,
 * plus encore que la vitesse du trait"). A can that never stops is a printer, not a hand: the
 * silences — arm travel between two lines, can swap between two colours, the step across to
 * the next letter — are load-bearing, so each is asserted to exist and to be longer than the
 * gesture it separates. Everything here is derived arithmetic inside `tokens.ts`; these
 * assertions are what stops a "just make it faster" edit from collapsing the pauses to zero
 * and turning the fill back into a wipe.
 */
describe("TITLE paint rhythm", () => {
  /**
   * The first cut of this variant sprayed a line in 45ms. Frame-by-frame capture of the built
   * cover (60fps) showed why that failed the brief: a line was laid in under three frames, so
   * it never READ as a stroke crossing the letter — it popped, and because one horizontal line
   * crosses several strokes of a glyph (the M's two stems), a popping line lights up two or
   * three disjoint places at the same instant. A stroke has to last long enough to be SEEN
   * travelling; six frames at 60fps is the floor. This is the assertion that keeps the next
   * "make it snappier" edit from bringing the popping back.
   */
  it("sprays a line slowly enough to be seen crossing (≥6 frames at 60fps)", () => {
    expect(MOTION.titlePaintLineMs).toBeGreaterThanOrEqual(100);
  });

  it("stops the can between two lines, long enough to register", () => {
    expect(MOTION.titlePaintLineGapMs).toBeGreaterThanOrEqual(60);
  });

  it("spends a pass on whole lines only (four of them, spray + travel)", () => {
    expect(MOTION.titlePaintPassMs % (MOTION.titlePaintLineMs + MOTION.titlePaintLineGapMs)).toBe(
      0,
    );
  });

  it("pauses to swap cans between the two colour passes", () => {
    const passGap = MOTION.titlePaintPassStepMs - MOTION.titlePaintPassMs;
    expect(passGap).toBeGreaterThan(MOTION.titlePaintLineGapMs);
    // A letter is both passes AND the swap between them, so no two colours overlap.
    expect(MOTION.titlePaintMs).toBe(MOTION.titlePaintPassStepMs + MOTION.titlePaintPassMs);
  });

  it("pauses again before stepping across to the next letter", () => {
    expect(MOTION.titlePaintStaggerMs).toBeGreaterThan(MOTION.titlePaintMs);
  });
});
