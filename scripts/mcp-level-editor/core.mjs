// The pure core of the MCP level-editor tools (ADR-0077 D3): every rule that
// decides whether a plan is sound lives in `src/game/levels/**` already
// (`validateLevelPlan`, `validateLevel`, `validateCatalogue`). This module only
// COMPOSES those functions, resolves a level id to its plan, scans conventional
// asset paths and writes the `scaffold` template — it never adds a game
// invariant of its own. `server.mjs` is the only other consumer; a script or a
// test may import this module directly (the "two surfaces, one core" proof,
// spec-mcp-level-editor §6).
//
// TS loading: this file (and everything it imports transitively under
// `src/game/**`) is loaded through the project's existing Vite alias
// config (`@game/*` → `src/game/*`, see `vitest.config.ts` / `vite.config.ts`).
// Under `vitest` that happens automatically; run standalone (the real MCP
// server process), invoke this file through `vite-node` — see
// `package.json`'s `mcp:level-editor` script and `.mcp.json`. Plain `node`
// cannot parse `import type` / resolve `@game/*` and is not a supported entry
// point for this module.

import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  planToLevelArt,
  planToLevelConfig,
  validateCatalogue,
  validateLevelPlan,
} from "@game/levels/levelPlan";
import { validateLevel } from "@game/levels/validateLevel";
import { GENERATED_PLANS } from "@game/levels/generated";
import { registerGeneratedArchetypes } from "@game/types/enemyTypes";
import { SWIFTSHADER_ARGS, seedDeterminism, sleep } from "../e2e-lib.mjs";

const CORE_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Repo root, derived from this file's own location — `scripts/mcp-level-editor/`. */
export function repoRoot() {
  return path.resolve(CORE_DIR, "..", "..");
}

function generatedDir(rootDir) {
  return path.join(rootDir, "src", "game", "levels", "generated");
}

/**
 * Resolve a `validate`/`inspect`/`scaffold` input to a plan. `{ plan }` is used
 * as given (a candidate, possibly not yet in the catalogue); `{ levelId }` is
 * looked up in the known plans. Returns either `{ plan }` or `{ issue }` — never
 * throws, so a bad id is a reportable `LevelIssue`, not a crash.
 */
function resolveInputPlan(input, plans) {
  if (input?.plan !== undefined) return { plan: input.plan };
  if (input?.levelId !== undefined) {
    const plan = plans.find((p) => p.id === input.levelId);
    if (plan === undefined) {
      return {
        issue: {
          code: "plan/unknown-level-id",
          severity: "error",
          field: "levelId",
          message:
            `no generated level with id "${input.levelId}" (known ids: ` +
            `${plans.map((p) => p.id).join(", ") || "none"})`,
        },
      };
    }
    return { plan };
  }
  return {
    issue: {
      code: "plan/missing-input",
      severity: "error",
      field: "",
      message: 'validate requires either { plan } or { levelId }',
    },
  };
}

/**
 * `validate({ plan } | { levelId }) → { issues: LevelIssue[] }` (spec-mcp-level-editor
 * §3). Composes `validateLevelPlan` + `validateLevel(planToLevelConfig(plan))` +
 * `validateCatalogue` — the last one against the candidate joined to the known
 * catalogue when a fresh `plan` is supplied (so a colliding id is caught before
 * `scaffold` would ever write it), or against the catalogue as-is when resolving
 * an already-registered `levelId` (the plan IS already one of `plans`, so it must
 * not be counted twice).
 *
 * Before running `validateLevel`, the plan's own archetypes are registered
 * through `registerGeneratedArchetypes` (the SAME idempotent, all-`weight: 0`
 * call `generated/index.ts` makes at import) — otherwise `validateLevel`'s
 * `unknown-enemy-kind` check would reject every `windowWeights` slot of a plan
 * that has not been scaffolded yet, since it consults the same global registry
 * `hasArchetype` reads. No new rule: `validate` simulates the exact state a
 * successful `scaffold` would leave behind.
 */
export function validate(input, { plans = GENERATED_PLANS } = {}) {
  const resolved = resolveInputPlan(input, plans);
  if (resolved.issue !== undefined) return { issues: [resolved.issue] };
  const { plan } = resolved;
  registerGeneratedArchetypes(plan.archetypes);

  const catalogue = input?.levelId !== undefined ? plans : [...plans, plan];

  return {
    issues: [
      ...validateLevelPlan(plan),
      ...validateLevel(planToLevelConfig(plan)),
      ...validateCatalogue(catalogue),
    ],
  };
}

