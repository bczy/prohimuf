import { describe, it, expect } from "vitest";
import {
  SCANLINE_PERIOD_CSS,
  VHS_SCROLL_CSS_PX_PER_SEC,
  advanceScanlineScroll,
  scanlineScrollDevicePx,
} from "../vhsScanline";

describe("advanceScanlineScroll", () => {
  it("advances by speed × delta", () => {
    expect(advanceScanlineScroll(0, 0.5, 4, 100)).toBeCloseTo(2, 6);
  });

  it("stays bounded in [0, period) however long it runs", () => {
    let s = 0;
    for (let i = 0; i < 10_000; i++) {
      s = advanceScanlineScroll(s, 1 / 60);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(SCANLINE_PERIOD_CSS);
    }
  });

  it("wraps phase-continuously — one full period lands back on the start", () => {
    const period = SCANLINE_PERIOD_CSS;
    // Exactly one period of travel, in one step and in two halves: both land on 0.
    const oneStep = advanceScanlineScroll(0, period / VHS_SCROLL_CSS_PX_PER_SEC);
    expect(oneStep).toBeCloseTo(0, 9);
    const half = advanceScanlineScroll(0, period / VHS_SCROLL_CSS_PX_PER_SEC / 2);
    expect(advanceScanlineScroll(half, period / VHS_SCROLL_CSS_PX_PER_SEC / 2)).toBeCloseTo(0, 9);
  });

  it("does not advance on a frozen clock (delta 0) — the reduced-motion freeze", () => {
    expect(advanceScanlineScroll(1.5, 0)).toBe(1.5);
  });

  it("ignores non-finite / negative deltas", () => {
    expect(advanceScanlineScroll(1.5, Number.NaN)).toBe(1.5);
    expect(advanceScanlineScroll(1.5, -2)).toBe(1.5);
  });

  it("returns 0 for a degenerate period", () => {
    expect(advanceScanlineScroll(1.5, 0.1, 5, 0)).toBe(0);
    expect(advanceScanlineScroll(1.5, 0.1, 5, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("folds a negative seed back into range", () => {
    const v = advanceScanlineScroll(-1, 0, 5, 4);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(4);
  });
});

describe("scanlineScrollDevicePx", () => {
  it("scales the CSS offset by the live device/CSS period ratio", () => {
    // dpr 2 ⇒ device period 8 for a CSS period of 4: a 1 CSS px offset is 2 device px.
    expect(scanlineScrollDevicePx(1, 8, 4)).toBeCloseTo(2, 9);
  });

  it("is identity at dpr 1", () => {
    expect(scanlineScrollDevicePx(2.5, SCANLINE_PERIOD_CSS)).toBeCloseTo(2.5, 9);
  });

  it("keeps the offset a constant fraction of the period across dpr", () => {
    const scrollCss = 1;
    for (const dpr of [1, 1.5, 2, 3]) {
      const periodDevice = SCANLINE_PERIOD_CSS * dpr;
      const device = scanlineScrollDevicePx(scrollCss, periodDevice);
      expect(device / periodDevice).toBeCloseTo(scrollCss / SCANLINE_PERIOD_CSS, 9);
    }
  });

  it("returns 0 for a degenerate CSS period", () => {
    expect(scanlineScrollDevicePx(1, 8, 0)).toBe(0);
  });
});
