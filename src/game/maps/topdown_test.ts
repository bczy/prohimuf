import type { Vec2 } from "@game/types/vector";

export interface SolidRect {
  readonly x: number; // center x
  readonly y: number; // center y
  readonly w: number; // half-width
  readonly h: number; // half-height
}

export interface TopdownMap {
  readonly name: string;
  readonly widthUnits: number;
  readonly heightUnits: number;
  readonly playerStart: Vec2;
  readonly copWaypoints: readonly (readonly Vec2[])[];
  readonly pickupPosition: Vec2;
  readonly deliveryPosition: Vec2;
  readonly solidRects: readonly SolidRect[];
}

// 30×20 test map with walls on all borders + two interior obstacles
export const TOPDOWN_TEST: TopdownMap = {
  name: "test",
  widthUnits: 30,
  heightUnits: 20,
  playerStart: { x: 0, y: 0 },
  copWaypoints: [
    [
      { x: -10, y: 0 },
      { x: 10, y: 0 },
    ],
    [
      { x: 0, y: -8 },
      { x: 0, y: 8 },
    ],
  ],
  pickupPosition: { x: -12, y: 0 },
  deliveryPosition: { x: 12, y: 0 },
  // Border walls (half-width/height = 0.5 thick, centered on edges)
  solidRects: [
    { x: 0, y: 10, w: 15, h: 0.5 }, // top wall
    { x: 0, y: -10, w: 15, h: 0.5 }, // bottom wall
    { x: 15, y: 0, w: 0.5, h: 10 }, // right wall
    { x: -15, y: 0, w: 0.5, h: 10 }, // left wall
    // Interior obstacles
    { x: -5, y: 4, w: 2, h: 1 },
    { x: 5, y: -4, w: 2, h: 1 },
  ],
};
