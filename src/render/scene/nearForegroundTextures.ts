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
import { GENERATED_PLANS } from "@game/levels/generated";
import { applyPixelFilter } from "./pixelArt";
import { drawNearForegroundObject, drawSignalLenses, NEAR_KIND_SPECS } from "./nearForegroundArt";
import { DEFAULT_SIGNAL, type SignalState } from "./trafficSignal";

// Texture height; width follows each kind's aspect. 512 keeps the thin details
// (traffic-light lenses, sign plate, lantern facets) crisp at in-game size.
const TEX_H = 512;

// Cache holds the CURRENT best texture per kind: the procedural CanvasTexture until
// the generated PNG swaps in, so the type is the wider `Texture`. Keys are strings:
// a pool kind, or a generated level's namespaced prop kind (PNG-only, no procedural).
const cache = new Map<string, Texture>();

// Procedural fallback textures, retained per kind and NEVER disposed. A live
// material can still bind the procedural texture after the async swap — the
// per-frame re-read in NearForeground rebinds it lazily, and disposing a still-bound
// texture deletes its GPU resource mid-render (the mesh goes black). One small canvas
// per kind, so retaining it for the session is cheap insurance.
const procedural = new Map<NearForegroundKind, CanvasTexture>();

// Generated-PNG loading — mirror enemyTextures' pending/failed guards so a swap is
// attempted at most once per kind and can never be re-issued per frame.
const loader = new TextureLoader();
const pending = new Set<string>();
const failed = new Set<string>();
const loaded = new Set<string>();
const base = import.meta.env.BASE_URL;

// Asset path of each generated level's props, keyed by namespaced kind. A generated
// prop is PNG-or-nothing (spec-level-harness-sp1 §4.5): no procedural drawing exists
// for it, so a missing/failed PNG leaves NO cache entry and the prop never renders.
const GENERATED_PROP_ASSETS: Readonly<Record<string, string>> = Object.fromEntries(
  GENERATED_PLANS.flatMap((p) => p.props.map((prop) => [prop.kind, prop.asset])),
);

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
  if (tex !== null) {
    procedural.set(kind, tex); // retained (never disposed) — see `procedural` above
    cache.set(kind, tex);
  }
  return tex;
}

// Async-load the generated PNG and swap the cache entry on success. The procedural
// texture it replaces is NOT disposed (it is retained in `procedural` and may still
// be bound to a live material until the per-frame re-read rebinds it). Missing block
// / 404 / non-DOM keep the procedural entry. Never throws / never rejects; at most
// one load per kind (loaded/pending/failed guards).
function loadGenerated(kind: NearForegroundKind): void {
  const rel = nearForegroundArtAsset(kind);
  if (rel === null) return; // block absent → procedural stays
  loadIntoCache(kind, rel);
}

// The ONE PNG-loading path both loaders share: pending/failed/loaded bookkeeping
// around a single loader.load, swapping the cache entry on success. Any change to
// the loading contract (progress callback, base prefixing, failure disposal) lands
// here once and covers pool kinds and generated props alike.
function loadIntoCache(kind: string, rel: string): void {
  if (loaded.has(kind) || pending.has(kind) || failed.has(kind)) return;
  if (typeof document === "undefined") return; // non-DOM (node/SSR): nothing to load
  pending.add(kind);
  loader.load(
    `${base}${rel}`,
    (t) => {
      pending.delete(kind);
      loaded.add(kind);
      cache.set(kind, applyPixelFilter(t));
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
  } else {
    loadGeneratedProp(kind);
  }
  return Promise.resolve();
}

// Async-load a generated level's prop PNG (namespaced kind). Same guards as
// loadGenerated, but with NO procedural first step: success is the ONLY way this
// kind ever gets a cache entry, so a 404 simply leaves the prop invisible —
// silently, never a crash, never a fallback drawing (spec §4.5/§6). Unknown kinds
// (no asset in any plan) are a no-op.
function loadGeneratedProp(kind: string): void {
  const rel = GENERATED_PROP_ASSETS[kind];
  if (rel === undefined) return;
  loadIntoCache(kind, rel);
}

/**
 * The cached texture for a kind (loaded PNG once swapped, else the procedural
 * fallback), building the procedural texture on demand if the gate never warmed it.
 * A generated (namespaced) kind has NO procedural fallback: null until — and
 * unless — its PNG loads, which is exactly what keeps an asset-less generated prop
 * invisible. Null also in non-DOM contexts. Does NOT issue a PNG load — only the
 * loading gate ({@link warmNearForegroundTexture}) does.
 */
export function getNearForegroundTexture(kind: string): Texture | null {
  if (isKind(kind)) return ensureProcedural(kind);
  return cache.get(kind) ?? null;
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
 * Repaint the shared overlay for a signal aspect (always repaints when called; the
 * NearForeground frame loop dedupes on the signal key so it only calls on a phase
 * change). No-op only before the overlay texture is built (non-DOM / not yet
 * requested). The housing texture is never touched.
 */
export function updateTrafficLightSignal(signal: SignalState): void {
  overlaySignal = signal;
  paintOverlay();
}
