# 0064 — Copilot runtime split: the CLI/app orchestrates the crew, the Coding Agent does not

- **Status:** Proposed
- **Date:** 2026-07-25
- **Amends (does NOT supersede):** [ADR-0062](./0062-vendor-neutral-agent-orientation.md)
  (vendor-neutral orientation: AGENTS.md canonical + thin overlays) and
  [ADR-0063](./0063-ci-run-code-review-panel.md) (CI-run merge-gate panel).

## Context

ADR-0062 established `.github/copilot-instructions.md` as the Copilot overlay,
written at a time when "Copilot" meant exactly one runtime: the **Copilot Coding
Agent** on github.com, which has no `Task`/`subagent_type` tool. The overlay
therefore contained a hard prohibition:

> Do **not** attempt to invoke Claude's subagent crew or BMAD skills
> (`.claude/agents/`, `.claude/skills/bmad-*`). Those are Claude-Code-only
> runtime machinery — Copilot doesn't have `Task` with `subagent_type`.

`AGENTS.md` reinforced it ("Other agents (Copilot, Cursor, …) don't need this
machinery — they … produce single-agent output").

Since then a second Copilot runtime is in daily use on this repo: the **Copilot
CLI / Copilot app** (worktree-backed local sessions). It **does** load
`.claude/agents/**` as user-provided custom agents and `.claude/skills/**` as
invocable skills, and it **does** expose a `Task` tool that can delegate to
`dev-gameplay`, `senior-architect`, `lead-art`, `qa-lead`, … — the full muf
crew.

Observed failure mode: in CLI sessions the specialised agents are almost never
invoked. The cause is not tooling but doctrine — the overlay is injected on
every turn and explicitly forbids the delegation the runtime is capable of,
while the counterpart _positive_ instruction (`CLAUDE.md` §"Default
orchestration policy", re-injected by the `UserPromptSubmit` hook
`.claude/hooks/bmad-crew-reminder.sh`) is Claude-Code-only and never reaches
Copilot. The result is a capable runtime working solo on every story, bypassing
the design gates, lane ownership and hand-off log of ADR-0018's pipeline.

## Decision

Split the Copilot overlay by **runtime capability**, not by vendor name.

1. `.github/copilot-instructions.md` opens with a **runtime identification
   table** (Copilot CLI/app vs Copilot Coding Agent) and a self-test: _if your
   tool list contains a `Task` tool whose agent types include `dev-gameplay` /
   `senior-architect` / `lead-art`, you are the CLI runtime._
2. **CLI runtime:** the standing orchestration policy of `CLAUDE.md` applies
   verbatim — non-trivial work is delegated to the crew in parallel on
   non-overlapping paths, with the same exceptions (questions, read-only
   exploration, micro-edits, one-off git/CI commands). The overlay carries a
   compact **routing cheat-sheet** (task surface → lane) so delegation is a
   lookup rather than a judgement call. The pipeline itself is not restated;
   `.claude/agents/COLLABORATION.md` stays the single source.
3. **Coding Agent:** unchanged — no crew, no skills, single-agent output,
   push and let CI gate.
4. **Merge gate (both):** the CI `panel-verdict` check run remains the
   merge-blocking authority (ADR-0063). Self-simulating the 4-reviewer panel in
   a single conversation stays forbidden for every runtime; on the CLI runtime
   the `review-panel` skill (which spawns four genuinely separate reviewer
   contexts) is permitted as an **advisory pre-push check** only.
5. `AGENTS.md` is corrected to phrase crew eligibility as "any runtime that
   loads `.claude/agents/**` as delegable agents", instead of naming Claude
   Code as the only one.

## Consequences

- **Positive:** the crew, its gates (design, art, quality, perf, docs) and the
  hand-off log apply to Copilot CLI sessions, which are otherwise a doctrine
  bypass. Rules stay capability-scoped, so a future runtime gaining `Task`
  inherits the right behaviour by matching the self-test.
- **Positive:** no duplication of the pipeline — the overlay points at
  `COLLABORATION.md` and adds only the routing table, keeping ADR-0062's "thin
  overlay" property.
- **Negative:** CLI sessions become more expensive (more subagent turns) and
  slower for medium tasks; the exception list is the pressure valve.
- **Negative:** the two-runtime table is a maintenance point — if Copilot's
  Coding Agent gains custom agents, the table must be revisited (the self-test
  degrades gracefully in the meantime: no `Task` ⇒ solo).
- **Risk:** an agent misreading the self-test and claiming crew work it did not
  do. Mitigated by the unchanged prohibition on claiming un-run panels/gates
  and by the hand-off log being the evidence of record.

## Alternatives considered

- **A. Leave the prohibition in place.** Rejected: it wastes the crew on the
  runtime Bertrand uses most, and contradicts ADR-0018's staffing model.
- **B. Drop the prohibition entirely (one rule for all Copilots).** Rejected:
  the Coding Agent genuinely lacks `Task`; telling it to delegate produces
  hallucinated orchestration — the exact failure ADR-0063 was written against.
- **C. A separate `copilot-cli-instructions.md` file.** Rejected: Copilot reads
  the same overlay path in both runtimes; a second file would not be loaded and
  would drift.
