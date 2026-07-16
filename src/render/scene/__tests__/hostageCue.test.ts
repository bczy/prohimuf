import { describe, it, expect } from "vitest";
import { clamp01, hostageTension, lerpHex, hostageColor, energyFloater } from "../hostageCue";

describe("hostageTension", () => {
  it("is 0 at full time remaining and 1 at zero", () => {
    expect(hostageTension(3.5, 3.5)).toBe(0);
    expect(hostageTension(0, 3.5)).toBe(1);
  });

  it("rises monotonically as the countdown runs down", () => {
    const early = hostageTension(3, 3.5);
    const mid = hostageTension(1.75, 3.5);
    const late = hostageTension(0.4, 3.5);
    expect(early).toBeLessThan(mid);
    expect(mid).toBeLessThan(late);
    expect(mid).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range remaining and degrades a bad reference to full tension", () => {
    expect(hostageTension(10, 3.5)).toBe(0); // more than full ⇒ still calm
    expect(hostageTension(-1, 3.5)).toBe(1); // past zero ⇒ full tension
    expect(hostageTension(1, 0)).toBe(1); // zero reference ⇒ full tension
  });
});

describe("clamp01", () => {
  it("clamps to the unit interval", () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(0.3)).toBe(0.3);
  });
});

describe("lerpHex", () => {
  it("returns the endpoints at t=0 and t=1", () => {
    expect(lerpHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpHex("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("interpolates the midpoint and clamps t", () => {
    expect(lerpHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(lerpHex("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});

describe("hostageColor", () => {
  it("stays calm pink at zero tension and warms toward red as tension rises", () => {
    const calm = hostageColor(0, 0, false);
    const tense = hostageColor(0.95, 0, false);
    expect(calm).toBe("#ff8ad8");
    // Green + blue drop sharply toward alarm red as tension climbs.
    expect(tense).not.toBe(calm);
    expect(parseInt(tense.slice(3, 5), 16)).toBeLessThan(parseInt(calm.slice(3, 5), 16));
  });

  it("strobes red↔white when alarm is set, driven by the pulse phase", () => {
    expect(hostageColor(1, 0, true)).toBe("#ff1e2d");
    expect(hostageColor(1, 1, true)).toBe("#ffffff");
  });
});

describe("energyFloater", () => {
  it("returns null for zero or absent delta", () => {
    expect(energyFloater(0)).toBeNull();
    expect(energyFloater(undefined)).toBeNull();
  });

  it("formats a loss warm-red and a gain acid-green", () => {
    expect(energyFloater(-25)).toEqual({ text: "−25 ⚡", color: "#ff6b6b" });
    expect(energyFloater(10)).toEqual({ text: "+10 ⚡", color: "#bfffd0" });
  });
});
