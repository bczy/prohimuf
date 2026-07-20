import { describe, it, expect } from "vitest";
import { QTE_ZOOM_FACTOR, qteEase, qteZoomInProgress, qtePose, qteRestorePose } from "../qteCamera";

const BASE = { zoom: 50, x: -3, y: 1 } as const;
const ANCHOR = { x: 0, y: 2 } as const;

describe("QTE_ZOOM_FACTOR", () => {
  it("pushes the camera closer (>1) but stays a tight cinematic zoom", () => {
    expect(QTE_ZOOM_FACTOR).toBeGreaterThan(1);
    expect(QTE_ZOOM_FACTOR).toBeCloseTo(2.4, 5);
  });
});

describe("qteEase", () => {
  it("pins the endpoints", () => {
    expect(qteEase(0)).toBe(0);
    expect(qteEase(1)).toBe(1);
  });

  it("clamps out-of-range input", () => {
    expect(qteEase(-0.5)).toBe(0);
    expect(qteEase(1.5)).toBe(1);
  });

  it("is monotonically increasing across the interval", () => {
    let prev = qteEase(0);
    for (let i = 1; i <= 10; i++) {
      const cur = qteEase(i / 10);
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });
});

describe("qteZoomInProgress", () => {
  it("eases 0→1 as the zoom window runs down during ZOOMING", () => {
    expect(qteZoomInProgress("ZOOMING", 2, 2)).toBe(0); // full time left
    expect(qteZoomInProgress("ZOOMING", 0, 2)).toBe(1); // zoom finished
    const mid = qteZoomInProgress("ZOOMING", 1, 2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("stays fully zoomed for the active / result phases and zero otherwise", () => {
    expect(qteZoomInProgress("ACTIVE", 3, 5)).toBe(1);
    expect(qteZoomInProgress("FINISHER", 1.5, 5)).toBe(1);
    expect(qteZoomInProgress("WON", 0, 5)).toBe(1);
    expect(qteZoomInProgress("LOST", 0, 5)).toBe(1);
    expect(qteZoomInProgress("DONE", 0, 5)).toBe(0);
  });

  it("degrades a zero zoom duration to full zoom", () => {
    expect(qteZoomInProgress("ZOOMING", 0, 0)).toBe(1);
  });
});

describe("qtePose", () => {
  it("returns the base pose exactly at p=0", () => {
    expect(qtePose(BASE, ANCHOR, 0)).toEqual({ zoom: BASE.zoom, x: BASE.x, y: BASE.y });
  });

  it("returns the fully-zoomed pose on the static anchor at p=1", () => {
    expect(qtePose(BASE, ANCHOR, 1)).toEqual({
      zoom: BASE.zoom * QTE_ZOOM_FACTOR,
      x: ANCHOR.x,
      y: ANCHOR.y,
    });
  });

  it("interpolates the midpoint and clamps p", () => {
    const mid = qtePose(BASE, ANCHOR, 0.5);
    expect(mid.zoom).toBeCloseTo((BASE.zoom + BASE.zoom * QTE_ZOOM_FACTOR) / 2, 5);
    expect(mid.x).toBeCloseTo((BASE.x + ANCHOR.x) / 2, 5);
    expect(qtePose(BASE, ANCHOR, 2)).toEqual(qtePose(BASE, ANCHOR, 1));
  });
});

describe("qteRestorePose", () => {
  const FROM = { zoom: BASE.zoom * QTE_ZOOM_FACTOR, x: ANCHOR.x, y: ANCHOR.y } as const;

  it("starts at the zoomed pose and restores to base exactly", () => {
    expect(qteRestorePose(FROM, BASE, 0)).toEqual({ zoom: FROM.zoom, x: FROM.x, y: FROM.y });
    expect(qteRestorePose(FROM, BASE, 1)).toEqual({ zoom: BASE.zoom, x: BASE.x, y: BASE.y });
  });

  it("moves monotonically toward base zoom as progress rises", () => {
    const early = qteRestorePose(FROM, BASE, 0.25).zoom;
    const late = qteRestorePose(FROM, BASE, 0.75).zoom;
    // base zoom (50) is below the zoomed zoom (120), so the value decreases.
    expect(late).toBeLessThan(early);
    expect(late).toBeGreaterThan(BASE.zoom);
  });
});
