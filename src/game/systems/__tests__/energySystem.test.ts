import { describe, it, expect } from "vitest";
import { applyEnergy, ENERGY_MAX, ENERGY_MIN, ENERGY_INITIAL } from "@game/systems/energySystem";

describe("energySystem — applyEnergy (pure clamp [0,100])", () => {
  it("adds a delta within range", () => {
    expect(applyEnergy(100, -25)).toBe(75);
    expect(applyEnergy(50, -10)).toBe(40);
    expect(applyEnergy(40, 5)).toBe(45);
  });

  it("clamps at the floor — energy never goes below 0", () => {
    expect(applyEnergy(10, -25)).toBe(ENERGY_MIN);
    expect(applyEnergy(0, -10)).toBe(0);
  });

  it("clamps at the ceiling — energy never exceeds 100", () => {
    expect(applyEnergy(90, 25)).toBe(ENERGY_MAX);
    expect(applyEnergy(100, 5)).toBe(100);
  });

  it("a zero delta is a no-op", () => {
    expect(applyEnergy(63, 0)).toBe(63);
  });

  it("the initial value is a full bar", () => {
    expect(ENERGY_INITIAL).toBe(100);
    expect(ENERGY_MAX).toBe(100);
    expect(ENERGY_MIN).toBe(0);
  });
});
