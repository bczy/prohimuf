#!/usr/bin/env node
/**
 * SOLIDIFY the enemy figures — make every sprite opaque-solid inside its silhouette,
 * the game-graphist scripted-retouch pass (documented, deterministic, re-runnable).
 *
 * WHY: the enemy sprites are keyed against a near-black ground (cutout-enemies.mjs).
 * Where the character wears DARK clothing — black trousers, a boot, a torso panel —
 * those pixels match the key colour, so the keyer eats them and leaves the figure
 * POROUS: on opaque white the lie hides, but the moment the alpha is punched the body
 * is see-through — voids in the legs, speckles across the torso, a leg opening a window
 * to the sky. Iteration 1 filled only fully-ENCLOSED voids; Bertrand's direction gate
 * ("encore trop de transparence") rejected it because the porosity is also reachable
 * through BORDER-connected transparency (a gap that opens to the outside, or a bust
 * sprite cut at the waist whose torso void opens through the bottom edge). Mandate:
 * "everything solid" — the figure body is filled, opaque, with no see-through.
 *
 * TWO PASSES (per file):
 *   PASS A — SOLIDIFY. Reconstruct the figure's solid body mask morphologically and
 *     fill every transparent pixel inside it with the layer's dark-clothing tone:
 *       1. opaque = alpha>=16. sealed = opaque + a SELECTIVE bottom-row seal: seal the
 *          bottom row ONLY in columns where the figure is genuinely frame-cut (an opaque
 *          pixel within 2px of the bottom edge — a bust sprite whose torso void drains out
 *          the bottom and must count as interior). Sealing the WHOLE x-extent would annex
 *          bottom-open BACKGROUND (the triangle between a shooter's spread legs, the 1-3px
 *          slivers under the feet) as interior — those must stay transparent, so a column
 *          of pure background (no opaque near the bottom) is left open.
 *       2. solid = binary_fill_holes(binary_closing(sealed, DISK radius 10)) — a DISK
 *          structuring element (not a diamond) bridges the keyed-out gaps in the body.
 *       3. keep only the largest connected component, then erode by DISK radius 1 so the
 *          reconstructed body never bleeds a fat halo past the true silhouette.
 *       4. fill every transparent px (alpha<16) inside `solid` with the dark-clothing
 *          tone = median RGB of the opaque pixels whose luminance is below the figure's
 *          median luminance; alpha=255.
 *   PASS B — MOP-UP. Re-run the iteration-1 enclosed-region fill (border flood; each
 *     leftover enclosed region filled with the MEAN colour of its opaque boundary), to
 *     catch any small enclave the morphology did not reconstruct.
 *
 * Cardinal rule (Bertrand, primordiale): surgical fill only, never a reshape. A built-in
 * SELF-CHECK re-asserts that every originally-opaque pixel (alpha >= 16) is BYTE-IDENTICAL
 * after both passes and ABORTS THE WRITE if not — only transparent pixels ever change.
 *
 * Idempotent: a second run fills 0 px and writes nothing — this IS the --check condition.
 *
 * @napi-rs/canvas is not vendored in the sandbox; install it before running (CI does too):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/fill-sprite-holes.mjs                 # solidify every enemy_*.png in place
 *   node scripts/fill-sprite-holes.mjs a.png b.png     # solidify explicit files
 *   node scripts/fill-sprite-holes.mjs --check         # detect-only gate, exit 1 if any px would fill
 *   ASSET_DIR=… node scripts/fill-sprite-holes.mjs     # override the target dir
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { solidBodyMask } from "./lib/morphology.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");
const OPAQUE = 16; // alpha >= OPAQUE counts as figure (opaque); < OPAQUE is transparent

/** List the default targets: every public/assets/enemy_*.png. */
function defaultTargets() {
  return fs
    .readdirSync(ASSET_DIR)
    .filter((f) => /^enemy_.*\.png$/.test(f))
    .sort()
    .map((f) => path.join(ASSET_DIR, f));
}

/**
 * The dark-clothing tone: median RGB of the opaque pixels whose luminance is below the
 * figure's median luminance (Rec.601). Flat, plausible fill for a keyed-out trouser/torso.
 */
function darkClothingTone(data, W, H) {
  const N = W * H;
  const lum = [];
  const idx = [];
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3] >= OPAQUE) {
      const l = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      lum.push(l);
      idx.push(i);
    }
  }
  if (idx.length === 0) return [40, 40, 46];
  const medLum = [...lum].sort((a, b) => a - b)[lum.length >> 1];
  const rs = [];
  const gs = [];
  const bs = [];
  for (let k = 0; k < idx.length; k++) {
    if (lum[k] < medLum) {
      const i = idx[k];
      rs.push(data[i * 4]);
      gs.push(data[i * 4 + 1]);
      bs.push(data[i * 4 + 2]);
    }
  }
  if (rs.length === 0) return [40, 40, 46];
  const med = (arr) => arr.sort((a, b) => a - b)[arr.length >> 1];
  return [med(rs), med(gs), med(bs)];
}

/**
 * Group the border-enclosed transparent pixels into 4-connected regions (PASS B input).
 */
