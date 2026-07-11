#!/usr/bin/env node
/**
 * ART GATE 2 — pixel-level style gate over the generated vehicle sprites.
 *
 * Where check-art-prompts.mjs guards the *words*, this guards the *pixels* that
 * come back from FLUX + the chroma-key detour. It catches the three quality
 * failures the concept-artist lane hit repeatedly and that a byte-size gate
 * (e2e-assets.mjs) is blind to:
 *
 *   (1) GROUND — the sprite was generated on a WHITE/light ground, so the
 *       black→transparent chroma-key had nothing to key and left an opaque halo.
 *       Measured as: the outermost 2px border must be overwhelmingly transparent
 *       OR near-black (post-key and pre-key both acceptable). A failed key leaves
 *       a bright coloured border → the clean-border ratio collapses. NOTE (Serge's
 *       keying switch, verified): the vehicle GROUND flipped from #000000 to a
 *       bright magenta (#FF3CDC) chroma key, but this check judges the POST-key
 *       PNG — a successful key leaves the border TRANSPARENT (alpha 0), which is
 *       clean by the transparent branch, so no change is needed. A FAILED magenta
 *       key leaves a bright magenta (not near-black) opaque border → clean ratio
 *       collapses AND the flood-kill below fires — caught twice.
 *   (2) NEON — (ADR 0006, render-side neon rim) vehicles are now generated PURE
 *       B&W (the neon rim is drawn at runtime in src/render), so the old LOWER
 *       bound ("a rim must exist") is dropped and INVERTED into a flood-kill
 *       UPPER bound: a baked FLUX colour flood (a whole body painted an accent
 *       hue — the failure that killed three batches) is caught when the dominant
 *       saturated hue band exceeds the ceiling. Scanned across ALL hues, not just
 *       the assigned one, so a wrong-accent flood is caught too. FEATURE (magenta
 *       key): because this scans POST-key content, a leftover un-keyed magenta
 *       ground would surface as a magenta flood > 18% and FAIL loudly — the gate
 *       doubles as a chroma-key-failure detector, even though magenta is also
 *       moto's render hue (a correctly keyed sprite has ~0% magenta content).
 *       Per-set mode (SET_MODES): a future fully-baked pipeline can opt back into
 *       a lower bound via SPRITE_SET=baked.
 *   (3) SILHOUETTE — wrong proportions (e.g. a long low sedan when a short tall
 *       one-box car was wanted, or a vehicle cropped out of frame). Measured from
 *       the content bounding box: aspect within per-type bounds, the box wide
 *       enough to hold the whole vehicle, and dense enough to be a solid body.
 *
 * The GROUND + SILHOUETTE thresholds are calibrated against the on-disk PNGs; the
 * NEON flood ceiling (18%) is deliberately set to KILL a flood while passing a
 * clean B&W sprite. Each run prints the measured numbers so a re-tune (against the
 * regenerated B&W PNGs — a CI follow-up) is informed. See the calibration table
 * at the bottom for the measured values, the margins, and the on-disk flood note.
 *
 * Usage:
 *   node scripts/check-sprite-style.mjs                    # check all vehicle types
 *   node scripts/check-sprite-style.mjs --file a.png --type car   # one file
 *   node scripts/check-sprite-style.mjs --fail-list f.txt  # also write failing
 *                                                          #   type names (CI retry)
 * Exit: 0 when every checked sprite PASSES; 1 if any FAILS (or a file is missing).
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, process.env.LEVEL_ART ?? "src/game/levels/levelArt.json");
const PUBLIC_DIR = path.resolve(ROOT, "public");

// ── Calibrated thresholds (see calibration table at the bottom) ──────────────
const ALPHA_CONTENT = 32; // alpha above this = opaque vehicle content
const ALPHA_CLEAR = 16; // alpha below this = keyed-out background
const NEAR_BLACK_MAX = 24; // max(r,g,b) below this = near-black (pre-key bg / dark body)

const GROUND_MIN_CLEAN_PCT = 85; // border must be >= this % transparent-or-near-black
const NEON_MIN_SAT = 0.55; // saturation floor for a "neon"/flood pixel
const NEON_MIN_VAL = 0.65; // value floor for a "neon"/flood pixel
const BBOX_FILL_MIN_PCT = 45; // content must fill >= this % of its bounding box (solid body)
const BBOX_WIDTH_MIN_PCT = 60; // bbox must span >= this % of canvas width (whole vehicle in frame)

// ── Per-set NEON mode (ADR 0006 — render-side neon rim) ──────────────────────
// The neon rim is now drawn at RUNTIME in src/render; vehicle sprites are pure
// B&W xerox. So the old NEON LOWER bound ("a rim must exist, >= 0.75% of content
// in the assigned hue band") would fail every correct B&W sprite and is DROPPED.
// It is replaced by a flood-kill UPPER bound: a baked FLUX colour flood (the
// failure that killed three batches — a whole body painted an accent hue) is
// caught when the dominant saturated hue band exceeds NEON_FLOOD_MAX_PCT.
//
// Kept as a per-set structure so a FUTURE fully-baked pipeline can opt back into
// a lower bound without a rewrite: SPRITE_SET=baked re-enables `neonMinPct`.
//   bw    (default) — decoupled B&W vehicles: upper bound only, no lower bound.
//   baked           — a baked-rim set: both a lower bound and the flood ceiling.
const SET_MODES = {
  bw: { neonMinPct: null, neonFloodMaxPct: 18 },
  baked: { neonMinPct: 0.75, neonFloodMaxPct: 18 },
};
const ACTIVE_SET = process.env.SPRITE_SET === "baked" ? "baked" : "bw";
const MODE = SET_MODES[ACTIVE_SET];

// Assigned-hue bands (degrees) — used ONLY for the baked-set lower bound (a rim of
// the wrong colour still misses). In bw mode the flood-kill scans ALL hues below.
const HUE_BANDS = {
  orange: [20, 45],
  cyan: [165, 210],
  magenta: [280, 330],
};

// Flood-kill hue bands (ADR 0006). These TILE the whole colour wheel so every
// saturated content pixel bins into exactly one band; the dominant band's share
// is the flood metric, scanned across ALL hues (not just the assigned one) so a
// flood in the WRONG accent (e.g. a cyan cabin on an orange truck) is still
// caught. Bands are centred on the four accent hues (orange / green / cyan /
// magenta) plus red/yellow/blue/purple catch-alls — wide enough to hold a single
// flood, narrow enough not to merge two distinct hues. The two red ranges share
// the "red" bucket (wrap-around at 360°).
const FLOOD_HUE_BANDS = [
  ["red", 345, 360],
  ["red", 0, 20],
  ["orange", 20, 50],
  ["yellow", 50, 75],
  ["green", 75, 160],
  ["cyan", 160, 210],
  ["blue", 210, 260],
  ["purple", 260, 290],
  ["magenta", 290, 345],
];

function floodBandOf(h) {
  for (const [name, lo, hi] of FLOOD_HUE_BANDS) if (h >= lo && h < hi) return name;
  return "red";
}

// Per-type content aspect (bbox width / height) bounds. Calibrated to the
// PM-accepted art, which frames each vehicle edge-to-edge (so aspect trends high
// vs a naive guess); see the calibration note.
const ASPECT_BOUNDS = {
  truck: [3.0, 5.5],
  car: [2.2, 4.3],
  moto: [1.4, 3.0],
};

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
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

function measure({ W, H, d }, neon) {
  const band = HUE_BANDS[neon] ?? HUE_BANDS.cyan;
  const [hlo, hhi] = band;

  // GROUND — outermost 2px border, clean = transparent OR near-black.
  let borderTotal = 0;
  let borderClean = 0;
  const isBorder = (x, y) => x < 2 || y < 2 || x >= W - 2 || y >= H - 2;

  // NEON + content bbox in one pass.
  let content = 0;
  let neonPix = 0; // pixels in the ASSIGNED hue band (baked-set lower bound only)
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;
  let filled = 0; // opaque pixels (== content), used for bbox density below
  const floodCounts = {}; // saturated pixels binned by hue band → flood-kill metric

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const a = d[o + 3];
      const mx = Math.max(d[o], d[o + 1], d[o + 2]);

      if (isBorder(x, y)) {
        borderTotal++;
        if (a < ALPHA_CLEAR || mx < NEAR_BLACK_MAX) borderClean++;
      }

      if (a > ALPHA_CONTENT) {
        content++;
        filled++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const [h, s, v] = rgbToHsv(d[o], d[o + 1], d[o + 2]);
        if (s >= NEON_MIN_SAT && v >= NEON_MIN_VAL) {
          // Flood-kill: bin every saturated pixel by hue across ALL bands.
          const band = floodBandOf(h);
          floodCounts[band] = (floodCounts[band] ?? 0) + 1;
          // Assigned-hue tally (used only for the baked-set lower bound).
          if (h >= hlo && h <= hhi) neonPix++;
        }
      }
    }
  }

  const bw = maxX >= minX ? maxX - minX + 1 : 0;
  const bh = maxY >= minY ? maxY - minY + 1 : 0;

  // Dominant saturated hue band (the flood candidate).
  let floodBand = "none";
  let floodMax = 0;
  for (const [band, n] of Object.entries(floodCounts)) {
    if (n > floodMax) {
      floodMax = n;
      floodBand = band;
    }
  }

  return {
    W,
    H,
    borderCleanPct: borderTotal ? (borderClean / borderTotal) * 100 : 0,
    content,
    neonPct: content ? (neonPix / content) * 100 : 0,
    floodBand,
    floodPct: content ? (floodMax / content) * 100 : 0,
    bboxW: bw,
    bboxH: bh,
    aspect: bh ? bw / bh : 0,
    bboxFillPct: bw && bh ? (filled / (bw * bh)) * 100 : 0,
    bboxWidthPct: (bw / W) * 100,
    bboxHeightPct: (bh / H) * 100, // informational (future tuning)
  };
}

function evaluate(type, neon, m) {
  const [aLo, aHi] = ASPECT_BOUNDS[type] ?? [0, Infinity];
  const checks = [
    {
      name: "GROUND border clean",
      ok: m.borderCleanPct >= GROUND_MIN_CLEAN_PCT,
      got: `${m.borderCleanPct.toFixed(2)}%`,
      need: `>= ${GROUND_MIN_CLEAN_PCT}%`,
    },
    // NEON flood-kill (ADR 0006) — the dominant saturated hue band must stay under
    // the ceiling. Reports the offending band so a flood (e.g. "orange 37%") is
    // legible at a glance. Scans ALL hues, so a wrong-accent flood is caught too.
    {
      name: `NEON flood-kill (${m.floodBand})`,
      ok: m.floodPct <= MODE.neonFloodMaxPct,
      got: `${m.floodPct.toFixed(2)}% in ${m.floodBand}`,
      need: `<= ${MODE.neonFloodMaxPct}% in any hue band`,
    },
    // NEON lower bound — ONLY in baked mode (a baked rim must actually exist). In
    // bw mode this is skipped: pure B&W vehicles are expected to be near-zero hue.
    ...(MODE.neonMinPct != null
      ? [
          {
            name: `NEON ${neon} rim`,
            ok: m.neonPct >= MODE.neonMinPct,
            got: `${m.neonPct.toFixed(3)}%`,
            need: `>= ${MODE.neonMinPct}% of content`,
          },
        ]
      : []),
    {
      name: "SILHOUETTE aspect",
      ok: m.aspect >= aLo && m.aspect <= aHi,
      got: m.aspect.toFixed(3),
      need: `${aLo}..${aHi}`,
    },
    {
      name: "SILHOUETTE bbox fill",
      ok: m.bboxFillPct >= BBOX_FILL_MIN_PCT,
      got: `${m.bboxFillPct.toFixed(2)}%`,
      need: `>= ${BBOX_FILL_MIN_PCT}%`,
    },
    {
      name: "SILHOUETTE frame width",
      ok: m.bboxWidthPct >= BBOX_WIDTH_MIN_PCT,
      got: `${m.bboxWidthPct.toFixed(2)}%`,
      need: `>= ${BBOX_WIDTH_MIN_PCT}%`,
    },
  ];
  return { pass: checks.every((c) => c.ok), checks };
}

async function checkSprite(type, neon, file) {
  if (!fs.existsSync(file)) {
    console.log(`\n[${type}] MISSING  ${path.relative(ROOT, file)}`);
    return false;
  }
  const px = await loadPixels(file);
  const m = measure(px, neon);
  const { pass, checks } = evaluate(type, neon, m);

  console.log(
    `\n[${type}] ${pass ? "PASS" : "FAIL"}  ${path.relative(ROOT, file)}  ` +
      `(${m.W}x${m.H}, neon=${neon}, set=${ACTIVE_SET}, bbox ${m.bboxW}x${m.bboxH}, ` +
      `height ${m.bboxHeightPct.toFixed(1)}% of canvas)`,
  );
  for (const c of checks) {
    console.log(`    ${c.ok ? "ok " : "XX "}${c.name.padEnd(26)} ${c.got}  (need ${c.need})`);
  }
  return pass;
}

function loadTypes() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const types = json.vehicles?.types ?? {};
  return Object.entries(types).map(([type, def]) => ({
    type,
    neon: def.neon ?? "cyan",
    file: path.resolve(PUBLIC_DIR, def.asset ?? `assets/vehicles/${type}.png`),
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  const ti = args.indexOf("--type");
  const fl = args.indexOf("--fail-list");
  const failListPath = fl !== -1 ? args[fl + 1] : null;

  let targets;
  if (fi !== -1) {
    const type = ti !== -1 ? args[ti + 1] : null;
    if (!type) {
      console.error("--file requires --type <truck|car|moto>");
      process.exit(2);
    }
    // Resolve the neon from levelArt for the given type (fall back to cyan).
    const known = loadTypes().find((t) => t.type === type);
    targets = [
      { type, neon: known?.neon ?? "cyan", file: path.resolve(process.cwd(), args[fi + 1]) },
    ];
  } else {
    targets = loadTypes();
  }

  console.log(`[check-sprite-style] checking ${String(targets.length)} sprite(s)`);

  const failing = [];
  for (const t of targets) {
    const ok = await checkSprite(t.type, t.neon, t.file);
    if (!ok) failing.push(t.type);
  }

  if (failListPath) {
    fs.writeFileSync(failListPath, failing.join("\n") + (failing.length ? "\n" : ""));
    console.log(`\n[check-sprite-style] failing types written to ${failListPath}`);
  }

  if (failing.length > 0) {
    console.error(
      `\n[check-sprite-style] FAILED — ${failing.length} sprite(s): ${failing.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `\n[check-sprite-style] PASSED — all ${String(targets.length)} sprite(s) meet the style gate`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

/*
 * CALIBRATION TABLE.
 *
 * ── NEON flood-kill (ADR 0006) — measured on the CURRENT on-disk PNGs ─────────
 *   These are still the pre-decouple BAKED set (regeneration as B&W is a CI
 *   follow-up). The dominant saturated hue band, scanned across all hues:
 *
 *   type   dominant band   share    ceiling   verdict
 *   truck  orange          37.64%   <= 18%    FAIL  ← the documented body flood
 *   car    cyan             4.30%   <= 18%    PASS
 *   moto   magenta          3.25%   <= 18%    PASS
 *
 *   The truck FAIL is CORRECT, not a mis-tune: the on-disk truck is the 37%
 *   orange flood recorded in docs/agent-handoffs.md (the exact failure ADR 0006
 *   decouples). The 18% ceiling sits above the clean set (car 4.3 / moto 3.2) and
 *   below the flood (37.6), so it kills floods while passing clean B&W sprites.
 *   Once the vehicles are regenerated pure B&W in CI, all three drop to near-zero
 *   hue and pass. Do NOT raise the ceiling above ~18% to "pass" the current truck
 *   — that would re-admit the flood the gate exists to catch.
 *
 * ── GROUND + SILHOUETTE — measured against the earlier PM-accepted PNGs ───────
 *   (These bounds are unchanged by ADR 0006; re-verify after the B&W re-roll.)
 *
 *   metric                 truck    car      moto     threshold        margin
 *   GROUND border clean    99.39%   91.70%   99.88%   >= 85%           car tightest (+6.7pp)
 *   SILHOUETTE aspect        4.19    3.17     2.13    per-type bounds  centred on measured
 *   SILHOUETTE bbox fill    80.1%   75.9%    61.8%   >= 45%           moto tightest (+16.8pp)
 *   SILHOUETTE frame width  99.2%  100.0%   91.4%   >= 60%           moto tightest (+31pp)
 *
 * The old NEON LOWER bound (>= 0.75% assigned-hue share) is retired in bw mode and
 * preserved only under SPRITE_SET=baked for a future baked pipeline.
 *
 * Notes / tensions (reported to the lead):
 *  - GROUND: the task suggested >= 95%, but the PM-accepted car frames the vehicle
 *    edge-to-edge so its neon body touches the border → 91.70% clean. Recalibrated
 *    to 85%, which still cleanly separates a real white-ground key failure (whole
 *    border coloured → near 0-20% clean) from an accepted edge-to-edge sprite.
 *  - SILHOUETTE aspect: the suggested guess bounds (truck 1.4-2.6 / car 1.3-2.3 /
 *    moto 1.0-2.0) predate the art; the accepted sprites are framed full-width, so
 *    aspect ≈ canvasWidth / contentHeight runs high (4.19 / 3.17 / 2.13). Bounds
 *    recentred on the measured values with margin. Because of full-width framing,
 *    aspect is a WEAK discriminator for "long low sedan vs tall one-box"; the
 *    bbox-fill + bbox-height% metrics (printed each run) carry that signal better,
 *    and are the recommended lever for a future tightening pass.
 *  - "content must fill >= 45% of the bbox height" is implemented as bbox fill
 *    DENSITY (opaque pixels / bbox area >= 45%) — a solid body, not a sparse
 *    wireframe. bbox height as a % of canvas is printed for reference.
 */