/**
 * Base-relative asset paths this plan needs, split into `present`/`missing` by
 * scanning the conventional locations on disk (spec-mcp-level-editor §3): the
 * single-wide backdrop under `public/assets/levels/<id>/`, every enemy sprite
 * whose filename starts with the archetype's `spriteBase`, and each prop's own
 * `asset` path. No game-layer coupling beyond reading the plan's own fields —
 * this is the "conventions" scan, not a rule.
 */
function scanAssets(plan, rootDir) {
  const publicDir = path.join(rootDir, "public");
  const present = [];
  const missing = [];

  const backdropRelPath = `assets/levels/${plan.id}/${plan.backdrop.file}.png`;
  (existsSync(path.join(publicDir, backdropRelPath)) ? present : missing).push(backdropRelPath);

  const assetsDir = path.join(publicDir, "assets");
  const topLevelFiles = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
  for (const a of plan.archetypes) {
    const matches = topLevelFiles.filter(
      (f) => f.startsWith(a.spriteBase) && f.endsWith(".png"),
    );
    if (matches.length > 0) {
      present.push(...matches.map((f) => `assets/${f}`));
    } else {
      missing.push(`assets/${a.spriteBase}.png`);
    }
  }

  for (const p of plan.props) {
    (existsSync(path.join(publicDir, p.asset)) ? present : missing).push(p.asset);
  }

  return { present, missing };
}

/**
 * `inspect({ levelId }) → { plan, config, art, assets }` (spec-mcp-level-editor §3):
 * the plan plus its two pure projections plus the asset scan above. Throws on an
 * unknown id — `inspect` (unlike `validate`) has nothing useful to compose from a
 * bad id, so a thrown error is the server's to turn into an MCP error result.
 */
export function inspect({ levelId }, { plans = GENERATED_PLANS, rootDir = repoRoot() } = {}) {
  const plan = resolvePlanOrThrow(levelId, plans, "inspect");
  return {
    plan,
    config: planToLevelConfig(plan),
    art: planToLevelArt(plan),
    assets: scanAssets(plan, rootDir),
  };
}

// Filesystem-safe namespace: letters, digits, "-", "_", starting with an
// alphanumeric — the same shape as the shipped/fixture ids and the literal
// `<id>.ts` filename `scaffold` derives from it. Rejects a separator or ".."
// outright (D4's "chemin dérivé de l'id, jamais fourni par l'appelant").
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/i;

function scaffoldIdIssue(id) {
  if (typeof id !== "string" || id.length === 0) {
    return {
      code: "scaffold/invalid-id",
      severity: "error",
      field: "plan.id",
      message: "plan.id must be a non-empty string",
    };
  }
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    return {
      code: "scaffold/invalid-id",
      severity: "error",
      field: "plan.id",
      message: `plan.id "${id}" must not contain "/", "\\" or ".."`,
    };
  }
  if (!SAFE_ID.test(id)) {
    return {
      code: "scaffold/invalid-id",
      severity: "error",
      field: "plan.id",
      message: `plan.id "${id}" is outside the safe namespace (letters, digits, "-", "_" only)`,
    };
  }
  return null;
}

/** Serializes a plan as the `export const plan: LevelPlan = …;` body. */
function renderModuleSource(plan) {
  return (
    `import type { LevelPlan } from "@game/levels/levelPlan";\n\n` +
    `/**\n` +
    ` * Generated by the MCP level-editor \`scaffold\` tool — review before shipping.\n` +
    ` * This module is data only: add "${plan.id}" to \`GENERATED_PLANS\` in\n` +
    ` * \`src/game/levels/generated/index.ts\` to activate it (\`scaffold\` never\n` +
    ` * edits that file itself — the aggregation line is a reviewed human gesture).\n` +
    ` */\n` +
    `export const plan: LevelPlan = ${JSON.stringify(plan, null, 2)};\n`
  );
}

