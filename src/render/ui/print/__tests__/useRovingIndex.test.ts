import { describe, it, expect } from "vitest";
import { nextRovingIndex, isActivateKey } from "../useRovingIndex";

/**
 * Pure reducer-style coverage of the roving-focus transition (the DOM-free core of
 * `useRovingIndex`). Locks arrow movement per axis, clamp vs wrap, and no-op keys so
 * keyboard-nav correctness can't silently regress under the reskin.
 */
describe("nextRovingIndex", () => {
  describe("vertical axis (default)", () => {
    it("ArrowDown advances, ArrowUp retreats", () => {
      expect(nextRovingIndex(0, "ArrowDown", 4)).toBe(1);
      expect(nextRovingIndex(2, "ArrowUp", 4)).toBe(1);
    });

    it("clamps at the ends without wrap", () => {
      expect(nextRovingIndex(0, "ArrowUp", 4)).toBe(0);
      expect(nextRovingIndex(3, "ArrowDown", 4)).toBe(3);
    });

    it("wraps past the ends when wrap is on", () => {
      expect(nextRovingIndex(3, "ArrowDown", 4, { wrap: true })).toBe(0);
      expect(nextRovingIndex(0, "ArrowUp", 4, { wrap: true })).toBe(3);
    });

    it("ignores horizontal arrows on the vertical axis", () => {
      expect(nextRovingIndex(1, "ArrowRight", 4)).toBe(1);
      expect(nextRovingIndex(1, "ArrowLeft", 4)).toBe(1);
    });
  });

  describe("horizontal axis", () => {
    it("ArrowRight advances, ArrowLeft retreats", () => {
      expect(nextRovingIndex(0, "ArrowRight", 3, { axis: "horizontal" })).toBe(1);
      expect(nextRovingIndex(2, "ArrowLeft", 3, { axis: "horizontal" })).toBe(1);
    });

    it("wraps on the horizontal axis when enabled", () => {
      expect(nextRovingIndex(2, "ArrowRight", 3, { axis: "horizontal", wrap: true })).toBe(0);
      expect(nextRovingIndex(0, "ArrowLeft", 3, { axis: "horizontal", wrap: true })).toBe(2);
    });

    it("ignores vertical arrows on the horizontal axis", () => {
      expect(nextRovingIndex(1, "ArrowDown", 3, { axis: "horizontal" })).toBe(1);
      expect(nextRovingIndex(1, "ArrowUp", 3, { axis: "horizontal" })).toBe(1);
    });
  });

  it("Enter, Space and other non-movement keys are a no-op on the index", () => {
    expect(nextRovingIndex(1, "Enter", 4)).toBe(1);
    expect(nextRovingIndex(1, " ", 4)).toBe(1);
    expect(nextRovingIndex(1, "a", 4)).toBe(1);
    expect(nextRovingIndex(1, "Tab", 4)).toBe(1);
  });

  it("guards non-positive counts", () => {
    expect(nextRovingIndex(0, "ArrowDown", 0)).toBe(0);
    expect(nextRovingIndex(0, "ArrowUp", -1)).toBe(0);
  });
});

/**
 * Activation predicate — the pure branch the hook's `onKeyDown` uses to fire
 * `onActivate`. Space must activate like Enter (WAI-ARIA), and movement / other keys
 * must not, so the flyer wall can be triggered from the keyboard without a mouse.
 */
describe("isActivateKey", () => {
  it("activates on Enter and Space", () => {
    expect(isActivateKey("Enter")).toBe(true);
    expect(isActivateKey(" ")).toBe(true);
  });

  it("does not activate on arrows or other keys", () => {
    expect(isActivateKey("ArrowDown")).toBe(false);
    expect(isActivateKey("ArrowUp")).toBe(false);
    expect(isActivateKey("ArrowLeft")).toBe(false);
    expect(isActivateKey("ArrowRight")).toBe(false);
    expect(isActivateKey("Tab")).toBe(false);
    expect(isActivateKey("Escape")).toBe(false);
    expect(isActivateKey("a")).toBe(false);
    expect(isActivateKey("Spacebar")).toBe(false);
  });
});
