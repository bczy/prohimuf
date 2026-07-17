# story-agent-team-flow-optimization

Process amendments to the production pipeline, decided by Bertrand (2026-07-17) after
a flow review. Normative outcome: ADR-0032. This shard is the first of the sharded
log — it dogfoods the format defined in `docs/agent-handoffs.md`.

## 0. INTAKE — Bertrand — 2026-07-17

- claim: "Pense-tu que notre flow d'équipe d'agent est optimisé ?" → flow review
  delivered (evidence: archive log 262 KB/3 374 lines, 52 story blocks, two ADR-0020s,
  0026→0028 renumber, micro-fix commits paying full ceremony, double diff read at
  stages 6-7). Bertrand ruled on all four findings: (1) add a fix lane, (2) shard the
  log and other oversized append-docs, (3) merge stage 6 into the panel triage,
  (4) ADR numbers allocated by producer.

## 1-8 — orchestrator (direct, protocol-meta change) — 2026-07-17

- claim: apply the four rulings across the normative docs. Crew not spawned: the
  change edits the crew's own charter from explicit owner decisions — no scope, design
  or code surface. Historical docs keep old stage numbers (history describes history).
- release: File List —
  - `.claude/agents/COLLABORATION.md` — §fix lane added; pipeline renumbered 0-8
    (stage 6 = REVIEW: panel + integration triage in one pass); log references →
    sharded paths; rule #4 (shard rule, VERDICT format), rule #9 (ADR allocation);
    roster rows (producer, concept-artist).
  - `docs/agent-handoffs.md` — rewritten as the index (rules, template,
    machine-parsable `VERDICT:` format). Legacy content → `docs/handoffs/archive-2026-07.md`.
  - `docs/handoffs/fixes.md` — rolling fix-lane log created.
  - `docs/art-direction/prompt-drafts.md` — now an index; content →
    `docs/art-direction/prompt-drafts/vehicle-set.md` (one shard per prompt family).
  - `.claude/hooks/bmad-crew-reminder.sh` — two-voice routing (FIX / full 0-8).
  - `CLAUDE.md` — flow paragraph renumbered + fix-lane summary.
  - `.claude/agents/{producer,senior-architect,qa-lead}.md` — stage renumber, shard
    paths, ADR allocation, merged-review wording.
  - `docs/diagrams/agent-workflows.md` — mermaid: stages 0-8, merged REVIEW box,
    fix-lane note.
  - `.github/pull_request_template.md` — two-voice gate checklist.
  - `docs/adr/README.md` — allocation rule + index row 0032.
  - `docs/adr/0032-two-tier-pipeline-and-process-amendments.md` — the ADR (number
    0032 allocated per the new rule; first non-self-allocated ADR).
- VERDICT: PASS — merge gate note: docs/config-only diff, reviewed via PR by Bertrand
  (stage 8 merge authority unchanged).
