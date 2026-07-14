#!/usr/bin/env node
/**
 * RESTORE FIGURE BITES — iteration-4 corrective for the flash-halo retouch over-deletion.
 * The game-graphist scripted-retouch pass: documented, deterministic, re-runnable, ADD-BACK-ONLY.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * The iter-2/iter-3 halo cleanup (`retouch-flash-halos.mjs`, ADR-0019) removed real
 * BACKGROUND remnants (grey torn wings, dark flash rings, a detached floating star) — Bertrand
 * approved those disappearances. But the same tonal+zone rule also ate FIGURE pixels that share
 * the remnants' dark desaturated tone, and (on the riot pair) the warm dark-red SHADING that is
 * the muzzle-blast's own body. On opaque white those lies hid; keyed to transparency they read
 * as holes: `enemy_shooting_3`'s chest/cape under the arms, foot/hem bites on several figures,
 * and lacy see-through riot blasts. Bertrand: "Relance un remplissage, tu as fait des trous."
 *
 * ── What it restores (ADD-BACK-ONLY: alpha 0→255 + pristine RGB, never a delete) ─
 * Reference bytes = the PRE-ANY-RETOUCH commit (BASE_REF, default c79dfda — the solidified
 * cutout before ADR-0019 touched anything). A pixel is a candidate iff it is OPAQUE in the base
 * and TRANSPARENT now (a retouch deletion). Two regimes, per file:
 *
 * BUST / FIGURE regime (every file EXCEPT the riot pair). Bertrand's hard line since commit
 * 81a26ad is "everything solid", reaffirmed here: "Beaucoup de trous sur tout le bas du buste …
 * restore every deleted pixel along the bust's bottom mass … prefers a slightly oversized solid
 * bust to any hole." So a candidate is restored iff it belongs to the base FIGURE (the largest
 * connected component of base-opaque — i.e. it is connected to / enclosed by the figure mass) AND
 * it is NOT inside the file's FLASH_EXCLUDE zone (the muzzle-flash area the retouch owns — dark
 * torn rings / halos around the bright flash, confirmed background). Truly DETACHED fragments
 * (their own component in the base — the floating star on shooting_3 f1, separated torn paper)
 * are not in the largest component → stay deleted. This restores the ENTIRE bust bottom and the
 * chest with no morphological trimming, only carving out the flash region.
 *
 * RIOT regime (enemy_riot_shooting{,_f2}). The remnant to keep deleted (grey torn wings) is
 * ATTACHED to the figure component and lives out over open background, so the figure-component
 * rule cannot exclude it. Here a candidate is restored iff:
 *   RF — FIGURE BODY: inside opening(largestComponent(base opaque), disk R_OPEN) AND NOT within
 *        D_BRIGHT px of a bright base pixel. The chunky body/feet away from the blast; thin wing
 *        spikes are opened away and the near-blast halo is bright-excluded.
 *   R2 — WARM BLAST INTERIOR: inside the per-file BLAST_ZONE and WARM in the base (r−b > WARM).
 *        The blast's dark-red/orange shading between the bright rays → blast reads full, not lacy.
 *        GREY (r−b ≤ WARM) torn wings in the zone are NOT warm → stay deleted.
 *
 * Everything else a retouch deleted (grey detached wings, dark flash rings/halos, the detached
 * floating star on shooting_3 f1) is LEFT deleted.
 *
 * After this pass, run `fill-sprite-holes.mjs` to top-up any residual interior hole and then
 * `retouch-flash-halos.mjs --check` must report 0 would-delete on these bytes (the recalibrated
 * retouch treats the restored pixels as its fixpoint — see ADR-0019 iter-4).
 *
 * ADD-BACK-ONLY, surgical: the ONLY mutation is a transparent (alpha<16) base-opaque pixel
 * becoming its pristine base RGBA. No opaque pixel is ever changed; nothing is ever deleted.
 * A built-in SELF-CHECK re-asserts this and ABORTS THE WRITE on any violation.
 *
 * @napi-rs/canvas install (same as the cutout / fill / retouch scripts):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/restore-figure-bites.mjs                 # restore every listed file in place
 *   node scripts/restore-figure-bites.mjs a.png b.png     # restrict to explicit files
 *   node scripts/restore-figure-bites.mjs --check         # detect-only, exit 1 if any px would restore
 *   BASE_REF=<sha> ASSET_DIR=… node scripts/restore-figure-bites.mjs
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");
const BASE_REF = process.env.BASE_REF ?? "c79dfda";
const REPO_ASSET_REL = "public/assets"; // where the base blob lives in git

const OPAQUE = 16;
const R_OPEN = 4; // disk radius: opening that keeps the chunky figure, opens thin flash rings/wing spikes
const LUM_BRIGHT = 165; // a base pixel brighter than this is "flash core / bright"
const D_BRIGHT = 12; // px: a candidate within this of a bright base pixel is a flash halo → NOT an RF restore
const WARM = 20; // r−b above this = warm (blast shading); at/below = grey (wing) — R2 split

/** Every enemy shooting sprite the retouch ever touched. The bust/figure regime is a safe no-op
 *  on already-solid files (it only ever restores base-figure pixels outside the flash zone), so
 *  listing the "clean" full-body/biker frames too lets us guarantee — per Bertrand's audit
 *  request — that none of them carries a hidden figure bite. */
