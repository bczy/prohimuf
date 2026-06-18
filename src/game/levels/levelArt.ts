import manifest from "./levelArt.json";
import type { WindowSlot } from "@game/types/map";

export type LayerName = "sky" | "facade" | "street";

/** Native aspect ratio (w/h) of the facade art, used to size the plane. */
export const FACADE_ASPECT = manifest.sizes.facade.width / manifest.sizes.facade.height;

/** Facade plane height in world units (width = height × aspect). */
export const WORLD_HEIGHT = manifest.world.heightUnits;

export interface WindowGrid {
  readonly cols: number;
  readonly rows: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export const WINDOW_GRID: WindowGrid = {
  cols: manifest.windowGrid.cols,
  rows: manifest.windowGrid.rows,
  left: manifest.windowGrid.left,
  right: manifest.windowGrid.right,
  top: manifest.windowGrid.top,
  bottom: manifest.windowGrid.bottom,
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Build enemy window slots as world positions from a normalized grid over the
 * facade image. The facade plane is centred at the origin, so x∈[-W/2,W/2] and
 * y∈[-H/2,H/2] with y up (the grid's y is top-down, hence the flip).
 */
export function computeWindowSlots(
  facadeW: number,
  facadeH: number,
  grid: WindowGrid = WINDOW_GRID,
): WindowSlot[] {
  const slots: WindowSlot[] = [];
  for (let r = 0; r < grid.rows; r++) {
    const ny = grid.rows === 1 ? 0.5 : lerp(grid.top, grid.bottom, r / (grid.rows - 1));
    for (let c = 0; c < grid.cols; c++) {
      const nx = grid.cols === 1 ? 0.5 : lerp(grid.left, grid.right, c / (grid.cols - 1));
      slots.push({
        col: c,
        row: r,
        screenPosition: { x: (nx - 0.5) * facadeW, y: (0.5 - ny) * facadeH },
      });
    }
  }
  return slots;
}

export interface LevelArtParallax {
  readonly sky: number;
  readonly facade: number;
  readonly street: number;
}

/** A single hand-placed window, normalized to the facade image (centre + size, y-down). */
export interface WindowZone {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Compact per-level window layout: shared size + rows of x-centres. */
export interface WindowRows {
  readonly w: number;
  readonly h: number;
  readonly rows: readonly { readonly y: number; readonly xs: readonly number[] }[];
}

export interface LevelArt {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly parallax: LevelArtParallax;
  readonly prompts: Record<LayerName, string>;
  /** Per-level override of the enemy window grid; falls back to WINDOW_GRID. */
  readonly windowGrid?: WindowGrid;
  /** Hand-authored window zones (level design); takes priority over windowGrid. */
  readonly windows?: WindowRows;
}

const LEVELS = manifest.levels as readonly LevelArt[];

function requireFirstLevel(): LevelArt {
  const first = LEVELS[0];
  if (first === undefined) {
    throw new Error("levelArt.json must declare at least one level");
  }
  return first;
}

const FIRST_LEVEL = requireFirstLevel();

/** All level-art definitions, in declaration order. */
export const LEVEL_ART_LIST: readonly LevelArt[] = LEVELS;

/** Lookup by level id. */
export const LEVEL_ART: Readonly<Record<string, LevelArt>> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
);

export const LAYER_NAMES: readonly LayerName[] = ["sky", "facade", "street"];

/** Public URL of a level layer image (respects Vite base path). */
export function levelLayerUrl(id: string, layer: LayerName): string {
  return `${import.meta.env.BASE_URL}assets/levels/${id}/${layer}.png`;
}

/** Resolve a level's art, falling back to the first declared level. */
export function getLevelArt(id: string | undefined): LevelArt {
  const found = id !== undefined ? LEVEL_ART[id] : undefined;
  return found ?? FIRST_LEVEL;
}

/** The enemy window grid for a level (per-level override or the default). */
export function getWindowGrid(id: string | undefined): WindowGrid {
  return getLevelArt(id).windowGrid ?? WINDOW_GRID;
}

/**
 * Hand-authored window zones for a level (normalized, y-down). Uses the
 * explicit `windows` layout when declared, otherwise expands the parametric
 * window grid so every level still yields usable zones.
 */
export function getWindowZones(id: string | undefined): WindowZone[] {
  const art = getLevelArt(id);
  if (art.windows !== undefined) {
    const { w, h, rows } = art.windows;
    return rows.flatMap((row) => row.xs.map((x) => ({ x, y: row.y, w, h })));
  }
  const g = art.windowGrid ?? WINDOW_GRID;
  const zones: WindowZone[] = [];
  for (let r = 0; r < g.rows; r++) {
    const y = g.rows === 1 ? 0.5 : lerp(g.top, g.bottom, r / (g.rows - 1));
    for (let c = 0; c < g.cols; c++) {
      const x = g.cols === 1 ? 0.5 : lerp(g.left, g.right, c / (g.cols - 1));
      zones.push({ x, y, w: 0.085, h: 0.12 });
    }
  }
  return zones;
}

/** Enemy slots in world space, derived from the level's window zones. */
export function computeLevelSlots(
  id: string | undefined,
  facadeW: number,
  facadeH: number,
): WindowSlot[] {
  return getWindowZones(id).map((z, i) => ({
    col: i,
    row: 0,
    screenPosition: { x: (z.x - 0.5) * facadeW, y: (0.5 - z.y) * facadeH },
    size: { x: z.w * facadeW, y: z.h * facadeH },
  }));
}
