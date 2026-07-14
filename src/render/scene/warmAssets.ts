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
import { warmEnemyTexture } from "./enemyTextures";
import { warmCourierTexture } from "./courierTextures";
import { preloadVehicle } from "./DeliveryVehicleSprite";

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

// Warm one asset, dispatched by its base-relative path. Vehicle and courier live
// under their own subdirectories, so they are matched before the generic enemy
// prefix. ALWAYS resolves.
export function warm(path: string): Promise<void> {
  const url = `${import.meta.env.BASE_URL}${path}`;
  if (path.startsWith("assets/vehicles/")) return preloadVehicle(url);
  if (path.startsWith("assets/courier/")) return warmCourierTexture(url);
  if (path.startsWith("assets/enemy")) return warmEnemyTexture(url);
  return warmImage(url);
}
