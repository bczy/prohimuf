#!/usr/bin/env node
/**
 * align-grilles.mjs — window/grille verification harness for the SINGLE-WIDE
 * belliard backdrop (ADR-0057).
 *
 * Sibling of `align-windows.mjs` (equal-width `facade.png` panels, detected
 * openings) and `align-troncon.mjs` (hand-placed tronçon zones, best-effort
 * edge-density snap) — NEITHER applies here:
 *   - belliard's décor is now ONE baked opaque wide plane (`street-wide.png`);
 *     there is no per-panel facade art to run edge/warm-glow DETECTION against,
 *     and none is needed — the window openings are HAND-AUTHORED directly in
 *     `levelArt.json`'s `belliard.windows` (3 rows, 54 zones total: 12+18+24).
 *   - the render (`WindowGrilles.tsx`) overlays the generated `foreground.png`
 *     ironwork sprite at each zone with its BOTTOM edge pinned to the enemy's
 *     own feet line (same formula `EnemySprite` uses) — so the grille can never
 *     independently drift off the cop; verifying "does the cop's feet line match
 *     the feet-seating CONTRACT" (see THE SEAT GATE below) transitively verifies
 *     the grille.
 *
 * This is a VERIFICATION-ONLY harness (unlike align-windows.mjs's --fix loop):
 * the hand-authored zones are the ground truth, nothing is detected or
 * corrected — it renders the level, reads back where each sprite actually lands
 * via `__MUF_SLOT_RECTS__`, and reports whether that matches the intended
 * window. Reuses `measure()` (nearest-opening pairing + COUNT/EMPTY) and
 * `writeOverlay()` UNCHANGED from `align-windows.mjs` (imported, not forked) —
 * see that module's exports. `align-windows.mjs`'s own `LEVEL_CFG`/detection code
 * paths (belliard included) are left byte-identical; this script never touches
 * them.
 *
 * THE SEAT GATE (this harness's own addition, not `measure()`'s one-sided
 * OVERFLOW check): `measure()`'s `contained` only flags a slot sinking BELOW its
 * opening's base — it says nothing about a slot floating ABOVE it, which here
 * would show as the whole cop+grille assembly hovering clear of its window. So
 * this script computes its own two-sided SEAT verdict from `measure()`'s
 * already-paired `bySlot` (reusing its nearest-centre matching + COUNT/EMPTY,
 * not re-deriving them), then feeds a `bySlot`-shaped array with `contained`
 * overridden by that verdict into the shared `writeOverlay()` so the debug
 * JPEG's red/magenta split reflects SEAT, not the (looser, one-sided) OVERFLOW
 * rule.
 *
 * The SEAT target is NOT the opening's own box-bottom (`opening.y+opening.h/2`)
 * — the rendered feet line is DESIGNED to sit below that by a fixed fraction of
 * the opening height, on every level: `EnemySprite`'s plane is `ENEMY_PLANE_SCALE`
 * (1.3) taller than the opening and lifted by `ENEMY_BODY_LIFT` (0.02), so the
 * feet line sits `opening.h · (ENEMY_PLANE_SCALE·(0.5−ENEMY_BODY_LIFT) − 0.5)`
 * (≈0.124·opening.h) below the box bottom — see `FEET_OVERSHOOT_FRAC` below,
 * which derives this from the two constants rather than hardcoding ≈0.124.
 * `align-windows.mjs` never gates this directly (its one-sided OVERFLOW check
 * tolerates any amount of undershoot above the base); `WindowGrilles.tsx` pins
 * the grille's own bottom to this SAME feet line, so "rendered feet line ==
 * the CONTRACTED feet line" is the invariant that actually verifies the
 * grille — not "feet at the box bottom", which the render was never designed
 * to do. Green now means "feet obey the seating contract"; it still catches a
 * real regression (e.g. a facade-stretch or ENEMY_PLANE_SCALE change) that
 * moves feet off that contract.
 *
 * Usage:
 *   node scripts/align-grilles.mjs [--check]
 *     (the only mode — there is no --fix: nothing here is detected or
 *     corrected, so `--check` is accepted for CLI-convention parity with the
 *     sibling scripts but behaves identically to the default.)
 *
 * SUCCESS = 0 SEAT defects and 0 COUNT/EMPTY defects. Exit non-zero otherwise.
 * Writes `scripts/.dbg-belliard-grilles-check-i00.jpg` (gitignored): the dimmed
 * `street-wide.png`, hand-authored openings in GREEN, rendered slot boxes in
 * MAGENTA (RED when the SEAT gate fails).
 *
 * Requires the same setup as align-windows.mjs: pngjs (devDependency already)
 * and playwright, and a server already serving the production build at
 * PREVIEW_URL (default http://127.0.0.1:4173/prohimuf/):
 *   node_modules/.bin/vite build
 *   node_modules/.bin/vite preview --port 4173 --strictPort &
 *   PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/align-grilles.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";
import { measure, writeOverlay } from "./align-windows.mjs";
import { zonesFromWindowRows } from "./lib/windowRows.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";
const LEVEL_ID = "belliard";
const LEVEL_NAME = "Rue Belliard";

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// Same containment tolerance align-windows.mjs's OVERFLOW gate uses (TAU there);
// here it bounds a two-sided equality instead of a one-sided ⊆.
const SEAT_TAU = 0.01;

// Mirrors src/render/scene/EnemySprite.tsx's exported constants. A plain-node
// harness cannot import a .tsx render module (no JSX/TS loader here), so these
// are copied values, not a re-derivation — keep in lockstep with EnemySprite.tsx
// by hand if either ever changes (same precedent as align-troncon.mjs's own
// BODY_LIFT_COEFF comment).
const ENEMY_PLANE_SCALE = 1.3;
const ENEMY_BODY_LIFT = 0.02;
// Derived (not hardcoded): the plane's designed overshoot of the rendered feet
// line BELOW the opening's own box-bottom, as a fraction of the opening height
// — see GameScene.tsx's `bodyY = worldY + planeH * ENEMY_BODY_LIFT` and
// `planeH = sizeY * ENEMY_PLANE_SCALE`, which reduce (in normalized, y-down
// coords) to `slot.bottom = opening.y + opening.h/2 + opening.h *
// (ENEMY_PLANE_SCALE * (0.5 - ENEMY_BODY_LIFT) - 0.5)`. ≈ 0.124.
const FEET_OVERSHOOT_FRAC = ENEMY_PLANE_SCALE * (0.5 - ENEMY_BODY_LIFT) - 0.5;

// ---- Browser plumbing (same idiom as align-windows.mjs / align-troncon.mjs) ----

async function enterLevel(page) {
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(LEVEL_NAME, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
  await page.waitForFunction(
    () =>
      typeof window.__MUF_SLOT_RECTS__ === "function" &&
      typeof window.__MUF_APPLY_ZONES__ === "function",
    { timeout: RENDER_TIMEOUT },
  );
  await sleep(500);
}

async function applyAndRead(page, panelZones) {
  await page.evaluate((zones) => {
    window.__MUF_ZONES__ = zones;
    window.__MUF_APPLY_ZONES__();
    return null;
  }, panelZones);
}
const readSlots = (page) => page.evaluate(() => window.__MUF_SLOT_RECTS__());

/**
 * The single-wide backdrop image, decoded for the debug overlay. `street-wide.png`
 * is a real (opaque) PNG, so `pngjs` decodes it directly — no JPEG despite the
 * other levels' `facade.png` convention (see align-windows.mjs's facadeFile()).
 */
