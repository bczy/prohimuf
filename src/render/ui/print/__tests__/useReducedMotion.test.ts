import { describe, it, expect } from "vitest";
import { unionReducedMotion } from "../useReducedMotion";
import { applyReducedMotion } from "../../applyPrintTokens";

/**
 * The shared derived reduced-motion signal (ADR-0054 §3) has two testable pure
 * pieces: the union combiner (prefs OR OS) and the root-attribute writer that feeds
 * base.css's second `--motion-*` zeroing trigger. Together they pin the load-bearing
 * invariant "the toggle may strengthen but never weaken a live OS `reduce`."
 */
describe("unionReducedMotion", () => {
  it("is the OR of the prefs field and the live OS query", () => {
    expect(unionReducedMotion(false, false)).toBe(false);
    expect(unionReducedMotion(true, false)).toBe(true); // toggle ON, OS no-preference
    expect(unionReducedMotion(false, true)).toBe(true); // toggle OFF, OS reduce → stays reduced
    expect(unionReducedMotion(true, true)).toBe(true);
  });

  it("never weakens a live OS reduce (toggle OFF cannot turn the OS signal off)", () => {
    expect(unionReducedMotion(false, true)).toBe(true);
  });
});

describe("applyReducedMotion (root second trigger)", () => {
  it("sets data-reduced-motion when effective, removes it when not", () => {
    const root = document.createElement("div");

    applyReducedMotion(true, root);
    expect(root.getAttribute("data-reduced-motion")).toBe("true");

    applyReducedMotion(false, root);
    expect(root.hasAttribute("data-reduced-motion")).toBe(false);
  });
});
