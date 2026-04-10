import { describe, it, expect } from "vitest";
import { tickTimer } from "../timer";

describe("tickTimer", () => {
  it("decrements timeRemaining by delta", () => {
    expect(tickTimer(10, 1)).toBe(9);
  });

  it("clamps to 0 — does not go negative", () => {
    expect(tickTimer(0.5, 1)).toBe(0);
  });

  it("returns exactly 0 when delta equals remaining time", () => {
    expect(tickTimer(5, 5)).toBe(0);
  });
});
