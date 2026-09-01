# CLAUDE.md — muf (Claude Code overlay)

> **Read `AGENTS.md` first.** It holds the vendor-neutral project facts,
> stack, commands, architecture boundary law, scope guard, working rules, and
> Karpathy behavioral guidelines. This file only adds Claude-Code-specific
> orchestration on top.

## Commands (Claude-Code addendum)

Prefer **`rtk`** (Rust Token Killer) as a compact proxy over the yarn commands
listed in `AGENTS.md` — it saves tokens by compressing `tsc`/`vitest`/`grep`/`git`
output. A PreToolUse hook rewrites bash commands automatically once installed.
Fall back to `yarn` if rtk is unavailable.

| Task      | Preferred    | Fallback         |
| --------- | ------------ | ---------------- |
| Typecheck | `rtk tsc`    | `yarn typecheck` |
| Tests     | `rtk vitest` | `yarn test`      |
| Lint      | `rtk lint`   | `yarn lint`      |

## AIDD setup

This project runs on **BMAD-METHOD v6.3** (`_bmad/`, skills under `.claude/skills/bmad-*`,
artifacts in `_bmad-output/`). BMAD config: `_bmad/bmm/config.yaml`
(language = English, planning → `_bmad-output/planning-artifacts/`).

### Subagent team (`.claude/agents/`)

A crew of subagents (full roster & protocol: `.claude/agents/COLLABORATION.md`) that runs
in parallel but always coordinates there and logs in the sharded handoffs log
(`docs/handoffs/`, index `docs/agent-handoffs.md`). Core crew,
each fronting a BMAD persona:

| Subagent             | Role                                  | BMAD bridge                             |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `pm`                 | Product / PRD / stories / scope       | `bmad-agent-pm` (John)                  |
| `producer`           | Pipeline execution, sprint status     | `bmad-sprint-planning/-status` (Marion) |
| `senior-architect`   | Architecture, boundaries, sign-off    | `bmad-agent-architect` (Winston)        |
| `tech-scout`         | Technical recon / feasibility (R&D)   | `bmad-agent-analyst` (Nadia/Mary)       |
| `lead-game-designer` | Design gate + design/art/dev sync     | — (Karim)                               |
| `game-designer`      | Mechanics, tuning, 3C specs           | BMGD `gds` module when installed        |
| `narrative-designer` | Universe, cast, in-game text scripts  | BMGD `bmgd-narrative` when installed    |
| `ux-designer`        | Screens/flows/HUD UX + accessibility  | `bmad-agent-ux-designer` (Tony)         |
| `qa-lead`            | Test plans, regressions, quality gate | `bmad-qa-generate-e2e-tests` (Inès)     |
| `gpu-specialist`     | Frame budget, perf verdicts (GPU)     | — (Ben)                                 |
| `tech-writer`        | DOCS lane: ADRs, doc↔code coherence   | `bmad-agent-tech-writer` (Otis)         |
| `dev-r3f-render`     | `src/render` + view hooks             | `bmad-agent-dev` (Amelia)               |
| `dev-gameplay`       | `src/game` pure logic (TDD)           | `bmad-agent-dev` (Amelia)               |
| `dev-tooling-assets` | `scripts/`, `levelArt.json`, CI       | `bmad-agent-dev` (Amelia)               |

(The art crew — `lead-art`, `art-advisor`, `graphic-references`, `concept-artist`,
`game-graphist` — and the
`sound-designer` are documented in COLLABORATION.md.)

Flow — the production pipeline (stages 0-8, hand to hand; full protocol in
COLLABORATION.md, mermaid diagram in `docs/diagrams/agent-workflows.md`): `pm` (what) →
**design loop** when the story touches gameplay, fiction or screens/flows/accessibility
(`game-designer` + `narrative-designer` + `ux-designer` in parallel →
`lead-game-designer` design gate) →
`senior-architect` (how + lane assignment; pulls in `tech-scout` for a sourced feasibility
report when the story rests on an unproven technique or unfamiliar model/API/dependency) →
dev lanes in parallel on non-overlapping
paths (∥ art lane when assets are needed) → **verify** (orchestrated by `qa-lead`:
tsc/vitest/lint + e2e + `game-designer` playtest vs spec, `ux-designer` review of built
screens/flows on both device classes, composite gate for runtime visuals,
`gpu-specialist` perf verdict for perf-sensitive changes — all funnelled into the
quality gate) →
**code-review panel** (mandatory merge gate) whose triage by `senior-architect` IS his
integration review (one stage, one read) → `pm` accepts. `producer` drives the pipeline
itself (stage tracking, tier calls, hand-off chasing, caps, escalations, ADR number
allocation). Launch independent dev lanes in a single message (parallel Task calls).

