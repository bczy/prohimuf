#!/usr/bin/env node
/**
 * SPRITE INTEGRITY GATE — objective post-cutout topology / integrity check for the
 * enemy_*.png sprite set (story-courier-cyclist-sprite-fix, brief part A / AC1).
 *
 * ── Why a NEW standalone gate (not folded into check-sprite-style.mjs) ────────
 * check-sprite-style.mjs is VEHICLE-calibrated (per-type HUE_BANDS + aspect bounds
 * from the PM-accepted truck/car/moto PNGs) and its header + gen-sprites.yml both
 * state enemy archetypes need their OWN gate. Topology/integrity is ground-agnostic
 * and orthogonal to hue/silhouette, so folding it in would muddy both. This file is
 * modelled on check-halo-gradient.mjs instead: a PURE, exported measurement function
 * (`measureIntegrity`, no I/O — unit-testable + reusable) plus a thin CLI wrapper
 * that decodes pixels via @napi-rs/canvas (lazy import, so importing this module
 * never throws).
 *
 * ── NOTE (ADR-0029): calibration target retired ──────────────────────────────
 * This gate's one calibrated CI target — `enemy_civilian.png`, the courier's legacy
 * single-frame sprite — was RETIRED (the courier now renders from the committed rider
 * flipbook, and enemy_civilian.png was deleted). The gate step in gen-sprites.yml was
 * removed; this script is kept as generic, reusable integrity-check infrastructure.
 * The calibration table below is historical (the pre/post numbers were measured on the
 * deleted sprite). Re-wire the gate only after calibrating it against a new target.
 *
 * ── What class of bug it catches ─────────────────────────────────────────────
 * The delivery courier (`enemy_civilian.png`) shipped with an AI-generation anatomy
 * defect: FLUX never drew the pelvis (rendered it paper-white), the enclosed-island
 * keying pass (ADR-0013) then cleared that white → an interior transparent hole that
 * severs both legs from the torso, PLUS 68 tiny keying-debris parasites. A topology-
 * ONLY check missed it (the silhouette stayed one dominant component — the legs hang
 * on via the bike frame). So this gate has TWO layers:
 *   • HARD (fails the CI job): dominance ratio + a SPECKLE BUDGET (the clause that
 *     catches the 68 debris parasites) + binary-alpha. The speckle budget is what
 *     PROVES detection: pre-fix = 68 parasites → FAIL, post-retouch = 0 → PASS.
 *   • SOFT (inventory + WARN, printed, NON-failing — routed to the human/agent art
 *     gates): an inventory of interior transparent enclaves, flagging any large one
 *     sitting in the figure's torso/hip zone (where a human body is solid). This is
 *     the layer that surfaces the anatomy-hole class for a human glance.
 *
 * ── FIGURE-only scoping of the SOFT enclave check ────────────────────────────
 * The 0.80 torso fraction assumes a STANDING HUMAN FIGURE (solid torso up top, legit
 * see-through — wheels, frame — only near the feet). The enemy_*.png set is all human
 * figures, so `isFigure` defaults true. It MUST be relaxed for non-figure sprites
 * (the vehicles) or their large legitimate voids (cab windows, wheel arches) would
 * false-positive — pass `isFigure: false` for those. HARD checks are figure-agnostic
 * and always apply.
 *
 * Usage:
 *   node scripts/check-sprite-integrity.mjs                 # all public/assets/enemy_*.png
 *   node scripts/check-sprite-integrity.mjs --file a.png    # one sprite
 *   node scripts/check-sprite-integrity.mjs --json          # machine-readable
 * Exit: 0 when every checked sprite passes ALL HARD checks; 1 on any HARD violation
 * (or a missing/unreadable file). SOFT warnings never change the exit code.
 * Requires @napi-rs/canvas (same dep as check-sprite-style.mjs), imported lazily:
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 * Deterministic + idempotent: a re-run over the same bytes yields the same verdict.
 *
 * See the CALIBRATION TABLE at the bottom for measured pre-fix / post-fix numbers.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { labelComponents } from "./lib/morphology.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.resolve(ROOT, "public/assets");

// ── HARD thresholds (fail the gate) — named + rationale, see calibration table ──
// (a) Largest 4-conn opaque component / total opaque px. A sprite that fragmented
//     into pieces (subject broken apart) drops below this. NOTE: alone this does NOT
//     catch the pre-fix courier — it was ~0.99 (the legs hung on via the bike frame),
//     which is exactly why the speckle budget (b) is the real catcher for this bug.
const DOMINANCE_MIN_RATIO = 0.97;
// (b) SPECKLE BUDGET. A non-dominant 4-conn opaque component smaller than
//     SPECKLE_MAX_SIZE_PX is keying debris (at game size /4 an 11px island is < 1px:
//     a hot speck of dirt). Their count must stay <= MAX_SPECKLE_COMPONENTS. This is
//     the clause that PROVES detection: pre-fix = 68 → FAIL, post-retouch = 0 → PASS.
//     MUST match SPECKLE_MAX_SIZE_PX in retouch-sprites.mjs so the retouch produces
//     exactly what this gate demands. The original accepted sprite carried ~47 such
//     sub-3px comps, so a budget of 4 is well below any legitimate baseline.
const MAX_SPECKLE_COMPONENTS = 4;
const SPECKLE_MAX_SIZE_PX = 12;
// (c) Binary alpha — a keyed sprite must be hard-edged (no semi-transparent fringe).
//     Pixels with 0 < alpha < 255 must equal 0.
const MAX_SEMI_ALPHA_PX = 0;

// ── SOFT thresholds (inventory + WARN, never fail) ──────────────────────────────
// (e) Interior transparent-enclave inventory. WARN on an enclave larger than
//     SUSPECT_ENCLAVE_MIN_PX whose bbox-TOP sits in the figure's torso/hip zone —
//     the upper ENCLAVE_TORSO_FRAC of the silhouette height, where a human body is
//     solid, so a large hole there is a probable anatomy defect. Calibrated: the
//     pre-fix hip holes (224/110/103px, tops at ~58-72% down the silhouette) sit in
//     this zone and are surfaced; legit bike-fork/wheel see-through sits lower.
const SUSPECT_ENCLAVE_MIN_PX = 150;
const ENCLAVE_TORSO_FRAC = 0.8;

// Alpha is binary after keying; treat anything non-zero as opaque content.
const OPAQUE_ALPHA_MIN = 1;

// labelComponents is imported from scripts/lib/morphology.mjs. Both call sites below pass
// { connectivity: 4 } DELIBERATELY (matches components.mjs / cutout-enemies.mjs /
// retouch-sprites.mjs): an 8-conn labelling would merge the diagonally-linked keying-debris
// cluster (near x199-206 on the courier) into one larger component that slips under the
// < 12px speckle budget and escapes detection.

/**
 * Measure the topology / integrity of one keyed sprite. Pure (no I/O), so it is
 * unit-testable and reusable. `d` is RGBA bytes (length W*H*4).
 */
