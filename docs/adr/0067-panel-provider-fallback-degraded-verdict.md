# ADR-0067 — Panel provider fallback + DEGRADED verdict (the gate must not fail open)

- **Status:** Proposed
- **Date:** 2026-07-25
- **Amends:** ADR-0063 (CI-run code-review panel)
- **Author:** Copilot CLI session, on Bertrand's direct request

## Context

On PR #130 the merge gate published a green verdict:

> `panel-verdict` — **PASS — no blocking or major finding** · `0 MINEUR`

It was hollow. The four reviewer jobs had each finished in 8-10 seconds
(a real review takes minutes) and uploaded a 168-byte findings artifact. Their
logs all carried the same line:

```
[panel-invoke-reviewer] anthropic 400: {"type":"invalid_request_error",
 "message":"Your credit balance is too low to access the Anthropic API…"}
```

The Anthropic balance was exhausted, so **not one line of the diff was
reviewed** — and the gate said PASS.

Two independent defects combined to produce that result.

**1. A single point of failure.** ADR-0063 wired every reviewer and the skeptic
directly to `api.anthropic.com`. One billing event took the entire merge gate
offline, on every PR, with no second path.

**2. The gate failed OPEN, silently.** `panel-invoke-reviewer.mjs` caught every
error, wrote `[]` and exited 0 — documented at the time as deliberate
("fail-open at the reviewer level; the skeptic and triage jobs are the ones
that hold the verdict"). But triage decides purely by counting findings, so it
cannot tell the two causes of an empty list apart:

- the diff was reviewed and is clean → PASS is correct;
- the reviewers never ran → PASS is a lie.

Both rendered as `success`. The gate therefore went green **precisely when it
had stopped working**, and nothing in the check list said so — the only tell was
the job durations, which nobody reads on a green run. A merge gate that cannot
distinguish "verified" from "not verified" is decorative.

## Decision

### D1 — Ordered provider fallback

Reviewer and skeptic no longer call a vendor directly. Both go through
`scripts/lib/panelLlm.mjs`, which tries each **configured** provider in order:

1. **Anthropic** (`ANTHROPIC_API_KEY`) — the primary reviewer, unchanged.
2. **GitHub Models** (`GITHUB_TOKEN` + `permissions: models: read`) — the
   Copilot-side fallback.

GitHub Models is the right second path for this repo specifically: it is
reachable from inside Actions with the workflow token, so it needs **no new
secret to provision, rotate or leak**, and it has no relationship to the
Anthropic balance — the two cannot fail for the same reason.

A provider is skipped only when it is not configured; a configured provider
that _errors_ is tried, logged, and handed to the next. The exception is a
malformed request (404/422 — e.g. a bad model id), which fails identically
everywhere and so must not burn the fallback's quota.

### D2 — Failure is loud

`callPanelModel` **throws** when every provider fails. Both scripts still write
a well-formed (empty / confirm-all) artifact so the downstream contract holds,
then **exit non-zero**.

### D3 — DEGRADED, checked before everything else

Triage gains a rung above the existing ladder:

| Condition              | Verdict     | Conclusion |
| ---------------------- | ----------- | ---------- |
| any panel job failed   | DEGRADED    | `failure`  |
| any confirmed BLOQUANT | FAIL        | `failure`  |
| any confirmed MAJEUR   | CONDITIONAL | `neutral`  |
| otherwise              | PASS        | `success`  |

DEGRADED is evaluated **first**, because when part of the panel never ran the
finding tally is not a statement about the diff at all. The PR comment names
the jobs that did not complete and says plainly that the diff was not fully
reviewed.

`skipped` is deliberately **not** degraded: `edge-case-hunter` is legitimately
skipped on the fix lane (ADR-0032).

## Consequences

- **The gate can no longer go green on its own outage.** This is the whole
  point; everything else here is a means to it.
- **One provider outage is now survivable** rather than a repo-wide merge stop.
- A degraded run publishes `failure`, so with `panel-verdict` as a required
  check the PR is blocked until the panel is fixed or a human explicitly waives
  it. That is the intended trade: a **false red is recoverable, a false green is
  not**.
- Reviews may be authored by a different model than the primary. Findings carry
  the answering provider in the job log, so a fallback run is visible rather
  than implicit.
- **Not addressed here:** quality parity between providers. The fallback is a
  continuity measure, not a claim that both models review identically.
- Cost/quota: GitHub Models is rate-limited per repo. A prolonged Anthropic
  outage on a busy day may exhaust it too — which now surfaces as DEGRADED
  instead of a hollow PASS.

## Verification

`scripts/lib/__tests__/panelLlm.test.mjs` and `panelVerdict.test.mjs` (22 tests)
lock the contract, including the exact production failure (HTTP 400, credit
balance too low → falls through to GitHub Models) and the PR #130 shape (zero
findings + a failed reviewer ⇒ **not** `success`).

Both scripts were additionally exercised end to end against a stubbed
transport: Anthropic down ⇒ answered by `github-models`, exit 0; both down ⇒
exit 1 with a well-formed artifact.