const RESTORE_FILES = [
  "enemy_shooting.png",
  "enemy_shooting_f2.png",
  "enemy_shooting_2.png",
  "enemy_shooting_2_f2.png",
  "enemy_shooting_3.png",
  "enemy_shooting_3_f2.png",
  "enemy_biker_shooting.png",
  "enemy_biker_shooting_f2.png",
  "enemy_riot_shooting.png",
  "enemy_riot_shooting_f2.png",
];

/** RIOT regime: per-file warm-blast zones (normalized). Presence of an entry here selects the
 *  riot regime (RF ∪ R2); every other file uses the bust/figure regime. */
const BLAST_ZONES = {
  "enemy_riot_shooting.png": [[0.5, 0.0, 1.0, 0.72]],
  "enemy_riot_shooting_f2.png": [[0.5, 0.0, 1.0, 0.75]],
};

/** BUST/FIGURE regime: per-file FLASH-EXCLUDE zones — the muzzle-flash area the retouch owns
 *  (dark torn rings / halos around the bright flash). Restore never touches these, so it cannot
 *  reclaim a flash remnant (which would fight the retouch → limit cycle). Mirrors the retouch
 *  CLEAR_ZONES for the same file; kept clear of the body so the whole bust bottom still restores. */
const FLASH_EXCLUDE = {
  "enemy_shooting.png": [[0.6, 0.05, 1.0, 0.43]],
  "enemy_shooting_f2.png": [[0.57, 0.0, 1.0, 0.41]],
  "enemy_shooting_2.png": [[0.0, 0.0, 0.18, 0.31]],
  "enemy_shooting_2_f2.png": [[0.0, 0.0, 0.2, 0.31]],
  "enemy_shooting_3.png": [[0.55, 0.0, 1.0, 0.37]],
  "enemy_shooting_3_f2.png": [[0.46, 0.0, 1.0, 0.4]],
  "enemy_biker_shooting.png": [[0.0, 0.0, 0.33, 0.29]],
  "enemy_biker_shooting_f2.png": [[0.0, 0.0, 0.33, 0.29]],
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
function diskOffsets(r) {
  const o = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) o.push([dx, dy]);
  return o;
}
function dilate(m, W, H, off) {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue;
      for (const [dx, dy] of off) {
        const nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) o[ny * W + nx] = 1;
      }
    }
  return o;
}
function erode(m, W, H, off) {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 1;
      for (const [dx, dy] of off) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !m[ny * W + nx]) {
          a = 0;
          break;
        }
      }
      o[y * W + x] = a;
    }
  return o;
}
function largestComponent(m, W, H) {
  const N = W * H;
  const seen = new Uint8Array(N);
  let best = null,
    bs = 0;
  for (let i = 0; i < N; i++) {
    if (!m[i] || seen[i]) continue;
    const comp = [];
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      comp.push(j);
      const x = j % W,
        y = (j / W) | 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (m[k] && !seen[k]) {
          seen[k] = 1;
          q.push(k);
        }
      }
    }
    if (comp.length > bs) {
      bs = comp.length;
      best = comp;
    }
  }
  const o = new Uint8Array(N);
  if (best) for (const j of best) o[j] = 1;
  return o;
}
function zoneMask(zones, W, H) {
  const m = new Uint8Array(W * H);
  if (!zones) return m;
  for (const [a, b, c, d] of zones) {
    const x0 = Math.max(0, Math.floor(a * W)),
      y0 = Math.max(0, Math.floor(b * H));
    const x1 = Math.min(W - 1, Math.ceil(c * W)),
      y1 = Math.min(H - 1, Math.ceil(d * H));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
  }
  return m;
}

const DISK_OPEN = diskOffsets(R_OPEN);
const DISK_D = diskOffsets(D_BRIGHT);

/**
 * Compute the restore mask: candidates (base-opaque & now-transparent) selected per regime.
 * Pure. `base` and `cur` are RGBA buffers. Returns Uint8Array (1 → set cur = base RGBA).
 */
