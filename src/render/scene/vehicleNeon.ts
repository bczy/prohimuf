/**
 * Render-side neon rim for the delivery vehicles (ADR-0006).
 *
 * The vehicle sprites ship as pure black-and-white xerox (FLUX floods the body
 * when a neon token is in the generation prompt). The *loi du glow* — «ce qui
 * brille est interactif» (docs/art-direction.md §2.1) — therefore moves to the
 * render layer: a CPU-baked neon silhouette of the sprite drawn behind it with
 * additive blending (see {@link DeliveryVehicleSprite}).
 *
 * Boundary: this is render-only. The hue *assignment* stays authored data in
 * `levelArt.json` (`vehicles.types[*].neon` — a colour NAME); the name→hex map
 * lives here as a render constant anchored to the art bible §2.1. The hue never
 * enters `GameState` / game logic.
 */
import { CanvasTexture } from "three";
import type { VehicleType } from "@game/types/delivery";
import levelArt from "@game/levels/levelArt.json";
import { applyPixelFilter } from "./pixelArt";

/**
 * Neon accent hues, keyed by the colour NAME authored in `levelArt.json`.
 * Anchored to docs/art-direction.md §2.1 (same hex the generator's `NEON_HEX`
 * uses — do NOT fork the palette). This is the render-side copy of the single
 * hue→color source of truth.
 */
const NEON_HEX: Record<string, string> = {
  orange: "#FF8C14",
  cyan: "#28F0FF",
  magenta: "#FF3CDC",
  green: "#78FF3C",
};

/** Fallback hue when a type carries no (or an unknown) neon name. */
const DEFAULT_NEON_HEX = "#28F0FF"; // cyan

/**
 * Source pixels whose alpha exceeds this (0..255) become solid neon; the rest
 * go fully transparent. The vehicle sprites have hard-binary alpha, so the
 * exact value only matters for stray anti-aliased fringe pixels.
 */
const ALPHA_THRESHOLD = 8;

/** Anything drawable to a 2D canvas that we bake a silhouette from. */
type SilhouetteSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

/**
 * Resolve a vehicle type to its neon rim hex, via the colour NAME authored in
 * `levelArt.json` `vehicles.types[type].neon`. Defaults to cyan.
 */
export function getVehicleNeonHex(type: VehicleType): string {
  const neonName = levelArt.vehicles.types[type].neon;
  return NEON_HEX[neonName] ?? DEFAULT_NEON_HEX;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function sourceSize(image: SilhouetteSource): { width: number; height: number } {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: image.width, height: image.height };
}

/**
 * Bake a neon silhouette of a loaded sprite: every source pixel above
 * {@link ALPHA_THRESHOLD} becomes the solid `hex` RGB at its source alpha,
 * everything else transparent. Run through the same nearest / sRGB pixel
 * filter as {@link makePixelCanvasTexture} so it keys crisply (ADR-0006).
 */
export function buildNeonSilhouette(image: SilhouetteSource, hex: string): CanvasTexture {
  const { width, height } = sourceSize(image);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx === null || width === 0 || height === 0) {
    return applyPixelFilter(new CanvasTexture(canvas));
  }

  ctx.drawImage(image, 0, 0, width, height);
  const rgb = hexToRgb(hex);
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] ?? 0;
    if (alpha > ALPHA_THRESHOLD) {
      data[i] = rgb.r;
      data[i + 1] = rgb.g;
      data[i + 2] = rgb.b;
    } else {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);

  return applyPixelFilter(new CanvasTexture(canvas));
}
