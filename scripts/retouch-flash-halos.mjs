#!/usr/bin/env node
/**
 * FLASH-HALO / BACKGROUND-REMNANT CLEANUP — delete the dark background remnants that
 * survived the chroma-key around the enemy muzzle flashes (and the torn "wings"/fringe
 * hanging off the shooting sprites). The game-graphist scripted-retouch pass — documented,
 * deterministic, re-runnable, DELETE-OUTSIDE-ONLY, with HAND-TUNED PER-FILE clear zones.
 *
 * ── The bug (Bertrand) ───────────────────────────────────────────────────────
 * "rectangle visible autour des personnages ingame, cela devrait être transparent."
 * The style prompt demanded a MATTE-BLACK background; FLUX rendered it as dark-grey
 * (lum ≈ 40–110), NOT the pure #000 the keyer (cutout-enemies.mjs) removes, so torn
 * ragged sheets of it survived around the muzzle flashes. The solidify pass
 * (fill-sprite-holes.mjs, ADR-0014 iter-2) only ADDS opaque pixels inside the figure, so
 * it never cleaned them — it locked them opaque. Composited on a light facade / in-game
 * they read as dark torn RINGS around the flash stars and "wings" hanging off the busts.
 *
 * ── Why per-file zones (lead-art gate directive, iteration 2) ─────────────────
 * The remnant tone is INDISTINGUISHABLE from the figures' own matte-black clothing:
 * enemy_shooting_2's flat jacket is rgb≈(45,45,49) lum45 sat0.08 and its bottom remnant
 * is rgb≈(43,43,46) lum44 sat0.07 — identical. Iteration 1 tried automatic tonal + flash-
 * distance guards; the lead-art visual gate found them TOO CONSERVATIVE — the torn rings /
 * wings were still clearly visible on a light background at 512px and 64px. No purely
 * automatic rule can separate a floating remnant from a same-tone jacket edge, so per the
 * gate we switch to HAND-TUNED, DOCUMENTED PER-FILE clear zones (normalized rects). Inside
 * a file's zones a pixel is removed iff it is opaque, dark (lum < LB), desaturated
 * (sat < SB) AND exterior-connected; everything else is left. Each zone is commented with
 * what it removes. This is legitimate production craft for a fixed set of 10 sprites — the
 * same per-sprite-constant precedent as retouch-sprites.mjs RETOUCH_SPECS (ADR-0014).
 *
 * ── Iteration 3 (Bertrand review of the committed iter-2 result) ──────────────
 * Three sprites were flagged; the method gained two per-file levers + one erase pass:
 *   • enemy_riot_shooting{,_f2}: the dark torn "wings" reached the FAR right of the frame
 *     (measured to x≈0.97), beyond the old x1≈0.84 zone stop, so the wing tips were never
 *     candidates. Fix = widen the riot splash zones to the full island (x→1.0) AND relax SB
 *     to 0.85 for those two files (much of the torn material is dark-RED, sat 0.5–0.75, which
 *     the default SB=0.5 spared). The all-opaque reconcile below already drops a DETACHED
 *     flash island via its largestComponent step (so f1's wings, on a separate component, are
 *     freely removable — Bertrand's "reconcile against the figure, not the island" is intrinsic
 *     here); for the ATTACHED f2 blast the reconcile keeps the residual that hugs the bright
 *     rays within the disk-10 closing, which is the exact boundary that keeps fill-sprite-holes
 *     --check green (a FIGURE-SEED reconcile was prototyped and REJECTED: it opened a 539px
 *     interior hole in f2 — it deletes inside the fill-sprite-holes body).
 *   • enemy_shooting_3 (frame 1): the baked muzzle flash mis-rendered as a faint star floating
 *     top-right, DETACHED, while the pistol actually aims right (muzzle tip ≈ 0.77,0.44). Tone
 *     guards would PRESERVE that bright star, so a new ERASE_ISLANDS pass deletes every opaque
 *     pixel in a tight zone that is NOT the largest raw component (figure-safe by construction).
 *     Frame 2's flash is one component at the recoiled gun and reads correct → left untouched.
 *
 * ── What keeps figures safe (three independent guards) ───────────────────────
 *   1. TONE          — only dark (lum<LB) desaturated (sat<SB) pixels are candidates, so
 *                      the bright muzzle-flash STAR and its warm rays are never removed
 *                      (gate: preserve the star, not the dark ring around it), and skin /
 *                      gun-metal / colored cloth are never candidates.
 *   2. EXTERIOR-CONNECTED — a candidate must be reachable from the image border through
 *                      transparent+candidate pixels. We only ever extend the exterior
 *                      transparency inward, so we can NEVER punch an interior hole →
 *                      fill-sprite-holes.mjs --check stays green.
 *   3. SOLIDIFY RECONCILE — we mirror fill-sprite-holes.mjs PASS-A (disk-10 closing →
 *                      fill-holes → largest component → disk-1 erode + selective bottom
 *                      seal), DILATE it by RECONCILE_PAD px, and REVERT any deletion that
 *                      falls inside that reconstructed body. So the cut boundary is the
 *                      accepted solidify SILHOUETTE (+pad), not an arbitrary hand line:
 *                      the figure body is protected even where a zone overlaps it, and only
 *                      remnant sticking out BEYOND the solid silhouette is removed. Iterated
 *                      to a fixpoint (reverting only adds opaque back → the mask grows
 *                      monotonically → converges).
 *
 * A floating flash STAR that a ring removal disconnects from the body stays put (it is
 * bright, never a candidate); it simply becomes its own small opaque island — the intended
 * "clean star, no dark frame" read.
 *
 * DELETE-OUTSIDE-ONLY, surgical: the ONLY mutation is alpha 255 → 0. RGB is never touched,
 * no figure pixel moves/recolors, no pixel is made more opaque. A built-in SELF-CHECK
 * re-asserts this and ABORTS THE WRITE on any violation.
 *
 * enemy_civilian.png (the bicycle courier) has NO zone entry → it is never processed (it is
 * a non-combatant with no flash, owned by the courier lane, already repaired under ADR-0014).
 *
 * Deterministic + idempotent: a re-run finds the remnants already transparent → 0 deleted,
 * byte-identical. This is the `--check` condition. NOT wired into CI by this lane (explicit
 * human-run fix, like retouch-sprites.mjs).
 *
 * @napi-rs/canvas install (same as the cutout / integrity / fill scripts):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/retouch-flash-halos.mjs                 # clean every sprite that has zones, in place
 *   node scripts/retouch-flash-halos.mjs a.png b.png     # restrict to explicit files
 *   node scripts/retouch-flash-halos.mjs --check         # detect-only, exit 1 if any px would delete
 *   ASSET_DIR=… node scripts/retouch-flash-halos.mjs     # override the target dir
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

// alpha >= OPAQUE is figure/opaque; < OPAQUE is transparent (matches fill-sprite-holes.mjs).
const OPAQUE = 16;
// Candidate remnant tone: dark AND desaturated.
const LB = 125;
const SB = 0.5;
// Extra padding (px) on the solidify body mask during reconcile — protects the true
// figure silhouette edge (+ a 1px collar of any remnant hugging it: err on keeping).
const RECONCILE_PAD = 1;
// Final speckle sweep: after removal, clear tiny orphaned opaque components (< this many
// px, non-dominant) that the petal removal disconnected — same budget the integrity gate
// (check-sprite-integrity.mjs) uses. Never touches the figure (dominant) or a legit
// detached flash STAR (both far larger than this).
const SPECKLE_MAX_SIZE_PX = 12;

/**
 * HAND-TUNED PER-FILE CLEAR ZONES (normalized [x0,y0,x1,y1], 0..1 of width/height).
 * Inside a file's union of zones, a pixel is removed iff opaque + dark + desaturated +
 * exterior-connected; the solidify reconcile then trims the cut to the body silhouette.
 * Measured on the committed 256x256 sprites (light-bg inspector, 0.1 grid). A file with no
 * entry (idle sprites, the courier) is never touched. Re-measure if a sprite is regenerated.
 */
