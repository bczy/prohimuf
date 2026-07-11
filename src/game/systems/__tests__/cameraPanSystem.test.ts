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
  it("starts centred and at rest on both axes", () => {
    expect(createCameraPan()).toEqual({ x: 0, y: 0, vx: 0, vy: 0 });
  });
});

describe("applyDrag", () => {
  it("moves the camera by the drag delta on X", () => {
    const pan = applyDrag(createCameraPan(), { x: 3, y: 0 }, { x: 10, y: 10 });
    expect(pan.x).toBe(3);
  });

  it("moves the camera by the drag delta on Y", () => {
    const pan = applyDrag(createCameraPan(), { x: 0, y: 3 }, { x: 10, y: 10 });
    expect(pan.y).toBe(3);
  });

  it("moves both axes on a diagonal drag", () => {
    const pan = applyDrag(createCameraPan(), { x: 2, y: -4 }, { x: 10, y: 10 });
    expect(pan).toEqual({ x: 2, y: -4, vx: 0, vy: 0 });
  });

  it("clamps X to the pan range on both sides", () => {
    expect(applyDrag(createCameraPan(), { x: 1000, y: 0 }, { x: 5, y: 5 }).x).toBe(5);
    expect(applyDrag(createCameraPan(), { x: -1000, y: 0 }, { x: 5, y: 5 }).x).toBe(-5);
  });

  it("clamps Y to the pan range on both sides", () => {
    expect(applyDrag(createCameraPan(), { x: 0, y: 1000 }, { x: 5, y: 5 }).y).toBe(5);
    expect(applyDrag(createCameraPan(), { x: 0, y: -1000 }, { x: 5, y: 5 }).y).toBe(-5);
  });

  it("kills any inertia on both axes while the finger is down", () => {
    const gliding = releaseFlick(createCameraPan(), { x: 8, y: 6 });
    const dragged = applyDrag(gliding, { x: 1, y: 1 }, { x: 10, y: 10 });
    expect(dragged.vx).toBe(0);
    expect(dragged.vy).toBe(0);
  });

  it("stays centred on X when the view covers the whole level (rangeX = 0)", () => {
    expect(applyDrag(createCameraPan(), { x: 2, y: 0 }, { x: 0, y: 10 }).x).toBe(0);
  });

  it("stays centred on Y when the view covers the whole level (rangeY = 0)", () => {
    expect(applyDrag(createCameraPan(), { x: 0, y: 2 }, { x: 10, y: 0 }).y).toBe(0);
  });
});

describe("releaseFlick", () => {
  it("seeds velocity on both axes without moving the camera", () => {
    const pan = releaseFlick({ x: 2, y: -3, vx: 0, vy: 0 }, { x: -6, y: 4 });
    expect(pan).toEqual({ x: 2, y: -3, vx: -6, vy: 4 });
  });
});

describe("tickCameraPan", () => {
  it("is a no-op at rest on both axes", () => {
    const pan = { x: 1.5, y: -2, vx: 0, vy: 0 };
    expect(tickCameraPan(pan, 0.016, { x: 10, y: 10 })).toBe(pan);
  });

  it("integrates X position along the velocity", () => {
    const pan = tickCameraPan(releaseFlick(createCameraPan(), { x: 10, y: 0 }), 0.016, {
      x: 10,
      y: 10,
    });
    expect(pan.x).toBeGreaterThan(0);
  });

  it("integrates Y position along the velocity", () => {
    const pan = tickCameraPan(releaseFlick(createCameraPan(), { x: 0, y: 10 }), 0.016, {
      x: 10,
      y: 10,
    });
    expect(pan.y).toBeGreaterThan(0);
  });

  it("halves the X velocity after one half-life (ln2 / λ)", () => {
    const halfLife = Math.LN2 / PAN_DAMPING;
    const pan = tickCameraPan(releaseFlick(createCameraPan(), { x: 10, y: 0 }), halfLife, {
      x: 100,
      y: 100,
    });
    expect(pan.vx).toBeCloseTo(5, 6);
  });

  it("halves the Y velocity after one half-life (ln2 / λ)", () => {
    const halfLife = Math.LN2 / PAN_DAMPING;
    const pan = tickCameraPan(releaseFlick(createCameraPan(), { x: 0, y: 10 }), halfLife, {
      x: 100,
      y: 100,
    });
    expect(pan.vy).toBeCloseTo(5, 6);
  });

  it("decays X velocity independently of dt slicing", () => {
    const whole = tickCameraPan(releaseFlick(createCameraPan(), { x: 10, y: 0 }), 0.2, {
      x: 100,
      y: 100,
    });
    let sliced = releaseFlick(createCameraPan(), { x: 10, y: 0 });
    sliced = tickCameraPan(sliced, 0.1, { x: 100, y: 100 });
    sliced = tickCameraPan(sliced, 0.1, { x: 100, y: 100 });
    expect(sliced.vx).toBeCloseTo(whole.vx, 6);
  });

  it("decays Y velocity independently of dt slicing", () => {
    const whole = tickCameraPan(releaseFlick(createCameraPan(), { x: 0, y: 10 }), 0.2, {
      x: 100,
      y: 100,
    });
    let sliced = releaseFlick(createCameraPan(), { x: 0, y: 10 });
    sliced = tickCameraPan(sliced, 0.1, { x: 100, y: 100 });
    sliced = tickCameraPan(sliced, 0.1, { x: 100, y: 100 });
    expect(sliced.vy).toBeCloseTo(whole.vy, 6);
  });

  it("zeroes X velocity when hitting an X level bound", () => {
    const pan = tickCameraPan({ x: 4.9, y: 0, vx: 100, vy: 0 }, 0.1, { x: 5, y: 100 });
    expect(pan.x).toBe(5);
    expect(pan.vx).toBe(0);
  });

  it("zeroes Y velocity when hitting a Y level bound", () => {
    const pan = tickCameraPan({ x: 0, y: 4.9, vx: 0, vy: 100 }, 0.1, { x: 100, y: 5 });
    expect(pan.y).toBe(5);
    expect(pan.vy).toBe(0);
  });

  it("comes to a deterministic rest on X below the epsilon threshold", () => {
    const pan = tickCameraPan({ x: 0, y: 0, vx: PAN_REST_EPSILON, vy: 0 }, 0.016, { x: 10, y: 10 });
    expect(pan.vx).toBe(0);
  });

  it("comes to a deterministic rest on Y below the epsilon threshold", () => {
    const pan = tickCameraPan({ x: 0, y: 0, vx: 0, vy: PAN_REST_EPSILON }, 0.016, { x: 10, y: 10 });
    expect(pan.vy).toBe(0);
  });

  it("X clamp does not zero vy (cross-axis independence)", () => {
    // X is at its bound and will clamp; Y glides freely with headroom.
    const pan = tickCameraPan({ x: 4.9, y: 0, vx: 100, vy: 10 }, 0.1, { x: 5, y: 100 });
    expect(pan.vx).toBe(0);
    expect(pan.vy).not.toBe(0);
  });

  it("Y clamp does not zero vx (cross-axis independence)", () => {
    // Y is at its bound and will clamp; X glides freely with headroom.
    const pan = tickCameraPan({ x: 0, y: 4.9, vx: 10, vy: 100 }, 0.1, { x: 100, y: 5 });
    expect(pan.vy).toBe(0);
    expect(pan.vx).not.toBe(0);
  });
});