/** tmp-then-rename in the SAME directory, so the rename is an atomic swap. */
function writeAtomic(targetPath, contents) {
  const dir = path.dirname(targetPath);
  mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `.${path.basename(targetPath)}.tmp-${String(process.pid)}-${String(Date.now())}`);
  writeFileSync(tmpPath, contents, "utf8");
  renameSync(tmpPath, targetPath);
}

/**
 * `scaffold({ plan, overwrite? }) → { ok, path, issues, reminder? }` (spec
 * §3/§5, ADR-0077 D4). Three hard disciplines, in order, none skipped:
 *  1. the id must be a safe, separator-free namespace (checked before any
 *     disk access, and before `validate` — a `/` or `..` never even reaches
 *     the validators);
 *  2. `validate` must be clean (no `LevelIssue`) — checked before any disk
 *     access;
 *  3. the write path is derived from the validated id and confined by
 *     construction under `src/game/levels/generated/`; an existing module is
 *     never overwritten without `overwrite: true`.
 * Never touches `generated/index.ts`, never runs git — the response only
 * reminds the caller of the aggregation line a human still has to add.
 */
export function scaffold(
  { plan, overwrite = false },
  { plans = GENERATED_PLANS, rootDir = repoRoot() } = {},
) {
  const idIssue = scaffoldIdIssue(plan?.id);
  if (idIssue !== null) return { ok: false, path: null, issues: [idIssue] };

  const { issues } = validate({ plan }, { plans });
  if (issues.length > 0) return { ok: false, path: null, issues };

  const dir = generatedDir(rootDir);
  const targetPath = path.resolve(dir, `${plan.id}.ts`);
  // Belt-and-suspenders on top of the id charset check above: the resolved path
  // must still land strictly under `generated/`.
  if (!targetPath.startsWith(path.resolve(dir) + path.sep)) {
    return {
      ok: false,
      path: null,
      issues: [
        {
          code: "scaffold/invalid-id",
          severity: "error",
          field: "plan.id",
          message: `plan.id "${plan.id}" resolves outside src/game/levels/generated/`,
        },
      ],
    };
  }

  if (existsSync(targetPath) && !overwrite) {
    return {
      ok: false,
      path: targetPath,
      issues: [
        {
          code: "scaffold/exists",
          severity: "error",
          field: "id",
          message: `${plan.id}.ts already exists under generated/ — pass { overwrite: true } to replace it`,
        },
      ],
    };
  }

  writeAtomic(targetPath, renderModuleSource(plan));

  return {
    ok: true,
    path: targetPath,
    issues: [],
    reminder:
      `Add "${plan.id}" to the GENERATED_PLANS aggregation in ` +
      `src/game/levels/generated/index.ts — scaffold never edits index.ts, that ` +
      `line stays a reviewed human gesture.`,
  };
}

// ---------------------------------------------------------------------------
// dryrun / preview (T5) — the ONLY seam these two tools use is the generated-level
// verification route booted straight into PLAYING, `?preview=level&level=<id>`
// (spec-level-harness-sp1 §8, `src/render/scene/generatedHarness.ts`). Both need a
// local vite dev server and, for `dryrun`, a local headless Chromium — no secret,
// no network beyond localhost (ADR-0077 D5).

const DEFAULT_PORT = 5173;
// Mirrors `vite.config.ts`'s own default (`VITE_BASE`) — not re-read from that file
// (a .ts import here would pull Vite's own build-time env handling into this
// runtime module) but pinned to the same literal, and overridable the same way.
const DEFAULT_BASE = process.env.VITE_BASE ?? "/prohimuf/";

async function isServerUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Reuse a vite dev server already serving at `port`/`base` (fetches the root
 * page), or spawn one under `rootDir` and wait for it to come up. Never kills a
 * server it did not start itself — `proc` is `null` when reused, so a caller
 * only tears down what it spawned.
 */
async function ensureDevServer({
  rootDir = repoRoot(),
  port = DEFAULT_PORT,
  base = DEFAULT_BASE,
} = {}) {
  const url = `http://localhost:${String(port)}${base}`;
  if (await isServerUp(url)) return { url, proc: null };

  // stdio fully ignored: readiness is polled via isServerUp, and piped stdout/
  // stderr would keep a short-lived library caller's event loop alive forever
  // after preview() returns (unref only detaches the child handle, not pipes).
  const proc = spawn("yarn", ["vite", "--port", String(port), "--strictPort"], {
    cwd: rootDir,
    stdio: "ignore",
  });
  proc.unref();

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await isServerUp(url)) return { url, proc };
    await sleep(300);
  }
  proc.kill();
  throw new Error(`dryrun/preview: dev server did not become ready at ${url} within 20s`);
}

