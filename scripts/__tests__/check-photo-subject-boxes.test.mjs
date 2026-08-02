import { describe, expect, it } from "vitest";
import { subjectBoxEdgeTolerance } from "@game/systems/photoQteSystem";
import {
  checkFlat,
  checkNoGrow,
  compareBox,
  deriveDeclaredIntervals,
  opaquePixelAabb,
  pixelAabbToSceneBox,
  sampleTimes,
} from "../check-photo-subject-boxes.mjs";

// The gate's helpers take a tolerance FUNCTION now (imported from the game, never a raw
// number) — these tests call the real evaluator, exactly as the CLI does.
const edgeTolerance = subjectBoxEdgeTolerance;

// A tiny synthetic 4x4 RGBA frame with a 2x2 opaque square at (1,1)-(2,2).
function makeFrame() {
  const W = 4;
  const H = 4;
  const data = new Uint8ClampedArray(W * H * 4); // all zero alpha
  for (const [x, y] of [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ]) {
    data[(y * W + x) * 4 + 3] = 255;
  }
  return { W, H, data };
}

describe("opaquePixelAabb", () => {
  it("bounds the opaque region exactly", () => {
    const aabb = opaquePixelAabb(makeFrame());
    expect(aabb).toEqual({ minX: 1, minY: 1, maxX: 2, maxY: 2 });
  });

  it("returns null for a fully transparent frame", () => {
    const empty = { W: 2, H: 2, data: new Uint8ClampedArray(2 * 2 * 4) };
    expect(opaquePixelAabb(empty)).toBeNull();
  });
});

describe("pixelAabbToSceneBox", () => {
  it("scales a pixel AABB into scene units, centred", () => {
    const box = pixelAabbToSceneBox({ minX: 1, minY: 1, maxX: 2, maxY: 2 }, 0.5);
    expect(box.w).toBeCloseTo(1.0, 5);
    expect(box.h).toBeCloseTo(1.0, 5);
    expect(box.cx).toBeCloseTo(1.0, 5);
    expect(box.cy).toBeCloseTo(1.0, 5);
  });
});

describe("compareBox", () => {
  const authored = { cx: 10, cy: 5, w: 4, h: 2 };

  it("passes an identical box", () => {
    expect(compareBox(authored, authored, edgeTolerance).pass).toBe(true);
  });

  it("passes a box within tolerance", () => {
    const near = { cx: 10.1, cy: 5, w: 4, h: 2 };
    expect(compareBox(near, authored, edgeTolerance).pass).toBe(true);
  });

  it("fails and names the breached edge(s) when a box drifts past tolerance", () => {
    const shrunk = { cx: 10, cy: 5, w: 2, h: 2 }; // right edge moves 1.0su, > tol
    const cmp = compareBox(shrunk, authored, edgeTolerance);
    expect(cmp.pass).toBe(false);
    const badEdges = cmp.deltas.filter((d) => !d.pass).map((d) => d.edge);
    expect(badEdges).toContain("right");
  });
});

describe("checkFlat", () => {
  it("passes when cy is constant", () => {
    const boxes = [
      { cx: 0, cy: 9.0, w: 1, h: 1 },
      { cx: 1, cy: 9.0, w: 1, h: 1 },
      { cx: 2, cy: 9.05, w: 1, h: 1 },
    ];
    expect(checkFlat(boxes, edgeTolerance).pass).toBe(true);
  });

  it("fails when cy drifts past tolerance", () => {
    const boxes = [
      { cx: 0, cy: 9.0, w: 1, h: 1 },
      { cx: 1, cy: 9.0, w: 1, h: 1 },
      { cx: 2, cy: 9.9, w: 1, h: 1 }, // 0.9su drift, > tol
    ];
    expect(checkFlat(boxes, edgeTolerance).pass).toBe(false);
  });
});

describe("checkNoGrow", () => {
  it("passes when w/h are constant", () => {
    const boxes = [
      { cx: 0, cy: 0, w: 7.5, h: 4.22 },
      { cx: 1, cy: 0, w: 7.5, h: 4.22 },
    ];
    expect(checkNoGrow(boxes, edgeTolerance).pass).toBe(true);
  });

  it("fails when w grows past tolerance", () => {
    const boxes = [
      { cx: 0, cy: 0, w: 7.5, h: 4.22 },
      { cx: 1, cy: 0, w: 8.5, h: 4.22 }, // 1.0su growth, > tol
    ];
    expect(checkNoGrow(boxes, edgeTolerance).pass).toBe(false);
  });
});

describe("sampleTimes", () => {
  it("is deterministic and includes both endpoints", () => {
    const times = sampleTimes(53.0, 55.9, 0.1);
    expect(times[0]).toBe(53.0);
    expect(times[times.length - 1]).toBe(55.9);
    // ~29 samples over 2.9s at a 0.1s step — comfortably above the spec's 10-sample floor.
    expect(times.length).toBeGreaterThanOrEqual(10);
  });

  it("produces the same sample set on a second call (determinism)", () => {
    const a = sampleTimes(0, 60, 0.1);
    const b = sampleTimes(0, 60, 0.1);
    expect(a).toEqual(b);
  });
});

describe("deriveDeclaredIntervals", () => {
  // The shipped Belliard shape (K0..K8), transcribed from photoQteBelliard.ts — used here
  // only to prove the DERIVATION reads keyframe order, not authored values twice.
  const track = [
    { t: 0.0, cx: 65.0, cy: 12.75, w: 6.0, h: 13.5 },
    { t: 9.2, cx: 65.0, cy: 12.75, w: 6.0, h: 13.5 },
    { t: 11.0, cx: 54.0, cy: 12.75, w: 24.0, h: 13.5 },
    { t: 34.7, cx: 54.0, cy: 12.75, w: 24.0, h: 13.5 },
    { t: 36.5, cx: 54.0, cy: 14.72, w: 17.0, h: 9.56 },
    { t: 51.2, cx: 54.0, cy: 14.72, w: 17.0, h: 9.56 },
    { t: 53.0, cx: 62.0, cy: 9.0, w: 7.5, h: 4.22 },
    { t: 55.9, cx: 71.0, cy: 9.0, w: 7.5, h: 4.22 },
    { t: 60.0, cx: 83.7, cy: 9.0, w: 7.5, h: 4.22 },
  ];

  it("derives the three declared intervals from keyframe order, not a re-typed table", () => {
    const intervals = deriveDeclaredIntervals(track);
    expect(intervals).toEqual([
      { id: "K2-K3", kind: "hold", from: 11.0, to: 34.7 },
      { id: "K4-K5", kind: "hold", from: 36.5, to: 51.2 },
      { id: "K6-K7", kind: "flat+no_grow", from: 53.0, to: 55.9 },
    ]);
  });

  it("throws on a track that is not the authored 9-keyframe shape", () => {
    expect(() => deriveDeclaredIntervals(track.slice(0, 5))).toThrow();
  });
});
