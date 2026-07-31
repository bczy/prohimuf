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
 * loadPlan(levelId) -> Promise<LevelPlan>
 * Throws a clear, actionable error when the module is missing or does not
 * export `plan` — a silent `undefined` plan would fail confusingly several
 * calls deeper (e.g. "Cannot read properties of undefined (reading 'backdrop')").
 */
export async function loadPlan(levelId) {
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
  return mod.plan;
}