function resolvePlanOrThrow(levelId, plans, caller) {
  const plan = plans.find((p) => p.id === levelId);
  if (plan === undefined) {
    throw new Error(
      `${caller}: no generated level with id "${levelId}" (known ids: ` +
        `${plans.map((p) => p.id).join(", ") || "none"})`,
    );
  }
  return plan;
}

/** The value span immediately after the "temps" label span, e.g. "48s" → 48. */
async function readTempsSeconds(page) {
  const text = await page.locator("span:text-is('temps') + span").first().innerText();
  const match = /(\d+)/.exec(text);
  if (match === null) throw new Error(`dryrun: could not parse TEMPS from "${text}"`);
  return Number(match[1]);
}

/**
 * The HUD ticker's rendered text, whitespace-collapsed — same content as the
 * SP1 §8 evidence's `hudSnippet` field. Located by CSS `:has()` rather than a
 * hashed CSS-module class name: the smallest element containing BOTH the
 * "score" and "temps" labels is the HUD container (`:has()` matches every
 * ancestor, `.last()` picks the innermost — the two labels are siblings, so no
 * element nested any deeper also has both).
 */
async function readHudSnippet(page) {
  const hud = page.locator("div:has(span:text-is('score')):has(span:text-is('temps'))").last();
  return (await hud.innerText()).replace(/\s+/g, " ").trim();
}

/**
 * `dryrun({ levelId }) → report.json` (spec-mcp-level-editor §3/§6): boots the
 * `?preview=level&level=<id>` seam headless, reads the timer twice (proving the
 * clock ticks) and the HUD text, and reports any uncaught page error. The ONE
 * driver both this tool and a future SP2/SP3 CI script call (§6's "two
 * surfaces" — SP2 T6 did not land its own generalized driver yet, so this is
 * the sole implementation for now; SP2 dedupes onto it later).
 */
export async function dryrun(
  { levelId },
  {
    rootDir = repoRoot(),
    plans = GENERATED_PLANS,
    port = DEFAULT_PORT,
    base = DEFAULT_BASE,
    settleMs = 3000,
  } = {},
) {
  resolvePlanOrThrow(levelId, plans, "dryrun");
  const { url: baseUrl, proc } = await ensureDevServer({ rootDir, port, base });
  const navUrl = `${baseUrl}?preview=level&level=${encodeURIComponent(levelId)}`;

  // `PLAYWRIGHT_CHROMIUM_PATH` is an escape hatch for a sandbox whose preinstalled
  // Chromium revision does not match this repo's pinned `playwright` version
  // (CI installs the matching revision itself — `playwright install` in
  // preview.yml — so this is unset there). Unset by default: `undefined` makes
  // Playwright resolve its own bundled browser, same as every other e2e-*.mjs.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch({
    args: SWIFTSHADER_ARGS,
    ...(executablePath === undefined ? {} : { executablePath }),
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // No unlock list needed: the preview seam bypasses menu/unlock entirely
    // (generatedHarness.ts) — only the mute/lives/difficulty prefs matter here.
    await seedDeterminism(page, [], { crt: false });
    await page.goto(navUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator("canvas").first().waitFor({ timeout: 20000 });
    await page.locator("span:text-is('temps')").first().waitFor({ timeout: 20000 });

    const tempsFirstRead = await readTempsSeconds(page);
    await sleep(settleMs);
    const tempsSecondRead = await readTempsSeconds(page);
    const hudSnippet = await readHudSnippet(page);

    return {
      url: navUrl,
      pageErrors,
      tempsFirstRead,
      tempsSecondRead,
      timerTicking: tempsSecondRead < tempsFirstRead,
      hudSnippet,
    };
  } finally {
    await browser.close();
    // Only tear down a server WE spawned — `ensureDevServer` never kills one it
    // reused, and neither do we.
    if (proc !== null) proc.kill();
  }
}

/**
 * `preview({ levelId }) → { url }` (spec-mcp-level-editor §3): ensures a local
 * vite dev server is up (reusing one already running) and returns the
 * `?preview=level&level=<id>` URL for a human (or a real browser) to open. Never
 * tears the server down — unlike `dryrun`, the whole point is for it to keep
 * serving after this call returns.
 */
