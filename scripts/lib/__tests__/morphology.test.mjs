import { describe, it, expect } from "vitest";
import {
  diskOffsets,
  dilate,
  erode,
  fillHoles,
  largestComponent,
  labelComponents,
  zoneMask,
  solidBodyMask,
  CLOSE_R,
  ERODE_R,
  SEAL_MARGIN,
} from "../morphology.mjs";

/** Build a W*H mask and set the given [x,y] pixels to 1. */
function mask(W, H, points) {
  const m = new Uint8Array(W * H);
  for (const [x, y] of points) m[y * W + x] = 1;
  return m;
}
/** Fill a solid rect [x0,x1]x[y0,y1] (inclusive) into a fresh mask. */
function rectMask(W, H, x0, y0, x1, y1) {
  const m = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
  return m;
}
const sum = (m) => m.reduce((s, v) => s + v, 0);
const at = (m, W, x, y) => m[y * W + x];

describe("diskOffsets", () => {
  it("has the expected disk cardinalities", () => {
    expect(diskOffsets(0).length).toBe(1); // just (0,0)
    expect(diskOffsets(1).length).toBe(5); // + 4-neighbours
    expect(diskOffsets(2).length).toBe(13);
  });
  it("includes the centre and the axis pixels for r=1", () => {
    const keys = new Set(diskOffsets(1).map(([dx, dy]) => `${dx},${dy}`));
    for (const k of ["0,0", "1,0", "-1,0", "0,1", "0,-1"]) expect(keys.has(k)).toBe(true);
    expect(keys.has("1,1")).toBe(false); // 1²+1²=2 > 1²
  });
});

describe("dilate", () => {
  it("grows a single pixel into a disk-1 plus", () => {
    const m = mask(5, 5, [[2, 2]]);
    const d = dilate(m, 5, 5, diskOffsets(1));
    expect(sum(d)).toBe(5);
    for (const [x, y] of [
      [2, 2],
      [1, 2],
      [3, 2],
      [2, 1],
      [2, 3],
    ])
      expect(at(d, 5, x, y)).toBe(1);
  });
  it("ignores out-of-bounds growth (corner)", () => {
    const d = dilate(mask(3, 3, [[0, 0]]), 3, 3, diskOffsets(1));
    expect(sum(d)).toBe(3); // (0,0)+(1,0)+(0,1); the two off-frame offsets dropped
  });
});

describe("erode", () => {
  it("dilate→erode roundtrip is identity on a large solid block (closing of a convex shape)", () => {
    const off = diskOffsets(1);
    const block = rectMask(20, 20, 5, 5, 14, 14);
    const closed = erode(dilate(block, 20, 20, off), 20, 20, off);
    expect([...closed]).toEqual([...block]);
  });

  it("default treats all out-of-bounds (incl. below bottom) as empty", () => {
    const full = new Uint8Array(4 * 4).fill(1);
    const e = erode(full, 4, 4, diskOffsets(1));
    // Bottom-row interior column erodes because the neighbour below is off-frame.
    expect(at(e, 4, 1, 3)).toBe(0);
    // Top-row column also erodes (neighbour above off-frame).
    expect(at(e, 4, 1, 0)).toBe(0);
  });

  it("outsideBelowBottom treats only the below-bottom neighbour as filled (frame-cut hem)", () => {
    const full = new Uint8Array(4 * 4).fill(1);
    const e = erode(full, 4, 4, diskOffsets(1), { outsideBelowBottom: true });
    // Bottom-row interior column now SURVIVES (below-frame counts as body).
    expect(at(e, 4, 1, 3)).toBe(1);
    // Top row still erodes — the flag only affects the bottom edge.
    expect(at(e, 4, 1, 0)).toBe(0);
    // A left-edge bottom pixel still erodes: its off-frame LEFT neighbour is empty.
    expect(at(e, 4, 0, 3)).toBe(0);
  });
});

describe("closing bridges a gap", () => {
  it("a 1px vertical gap is bridged by a disk-1 closing", () => {
    const off = diskOffsets(1);
    // Two full-height blocks x[0,2] and x[4,6], gap column x=3.
    const m = new Uint8Array(7 * 7);
    for (let y = 0; y < 7; y++) for (const x of [0, 1, 2, 4, 5, 6]) m[y * 7 + x] = 1;
    const closed = erode(dilate(m, 7, 7, off), 7, 7, off);
    expect(at(m, 7, 3, 3)).toBe(0); // was a gap
    expect(at(closed, 7, 3, 3)).toBe(1); // now bridged
  });
});

describe("fillHoles", () => {
  it("fills an enclosed hole", () => {
    const m = new Uint8Array(5 * 5).fill(1);
    m[2 * 5 + 2] = 0; // interior hole
    const f = fillHoles(m, 5, 5);
    expect(at(f, 5, 2, 2)).toBe(1);
  });
  it("leaves a border-open channel unfilled", () => {
    const m = new Uint8Array(5 * 5).fill(1);
    m[2 * 5 + 2] = 0;
    m[3 * 5 + 2] = 0;
    m[4 * 5 + 2] = 0; // channel drains to the bottom border
    const f = fillHoles(m, 5, 5);
    expect(at(f, 5, 2, 2)).toBe(0);
  });
});

