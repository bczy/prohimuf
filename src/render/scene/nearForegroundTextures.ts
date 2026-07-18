/**
 * Shared cache for the code-drawn near-foreground silhouette textures (ADR-0045),
 * mirroring `enemyTextures.ts`: one CanvasTexture per kind, built once and reused
 * across every instance and every scene mount. The loading gate warms them via
 * {@link warmNearForegroundTexture} (registered in the asset manifest as
 * `nearfg:<kind>` paths) so a prop never pops in untextured; the render reads them
 * through {@link getNearForegroundTexture}, which builds on demand as a fallback.
 */
import { CanvasTexture } from "three";
import type { NearForegroundKind } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { drawNearForegroundObject, NEAR_KIND_SPECS } from "./nearForegroundArt";
import { DEFAULT_SIGNAL, type SignalState } from "./trafficSignal";

// Texture height; width follows each kind's aspect. 512 keeps the thin details
// (traffic-light lenses, sign plate, lantern facets) crisp at in-game size.
const TEX_H = 512;

const cache = new Map<NearForegroundKind, CanvasTexture>();

// The traffic light is the one ANIMATED prop: its canvas + context are retained so
// NearForeground can repaint it (a new signal aspect) in place and flip
// `needsUpdate`, instead of building a fresh texture per phase. All instances share
// this one texture, so they cycle in sync (like a real carrefour on one controller).
let trafficCanvas: HTMLCanvasElement | null = null;
let trafficCtx: CanvasRenderingContext2D | null = null;
let trafficTex: CanvasTexture | null = null;
let trafficSignal: SignalState = DEFAULT_SIGNAL;

function isKind(kind: string): kind is NearForegroundKind {
  return Object.prototype.hasOwnProperty.call(NEAR_KIND_SPECS, kind);
}

// Draw one kind onto a fresh canvas and wrap it in a pixel-filtered texture
// (null in non-DOM contexts, e.g. the vitest/SSR path). The traffic light retains
// its canvas/context/texture at module scope for in-place repaint.
function build(kind: NearForegroundKind): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const texW = Math.round(TEX_H * NEAR_KIND_SPECS[kind].aspect);
  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;
  drawNearForegroundObject(
    g,
    kind,
    texW,
    TEX_H,
    kind === "trafficLight" ? { signal: trafficSignal } : undefined,
  );
  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  tex.needsUpdate = true;
  if (kind === "trafficLight") {
    trafficCanvas = canvas;
    trafficCtx = g;
    trafficTex = tex;
  }
  return tex;
}

/**
 * Repaint the shared traffic-light texture for a new signal aspect. No-op if the
 * aspect is unchanged, or before the texture is built (non-DOM / not yet warmed).
 * Called from NearForeground's frame loop off the signal-phase clock.
 */
export function updateTrafficLightSignal(signal: SignalState): void {
  trafficSignal = signal;
  if (trafficCanvas === null || trafficCtx === null || trafficTex === null) return;
  drawNearForegroundObject(trafficCtx, "trafficLight", trafficCanvas.width, trafficCanvas.height, {
    signal,
  });
  trafficTex.needsUpdate = true;
}

/**
 * Build + cache a kind's texture during the loading gate. Takes the raw kind
 * string from a `nearfg:<kind>` manifest path; an unknown kind is a no-op. ALWAYS
 * resolves, so a bad entry can never stall the preloader gate.
 */
export function warmNearForegroundTexture(kind: string): Promise<void> {
  if (isKind(kind) && !cache.has(kind)) {
    const tex = build(kind);
    if (tex !== null) cache.set(kind, tex);
  }
  return Promise.resolve();
}

/**
 * The cached texture for a kind, building (and caching) it on demand if the gate
 * did not warm it. Null only in non-DOM contexts.
 */
export function getNearForegroundTexture(kind: NearForegroundKind): CanvasTexture | null {
  const cached = cache.get(kind);
  if (cached !== undefined) return cached;
  const tex = build(kind);
  if (tex !== null) cache.set(kind, tex);
  return tex;
}
