import { describe, it, expect } from "vitest";
import { measure, evaluate } from "../check-nearfg-style.mjs";

// A plain object of the same shape as a Canvas ImageData ({width,height,data}
// over a Uint8ClampedArray-like array) — pure, no @napi-rs/canvas round trip
// needed to exercise measure()/evaluate() (same style as
// scripts/lib/__tests__/cutout.test.mjs).
function makeImage(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y);
      const o = (y * width + x) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = a;
    }
  }
  return { W: width, H: height, d: data };
}

describe("measure", () => {
  it("reports zero content / zero saturation on a fully transparent image", () => {
    const img = makeImage(4, 4, () => [0, 0, 0, 0]);
    const m = measure(img);
    expect(m.content).toBe(0);
    expect(m.contentPct).toBe(0);
    expect(m.meanSat).toBe(0);
  });

  it("reports near-zero mean saturation on a solid grey (R=G=B) opaque image", () => {
    const img = makeImage(4, 4, () => [120, 120, 120, 255]);
    const m = measure(img);
    expect(m.content).toBe(16);
    expect(m.contentPct).toBe(100);
    expect(m.meanSat).toBe(0);
  });

  it("reports high mean saturation on a fully saturated colour", () => {
    const img = makeImage(2, 2, () => [255, 0, 0, 255]); // pure red, sat=1
    const m = measure(img);
    expect(m.meanSat).toBeCloseTo(1, 5);
  });

  it("ignores below-threshold-alpha pixels as non-content", () => {
    const img = makeImage(2, 2, () => [255, 0, 0, 10]); // alpha below ALPHA_CONTENT
    const m = measure(img);
    expect(m.content).toBe(0);
    expect(m.meanSat).toBe(0);
  });
});

describe("evaluate", () => {
  it("PASSes a grey, non-empty silhouette", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 16, contentPct: 100, meanSat: 0.01 });
    expect(pass).toBe(true);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("FAILs an empty silhouette", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 0, contentPct: 0, meanSat: 0 });
    expect(pass).toBe(false);
    expect(checks.find((c) => c.name.startsWith("SILHOUETTE")).ok).toBe(false);
  });

  it("FAILs a colour-cast sprite (mean saturation over the C1 ceiling)", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 16, contentPct: 100, meanSat: 0.4 });
    expect(pass).toBe(false);
    expect(checks.find((c) => c.name.startsWith("MEAN-SAT")).ok).toBe(false);
  });
});
