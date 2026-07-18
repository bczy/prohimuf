/**
 * Shared chroma-key pixel primitives (ADR-0007 D2) — the corner-average key
 * colour and the squared-RGB-distance "is this pixel the background" test
 * that both cutout-enemies.mjs's border flood-fill and cutout-foreground.mjs's
 * flat magenta key are built from.
 *
 * Pure: operates only on the `{ width, height, data }` object passed in (a
 * real Canvas ImageData or a plain object of the same shape both work — the
 * `data` is any array-like indexable by byte offset), no fs/network/canvas
 * dependency, so it is unit-testable with a synthetic object (see
 * scripts/lib/__tests__/cutout.test.mjs, the ADR's corner/interior case).
 *
 * `chromaKey` is the pure pixel DECISION applied globally — no connectivity /
 * topology reasoning. That is exactly what cutout-foreground.mjs needs: the
 * flat magenta ground has no legitimate near-magenta subject pixel to
 * protect via connectivity, so a plain "clear everything close enough to the
 * key" pass is correct and matches its previous (isMagenta) behaviour on the
 * committed art.
 *
 * cutout-enemies.mjs's cop sprites are the opposite case — dark clothing can
 * sit close to the sampled ground colour, so a global apply would over-clear
 * into the subject. Its border-flood-fill (only clears background CONNECTED
 * to an edge) and its enclosed-island pass stay LOCAL on purpose (SCRIPTS.md:
 * "deliberately fused... does NOT map to a pure primitive") — they reuse only
 * `dist2` / `isBackgroundPixel` / `cornerAverageKey` from here for the
 * per-pixel test and ground-colour computation, never the batch `chromaKey`
 * apply, so the flood's connectivity behaviour (and therefore its output on
 * every committed enemy_*.png) is unchanged byte-for-byte.
 */

/** Squared Euclidean RGB distance — the one comparison every keyer needs. */
export function dist2(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/** Is the pixel at byte offset `o` of `data` within `thresholdSq` of `key`? */
export function isBackgroundPixel(data, o, key, thresholdSq) {
  return dist2(data[o], data[o + 1], data[o + 2], key.r, key.g, key.b) <= thresholdSq;
}

/**
 * Corner-average ground colour: mean RGB of the image's four corners,
 * skipping any that are already transparent (a pre-keyed sprite carries no
 * ground info there — see cutout-enemies.mjs's ADR-0013 handling). Returns
 * `null` when every corner is transparent, so the caller can apply its own
 * fallback policy instead of silently keying against (0,0,0).
 */
export function cornerAverageKey({ width, height, data }) {
  const corners = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const o of corners) {
    if (data[o + 3] === 0) continue;
    r += data[o];
    g += data[o + 1];
    b += data[o + 2];
    n++;
  }
  if (n === 0) return null;
  return { r: r / n, g: g / n, b: b / n };
}

/**
 * The pure pixel decision, applied to the WHOLE image with no connectivity
 * reasoning: clears (alpha = 0) every currently-opaque pixel within
 * `thresholdSq` of `key` (squared RGB distance). Mutates `imageData.data` in
 * place; returns the count of pixels cleared. See the module doc for when
 * this global apply is (and is not) the right tool.
 */
export function chromaKey(imageData, key, thresholdSq) {
  const { data } = imageData;
  let cleared = 0;
  for (let o = 0; o < data.length; o += 4) {
    if (data[o + 3] === 0) continue; // already transparent — not re-counted
    if (isBackgroundPixel(data, o, key, thresholdSq)) {
      data[o + 3] = 0;
      cleared++;
    }
  }
  return cleared;
}