export function measureIntegrity({ W, H, d }) {
  const isOpaque = (p) => d[p * 4 + 3] >= OPAQUE_ALPHA_MIN;
  const isTransparent = (p) => d[p * 4 + 3] === 0;

  // Opaque components: dominant subject + speckle parasites. 4-conn (see note above).
  const opaque = labelComponents(W, H, isOpaque, { connectivity: 4 });
  const totalOpaque = opaque.reduce((s, c) => s + c.size, 0);
  const dominant = opaque[0] ?? { size: 0, bbox: [0, 0, 0, 0], touchesBorder: false };
  const dominanceRatio = totalOpaque > 0 ? dominant.size / totalOpaque : 0;
  const speckleComponents = opaque.slice(1).filter((c) => c.size < SPECKLE_MAX_SIZE_PX).length;
  const nonDominantComponents = Math.max(0, opaque.length - 1);

  // Semi-transparent (non-binary) alpha pixels.
  let semiAlpha = 0;
  for (let i = 0; i < W * H; i++) {
    const a = d[i * 4 + 3];
    if (a > 0 && a < 255) semiAlpha++;
  }

  // Interior transparent enclaves = transparent components not touching the border. 4-conn.
  const transparent = labelComponents(W, H, isTransparent, { connectivity: 4 });
  const enclaves = transparent
    .filter((c) => !c.touchesBorder)
    .map((c) => ({ size: c.size, bbox: c.bbox }));

  // Silhouette geometry from the dominant opaque component (for the torso-zone test).
  const [, silTop, , silBottom] = dominant.bbox;
  const silHeight = silBottom - silTop + 1;

  return {
    W,
    H,
    opaqueComponents: opaque.length,
    totalOpaque,
    dominantSize: dominant.size,
    dominantBbox: dominant.bbox,
    dominanceRatio,
    nonDominantComponents,
    speckleComponents,
    semiAlpha,
    silTop,
    silHeight,
    enclaves,
  };
}

