import { describe, it, expect } from "vitest";
import { recoilTransform, wheelAngle, identityTransform, type RecoilParams } from "../deform";

/**
 * Pure, DOM-free coverage of the procedural deformation helper (SPIKE
 * animation-2d-pipeline). Locks the eased recoil shape (identity at rest → peak →
 * settle back to identity), the looping wheel angle, and the degenerate-input
 * guards that mirror flipbookFrame — collapsing to the identity / zero rotation
 * rather than emitting a NaN transform.
 *
 * The recoil peaks at 25% of its duration (RECOIL_PEAK); tests probe t=0, that
 * peak, and t≥duration where the kick is fully spent.
 */
const RECOIL: RecoilParams = {
  duration: 0.2,
  kick: 0.1,
  lift: 0.05,
  tilt: 0.15,
  squash: 0.08,
};

describe("identityTransform", () => {
  it("is the no-op transform and a fresh object each call", () => {
    const a = identityTransform();
    expect(a).toEqual({ offsetX: 0, offsetY: 0, rotate: 0, scaleX: 1, scaleY: 1 });
    expect(identityTransform()).not.toBe(a); // caller may mutate safely
  });
});

describe("recoilTransform", () => {
  it("is the identity at t=0 (idle before the shot)", () => {
    expect(recoilTransform(0, 1, RECOIL)).toEqual(identityTransform());
  });

  it("reaches full kick at 25% of the duration (the action peak)", () => {
    const peak = recoilTransform(RECOIL.duration * 0.25, 1, RECOIL);
    // Aim right (dir +1) → kicks left (negative X), gun rides up and tilts back.
    expect(peak.offsetX).toBeCloseTo(-RECOIL.kick, 10);
    expect(peak.offsetY).toBeCloseTo(RECOIL.lift, 10);
    expect(peak.rotate).toBeCloseTo(RECOIL.tilt, 10);
    expect(peak.scaleY).toBeCloseTo(1 - RECOIL.squash, 10);
    expect(peak.scaleX).toBe(1);
  });

  it("mirrors the kick direction with the aim sign", () => {
    const t = RECOIL.duration * 0.25;
    const right = recoilTransform(t, 1, RECOIL); // aims right → kicks left
    const left = recoilTransform(t, -1, RECOIL); // aims left → kicks right
    expect(right.offsetX).toBeCloseTo(-left.offsetX, 10);
    expect(right.rotate).toBeCloseTo(-left.rotate, 10);
    // Lift and squash are aim-independent.
    expect(right.offsetY).toBeCloseTo(left.offsetY, 10);
    expect(right.scaleY).toBeCloseTo(left.scaleY, 10);
  });

  it("eases back to the identity by the end of the kick", () => {
    // Mid-settle the magnitude is between peak and rest…
    const mid = recoilTransform(RECOIL.duration * 0.6, 1, RECOIL);
    expect(Math.abs(mid.offsetX)).toBeGreaterThan(0);
    expect(Math.abs(mid.offsetX)).toBeLessThan(RECOIL.kick);
    // …and once spent it is exactly the identity again (idle after the shot).
    expect(recoilTransform(RECOIL.duration, 1, RECOIL)).toEqual(identityTransform());
    expect(recoilTransform(RECOIL.duration * 2, 1, RECOIL)).toEqual(identityTransform());
  });

  it("collapses to the identity for degenerate inputs", () => {
    expect(recoilTransform(-1, 1, RECOIL)).toEqual(identityTransform());
    expect(recoilTransform(NaN, 1, RECOIL)).toEqual(identityTransform());
    expect(recoilTransform(Infinity, 1, RECOIL)).toEqual(identityTransform());
    expect(recoilTransform(0.05, NaN, RECOIL)).toEqual(identityTransform());
    expect(recoilTransform(0.05, 1, { ...RECOIL, duration: 0 })).toEqual(identityTransform());
    expect(recoilTransform(0.05, 1, { ...RECOIL, duration: -1 })).toEqual(identityTransform());
  });
});

describe("wheelAngle", () => {
  it("advances monotonically then wraps every revolution", () => {
    // 1 rev/s: quarter turn at 0.25s, half at 0.5s, full turn wraps to 0 at 1s.
    expect(wheelAngle(0, 1)).toBeCloseTo(0, 10);
    expect(wheelAngle(0.25, 1)).toBeCloseTo(Math.PI / 2, 10);
    expect(wheelAngle(0.5, 1)).toBeCloseTo(Math.PI, 10);
    expect(wheelAngle(0.75, 1)).toBeCloseTo((3 * Math.PI) / 2, 10);
    expect(wheelAngle(1, 1)).toBeCloseTo(0, 10); // wrap
    expect(wheelAngle(1.25, 1)).toBeCloseTo(Math.PI / 2, 10); // second revolution
  });

  it("scales with the spin rate", () => {
    // Same 0.25s clock: 1 rev/s → quarter turn; 2 rev/s → half turn.
    expect(wheelAngle(0.25, 1)).toBeCloseTo(Math.PI / 2, 10);
    expect(wheelAngle(0.25, 2)).toBeCloseTo(Math.PI, 10);
  });

  it("offsets by phase (in revolutions) to de-sync sprites", () => {
    expect(wheelAngle(0, 1, 0.25)).toBeCloseTo(Math.PI / 2, 10);
    // A whole-revolution phase is a no-op (wraps back).
    expect(wheelAngle(0.25, 1, 1)).toBeCloseTo(Math.PI / 2, 10);
  });

  it("returns 0 for non-positive rate", () => {
    expect(wheelAngle(0.5, 0)).toBe(0);
    expect(wheelAngle(0.5, -2)).toBe(0);
  });

  it("returns 0 for a negative or non-finite clock", () => {
    expect(wheelAngle(-1, 1)).toBe(0);
    expect(wheelAngle(NaN, 1)).toBe(0);
    expect(wheelAngle(Infinity, 1)).toBe(0);
  });

  it("treats a non-finite phase as zero", () => {
    expect(wheelAngle(0.25, 1, NaN)).toBeCloseTo(Math.PI / 2, 10);
  });
});
