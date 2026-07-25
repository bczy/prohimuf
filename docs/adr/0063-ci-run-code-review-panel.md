# ADR-0063 — CI-run code-review panel (portable merge gate)

- **Status:** Proposed
- **Date:** 2026-07-23
- **Amends:** ADR-0018 (agent pipeline staffing), ADR-0032 (two-tier fix lane), ADR-0062 (vendor-neutral agent orientation)
- **Author:** tech-writer (Otis), on Bertrand's direct request

## Context

The mandatory merge gate defined in `.claude/agents/COLLABORATION.md:206-233`
is a **4-reviewer code-review panel** — four orthogonal review skills run in
parallel over `git diff origin/main...HEAD`, findings adversarially verified,
then triaged by `senior-architect`. Until 2026-07 this panel was implemented
as **local Claude Code Task fan-out** using the built-in `Task` tool with
`subagent_type` targeting `code-review`, `bmad-code-review`,
`bmad-review-edge-case-hunter` and `security-review`.

Bertrand's constraint (2026-07-23, verbatim): _« Mais je ne peux pas ouvrir
Claude code je veux pouvoir faire autant de chose que Claude code que sur
copilot »_.

Two problems surfaced simultaneously on PR #128:

1. **Copilot Coding Agent has no `Task` tool** (documented in
   `.github/copilot-instructions.md` §"What NOT to do", after commit 502ecd2
   split AGENTS.md canonical + overlays per ADR-0062). It cannot fan-out the
   panel. Attempting to self-simulate the 4 angles in a single agent turn
   defeats the panel's core property — **independence** of the four reads
   plus **adversarial verification** by a distinct skeptic.
2. **The doctrine offered no fallback**: an agent that cannot run the panel
   had no defined behaviour beyond "escalate to Bertrand", making Copilot
   effectively second-class for anything above the fix-lane threshold.

We need a merge gate that runs at **branch level**, not at **agent level**,
so that:

- Copilot Coding Agent, Claude Code, and human contributors all trigger the
  same gate with the same rigour.
- The verdict is a first-class GitHub artefact (check run + review
  comments), not an internal agent conclusion.
- The 4-reviewer parallelism, orthogonal skills, and adversarial
  verification are all preserved.
- The fix-lane bypass (ADR-0032) still applies with the single-reviewer
  shortcut.

## Decision

The merge gate moves from **local agent fan-out** to a **CI workflow** that
invokes the same skills against the same diff, agent-independent.

### 1. Workflow

A GitHub Actions workflow `.github/workflows/code-review-panel.yml`
implements the panel. It runs on `pull_request` events (opened, synchronize,
reopened, ready_for_review) targeting `main`, plus manual
`workflow_dispatch`.

Six jobs, five of them LLM-driven:

| Job                | Skill / role                                                              | Runs in parallel with |
| ------------------ | ------------------------------------------------------------------------- | --------------------- |
| `code-review`      | `code-review` (effort high) — correctness / simplification / efficiency   | 3 siblings            |
| `edge-case-hunter` | `bmad-review-edge-case-hunter` — branches, boundaries                     | 3 siblings            |
| `bmad-review`      | `bmad-code-review` — Blind Hunter / Edge Case Hunter / Acceptance Auditor | 3 siblings            |
| `security-review`  | `security-review` — attacker-controlled surface                           | 3 siblings            |
| `verify`           | skeptic — refutes each finding against the real diff                      | after the 4 above     |
| `triage`           | synthesises, posts findings, sets check run                               | after `verify`        |

Each of the four reviewer jobs consumes the same input (unified diff +
changed-file listing + story context if present) and produces a **findings
JSON artefact** (`[BLOQUANT|MAJEUR|MINEUR] + file:line + failure scenario`).
`verify` challenges every non-trivial finding with a second LLM pass; only
`CONFIRMED` findings reach `triage`. `triage` posts CONFIRMED findings as PR
review comments and publishes a check run
**`panel-verdict`** = `PASS | CONDITIONAL | FAIL`.

### 2. Provider & prompts

