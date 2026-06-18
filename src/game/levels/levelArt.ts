import manifest from "./levelArt.json";

export type LayerName = "sky" | "facade" | "street";

export interface LevelArtParallax {
  readonly sky: number;
  readonly facade: number;
  readonly street: number;
}

export interface LevelArt {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly parallax: LevelArtParallax;
  readonly prompts: Record<LayerName, string>;
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