**Roundtable (not a pipeline stage):** to hear several lanes on an open question
_before_ opening a story — a scope call, a design debate, a roadmap arbitration — use
the `muf-party-mode` skill. It spawns the crew as real subagents (`--lane product |
design | art | tech | quality | audio`, or `--all`) in read-only discussion mode: no
gates, no files written, nothing binding. Use `bmad-party-mode` only when you want the
6 generic BMAD personas instead of the muf crew.

**Fix lane (two-tier rule):** a small diff owned by a SINGLE dev lane — no design, no
asset, no dependency/boundary change, polish/bug-fix of already-gated behaviour — skips
the full pipeline: owning dev lane → tsc/vitest/lint (+ `verify` if player-visible) →
ONE `code-review` (high) reviewer → Bertrand merges. Logged as one line in
`docs/handoffs/fixes.md`. Doubt or a broken criterion ⇒ full pipeline
(COLLABORATION.md §fix lane).

**Mandatory merge gate:** before ANY merge to `main`, the full diff
(`git diff origin/main...HEAD`) goes through a 4-reviewer panel run in parallel, each with
a different skill — `code-review` (high), `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review` — findings adversarially verified, then
triaged by `senior-architect`. No merge with an unresolved CONFIRMED blocking/major
finding. Protocol: `.claude/agents/COLLABORATION.md` §"code-review panel".

Since ADR-0063, the panel is also runnable in CI (`.github/workflows/code-review-panel.yml`),
so contributors without the `Task`/subagent tooling (Copilot Coding Agent, human reviewers)
get the same rigour. When the workflow is active, Claude's local `/review-panel` skill is
a **pre-check** — a fast local pass before pushing — and the CI `panel-verdict` check run
is the merge-blocking authority.

### Default orchestration policy (Bertrand's standing preference)

**For every non-trivial task, orchestrate this crew in parallel by default — do not work
solo.** Open with `pm`, plan lanes with `senior-architect`, then fan out the dev lanes as
concurrent Task calls on non-overlapping paths, and close with architect review + `pm`
acceptance. A `UserPromptSubmit` hook (`.claude/hooks/bmad-crew-reminder.sh`) re-injects this
on every prompt; the policy is here so it stays readable and versioned.

**Non-trivial** = any feature, refactor, or bug that touches code/assets, or any design work.
**Exceptions (act directly, no crew):** questions & explanations, read-only exploration,
research, one-line/micro edits (typo, local rename), and one-off git/CI commands. When in
doubt on a borderline task, prefer the crew. To pause it for a session: `export MUF_CREW_OFF=1`.

### Tooling for Claude sessions

- **rtk** (Rust Token Killer) — CLI proxy that compresses `tsc`/`vitest`/`grep`/`git`
  output. A PreToolUse hook rewrites bash commands automatically once installed.
- **codegraph** — local code knowledge graph over MCP (see `.mcp.json`): query symbols,
  imports and call chains instead of grepping. Use it to find callers before editing.
- **Local setup:** remote web sessions auto-provision both tools via the SessionStart
  hook; on a local machine run `scripts/setup-tooling.sh` once (idempotent) to install
  rtk + codegraph by hand.

### Claude-specific working rules (on top of AGENTS.md)

- **Do not manually run `rtk tsc`/`rtk lint` (or `yarn typecheck`/`yarn lint`/`yarn
format`) as a blanket verification pass before committing** — same rule as
  `AGENTS.md`: the pre-commit hook already runs lint-staged + lint + format:check on
  every commit, never bypass it with `--no-verify`. `rtk vitest` (or a targeted test
  file) during active TDD red→green work is fine; a full manual check-everything pass
  right before committing is not — let the hook do it.
- Navigating code — who calls `X`, the impact of changing `Y`, where a symbol is defined —
  query **codegraph** first (`codegraph_callers/_callees/_impact/_search`): it returns a
  compact structured answer instead of grep/Read dumping whole files into context. Fall
  back to grep/Read only when codegraph can't answer (e.g. non-code text, comments).
