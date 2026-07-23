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

Bertrand's constraint (2026-07-23, verbatim): *« Mais je ne peux pas ouvrir
Claude code je veux pouvoir faire autant de chose que Claude code que sur
copilot »*.

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

| Job | Skill / role | Runs in parallel with |
| --- | --- | --- |
| `code-review` | `code-review` (effort high) — correctness / simplification / efficiency | 3 siblings |
| `edge-case-hunter` | `bmad-review-edge-case-hunter` — branches, boundaries | 3 siblings |
| `bmad-review` | `bmad-code-review` — Blind Hunter / Edge Case Hunter / Acceptance Auditor | 3 siblings |
| `security-review` | `security-review` — attacker-controlled surface | 3 siblings |
| `verify` | skeptic — refutes each finding against the real diff | after the 4 above |
| `triage` | synthesises, posts findings, sets check run | after `verify` |

Each of the four reviewer jobs consumes the same input (unified diff +
changed-file listing + story context if present) and produces a **findings
JSON artefact** (`[BLOQUANT|MAJEUR|MINEUR] + file:line + failure scenario`).
`verify` challenges every non-trivial finding with a second LLM pass; only
`CONFIRMED` findings reach `triage`. `triage` posts CONFIRMED findings as PR
review comments and publishes a check run
**`panel-verdict`** = `PASS | CONDITIONAL | FAIL`.

### 2. Provider & prompts

The panel uses **Anthropic Claude Sonnet** via `ANTHROPIC_API_KEY` (repo
secret). The five system prompts live under `.github/panel-prompts/*.md`:

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

Branch protection on `main` requires the `panel-verdict` check to be
`PASS` or `CONDITIONAL` (never `FAIL`) before merging. A `CONDITIONAL` verdict
means all CONFIRMED findings are `MINEUR` — merger's judgment call, logged as
"conditional PASS accepted" in the story's handoff shard.

### 5. Local `/review-panel` remains as a pre-check

The existing Claude Code `Skill: /review-panel` (which fan-outs `Task` calls)
remains supported as a **pre-flight** — fast feedback while the branch is
still being built. Its verdict is advisory; only the CI panel verdict is
merge-gating. This preserves the Claude Code workflow speed while
guaranteeing agent-independent enforcement.

### 6. Rollout — inert by default

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

- **ADR-0018 (pipeline staffing)** — panel remains stage 6, but the *executor*
  moves from "4 parallel Task calls" to "6 parallel GitHub Actions jobs".
  Roster unchanged.
- **ADR-0032 (two-tier fix lane)** — fix-lane label mechanism formalised;
  single-reviewer route is now a CI mode, not an agent mode.
- **ADR-0062 (vendor-neutral orientation)** — the missing "how do
  non-Claude agents run the gate" section is answered here.
