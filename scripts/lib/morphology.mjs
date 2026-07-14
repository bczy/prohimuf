/**
 * Shared binary-image morphology primitives for the asset-pipeline scripts.
 *
 * ── One source of truth (ADR-0014 / ADR-0019) ────────────────────────────────
 * These geometric primitives (disk structuring elements, dilate / erode /
 * closing, border-seeded hole fill, connected-component labelling, largest
 * component, normalized-rect zone masks, and the figure SOLID-BODY reconstruction)
 * were previously copied by hand across `fill-sprite-holes.mjs`,
 * `retouch-flash-halos.mjs`, `restore-figure-bites.mjs`, `fill-bust-hem.mjs`,
 * `check-sprite-integrity.mjs` and `measure-muzzle-anchors.mjs`. The retouch copy
 * carried a "re-sync if that script's morphology changes" comment — a desync class
 * enforced only by human discipline. This module removes that class: every consumer
 * imports the ONE implementation here, and `solidBodyMask` in particular is the
 * single body-reconstruction used both by the solidify pass and by the retouch
 * reconcile, so they can no longer drift apart (that was the correctness contract).
 *
 * ── Mask convention ──────────────────────────────────────────────────────────
 * A mask is a `Uint8Array` of length `W*H`, ROW-MAJOR, `idx = y*W + x`, values
 * `0 | 1` (NOT bit-packed). This module never touches RGBA / alpha — callers build
 * the opaque predicate / mask and pass it in. Pure functions, no I/O.
 *
 * Behaviour is FROZEN: the code below is lifted verbatim from the reference copies
 * (fill-sprite-holes.mjs for the geometric primitives + solidBodyMask, with the one
 * documented `outsideBelowBottom` divergence for fill-bust-hem's erode). Any change
 * here changes committed sprite bytes — do not "improve" it without re-proving the
 * `--check` fixpoint on every enemy PNG.
 */

// Neighbour offsets. Order is irrelevant to component membership (a component is a
// well-defined set); these match the historical call-site orders for clarity.
const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const N8 = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/** Precompute the (dx,dy) offsets of a disk structuring element of the given radius. */
export function diskOffsets(r) {
  const o = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) o.push([dx, dy]);
    }
  }
  return o;
}

/** Binary dilation by a structuring element (precomputed offsets). Out-of-bounds ignored. */
export function dilate(mask, W, H, offsets) {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) out[ny * W + nx] = 1;
      }
    }
  }
  return out;
}

/**
 * Binary erosion by a structuring element (precomputed offsets).
 *
 * By default (matching fill-sprite-holes / retouch / restore) an out-of-bounds
 * neighbour counts as EMPTY, so the border erodes. `opts.outsideBelowBottom` (default
 * false) is the ONE geometric divergence in the historical copies: fill-bust-hem.mjs
 * passes `true`, treating neighbours BELOW the bottom edge (`ny >= H`) as FILLED — the
 * bust is frame-cut there, so counting the outside as background would erode the hem it
 * is trying to grow. Preserve this flag; never unify the two behaviours.
 */
export function erode(mask, W, H, offsets, opts = {}) {
  const outsideBelowBottom = opts.outsideBelowBottom ?? false;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let all = 1;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        let v;
        if (outsideBelowBottom && ny >= H) {
          v = 1;
        } else if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
          v = 0;
        } else {
          v = mask[ny * W + nx];
        }
        if (!v) {
          all = 0;
          break;
        }
      }
      out[y * W + x] = all;
    }
  }
  return out;
}

/**
 * binary_fill_holes: flood the INVERSE mask from the image border (4-connectivity —
 * every consumer is 4-conn); any inverse pixel the flood never reaches is an interior
 * hole → set it in the mask.
 */
export function fillHoles(mask, W, H) {
  const N = W * H;
  const reach = new Uint8Array(N);
  const st = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (reach[i] || mask[i]) return;
    reach[i] = 1;
    st.push(i);
  };
  for (let x = 0; x < W; x++) {
    push(x, 0);
    push(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  while (st.length) {
    const i = st.pop();
    const x = i % W;
    const y = (i / W) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  const out = new Uint8Array(N);
  for (let i = 0; i < N; i++) out[i] = mask[i] || !reach[i] ? 1 : 0;
  return out;
}

/**
 * Keep only the largest connected component of a binary mask. 4-connectivity
 * only, deliberately: every production consumer treats the figure as one solid
 * 4-conn mass (8-conn would annex diagonally-touching keying debris). Use
 * labelComponents({ connectivity: 8 }) when diagonal merging is wanted.
 */
export function largestComponent(mask, W, H) {
  const N = W * H;
  const seen = new Uint8Array(N);
  const nb = N4;
  let best = null;
  let bestSize = 0;
  for (let i = 0; i < N; i++) {
    if (!mask[i] || seen[i]) continue;
    const comp = [];
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      comp.push(j);
      const x = j % W;
      const y = (j / W) | 0;
      for (const [dx, dy] of nb) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (mask[k] && !seen[k]) {
          seen[k] = 1;
          q.push(k);
        }
      }
    }
    if (comp.length > bestSize) {
      bestSize = comp.length;
      best = comp;
    }
  }
  const out = new Uint8Array(N);
  if (best) for (const j of best) out[j] = 1;
  return out;
}

