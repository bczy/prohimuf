# 0061 — tech-writer active in verification loops (DOCS-PLAN, DOC GATE, coherence sweep)

- **Status:** Accepted
- **Date:** 2026-07-23
- **Amends:** [ADR-0018](./0018-staffed-production-pipeline.md) (staffed pipeline
  roster & stages), [ADR-0032](./0032-two-tier-pipeline-and-process-amendments.md)
  (two-tier pipeline & fix-lane criteria).

## Context

Bertrand flagged (2026-07-23) two coupled symptoms:

1. **Doc drift accumulating silently.** `docs/index.md` still bears
   `Generated: 2026-04-11` and does not list AGENTS.md, CLAUDE.md, or
   `.github/copilot-instructions.md` (the vendor-neutral agent orientation split
   shipped commit 502ecd2, 2026-07). Similar staleness on the ADR index and
   scattered cross-refs.
2. **The `tech-writer` (Otis) is only invoked reactively.** In
   `.claude/agents/COLLABORATION.md` (pre-amendment), Otis appears once, as the
   routing target for DOC findings AFTER `senior-architect` triages the code-review
   panel. He has no first-class presence in DESIGN, TECH PLAN, VERIFY, or ACCEPT.

The two symptoms are one problem: the pipeline has no proactive checkpoint that
asks "which docs will this story touch, and did we touch them?". Drift is only
caught at review triage, several merges after the fact — and the fix-lane
criteria don't forbid a "small fix" from mutating a gated doc in passing.

## Decision

Amend the production pipeline so `tech-writer` is a proactive lane at three
existing stages, plus tighten the fix-lane criteria. Protocol source of truth:
`.claude/agents/COLLABORATION.md`.

1. **Stage 3 — DOCS-PLAN (proactive).** In parallel with `senior-architect`'s
   TECH PLAN, `tech-writer` lists the docs the story will touch
   (`architecture.md §X`, `ADR-00NN`, `docs/index.md`, JSDoc in `src/**`), flags
   a missing ADR allocation if the story is ADR-worthy, and logs it as a
   single-line `DOCS-PLAN: <paths>` entry in the story's handoffs shard. Dev
   lanes read the DOCS-PLAN and own its execution.
2. **Stage 5 — DOC GATE (funnelled into qa-lead's QUALITY GATE).**
   `tech-writer` verifies the docs listed at stage 3 have been touched,
   cross-refs resolve, `scripts/gen-adr-index.mjs` has run if an ADR was
   added/moved, and `docs/index.md` still parses. Verdict funnels into the
   quality gate at the same level as `game-designer` playtest, `ux-designer`
   surface review, and `gpu-specialist` PERF verdict. FAIL routes to the owning
   dev lane, not to `tech-writer` (he doesn't touch logic).
3. **Stage 7 — Doc coherence sweep (post-acceptance).** After `pm`'s ACCEPT,
   `tech-writer` runs a sweep on the closed story: the touched docs agree with
   each other and with the merged code. Residual gaps open a drift ticket —
   fix lane if wording-only, full pipeline if content. `producer` records the
   sweep verdict on the story shard.
4. **Fix-lane criterion — "No documentation surface".** A change qualifies for
   the fix lane only if it does NOT modify gated doc content (ADR, art/audio
   bibles, README, `architecture.md`, `game-design/**` specs). JSDoc wording on
   the same lane remains fine. Any fix that must update a gated doc escalates
   to the full pipeline so DOCS-PLAN and DOC GATE cover it.
5. **Producer tracking.** `producer` flags any story whose diff touches doc
   paths without a matching tech-writer log entry (`DOCS-PLAN` at stage 3, DOC
   GATE at stage 5, sweep at stage 7). Unlogged tech-writer hand-off = drift in
   the making.

Otis's iron rule is unchanged: he decides nothing, drafts and realigns. The
DOC GATE is a coverage verdict ("the plan ran"), not a content verdict.

## Drivers

- **Attribution of drift.** Currently no agent is on the hook for "did the docs
  keep up?" outside of a code-review triage. Making Otis's presence proactive
  moves the catch upstream by a full cycle.
- **Compatibility with the two-tier rule (ADR-0032).** The fix-lane criteria
  already exclude architecture and asset surfaces. Adding "documentation
  surface" closes the last silent-drift channel without inflating fix-lane
  ceremony (JSDoc wording on the owning lane is still allowed).
- **No new stage.** DOCS-PLAN piggybacks stage 3, DOC GATE piggybacks the
  stage-5 funnel, coherence sweep piggybacks stage 7. No serialisation cost:
  Otis runs in parallel with architect at stage 3 and with the other stage-5
  verdicts.

## Consequences

- **`.claude/agents/COLLABORATION.md`** is amended in the same PR: roster row
  for `tech-writer`, stage-3/5/7 blocks, rule #4 (DOCS-PLAN line in shard),
  fix-lane criterion. Diagram `docs/diagrams/agent-workflows.md` will be
  updated in a follow-up story (drift ticket).
- **`.claude/agents/tech-writer.md`** fiche is amended to state the proactive
  role at stages 3/5/7.
- **`producer`** carries one new check per story: "tech-writer log entries
  present when the diff touches docs?". No new tool.
- **First application:** this ADR is landed together with the drift-catch-up
  batch (Sujet 1 in the originating request) — the workflow dogfoods itself
  on the very drift it is designed to prevent from recurring.
- **What this does NOT do:** no branch protection change, no new CI gate, no
  agent added or removed. Enforcement remains social + producer-driven, in
  line with ADR-0018/0032.

## Alternatives considered

- **Only add stage 5 DOC GATE.** Rejected: without a stage-3 DOCS-PLAN, the
  gate has nothing to verify against. It would degenerate into "docs look
  ok" — precisely the reactive posture we want to leave.
- **Block stage 4 (BUILD) on tech-writer sign-off.** Rejected: serialises dev
  lanes for zero information gain — the doc work happens on the same branch
  as the code and can be caught at stage 5.
- **Require `tech-writer` as a 5th code-review reviewer.** Rejected: the
  code-review panel is about the diff's correctness, not its documentation
  coverage. Overloading it would blur its scope; the DOC GATE at stage 5 is
  the right specialised checkpoint.
