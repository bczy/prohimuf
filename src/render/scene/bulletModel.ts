/**
 * Enemy-bullet 3D model loader (ADR-0064): generated-with-procedural-fallback GLTF,
 * mirroring `nearForegroundTextures.ts`'s async-swap idiom but for geometry instead
 * of a texture. `BulletSprite.tsx` always keeps its code-drawn cylinder+cap mesh
 * mounted (the guaranteed fallback, never removed); this module async-loads
 * `public/assets/models/bullet.glb` and exposes the parsed root {@link Group} once ready so
 * the render loop can swap each live bullet instance's visible mesh the next time it
 * revisits a slot that hasn't swapped yet. A missing/404 GLB (not yet generated in
 * CI, see `scripts/gen-bullet-3d.mjs`) keeps the procedural mesh forever — never
 * stalls, never throws.
 *
 * Singleton (one model, not a per-kind dictionary like the near-foreground props):
 * at most one load is ever issued, guarded by the same pending/failed pattern.
 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Group } from "three";

let cached: Group | null = null;
let pending = false;
let failed = false;

const loader = new GLTFLoader();

/**
 * Kick off the (at most once) async load of `url`. Never throws / never rejects;
 * always settles so a preloader gate can never stall on a missing model.
 */
export function warmBulletModel(url: string): Promise<void> {
  if (cached !== null || pending || failed) return Promise.resolve();
  pending = true;
  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        pending = false;
        cached = gltf.scene;
        resolve();
      },
      undefined,
      () => {
        pending = false;
        failed = true;
        resolve();
      },
    );
  });
}

/**
 * The loaded model's root {@link Group} once the async load has succeeded, else
 * `null` (procedural fallback stays). Callers must {@link Group.clone} before
 * mounting an instance — this is the single shared source, not per-instance.
 */
export function getBulletModel(): Group | null {
  return cached;
}

/** Test-only: reset module state between tests. Not exported from the public API. */
export function __resetBulletModelForTest(): void {
  cached = null;
  pending = false;
  failed = false;
}
