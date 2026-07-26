# 0070 — CI code-review panel moves to subscription auth via `claude-code-action`, retires the GitHub Models fallback

- **Status:** Accepted
- **Date:** 2026-07-26
- **Number:** 0070, self-allocated via the `adr-new` skill (no `producer` story shard was
  open for this decision — `senior-architect` triaged an incident directly with Bertrand).
  Checked against local `docs/adr/`, the index and `origin/main` at allocation time; the
  working name in discussion was ADR-0068, but that number was already taken by
  `0068-lazy-load-threejs-r3f.md` by the time this ADR was drafted.
- **Amends:** ADR-0063 (CI-run code-review panel) — §2 "Provider & prompts"
- **Partially supersedes:** ADR-0067 (Panel provider fallback + DEGRADED verdict) — D1
  (GitHub Models fallback) and D4 (per-provider request batching) are retired; D2 (loud
  failure) and D3 (DEGRADED-before-PASS) are reaffirmed, unchanged, below.
- **Author:** tech-writer (Otis), drafting a decision made by `senior-architect` and
  approved by Bertrand.

## Context

The Anthropic account backing the panel's metered API key ran out of credit a second
time (`Your credit balance is too low to access the Anthropic API`). Per ADR-0067's
design, every reviewer job fell back to GitHub Models — which was **also** rate-limited
(HTTP 429, `retry-after` ≈ 19h), because four parallel reviewer jobs, each issuing up to
33 batched calls under ADR-0067 D4's per-file/per-finding splitting, burst the shared
workflow token's quota in one PR. `panel-verdict` is a required branch-protection status
check on `main`, so every open PR was blocked with no self-service recovery — worse than
the hollow-PASS incident ADR-0067 was written to prevent, because this time the failure
was loud (correctly DEGRADED) but had no working escape hatch.

Before ADR-0063 (2026-07-23), this same 4-reviewer panel ran as local Claude Code
`Task`-tool fan-out inside an interactive session, billed against Bertrand's subscription
— no separately metered key existed, so this exact failure mode was structurally
impossible. ADR-0063 moved the panel to CI specifically so GitHub Copilot Coding Agent
(no `Task` tool) gets equivalent review coverage, which at the time required a
separately-billed API key because only direct HTTP calls to `api.anthropic.com` were
available from a plain CI job.

Bertrand asked whether that constraint still holds. A `tech-scout` research pass
confirmed it does not, with a caveat: Claude Code subscription OAuth tokens
(`sk-ant-oat01-…`) are **rejected (401)** by direct HTTP calls to the Messages API —
only the Claude Code CLI and the official `anthropics/claude-code-action` GitHub Action
honour them (source: `anthropics/claude-code#8402`, and `#37205`, closed not-planned).
Shown this tradeoff, Bertrand explicitly chose to move the CI panel onto subscription
auth via the official Action, accepting that this shares his interactive Claude Code
quota and carries a future re-metering risk (see Consequences).

## Decision

### D1 — Subscription auth via `claude-code-action`, not a metered key

Every panel job that calls a model — the four reviewers and the skeptic — runs as
`anthropics/claude-code-action@v1` authenticated with
`claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`, not a bespoke HTTP
call against `ANTHROPIC_API_KEY`.

`ANTHROPIC_API_KEY` is removed from every panel job's environment. This is not cleanup —
it is load-bearing: Claude Code's credential precedence ranks `ANTHROPIC_API_KEY` above
`CLAUDE_CODE_OAUTH_TOKEN`, so a stale, exhausted or empty `ANTHROPIC_API_KEY` left in the
environment would silently keep the OAuth path disabled and the job would fail (or worse,
degrade) for the wrong reason.

Raw HTTP is confirmed not viable for this credential (401 on the Messages API for
`sk-ant-oat01-…` tokens) — only the CLI/Action stack honours it, which is why the panel
must run through the Action rather than through `scripts/lib/panelLlm.mjs`'s previous
direct-call transport.

### D2 — The reviewer becomes a tool-using agent, not a single completion

Each reviewer's tool allowlist is `Read, Glob, Grep`. `Write`, `Edit`, `MultiEdit`,
`NotebookEdit`, `Bash`, `WebFetch` and `WebSearch` are explicitly disallowed, and MCP
GitHub tools are excluded so the agent cannot post PR comments itself — publication
stays `triage`'s exclusive job, unchanged from ADR-0063.