/**
 * Turn measured metrics into HARD checks (fail the gate) + SOFT warnings (inventory,
 * never fail). `isFigure` scopes the torso-zone enclave WARN to human-figure sprites.
 */
export function evaluateIntegrity(m, { isFigure = true } = {}) {
  const checks = [
    {
      name: "DOMINANCE (subject intact)",
      ok: m.dominanceRatio >= DOMINANCE_MIN_RATIO,
      got: `${(m.dominanceRatio * 100).toFixed(2)}%`,
      need: `>= ${(DOMINANCE_MIN_RATIO * 100).toFixed(0)}% largest/total opaque`,
    },
    {
      name: "SPECKLE budget",
      ok: m.speckleComponents <= MAX_SPECKLE_COMPONENTS,
      got: `${m.speckleComponents} comp < ${SPECKLE_MAX_SIZE_PX}px`,
      need: `<= ${MAX_SPECKLE_COMPONENTS} keying-debris comps`,
    },
    {
      name: "BINARY alpha",
      ok: m.semiAlpha <= MAX_SEMI_ALPHA_PX,
      got: `${m.semiAlpha} semi px`,
      need: `<= ${MAX_SEMI_ALPHA_PX} (0<alpha<255)`,
    },
  ];

  // SOFT: torso-zone enclave WARN threshold in absolute Y (upper ENCLAVE_TORSO_FRAC
  // of the silhouette). An enclave whose top is above this line is in the body zone.
  const torsoY = m.silTop + ENCLAVE_TORSO_FRAC * m.silHeight;
  const warnings = [];
  for (const e of m.enclaves) {
    const inTorsoZone = isFigure && e.bbox[1] < torsoY;
    if (e.size > SUSPECT_ENCLAVE_MIN_PX && inTorsoZone) {
      const pctDown = m.silHeight > 0 ? ((e.bbox[1] - m.silTop) / m.silHeight) * 100 : 0;
      warnings.push(
        `enclave ${e.size}px bbox=[${e.bbox}] top at ${pctDown.toFixed(0)}% down ` +
          `(torso/hip zone) — verify it is not a severed limb / anatomy hole`,
      );
    }
  }

  return { pass: checks.every((c) => c.ok), checks, warnings, torsoY };
}

async function decodePixels(file) {
  let mod;
  try {
    mod = await import("@napi-rs/canvas");
  } catch {
    throw new Error(
      "@napi-rs/canvas is required for the integrity check " +
        "(install: npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2)",
    );
  }
  const { loadImage, createCanvas } = mod;
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { W, H, d: ctx.getImageData(0, 0, W, H).data };
}

/** All human-figure enemy sprites. If a NON-figure enemy is ever added, list it here
 * so the SOFT torso-zone enclave WARN is relaxed (see the FIGURE-only scoping note). */
const NON_FIGURE_SPRITES = new Set();

function isFigureSprite(basename) {
  return !NON_FIGURE_SPRITES.has(basename);
}

function discoverSprites() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => /^enemy_.*\.png$/.test(f))
    .sort()
    .map((f) => path.join(ASSETS_DIR, f));
}

