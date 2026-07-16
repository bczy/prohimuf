import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";
import { courierAssetPath } from "@game/systems/assetManifest";
import levelArt from "@game/levels/levelArt.json";

// Shared, lazily-loaded cache of street-courier (livreur) sprite textures, keyed
// by file path. The courier is a two-layer flipbook (bike under rider); each
// layer plays its own frame strip, so CourierSprite reads from this cache each
// rendered frame rather than loading per-mount. Deliberately its own loader/
// cache/failed/pending sets: it does NOT share or generalise enemyTextures.ts —
// the two manifests have different shapes (courier frames carry no protected
// committed frame 1 and no global fallback file).
const loader = new TextureLoader();
const cache = new Map<string, Texture>();
const failed = new Set<string>();
// In-flight loads: getCourierTexture runs per rendered frame, so without this
// guard every frame re-issues the same request until a callback lands.
const pending = new Set<string>();

const base = import.meta.env.BASE_URL;

// One courier layer as authored in levelArt.json (`courier.layers.<layer>`).
// asset is the frame-1 URL root; frames.length is the flipbook frame count
// (every clause is a real pose — unlike enemies there is no "" sentinel).
interface CourierLayerEntry {
  readonly asset: string;
  readonly frames: readonly string[];
  readonly scale: number;
  readonly offsetY: number;
}

// String-indexed record so a dynamic key lookup is safe under
// noUncheckedIndexedAccess without an `any` cast (same trick as enemyTextures.ts);
// a missing key => a null/1-frame default at each call site.
const LAYERS: Record<string, CourierLayerEntry> = levelArt.courier.layers;

// Full asset URL for a layer and 1-based flipbook frame. Path construction lives
// in @game/systems/assetManifest (shared with the preloader); BASE_URL prefixing
// stays local so the cache keys remain the full URLs the loader fetches.
function fileFor(asset: string, frame: number): string {
  return `${base}${courierAssetPath(asset, frame)}`;
}

function ensureLoaded(file: string): void {
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
    },
  );
}

// In-flight preload promises, keyed by full URL, so warming the same courier
// frame twice shares one load and one settle.
const warming = new Map<string, Promise<void>>();

// Preload a single courier-sprite URL into the shared `cache` ahead of the scene
// mounting, so getCourierTexture / courierArtReady hit a warm cache. Loads via
// the same pipeline (applyPixelFilter) and keys as the lazy path, updating the
// same pending/failed sets. ALWAYS resolves so the loading gate can complete.
export function warmCourierTexture(url: string): Promise<void> {
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

// Number of flipbook frames authored for this layer. Safe default of 1 (manifest
// miss / unknown layer).
export function courierFrameCount(layer: string): number {
  const entry = LAYERS[layer];
  return entry !== undefined ? entry.frames.length : 1;
}

// Shared flipbook rate for both courier layers. Safe default of 6.
export function courierAnimFps(): number {
  const fps = levelArt.courier.fps;
  return fps > 0 ? fps : 6;
}

// The registration entry (asset + frames + scale/offsetY knobs) for a layer, or
// null for an unknown layer.
export function courierLayer(layer: string): CourierLayerEntry | null {
  return LAYERS[layer] ?? null;
}

// Best available texture for this layer and 1-based frame, or null until
// something has loaded. On first request every frame of the layer is queued so
// the first flip doesn't stall on a texture upload. Resolution order:
// requested frame -> frame 1 of the same layer -> null. There is NO global
// fallback file: a courier with no art simply doesn't draw (CourierSprite hides
// the rider plane until courierArtReady()).
export function getCourierTexture(layer: string, frame: number): Texture | null {
  const entry = LAYERS[layer];
  if (entry === undefined) return null;
  const count = entry.frames.length;
  for (let f = 1; f <= count; f++) {
    ensureLoaded(fileFor(entry.asset, f));
  }
  const frameFile = fileFor(entry.asset, frame);
  const frame1File = fileFor(entry.asset, 1);
  return cache.get(frameFile) ?? cache.get(frame1File) ?? null;
}

// True only once the RIDER layer's frame 1 is decoded and cached — the gate
// CourierSprite uses to show the animated full-cyclist sprite (the bike layer
// was retired from the composite; its art stays committed as spare). Calling it
// also kicks off loading of the frames. Note: a 404/failure poisons the `failed`
// set for the whole session (same policy as enemyTextures), so this then stays
// false until the next page load and couriers stay hidden — the accepted
// degraded mode since the legacy fallback sprite was retired (ADR-0029).
export function courierArtReady(): boolean {
  let ready = true;
  for (const layer of ["rider"]) {
    const entry = LAYERS[layer];
    if (entry === undefined) {
      ready = false;
      continue;
    }
    const count = entry.frames.length;
    for (let f = 1; f <= count; f++) {
      ensureLoaded(fileFor(entry.asset, f));
    }
    if (!cache.has(fileFor(entry.asset, 1))) ready = false;
  }
  return ready;
}
