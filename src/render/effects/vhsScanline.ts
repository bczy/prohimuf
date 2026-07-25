/**
 * Pure, Three-free scroll clock for the VHS scan-line travel (extends the CRT
 * composite's static scanline comb, ADR-0031 §8.2).
 *
 * The comb itself is unchanged — same period, same 0.55 trough, same squared
 * profile. This module only carries the OFFSET fed into its phase, so the comb
 * crawls slowly UP the frame the way a mistracked VHS head does.
 *
 * Two properties matter and are unit-asserted:
 *  1. The accumulator is wrapped on the comb's own period (in CSS px), so it is
 *     bounded forever AND phase-continuous across every wrap — no visible jump,
 *     unlike a wrap on an arbitrary clock (the `FLICKER_TIME_WRAP` problem, G).
 *  2. The offset is authored in CSS px and converted to device px through the
 *     LIVE period, so the travel speed a viewer sees is display-independent —
 *     identical rationale to the period's own CSS-px locking.
 */

/**
 * Scanline comb pitch in CSS pixels — multiplied by devicePixelRatio before it
 * reaches the shader so the visible line pitch is display-independent. 4 gives the
 * chunky late-90s tube read Bertrand asked for (3 was still too discreet). Moved
 * here from `CrtPass` so the travel clock wraps on exactly the comb's own period.
 */
export const SCANLINE_PERIOD_CSS = 4;

/**
 * Travel speed in CSS px per second. 5 px/s ⇒ the comb climbs a little over one
 * period per second: unmistakably alive on a still, far too slow to read as
 * flicker or to fight the sprite reading (constraint 5, §8.4 — never rhythmic).
 */
export const VHS_SCROLL_CSS_PX_PER_SEC = 5;

/**
 * Advance the wrapped scroll accumulator by `delta` seconds.
 *
 * @param prev     Previous offset in CSS px, expected in `[0, period)`.
 * @param delta    Frame time in seconds. Non-finite or negative ⇒ no advance.
 * @param speed    Travel speed in CSS px per second.
 * @param period   Comb period in CSS px; a non-positive period disables travel.
 * @returns The new offset, always in `[0, period)`.
 */
export function advanceScanlineScroll(
  prev: number,
  delta: number,
  speed: number = VHS_SCROLL_CSS_PX_PER_SEC,
  period: number = SCANLINE_PERIOD_CSS,
): number {
  if (period <= 0 || !Number.isFinite(period)) return 0;
  const base = Number.isFinite(prev) ? prev : 0;
  const step = Number.isFinite(delta) && delta > 0 ? delta * speed : 0;
  const next = (base + step) % period;
  // A negative `prev` (never produced here, but a caller could seed one) would
  // survive JS's sign-preserving modulo; fold it back so the range holds.
  return next < 0 ? next + period : next;
}

/**
 * Convert a CSS-px offset to the DEVICE px the shader works in, using the live
 * device period so the two can never drift (mid-resize, dpr change).
 *
 * @param scrollCss    Offset in CSS px (from {@link advanceScanlineScroll}).
 * @param periodDevice The `uScanlinePeriod` uniform's current value, in device px.
 * @param periodCss    The CSS-px period that device period was derived from.
 */
export function scanlineScrollDevicePx(
  scrollCss: number,
  periodDevice: number,
  periodCss: number = SCANLINE_PERIOD_CSS,
): number {
  if (periodCss <= 0 || !Number.isFinite(periodCss)) return 0;
  return scrollCss * (periodDevice / periodCss);
}
