import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";
import { ARCHETYPES } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";

// Shared, lazily-loaded cache of enemy sprite textures, keyed by file path.
// The enemy occupying a window changes kind every wave, so EnemySprite reads
// from this cache each frame rather than loading per-mount. New-type sprites
// that don't exist yet (still being generated in CI) fall back to the normal
// cop so the figure is never invisible.
const loader = new TextureLoader();
const cache = new Map<string, Texture>();
const failed = new Set<string>();

const base = import.meta.env.BASE_URL;
const FALLBACK_IDLE = `${base}assets/enemy_sprite.png`;
const FALLBACK_SHOOT = `${base}assets/enemy_shooting.png`;

function fileFor(kind: EnemyKind, variant: number, shooting: boolean): string {
  const a = ARCHETYPES[kind];
  // enemy_sprite -> enemy_shooting; enemy_riot -> enemy_riot_shooting; etc.
  const root = shooting
    ? a.spriteBase === "enemy_sprite"
      ? "enemy_shooting"
      : `${a.spriteBase}_shooting`
    : a.spriteBase;
  const suffix = variant > 1 ? `_${String(variant)}` : "";
  return `${base}assets/${root}${suffix}.png`;
}

function ensureLoaded(file: string, fallback: string): void {
  if (cache.has(file) || failed.has(file)) return;
  loader.load(
    file,
    (t) => {
      cache.set(file, applyPixelFilter(t));
    },
    undefined,
    () => {
      failed.add(file);
      if (!cache.has(fallback)) ensureLoaded(fallback, fallback);
    },
  );
}

// Returns the best available texture for this kind/variant/state, or null until
// something has loaded.
export function getEnemyTexture(
  kind: EnemyKind,
  variant: number,
  shooting: boolean,
): Texture | null {
  const file = fileFor(kind, variant, shooting);
  const fallback = shooting ? FALLBACK_SHOOT : FALLBACK_IDLE;
  ensureLoaded(file, fallback);
  return cache.get(file) ?? cache.get(fallback) ?? null;
}
