import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";

/**
 * Texture cache for the photo set-piece's plate and key-pose sprites — its own tiny cache,
 * mirroring `bossTextures.ts` / `hostageTextures.ts`.
 *
 * **This file never hardcodes a path.** The set-piece's art ids live on `PhotoQteSpec.plate`
 * (`plateId` / `poseIds`, game data) and the id→path mapping is the manifest's
 * (`assetManifest.ts`, lane C). The caller resolves the path there and passes it in; this
 * module only loads, caches and reports. It also assumes NO plate resolution — whatever art
 * delivers is what gets sampled (perf-budget §10: the pixel size is an open art/design call).
 */
const loader = new TextureLoader();
const cache = new Map<string, Texture>();
const failed = new Set<string>();
// The resolver runs per rendered frame: without this guard every frame re-issues the same
// request until a callback lands.
const pending = new Set<string>();

const base = import.meta.env.BASE_URL;

/**
 * The texture for `path` (relative to the app base), or `null` while it warms or if it
 * failed. Callers draw the surface flat until it resolves — the set-piece must never pop
 * open on a half-loaded plate, which is why lane C warms this group on level entry.
 */
export function getPhotoTexture(path: string): Texture | null {
  const cached = cache.get(path);
  if (cached !== undefined) return cached;
  if (failed.has(path) || pending.has(path)) return null;

  pending.add(path);
  loader.load(
    `${base}${path}`,
    (texture) => {
      pending.delete(path);
      // The crop is driven by `map.offset`/`map.repeat` every frame (PhotoQteView), so the
      // filter is applied once here and the texture is never rebuilt.
      applyPixelFilter(texture);
      cache.set(path, texture);
    },
    undefined,
    () => {
      pending.delete(path);
      failed.add(path);
    },
  );
  return null;
}

/** Test/teardown hook: drops every cached texture and clears the failure memo. */
export function resetPhotoTextures(): void {
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
  failed.clear();
  pending.clear();
}
