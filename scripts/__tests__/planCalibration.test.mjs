import { describe, it, expect } from "vitest";
import { levelCfgFromPlan, defaultWarm } from "../lib/planCalibration.mjs";

const basePlan = {
  id: "fixture",
  calibration: { windowBand: { top: 0.12, bottom: 0.5 } },
};

describe("levelCfgFromPlan", () => {
  it("produces a detection config with NO manual LEVEL_CFG entry involved", () => {
    const cfg = levelCfgFromPlan(basePlan);
    expect(cfg.band).toEqual([0.12, 0.5]);
    expect(cfg.rowMode).toBe("runs");
    expect(typeof cfg.warm).toBe("function");
    expect(cfg.warm).toBe(defaultWarm);
  });

  it("throws a clear error when the plan has no calibration", () => {
    expect(() => levelCfgFromPlan({ id: "no-cal" })).toThrow(/calibration dans le plan/);
  });

  it("carries every field align-windows.mjs's detection loop reads", () => {
    const cfg = levelCfgFromPlan(basePlan);
    for (const key of [
      "rowMode",
      "band",
      "rowSmooth",
      "rowDetrend",
      "rowThresh",
      "rowGapMerge",
      "rowMinH",
      "rowHalf",
      "colSmooth",
      "colThresh",
      "twinMerge",
      "minPitch",
      "splitPitch",
      "minRunW",
      "openingW",
      "openingH",
      "probeH",
      "warm",
    ]) {
      expect(cfg[key]).not.toBeUndefined();
    }
  });

  it("scales column tolerances DOWN for a plan expecting MORE columns (narrower windows)", () => {
    const wide = levelCfgFromPlan({ ...basePlan, calibration: { ...basePlan.calibration } });
    const narrow = levelCfgFromPlan({
      ...basePlan,
      calibration: { ...basePlan.calibration, expectedCols: 26 },
    });
    expect(narrow.openingW).toBeLessThan(wide.openingW);
    expect(narrow.minPitch).toBeLessThan(wide.minPitch);
  });

  it("scales column tolerances UP for a plan expecting FEWER columns (wider windows)", () => {
    const wide = levelCfgFromPlan({ ...basePlan, calibration: { ...basePlan.calibration } });
    const fewer = levelCfgFromPlan({
      ...basePlan,
      calibration: { ...basePlan.calibration, expectedCols: 6 },
    });
    expect(fewer.openingW).toBeGreaterThan(wide.openingW);
  });

  it("clamps the scale so an extreme expectedCols never collapses a tolerance to zero", () => {
    const extreme = levelCfgFromPlan({
      ...basePlan,
      calibration: { ...basePlan.calibration, expectedCols: 1000 },
    });
    expect(extreme.openingW).toBeGreaterThan(0);
    expect(extreme.minPitch).toBeGreaterThan(0);
  });
});

describe("defaultWarm", () => {
  it("flags a warm-glow pixel and rejects a cool one", () => {
    expect(defaultWarm(200, 150, 100)).toBe(true);
    expect(defaultWarm(10, 10, 10)).toBe(false);
  });
});