export function computeRestore(base, cur, W, H, name) {
  const N = W * H;
  const op = new Uint8Array(N);
  for (let p = 0; p < N; p++) op[p] = base[p * 4 + 3] >= OPAQUE ? 1 : 0;
  const fig = largestComponent(op, W, H); // the figure mass (detached fragments excluded)
  const res = new Uint8Array(N);

  if (BLAST_ZONES[name]) {
    // ── RIOT regime: RF (figure body away from blast) ∪ R2 (warm blast interior) ──
    const bright = new Uint8Array(N);
    for (let p = 0; p < N; p++)
      if (op[p] && lum(base[p * 4], base[p * 4 + 1], base[p * 4 + 2]) > LUM_BRIGHT) bright[p] = 1;
    const bodyCore = dilate(erode(fig, W, H, DISK_OPEN), W, H, DISK_OPEN); // opening
    const nearBright = dilate(bright, W, H, DISK_D);
    const bz = zoneMask(BLAST_ZONES[name], W, H);
    for (let p = 0; p < N; p++) {
      if (!(base[p * 4 + 3] >= OPAQUE && cur[p * 4 + 3] < OPAQUE)) continue;
      const warm = base[p * 4] - base[p * 4 + 2] > WARM;
      if (bodyCore[p] && !nearBright[p])
        res[p] = 1; // RF
      else if (bz[p] && warm) res[p] = 1; // R2
    }
    return res;
  }

  // ── BUST / FIGURE regime: restore the whole figure mass, carving out only the flash zone ──
  const fe = zoneMask(FLASH_EXCLUDE[name], W, H);
  for (let p = 0; p < N; p++) {
    if (!(base[p * 4 + 3] >= OPAQUE && cur[p * 4 + 3] < OPAQUE)) continue;
    if (fig[p] && !fe[p]) res[p] = 1;
  }
  return res;
}

function readBaseBuffer(name) {
  // Prefer an explicit BASE_DIR (sandbox); else read the blob from git at BASE_REF.
  if (process.env.BASE_DIR) {
    const fp = path.join(process.env.BASE_DIR, name);
    return fs.existsSync(fp) ? fs.readFileSync(fp) : null;
  }
  try {
    return execFileSync("git", ["show", `${BASE_REF}:${REPO_ASSET_REL}/${name}`], {
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes("--check");
  const fileArgs = argv.filter((a) => !a.startsWith("--")).map((f) => path.basename(f));
  const targets = fileArgs.length ? fileArgs : RESTORE_FILES;

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const decode = async (buf) => {
    const img = await loadImage(buf);
    const W = img.width,
      H = img.height;
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return { ctx, canvas: c, imgData: ctx.getImageData(0, 0, W, H), W, H };
  };

  let dirty = false;
  const table = [];

  for (const name of targets) {
    const filePath = path.join(ASSET_DIR, name);
    if (!fs.existsSync(filePath)) {
      console.log(`[skip] ${name} — not on disk`);
      continue;
    }
    const baseBuf = readBaseBuffer(name);
    if (!baseBuf) {
      console.log(`[skip] ${name} — no base blob at ${BASE_REF}`);
      continue;
    }

    const base = (await decode(baseBuf)).imgData.data;
    const dec = await decode(fs.readFileSync(filePath));
    const { imgData, W, H } = dec;
    const cur = imgData.data;
    const before = Uint8Array.from(cur);

    const res = computeRestore(base, cur, W, H, name);
    let restored = 0;
    for (let p = 0; p < W * H; p++) {
      if (res[p]) {
        cur[p * 4] = base[p * 4];
        cur[p * 4 + 1] = base[p * 4 + 1];
        cur[p * 4 + 2] = base[p * 4 + 2];
        cur[p * 4 + 3] = 255;
        restored++;
      }
    }

    if (checkOnly) {
      console.log(`  ${String(restored).padStart(6)}  ${name}`);
      table.push([name, restored]);
      if (restored > 0) dirty = true;
      continue;
    }
    if (restored === 0) {
      console.log(`[ok ] ${name} — nothing to restore (${W}x${H})`);
      table.push([name, 0]);
      continue;
    }

    // ---- SELF-CHECK: only transparent(<16)→opaque may change; never an opaque→anything ----
    let violations = 0;
    for (let p = 0; p < W * H; p++) {
      const a0 = before[p * 4 + 3];
      const changed =
        cur[p * 4] !== before[p * 4] ||
        cur[p * 4 + 1] !== before[p * 4 + 1] ||
        cur[p * 4 + 2] !== before[p * 4 + 2] ||
        cur[p * 4 + 3] !== before[p * 4 + 3];
      if (changed && a0 >= OPAQUE) {
        if (violations < 5)
          console.error(`    [VIOLATION] ${name}: opaque px changed at (${p % W},${(p / W) | 0})`);
        violations++;
      }
    }
    if (violations > 0) {
      console.error(`Fatal: ${name} — ${violations} non-add-back violation(s); NOT writing.`);
      process.exit(1);
    }

    dec.ctx.putImageData(imgData, 0, 0);
    fs.writeFileSync(filePath, dec.canvas.toBuffer("image/png"));
    console.log(`[fix] ${name} — restored ${restored} px (add-back only), self-check clean`);
    table.push([name, restored]);
  }

  console.log("\n" + (checkOnly ? "WOULD-RESTORE (px)" : "RESTORED (px)"));
  for (const [n, v] of table.sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(v).padStart(6)}   ${n}`);
  if (checkOnly && dirty) {
    console.error("\n[--check] figure bites present — FAIL");
    process.exit(1);
  }
  if (checkOnly) console.log("\n[--check] no figure bite to restore — PASS");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain)
  main().catch((e) => {
    console.error("[restore-figure-bites] Fatal:", e.message);
    process.exit(1);
  });