`panel-input/diff.patch` (assembled by `prepare`, as before) remains the canonical review
subject. The checked-out repository tree is now available as context the agent may read
to ground or refute a finding — e.g. to check whether a `__tests__` file the
boundary-law/TDD prompts expect actually exists — not as a substitute for reviewing the
diff. This is a real capability upgrade over the previous diff-text-only transport, not
merely an authentication swap.

### D3 — Findings contract unchanged, now schema-enforced

The Action's `--json-schema` flag makes the underlying SDK throw (surfacing as job
`failure`) if the agent does not return
`{reviewed_files: string[], findings: [{severity, file, line?, title, scenario,
suggested_fix?}]}`. A small script, `scripts/panel-write-findings.mjs`, materialises
`.findings` into the same `findings-<reviewer>.json` array shape that
`panel-triage.mjs` and the skeptic already consumed before this migration — the
downstream contract at the triage boundary is unchanged.

`reviewed_files` is a new anti-hollow-review signal: coverage is logged to the job's step
summary but not yet enforced, since no calibration data exists yet on what a healthy
coverage ratio looks like.

The skeptic is hardened at the same time: its structured output is now
`{id, confirmed, refutation?}` per finding, not the full finding object, so it can flip a
verdict but cannot rewrite a finding's `severity`/`file`/`title`. Findings are matched
back by an `id` assigned before the skeptic call.

### D4 — GitHub Models fallback and per-provider batching are retired

`scripts/lib/panelLlm.mjs` and its ordered-provider-fallback and request-batching/retry/
shrink logic (ADR-0067 D1 and D4) are removed. They existed to (a) survive an unbounded
Anthropic billing outage via a second provider, and (b) work around GitHub Models' 8000-
token request cap. Neither premise holds under subscription auth:

- the new failure modes (quota window exhausted, token expired) are bounded and
  self-service — not an indefinite outage requiring a second vendor;
- a fallback that reads 8 KB diff slices with zero repo access would publish a materially
  weaker verdict under the same `panel-verdict` name than the primary path — closer to
  the hollow-PASS failure ADR-0067 exists to prevent than to genuine continuity.

Recovery from a panel outage is now: DEGRADED verdict, then a manual re-run via
`workflow_dispatch` once the underlying cause (token, quota) is fixed — not a silently
weaker second reviewer.

### D5 — Loud failure and DEGRADED-before-PASS are reaffirmed; a new SKIPPED rung is added

ADR-0067 D2 (failure throws, non-zero exit) and D3 (the `needs.<job>.result == 'failure'`
→ DEGRADED mechanism in `panel-triage.mjs`, evaluated before the finding tally) are
transport-agnostic and unchanged by this ADR.

A gap discovered alongside the outage: every panel job, including `triage`, previously
carried `if: vars.PANEL_ENABLED == 'true'`. When the panel was disabled, `panel-verdict`
was never published at all — and since it is a **required** branch-protection check, an
unpublished check blocks `main` forever, exactly like an outage but with no DEGRADED
signal to explain why.

This is fixed by a new, ungated `preflight` job that computes whether the panel can
actually run (`PANEL_ENABLED == 'true'` AND the `CLAUDE_CODE_OAUTH_TOKEN` secret is
present). `triage` now always runs (`if: always()`), and when `preflight` reports the
panel disabled, `triage` publishes `panel-verdict` with conclusion **`neutral`**
(SKIPPED, non-blocking) instead of failing or silently omitting the check.

The distinction that matters:

| State        | Meaning                                                      | Blocking? |
| ------------ | -------------------------------------------------------------| --------- |
| **SKIPPED**  | Could not start — config gap (disabled, or secret absent)    | No        |
| **DEGRADED** | Started and broke — invalid/expired token, quota exhausted, agent failure, zero coverage | Yes |

SKIPPED is visible but never reads as a PASS, so ADR-0067's core invariant — "a review
that could not happen must never look like a clean PASS" — holds under this ADR too.

### D6 — Draft PRs no longer trigger the panel

muf's `open-pr` skill opens PRs as drafts. The workflow now gates on `draft == false`
(with `workflow_dispatch` exempted), so the iterate-and-push phase of a PR's life — which
burst GitHub Models' rate limit under the old transport, and would burn shared
subscription quota under the new one — costs nothing. `synchronize` stays in the trigger
list: a stale review surviving a post-ready push is a correctness hole, not a saving.

