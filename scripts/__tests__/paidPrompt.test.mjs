import { describe, it, expect } from "vitest";
import { STYLE_BLOCK, buildPaidPrompt, seedFromLevelId } from "../lib/paidPrompt.mjs";

const plan = {
  id: "fixture",
  fiction: {
    name: "Fixture",
    label: "Fixture, Test, 1998",
    district: "Test district",
    year: "1998",
  },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
};

describe("buildPaidPrompt", () => {
  it("contains the house STYLE_BLOCK verbatim", () => {
    const prompt = buildPaidPrompt(plan);
    expect(prompt).toContain(STYLE_BLOCK);
  });

  it("contains the plan's district and year (its own content, not another level's)", () => {
    const prompt = buildPaidPrompt(plan);
    expect(prompt).toContain("Test district");
    expect(prompt).toContain("1998");
  });

  it("imposes the gable-wall + passage clause when calibration is declared", () => {
    const withCal = { ...plan, calibration: { windowBand: { top: 0.12, bottom: 0.5 } } };
    const prompt = buildPaidPrompt(withCal);
    expect(prompt).toMatch(/gable/i);
    expect(prompt).toMatch(/passage/i);
  });

  it("omits the calibration-imposed clause when the plan has no calibration", () => {
    const prompt = buildPaidPrompt(plan);
    expect(prompt).not.toMatch(/gable/i);
    expect(prompt).not.toMatch(/passage/i);
  });

  it("puts content before style (style never leaks into the content half)", () => {
    const prompt = buildPaidPrompt(plan);
    expect(prompt.indexOf("Test district")).toBeLessThan(prompt.indexOf(STYLE_BLOCK));
  });
});

describe("seedFromLevelId", () => {
  it("is deterministic for the same id", () => {
    expect(seedFromLevelId("fixture")).toBe(seedFromLevelId("fixture"));
  });

  it("differs across ids (no collision for these two)", () => {
    expect(seedFromLevelId("fixture")).not.toBe(seedFromLevelId("belliard"));
  });

  it("is always a non-negative integer", () => {
    for (const id of ["fixture", "belliard", "a", ""]) {
      const seed = seedFromLevelId(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    }
  });
});
