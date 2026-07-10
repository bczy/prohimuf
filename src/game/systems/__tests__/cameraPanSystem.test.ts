import { describe, it, expect } from "vitest";
import {
  createCameraPan,
  applyDrag,
  releaseFlick,
  tickCameraPan,
  PAN_DAMPING,
  PAN_REST_EPSILON,
} from "@game/systems/cameraPanSystem";

describe("createCameraPan", () => {
  it("starts centred and at rest", () => {
    expect(createCameraPan()).toEqual({ x: 0, vx: 0 });
  });
});

describe("applyDrag", () => {
  it("moves the camera by the drag delta", () => {
    const pan = applyDrag(createCameraPan(), 3, 10);
    expect(pan.x).toBe(3);
  });

  it("clamps to the pan range on both sides", () => {
    expect(applyDrag(createCameraPan(), 1000, 5).x).toBe(5);
    expect(applyDrag(createCameraPan(), -1000, 5).x).toBe(-5);
  });

  it("kills any inertia while the finger is down", () => {
    const gliding = releaseFlick(createCameraPan(), 8);
    expect(applyDrag(gliding, 1, 10).vx).toBe(0);
  });

  it("stays centred when the view covers the whole level (rangeX = 0)", () => {
    expect(applyDrag(createCameraPan(), 2, 0).x).toBe(0);
  });
});

describe("releaseFlick", () => {
  it("seeds velocity without moving the camera", () => {
    const pan = releaseFlick({ x: 2, vx: 0 }, -6);
    expect(pan).toEqual({ x: 2, vx: -6 });
  });
});

describe("tickCameraPan", () => {
  it("is a no-op at rest", () => {
    const pan = { x: 1.5, vx: 0 };
    expect(tickCameraPan(pan, 0.016, 10)).toEqual(pan);
  });

  it("integrates position along the velocity", () => {
    const pan = tickCameraPan(releaseFlick(createCameraPan(), 10), 0.016, 10);
    expect(pan.x).toBeGreaterThan(0);
  });

  it("halves the velocity after one half-life (ln2 / λ)", () => {
    const halfLife = Math.LN2 / PAN_DAMPING;
    const pan = tickCameraPan(releaseFlick(createCameraPan(), 10), halfLife, 100);
    expect(pan.vx).toBeCloseTo(5, 6);
  });

  it("decays velocity independently of dt slicing", () => {
    const whole = tickCameraPan(releaseFlick(createCameraPan(), 10), 0.2, 100);
    let sliced = releaseFlick(createCameraPan(), 10);
    sliced = tickCameraPan(sliced, 0.1, 100);
    sliced = tickCameraPan(sliced, 0.1, 100);
    expect(sliced.vx).toBeCloseTo(whole.vx, 6);
  });

  it("zeroes velocity when hitting a level bound", () => {
    const pan = tickCameraPan({ x: 4.9, vx: 100 }, 0.1, 5);
    expect(pan.x).toBe(5);
    expect(pan.vx).toBe(0);
  });

  it("comes to a deterministic rest below the epsilon threshold", () => {
    const pan = tickCameraPan({ x: 0, vx: PAN_REST_EPSILON }, 0.016, 10);
    expect(pan.vx).toBe(0);
  });
});
