/**
 * Style B (pixel art) shared helpers.
 *
 * The enemy and bullet sprites ship as pixel-art PNGs, but Three.js filters
 * textures linearly by default — which blurs the crisp pixels and breaks the
 * look. These helpers force nearest-neighbour filtering everywhere and turn
 * the procedurally-drawn facade / street canvases into chunky, palette-banded
 * 16-bit pixel art so the whole scene reads as a single art direction.
 */
import { CanvasTexture, NearestFilter } from "three";
import type { Texture } from "three";

/**
 * Make a texture render as crisp pixels: nearest-neighbour sampling, no
 * mipmaps. Safe to call on both loaded PNG textures and canvas textures.
 */
export function applyPixelFilter<T extends Texture>(texture: T): T {
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Quantize a colour channel to a small number of evenly-spaced levels so the
 * smooth gradients band into a cohesive retro palette.
 */
function posterizeChannel(value: number, levels: number): number {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

/**
 * Pixelate a canvas in place: collapse every `block`×`block` square into a
 * single averaged-then-posterized colour. Combined with {@link applyPixelFilter}
 * this yields a crisp 16-bit pixel-art surface from finely-drawn art.
 *
 * @param canvas  the canvas to mutate
 * @param block   source-pixel size of each art "pixel" (larger = chunkier)
 * @param levels  colour levels per RGB channel (smaller = more retro banding)
 */
export function pixelateCanvas(canvas: HTMLCanvasElement, block = 5, levels = 8): void {
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  const W = canvas.width;
  const H = canvas.height;
  if (W === 0 || H === 0) return;

  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;

  for (let by = 0; by < H; by += block) {
    for (let bx = 0; bx < W; bx += block) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      const maxY = Math.min(by + block, H);
      const maxX = Math.min(bx + block, W);
      for (let y = by; y < maxY; y++) {
        for (let x = bx; x < maxX; x++) {
          const i = (y * W + x) * 4;
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
          a += data[i + 3] ?? 0;
          count++;
        }
      }
      if (count === 0) continue;
      const pr = posterizeChannel(r / count, levels);
      const pg = posterizeChannel(g / count, levels);
      const pb = posterizeChannel(b / count, levels);
      const pa = Math.round(a / count);
      for (let y = by; y < maxY; y++) {
        for (let x = bx; x < maxX; x++) {
          const i = (y * W + x) * 4;
          data[i] = pr;
          data[i + 1] = pg;
          data[i + 2] = pb;
          data[i + 3] = pa;
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}

/**
 * Build a {@link CanvasTexture} from a canvas, pixelating it first and forcing
 * nearest-neighbour filtering — the one-stop helper for procedural surfaces.
 */
export function makePixelCanvasTexture(
  canvas: HTMLCanvasElement,
  block = 5,
  levels = 8,
): CanvasTexture {
  pixelateCanvas(canvas, block, levels);
  return applyPixelFilter(new CanvasTexture(canvas));
}