The panel uses the **GitHub Models inference API**
(`https://models.github.ai/inference/chat/completions`, OpenAI-compatible),
authenticated with the workflow's own `GITHUB_TOKEN` under
`permissions: models: read`. No third-party API key and no external billing:
inference is metered against the repo's GitHub Models quota. The model is
`openai/gpt-4.1` by default, overridable with the repo variable `PANEL_MODEL`
(the escape hatch when a model regresses or its quota is exhausted).

The invocation scripts live under `scripts/` — outside the `src/game` ↔
`src/hooks` ↔ `src/render` boundary, which they do not touch. Their shared HTTP
transport is `scripts/panel-llm.mjs`, imported by `panel-invoke-reviewer.mjs`
and `panel-invoke-skeptic.mjs`: one module, two callers, no other consumer.

The five system prompts live under `.github/panel-prompts/*.md`:

- `code-review.md`
- `edge-case-hunter.md`
- `bmad-review.md`
- `security-review.md`
- `skeptic.md`

Prompts are versioned; changes go through the panel like any other diff. A
sixth file `.github/panel-prompts/README.md` documents the invocation
contract (input schema, output schema, exit conditions).

### 3. Fix-lane bypass

A PR labelled **`fix-lane`** runs only the `code-review` job (single-reviewer
route per ADR-0032). `bmad-review`, `edge-case-hunter`, `security-review`,
`verify` and `triage` are skipped in that mode. The label is applied by the
owning dev lane and validated by the triage job.

### 4. Merge gate

The **intended** requirement is that `panel-verdict` must be `PASS` or
`CONDITIONAL` (never `FAIL`) before any merge to `main`. A `CONDITIONAL`
verdict means all CONFIRMED findings are `MINEUR` — merger's judgment call,
logged as "conditional PASS accepted" in the story's handoff shard.

`main` currently has **no branch protection rules configured**, so
`panel-verdict` is **advisory** until that changes. Enforcing it as a hard
gate requires a repository-settings action: add a branch protection rule (or a
ruleset) on `main` that lists `panel-verdict` as a required status check.
Activation timing is Bertrand's call.

### 5. Auto-remediation of BLOQUANT/MAJEUR findings

Confirmed `BLOQUANT` and `MAJEUR` findings are handed to the **Copilot coding
agent** automatically, so a red verdict produces a fix attempt rather than a
waiting queue. Opt-in via the repo variable `PANEL_AUTOFIX=true`.

The loop:

1. `remediate` (after `triage`) posts an `@copilot` request listing the
   confirmed `BLOQUANT`/`MAJEUR` findings — `scripts/panel-remediate.mjs`;
2. Copilot pushes a fix **directly to the branch under review**;
3. that push is a `synchronize` event, so the panel re-runs and re-judges;
4. still red after the cap ⇒ automation stops and the PR goes back to a human.

Step 2 was verified empirically on PR #133: Copilot committed to the branch as
`copilot-swe-agent[bot]`. Note that the October 2025 changelog describes the
older behaviour — a _stacked_ pull request based on the branch under review.
Should that behaviour ever return, the loop simply stalls at step 3 (the fix
sits in an unmerged PR) and the round cap ends it; nothing incorrect merges.

Guardrails, in order of importance:

- **Bounded.** `PANEL_AUTOFIX_MAX_ROUNDS` (default 2) caps the rounds. Each
  request carries a hidden marker that the script counts before acting; at the
  cap it stops and hands the PR back to a human. An unfixable — or false —
  finding must not spin forever.
- **False positives are expected.** The panel demonstrably emits them. The
  request tells Copilot to _refute a wrong finding in a comment rather than
  change code to satisfy it_, and never to weaken a test to silence one.
- **Nothing merges by itself.** Remediation only ever adds commits to a branch
  already under review. Landing on `main` still requires the panel verdict and
  a human merge.
- **Same-repo only.** Fork PRs are excluded from remediation.
- **Advisory, never load-bearing.** `remediate` runs after `triage`, and a
  remediation failure never alters the published verdict.