/**
 * Label the connected components of a pixel predicate `keep(p)`. Pure. Returns an array
 * of `{ size, bbox:[x0,y0,x1,y1], touchesBorder, pixels? }` sorted LARGEST-FIRST.
 *
 * Subsumes the three hand-rolled labelers: check-sprite-integrity's (4-conn, bbox, no
 * pixels), retouch's sweepSpeckle (4-conn, pixels) and measure-muzzle-anchors' anchor CC
 * (8-conn, pixels).
 *
 * @param opts.connectivity  4 (default) or 8.
 * @param opts.collectPixels when true, each component carries a `pixels` array of indices.
 */
export function labelComponents(W, H, keep, opts = {}) {
  const connectivity = opts.connectivity ?? 4;
  const collectPixels = opts.collectPixels ?? false;
  const nb = connectivity === 8 ? N8 : N4;
  const N = W * H;
  const label = new Int32Array(N).fill(-1);
  const comps = [];
  for (let start = 0; start < N; start++) {
    if (label[start] !== -1 || !keep(start)) continue;
    const id = comps.length;
    const stack = [start];
    label[start] = id;
    let size = 0;
    let x0 = W;
    let y0 = H;
    let x1 = 0;
    let y1 = 0;
    let touchesBorder = false;
    const pixels = collectPixels ? [] : null;
    while (stack.length) {
      const p = stack.pop();
      size++;
      if (collectPixels) pixels.push(p);
      const x = p % W;
      const y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesBorder = true;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const [dx, dy] of nb) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (label[np] === -1 && keep(np)) {
          label[np] = id;
          stack.push(np);
        }
      }
    }
    const comp = { size, bbox: [x0, y0, x1, y1], touchesBorder };
    if (collectPixels) comp.pixels = pixels;
    comps.push(comp);
  }
  comps.sort((a, b) => b.size - a.size);
  return comps;
}

/**
 * Build an in-zone mask from an array of normalized rects `[nx0,ny0,nx1,ny1]` (0..1 of
 * W/H). Single-rect callers wrap their rect in `[zone]`. Pure. A falsy `zones` yields an
 * empty mask (matches the retouch/restore guard).
 */
export function zoneMask(zones, W, H) {
  const m = new Uint8Array(W * H);
  if (!zones) return m;
  for (const [nx0, ny0, nx1, ny1] of zones) {
    const x0 = Math.max(0, Math.floor(nx0 * W));
    const y0 = Math.max(0, Math.floor(ny0 * H));
    const x1 = Math.min(W - 1, Math.ceil(nx1 * W));
    const y1 = Math.min(H - 1, Math.ceil(ny1 * H));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
  }
  return m;
}

// ── SOLID-BODY reconstruction (fill-sprite-holes PASS-A, ADR-0014) ───────────────────
// CORRECTNESS-CRITICAL: the steps below are verbatim from fill-sprite-holes' PASS-A body
// reconstruction; the ONLY mechanical change from that original is that the `alpha>=OPAQUE`
// loop is hoisted to the CALLER, so the input is an opaque MASK (which is exactly the
// retouch reconcile's existing signature — both collapse to this one function). The
// constants live here (exported read-only for tests); the disk elements are precomputed
// once at module load.
export const CLOSE_R = 10; // disk radius for the body-reconstruction closing
export const ERODE_R = 1; // disk radius for the anti-halo erosion after fill-holes
export const SEAL_MARGIN = 2; // a column is "frame-cut" if it has opaque within this many px of the bottom edge
const DISK_CLOSE = diskOffsets(CLOSE_R);
const DISK_ERODE = diskOffsets(ERODE_R);

/**
 * Reconstruct the figure's solid body mask from an OPAQUE mask (PASS-A steps 1-3):
 * selective bottom-row seal → disk-10 closing → fill-holes → largest component →
 * disk-1 anti-halo erosion. Returns the input `opaque` unchanged when there is no figure.
 */
export function solidBodyMask(opaque, W, H) {
  const N = W * H;
  let minX = W;
  let maxX = -1;
  for (let i = 0; i < N; i++) {
    if (opaque[i]) {
      const x = i % W;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  if (maxX < minX) return opaque; // no figure — nothing to solidify
  // SELECTIVE bottom-row seal: seal the bottom row ONLY in columns where the figure is
  // genuinely CUT by the frame — an opaque pixel within SEAL_MARGIN px of the bottom edge
  // (a bust sprite whose torso void drains out the bottom and must count as interior).
  // Sealing the WHOLE x-extent would over-annex bottom-open BACKGROUND (the triangle
  // between a shooter's spread legs, slivers under the feet); a column of pure background
  // (no opaque near the bottom) is left OPEN so that gap stays transparent.
  const sealed = Uint8Array.from(opaque);
  const yCut = H - 1 - SEAL_MARGIN;
  for (let x = minX; x <= maxX; x++) {
    for (let y = H - 1; y >= yCut; y--) {
      if (opaque[y * W + x]) {
        sealed[(H - 1) * W + x] = 1;
        break;
      }
    }
  }
  let solid = dilate(sealed, W, H, DISK_CLOSE);
  solid = erode(solid, W, H, DISK_CLOSE); // closing
  solid = fillHoles(solid, W, H);
  solid = largestComponent(solid, W, H);
  solid = erode(solid, W, H, DISK_ERODE); // anti-halo
  return solid;
}
