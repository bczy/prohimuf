/**
 * Minimal Node module-customization hook (node:module `register()` API) that
 * resolves the project's `@game/*` TS path alias (tsconfig.json `paths`) to
 * `<repo root>/src/game/*` for plain `node` scripts.
 *
 * Why this exists: `check-photo-subject-boxes.mjs` (scripts/) is required to
 * IMPORT the pure evaluator (`subjectBoxAt`, `@game/systems/photoQteSystem`)
 * rather than re-implement it (techplan §6 Lane C honour clause). Node 22 can
 * already type-strip a plain `.ts` file at import time (no build step needed —
 * verified: `import type` erases cleanly, plain function/const syntax runs
 * as-is), but it has no idea what `@game/*` means — that alias only exists in
 * `tsconfig.json` / the Vite/Vitest resolver. Every `src/game/**` module that
 * imports a sibling via `@game/...` (not a relative path) would otherwise
 * throw `ERR_MODULE_NOT_FOUND` the instant a CLI script tries to load it.
 *
 * This hook is intentionally NARROW: it only rewrites `@game/*` (the one
 * alias the pure game layer uses internally) and defers everything else to
 * the default resolver. It is not a general TS/Vite shim.
 *
 * The hook runs in Node's dedicated loader thread, which does NOT inherit the
 * calling script's `process.cwd()` — the repo root must be passed explicitly
 * as `register()`'s third argument (`data`), read once in `initialize()`.
 *
 * Usage (from a script's entry point, BEFORE the dynamic import):
 *   import { register } from "node:module";
 *   import { pathToFileURL } from "node:url";
 *   register("./lib/game-alias-loader.mjs", import.meta.url, {
 *     data: { root: pathToFileURL(process.cwd() + "/").href },
 *   });
 *   const { subjectBoxAt } = await import("@game/systems/photoQteSystem");
 */
let gameRoot = null;

export function initialize({ root }) {
  gameRoot = new URL("src/game/", root);
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@game/") && gameRoot !== null) {
    const rel = specifier.slice("@game/".length);
    // Bare specifiers never carry an extension (tsconfig `paths` convention);
    // Node's ESM resolver requires one, so pin `.ts` — every `@game/*` target
    // is a plain TS module, never `.tsx`/`.js`.
    const withExt = /\.[a-zA-Z0-9]+$/.test(rel) ? rel : `${rel}.ts`;
    return nextResolve(new URL(withExt, gameRoot).href, context);
  }
  return nextResolve(specifier, context);
}
