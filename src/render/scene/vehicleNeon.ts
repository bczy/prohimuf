/**
 * Render-side neon rim for the delivery vehicles (ADR-0011).
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
import { applyHaloFalloff } from "./haloFalloff";

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
 * Neon rim thickness as a fraction of the sprite's *height*, in source pixels
 * (loi du glow, ADR-0011). Single source of truth for both the CPU falloff bake
 * (the canvas padding + gradient reach, here) and the rim mesh scale
 * ({@link DeliveryVehicleSprite}). Vehicle canvases are 2:1 with equal
 * world-per-pixel on both axes, so an equal pixel padding maps to an equal world
 * margin on all four sides.
 */
export const NEON_RIM_MARGIN_RATIO = 0.06; // tune at review

/**
 * Halo reach in source pixels for a sprite of the given size — the amount the
 * bake canvas is padded on every side and the distance the falloff fades over.
 * Both the silhouette bake and the rim mesh scale derive `marginPx` from this so
 * the baked gradient zone and the world-space rim margin coincide exactly.
 */
export function computeHaloMarginPx(width: number, height: number): number {
  return Math.max(0, Math.round(NEON_RIM_MARGIN_RATIO * height));
}

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
 * Bake a neon *glow* silhouette of a loaded sprite. The bake canvas is padded by
 * {@link computeHaloMarginPx} on every side (so the glow is never cropped); the
 * sprite is drawn centred and flooded with `hex` RGB. Alpha is the sprite's own
 * alpha on opaque pixels plus a smooth outward gradient in the margin / interior
 * transparent zones (via {@link applyHaloFalloff}) — a real light bleed, not the
 * former binary-alpha sticker (ADR-0011, story-halo-alpha-composite-gate). Run
 * through the same nearest / sRGB pixel filter as {@link makePixelCanvasTexture}
 * so it keys crisply under `AdditiveBlending`.
 */
export function buildNeonSilhouette(image: SilhouetteSource, hex: string): CanvasTexture {
  const { width, height } = sourceSize(image);
  const marginPx = computeHaloMarginPx(width, height);
  const paddedW = width + 2 * marginPx;
  const paddedH = height + 2 * marginPx;
  const canvas = document.createElement("canvas");
  canvas.width = paddedW;
  canvas.height = paddedH;
  const ctx = canvas.getContext("2d");
  if (ctx === null || width === 0 || height === 0) {
    return applyPixelFilter(new CanvasTexture(canvas));
  }

  // Draw the sprite centred in the padded canvas, un-smoothed (pixel-art).
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, marginPx, marginPx, width, height);

  const rgb = hexToRgb(hex);
  const img = ctx.getImageData(0, 0, paddedW, paddedH);
  const data = img.data;
  const pixels = paddedW * paddedH;

  // Pull the raw alpha channel, run the DOM-free falloff, then flood hue RGB
  // everywhere and write the gradient alpha back.
  const srcAlpha = new Uint8ClampedArray(pixels);
  for (let p = 0; p < pixels; p++) {
    srcAlpha[p] = data[p * 4 + 3] ?? 0;
  }
  const halo = applyHaloFalloff(srcAlpha, paddedW, paddedH, marginPx);
  for (let p = 0; p < pixels; p++) {
    const i = p * 4;
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
    data[i + 3] = halo[p] ?? 0;
  }
  ctx.putImageData(img, 0, 0);

  return applyPixelFilter(new CanvasTexture(canvas));
}
