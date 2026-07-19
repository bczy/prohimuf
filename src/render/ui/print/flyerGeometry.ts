/**
 * Deterministic flyer-materiality geometry (art-direction §2bis.2, ADR-0049). Pure,
 * unit-tested, render-only: turns the indexed seed tokens into the clip-path / SVG
 * strings the flyer surfaces paint. NO Math.random — every shape is a function of the
 * list index (or corner) so the wall is byte-stable across renders.
 */
import {
  FLYER_MAX_WIDTH_PX,
  FLYER_EDGE_MAX_DEV_PX,
  FLYER_EDGE_SEED,
  FLYER_DOG_EAR_CORNER,
  TAPE_WIDTH_PX,
  TAPE_FRAY_SEED,
} from "./tokens";
import type { Corner } from "./TapeCorner";

// The A5 reference box the ≤3px edge deviations are budgeted against. A narrower rendered
// flyer only shrinks the deviation, never grows it past the budget.
const REF_W = FLYER_MAX_WIDTH_PX;
const REF_H = (FLYER_MAX_WIDTH_PX * 210) / 148;

interface BaseVertex {
  readonly x: number;
  readonly y: number;
  /** Axis the cut waver runs on (corners deviate on one axis, mid-edges on the edge normal). */
  readonly axis: "x" | "y";
  /** Inward sign so the silhouette can only lose a sliver, never overflow the slot. */
  readonly sign: 1 | -1;
}

// 8 vertices clockwise from top-left: 4 corners + 4 edge mid-points (the mid-points give the
// slightly non-parallel "guillotine skew / scissor waver" edge). Coordinates are 0–100, shared
// verbatim by the clip-path polygon and the cut-line SVG (viewBox 0 0 100 100).
const BASE_VERTICES: readonly BaseVertex[] = [
  { x: 0, y: 0, axis: "x", sign: 1 }, // top-left
  { x: 50, y: 0, axis: "y", sign: 1 }, // top mid (waver down)
  { x: 100, y: 0, axis: "x", sign: -1 }, // top-right
  { x: 100, y: 50, axis: "x", sign: -1 }, // right mid (waver in)
  { x: 100, y: 100, axis: "x", sign: -1 }, // bottom-right
  { x: 50, y: 100, axis: "y", sign: -1 }, // bottom mid (waver up)
  { x: 0, y: 100, axis: "x", sign: 1 }, // bottom-left
  { x: 0, y: 50, axis: "x", sign: 1 }, // left mid (waver in)
];

const clampEdgeDev = (d: number): number => Math.max(0, Math.min(FLYER_EDGE_MAX_DEV_PX, d));
const round3 = (n: number): string => (Math.round(n * 1000) / 1000).toString();
const round2 = (n: number): string => (Math.round(n * 100) / 100).toString();

export interface FlyerEdge {
  /** `polygon(x% y%, …)` for the clipped `.paper`. */
  readonly clipPath: string;
  /** `x,y …` (0–100 space) for the shared cut-line `<polygon>`. */
  readonly svgPoints: string;
}

/**
 * The hand-cut silhouette for the flyer at list position `index`: a rounded-to-3dp polygon
 * whose every vertex sits within {@link FLYER_EDGE_MAX_DEV_PX} px of its ideal rectangle
 * position (measured against the A5 reference box). Stable per index.
 */
export function flyerEdgePolygon(index: number): FlyerEdge {
  const seed = FLYER_EDGE_SEED[index % FLYER_EDGE_SEED.length] ?? [];
  const pts = BASE_VERTICES.map((v, k) => {
    const dev = clampEdgeDev(seed[k] ?? 0);
    if (v.axis === "x") {
      return { x: v.x + (v.sign * dev * 100) / REF_W, y: v.y };
    }
    return { x: v.x, y: v.y + (v.sign * dev * 100) / REF_H };
  });
  const clipPath = `polygon(${pts.map((p) => `${round3(p.x)}% ${round3(p.y)}%`).join(", ")})`;
  const svgPoints = pts.map((p) => `${round3(p.x)},${round3(p.y)}`).join(" ");
  return { clipPath, svgPoints };
}

/** The folded corner for flyer `index`, or `null` when the sheet lies flat. */
export function dogEarCorner(index: number): Corner | null {
  return FLYER_DOG_EAR_CORNER[index % FLYER_DOG_EAR_CORNER.length] ?? null;
}

// Length that bridges the corner — masking-tape proportions (wider, short), width is the
// token TAPE_WIDTH_PX. Not a shared token: only the strip geometry uses it.
const TAPE_LENGTH_PX = 54;
const TAPE_FRAY_MAX_PX = 2;

const clampFray = (d: number): number => Math.max(0, Math.min(TAPE_FRAY_MAX_PX, d));

export interface TapeStrip {
  /** Local viewBox length (px), along the strip. */
  readonly length: number;
  /** Local viewBox width (px), across the strip (= TAPE_WIDTH_PX). */
  readonly width: number;
  /** `x,y …` polygon for the frayed strip. */
  readonly points: string;
  /** x-positions of the wrinkle lines (run across the width, parallel to the pull). */
  readonly wrinkles: readonly number[];
}

/**
 * A masking-tape strip for one corner: near-straight long sides with 1–2px jags at the two
 * TIPS only (from {@link TAPE_FRAY_SEED}, deterministic). Local coords run x ∈ [0, length]
 * along the strip, y ∈ [0, width] across it; long edges keep y === 0 / y === width.
 */
export function tapeStripPath(corner: Corner): TapeStrip {
  const w = TAPE_WIDTH_PX;
  const L = TAPE_LENGTH_PX;
  const seed = TAPE_FRAY_SEED[corner];
  const s = (k: number): number => clampFray(seed[k] ?? 0);
  // Clockwise: left tip top → top edge → right tip (top/mid/bottom jag) → bottom edge →
  // left tip (bottom/mid jag). Only the tip vertices move in x; long edges stay flat.
  const verts: readonly (readonly [number, number])[] = [
    [s(0), 0], // left-top
    [L - s(3), 0], // right-top
    [L - s(4), w / 2], // right-mid (fray)
    [L - s(5), w], // right-bottom
    [s(2), w], // left-bottom
    [s(1), w / 2], // left-mid (fray)
  ];
  const points = verts.map(([x, y]) => `${round2(x)},${round2(y)}`).join(" ");
  const wrinkles = [Math.round(L * 0.38 * 100) / 100, Math.round(L * 0.64 * 100) / 100];
  return { length: L, width: w, points, wrinkles };
}