function enclosedRegions(data, W, H) {
  const N = W * H;
  const exterior = new Uint8Array(N);
  const stack = [];
  const pushExt = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (exterior[i]) return;
    if (data[i * 4 + 3] >= OPAQUE) return;
    exterior[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < W; x++) {
    pushExt(x, 0);
    pushExt(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    pushExt(0, y);
    pushExt(W - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    const y = (i / W) | 0;
    pushExt(x - 1, y);
    pushExt(x + 1, y);
    pushExt(x, y - 1);
    pushExt(x, y + 1);
  }
  const isHole = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] < OPAQUE && !exterior[i]) isHole[i] = 1;
  const regions = [];
  const seen = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!isHole[i] || seen[i]) continue;
    const region = [];
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      region.push(j);
      const x = j % W;
      const y = (j / W) | 0;
      const nb = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (isHole[k] && !seen[k]) {
          seen[k] = 1;
          q.push(k);
        }
      }
    }
    regions.push(region);
  }
  return regions;
}

/** Mean colour of a region's opaque (alpha 255, then >=OPAQUE fallback) border pixels. */
function boundaryMean(region, data, W, H, file) {
  const inRegion = new Set(region);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sn = 0;
  for (const j of region) {
    const x = j % W;
    const y = (j / W) | 0;
    const nb = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of nb) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = ny * W + nx;
      if (inRegion.has(k)) continue;
      const a = data[k * 4 + 3];
      if (a === 255) {
        r += data[k * 4];
        g += data[k * 4 + 1];
        b += data[k * 4 + 2];
        n++;
      } else if (a >= OPAQUE) {
        sr += data[k * 4];
        sg += data[k * 4 + 1];
        sb += data[k * 4 + 2];
        sn++;
      }
    }
  }
  if (n > 0) return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  if (sn > 0) {
    console.log(`    [warn] ${file}: region ${region.length}px walled by semi-transparent px`);
    return [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)];
  }
  console.log(`    [warn] ${file}: region ${region.length}px has no opaque border — grey`);
  return [128, 128, 128];
}

/**
 * Run both passes on a decoded RGBA buffer (mutates `data`).
 * Returns { passA, passB } counts. Only ever writes alpha<16 pixels.
 */
function solidify(data, W, H, file) {
  // PASS A — solidify. Build the opaque mask (alpha>=OPAQUE) here, then reconstruct the
  // solid body via the shared morphology lib (formerly this script's local solidBodyMask).
  const N = W * H;
  const opaque = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] >= OPAQUE) opaque[i] = 1;
  const solid = solidBodyMask(opaque, W, H);
  const [dr, dg, db] = darkClothingTone(data, W, H);
  let passA = 0;
  for (let i = 0; i < W * H; i++) {
    if (solid[i] && data[i * 4 + 3] < OPAQUE) {
      data[i * 4] = dr;
      data[i * 4 + 1] = dg;
      data[i * 4 + 2] = db;
      data[i * 4 + 3] = 255;
      passA++;
    }
  }
  // PASS B — enclosed mop-up (on the post-PASS-A buffer).
  let passB = 0;
  for (const region of enclosedRegions(data, W, H)) {
    const [r, g, b] = boundaryMean(region, data, W, H, file);
    for (const j of region) {
      data[j * 4] = r;
      data[j * 4 + 1] = g;
      data[j * 4 + 2] = b;
      data[j * 4 + 3] = 255;
      passB++;
    }
  }
  return { passA, passB };
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes("--check");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const targets = fileArgs.length
    ? fileArgs.map((f) => path.resolve(process.cwd(), f))
    : defaultTargets();

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  let dirty = false; // any file would still fill (for --check exit code)
  const table = [];

  for (const filePath of targets) {
    const name = path.basename(filePath);
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

    const { passA, passB } = solidify(data, W, H, name);
    const total = passA + passB;

    if (checkOnly) {
      console.log(`  ${total.toString().padStart(6)}  ${name}  (A=${passA} B=${passB})`);
      table.push([name, total]);
      if (total > 0) dirty = true;
      continue;
    }

    if (total === 0) {
      console.log(`[ok ] ${name} — already solid (${W}x${H})`);
      table.push([name, 0]);
      continue;
    }

    // ---- SURGICAL SELF-CHECK (abort the write on any violation) ----
    let violations = 0;
    for (let i = 0; i < W * H; i++) {
      if (before[i * 4 + 3] >= OPAQUE) {
        const changed =
          data[i * 4] !== before[i * 4] ||
          data[i * 4 + 1] !== before[i * 4 + 1] ||
          data[i * 4 + 2] !== before[i * 4 + 2] ||
          data[i * 4 + 3] !== before[i * 4 + 3];
        if (changed) {
          if (violations < 5) {
            const x = i % W;
            const y = (i / W) | 0;
            console.error(`    [VIOLATION] ${name}: opaque pixel changed at (${x},${y})`);
          }
          violations++;
        }
      }
    }
    if (violations > 0) {
      console.error(`Fatal: ${name} — ${violations} surgical violation(s); NOT writing.`);
      process.exit(1);
    }

    console.log(`[fix] ${name} — solidified ${total} px (A=${passA} B=${passB}), self-check clean`);
    ctx.putImageData(imgData, 0, 0);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    table.push([name, total]);
  }

  console.log("\n" + (checkOnly ? "WOULD-FILL DETECTION (px)" : "FILLED (px)"));
  for (const [name, n] of table.sort((x, y) => y[1] - x[1])) {
    console.log(`  ${n.toString().padStart(6)}   ${name}`);
  }
  const grand = table.reduce((s, r) => s + r[1], 0);
  console.log(`  ${grand.toString().padStart(6)}   TOTAL`);

  if (checkOnly && dirty) {
    console.error("\n[--check] figures not fully solid — FAIL");
    process.exit(1);
  }
  if (checkOnly) console.log("\n[--check] every enemy_*.png fully solid — PASS");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
