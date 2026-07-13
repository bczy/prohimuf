import { TextureLoader } from "three";
import type { Texture } from "three";
import { applyPixelFilter } from "./pixelArt";
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

// Full asset URL for a layer and 1-based flipbook frame. The `_f<N>` frame
// suffix is inserted before the ".png" extension; frame 1 is the unsuffixed PNG.
function fileFor(asset: string, frame: number): string {
  const url = `${base}${asset}`;
  return frame > 1 ? url.replace(/\.png$/, `_f${String(frame)}.png`) : url;
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
// fallback file: a courier with no art simply doesn't draw (CourierSprite keeps
// the legacy single sprite up until courierArtReady()).
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

// True only once frame 1 of BOTH layers is decoded and cached — the gate
// CourierSprite uses to swap from the legacy single sprite to the two-plane
// composite. Calling it also kicks off loading of both layers' frames, so the
// composite is ready the moment its art lands in CI.
export function courierArtReady(): boolean {
  let ready = true;
  for (const layer of ["bike", "rider"]) {
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