**`PANEL_BOT_TOKEN` (a PAT) is required.** Verified on PR #133: an `@copilot`
request posted with the default `GITHUB_TOKEN` is inert — the comment lands and
the agent never starts, while the same request from a user token produced
`copilot_work_started` within seconds. Without the secret the job still posts
the findings and emits a workflow warning saying no fix will arrive; it must
never look like it worked.

**Repository-settings prerequisite.** By default GitHub holds every workflow
run triggered by a Copilot commit in `action_required` pending manual approval,
which stops the loop at step 3. Closing it requires enabling _Settings →
Copilot → Coding agent → allow GitHub Actions workflows to run automatically
when Copilot pushes_. There is no REST API for this toggle. Until it is
enabled, remediation still produces the fix — a human just has to approve the
re-run.

### 6. Local `/review-panel` remains as a pre-check

The existing Claude Code `Skill: /review-panel` (which fan-outs `Task` calls)
remains supported as a **pre-flight** — fast feedback while the branch is
still being built. Its verdict is advisory; only the CI panel verdict is
merge-gating. This preserves the Claude Code workflow speed while
guaranteeing agent-independent enforcement.

### 7. Rollout — inert by default

To avoid breaking in-flight PRs (notably #128, which ships this ADR), the
workflow is committed with `on:` restricted to `workflow_dispatch` and
`workflow_call`, and each job carries an `if: ${{ vars.PANEL_ENABLED == 'true' }}`
guard. **Activation is a one-liner**: set repo variable `PANEL_ENABLED=true`
and add `pull_request` to `on:`. Bertrand controls activation timing.

Once activated, the very next PR that touches `main` goes through the panel.
PR #128 will be **retro-panelled** via `workflow_dispatch` immediately after
activation, per Bertrand's Q4 answer.

## Consequences

**Positive**

- **Agent-independent merge gate.** Copilot, Claude Code, human, or any
  future agent trigger the same panel with the same rigour.
- **Auditable.** Every panel run leaves an artefact + check run + review
  comments in GitHub, versioned with the PR.
- **Versioned prompts.** Prompt drift becomes visible in diffs; a prompt
  change is itself a PR that goes through the panel.
- **Adversarial verification stays.** The `verify` skeptic job is a hard
  requirement; findings without CONFIRMATION never reach the PR.

**Negative / cost**

- **API cost.** ~5-6 Claude Sonnet calls per PR, ~$0.10-0.30 per PR
  depending on diff size. At ~50 PRs/month → $5-15/month. Plafond validated
  by Bertrand.
- **CI wall-clock cost.** Panel adds ~2-4 min to PR CI time (parallel
  jobs, one skeptic pass, one triage). Acceptable.
- **Prompt maintenance.** Five prompts to keep tuned as the doctrine
  evolves. Owner: `tech-writer` for wording, `senior-architect` for content.

## Alternatives rejected

- **A. Panel gate = Claude only.** Copilot PRs stay draft until a Claude
  Code session runs `/review-panel`. Rejected: contradicts Bertrand's
  explicit demand for parity.
- **B. Panel gate = author declares.** Commit trailer `panel-verdict: PASS`
  signed by the author. Rejected: no independence, no adversarial layer,
  pure cargo-cult.
- **C. Single omnibus reviewer LLM.** One LLM call with a prompt that says
  "act as four reviewers then a skeptic then a triage". Rejected: the whole
  point of the panel is **independence** of the four reads — collapsing into
  one call collapses the epistemology.
- **D. Move panel to a pre-commit hook.** Rejected: hooks are agent-local
  again (Copilot doesn't run them), and adversarial verification wants
  isolation, which subshells don't give.

## Amendments to prior ADRs

- **ADR-0018 (pipeline staffing)** — panel remains stage 6, but the _executor_
  moves from "4 parallel Task calls" to "6 parallel GitHub Actions jobs".
  Roster unchanged.
- **ADR-0032 (two-tier fix lane)** — fix-lane label mechanism formalised;
  single-reviewer route is now a CI mode, not an agent mode.
- **ADR-0062 (vendor-neutral orientation)** — the missing "how do
  non-Claude agents run the gate" section is answered here.