function readBackdropImage(file) {
  const p = path.resolve(ROOT, "public/assets/levels", LEVEL_ID, `${file}.png`);
  const { width: W, height: H, data } = PNG.sync.read(fs.readFileSync(p));
  return { W, H, data };
}

/** The CONTRACTED feet line for one opening — the box-bottom PLUS the designed
 *  overshoot (see FEET_OVERSHOOT_FRAC above), not the box-bottom itself. */
function expectedFeetLine(opening) {
  return opening.y + opening.h / 2 + opening.h * FEET_OVERSHOOT_FRAC;
}

/**
 * Two-sided SEAT verdict for one paired {slot, opening}: does the rendered
 * sprite's feet-box BOTTOM sit at the CONTRACTED feet line (not the opening's
 * raw box-bottom — see the file header), within SEAT_TAU? Unlike measure()'s
 * one-sided `contained` (⊆, never flags floating ABOVE the base), this is
 * symmetric — the invariant that actually gates "the grille sits where it
 * should" (the grille's own bottom edge is derived from this same feet line by
 * construction, so it can never disagree with it independently).
 */
function seated(slot, opening) {
  const bottom = slot.y + slot.h / 2;
  return Math.abs(bottom - expectedFeetLine(opening)) <= SEAT_TAU;
}

