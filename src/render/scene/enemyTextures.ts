import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";
import { enemyBaseFileKey, enemyAssetPath } from "@game/systems/assetManifest";
import type { EnemyKind } from "@game/types/enemy";
import levelArt from "@game/levels/levelArt.json";

// Shared, lazily-loaded cache of enemy sprite textures, keyed by file path.
// The enemy occupying a window changes kind every wave, so EnemySprite reads
// from this cache each frame rather than loading per-mount. New-type sprites
// that don't exist yet (still being generated in CI) fall back to the normal
// cop so the figure is never invisible; likewise a missing flipbook frame
// (`_f2` PNG generated later in CI) falls back to frame 1 of the same state.
const loader = new TextureLoader();
const cache = new Map<string, Texture>();
const failed = new Set<string>();
// In-flight loads: getEnemyTexture runs per rendered frame, so without this
// guard every frame re-issues the same request until a callback lands.
const pending = new Set<string>();

const base = import.meta.env.BASE_URL;
const FALLBACK_IDLE = `${base}assets/enemy_sprite.png`;
const FALLBACK_SHOOT = `${base}assets/enemy_shooting.png`;

// Manifest of flipbook frame counts, keyed by the exact base filename fileFor()
// builds (asset root + legacy variant suffix, minus path/extension). Typed as a
// string-indexed record so a dynamic key lookup is safe under
// noUncheckedIndexedAccess without an `any` cast; a missing key => 1 frame.
interface EnemyTypeEntry {
  readonly frames: readonly string[];
  // Optional per-frame muzzle-flash anchor, index-aligned with `frames`:
  // element i anchors frame i+1; `null` = no anchor for that frame. Normalized
  // [0..1] texture coords from the PNG top-left. Only shooting entries carry it
  // (written by scripts/measure-muzzle-anchors.mjs); it stays OPTIONAL so a
  // regenerated asset whose anchors were not re-measured degrades to the
  // renderer's fixed-offset fallback instead of crashing.
  readonly muzzle?: readonly ({ x: number; y: number } | null)[];
}
const ENEMY_TYPES: Record<string, EnemyTypeEntry> = levelArt.enemies.types;

// Full asset URL for a given kind/variant/state and 1-based flipbook frame.
// Path construction lives in @game/systems/assetManifest (single source of truth
// shared with the preloader); BASE_URL prefixing stays local so the cache keys
// remain the full URLs the loader fetches.
function fileFor(kind: EnemyKind, variant: number, shooting: boolean, frame: number): string {
  return `${base}${enemyAssetPath(kind, variant, shooting, frame)}`;
}

// Number of flipbook frames authored for this kind/variant/state. Safe default
// of 1 (idle-only / manifest miss).
export function frameCountFor(kind: EnemyKind, variant: number, shooting: boolean): number {
  const entry = ENEMY_TYPES[enemyBaseFileKey(kind, variant, shooting)];
  return entry !== undefined ? entry.frames.length : 1;
}

// Normalized [0..1] muzzle-flash anchor (from the PNG top-left) of this
// kind/variant's SHOOTING sprite for a 1-based frame, or null when there is
// nothing to anchor. Absent field, null element and out-of-range frames all
// collapse to null so the caller falls back to its fixed offset. Callers must
// pass the frame of the texture ACTUALLY displayed (see resolveEnemyTexture),
// not the requested one — anchors are pixel positions of a specific image.
export function muzzleFor(
  kind: EnemyKind,
  variant: number,
  frame: number,
): { x: number; y: number } | null {
  const entry = ENEMY_TYPES[enemyBaseFileKey(kind, variant, true)];
  const anchors = entry?.muzzle;
  if (anchors === undefined) return null;
  return anchors[frame - 1] ?? null;
}

// Shared flipbook rate for every enemy sprite. Safe default of 6.
export function enemyAnimFps(): number {
  const fps = levelArt.enemies.fps;
  return fps > 0 ? fps : 6;
}

function ensureLoaded(file: string, fallback: string): void {
  if (cache.has(file) || failed.has(file) || pending.has(file)) return;
  pending.add(file);
  loader.load(
    file,
    (t) => {
      pending.delete(file);
      cache.set(file, applyPixelFilter(t));
    },
    undefined,
    () => {
      pending.delete(file);
      failed.add(file);
      if (!cache.has(fallback)) ensureLoaded(fallback, fallback);
    },
  );
}

// In-flight preload promises, keyed by full URL, so warming the same sprite
// twice (e.g. a path listed by two manifests) shares one load and one settle.
const warming = new Map<string, Promise<void>>();

// Preload a single enemy-sprite URL into the shared `cache` ahead of the scene
// mounting, so resolveEnemyTexture hits a warm cache and never flashes an
// untextured square. Loads via the same pipeline (applyPixelFilter) and keys as
// the lazy path, and updates the same pending/failed sets. ALWAYS resolves:
// success and 404 both settle so the loading gate can complete. Preloading is
// standalone (no fallback chaining) — the manifest lists real committed paths.
export function warmEnemyTexture(url: string): Promise<void> {
  if (cache.has(url) || failed.has(url)) return Promise.resolve();
  const existing = warming.get(url);
  if (existing !== undefined) return existing;
  const p = new Promise<void>((resolve) => {
    pending.add(url);
    loader.load(
      url,
      (t) => {
        pending.delete(url);
        cache.set(url, applyPixelFilter(t));
        warming.delete(url);
        resolve();
      },
      undefined,
      () => {
        pending.delete(url);
        failed.add(url);
        warming.delete(url);
        resolve();
      },
    );
  });
  warming.set(url, p);
  return p;
}

// The best available texture for this kind/variant/state and 1-based frame,
// tagged with which flipbook frame it ACTUALLY shows: the requested frame,
// frame 1 while the requested frame is still loading, or `frame: null` when
// only the global fallback sprite (a different figure entirely) is available.
// Consumers that derive pixel positions from the texture (muzzle anchors) must
// use this resolved frame, never the requested one. On first request for a
// state every frame is queued so the first flip doesn't stall on an upload.
export interface ResolvedEnemyTexture {
  readonly texture: Texture;
  readonly frame: number | null;
}
export function resolveEnemyTexture(
  kind: EnemyKind,
  variant: number,
  shooting: boolean,
  frame = 1,
): ResolvedEnemyTexture | null {
  const fallback = shooting ? FALLBACK_SHOOT : FALLBACK_IDLE;
  const count = frameCountFor(kind, variant, shooting);
  for (let f = 1; f <= count; f++) {
    ensureLoaded(fileFor(kind, variant, shooting, f), fallback);
  }
  const requested = cache.get(fileFor(kind, variant, shooting, frame));
  if (requested !== undefined) return { texture: requested, frame };
  const frame1 = cache.get(fileFor(kind, variant, shooting, 1));
  if (frame1 !== undefined) return { texture: frame1, frame: 1 };
  const fb = cache.get(fallback);
  return fb !== undefined ? { texture: fb, frame: null } : null;
}

// Texture-only variant of resolveEnemyTexture (kept for callers that don't
// care which frame resolved).
export function getEnemyTexture(
  kind: EnemyKind,
  variant: number,
  shooting: boolean,
  frame = 1,
): Texture | null {
  return resolveEnemyTexture(kind, variant, shooting, frame)?.texture ?? null;
}