const CLEAR_ZONES = {
  // Flash top-right in a torn dark RING; torn fringe left of the cap; two torn "wings"
  // hanging under the bust bottom.
  "enemy_shooting_3.png": [
    [0.55, 0.0, 1.0, 0.37], // dark ring around the muzzle-flash star
    [0.0, 0.22, 0.16, 0.56], // torn fringe left of the cap / shoulder
    [0.0, 0.62, 0.72, 1.0], // torn wings hanging below the bust
  ],
  "enemy_shooting_3_f2.png": [
    [0.46, 0.0, 1.0, 0.4], // dark ring around the big starburst (top-right)
    [0.0, 0.26, 0.15, 0.64], // torn fringe left of the cap / shoulder
    [0.0, 0.8, 0.44, 1.0], // torn remnants below the bust
  ],
  // Dark "bat-wings" floating ABOVE the gun/flash on the left; the star + gun sit below.
  "enemy_biker_shooting.png": [[0.0, 0.0, 0.33, 0.29]],
  "enemy_biker_shooting_f2.png": [[0.0, 0.0, 0.33, 0.29]],
  // Warm flash streak with a dark torn SPLASH around/beyond it (right of the figure).
  // ITER-3 (Bertrand review): the dark torn "wings" reach the far-right of the frame
  // (measured to x≈0.97), well beyond the old x1=0.84 stop, so the wing tips were never in
  // a zone → never candidates. Widen the splash zone to the full island (x→1.0) and rely on
  // the FIGURE-SEED reconcile + relaxed SB (THRESH_OVERRIDE) to strip ALL the dark torn
  // material while keeping the bright/warm fiery core + rays. The figure body is still
  // protected by the reconcile, so the wide zone cannot eat the cop.
  "enemy_riot_shooting.png": [
    [0.5, 0.02, 1.0, 0.66], // whole torn splash/island — strip dark wings, keep fiery blast
    [0.28, 0.85, 0.82, 1.0], // stray dark specks under the feet line
  ],
  "enemy_riot_shooting_f2.png": [
    [0.5, 0.03, 1.0, 0.72], // whole torn splash/island — strip dark wings, keep fiery blast
    [0.28, 0.85, 0.66, 1.0], // stray dark speck bottom
  ],
  // Small flash halo top-left behind the gun; torn bottom fused to the flat-black jacket
  // (the reconcile makes the boundary cut at the solid silhouette — err small here).
  "enemy_shooting_2.png": [
    [0.0, 0.0, 0.18, 0.31], // halo behind the gun / around the flash
    [0.18, 0.86, 0.68, 1.0], // torn jacket-bottom remnant beyond the silhouette
  ],
  "enemy_shooting_2_f2.png": [
    [0.0, 0.0, 0.2, 0.31], // halo behind the gun / around the flash
    [0.18, 0.88, 0.72, 1.0], // torn jacket-bottom remnant beyond the silhouette
  ],
  // Flash star (right) in a torn dark ring.
  "enemy_shooting.png": [[0.6, 0.05, 1.0, 0.43]],
  "enemy_shooting_f2.png": [[0.57, 0.0, 1.0, 0.41]],
};

