/**
 * planNamespace.mjs — the ONE copy of the "namespaced plan kind → human prompt
 * fragment" rule (panel run-4 on PR #156, MINEUR: it used to live twice, in
 * gen-enemy-types.mjs's loadEnemiesFromPlan AND gen-nearfg-sprites.mjs's
 * loadNearForegroundArtFromPlan, free to drift apart).
 *
 * A generated plan namespaces every kind as `<planId>:<name>` (spec §4.2); the
 * sprite generators want only the name segment, with `-`/`_` runs read as word
 * separators, to build a FLUX prompt ("fixture:vigile-de-nuit" → "vigile de
 * nuit"). A kind that does not carry THIS plan's namespace passes through
 * unchanged — validateLevelPlan already rejects foreign namespaces at CI time,
 * so this helper never second-guesses it.
 */
export function promptDescriptor(kind, planId) {
  const ns = `${planId}:`;
  const descriptor = kind.startsWith(ns) ? kind.slice(ns.length) : kind;
  return descriptor.replace(/[-_]+/g, " ").trim();
}
