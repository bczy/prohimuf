import { describe, it, expect } from "vitest";
import {
  DEFAULT_SIGNAL,
  TRAFFIC_PHASES,
  signalKey,
  trafficSignalPhase,
  type SignalState,
} from "../trafficSignal";

const CYCLE = TRAFFIC_PHASES.reduce((s, p) => s + p.dur, 0);

describe("trafficSignalPhase", () => {
  it("returns the resting aspect (vehicle green, pedestrian red) at t=0", () => {
    expect(trafficSignalPhase(0)).toEqual({ vehicle: "green", ped: "red" });
  });

  it("walks through green → amber → red(walk) → red(clearance) across the cycle", () => {
    // Sample the mid-point of each declared phase.
    let acc = 0;
    for (const phase of TRAFFIC_PHASES) {
      const mid = acc + phase.dur / 2;
      expect(trafficSignalPhase(mid)).toEqual({ vehicle: phase.vehicle, ped: phase.ped });
      acc += phase.dur;
    }
  });

  it("is periodic over the full cycle", () => {
    for (const t of [0.3, 3.1, 7.7, 11.2]) {
      expect(trafficSignalPhase(t)).toEqual(trafficSignalPhase(t + CYCLE));
      expect(trafficSignalPhase(t)).toEqual(trafficSignalPhase(t + CYCLE * 3));
    }
  });

  it("handles negative times (wraps into the cycle)", () => {
    expect(trafficSignalPhase(-1)).toEqual(trafficSignalPhase(CYCLE - 1));
  });

  it("falls back to the resting aspect for non-finite input", () => {
    expect(trafficSignalPhase(Number.NaN)).toEqual(DEFAULT_SIGNAL);
    expect(trafficSignalPhase(Number.POSITIVE_INFINITY)).toEqual(DEFAULT_SIGNAL);
  });

  it("never lets both heads be 'go' at once (vehicle green/amber ⇒ pedestrian red)", () => {
    // Sample densely across a cycle: the interlock must hold at every instant.
    for (let t = 0; t < CYCLE; t += 0.05) {
      const s = trafficSignalPhase(t);
      if (s.vehicle === "green" || s.vehicle === "amber") {
        expect(s.ped, `t=${t.toFixed(2)}: pedestrian must be red while vehicles move`).toBe("red");
      }
      if (s.ped === "green") {
        expect(s.vehicle, `t=${t.toFixed(2)}: vehicles must be red while pedestrian walks`).toBe(
          "red",
        );
      }
    }
  });
});

describe("signalKey", () => {
  it("is stable and distinct per aspect", () => {
    const a: SignalState = { vehicle: "green", ped: "red" };
    const b: SignalState = { vehicle: "red", ped: "green" };
    expect(signalKey(a)).toBe(signalKey({ vehicle: "green", ped: "red" }));
    expect(signalKey(a)).not.toBe(signalKey(b));
  });
});
