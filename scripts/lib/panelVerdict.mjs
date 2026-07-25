// Panel verdict decision — pure, so it can be unit-tested without touching the
// GitHub API (the rest of panel-triage.mjs is I/O).
//
// Verdict ladder (ADR-0063 + ADR-0067):
//   - Any panel job that FAILED → DEGRADED  (the diff was not fully reviewed)
//   - Any confirmed BLOQUANT    → FAIL
//   - Any confirmed MAJEUR      → CONDITIONAL
//   - Otherwise                 → PASS
//
// DEGRADED is checked FIRST and on purpose. Zero findings has two very
// different causes — "reviewed and clean" or "never reviewed" (an LLM provider
// outage) — and before ADR-0067 both published PASS, so the gate went green
// exactly when it had stopped working. A degraded run is never `success`.

/**
 * @param {{BLOQUANT: number, MAJEUR: number, MINEUR: number}} counts
 * @param {readonly string[]} degraded names of panel jobs that did not complete
 */
export function decide(counts, degraded = []) {
  if (degraded.length > 0) {
    return {
      conclusion: "failure",
      title: "DEGRADED — panel incomplete, verdict not authoritative",
      summary: `${String(degraded.length)} panel job(s) failed: ${degraded.join(", ")}`,
      degraded: [...degraded],
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
