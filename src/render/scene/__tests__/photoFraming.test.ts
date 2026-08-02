import { describe, expect, it } from "vitest";
import type { Box, PhotoSceneView } from "@render/ui/photo/photoSeam";
import {
  BRACKET_ARM_MAX,
  BRACKET_ARM_MIN,
  bracketArm,
  drawnPlateRegion,
  plateUvRect,
  projectBox,
} from "../photoFraming";

const PLATE = { w: 100, h: 56.25 } as const;

function sceneView(over: Partial<PhotoSceneView> = {}): PhotoSceneView {
  return {
    phase: "ACTIVE",
    posture: "RAISED",
    focalMm: 300,
    film: 6,
    suspicion: 0,
    plate: { plateId: "belliard_passage", poseIds: [] },
    viewfinder: { cx: 50, cy: 28.125, w: 20, h: 11.25 },
    subjectBox: { cx: 50, cy: 28.125, w: 8, h: 6 },
    bracket: "solid",
    headlightsLit: false,
    ...over,
  };
}

describe("drawnPlateRegion", () => {
  it("shows the WHOLE plate while LOWERED (the wide reacquire preview)", () => {
    const region = drawnPlateRegion(sceneView({ posture: "LOWERED" }), PLATE);
    expect(region).toEqual({ cx: 50, cy: 28.125, w: 100, h: 56.25 });
  });

  it("shows the tick's viewfinder while RAISED, sway included, unmodified", () => {
    const viewfinder: Box = { cx: 61.5, cy: 30, w: 11.67, h: 6.564 };
    expect(drawnPlateRegion(sceneView({ viewfinder }), PLATE)).toBe(viewfinder);
  });
});

describe("projectBox", () => {
  it("maps a box centred in the region to the centre of the frame", () => {
    const rect = projectBox(
      { cx: 50, cy: 28.125, w: 10, h: 5.625 },
      drawnPlateRegion(sceneView(), PLATE),
    );
    expect(rect.x + rect.w / 2).toBeCloseTo(0.5, 10);
    expect(rect.y + rect.h / 2).toBeCloseTo(0.5, 10);
  });

  it("flips y: a box HIGH on the plate lands near the TOP of the frame (small y)", () => {
    const region = drawnPlateRegion(sceneView({ posture: "LOWERED" }), PLATE);
    const high = projectBox({ cx: 50, cy: 50, w: 4, h: 4 }, region);
    const low = projectBox({ cx: 50, cy: 6, w: 4, h: 4 }, region);
    expect(high.y).toBeLessThan(low.y);
    expect(high.y).toBeCloseTo((56.25 - 52) / 56.25, 10);
  });

  it("scales with the viewfinder: a tighter frame magnifies the same subject", () => {
    const wide = projectBox(sceneView().subjectBox, { cx: 50, cy: 28.125, w: 40, h: 22.5 });
    const tight = projectBox(sceneView().subjectBox, { cx: 50, cy: 28.125, w: 20, h: 11.25 });
    expect(tight.w).toBeCloseTo(wide.w * 2, 10);
    expect(tight.h).toBeCloseTo(wide.h * 2, 10);
  });

  it("never returns NaN on a degenerate region (a NaN rect would vanish silently)", () => {
    const rect = projectBox(sceneView().subjectBox, { cx: 0, cy: 0, w: 0, h: 0 });
    expect(Object.values(rect).every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe("plateUvRect", () => {
  it("covers the full texture when the whole plate is drawn", () => {
    expect(plateUvRect(drawnPlateRegion(sceneView({ posture: "LOWERED" }), PLATE), PLATE)).toEqual({
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
    });
  });

  it("crops to the viewfinder in y-UP UV space", () => {
    const uv = plateUvRect({ cx: 20, cy: 14.0625, w: 20, h: 11.25 }, PLATE);
    expect(uv.offsetX).toBeCloseTo(0.1, 10);
    expect(uv.offsetY).toBeCloseTo(0.15, 10);
    expect(uv.repeatX).toBeCloseTo(0.2, 10);
    expect(uv.repeatY).toBeCloseTo(0.2, 10);
  });
});

describe("bracketArm", () => {
  it("scales with the bracketed box, clamped at both ends", () => {
    expect(bracketArm({ x: 0, y: 0, w: 0.2, h: 0.2 })).toBeCloseTo(0.056, 10);
    expect(bracketArm({ x: 0, y: 0, w: 0.001, h: 0.001 })).toBe(BRACKET_ARM_MIN);
    expect(bracketArm({ x: 0, y: 0, w: 1, h: 1 })).toBe(BRACKET_ARM_MAX);
  });

  it("is finite on a degenerate rect", () => {
    expect(bracketArm({ x: 0, y: 0, w: Number.NaN, h: 1 })).toBe(BRACKET_ARM_MIN);
  });
});
