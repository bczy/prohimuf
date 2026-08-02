import { describe, expect, it } from "vitest";
import {
  PLATE_FRAGMENT_SHADER,
  SWEEP_HALF_WIDTH,
  createPlateMaterial,
  sweepBandCentre,
} from "../photoPlateMaterial";

describe("sweepBandCentre", () => {
  it("travels the band across the frame, entering and leaving off-screen", () => {
    expect(sweepBandCentre(0)).toBeCloseTo(-SWEEP_HALF_WIDTH, 10);
    expect(sweepBandCentre(0.5)).toBeCloseTo(0.5, 10);
    expect(sweepBandCentre(1)).toBeCloseTo(1 + SWEEP_HALF_WIDTH, 10);
  });

  it("is monotone in the phase (the sweep never doubles back)", () => {
    const samples = [0, 0.2, 0.4, 0.6, 0.8, 1].map(sweepBandCentre);
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i] ?? 0).toBeGreaterThan(samples[i - 1] ?? 0);
    }
  });

  it("clamps a hostile phase instead of parking the band inside the frame", () => {
    expect(sweepBandCentre(-3)).toBeCloseTo(-SWEEP_HALF_WIDTH, 10);
    expect(sweepBandCentre(9)).toBeCloseTo(1 + SWEEP_HALF_WIDTH, 10);
    expect(sweepBandCentre(Number.NaN)).toBeCloseTo(-SWEEP_HALF_WIDTH, 10);
  });
});

describe("the plate material (lead-art sweep ruling)", () => {
  it("burns the toner through a moving HALFTONE threshold, not an additive layer", () => {
    // The dot mask is what makes the falloff dithered; `mix(uPaper, …)` is the burn.
    expect(PLATE_FRAGMENT_SHADER).toContain("fract(vUv * uGrid)");
    expect(PLATE_FRAGMENT_SHADER).toContain("mix(uPaper, plate, keep)");
  });

  it("adds no blended coverage: opaque, no additive blending, no glow", () => {
    const material = createPlateMaterial();
    expect(material.transparent).toBe(false);
    expect(material.blending).toBe(1); // NormalBlending — three's default, never Additive
    expect(PLATE_FRAGMENT_SHADER).not.toMatch(/\bAdditive|1\.0 - \(1\.0 - /);
    material.dispose();
  });

  it("takes the band position from a UNIFORM — no clock lives in the shader (F11/AC10)", () => {
    expect(PLATE_FRAGMENT_SHADER).toContain("uniform float uSweepCentre;");
    // A shader-side time uniform would be a second clock and would not freeze on pause.
    expect(PLATE_FRAGMENT_SHADER).not.toMatch(/uniform float u?[Tt]ime|elapsedTime/);
  });

  it("starts with the band OFF and off-frame, so a cold surface tells nothing", () => {
    const material = createPlateMaterial();
    expect(material.uniforms.uSweep.value).toBe(0);
    expect(material.uniforms.uSweepCentre.value).toBeCloseTo(-SWEEP_HALF_WIDTH, 10);
    expect(material.uniforms.uHasMap.value).toBe(0);
    material.dispose();
  });
});
