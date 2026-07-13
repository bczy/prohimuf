import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";
import { ARCHETYPES } from "@game/types/enemyTypes";
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

const base = import.meta.env.BASE_URL;
const FALLBACK_IDLE = `${base}assets/enemy_sprite.png`;
const FALLBACK_SHOOT = `${base}assets/enemy_shooting.png`;

// Manifest of flipbook frame counts, keyed by the exact base filename fileFor()
// builds (asset root + legacy variant suffix, minus path/extension). Typed as a
// string-indexed record so a dynamic key lookup is safe under
// noUncheckedIndexedAccess without an `any` cast; a missing key => 1 frame.
interface EnemyTypeEntry {
  readonly frames: readonly string[];
}
const ENEMY_TYPES: Record<string, EnemyTypeEntry> = levelArt.enemies.types;

// The base filename (no path, no `_f<N>` frame suffix, no extension) shared by
// fileFor() and frameCountFor() so the file path and its manifest key can't
// drift. Keeps the enemy_sprite -> enemy_shooting irregular root rule.
function baseFileKey(kind: EnemyKind, variant: number, shooting: boolean): string {
  const a = ARCHETYPES[kind];
  // enemy_sprite -> enemy_shooting; enemy_riot -> enemy_riot_shooting; etc.
  const root = shooting
    ? a.spriteBase === "enemy_sprite"
      ? "enemy_shooting"
      : `${a.spriteBase}_shooting`
    : a.spriteBase;
  const suffix = variant > 1 ? `_${String(variant)}` : "";
  return `${root}${suffix}`;
}

// Full asset URL for a given kind/variant/state and 1-based flipbook frame. The
// `_f<N>` frame suffix is appended AFTER the variant suffix; frame 1 is the
// unsuffixed committed PNG.
function fileFor(kind: EnemyKind, variant: number, shooting: boolean, frame: number): string {
  const frameSuffix = frame > 1 ? `_f${String(frame)}` : "";
  return `${base}assets/${baseFileKey(kind, variant, shooting)}${frameSuffix}.png`;
}

// Number of flipbook frames authored for this kind/variant/state. Safe default
// of 1 (idle-only / manifest miss).
export function frameCountFor(kind: EnemyKind, variant: number, shooting: boolean): number {
  const entry = ENEMY_TYPES[baseFileKey(kind, variant, shooting)];
  return entry !== undefined ? entry.frames.length : 1;
}

// Shared flipbook rate for every enemy sprite. Safe default of 6.
export function enemyAnimFps(): number {
  const fps = levelArt.enemies.fps;
  return fps > 0 ? fps : 6;
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

// Returns the best available texture for this kind/variant/state and 1-based
// frame, or null until something has loaded. Resolution order:
// requested frame -> frame 1 of the same state -> global fallback. On first
// request for a state every frame is queued so the first flip doesn't stall on
// a texture upload.
export function getEnemyTexture(
  kind: EnemyKind,
  variant: number,
  shooting: boolean,
  frame = 1,
): Texture | null {
  const fallback = shooting ? FALLBACK_SHOOT : FALLBACK_IDLE;
  const count = frameCountFor(kind, variant, shooting);
  for (let f = 1; f <= count; f++) {
    ensureLoaded(fileFor(kind, variant, shooting, f), fallback);
  }
  const frameFile = fileFor(kind, variant, shooting, frame);
  const frame1File = fileFor(kind, variant, shooting, 1);
  return cache.get(frameFile) ?? cache.get(frame1File) ?? cache.get(fallback) ?? null;
}
