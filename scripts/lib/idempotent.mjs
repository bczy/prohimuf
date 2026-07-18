/**
 * Shared "skip if exists" decision (ADR-0007 D2) — replaces the copy-pasted
 * `if (!FORCE && fs.existsSync(outPath)) { skip }` guard duplicated across the
 * generators (generate-assets.mjs, generate-game-assets.mjs, gen-enemy-types.mjs,
 * gen-level-art.mjs, …).
 *
 * `skipIfExists` is the pure decision — no fs import here, ever (ADR-0007
 * "Gotchas": the moment a primitive captures fs it stops being unit-testable).
 * `skip` is the thin injectable-edge wrapper a generator actually calls,
 * taking the (real, or in a test a fake) `existsSync` as an explicit
 * dependency so the fs touch stays at the caller's edge, per the ADR.
 */

/** Pure decision: skip (true) iff the file exists and force is not set. */
export function skipIfExists({ exists }, force = false) {
  return !force && Boolean(exists);
}

/**
 * `skip(filePath, { force, existsSync })` — the one-line replacement for the
 * inline guard: `if (skip(out, { force: FORCE, existsSync: fs.existsSync })) { ...skip... }`.
 * `existsSync` must be injected (no default to `fs.existsSync` here — the ADR's
 * "inject fs at the edge" rule), so this module never imports `fs` itself.
 */
export function skip(filePath, { force = false, existsSync } = {}) {
  if (typeof existsSync !== "function") {
    throw new TypeError("skip: existsSync must be an injected function, e.g. fs.existsSync");
  }
  return skipIfExists({ exists: existsSync(filePath) }, force);
}
