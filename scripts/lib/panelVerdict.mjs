// Panel verdict decision — pure, so it can be unit-tested without touching the
// GitHub API (the rest of panel-triage.mjs is I/O).
//
// Verdict ladder (ADR-0063; DEGRADED per ADR-0067; SKIPPED per ADR-0070):
//   - Panel could not even START (disabled, or no auth) → SKIPPED (neutral)
//   - Any panel job that FAILED → DEGRADED  (the diff was not fully reviewed)
//   - Any confirmed BLOQUANT    → FAIL
//   - Any confirmed MAJEUR      → CONDITIONAL
//   - Otherwise                 → PASS
//
// SKIPPED and DEGRADED are checked ahead of the tally, in that order, and on
// purpose. Zero findings has THREE very different causes — "reviewed and
// clean", "never started" (panel disabled, or the auth secret is absent) and
// "started and broke" (token invalid/expired, quota exhausted, agent
// answered garbage, zero coverage) — and before ADR-0067 the first two both
// published PASS, so the gate went green exactly when it had stopped
// working. SKIPPED is distinct from DEGRADED on purpose: a panel that never
// had a chance to run (config gap) must not block a required status check
// the way a panel that broke mid-review does — see ADR-0070 for why
// `panel-verdict` would otherwise wedge every PR shut whenever the panel is
// merely turned off.

/**
 * @param {{BLOQUANT: number, MAJEUR: number, MINEUR: number}} counts
 * @param {readonly string[]} degraded names of panel jobs that did not complete
 * @param {string | undefined} skippedReason set when the panel never started
 *   (e.g. `PANEL_ENABLED` unset, or the OAuth token secret is absent).
 */
export function decide(counts, degraded = [], skippedReason) {
  // DEGRADED outranks SKIPPED. A deliberately disabled panel leaves its jobs
  // `skipped`, never `failure`, so `degraded` is empty and SKIPPED still wins
  // below — the ordering only bites when something genuinely BROKE. It has to
  // be this way round because `preflight` failing produces BOTH signals at
  // once: no `enabled` output (which reads as "disabled", i.e. SKIPPED) and a
  // failed job. Letting SKIPPED win there would publish an inert neutral for
  // a panel that crashed — the fail-open ADR-0067 exists to prevent.
  if (degraded.length > 0) {
    return {
      conclusion: "failure",
      title: "DEGRADED — panel incomplete, verdict not authoritative",
      summary: `${String(degraded.length)} panel job(s) failed: ${degraded.join(", ")}`,
      degraded: [...degraded],
    };
  }
  if (skippedReason) {
    return {
      conclusion: "neutral",
      title: `SKIPPED — ${skippedReason}`,
      summary: "panel did not run — this is not a review result",
      skipped: skippedReason,
    };
  }
  if (counts.BLOQUANT > 0) {
    return {
      conclusion: "failure",
      title: "FAIL — blocking finding(s) confirmed",
      summary: `${String(counts.BLOQUANT)} BLOQUANT, ${String(counts.MAJEUR)} MAJEUR, ${String(counts.MINEUR)} MINEUR`,
    };
  }
  if (counts.MAJEUR > 0) {
    return {
      conclusion: "neutral",
      title: "CONDITIONAL — major finding(s) confirmed",
      summary: `${String(counts.MAJEUR)} MAJEUR, ${String(counts.MINEUR)} MINEUR`,
    };
  }
  return {
    conclusion: "success",
    title: "PASS — no blocking or major finding",
    summary: `${String(counts.MINEUR)} MINEUR`,
  };
}

/** Panel job results → the names of those that did not complete. */
export function degradedJobs(results = {}) {
  return Object.entries(results)
    .filter(([, r]) => r === "failure" || r === "cancelled")
    .map(([name]) => name)
    .sort();
}
