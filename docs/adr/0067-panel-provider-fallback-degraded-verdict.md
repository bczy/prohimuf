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

### D4 — The request budget is a property of the provider, so the diff is split

The first live fallback run failed a second time, differently:

```
[panel-llm] github-models failed: github-models 413:
  {"code":"tokens_limit_reached",
   "message":"Request body too large for gpt-4o model. Max size: 8000 tokens."}
```

Measured against the live API (2026-07-25), that cap is **not** a property of
`gpt-4o`: `gpt-4.1` and `gpt-4.1-mini` answer the identical 413. It is a
platform limit of GitHub Models, so **moving to a bigger-context model does not
help** — the payload has to change, not the model.

The panel therefore no longer carries one hard-coded 200 KB budget. Each
provider declares its own (`maxInputChars`, `maxOutputTokens`), and
`callPanelModelBatched` splits the payload into as many calls as the answering
provider needs:

- the **reviewer** splits the unified diff **per file**, so batching never cuts
  a hunk in half, then merges and de-duplicates the findings of every call;
- the **skeptic** verifies findings in batches, each finding travelling with the
  diff of the file it accuses instead of the whole patch — which is both smaller
  and better grounding than the previous whole-diff dump.

Anthropic keeps reading the diff in a single call; nothing about the primary
path changes.

Two safety nets back the character budget, because characters only approximate
tokens (our own diff measures 3.9 chars/token; base64 or minified content is far
worse):

- a **413 shrink-retry** halves the budget on the same provider, up to 3 times,
  rather than failing a whole reviewer over one pathological file;
- a **429 backoff** honours the server's `retry-after`, and sequential calls are
  paced. Measured: GitHub Models allows 1000 requests/min yet still 429s a burst
  of 16 back-to-back calls — the wall is burst shaping, not quota.

A provider that dies on _any_ batch fails the whole call over to the next one: a
half-reviewed diff must never be reported as a complete review. That is D2
applied to batching.

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
- **A fallback review is slower and more fragmented.** A 216 KB diff becomes 16
  paced calls per reviewer (~2-4 min) instead of one, and each call sees a slice
  of the diff rather than the whole. The prompt goes out in full every time, so
  the reviewer's instructions are intact, but cross-file reasoning is weaker on
  the fallback path than on Anthropic. This is an honest limitation of the
  continuity measure, not a defect to hide: the primary path is unaffected.

## Verification

`scripts/lib/__tests__/panelLlm.test.mjs` and `panelVerdict.test.mjs` (31 tests)
lock the contract, including the exact production failure (HTTP 400, credit
balance too low → falls through to GitHub Models) and the PR #130 shape (zero
findings + a failed reviewer ⇒ **not** `success`).

Both scripts were additionally exercised end to end against a stubbed
transport: Anthropic down ⇒ answered by `github-models`, exit 0; both down ⇒
exit 1 with a well-formed artifact.

D4 was verified against the **real** API rather than a stub, because the limits
it works around were themselves discovered by measurement and not by reading
docs:

- the 8000-token cap was probed on `gpt-4o`, `gpt-4.1` and `gpt-4.1-mini` (all
  413), and binary-searched with this branch's own patch to 3.9 chars/token;
- `panel-invoke-reviewer.mjs` was then run for real against
  `models.github.ai` with the full 216 KB diff and no Anthropic key: split into
  16 calls, one 429 absorbed by the backoff, **17 findings written, exit 0**.
  Prior to D4 the same run exited 1 on the 413.
