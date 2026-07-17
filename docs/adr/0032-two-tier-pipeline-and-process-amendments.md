# 0032 — Two-tier pipeline, merged review stage, sharded handoffs log, producer-allocated ADR numbers

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

A review of the agent-team flow (requested by Bertrand, 2026-07-17) confirmed the
staffed pipeline of ADR-0018 works — gates catch real defects (e.g. the CRT
composite re-gate, the 12-finding panel triage on PR #63) and throughput is healthy
(44 commits to `main` over 3 days). But four frictions were evidenced:

1. **Uniform ceremony.** The pipeline had no tier between "trivial exception" and
   the full 10-stage flow. Small single-lane fixes (a 44px tap target, a
   `prefer-const` lint fix) either paid ~10 agent invocations of overhead or bent
   the rules silently.
2. **Monolithic log.** `docs/agent-handoffs.md` had grown to 262 KB / 3 374 lines —
   past the size an agent can read in one pass — with free-form verdict phrasing
   that defeated mechanical auditing. `docs/art-direction/prompt-drafts.md` (59 KB,
   append-style) was on the same trajectory.
3. **Redundant serial reviews.** Stage 6 (architect integration review) and stage 7
   (code-review panel) had the architect read the full diff twice: once for
   integration sign-off, once to triage the panel's findings.
4. **ADR number collisions.** Parallel lanes self-allocating ADR numbers produced
   two ADR-0020s, a 0026→0028 rebase renumber, and a 0030/0031 mismatch caught in
   review.

## Decision

Amend the production pipeline of ADR-0018 (protocol source of truth:
`.claude/agents/COLLABORATION.md`) in four ways:

1. **Two-tier pipeline.** A **fix lane** for changes that are single-dev-lane,
   design-free, asset-free, dependency/boundary-free, and small: owning dev lane →
   mechanical checks (+ `verify` when player-visible) → ONE `code-review` (effort
   high) reviewer → merge by Bertrand. Logged as one line in
   `docs/handoffs/fixes.md`. Any criterion broken mid-flight escalates to the full
   pipeline; gate owners can reclaim a fix touching their surface. The full
   pipeline remains mandatory for features, refactors and design work.
2. **Sharded handoffs log.** `docs/agent-handoffs.md` becomes a small index (rules,
   template, machine-parsable `VERDICT: PASS|FAIL — <gate> (<agent>)` line format);
   story entries live one-file-per-story under `docs/handoffs/`; pre-shard history
   is frozen in `docs/handoffs/archive-2026-07.md`. General rule: any shared
   append-style doc approaching ~100 KB is sharded by its owner with an index left
   at the old path (applied immediately to `docs/art-direction/prompt-drafts.md` →
   `docs/art-direction/prompt-drafts/` per prompt family).
3. **Merged review stage.** The pipeline is renumbered 0-8: the former stage 6
   (INTEGRATE) folds into the code-review panel stage — `senior-architect`'s triage
   of the panel's adversarially-verified findings IS his integration review and
   cross-lane sign-off, one pass over the diff. Panel composition, adversarial
   verification, and the no-CONFIRMED-blocking/major merge rule are unchanged.
4. **Producer-allocated ADR numbers.** `producer` (Marion) hands out the next free
   `NNNN` at story opening and records it in the story shard; nobody self-allocates.

## Consequences

- Small fixes get a proportionate path with an explicit contract, instead of either
  full ceremony or silent rule-bending; tier calls are recorded by `producer`, so
  fix-lane abuse is auditable.
- Agents (and Marion's hygiene audits) can read any story's full trace in one pass;
  gate coverage is greppable via the `VERDICT:` format. Historical references to
  `docs/agent-handoffs.md` keep resolving (the path now serves the index).
- One less serial stage per story with no loss of review coverage; stage numbers in
  documents written before 2026-07-17 refer to the old 0-9 numbering and are left
  unrewritten (history describes history).
- ADR numbering collisions end at 0032 (this ADR is the first Marion-style
  allocation; the two legacy ADR-0020 files are left as-is — renumbering shipped
  history would break links for no benefit).
