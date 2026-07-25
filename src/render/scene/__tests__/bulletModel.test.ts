import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * ADR-0065 GLTF pipeline: {@link warmBulletModel} async-loads the generated bullet
 * model; a 404/error keeps `getBulletModel()` returning null forever (the
 * procedural fallback in BulletSprite never swaps). Success caches the parsed
 * `gltf.scene` so later calls return the SAME object (callers must clone before
 * mounting an instance).
 *
 * The GLTFLoader mock is ASYNC-settling — loads are QUEUED and fired manually via
 * `settleLoads` — so a test can observe the pending state before resolution, same
 * idiom as nearForegroundTextures.test.ts's TextureLoader mock.
 */

const { pendingLoads } = vi.hoisted(() => ({
  pendingLoads: [] as {
    url: string;
    onLoad: ((gltf: { scene: unknown }) => void) | undefined;
    onError: ((e: unknown) => void) | undefined;
  }[],
}));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => {
  class MockGLTFLoader {
    load(
      url: string,
      onLoad?: (gltf: { scene: unknown }) => void,
      _onProgress?: unknown,
      onError?: (e: unknown) => void,
    ): void {
      pendingLoads.push({ url, onLoad, onError });
    }
  }
  return { GLTFLoader: MockGLTFLoader };
});

function settleLoads(result: "success" | "error", scene: unknown = {}): void {
  const batch = pendingLoads.splice(0, pendingLoads.length);
  for (const { onLoad, onError } of batch) {
    if (result === "success") onLoad?.({ scene });
    else onError?.(new Error("404"));
  }
}

describe("bulletModel", () => {
  beforeEach(async () => {
    vi.resetModules();
    pendingLoads.length = 0;
    const mod = await import("../bulletModel");
    mod.__resetBulletModelForTest();
  });

  it("returns null before any warm call", async () => {
    const { getBulletModel } = await import("../bulletModel");
    expect(getBulletModel()).toBeNull();
  });

  it("issues exactly one load per URL and resolves the warm promise on success", async () => {
    const { warmBulletModel, getBulletModel } = await import("../bulletModel");
    const done = warmBulletModel("assets/models/bullet.glb");
    expect(pendingLoads).toHaveLength(1);
    expect(pendingLoads[0]?.url).toBe("assets/models/bullet.glb");
    // Not yet resolved: cache stays null while the load is in flight.
    expect(getBulletModel()).toBeNull();

    const scene = { name: "bullet-scene" };
    settleLoads("success", scene);
    await done;

    expect(getBulletModel()).toBe(scene);
  });

  it("never issues a second load once cached (singleton guard)", async () => {
    const { warmBulletModel } = await import("../bulletModel");
    await Promise.all([
      (async () => {
        const p = warmBulletModel("assets/models/bullet.glb");
        settleLoads("success", { name: "s" });
        await p;
      })(),
    ]);
    await warmBulletModel("assets/models/bullet.glb");
    expect(pendingLoads).toHaveLength(0); // no new load queued post-cache
  });

  it("keeps getBulletModel() null forever after a failed load, and never retries", async () => {
    const { warmBulletModel, getBulletModel } = await import("../bulletModel");
    const done = warmBulletModel("assets/models/bullet.glb");
    settleLoads("error");
    await done;

    expect(getBulletModel()).toBeNull();

    // A second warm call must not queue another load (failed guard).
    await warmBulletModel("assets/models/bullet.glb");
    expect(pendingLoads).toHaveLength(0);
    expect(getBulletModel()).toBeNull();
  });
});
