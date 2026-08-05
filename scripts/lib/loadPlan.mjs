/**
 * loadPlan.mjs — the ONE way a `scripts/` generator reads a `LevelPlan` (SP2 T2).
 *
 * Every generated-level phase script (gen-street-paid.mjs --plan, align-windows.mjs,
 * gen-enemy-types.mjs --plan, gen-nearfg-sprites.mjs --plan) reads
 * `src/game/levels/generated/<id>.ts` through this loader, never by hand-rolling a
 * TS-import trick per script — that would drift the moment the module resolves an
 * `@game/*` alias (levelPlan.ts's own imports do). `jiti` (already a project
 * devDependency, `tsconfigPaths: true`) resolves those aliases exactly the way
 * vite/vitest do, and `interopDefault` mirrors ESM's real default-export shape —
 * so this loader reads the SAME module graph the app and the test suite compile,
 * not a parallel one.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

/**
 * The ONE shape a generated plan id may take (lowercase alphanumerics and
 * hyphens — the shape of every existing level id, e.g. "fixture"). Enforced
 * here as defense in depth behind the gen-plan-*.yml workflows' own allowlist
 * step (panel run-2 on PR #156): the id is resolved into a path that jiti then
 * TRANSPILES AND EXECUTES, so a "/", ".." or NUL smuggled into it could run an
 * arbitrary checked-out file. The regex forbids all of those by construction.
 * Exported so every OTHER consumer of a level id (e2e-generated-level.mjs's
 * argv, which becomes a docs/qa/evidence/<id>/ write path) reuses THIS shape
 * instead of hand-rolling a copy that could drift (panel run-4 on PR #156).
 */
export const LEVEL_ID_SHAPE = /^[a-z0-9-]+$/;

/**
 * loadPlan(levelId) -> Promise<LevelPlan>
 * Throws a clear, actionable error when the id is malformed, the module is
 * missing, or it does not export `plan` — a silent `undefined` plan would fail
 * confusingly several calls deeper (e.g. "Cannot read properties of undefined
 * (reading 'backdrop')").
 */
export async function loadPlan(levelId) {
  if (typeof levelId !== "string" || !LEVEL_ID_SHAPE.test(levelId)) {
    throw new Error(
      `loadPlan: invalid level id ${JSON.stringify(levelId)} — a generated plan id must ` +
        `match ${String(LEVEL_ID_SHAPE)} (see src/game/levels/generated/)`,
    );
  }
  const file = path.resolve(ROOT, "src/game/levels/generated", `${levelId}.ts`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `loadPlan: no generated plan for level "${levelId}" — expected ` +
        `${path.relative(ROOT, file)} to exist and export "plan"`,
    );
  }
  const jiti = createJiti(import.meta.url, { tsconfigPaths: true, interopDefault: true });
  const mod = await jiti.import(file);
  if (!mod || typeof mod !== "object" || !("plan" in mod)) {
    throw new Error(`loadPlan: ${path.relative(ROOT, file)} does not export "plan"`);
  }
  // The id lock (panel #156 run 3 MAJEUR): every consumer keys its OUTPUT on
  // plan.id while the workflow's cap counter and precheck key on the REQUESTED
  // id. A copy-pasted module whose stale `id` field was not updated would spend
  // a capped paid attempt for one level while silently overwriting a SIBLING
  // level's committed art. One check here closes the gap for all consumers.
  if (mod.plan?.id !== levelId) {
    throw new Error(
      `loadPlan: ${path.relative(ROOT, file)} exports plan.id ` +
        `${JSON.stringify(mod.plan?.id)} but was loaded as "${levelId}" — a generated ` +
        `plan's id must match its filename (copy-paste leftover?)`,
    );
  }
  // Validate the plan itself, HERE (panel #156 run 4 MAJEUR). The plan invariants
  // are otherwise enforced only by generatedLevels.test.ts, which iterates
  // GENERATED_PLANS — so a draft module that exists on disk but is not yet wired
  // into generated/index.ts (the natural in-progress state while authoring a level
  // WITH this harness) never runs through the validator at all. Without this, a
  // draft with `backdrop.aspect: 0` passes the workflow's precheck and guard,
  // pushes its `.paid-attempts` trace — SPENDING one of the hard-capped 3 attempts —
  // and only then builds a request with a non-finite height that the paid API can
  // only reject. Validating before returning makes every consumer fail BEFORE the
  // guard/record/generate chain can spend anything.
  const validate = await loadValidateLevelPlan(jiti);
  const issues = validate(mod.plan);
  if (issues.length > 0) {
    throw new Error(
      `loadPlan: ${path.relative(ROOT, file)} is not a valid LevelPlan — refusing to ` +
        // `validateLevelPlan` rend des `LevelIssue` (objets) depuis la story ③, plus des
        // chaînes : joindre le tableau brut imprimerait "[object Object]" à l'endroit
        // précis où ce garde-fou existe pour dire CE QUI cloche avant qu'un appel payant
        // ne soit dépensé.
        `run before anything is spent:\n  - ${issues.map((i) => i.message).join("\n  - ")}`,
    );
  }
  return mod.plan;
}

// `validateLevelPlan` lives in TypeScript next to the schema it guards; the same
// jiti instance that transpiled the plan module loads it, so there is exactly ONE
// copy of the invariants (never a re-derived script-side twin).
async function loadValidateLevelPlan(jiti) {
  const mod = await jiti.import(path.resolve(ROOT, "src/game/levels/levelPlan.ts"));
  if (typeof mod?.validateLevelPlan !== "function") {
    throw new Error("loadPlan: src/game/levels/levelPlan.ts does not export validateLevelPlan");
  }
  return mod.validateLevelPlan;
}

/**
 * L'unique lecture de l'option `--plan <id>` (panel #156 run 10) : le bloc était
 * recopié à l'identique dans les trois générateurs, libre de diverger dès que le
 * contrat du flag bouge (`--plan=id`, resserrement de la forme…). Rend `null`
 * quand le flag est absent — l'appelant choisit alors son mode hérité.
 */
export function planIdFromArgs(args) {
  const i = args.indexOf("--plan");
  if (i === -1) return null;
  const levelId = args[i + 1];
  if (!levelId || levelId.startsWith("--")) throw new Error("--plan requires a level id");
  return levelId;
}