async function main() {
  const { manifest, levelIds } = loadLevelManifest(ROOT);
  const level = manifest.levels.find((l) => l.id === LEVEL_ID);
  if (level === undefined) throw new Error(`levelArt.json has no level "${LEVEL_ID}"`);
  if (level.backdrop?.mode !== "single-wide") {
    throw new Error(
      `${LEVEL_ID}: expected backdrop.mode "single-wide" (ADR-0057) — this harness only ` +
        `applies to that mode; align-windows.mjs/align-troncon.mjs cover the others`,
    );
  }
  if (level.windows === undefined) {
    throw new Error(`${LEVEL_ID}: no hand-authored "windows" block in levelArt.json`);
  }

  const openings = zonesFromWindowRows(level.windows);
  const det = { ...readBackdropImage(level.backdrop.file), openings };

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await seedDeterminism(page, levelIds);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  let exitCode = 0;
  try {
    await enterLevel(page);
    // Push the hand-authored zones explicitly (single tile ⇒ one panel, index 0)
    // rather than relying on the render's own default — makes the harness
    // self-contained and independent of getWindowZones() ever changing its
    // fallback path, while remaining byte-identical to what actually ships
    // (the render's default already reads the same levelArt.json block).
    await applyAndRead(page, [openings]);
    await sleep(300);
    const slots = await readSlots(page);

    // Reuse measure() for nearest-opening pairing + COUNT/EMPTY only (no
    // warmDensity/cover/zonesByPanel — there is no facade pixel data to sample
    // for a baked single-wide plane, and MISALIGN/COVER don't apply to zones
    // that ARE their own openings by construction); single panel, index 0.
    const { defects: pairDefects, bySlot } = measure(slots, openings, null, null, undefined, [0]);
    const countOrEmpty = pairDefects.filter((d) => !d.includes("OVERFLOW"));

    const seatDefects = [];
    const bySlotSeat = bySlot.map((b) => {
      const ok = seated(b.slot, b.opening);
      if (!ok) {
        const bottom = b.slot.y + b.slot.h / 2;
        const expected = expectedFeetLine(b.opening);
        seatDefects.push(
          `panel 0: SEAT slot@(${b.slot.x.toFixed(3)},${b.slot.y.toFixed(3)}) ` +
            `bottom=${bottom.toFixed(4)} ≠ expected feet line=${expected.toFixed(4)} ` +
            `(Δ=${(bottom - expected).toFixed(4)}, τ=${SEAT_TAU})`,
        );
      }
      return { ...b, contained: ok };
    });

    const overlay = writeOverlay(det, LEVEL_ID, slots, bySlotSeat, 0, "check", 0);
    const defects = [...countOrEmpty, ...seatDefects];
    if (defects.length > 0) {
      console.error(`[align-grilles] CHECK FAILED — ${defects.length} defect(s):`);
      for (const d of defects.slice(0, 24)) console.error(`  ✗ ${d}`);
    } else {
      console.log(`[align-grilles] CHECK PASSED — 0 defects over ${openings.length} windows`);
    }
    console.log(`[align-grilles] overlay: ${path.relative(ROOT, overlay)}`);
    exitCode = defects.length > 0 ? 1 : 0;
  } catch (e) {
    console.error(`[align-grilles] Fatal: ${e.message}`);
    exitCode = 1;
  } finally {
    if (pageErrors.length > 0)
      console.warn(`[align-grilles] page error(s): ${pageErrors.join("; ")}`);
    await browser.close();
  }
  console.log(`[align-grilles] done — exit ${exitCode}`);
  process.exit(exitCode);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((e) => {
    console.error("[align-grilles] Fatal:", e.message);
    process.exit(1);
  });
}

export { seated, expectedFeetLine, readBackdropImage };
