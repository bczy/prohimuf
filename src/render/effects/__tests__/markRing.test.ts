import { describe, it, expect } from "vitest";
import { nextCursor, writeMarkRing } from "../markRing";

/**
 * Pure, DOM-free assertion of the wall-mark FIFO cap (spec D4.2 / story AC4):
 * "marks never exceed 16; the 17th evicts the oldest". ImpactEffects drives its
 * persistent decal ring through these helpers, so exercising them here locks the
 * cap invariant in-PR without needing a live R3F scene.
 */

const CAP = 16;
const empty = (): readonly (number | null)[] => Array.from({ length: CAP }, () => null);

describe("nextCursor", () => {
  it("advances by one and wraps at the cap", () => {
    expect(nextCursor(0, CAP)).toBe(1);
    expect(nextCursor(14, CAP)).toBe(15);
    expect(nextCursor(15, CAP)).toBe(0);
  });
});

describe("writeMarkRing (wall-mark FIFO)", () => {
  it("overwrites exactly the cursor slot and leaves the input untouched (pure)", () => {
    const slots: readonly (number | null)[] = [10, 20, 30, 40];
    const out = writeMarkRing(slots, 2, 99);
    expect(out.slots).toEqual([10, 20, 99, 40]);
    expect(out.cursor).toBe(3);
    // Input array is not mutated.
    expect(slots).toEqual([10, 20, 30, 40]);
  });

  it("fills up to the cap without eviction and wraps the cursor once", () => {
    let slots = empty();
    let cursor = 0;
    for (let i = 0; i < CAP; i++) {
      const out = writeMarkRing(slots, cursor, i);
      slots = out.slots;
      cursor = out.cursor;
    }
    expect(slots.filter((v) => v !== null)).toHaveLength(CAP);
    expect(slots).toEqual(Array.from({ length: CAP }, (_, i) => i));
    expect(cursor).toBe(0); // lapped exactly once
  });

  it("never exceeds the cap and evicts the oldest past it (AC4)", () => {
    const overflow = 5;
    let slots = empty();
    let cursor = 0;
    for (let i = 0; i < CAP + overflow; i++) {
      const out = writeMarkRing(slots, cursor, i);
      slots = out.slots;
      cursor = out.cursor;
    }
    // Exactly `cap` live marks — the pool never grows past the bound.
    expect(slots.filter((v) => v !== null)).toHaveLength(CAP);
    // The first `overflow` writes (0..4) were the oldest and are overwritten.
    for (let i = 0; i < overflow; i++) expect(slots).not.toContain(i);
    // The most recent `cap` writes all survive.
    for (let i = overflow; i < CAP + overflow; i++) expect(slots).toContain(i);
    expect(cursor).toBe(overflow % CAP);
  });
});
