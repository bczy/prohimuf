#!/usr/bin/env node
/**
 * MEASURE MUZZLE ANCHORS — bake a per-frame muzzle-flash anchor into the
 * `enemies` manifest so the render-side additive glow lands on the gun barrel of
 * EACH shooting sprite regardless of which way it aims (some cops fire to the
 * right, some to the left; the flash sits top-left on one frame, top-right on the
 * next). The renderer reads this via muzzleFor() in
 * src/render/scene/enemyTextures.ts and falls back to a fixed right-side offset
 * when a frame carries no anchor (ADR / lane A of the explosion-alignment fix).
 *
 * ── What it writes ────────────────────────────────────────────────────────────
 * For every `enemies.types.<key>` whose key contains "shooting", it adds/updates
 * an OPTIONAL `muzzle` array, index-aligned with that entry's `frames` array:
 *   "muzzle": [ { "x": 0.829, "y": 0.251 }, { "x": 0.8, "y": 0.217 } ]
 * element i anchors frame i+1 — i.e. file `<key>.png` (frame 1), then
 * `<key>_f2.png` (frame 2), … . A `null` element means no muzzle flash was
 * detectable in that frame (the renderer then uses its fixed fallback offset).
 * Values are normalized [0..1] of the PNG width/height, measured from the
 * TOP-LEFT corner (the frame the renderer expects), rounded to 3 decimals.
 * Only shooting entries are touched; the array length always equals `frames.length`.
 *
 * ── Detection (validated against a Python prototype on all 10 sprites) ─────────
 *   1. HOT pixels = the near-white-hot flash core:
 *        alpha > 100  AND  r > 235  AND  g > 220  AND  b > 150
 *   2. 8-connected components over the hot pixels; take the LARGEST component.
 *   3. Require the largest component to be >= MIN_COMPONENT_PX pixels, else the
 *      frame has no real flash → emit `null`.
 *   4. anchor = the UNWEIGHTED centroid of that component, divided by width/height.
 *
 * ── In-place, surgical, idempotent ────────────────────────────────────────────
 * levelArt.json is edited by STRING SURGERY (not a full JSON re-serialize) so no
 * unrelated literal is touched — a JSON.parse→stringify round-trip would rewrite
 * `"scale": 1.0` to `1` in the courier block. Only the `muzzle` property of each
 * shooting entry is inserted/replaced; then `prettier --write` normalizes the
 * result. Deterministic detection + prettier normalization ⇒ a second run is
 * byte-identical.
 *
 * @napi-rs/canvas decodes the PNGs (same dep + install as cutout-enemies.mjs /
 * fill-sprite-holes.mjs); it is not vendored in the sandbox:
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/measure-muzzle-anchors.mjs            # measure + write muzzle arrays in place
 *   node scripts/measure-muzzle-anchors.mjs --dry-run  # print the table, write nothing
 *   node scripts/measure-muzzle-anchors.mjs --preview  # also write a marked verification sheet
 *   PREVIEW_DIR=… node scripts/measure-muzzle-anchors.mjs --preview   # override sheet output dir
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { execFileSync } from "child_process";
import { labelComponents } from "./lib/morphology.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");

// HOT flash-core key (near-white-hot). Ported verbatim from the Python prototype.
const HOT_A = 100;
const HOT_R = 235;
const HOT_G = 220;
const HOT_B = 150;
// Smallest largest-component that counts as a real flash; below this → null.
const MIN_COMPONENT_PX = 50;

// Hand-authored FALLBACK anchors, keyed by frame FILE name. They apply only
// when detection finds no flash (measureAnchor returns null): use them for
// frames whose baked flash was deliberately erased by the retouch pass
// (ADR-0019 iter-3) so the glow sits on the gun itself. A regenerated sprite
// with a real detectable flash always wins over the hand value — the fresh
// measurement is the point of re-running this tool.
//   enemy_shooting_3.png — floating flash star erased; anchor = pistol muzzle
//   tip measured on the gunmetal barrel end (graphist, iter-3).
const MANUAL_ANCHORS = {
  "enemy_shooting_3.png": { x: 0.77, y: 0.44 },
};

/** The frame file for a type entry: index 0 => `<key>.png`, i>0 => `<key>_f<i+1>.png`. */
function frameFile(key, frameIndex) {
  return frameIndex === 0 ? `${key}.png` : `${key}_f${String(frameIndex + 1)}.png`;
}