/**
 * Per-file tone-threshold overrides (gate directive allows "per-file relaxed thresholds").
 * The riot muzzle flashes are BIG fiery blasts whose own dark-warm smoke base (lum ~90–125)
 * both constitutes the flash and connects it to the gun. The default LB=125 ate that base,
 * shattering the blast into 70+ speckles (dominance 81%). A gentler LB removes only the very
 * dark NEUTRAL petals and leaves the flash body whole and attached.
 *
 * ITER-3 (Bertrand review): the riot dark torn wings are partly dark-RED (sat 0.5–0.75), so
 * the default SB=0.5 spared them (they read as a ragged dark shape floating right of the
 * muzzle). Relax SB to 0.85 on the riot files so dark-warm torn material is caught too; the
 * bright/warm fiery CORE + rays survive because only DARK pixels (lum < 88) are ever
 * candidates — keep/strip is a pure dark-vs-bright split, the bright core is never a candidate.
 * Only the two riot files relax SB; every other sprite keeps SB=0.5 (protects skin).
 */
const THRESH_OVERRIDE = {
  "enemy_riot_shooting.png": { LB: 88, SB: 0.85 },
  "enemy_riot_shooting_f2.png": { LB: 88, SB: 0.85 },
};

/**
 * ERASE-ISLAND zones (ITER-3, delete-only). Inside these normalized rects, EVERY opaque pixel
 * that is NOT part of the largest raw opaque component (the figure) is deleted — i.e. a whole
 * DETACHED island is erased regardless of its tone (the tone guards protect the star; here we
 * WANT it gone). Figure-safe by construction: the largest component is never a candidate, so no
 * figure pixel can be touched however wide the rect. Used for the frame-1 courier-cop
 * (enemy_shooting_3) whose baked muzzle flash mis-rendered as a faint star floating top-right,
 * DETACHED from everything, while the pistol actually aims to the right (muzzle tip ≈ 0.77,0.44
 * normalized; the in-game glow is hand-anchored there via the manifest, another lane). Frame 2
 * (enemy_shooting_3_f2) keeps its flash: it is one connected component sitting right at the
 * recoiled gun and reads correct — NOT erased.
 */
