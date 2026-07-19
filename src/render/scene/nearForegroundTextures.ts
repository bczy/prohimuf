/**
 * Shared cache for the near-foreground décor prop textures (ADR-0047, amended by
 * ADR-0049: generated-with-procedural-fallback). Mirrors `enemyTextures.ts`: one
 * texture per kind, built once and reused across every instance and scene mount.
 *
 * {@link warmNearForegroundTexture} (registered in the asset manifest as
 * `nearfg:<kind>` paths) SYNCHRONOUSLY builds + caches the procedural CanvasTexture
 * first — the guaranteed fallback so the loading gate never stalls — then async-loads
 * the generated PNG and swaps the cache entry on success. A missing block / 404 /
 * non-DOM context keeps the procedural texture. The render reads through
 * {@link getNearForegroundTexture}, which builds the procedural fallback on demand.
 *
 * The feu tricolore's animated lit lens lives on a SEPARATE transparent overlay
 * texture ({@link getTrafficLightOverlayTexture}) repainted by
 * {@link updateTrafficLightSignal}; the housing texture (PNG or procedural) is a
 * static dead-grey signal.
 */
import { CanvasTexture, TextureLoader } from "three";
import type { Texture } from "three";
import { nearForegroundArtAsset, trafficLightLenses } from "@game/levels/levelArt";
import type { NearForegroundKind } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { drawNearForegroundObject, drawSignalLenses, NEAR_KIND_SPECS } from "./nearForegroundArt";
import { DEFAULT_SIGNAL, type SignalState } from "./trafficSignal";

// Texture height; width follows each kind's aspect. 512 keeps the thin details
// (traffic-light lenses, sign plate, lantern facets) crisp at in-game size.
const TEX_H = 512;

// Cache holds the loaded PNG once swapped, else the procedural CanvasTexture, so
// the type is the wider `Texture`.
const cache = new Map<NearForegroundKind, Texture>();

// Generated-PNG loading — mirror enemyTextures' pending/failed guards so a swap is
// attempted at most once per kind and can never be re-issued per frame.
const loader = new TextureLoader();
const pending = new Set<NearForegroundKind>();
const failed = new Set<NearForegroundKind>();
const loaded = new Set<NearForegroundKind>();
const base = import.meta.env.BASE_URL;

function isKind(kind: string): kind is NearForegroundKind {
  return Object.prototype.hasOwnProperty.call(NEAR_KIND_SPECS, kind);
}

// Draw one kind's procedural silhouette onto a fresh canvas and wrap it in a
// pixel-filtered CanvasTexture (null in non-DOM contexts, e.g. vitest/SSR).
function buildProcedural(kind: NearForegroundKind): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const texW = Math.round(TEX_H * NEAR_KIND_SPECS[kind].aspect);
  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;
  drawNearForegroundObject(g, kind, texW, TEX_H);
  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  tex.needsUpdate = true;
  return tex;
}

// Ensure the procedural texture is cached (once). Returns the cached texture —
// which is the swapped PNG if a generated load already succeeded — or null in a
// non-DOM context.
function ensureProcedural(kind: NearForegroundKind): Texture | null {
  const cached = cache.get(kind);
  if (cached !== undefined) return cached;
  const tex = buildProcedural(kind);
  if (tex !== null) cache.set(kind, tex);
  return tex;
}

// Async-load the generated PNG and swap the cache entry on success, disposing the
// procedural texture it replaces. Missing block / 404 / non-DOM keep the procedural
// entry. Never throws / never rejects; at most one load per kind (pending/failed).
function loadGenerated(kind: NearForegroundKind): void {
  if (loaded.has(kind) || pending.has(kind) || failed.has(kind)) return;
  const rel = nearForegroundArtAsset(kind);
  if (rel === null) return; // block absent → procedural stays
  pending.add(kind);
  loader.load(
    `${base}${rel}`,
    (t) => {
      pending.delete(kind);
      loaded.add(kind);
      const previous = cache.get(kind);
      cache.set(kind, applyPixelFilter(t));
      if (previous instanceof CanvasTexture) previous.dispose();
    },
    undefined,
    () => {
      pending.delete(kind);
      failed.add(kind);
    },
  );
}

/**
 * Warm a kind's texture during the loading gate. Takes the raw kind string from a
 * `nearfg:<kind>` manifest path; an unknown kind is a no-op. Builds + caches the
 * procedural fallback synchronously (so {@link getNearForegroundTexture} is non-null
 * from this tick on), THEN kicks off the async generated-PNG load which swaps on
 * success. ALWAYS resolves, so a missing/uncommitted PNG can never stall the gate.
 */
export function warmNearForegroundTexture(kind: string): Promise<void> {
  if (isKind(kind)) {
    ensureProcedural(kind);
    loadGenerated(kind);
  }
  return Promise.resolve();
}

/**
 * The cached texture for a kind (loaded PNG once swapped, else the procedural
 * fallback), building the procedural texture on demand if the gate never warmed it.
 * Null only in non-DOM contexts. Does NOT issue a PNG load — only the loading gate
 * ({@link warmNearForegroundTexture}) does.
 */
export function getNearForegroundTexture(kind: NearForegroundKind): Texture | null {
  return ensureProcedural(kind);
}

// --- Feu tricolore lit-lens overlay ---------------------------------------
// A SEPARATE transparent texture carrying ONLY the lit coloured lens + halo. Its
// canvas/context/texture are retained at module scope for in-place repaint (the
// same pattern the whole-prop texture used before ADR-0049). All instances share
// this one overlay, so they cycle in sync (one carrefour controller).
let overlayCanvas: HTMLCanvasElement | null = null;
let overlayCtx: CanvasRenderingContext2D | null = null;
let overlayTex: CanvasTexture | null = null;
let overlaySignal: SignalState = DEFAULT_SIGNAL;

// Repaint the overlay for the current `overlaySignal`. No-op before the overlay is
// built (non-DOM / not yet requested).
function paintOverlay(): void {
  if (overlayCanvas === null || overlayCtx === null || overlayTex === null) return;
  drawSignalLenses(
    overlayCtx,
    overlayCanvas.width,
    overlayCanvas.height,
    trafficLightLenses(),
    overlaySignal,
  );
  overlayTex.needsUpdate = true;
}

/**
 * The shared feu-tricolore lit-lens overlay texture, built (transparent, sized to
 * the trafficLight aspect) and painted for the current signal on first request.
 * Null only in non-DOM contexts.
 */
export function getTrafficLightOverlayTexture(): Texture | null {
  if (overlayTex !== null) return overlayTex;
  if (typeof document === "undefined") return null;
  const texW = Math.round(TEX_H * NEAR_KIND_SPECS.trafficLight.aspect);
  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;
  overlayCanvas = canvas;
  overlayCtx = g;
  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  overlayTex = tex;
  paintOverlay();
  return tex;
}

/**
 * Repaint the shared overlay for a new signal aspect. No-op if unchanged, or before
 * the overlay texture is built. Called from NearForeground's frame loop off the
 * signal-phase clock; the housing texture is never touched.
 */
export function updateTrafficLightSignal(signal: SignalState): void {
  overlaySignal = signal;
  paintOverlay();
}
