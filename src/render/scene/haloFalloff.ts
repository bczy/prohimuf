/**
 * Pure, DOM-free alpha-halo falloff for the render-side neon rim (ADR-0011).
 *
 * The vehicle neon rim used to bake a *binary-alpha* silhouette — every opaque
 * source pixel became solid hue, everything else fully transparent — so the
 * margin drawn behind the sprite read as a hard-edged sticker, not a glow
 * (Bertrand's rejection, story-halo-alpha-composite-gate). This module turns a
 * raw single-channel alpha buffer into a smooth outward gradient: opaque source
 * pixels keep their alpha, and each transparent pixel fades with its distance to
 * the nearest opaque edge, reaching zero at `marginPx`.
 *
 * Distance is a two-pass **chamfer** distance transform (3-4 integer weights):
 * O(width·height), allocation-light, fully deterministic, and free of any canvas
 * or DOM dependency so it unit-tests without a browser. The falloff curve is a
 * quadratic ease-out, `alpha(d) = round(255 · (1 − d/marginPx)²)`, which reads as
 * a physically-plausible light bleed under `AdditiveBlending`.
 */

/**
 * Source alpha (0..255) at or below which a pixel counts as *transparent* (i.e.
 * a halo candidate). Anything strictly above is an opaque source pixel that
 * keeps its own alpha. Mirrors the binary-alpha semantics the vehicle sprites
 * were baked with, so stray anti-aliased fringe pixels do not seed the halo.
 */
export const ALPHA_THRESHOLD = 8;

/**
 * Chamfer 3-4 weights. Orthogonal steps cost 3 and diagonal steps cost 4, an
 * integer approximation of Euclidean distance scaled by {@link CHAMFER_SCALE}.
 */
const ORTHO = 3;
const DIAG = 4;
/** Chamfer units per source pixel (the orthogonal weight). */
const CHAMFER_SCALE = 3;
/** Sentinel "unreached" distance, larger than any real chamfer distance. */
const FAR = 0x3fffffff;

/**
 * Apply an outward alpha-gradient halo to a single-channel alpha buffer.
 *
 * @param alpha    Row-major alpha buffer, one value per pixel, length `width·height`.
 *                 Values are read `0..255`; entries past the buffer are treated as 0.
 * @param width    Buffer width in pixels (≥ 0).
 * @param height   Buffer height in pixels (≥ 0).
 * @param marginPx Halo reach in pixels: a transparent pixel exactly `marginPx`
 *                 (or further) from any opaque pixel is fully transparent.
 * @returns A fresh `Uint8ClampedArray` (length `width·height`): opaque source
 *          pixels keep their source alpha; transparent pixels within the margin
 *          carry the quadratic falloff; everything else is 0. Degenerate inputs
 *          (empty buffer, `marginPx ≤ 0`) return safely with no falloff band.
 */
export function applyHaloFalloff(
  alpha: Uint8ClampedArray | number[],
  width: number,
  height: number,
  marginPx: number,
): Uint8ClampedArray {
  const n = width > 0 && height > 0 ? width * height : 0;
  const out = new Uint8ClampedArray(n);
  if (n === 0) return out;

  // Seed the distance field: 0 at opaque pixels, FAR everywhere else. Opaque
  // pixels also copy their source alpha straight into the output.
  const dist = new Int32Array(n);
  for (let p = 0; p < n; p++) {
    const a = alpha[p] ?? 0;
    if (a > ALPHA_THRESHOLD) {
      dist[p] = 0;
      out[p] = a;
    } else {
      dist[p] = FAR;
    }
  }

  // Nothing to fade into if the halo has no reach — opaque pixels are already
  // written, transparent pixels stay 0.
  if (marginPx <= 0) return out;

  // Forward pass: propagate distance from top-left toward bottom-right.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (dist[idx] === 0) continue;
      let d = dist[idx] ?? FAR;
      if (x > 0) d = Math.min(d, (dist[idx - 1] ?? FAR) + ORTHO);
      if (y > 0) {
        d = Math.min(d, (dist[idx - width] ?? FAR) + ORTHO);
        if (x > 0) d = Math.min(d, (dist[idx - width - 1] ?? FAR) + DIAG);
        if (x < width - 1) d = Math.min(d, (dist[idx - width + 1] ?? FAR) + DIAG);
      }
      dist[idx] = d;
    }
  }

  // Backward pass: propagate from bottom-right toward top-left. Together the two
  // passes give the exact chamfer distance for every pixel.
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const idx = y * width + x;
      if (dist[idx] === 0) continue;
      let d = dist[idx] ?? FAR;
      if (x < width - 1) d = Math.min(d, (dist[idx + 1] ?? FAR) + ORTHO);
      if (y < height - 1) {
        d = Math.min(d, (dist[idx + width] ?? FAR) + ORTHO);
        if (x < width - 1) d = Math.min(d, (dist[idx + width + 1] ?? FAR) + DIAG);
        if (x > 0) d = Math.min(d, (dist[idx + width - 1] ?? FAR) + DIAG);
      }
      dist[idx] = d;
    }
  }

  // Quadratic ease-out falloff over the margin band. Opaque pixels (dist 0) are
  // already written and skipped here.
  for (let p = 0; p < n; p++) {
    const chamfer = dist[p] ?? FAR;
    if (chamfer === 0 || chamfer === FAR) continue;
    const d = chamfer / CHAMFER_SCALE;
    if (d <= 0 || d >= marginPx) continue;
    const t = 1 - d / marginPx;
    out[p] = Math.round(255 * t * t);
  }

  return out;
}
