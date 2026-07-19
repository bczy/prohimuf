#!/usr/bin/env node
/**
 * ART GATE 2 (near-foreground props) — pixel-level grey/C1 style gate over the
 * generated public/assets/nearfg/<kind>.png sprites.
 *
 * Where check-art-prompts.mjs's nearForeground set guards the WORDS, this
 * guards the PIXELS: décor props are strict grey B&W (art law C1 — near-
 * foreground props carry ZERO colour; the trafficLight's coloured lit lens is a
 * render-side overlay texture, never baked into the housing PNG). Two checks
 * per file:
 *
 *   (1) MEAN SATURATION — must stay near-zero. Catches a magenta ground-cast
 *       bleeding into the kept pixels — the same failure class
 *       check-sprite-style.mjs's vehicle MEAN-SAT (B&W) check guards, reused
 *       here with the same formula and the same 0.10 ceiling.
 *   (2) SILHOUETTE — a non-empty opaque alpha region must exist at all. A
 *       failed chroma-key (or a request that never returned real content) can
 *       leave an all-transparent, or all-keyed-out, PNG.
 *
 * Deliberately a STANDALONE script rather than a `check-sprite-style.mjs` mode:
 * that script's ASPECT_BOUNDS / HUE_BANDS / NEON-rim checks are vehicle-
 * specific (a per-type assigned neon hue, truck/car/moto aspect bounds), and
 * near-foreground props have neither a `neon` field nor those aspect bounds —
 * grafting an unrelated per-kind config table onto it would cost more than this
 * small, focused gate.
 *
 * Usage:
 *   node scripts/check-nearfg-style.mjs                    # check all defined kinds
 *   node scripts/check-nearfg-style.mjs --file a.png --kind bollard   # one file
 *   node scripts/check-nearfg-style.mjs --fail-list f.txt  # also write failing
 *                                                           #   kind names (CI retry)
 * Exit: 0 when every checked sprite PASSES; 1 if any FAILS (or a file is missing).
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, process.env.LEVEL_ART ?? "src/game/levels/levelArt.json");
const PUBLIC_DIR = path.resolve(ROOT, "public");

const ALPHA_CONTENT = 32; // alpha above this = opaque content pixel
const MEAN_SAT_MAX = 0.1; // same ceiling as check-sprite-style.mjs's B&W vehicles
const MIN_CONTENT_PCT = 1; // silhouette must cover at least this % of the canvas

function saturationOf(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

function loadPixels(file) {
  return loadImage(file).then((img) => {
    const W = img.width;
    const H = img.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return { W, H, d: ctx.getImageData(0, 0, W, H).data };
  });
}

/** measure({W,H,d}) -> pure metrics over an ImageData-shaped input. */
export function measure({ W, H, d }) {
  let content = 0;
  let satSum = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > ALPHA_CONTENT) {
      content++;
      satSum += saturationOf(d[i], d[i + 1], d[i + 2]);
    }
  }
  const total = W * H;
  return {
    W,
    H,
    content,
    contentPct: total ? (content / total) * 100 : 0,
    meanSat: content ? satSum / content : 0,
  };
}

/** evaluate(m) -> { pass, checks } — pure, no I/O. */
export function evaluate(m) {
  const checks = [
    {
      name: "SILHOUETTE non-empty",
      ok: m.contentPct >= MIN_CONTENT_PCT,
      got: `${m.contentPct.toFixed(2)}%`,
      need: `>= ${MIN_CONTENT_PCT}%`,
    },
    {
      name: "MEAN-SAT (grey C1)",
      ok: m.meanSat <= MEAN_SAT_MAX,
      got: m.meanSat.toFixed(3),
      need: `<= ${MEAN_SAT_MAX} mean sat`,
    },
  ];
  return { pass: checks.every((c) => c.ok), checks };
}

async function checkSprite(kind, file) {
  if (!fs.existsSync(file)) {
    console.log(`\n[${kind}] MISSING  ${path.relative(ROOT, file)}`);
    return false;
  }
  const px = await loadPixels(file);
  const m = measure(px);
  const { pass, checks } = evaluate(m);

  console.log(
    `\n[${kind}] ${pass ? "PASS" : "FAIL"}  ${path.relative(ROOT, file)}  (${m.W}x${m.H})`,
  );
  for (const c of checks) {
    console.log(`    ${c.ok ? "ok " : "XX "}${c.name.padEnd(24)} ${c.got}  (need ${c.need})`);
  }
  return pass;
}

function loadKinds() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const types = json.nearForegroundArt?.types ?? {};
  return Object.entries(types).map(([kind, def]) => ({
    kind,
    file: path.resolve(PUBLIC_DIR, def.asset ?? `assets/nearfg/${kind}.png`),
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  const ki = args.indexOf("--kind");
  const fl = args.indexOf("--fail-list");
  const failListPath = fl !== -1 ? args[fl + 1] : null;

  let targets;
  if (fi !== -1) {
    const kind = ki !== -1 ? args[ki + 1] : null;
    if (!kind) {
      console.error("--file requires --kind <kind>");
      process.exit(2);
    }
    targets = [{ kind, file: path.resolve(process.cwd(), args[fi + 1]) }];
  } else {
    targets = loadKinds();
  }

  console.log(`[check-nearfg-style] checking ${String(targets.length)} sprite(s)`);

  const failing = [];
  for (const t of targets) {
    const ok = await checkSprite(t.kind, t.file);
    if (!ok) failing.push(t.kind);
  }

  if (failListPath) {
    fs.writeFileSync(failListPath, failing.join("\n") + (failing.length ? "\n" : ""));
    console.log(`\n[check-nearfg-style] failing kinds written to ${failListPath}`);
  }

  if (failing.length > 0) {
    console.error(
      `\n[check-nearfg-style] FAILED — ${failing.length} sprite(s): ${failing.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `\n[check-nearfg-style] PASSED — all ${String(targets.length)} sprite(s) meet the grey/C1 style gate`,
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
