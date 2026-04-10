import type { Vec2 } from "@game/types/vector";

export interface TopdownMap {
  readonly name: string;
  readonly widthUnits: number;
  readonly heightUnits: number;
  readonly playerStart: Vec2;
  readonly copWaypoints: readonly (readonly Vec2[])[];
  readonly pickupPosition: Vec2;
  readonly deliveryPosition: Vec2;
}

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
};