/**
 * Largest 8-connected hot component's unweighted centroid, normalized [0..1] from
 * the top-left. Returns null when no component reaches MIN_COMPONENT_PX. Pure.
 */
export function measureAnchor(data, W, H) {
  const N = W * H;
  const hot = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (
      data[p * 4 + 3] > HOT_A &&
      data[p * 4] > HOT_R &&
      data[p * 4 + 1] > HOT_G &&
      data[p * 4 + 2] > HOT_B
    ) {
      hot[p] = 1;
    }
  }
  // 8-connectivity is DELIBERATE: it merges diagonally-touching hot pixels into ONE flash
  // component (a 4-conn label would split a diagonal flash into slivers, each possibly below
  // MIN_COMPONENT_PX, and drop a real flash to null). labelComponents returns largest-first,
  // so comps[0] is the flash core; the centroid reducer stays local.
  const comps = labelComponents(W, H, (p) => hot[p] === 1, {
    connectivity: 8,
    collectPixels: true,
  });
  const best = comps[0] ?? null;
  if (best === null || best.size < MIN_COMPONENT_PX) return null;
  let sx = 0;
  let sy = 0;
  for (const p of best.pixels) {
    sx += p % W;
    sy += (p / W) | 0;
  }
  const round3 = (v) => Math.round((v / best.size) * 1000) / 1000;
  return { x: round3(sx / W), y: round3(sy / H) };
}

/** Compact JSON for a muzzle array; prettier normalizes the exact spacing after. */
function muzzleJson(anchors) {
  const el = (a) => (a === null ? "null" : `{ "x": ${String(a.x)}, "y": ${String(a.y)} }`);
  return `[${anchors.map(el).join(", ")}]`;
}

