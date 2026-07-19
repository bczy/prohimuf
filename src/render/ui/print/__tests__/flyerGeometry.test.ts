import { describe, it, expect } from "vitest";
import { flyerEdgePolygon, dogEarCorner, tapeStripPath } from "../flyerGeometry";
import {
  FLYER_MAX_WIDTH_PX,
  FLYER_EDGE_MAX_DEV_PX,
  FLYER_EDGE_SEED,
  TAPE_WIDTH_PX,
} from "../tokens";
import type { Corner } from "../TapeCorner";

/**
 * Pins the deterministic flyer-materiality geometry (art-direction §2bis.2, ADR-0049): the
 * hand-cut edge polygon stays within its ≤3px amplitude budget, is stable per index, and
 * varies between flyers; the dog-ear lookup is stable; the tape strip frays only at its two
 * tips. Pure functions, no DOM — the render surfaces only paint these strings.
 */

// A5 reference box the deviations are budgeted against — must match flyerGeometry.
const REF_W = FLYER_MAX_WIDTH_PX;
const REF_H = (FLYER_MAX_WIDTH_PX * 210) / 148;
const EPS = 1e-6;

// The ideal rectangle vertices (corners + edge mid-points) the waver perturbs from.
const NOMINAL: readonly (readonly [number, number])[] = [
  [0, 0],
  [50, 0],
  [100, 0],
  [100, 50],
  [100, 100],
  [50, 100],
  [0, 100],
  [0, 50],
];

function parsePoints(svgPoints: string): { x: number; y: number }[] {
  return svgPoints.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x ?? NaN, y: y ?? NaN };
  });
}

// Smallest px distance from a 0–100 vertex to any ideal rectangle vertex.
function deviationPx(p: { x: number; y: number }): number {
  let best = Infinity;
  for (const [nx, ny] of NOMINAL) {
    const dx = ((p.x - nx) / 100) * REF_W;
    const dy = ((p.y - ny) / 100) * REF_H;
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

describe("flyerEdgePolygon", () => {
  it("is stable for a given index", () => {
    expect(flyerEdgePolygon(0)).toEqual(flyerEdgePolygon(0));
    expect(flyerEdgePolygon(2)).toEqual(flyerEdgePolygon(2));
  });

  it("emits a matching clip-path and svg polygon with >= 4 vertices", () => {
    const edge = flyerEdgePolygon(1);
    expect(edge.clipPath.startsWith("polygon(")).toBe(true);
    const clipCount = edge.clipPath.split(",").length;
    const svg = parsePoints(edge.svgPoints);
    expect(svg.length).toBeGreaterThanOrEqual(4);
    expect(clipCount).toBe(svg.length);
    for (const p of svg) {
      expect(Number.isNaN(p.x)).toBe(false);
      expect(Number.isNaN(p.y)).toBe(false);
    }
  });

  it("keeps every vertex within the FLYER_EDGE_MAX_DEV_PX budget for all seeds", () => {
    for (let i = 0; i < FLYER_EDGE_SEED.length; i += 1) {
      for (const p of parsePoints(flyerEdgePolygon(i).svgPoints)) {
        expect(deviationPx(p)).toBeLessThanOrEqual(FLYER_EDGE_MAX_DEV_PX + EPS);
      }
    }
  });

  it("wraps the seed table by index (stable past the end)", () => {
    expect(flyerEdgePolygon(FLYER_EDGE_SEED.length)).toEqual(flyerEdgePolygon(0));
  });

  it("differs between indices while staying within budget", () => {
    expect(flyerEdgePolygon(0).svgPoints).not.toBe(flyerEdgePolygon(1).svgPoints);
    expect(flyerEdgePolygon(1).svgPoints).not.toBe(flyerEdgePolygon(2).svgPoints);
  });
});

describe("dogEarCorner", () => {
  it("is stable per index and returns a Corner or null", () => {
    const valid: readonly (Corner | null)[] = ["tl", "tr", "bl", "br", null];
    for (let i = 0; i < 6; i += 1) {
      expect(dogEarCorner(i)).toBe(dogEarCorner(i));
      expect(valid).toContain(dogEarCorner(i));
    }
  });
});

describe("tapeStripPath", () => {
  const CORNERS: readonly Corner[] = ["tl", "tr", "bl", "br"];
  const FRAY_MAX = 2; // 1–2px jags at the tips only (§2bis.2 pt6).

  it("is stable per corner and carries the token width", () => {
    for (const c of CORNERS) {
      expect(tapeStripPath(c)).toEqual(tapeStripPath(c));
      expect(tapeStripPath(c).width).toBe(TAPE_WIDTH_PX);
    }
  });

  it("frays only at the two tips — long edges stay straight", () => {
    for (const c of CORNERS) {
      const strip = tapeStripPath(c);
      const pts = parsePoints(strip.points);
      expect(pts.length).toBeGreaterThanOrEqual(4);
      for (const p of pts) {
        const onLongEdge = p.y === 0 || p.y === strip.width;
        const atTip = p.x <= FRAY_MAX + EPS || p.x >= strip.length - FRAY_MAX - EPS;
        // Every vertex is either on a straight long side or in a tip fray zone — never a
        // jag in the middle of a long edge.
        expect(onLongEdge || atTip).toBe(true);
      }
    }
  });

  it("places 1–2 wrinkle lines within the strip length", () => {
    for (const c of CORNERS) {
      const strip = tapeStripPath(c);
      expect(strip.wrinkles.length).toBeGreaterThanOrEqual(1);
      expect(strip.wrinkles.length).toBeLessThanOrEqual(2);
      for (const x of strip.wrinkles) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(strip.length);
      }
    }
  });
});