`paths-ignore` was considered and rejected: a required check skipped by a path filter
never publishes at all, and blocks the PR forever — the same failure shape D5 exists to
close.

## Consequences

**Positive**

- The recurring failure mode that motivated this ADR (shared metered key exhausted,
  fallback also rate-limited, PR blocked with no self-service fix) is closed: recovery is
  now a token/quota check and a `workflow_dispatch` re-run.
- The reviewer gains real repository read access (D2), which was not available to the
  diff-text-only transport ADR-0063/0067 shipped with.
- `scripts/lib/panelLlm.mjs`'s ~400 lines of provider-fallback and batching/retry/shrink
  logic are deleted; the panel no longer needs to reason about two vendors' divergent
  rate-limit and token-budget behaviour.
- The disabled-panel-blocks-`main`-forever bug (found alongside the outage, unrelated to
  the auth transport itself) is fixed by the SKIPPED rung (D5), independently useful even
  if this ADR is later revisited.

**Negative / risks**

- **Quota contention with interactive use.** Five agent sessions per PR (four reviewers +
  skeptic) draw on the same rolling-window subscription quota as Bertrand's own
  interactive Claude Code sessions. Mitigated, not eliminated, by draft-gating (D6) and by
  using the `sonnet` model alias rather than Opus.
- **Policy exposure.** Anthropic's own published guidance recommends a Platform API key,
  not subscription OAuth, for shared production automation. This is a knowing,
  cost-motivated deviation for a solo/small repo. If Anthropic ever removed or restricted
  this path, the panel would DEGRADE on every PR — D4 retires the fallback, so there is no
  automatic second transport — until `ANTHROPIC_API_KEY` plus a `panelLlm.mjs`-equivalent
  transport were reinstated from git history.
- **Annual manual token rotation, no expiry warning.** `claude setup-token` mints a
  1-year credential with no advance-expiry notice from the tooling. The failure mode on
  expiry is DEGRADED on every PR — loud, but late. **Follow-up action (owner:
  `producer`):** log a dated reminder in `docs/handoffs/` at mint time so rotation is
  chased before expiry, not discovered by it.
- **Re-metering risk.** Anthropic has a paused-but-not-cancelled plan to meter "the
  Claude Code GitHub Actions integration" separately from interactive subscription use.
  If unpaused, this decision may need revisiting. Accepted knowingly.
- **Prompt injection surface.** The agent now reads attacker-controllable diff and PR-body
  text on a repo that may be public, with real tool access (`Read`/`Glob`/`Grep`) even
  though writes, `Bash` and network access are denied and it cannot itself post PR
  comments. The blast radius is bounded to "the reviewer is misled into a wrong finding,"
  not code execution or exfiltration, given the tool restrictions in D2 — stated
  explicitly here rather than left implicit.
- **Ungated repo if `PANEL_ENABLED` is left unset.** SKIPPED is visible (in the checks
  list and a PR comment) but non-blocking by design, so a repo can sit ungated
  indefinitely if nobody is watching that check. **Owner: `producer`**, to re-arm
  `PANEL_ENABLED` in the same session as any future intentional disable.
- **Model drift.** `--model sonnet` is an alias, not a pinned model id, so review
  characteristics may shift silently across Sonnet point releases. Accepted deliberately —
  a dead pinned model id blocking every PR is judged a worse failure than quiet drift.

## Alternatives rejected

- **Keep the GitHub Models fallback, raise or shard its quota.** Rejected: the shared
  workflow token's quota is a property of the whole repo's Actions usage, not something
  the panel controls; sharding it across reviewer jobs only delays the same collision.
- **Provision a second, better-funded `ANTHROPIC_API_KEY`.** Rejected by Bertrand on cost
  grounds: the subscription already pays for equivalent quota; a second metered key would
  be paying twice for the same capability.
- **Keep the metered key as primary, subscription auth as the new fallback.** Rejected:
  it inherits D4's own rationale against a two-tier system — the fallback's diff-slice
  transport would still be qualitatively weaker than the (now available) tool-using
  primary, so two active transports with divergent verdict quality is worse than one
  well-understood transport plus a loud, self-service-recoverable failure mode.

## Verification

Owned by `dev-tooling-assets` in the implementing PR (workflow YAML, `panel-write-
findings.mjs`, prompt file edits, deletion of `scripts/lib/panelLlm.mjs` and its
provider-fallback tests) — not restated here. This ADR records the decision and its
tradeoffs, not the implementation's test evidence.
