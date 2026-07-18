import { describe, it, expect } from "vitest";
import {
  clamp01,
  lerpHex,
  peekTellVisual,
  captorTint,
  hostageAlarmColor,
  energyFloater,
  blownPeeksProximity,
  hostageDistressTint,
  CAPTOR_WON_TINT,
} from "../hostageCue";

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

describe("peekTellVisual", () => {
  it("is inactive while COVERED with no telegraph (no tell to draw)", () => {
    const v = peekTellVisual(false, "COVERED", 0.5, false);
    expect(v.active).toBe(false);
    expect(v.intensity).toBe(0);
  });

  it("appears on the pre-peek telegraph BEFORE the exposure (anticipation)", () => {
    const v = peekTellVisual(true, "COVERED", 0.5, false);
    expect(v.active).toBe(true);
    expect(v.intensity).toBeGreaterThan(0);
  });

  it("reads louder during the open peek than during the wind-up", () => {
    const windUp = peekTellVisual(true, "COVERED", 1, false);
    const open = peekTellVisual(true, "PEEKING", 1, false);
    // Same pulse phase: the open danger window must out-read the wind-up.
    expect(open.intensity).toBeGreaterThan(windUp.intensity);
    // Colour steps calm-tell → alarm between the two beats (reinforcement only).
    expect(open.color).not.toBe(windUp.color);
  });

  it("under reduced motion is a STEADY appearing cue (pulse ignored), signal preserved", () => {
    const a = peekTellVisual(true, "PEEKING", 0, true);
    const b = peekTellVisual(true, "PEEKING", 1, true);
    // No dependence on the pulse phase ⇒ no strobe.
    expect(a.intensity).toBe(b.intensity);
    expect(a.active).toBe(true);
    // The wind-up still shows and stays distinguishable from the open window.
    const windUp = peekTellVisual(true, "COVERED", 0.5, true);
    expect(windUp.active).toBe(true);
    expect(windUp.intensity).toBeLessThan(a.intensity);
  });

  it("is perceptible via intensity alone (not colour) — grayscale-safe", () => {
    // Absent vs present is a step-change in intensity regardless of hue.
    const absent = peekTellVisual(false, "COVERED", 0.5, false);
    const present = peekTellVisual(false, "PEEKING", 0.5, false);
    expect(absent.intensity).toBe(0);
    expect(present.intensity).toBeGreaterThan(0);
  });
});

describe("captorTint", () => {
  it("reads calm pink while COVERED with no telegraph", () => {
    expect(captorTint("COVERED", false)).toBe("#ff8ad8");
  });

  it("warms on the telegraph and leans alarm during the peek", () => {
    const calm = captorTint("COVERED", false);
    const telegraph = captorTint("COVERED", true);
    const peek = captorTint("PEEKING", false);
    // Green channel drops as the tint warms toward alarm red.
    const g = (hex: string): number => parseInt(hex.slice(3, 5), 16);
    expect(g(telegraph)).toBeLessThan(g(calm));
    expect(g(peek)).toBeLessThan(g(telegraph));
  });
});

describe("hostageAlarmColor", () => {
  it("strobes alarm↔white on the pulse under motion", () => {
    expect(hostageAlarmColor(0, false)).toBe("#ff1e2d");
    expect(hostageAlarmColor(1, false)).toBe("#ffffff");
  });

  it("degrades to a STEADY alarm red under reduced motion (no strobe)", () => {
    expect(hostageAlarmColor(0, true)).toBe("#ff1e2d");
    expect(hostageAlarmColor(1, true)).toBe("#ff1e2d");
  });
});

describe("blownPeeksProximity", () => {
  it("is 0 at no blown peeks and 1 at the cap", () => {
    expect(blownPeeksProximity(0, 3)).toBe(0);
    expect(blownPeeksProximity(3, 3)).toBe(1);
  });

  it("rises monotonically with each blown peek toward the cap", () => {
    const a = blownPeeksProximity(1, 4);
    const b = blownPeeksProximity(2, 4);
    const c = blownPeeksProximity(3, 4);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("clamps past the cap and guards a non-positive cap (total render)", () => {
    expect(blownPeeksProximity(5, 3)).toBe(1);
    expect(blownPeeksProximity(1, 0)).toBe(0);
  });
});

describe("hostageDistressTint", () => {
  it("reads untinted white with no blown peeks (art as authored)", () => {
    expect(hostageDistressTint(0)).toBe("#ffffff");
  });

  it("warms toward alarm red as the execution nears (green channel drops)", () => {
    const g = (hex: string): number => parseInt(hex.slice(3, 5), 16);
    const calm = hostageDistressTint(0);
    const mid = hostageDistressTint(0.5);
    const near = hostageDistressTint(1);
    expect(g(mid)).toBeLessThan(g(calm));
    expect(g(near)).toBeLessThan(g(mid));
  });

  it("stops short of full alarm so the LOST execution strobe stays a distinct step", () => {
    // At full proximity it is only 70% of the way to ALARM (#ff1e2d), never past it.
    const g = (hex: string): number => parseInt(hex.slice(3, 5), 16);
    expect(g(hostageDistressTint(1))).toBeGreaterThan(g("#ff1e2d"));
  });
});

describe("CAPTOR_WON_TINT", () => {
  it("is a green-leaning win tint, clearly disjoint from the alarm red", () => {
    const [r, g, b] = [
      parseInt(CAPTOR_WON_TINT.slice(1, 3), 16),
      parseInt(CAPTOR_WON_TINT.slice(3, 5), 16),
      parseInt(CAPTOR_WON_TINT.slice(5, 7), 16),
    ];
    // Green dominant → reads as resolved/win, never the red-dominant PEEKING danger.
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    expect(CAPTOR_WON_TINT).not.toBe("#ff1e2d");
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