export async function preview(
  { levelId },
  { rootDir = repoRoot(), plans = GENERATED_PLANS, port = DEFAULT_PORT, base = DEFAULT_BASE } = {},
) {
  resolvePlanOrThrow(levelId, plans, "preview");
  const { url: baseUrl } = await ensureDevServer({ rootDir, port, base });
  return { url: `${baseUrl}?preview=level&level=${encodeURIComponent(levelId)}` };
}

/**
 * Structural comparison for the spec §6 acceptance criterion — `dryrun("fixture")`
 * against the COMMITTED evidence report
 * (`docs/qa/evidence/story-level-harness-sp1/report.json`) — with the volatile
 * fields named and excluded explicitly rather than silently:
 *  - `pageErrors`: exact equality. Deterministic — cops are frozen
 *    (`seedDeterminism`), so a fresh run must be just as error-free.
 *  - `timerTicking`: exact equality. Deterministic BEHAVIOURAL claim (the level
 *    clock counts down), not a value.
 *  - `tempsFirstRead` / `tempsSecondRead`: EXCLUDED from cross-report comparison
 *    (volatile — real elapsed wall-clock seconds, machine-speed-dependent). Only
 *    checked for INTERNAL consistency against the actual report's own
 *    `timerTicking`.
 *  - `url`: EXCLUDED from exact-string comparison (the dev server port is an
 *    environment detail, not a level property) — checked structurally, the
 *    `?preview=level&level=<id>` query survives on ANY `http://localhost:<port>`
 *    origin.
 *  - `hudSnippet`: EXCLUDED from exact-string comparison — score/lives/energy
 *    are gameplay state that legitimately drifts between two independent runs
 *    even with cops frozen (e.g. authoring changes to the fixture's starting
 *    stats). Checked structurally: the same ORDERED set of HUD labels must
 *    appear (SCORE, NIVEAU, VAGUE, TEMPS, VIES, ÉNERGIE, ARME).
 */
export function compareDryrunReport(actual, expected) {
  const mismatches = [];

  if (JSON.stringify(actual.pageErrors) !== JSON.stringify(expected.pageErrors)) {
    mismatches.push(
      `pageErrors: expected ${JSON.stringify(expected.pageErrors)}, got ${JSON.stringify(actual.pageErrors)}`,
    );
  }

  if (actual.timerTicking !== expected.timerTicking) {
    mismatches.push(`timerTicking: expected ${String(expected.timerTicking)}, got ${String(actual.timerTicking)}`);
  }
  if ((actual.tempsSecondRead < actual.tempsFirstRead) !== actual.timerTicking) {
    mismatches.push(
      `timerTicking (${String(actual.timerTicking)}) disagrees with the actual report's own ` +
        `tempsFirstRead/tempsSecondRead (${String(actual.tempsFirstRead)} → ${String(actual.tempsSecondRead)})`,
    );
  }

  const urlPattern = /^http:\/\/localhost:\d+\/prohimuf\/\?preview=level&level=fixture$/;
  if (!urlPattern.test(actual.url)) {
    mismatches.push(`url: "${actual.url}" does not match the expected preview-seam shape`);
  }

  const HUD_LABELS = ["SCORE", "NIVEAU", "VAGUE", "TEMPS", "VIES", "ÉNERGIE", "ARME"];
  const labelOrder = (snippet) =>
    HUD_LABELS.filter((label) => snippet.toUpperCase().includes(label));
  const actualLabels = labelOrder(actual.hudSnippet ?? "");
  const expectedLabels = labelOrder(expected.hudSnippet ?? "");
  if (JSON.stringify(actualLabels) !== JSON.stringify(expectedLabels)) {
    mismatches.push(
      `hudSnippet labels: expected ${JSON.stringify(expectedLabels)}, got ${JSON.stringify(actualLabels)} ` +
        `(full snippet: "${actual.hudSnippet}")`,
    );
  }
  if (!(actual.hudSnippet ?? "").includes("Fixture")) {
    mismatches.push(`hudSnippet: expected it to contain the level name "Fixture", got "${actual.hudSnippet}"`);
  }

  return { ok: mismatches.length === 0, mismatches };
}