const ERASE_ISLANDS = {
  "enemy_shooting_3.png": [
    [0.66, 0.09, 0.9, 0.3], // detached floating flash star, top-right, unanchored to the gun
  ],
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
};
const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Build the in-zone mask for a file from its normalized rects. Pure. */
function zoneMask(zones, W, H) {
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

/**
 * Compute the set of remnant pixels to delete: opaque + dark + desaturated + in a zone +
 * exterior-connected. Pure. Returns a Uint8Array del mask (del[p]=1 → alpha 255→0).
 */
export function computeDeletions(data, W, H, zones, opts = {}) {
  const lb = opts.LB ?? LB;
  const sb = opts.SB ?? SB;
  const N = W * H;
  const zone = zoneMask(zones, W, H);
  const isOpaque = (p) => data[p * 4 + 3] >= OPAQUE;

  // Candidates: opaque, dark, desaturated, inside a clear zone.
  const cand = new Uint8Array(N);
  let any = 0;
  for (let p = 0; p < N; p++) {
    if (!zone[p] || !isOpaque(p)) continue;
    const L = lum(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    const S = sat(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    if (L < lb && S < sb) {
      cand[p] = 1;
      any = 1;
    }
  }
  if (!any) return new Uint8Array(N);

  // Exterior-connected filter: flood the border through transparent+candidate; keep only
  // candidates the flood reaches (guarantees no interior hole is ever created).
  const reach = new Uint8Array(N);
  const st = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (reach[p]) return;
    if (isOpaque(p) && !cand[p]) return; // opaque non-candidate = a wall (figure)
    reach[p] = 1;
    st.push(p);
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
    const p = st.pop();
    const x = p % W;
    const y = (p / W) | 0;
    for (const [dx, dy] of N4) push(x + dx, y + dy);
  }
  const del = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (cand[p] && reach[p] && isOpaque(p)) del[p] = 1;
  return del;
}

/**
 * Compute the erase-island deletions: inside a file's ERASE_ISLANDS zones, delete every opaque
 * pixel that is NOT part of the largest raw opaque component (the figure). Tone-agnostic (this
 * removes a whole detached bright STAR that the tonal guards would otherwise preserve), yet
 * figure-safe by construction — the figure is the largest component and is never a candidate.
 * Pure; returns a Uint8Array del mask (del[p]=1 → alpha 255→0).
 */
export function computeIslandErase(data, W, H, zones) {
  const N = W * H;
  const del = new Uint8Array(N);
  if (!zones) return del;
  const zone = zoneMask(zones, W, H);
  const opaque = new Uint8Array(N);
  for (let p = 0; p < N; p++) opaque[p] = data[p * 4 + 3] >= OPAQUE ? 1 : 0;
  const figure = largestComponent(opaque, W, H); // the dominant body — never erased
  for (let p = 0; p < N; p++) if (zone[p] && opaque[p] && !figure[p]) del[p] = 1;
  return del;
}

// ── SOLIDIFY-COMPATIBILITY RECONCILE ────────────────────────────────────────────────
// Mirrors fill-sprite-holes.mjs PASS-A body reconstruction so we can revert any deletion
// that falls inside the accepted solid body (the figure stays 100% solid — Bertrand's line,
// commit 81a26ad / ADR-0014 — and fill-sprite-holes.mjs --check stays green). Re-sync if
// that script's morphology changes; the binding oracle is its --check, run after applying.
const CLOSE_R = 10;
const ERODE_R = 1;
const SEAL_MARGIN = 2;

function diskOffsets(r) {
  const o = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) o.push([dx, dy]);
  return o;
}
function dilate(mask, W, H, off) {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      for (const [dx, dy] of off) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) out[ny * W + nx] = 1;
      }
    }
  return out;
}
function erode(mask, W, H, off) {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let all = 1;
      for (const [dx, dy] of off) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !mask[ny * W + nx]) {
          all = 0;
          break;
        }
      }
      out[y * W + x] = all;
    }
  return out;
}
function fillHoles(mask, W, H) {
  const Nn = W * H;
  const reach = new Uint8Array(Nn);
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
    push((i % W) - 1, (i / W) | 0);
    push((i % W) + 1, (i / W) | 0);
    push(i % W, ((i / W) | 0) - 1);
    push(i % W, ((i / W) | 0) + 1);
  }
  const out = new Uint8Array(Nn);
  for (let i = 0; i < Nn; i++) out[i] = mask[i] || !reach[i] ? 1 : 0;
  return out;
}
function largestComponent(mask, W, H) {
  const Nn = W * H;
  const seen = new Uint8Array(Nn);
  let best = null;
  let bestSize = 0;
  for (let i = 0; i < Nn; i++) {
    if (!mask[i] || seen[i]) continue;
    const comp = [];
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      comp.push(j);
      const x = j % W;
      const y = (j / W) | 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
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
  const out = new Uint8Array(Nn);
  if (best) for (const j of best) out[j] = 1;
  return out;
}
const DISK_CLOSE = diskOffsets(CLOSE_R);
const DISK_ERODE = diskOffsets(ERODE_R);
const DISK_PAD = RECONCILE_PAD > 0 ? diskOffsets(RECONCILE_PAD) : null;

/** Reconstruct the solidify "solid body mask" from an opaque predicate. Mirrors PASS A. */
function solidBodyMask(opaque, W, H) {
  const N = W * H;
  let minX = W;
  let maxX = -1;
  for (let i = 0; i < N; i++)
    if (opaque[i]) {
      const x = i % W;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  if (maxX < minX) return opaque;
  const sealed = Uint8Array.from(opaque);
  const yCut = H - 1 - SEAL_MARGIN;
  for (let x = minX; x <= maxX; x++)
    for (let y = H - 1; y >= yCut; y--)
      if (opaque[y * W + x]) {
        sealed[(H - 1) * W + x] = 1;
        break;
      }
  let solid = dilate(sealed, W, H, DISK_CLOSE);
  solid = erode(solid, W, H, DISK_CLOSE);
  solid = fillHoles(solid, W, H);
  solid = largestComponent(solid, W, H);
  solid = erode(solid, W, H, DISK_ERODE);
  return solid;
}

/**
 * Clear (revert) any deletion inside the padded solidify body mask, to a fixpoint.
 * Reverting only ADDS opaque back → the mask grows monotonically → converges. Mutates
 * `del`; returns the number of reverted pixels.
 *
 * The body mask is rebuilt from ALL opaque pixels via solidBodyMask, which mirrors
 * fill-sprite-holes.mjs PASS-A (incl. its `largestComponent` step). A DETACHED flash island is
 * therefore dropped by that largestComponent and never protected — Bertrand's "reconcile
 * against the figure, not the flash island" is intrinsic here for detached blasts. An ATTACHED
 * blast is one component with the figure, so its dark bits within the disk-10-closed silhouette
 * stay protected; that is the exact boundary that keeps fill-sprite-holes --check green, so the
 * fixpoint below is the MAXIMAL removal that never opens an interior hole (see ADR-0018 iter-3).
 */
export function reconcileWithSolidify(data, W, H, del) {
  const N = W * H;
  const seed = new Uint8Array(N);
  for (let p = 0; p < N; p++) seed[p] = data[p * 4 + 3] >= OPAQUE ? 1 : 0;
  let reverted = 0;
  for (;;) {
    const opaque = new Uint8Array(N);
    for (let p = 0; p < N; p++) opaque[p] = seed[p] && !del[p] ? 1 : 0;
    let solid = solidBodyMask(opaque, W, H);
    if (DISK_PAD) solid = dilate(solid, W, H, DISK_PAD);
    let changed = 0;
    for (let p = 0; p < N; p++)
      if (del[p] && solid[p]) {
        del[p] = 0;
        reverted++;
        changed++;
      }
    if (changed === 0) break;
  }
  return reverted;
}

/**
 * Speckle sweep: mark into `del` every tiny (< SPECKLE_MAX_SIZE_PX) NON-dominant 4-connected
 * opaque component of (opaque AND NOT del) — orphans the petal removal left behind. Never
 * the dominant figure nor a legit detached flash STAR (both far larger). Pure over `del`.
 * Returns the number of speckle pixels added.
 */
export function sweepSpeckle(data, W, H, del) {
  const N = W * H;
  const alive = (p) => data[p * 4 + 3] >= OPAQUE && !del[p];
  const lab = new Int32Array(N).fill(-1);
  const comps = [];
  for (let s = 0; s < N; s++) {
    if (lab[s] !== -1 || !alive(s)) continue;
    const stack = [s];
    lab[s] = comps.length;
    const px = [];
    while (stack.length) {
      const p = stack.pop();
      px.push(p);
      const x = p % W;
      const y = (p / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (lab[np] === -1 && alive(np)) {
          lab[np] = lab[s];
          stack.push(np);
        }
      }
    }
    comps.push(px);
  }
  comps.sort((a, b) => b.length - a.length); // [0] = dominant figure
  let added = 0;
  for (let c = 1; c < comps.length; c++) {
    if (comps[c].length < SPECKLE_MAX_SIZE_PX) {
      for (const p of comps[c]) {
        if (!del[p]) {
          del[p] = 1;
          added++;
        }
      }
    }
  }
  return added;
}

/** Apply deletions to a decoded RGBA buffer (mutates `data`). Returns the deleted count. */
function applyDeletions(data, del, N) {
  let removed = 0;
  for (let p = 0; p < N; p++)
    if (del[p]) {
      data[p * 4 + 3] = 0;
      removed++;
    }
  return removed;
}

/**
 * Run the full pipeline (zone deletion → solidify reconcile → speckle sweep) to a FIXPOINT,
 * mutating `data`. Iterating is REQUIRED for idempotency: the first pass can detach the
 * muzzle flash, which shrinks the solidify body mask and exposes more removable remnant on a
 * subsequent pass; looping until a pass deletes 0 makes the committed bytes a fixpoint, so a
 * later re-run deletes 0 (byte-identical). Removals only ever shrink the opaque set →
 * monotonic, bounded → converges. Returns the total deleted count.
 */
function cleanToFixpoint(data, W, H, zones, opts, eraseZones) {
  const N = W * H;
  let total = 0;
  for (;;) {
    const del = computeDeletions(data, W, H, zones, opts);
    if (eraseZones) {
      // OR in whole-island erasures (a detached star). These live outside the figure body,
      // so the reconcile below never reverts them; they are pure alpha 255→0 like the rest.
      const eDel = computeIslandErase(data, W, H, eraseZones);
      for (let p = 0; p < N; p++) if (eDel[p]) del[p] = 1;
    }
    reconcileWithSolidify(data, W, H, del); // defer to the solidify body silhouette
    sweepSpeckle(data, W, H, del); // clear tiny orphans the petal removal left behind
    const removed = applyDeletions(data, del, N);
    if (removed === 0) break;
    total += removed;
  }
  return total;
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes("--check");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const allNames = [...new Set([...Object.keys(CLEAR_ZONES), ...Object.keys(ERASE_ISLANDS)])];
  const targets = (fileArgs.length ? fileArgs.map((f) => path.basename(f)) : allNames).map((f) =>
    path.join(ASSET_DIR, f),
  );

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  let dirty = false;
  const table = [];

  for (const filePath of targets) {
    const name = path.basename(filePath);
    const zones = CLEAR_ZONES[name];
    const eraseZones = ERASE_ISLANDS[name];
    if (!zones && !eraseZones) {
      console.log(`[skip] ${name} — no clear-zone entry`);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      console.log(`[skip] ${name} — not on disk`);
      continue;
    }
    const img = await loadImage(fs.readFileSync(filePath));
    const W = img.width;
    const H = img.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;
    const before = Uint8Array.from(data); // snapshot for the surgical self-check
    const N = W * H;

    const removed = cleanToFixpoint(data, W, H, zones, THRESH_OVERRIDE[name], eraseZones);

    if (checkOnly) {
      console.log(`  ${removed.toString().padStart(6)}  ${name}`);
      table.push([name, removed]);
      if (removed > 0) dirty = true;
      continue;
    }

    if (removed === 0) {
      console.log(`[ok ] ${name} — no remnant to clear (${W}x${H})`);
      table.push([name, 0]);
      continue;
    }

    // ---- SURGICAL SELF-CHECK: only alpha 255→0 may change; RGB frozen; never more opaque ----
    let violations = 0;
    for (let p = 0; p < N; p++) {
      const rgbChanged =
        data[p * 4] !== before[p * 4] ||
        data[p * 4 + 1] !== before[p * 4 + 1] ||
        data[p * 4 + 2] !== before[p * 4 + 2];
      const a0 = before[p * 4 + 3];
      const a1 = data[p * 4 + 3];
      const alphaBad = a1 !== a0 && !(a0 === 255 && a1 === 0);
      if (rgbChanged || alphaBad) {
        if (violations < 5) {
          const x = p % W;
          const y = (p / W) | 0;
          console.error(`    [VIOLATION] ${name}: non-surgical change at (${x},${y})`);
        }
        violations++;
      }
    }
    if (violations > 0) {
      console.error(`Fatal: ${name} — ${violations} surgical violation(s); NOT writing.`);
      process.exit(1);
    }

    console.log(`[fix] ${name} — deleted ${removed} remnant px, self-check clean`);
    ctx.putImageData(imgData, 0, 0);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    table.push([name, removed]);
  }

  console.log("\n" + (checkOnly ? "WOULD-DELETE (px)" : "DELETED (px)"));
  for (const [name, n] of table.sort((x, y) => y[1] - x[1])) {
    console.log(`  ${n.toString().padStart(6)}   ${name}`);
  }
  const grand = table.reduce((s, r) => s + r[1], 0);
  console.log(`  ${grand.toString().padStart(6)}   TOTAL`);

  if (checkOnly && dirty) {
    console.error("\n[--check] background remnant present — FAIL");
    process.exit(1);
  }
  if (checkOnly) console.log("\n[--check] no background remnant in any clear zone — PASS");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[retouch-flash-halos] Fatal:", e.message);
    process.exit(1);
  });
}

/*
 * CALIBRATION — measured on the committed sprites (256x256).
 *   Remnant vs figure tone (why an automatic tonal key is unsafe → per-file zones):
 *     shooting_2 jacket  rgb(45,45,49) lum45 sat0.08
 *     shooting_2 remnant rgb(43,43,46) lum44 sat0.07   (identical)
 *   Deleted px per file are printed by a run. Guarantees (re-verified by gates):
 *     - RGB never changes; alpha only 255→0; muzzle-flash CORE + rays preserved.
 *     - Exterior-connected only ⇒ no interior hole ⇒ fill-sprite-holes.mjs --check PASS.
 *     - Solidify reconcile (+1px pad) ⇒ figure silhouette protected; cut = solid silhouette.
 *     - ERASE_ISLANDS deletes only non-largest-component pixels ⇒ never a figure pixel.
 *     - Idempotent: re-run deletes 0 (byte-identical).
 *   Iter-3 deleted px (this run, other 7 files unchanged / byte-identical):
 *     enemy_riot_shooting_f2 1023, enemy_riot_shooting 1472, enemy_shooting_3 532 (the star).
 *     shooting_3 f1 muzzle-tip (barrel exit, for the manifest glow anchor): n(0.77, 0.44).
 */