async function checkFile(file, { asJson }) {
  const basename = path.basename(file);
  if (!fs.existsSync(file)) {
    if (!asJson) console.log(`\n[${basename}] MISSING  ${path.relative(ROOT, file)}`);
    return { basename, pass: false, missing: true };
  }
  const px = await decodePixels(file);
  const m = measureIntegrity(px);
  const { pass, checks, warnings } = evaluateIntegrity(m, { isFigure: isFigureSprite(basename) });

  if (!asJson) {
    console.log(
      `\n[${basename}] ${pass ? "PASS" : "FAIL"}  ${path.relative(ROOT, file)}  ` +
        `(${m.W}x${m.H}, opaque comps=${m.opaqueComponents}, dominant=${m.dominantSize}px, ` +
        `enclaves=${m.enclaves.length})`,
    );
    for (const c of checks) {
      console.log(`    ${c.ok ? "ok " : "XX "}${c.name.padEnd(26)} ${c.got}  (need ${c.need})`);
    }
    if (warnings.length) {
      for (const w of warnings) console.log(`    !! SOFT  ${w}`);
    } else {
      console.log(`    -- SOFT  no suspicious torso-zone enclave`);
    }
  }
  return { basename, pass, metrics: m, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  const asJson = args.includes("--json");
  const targets = fi !== -1 ? [path.resolve(process.cwd(), args[fi + 1])] : discoverSprites();

  if (targets.length === 0) {
    console.error("[check-sprite-integrity] no enemy_*.png sprites found");
    process.exit(1);
  }
  if (!asJson) console.log(`[check-sprite-integrity] checking ${String(targets.length)} sprite(s)`);

  const results = [];
  let anyFail = false;
  for (const f of targets) {
    const r = await checkFile(f, { asJson });
    results.push(r);
    if (!r.pass) anyFail = true;
  }

  if (asJson) {
    console.log(JSON.stringify({ pass: !anyFail, results }, null, 2));
  } else if (anyFail) {
    const failed = results.filter((r) => !r.pass).map((r) => r.basename);
    console.error(`\n[check-sprite-integrity] FAILED — ${failed.join(", ")}`);
  } else {
    console.log(
      `\n[check-sprite-integrity] PASSED — all ${String(results.length)} sprite(s) integral`,
    );
  }
  process.exit(anyFail ? 1 : 0);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[check-sprite-integrity] Fatal:", e.message);
    process.exit(1);
  });
}

/*
 * CALIBRATION TABLE — enemy_civilian.png (256x256), measured pre-fix / post-retouch.
 *
 *   HARD check          pre-fix (69-comp state)     post-retouch          verdict
 *   DOMINANCE ratio     99.44%  (>= 97%)   PASS     100.00%  PASS         (a) alone
 *                       — the legs hang on via the bike frame, so dominance             does NOT
 *                         does NOT catch this bug; expected.                            catch it
 *   SPECKLE budget      68 comps (> 4)     FAIL ←   0 comps  PASS         (b) IS the
 *                       the 68 keying-debris parasites                    catcher: proves detection
 *   BINARY alpha        0 semi   PASS               0 semi   PASS
 *   → EXIT              1 (FAIL)                     0 (PASS)
 *
 * Proof of detection (AC): the gate FAILS (exit 1) on the pre-fix 69-component sprite
 * — via the SPECKLE budget clause (68 > 4) — and PASSES (exit 0) on the repaired one.
 * Recover the pre-fix state from git (HEAD before the retouch commit) to reproduce.
 *
 *   SOFT enclave inventory (WARN-only, routed to the art gates):
 *   pre-fix:  hip anatomy holes 224px[163,150,175,177] (60% down), 110px[135,145,152,161]
 *             (58% down), 103px[134,172,142,194] (70% down) — the 224px one clears the
 *             150px WARN threshold and is surfaced as a probable severed-limb hole.
 *   post-fix: the hip holes are GONE. TWO residual enclaves clear the WARN threshold —
 *             a 367px leg-gap void [155,184,181,230] and a 169px front-fork/wheel void
 *             [197,183,211,201] (both top ~75% down). Both are
 *             LEGITIMATE bike see-through (verified visually), not anatomy holes; the
 *             SOFT layer surfaces it for a human glance and the art gate confirms it.
 *             This is the SOFT layer working as intended (it routes every large enclosed
 *             region to a human) — it is WARN-only and does NOT affect the PASS verdict.
 *             The architect's original calibration expected wheel voids only at >85% down;
 *             the post-bridge re-segmentation raised one fork void to ~75%, so it warns.
 *             If the crew wants a warn-clean repaired sprite, lower ENCLAVE_TORSO_FRAC to
 *             ~0.73 (still flags the 58-70%-down hip holes) — an architect call, not
 *             silently retuned here.
 *
 * Other enemy_*.png sprites: this gate is SCOPED to enemy_civilian.png ON PURPOSE.
 * Run with no --file and the other 11 committed enemy_*.png FAIL HARD on PRE-EXISTING
 * accepted state — speckle 22..220 non-dominant comps < 12px, plus dominance down to
 * ~78% on action poses (muzzle flash / separated limbs). See ADR-0014 §C for why the
 * CI gate is scoped rather than run set-wide. Re-run over the same bytes = same verdict.
 */