// ── String-aware balanced scan (skips string contents so a bracket inside a
// prompt/pose string never miscounts). Returns the index of the matching close. ──
function matchBracket(text, openIdx, open, close) {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unbalanced ${open}${close} from index ${String(openIdx)}`);
}

/**
 * Set (insert or replace) the `muzzle` property of one shooting entry in the raw
 * levelArt text, purely by string surgery so nothing else in the file moves.
 */
function setMuzzle(text, key, anchors) {
  const keyIdx = text.indexOf(`"${key}":`);
  if (keyIdx < 0) throw new Error(`type key "${key}" not found in levelArt.json`);
  const open = text.indexOf("{", keyIdx);
  const close = matchBracket(text, open, "{", "}");
  let body = text.slice(open, close + 1);

  // Strip any existing muzzle property (its leading comma through its array end).
  const mi = body.indexOf('"muzzle"');
  if (mi >= 0) {
    const lb = body.indexOf("[", mi);
    const rb = matchBracket(body, lb, "[", "]");
    let commaIdx = mi - 1;
    while (commaIdx >= 0 && body[commaIdx] !== ",") commaIdx--;
    if (commaIdx < 0) throw new Error(`malformed muzzle for "${key}"`);
    body = body.slice(0, commaIdx) + body.slice(rb + 1);
  }

  // Insert after the frames array's closing bracket (prettier re-indents/formats).
  const fi = body.indexOf('"frames"');
  if (fi < 0) throw new Error(`no frames array for "${key}"`);
  const flb = body.indexOf("[", fi);
  const frb = matchBracket(body, flb, "[", "]");
  const newBody = `${body.slice(0, frb + 1)},"muzzle":${muzzleJson(anchors)}${body.slice(frb + 1)}`;

  return text.slice(0, open) + newBody + text.slice(close + 1);
}

/** Draw a crosshair + ring marker centred on (mx, my) in device pixels. */
function drawMarker(ctx, mx, my) {
  ctx.strokeStyle = "#ff00ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx, my, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mx - 14, my);
  ctx.lineTo(mx + 14, my);
  ctx.moveTo(mx, my - 14);
  ctx.lineTo(mx, my + 14);
  ctx.stroke();
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const preview = argv.includes("--preview");

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  const manifest = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const types = manifest.enemies.types;
  const shootingKeys = Object.keys(types).filter((k) => k.includes("shooting"));

  const rows = []; // [fileName, anchor|null]
  const perKey = new Map(); // key -> anchors[]
  const tiles = []; // { name, img, W, H, anchor } for the preview sheet

  for (const key of shootingKeys) {
    const frames = types[key].frames;
    const anchors = [];
    for (let f = 0; f < frames.length; f++) {
      const name = frameFile(key, f);
      const filePath = path.join(ASSET_DIR, name);
      if (!fs.existsSync(filePath)) {
        console.log(`[skip] ${name} — not on disk → null`);
        anchors.push(null);
        rows.push([name, null]);
        continue;
      }
      const img = await loadImage(fs.readFileSync(filePath));
      const W = img.width;
      const H = img.height;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H).data;
      const anchor = measureAnchor(data, W, H) ?? MANUAL_ANCHORS[name] ?? null;
      anchors.push(anchor);
      rows.push([name, anchor]);
      if (preview) tiles.push({ name, img, W, H, anchor });
    }
    perKey.set(key, anchors);
  }

  console.log("\nMEASURED MUZZLE ANCHORS (normalized, top-left origin)");
  for (const [name, a] of rows) {
    const val = a === null ? "null" : `x=${a.x.toFixed(3)}  y=${a.y.toFixed(3)}`;
    console.log(`  ${name.padEnd(28)} ${val}`);
  }

  if (preview && tiles.length) {
    const cols = 2;
    const rowsN = Math.ceil(tiles.length / cols);
    const tw = tiles[0].W;
    const th = tiles[0].H;
    const pad = 8;
    const sheet = createCanvas(cols * (tw + pad) + pad, rowsN * (th + pad) + pad);
    const sctx = sheet.getContext("2d");
    sctx.fillStyle = "#606060"; // mid-grey so both the dark figure and light flash read
    sctx.fillRect(0, 0, sheet.width, sheet.height);
    tiles.forEach((t, i) => {
      const cx = pad + (i % cols) * (tw + pad);
      const cy = pad + Math.floor(i / cols) * (th + pad);
      sctx.drawImage(t.img, cx, cy);
      if (t.anchor) drawMarker(sctx, cx + t.anchor.x * t.W, cy + t.anchor.y * t.H);
    });
    const previewDir = process.env.PREVIEW_DIR ?? ROOT;
    const out = path.join(previewDir, "muzzle-anchors-preview.png");
    fs.writeFileSync(out, sheet.toBuffer("image/png"));
    console.log(`\n[preview] wrote ${out}`);
  }

  if (dryRun) {
    console.log("\n[--dry-run] no file written");
    return;
  }

  let text = fs.readFileSync(LEVEL_ART, "utf8");
  for (const key of shootingKeys) text = setMuzzle(text, key, perKey.get(key));
  fs.writeFileSync(LEVEL_ART, text);

  // Normalize formatting (number literals, array wrapping) exactly like the repo
  // does — this is what makes a re-run byte-identical and keeps the file lint-clean.
  const prettier = path.resolve(ROOT, "node_modules/.bin/prettier");
  execFileSync(prettier, ["--write", LEVEL_ART], { stdio: "inherit" });
  console.log(`\n[write] updated ${path.relative(ROOT, LEVEL_ART)} (prettier-normalized)`);
}

// Only run the CLI when executed directly — the file exports measureAnchor()
// for tests/tooling, and importing it must never rewrite levelArt.json.
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[measure-muzzle-anchors] Fatal:", e.message);
    process.exit(1);
  });
}
