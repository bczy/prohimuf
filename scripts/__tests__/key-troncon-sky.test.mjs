import { describe, it, expect } from "vitest";
import { skyMask } from "../key-troncon-sky.mjs";

// Synthetic 10x10 tronçon: a bright building (luma 200) floating with dark sky
// margins (luma 10) on top/left/right, standing on the bottom edge, with a dark
// INTERIOR block (a mur-pignon / passage beat) fully enclosed by the building.
function fixture() {
  const w = 10;
  const h = 10;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const set = (x, y, v) => {
    const i = (y * w + x) * 4;
    rgba[i] = rgba[i + 1] = rgba[i + 2] = v;
    rgba[i + 3] = 255;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, 10); // sky
  for (let y = 4; y <= 9; y++) for (let x = 2; x <= 7; x++) set(x, y, 200); // building
  for (let y = 6; y <= 7; y++) for (let x = 4; x <= 5; x++) set(x, y, 10); // interior dark beat
  return { w, h, rgba };
}

describe("skyMask (region-mask tronçon sky key)", () => {
  const { w, h, rgba } = fixture();
  const mask = skyMask(w, h, rgba, { ceiling: 44 });
  const at = (x, y) => mask[y * w + x];

  it("clears the border-connected sky (top + side margins)", () => {
    expect(at(0, 0)).toBe(1); // top-left sky
    expect(at(9, 0)).toBe(1); // top-right sky
    expect(at(0, 5)).toBe(1); // left margin beside the building
    expect(at(9, 5)).toBe(1); // right margin
  });

  it("keeps the enclosed interior dark beat (mur-pignon / passage)", () => {
    expect(at(4, 6)).toBe(0);
    expect(at(5, 7)).toBe(0);
  });

  it("keeps the bright building body", () => {
    expect(at(3, 5)).toBe(0);
    expect(at(7, 9)).toBe(0);
  });

  it("never floods up from the bottom into a dark building base", () => {
    // A dark pixel on the bottom edge that is walled off from the side-sky by
    // bright building stays opaque (the bottom border is deliberately not seeded).
    const w2 = 5;
    const h2 = 4;
    const r = new Uint8ClampedArray(w2 * h2 * 4);
    const set = (x, y, v) => {
      const i = (y * w2 + x) * 4;
      r[i] = r[i + 1] = r[i + 2] = v;
      r[i + 3] = 255;
    };
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) set(x, y, 200); // all building
    set(2, 3, 10); // one dark base pixel on the bottom edge, enclosed by bright
    const m = skyMask(w2, h2, r, { ceiling: 44 });
    expect(m[3 * w2 + 2]).toBe(0); // kept, not cleared from the bottom
  });
});
