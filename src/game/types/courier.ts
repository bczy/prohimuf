// The "livreur" — a delivery cyclist that rides along the street from one edge
// of the level to the other (NOT a window pop-up like the cops). It is a civilian
// the player must NOT shoot; doing so costs a life and a point.
export interface Courier {
  readonly id: number;
  /** World-space position along the street. */
  readonly x: number;
  readonly y: number;
  /** Travel direction: +1 rides right, -1 rides left. */
  readonly dir: 1 | -1;
  /** World units per second. */
  readonly speed: number;
}
