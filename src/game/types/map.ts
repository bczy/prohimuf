import type { Vec2 } from "@game/types/vector";

export interface WindowSlot {
  readonly col: number;
  readonly row: number;
  readonly screenPosition: Vec2;
  /** World-space size (width,height) of the window this slot sits in, if known. */
  readonly size?: Vec2;
}

export interface FacadeMap {
  readonly width: number;
  readonly height: number;
  readonly slots: readonly WindowSlot[];
}
