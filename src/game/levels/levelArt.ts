import manifest from "./levelArt.json";
import generatedZones from "./windowZones.generated.json";
import type { WindowSlot } from "@game/types/map";

export type LayerName = "sky" | "facade" | "street" | "foreground";

/** Native aspect ratio (w/h) of the facade art, used to size the plane. */
export const FACADE_ASPECT = manifest.sizes.facade.width / manifest.sizes.facade.height;

/** Facade plane height in world units (width = height × aspect). */
export const WORLD_HEIGHT = manifest.world.heightUnits;

/** The level decor is this many facade panels placed side by side. */
export const PANELS = 4;

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

/**
 * Code-drawn foreground ironwork style. `haussmann`/`plain`/`hlm` are the
 * per-level architectural registers (manifest `ironwork` field); `artdeco` and
 * `croix` are extra wrought-iron variants used only render-side to vary the
 * railing per building on multi-building tronçons (never declared per level).
 */
export type IronworkStyle = "haussmann" | "plain" | "hlm" | "artdeco" | "croix";

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

/** A near-foreground silhouette prop that scrolls faster than the street (ADR-0045). */
export type NearForegroundKind =
  | "parkingMeter"
  | "lamppost"
  | "wallaceFountain"
  | "trafficLight"
  | "bollard"
  | "scooter"
  | "bench"
  | "streetSign";

export interface NearForegroundObject {
  readonly kind: NearForegroundKind;
  /** Anchor x in full-street normalized units (0 = left edge of the street, 1 = right edge). */
  readonly x: number;
  readonly scale?: number; // default 1
  /** Which kerb the prop stands on: "near" (front, big, fast) or "far" (back of
   *  the road, small, slow). Defaults to "near". */
  readonly row?: "near" | "far";
}

export interface NearForegroundLayer {
  /** Engine parallax factor (NEGATIVE). mesh.x = camera.x * factor; screen speed S = 1 - factor. */
  readonly factor: number;
  readonly objects: readonly NearForegroundObject[];
}

/** One tile of a tronçon-sequence backdrop: an image basename + its native
 *  aspect (image width/height), which drives the tile's world width. */
export interface BackdropTileSpec {
  readonly file: string;
  readonly aspect: number;
}

/**
 * How a level composes its backdrop (ADR-0046). Absent on a level ⇒
 * `single-facade`: the classic {@link PANELS} equal-width `facade.png` panels.
 * `troncon-sequence`: a fixed, deterministic sequence of distinct
 * variable-width tronçon images laid side by side.
 */
export type BackdropDescriptor =
  | { readonly mode: "single-facade" }
  | { readonly mode: "troncon-sequence"; readonly tiles: readonly BackdropTileSpec[] };

