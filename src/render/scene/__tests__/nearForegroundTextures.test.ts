import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type * as Three from "three";
import type * as NearFgTextures from "../nearForegroundTextures";

/**
 * ADR-0049 texture pipeline: {@link warmNearForegroundTexture} builds the procedural
 * CanvasTexture SYNCHRONOUSLY (guaranteed fallback) then async-loads the generated
 * PNG and swaps the cache entry on success. A 404 keeps the procedural texture; a
 * kind absent from the `nearForegroundArt` block never issues a load. TextureLoader
 * is mocked to settle synchronously (success by URL); the JSON block is injected so
 * the asset accessor yields paths; happy-dom's null canvas context is stubbed so the
 * procedural build produces a real CanvasTexture.
 */

const { loadCalls } = vi.hoisted(() => ({ loadCalls: [] as string[] }));

// Real three except a controllable TextureLoader: success unless the URL is a bench
// (our 404 fixture). onLoad receives a real (non-Canvas) Texture so a successful
// swap is observable as "no longer a CanvasTexture".
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof Three>();
  class MockTextureLoader {
    load(
      url: string,
      onLoad?: (t: Three.Texture) => void,
      _onProgress?: unknown,
      onError?: (e: unknown) => void,
    ): void {
      loadCalls.push(url);
      if (url.includes("bench")) {
        onError?.(new Error("404"));
      } else {
        onLoad?.(new actual.Texture());
      }
    }
  }
  return { ...actual, TextureLoader: MockTextureLoader };
});

// Inject the generation block: parkingMeter + bench carry asset paths; lamppost is
// deliberately absent so the "missing → procedural stays" path is deterministic.
vi.mock("@game/levels/levelArt.json", async (importOriginal) => {
  const actual = await importOriginal<{ default: Record<string, unknown> }>();
  return {
    default: {
      ...actual.default,
      nearForegroundArt: {
        types: {
          parkingMeter: {
            asset: "assets/nearfg/parkingMeter.png",
            size: { width: 256, height: 512 },
            seed: 1,
            prompt: "x",
          },
          bench: {
            asset: "assets/nearfg/bench.png",
            size: { width: 870, height: 512 },
            seed: 2,
            prompt: "x",
          },
        },
      },
    },
  };
});

// happy-dom canvases have no 2D context; hand the procedural draw a no-op ctx so the
// CanvasTexture fallback is actually produced.
const noopCtx = new Proxy(
  {},
  {
    get(_t, prop): unknown {
      if (prop === "createRadialGradient")
        return (): unknown => ({ addColorStop: (): void => undefined });
      return (): void => undefined;
    },
    set(): boolean {
      return true;
    },
  },
);

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => noopCtx as unknown as CanvasRenderingContext2D,
  );
});
afterAll(() => {
  vi.restoreAllMocks();
});
beforeEach(() => {
  loadCalls.length = 0;
  vi.resetModules();
});

type Mod = typeof NearFgTextures;

describe("warmNearForegroundTexture — procedural fallback + generated swap", () => {
  it("swaps to the loaded PNG on a successful generated load", async () => {
    const { CanvasTexture } = await import("three");
    const mod: Mod = await import("../nearForegroundTextures");
    await mod.warmNearForegroundTexture("parkingMeter");
    const tex = mod.getNearForegroundTexture("parkingMeter");
    expect(tex).not.toBeNull();
    // Swapped: the cache now holds the loaded Texture, not the procedural CanvasTexture.
    expect(tex instanceof CanvasTexture).toBe(false);
    expect(loadCalls.some((u) => u.includes("parkingMeter.png"))).toBe(true);
  });

  it("keeps the procedural CanvasTexture on a 404", async () => {
    const { CanvasTexture } = await import("three");
    const mod: Mod = await import("../nearForegroundTextures");
    await mod.warmNearForegroundTexture("bench");
    const tex = mod.getNearForegroundTexture("bench");
    expect(tex).not.toBeNull();
    expect(tex instanceof CanvasTexture).toBe(true);
    expect(loadCalls.some((u) => u.includes("bench.png"))).toBe(true);
  });

  it("never issues a load for a kind absent from the block (procedural stays)", async () => {
    const { CanvasTexture } = await import("three");
    const mod: Mod = await import("../nearForegroundTextures");
    await mod.warmNearForegroundTexture("lamppost");
    const tex = mod.getNearForegroundTexture("lamppost");
    expect(tex instanceof CanvasTexture).toBe(true);
    expect(loadCalls.some((u) => u.includes("lamppost"))).toBe(false);
  });

  it("loads at most once even when warmed twice (pending/loaded guard)", async () => {
    const mod: Mod = await import("../nearForegroundTextures");
    await mod.warmNearForegroundTexture("parkingMeter");
    await mod.warmNearForegroundTexture("parkingMeter");
    expect(loadCalls.filter((u) => u.includes("parkingMeter.png"))).toHaveLength(1);
  });

  it("is a no-op for an unknown kind and always resolves", async () => {
    const mod: Mod = await import("../nearForegroundTextures");
    await expect(mod.warmNearForegroundTexture("notAKind")).resolves.toBeUndefined();
    expect(loadCalls).toHaveLength(0);
  });
});

describe("getTrafficLightOverlayTexture / updateTrafficLightSignal", () => {
  it("builds a transparent overlay texture and repaints on a signal change", async () => {
    const { CanvasTexture } = await import("three");
    const mod: Mod = await import("../nearForegroundTextures");
    const overlay = mod.getTrafficLightOverlayTexture();
    expect(overlay).not.toBeNull();
    expect(overlay instanceof CanvasTexture).toBe(true);
    // Same shared instance returned; repaint just flips needsUpdate, never throws.
    expect(mod.getTrafficLightOverlayTexture()).toBe(overlay);
    expect(() => {
      mod.updateTrafficLightSignal({ vehicle: "red", ped: "green" });
    }).not.toThrow();
  });
});
