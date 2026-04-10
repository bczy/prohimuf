export type TileType =
  | "WALL"
  | "WINDOW_DARK"
  | "WINDOW_LIT"
  | "BALCONY"
  | "DOOR"
  | "ROOFTOP"
  | "SHOP" // vitrine commerciale au rdc
  | "FIRE_ESCAPE" // escalier de secours métallique sur le mur
  | "ARCH"; // arcade haussmannienne (mur plein avec arc décoratif)

export interface TilesetDef {
  readonly color: string;
  /** Optional sprite — if omitted, only flat color is used */
  readonly sprite?: string;
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
