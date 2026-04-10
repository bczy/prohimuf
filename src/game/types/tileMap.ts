export type TileType = "WALL" | "WINDOW_DARK" | "WINDOW_LIT" | "BALCONY" | "DOOR" | "ROOFTOP";

export interface TilesetDef {
  readonly sprite: string;
  readonly fallbackColor: string;
}

export type Tileset = Record<TileType, TilesetDef>;

export interface TileMap {
  readonly name: string;
  /** Number of columns */
  readonly cols: number;
  /** Number of rows */
  readonly rows: number;
  /**
   * Row-major grid: tiles[row][col] = TileType.
   * WINDOW_DARK and WINDOW_LIT become enemy spawn slots.
   */
  readonly tiles: readonly (readonly TileType[])[];
  /** Horizontal spacing between tile centres in world units */
  readonly tileW: number;
  /** Vertical spacing between tile centres in world units */
  readonly tileH: number;
}