export interface LevelArt {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly parallax: LevelArtParallax;
  /** How the backdrop is composed (ADR-0046); absent ⇒ single-facade. */
  readonly backdrop?: BackdropDescriptor;
  /** Which code-drawn foreground ironwork to render; defaults to "haussmann". */
  readonly ironwork?: IronworkStyle;
  /**
   * Extra drop of the railing base, as a fraction of the window-zone height.
   * The detected zones frame the LIT opening, not the sill: levels whose art
   * has a tall spandrel under the glazing set this so the railing sits on the
   * floor line. Defaults to 0 (base pinned just under the opening).
   */
  readonly ironworkSillOffset?: number;
  readonly prompts: Record<LayerName, string>;
  /** Per-level override of the enemy window grid; falls back to WINDOW_GRID. */
  readonly windowGrid?: WindowGrid;
  /** Hand-authored window zones (level design); takes priority over windowGrid. */
  readonly windows?: WindowRows;
  /** Near-foreground parallax layer (ADR-0045); absent = opt-out for this level. */
  readonly nearForeground?: NearForegroundLayer;
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

/** The code-drawn foreground ironwork style for a level (defaults to "haussmann"). */
export function getIronworkStyle(id: string | undefined): IronworkStyle {
  return getLevelArt(id).ironwork ?? "haussmann";
}

/**
 * Per-level drop of the railing base below the detected window opening, as a
 * fraction of the zone height (see {@link LevelArt.ironworkSillOffset}).
 * Clamped to [0, 0.6]; defaults to 0.
 */
export function getIronworkSillOffset(id: string | undefined): number {
  const raw = getLevelArt(id).ironworkSillOffset ?? 0;
  return Math.min(0.6, Math.max(0, raw));
}

/** Allowed range for the near-foreground parallax factor (NEGATIVE, ADR-0045).
 *  Widened so the near (front) row can drift clearly faster than the facade. */
const NEAR_FOREGROUND_FACTOR_MIN = -0.5;
const NEAR_FOREGROUND_FACTOR_MAX = -0.1;
/** Safe fallback factor when the declared one is non-finite (slow end of band). */
const NEAR_FOREGROUND_FACTOR_DEFAULT = NEAR_FOREGROUND_FACTOR_MAX;

/**
 * The near-foreground kinds accepted at runtime. The manifest is cast (untyped
 * JSON), so a typo like "carRof" would otherwise slip through the TS type and
 * crash the render's `NEAR_KIND_SPECS[kind]` lookup — validate at the source.
 */
const NEAR_FOREGROUND_KINDS: readonly NearForegroundKind[] = [
  "parkingMeter",
  "lamppost",
  "wallaceFountain",
  "trafficLight",
  "bollard",
  "scooter",
  "bench",
  "streetSign",
];

const isNearForegroundKind = (kind: unknown): kind is NearForegroundKind =>
  typeof kind === "string" && (NEAR_FOREGROUND_KINDS as readonly string[]).includes(kind);

/**
 * The near-foreground parallax layer for a level (ADR-0045), or `null` when the
 * level opts out (no `nearForeground` field) or the id is unknown. Unlike
 * {@link getLevelArt} this does NOT fall back to the first level: an unknown id
 * yields null.
 *
 * Data is hardened at the source (the manifest is untyped JSON): `factor` is
 * clamped to [-0.30, -0.15] — a non-finite value first falls back to a safe
 * default so `NaN` cannot leak through the clamp. Objects with an unknown `kind`
 * are dropped; an object whose `scale` is present but non-positive or non-finite
 * is normalized to `1`.
 */
export function getNearForeground(id: string | undefined): NearForegroundLayer | null {
  const art = id !== undefined ? LEVEL_ART[id] : undefined;
  const layer = art?.nearForeground;
  if (layer === undefined) return null;

  const rawFactor = Number.isFinite(layer.factor) ? layer.factor : NEAR_FOREGROUND_FACTOR_DEFAULT;
  const factor = Math.min(
    NEAR_FOREGROUND_FACTOR_MAX,
    Math.max(NEAR_FOREGROUND_FACTOR_MIN, rawFactor),
  );

  const objects = layer.objects
    .filter((obj) => isNearForegroundKind(obj.kind))
    .map((obj) =>
      obj.scale === undefined || (Number.isFinite(obj.scale) && obj.scale > 0)
        ? obj
        : { ...obj, scale: 1 },
    );

  return { factor, objects };
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

/**
 * Repeat a panel's normalized zones across `panels` panels laid side by side,
 * re-normalizing to the full (panels-wide) facade: a zone at local x becomes
 * global x = (p + x) / panels, with width scaled by 1/panels.
 */
export function tileZones(zones: readonly WindowZone[], panels: number = PANELS): WindowZone[] {
  return tilePanelZones(Array.from({ length: panels }, () => zones));
}

/** Per-panel window zones derived from each facade panel's art (see
 *  scripts/gen-window-zones.mjs), keyed by level id. */
const GENERATED_ZONES = generatedZones as unknown as Readonly<
  Record<string, readonly (readonly WindowZone[])[]>
>;

/**
 * The window zones for each panel of a level, in panel order. Uses the
 * art-derived zones (one set per facade panel) when available, so each panel's
 * cops/railings line up with that panel's actual windows; otherwise repeats the
 * level's single hand/grid zone set across every panel.
 */
export function getLevelPanelZones(id: string | undefined): readonly (readonly WindowZone[])[] {
  const art = getLevelArt(id);
  const gen = GENERATED_ZONES[art.id];
  if (gen !== undefined && gen.length > 0) return gen;
  const base = getWindowZones(art.id);
  return Array.from({ length: PANELS }, () => base);
}

/**
 * Lay per-panel zones (each normalized to its own panel) side by side and
 * re-normalize to the full panels-wide facade. Panel `p`'s zone at local x
 * becomes global x = (p + x) / panels, with width scaled by 1/panels.
 */
export function tilePanelZones(panelZones: readonly (readonly WindowZone[])[]): WindowZone[] {
  const panels = panelZones.length;
  const out: WindowZone[] = [];
  for (let p = 0; p < panels; p++) {
    for (const z of panelZones[p] ?? []) {
      out.push({ x: (p + z.x) / panels, y: z.y, w: z.w / panels, h: z.h });
    }
  }
  return out;
}

/** Enemy slots in world space from zones normalized to a facade of width facadeW. */
export function computeSlotsFromZones(
  zones: readonly WindowZone[],
  facadeW: number,
  facadeH: number,
): WindowSlot[] {
  return zones.map((z, i) => ({
    col: i,
    row: 0,
    screenPosition: { x: (z.x - 0.5) * facadeW, y: (0.5 - z.y) * facadeH },
    size: { x: z.w * facadeW, y: z.h * facadeH },
  }));
}

/** Enemy slots in world space, derived from the level's window zones. */
export function computeLevelSlots(
  id: string | undefined,
  facadeW: number,
  facadeH: number,
): WindowSlot[] {
  return computeSlotsFromZones(getWindowZones(id), facadeW, facadeH);
}

/** World width of one single-facade panel (height × facade aspect). */
const PANEL_WIDTH = WORLD_HEIGHT * FACADE_ASPECT;

/**
 * Per-tronçon generated window zones (troncon-sequence, ADR-0046), keyed
 * `${levelId}/${tile.file}`. This is a FLAT view of the same generated map as
 * {@link GENERATED_ZONES} (double-cast through `unknown`: the per-tronçon
 * entries are a single zone list, not the per-panel array-of-arrays of the
 * legacy level-id keys, and the two key namespaces never collide — level-id
 * keys carry no `/`). Phase-1 these keys are ABSENT (the generator adds them
 * later); {@link getBackdropLayout} then falls back to {@link getWindowZones}.
 */
const GENERATED_TRONCON_ZONES = generatedZones as unknown as Readonly<
  Record<string, readonly WindowZone[]>
>;

/** One composed backdrop tile: an image, its world width and centre, plus the
 *  window zones normalized to THIS tile's own width (0..1, y-down). */
export interface BackdropTile {
  readonly file: string;
  readonly width: number;
  readonly centreX: number;
  readonly zones: readonly WindowZone[];
}

/** The pure geometric composition of a level's backdrop (ADR-0046). Contains
 *  NO draw-scale / feather / blend — those stay render-side, applied per mode. */
export interface BackdropLayout {
  readonly mode: "single-facade" | "troncon-sequence";
  readonly fullW: number;
  readonly tiles: readonly BackdropTile[];
}

/**
 * World-unit gap of sky left BETWEEN adjacent tronçons (ADR-0046). The tronçon
 * PNGs now carry their OWN transparent L/R margins (the buildings never touch the
 * image edge), so butting the tiles (gap 0) already leaves a sky gap of the two
 * neighbours' margins combined — through which the owner-supplied parallax sky
 * shows above and the continuous ground layer shows below. Kept as a tunable knob
 * for any extra spacing on top of the baked-in margins.
 */
export const TRONCON_GAP = 0;

/** Compose a troncon-sequence backdrop: variable-width tiles laid left→right
 *  with a {@link TRONCON_GAP} sky gap between neighbours, centred on the origin,
 *  each carrying its own (per-tronçon or fallback) zones. */
function buildTronconLayout(id: string, tiles: readonly BackdropTileSpec[]): BackdropLayout {
  const widthsSum = tiles.reduce((sum, t) => sum + WORLD_HEIGHT * t.aspect, 0);
  const fullW = widthsSum + TRONCON_GAP * Math.max(0, tiles.length - 1);
  const fallbackZones = getWindowZones(id);
  const out: BackdropTile[] = [];
  let cursor = -fullW / 2;
  for (const tile of tiles) {
    const width = WORLD_HEIGHT * tile.aspect;
    const centreX = cursor + width / 2;
    cursor += width + TRONCON_GAP;
    const zones = GENERATED_TRONCON_ZONES[`${id}/${tile.file}`] ?? fallbackZones;
    out.push({ file: tile.file, width, centreX, zones });
  }
  return { mode: "troncon-sequence", fullW, tiles: out };
}

/**
 * The pure, deterministic backdrop layout for a level (ADR-0046). Single grid
 * abstraction for both modes:
 * - single-facade (default): {@link PANELS} equal-width `facade` tiles of width
 *   {@link PANEL_WIDTH}, centred on the origin, each carrying its panel's zones
 *   ({@link getLevelPanelZones}). Provably byte-identical to the legacy
 *   `tilePanelZones → computeSlotsFromZones` slots (see backdropLayout tests).
 * - troncon-sequence: the manifest's fixed variable-width tiles (see
 *   {@link buildTronconLayout}).
 */
export function getBackdropLayout(id: string | undefined): BackdropLayout {
  const art = getLevelArt(id);
  const backdrop = art.backdrop;
  if (backdrop?.mode === "troncon-sequence") {
    return buildTronconLayout(art.id, backdrop.tiles);
  }
  const panelZones = getLevelPanelZones(art.id);
  const tiles: BackdropTile[] = [];
  for (let p = 0; p < PANELS; p++) {
    tiles.push({
      file: "facade",
      width: PANEL_WIDTH,
      centreX: (p - (PANELS - 1) / 2) * PANEL_WIDTH,
      zones: panelZones[p] ?? [],
    });
  }
  return { mode: "single-facade", fullW: PANEL_WIDTH * PANELS, tiles };
}

/**
 * Enemy window slots in world space, derived from {@link getBackdropLayout}.
 * Each tile-local zone `(x,y,w,h)` maps to world
 * `x = centreX + (x−0.5)·width`, `y = (0.5−y)·facadeH`,
 * `size = (w·width, h·facadeH)`. Replaces the
 * `tilePanelZones → computeSlotsFromZones` chain for callers.
 */
export function computeBackdropSlots(id: string | undefined, facadeH: number): WindowSlot[] {
  const layout = getBackdropLayout(id);
  const slots: WindowSlot[] = [];
  let col = 0;
  for (const tile of layout.tiles) {
    for (const z of tile.zones) {
      slots.push({
        col: col++,
        row: 0,
        screenPosition: { x: tile.centreX + (z.x - 0.5) * tile.width, y: (0.5 - z.y) * facadeH },
        size: { x: z.w * tile.width, y: z.h * facadeH },
      });
    }
  }
  return slots;
}
