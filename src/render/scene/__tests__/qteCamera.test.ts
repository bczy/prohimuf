import { describe, it, expect } from "vitest";
import {
  QTE_ZOOM_FACTOR,
  QTE_DOOR_LEAD,
  QTE_DOOR_LEAD_MAX,
  qteEase,
  qteZoomInProgress,
  qtePose,
  qteRestorePose,
  qteFollowTarget,
} from "../qteCamera";

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

  it("returns the fully-zoomed pose on the anchor at p=1", () => {
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

describe("qteFollowTarget", () => {
  it("leaves the point on the anchor when the door coincides with it", () => {
    expect(qteFollowTarget({ x: 2, y: 1 }, { x: 2, y: 1 })).toEqual({ x: 2, y: 1 });
  });

  it("nudges the framing off the anchor TOWARD the door (keeps the goal in frame)", () => {
    const anchor = { x: 0, y: 0 };
    const door = { x: 2, y: 0 }; // gap 2 → lead 0.35*2 = 0.7 < cap
    const t = qteFollowTarget(anchor, door);
    expect(t.x).toBeCloseTo(anchor.x + 2 * QTE_DOOR_LEAD, 5);
    expect(t.y).toBe(0);
    // Biased toward the door but never past the captor→door midpoint.
    expect(t.x).toBeGreaterThan(anchor.x);
    expect(t.x).toBeLessThan((anchor.x + door.x) / 2);
  });

  it("caps the lead so a distant door never de-centres the captor", () => {
    const anchor = { x: 0, y: 0 };
    const far = { x: 100, y: 0 }; // 0.35*100 = 35 world units, must clamp to the cap
    const t = qteFollowTarget(anchor, far);
    expect(t.x).toBeCloseTo(anchor.x + QTE_DOOR_LEAD_MAX, 5);
  });

  it("leads toward a door on the opposite side too (negative direction)", () => {
    const t = qteFollowTarget({ x: 0, y: 0 }, { x: -100, y: 0 });
    expect(t.x).toBeCloseTo(-QTE_DOOR_LEAD_MAX, 5);
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