describe("largestComponent (4-connectivity only, by design)", () => {
  it("splits a diagonal chain into isolated pixels (no diagonal annexation)", () => {
    const m = mask(4, 4, [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
    expect(sum(largestComponent(m, 4, 4))).toBe(1); // each pixel isolated
  });
  it("keeps the largest 4-conn component", () => {
    const m = mask(4, 4, [
      [0, 0],
      [1, 1],
    ]);
    expect(sum(largestComponent(m, 4, 4))).toBe(1);
  });
});

describe("labelComponents", () => {
  const W = 6;
  const H = 6;
  // 2x2 border-touching block, a 2px component, a single interior pixel.
  const m = mask(W, H, [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1], // size 4, touches border
    [4, 0],
    [5, 0], // size 2, touches border
    [3, 3], // size 1, interior
  ]);
  const keep = (p) => m[p] === 1;

  it("sorts components largest-first with correct size/bbox/touchesBorder", () => {
    const comps = labelComponents(W, H, keep, { connectivity: 4 });
    expect(comps.map((c) => c.size)).toEqual([4, 2, 1]);
    expect(comps[0].bbox).toEqual([0, 0, 1, 1]);
    expect(comps[0].touchesBorder).toBe(true);
    expect(comps[2].bbox).toEqual([3, 3, 3, 3]);
    expect(comps[2].touchesBorder).toBe(false);
  });

  it("omits pixels by default and collects them on request", () => {
    const noPix = labelComponents(W, H, keep, { connectivity: 4 });
    expect(noPix[0].pixels).toBeUndefined();
    const withPix = labelComponents(W, H, keep, { connectivity: 4, collectPixels: true });
    expect(withPix[0].pixels).toHaveLength(4);
    expect(withPix[2].pixels).toEqual([3 * W + 3]);
  });

  it("honours 8-connectivity", () => {
    const diag = mask(3, 3, [
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
    const c4 = labelComponents(3, 3, (p) => diag[p] === 1, { connectivity: 4 });
    const c8 = labelComponents(3, 3, (p) => diag[p] === 1, { connectivity: 8 });
    expect(c4).toHaveLength(3);
    expect(c8).toHaveLength(1);
    expect(c8[0].size).toBe(3);
  });
});

describe("zoneMask", () => {
  it("maps a normalized rect to pixels (floor lo / ceil hi, clamped)", () => {
    const z = zoneMask([[0.25, 0.25, 0.5, 0.5]], 8, 8);
    // x0=floor(2)=2, y0=2, x1=ceil(4)=4, y1=4 → 3x3 block
    expect(at(z, 8, 2, 2)).toBe(1);
    expect(at(z, 8, 4, 4)).toBe(1);
    expect(at(z, 8, 1, 1)).toBe(0);
    expect(at(z, 8, 5, 5)).toBe(0);
  });
  it("unions multiple rects and returns empty for falsy zones", () => {
    const z = zoneMask(
      [
        [0, 0, 0.1, 0.1],
        [0.9, 0.9, 1, 1],
      ],
      10,
      10,
    );
    expect(at(z, 10, 0, 0)).toBe(1);
    expect(at(z, 10, 9, 9)).toBe(1);
    expect(sum(zoneMask(null, 10, 10))).toBe(0);
  });
});

describe("solidBodyMask", () => {
  it("exports the frozen constants", () => {
    expect(CLOSE_R).toBe(10);
    expect(ERODE_R).toBe(1);
    expect(SEAL_MARGIN).toBe(2);
  });

  it("returns the input unchanged when there is no figure", () => {
    const empty = new Uint8Array(8 * 8);
    const out = solidBodyMask(empty, 8, 8);
    expect(out).toBe(empty); // same reference — the maxX<minX early return
  });

  it("reconstructs a solid body: fills an interior hole and drops a detached speck", () => {
    const W = 64;
    const H = 64;
    // A porous body (interior hole) clear of the frame edges, plus a far detached speck.
    const m = rectMask(W, H, 18, 20, 45, 48);
    m[34 * W + 31] = 0; // interior keyed-out hole
    m[3 * W + 3] = 1; // detached keying speck
    const solid = solidBodyMask(m, W, H);
    expect(at(solid, W, 31, 34)).toBe(1); // hole reconstructed (closing + fill-holes)
    expect(at(solid, W, 30, 30)).toBe(1); // body interior stays solid
    expect(at(solid, W, 3, 3)).toBe(0); // speck dropped (largest component only)
    // No fat halo far beyond the silhouette (disk-1 anti-halo erode keeps it tight).
    expect(at(solid, W, 2, 2)).toBe(0);
    expect(at(solid, W, 60, 60)).toBe(0);
  });

  it("solidifies a frame-cut bust so the bottom row of the figure reads solid", () => {
    // A bust reaching the bottom edge (frame-cut) with a keyed-out interior bite: the
    // selective bottom seal + closing reconstruct a solid lower mass. We assert the
    // reconstruction stays a single dense body flush against the bottom-centre rather than
    // predicting exact disk-10 boundary pixels (those are locked by the full-chain replay).
    const W = 64;
    const H = 64;
    const m = rectMask(W, H, 16, 12, 47, H - 1); // torso, bottom-edge frame-cut
    m[52 * W + 31] = 0; // an interior keyed-out bite near the hem
    m[53 * W + 31] = 0;
    const solid = solidBodyMask(m, W, H);
    expect(at(solid, W, 31, 52)).toBe(1); // hem bite reconstructed solid
    expect(at(solid, W, 31, 40)).toBe(1); // torso centre solid
  });
});
