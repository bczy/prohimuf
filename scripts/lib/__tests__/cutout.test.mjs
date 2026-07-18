import { describe, it, expect } from "vitest";
import { dist2, isBackgroundPixel, cornerAverageKey, chromaKey } from "../cutout.mjs";

// A plain object of the same shape as a Canvas ImageData ({width,height,data}
// over a Uint8ClampedArray) — the pure lib never touches @napi-rs/canvas, so a
// synthetic stand-in is enough to unit-test it (ADR-0007 D-TDD).
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
  return { width, height, data };
}

describe("dist2", () => {
  it("is 0 for identical colours", () => {
    expect(dist2(10, 20, 30, 10, 20, 30)).toBe(0);
  });

  it("is the sum of squared per-channel differences", () => {
    expect(dist2(0, 0, 0, 1, 2, 3)).toBe(1 + 4 + 9);
  });
});

describe("isBackgroundPixel", () => {
  it("true when within threshold of the key", () => {
    const data = new Uint8ClampedArray([20, 20, 20, 255]);
    expect(isBackgroundPixel(data, 0, { r: 22, g: 18, b: 21 }, 24 * 24)).toBe(true);
  });

  it("false when the colour is far from the key", () => {
    const data = new Uint8ClampedArray([200, 30, 40, 255]);
    expect(isBackgroundPixel(data, 0, { r: 20, g: 20, b: 20 }, 24 * 24)).toBe(false);
  });
});

describe("cornerAverageKey", () => {
  it("averages the four corners", () => {
    // 2x2 image, all four pixels ARE the corners.
    const img = makeImage(2, 2, () => [10, 20, 30, 255]);
    expect(cornerAverageKey(img)).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("skips transparent corners and averages only the opaque ones", () => {
    // 2x2: top-left transparent, the other three opaque at (30,30,30).
    const img = makeImage(2, 2, (x, y) => (x === 0 && y === 0 ? [0, 0, 0, 0] : [30, 30, 30, 255]));
    expect(cornerAverageKey(img)).toEqual({ r: 30, g: 30, b: 30 });
  });

  it("returns null when every corner is transparent (pre-keyed sprite)", () => {
    const img = makeImage(2, 2, () => [0, 0, 0, 0]);
    expect(cornerAverageKey(img)).toBeNull();
  });
});

describe("chromaKey — ADR-0007 synthetic corner/interior case", () => {
  it("clears the near-key background and leaves the far interior pixel opaque", () => {
    // 3x3 image: every border pixel is background (20,20,20); the single
    // interior/centre pixel is a subject colour (200,30,40) — far from the key.
    const W = 3;
    const H = 3;
    const img = makeImage(W, H, (x, y) =>
      x === 1 && y === 1 ? [200, 30, 40, 255] : [20, 20, 20, 255],
    );

    const key = cornerAverageKey(img);
    expect(key).toEqual({ r: 20, g: 20, b: 20 });

    const THRESHOLD_SQ = 24 * 24;
    const cleared = chromaKey(img, key, THRESHOLD_SQ);

    const centerOffset = (1 * W + 1) * 4;
    expect(img.data[centerOffset + 3]).toBe(255); // interior pixel stays opaque

    // every border pixel (8 of the 9) was background-coloured and gets cleared
    expect(cleared).toBe(8);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x === 1 && y === 1) continue;
        const o = (y * W + x) * 4;
        expect(img.data[o + 3]).toBe(0);
      }
    }
  });

  it("is a no-op (0 cleared) when no pixel is within threshold", () => {
    const img = makeImage(2, 2, () => [200, 200, 200, 255]);
    const cleared = chromaKey(img, { r: 0, g: 0, b: 0 }, 10 * 10);
    expect(cleared).toBe(0);
    expect([...img.data]).toEqual([
      200, 200, 200, 255, 200, 200, 200, 255, 200, 200, 200, 255, 200, 200, 200, 255,
    ]);
  });

  it("leaves already-transparent pixels untouched (does not re-count them)", () => {
    const img = makeImage(1, 2, (x, y) => (y === 0 ? [20, 20, 20, 0] : [20, 20, 20, 255]));
    const cleared = chromaKey(img, { r: 20, g: 20, b: 20 }, 5 * 5);
    expect(cleared).toBe(1); // only the opaque one gets counted/cleared
    expect(img.data[3]).toBe(0);
    expect(img.data[7]).toBe(0);
  });
});
