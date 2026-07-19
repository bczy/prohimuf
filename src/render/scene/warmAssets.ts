/**
 * Asset-warming dispatcher for the loading gate (story-asset-preloading).
 *
 * Takes a single base-relative asset path (as listed by
 * `@game/systems/assetManifest`), applies `import.meta.env.BASE_URL`, and routes
 * it to the module cache that owns that kind of sprite so the shared caches are
 * already warm before the R3F scene mounts — killing the untextured-square
 * pop-in. Every branch resolves (success OR failure) so the preloader can always
 * settle and open the gate.
 */
import { Howl } from "howler";
import { warmEnemyTexture } from "./enemyTextures";
import { warmCourierTexture } from "./courierTextures";
import { preloadVehicle } from "./DeliveryVehicleSprite";
import { warmNearForegroundTexture } from "./nearForegroundTextures";

// Synthetic manifest scheme for the code-drawn near-foreground props (ADR-0047):
// they have no PNG on disk, so the manifest lists them as `nearfg:<kind>` and the
// gate builds the shared CanvasTexture instead of fetching a URL.
const NEAR_FG_PREFIX = "nearfg:";

// Everything else (facades, sky/street parallax, narrative art, the menu
// backdrop): just prime the browser's HTTP/image cache. `decode()` finishes when
// the bitmap is fully decoded; a failed load rejects, which we swallow so a
// missing (still-generating) asset can never stall the gate.
function warmImage(url: string): Promise<void> {
  const img = new Image();
  img.src = url;
  return img.decode().then(
    () => undefined,
    () => undefined,
  );
}

// Audio: preloading primes the same HTTP/AudioBuffer cache createAudioSystem's
// Howls hit; a load failure counts as settled so the gate never hangs.
function warmAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const howl = new Howl({ src: [url], preload: true });
    howl.once("load", done);
    howl.once("loaderror", done);
    // Headless / no-audio-device browsers may fire neither event; resolve anyway
    // after a grace period so the preloader gate can never stall on audio.
    // `done` only ever runs asynchronously (Howl events / this timer), never
    // before `timer` is assigned below, so the closure read is safe.
    const timer = setTimeout(done, 10_000);
  });
}

// Warm one asset, dispatched by its base-relative path. Vehicle and courier live
// under their own subdirectories, so they are matched before the generic enemy
// prefix. ALWAYS resolves.
export function warm(path: string): Promise<void> {
  // Code-drawn props: build the shared texture, no URL fetch (must precede the
  // BASE_URL prefixing below, which only makes sense for real file paths).
  if (path.startsWith(NEAR_FG_PREFIX)) {
    return warmNearForegroundTexture(path.slice(NEAR_FG_PREFIX.length));
  }
  const url = `${import.meta.env.BASE_URL}${path}`;
  if (path.startsWith("assets/vehicles/")) return preloadVehicle(url);
  if (path.startsWith("assets/courier/")) return warmCourierTexture(url);
  if (path.startsWith("assets/enemy")) return warmEnemyTexture(url);
  if (path.startsWith("assets/audio/")) return warmAudio(url);
  return warmImage(url);
}
