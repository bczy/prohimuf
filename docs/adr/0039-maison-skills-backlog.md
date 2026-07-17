# 0039 — "Maison" skills backlog: repeated procedures to package as skills

- **Status:** Proposed
- **Date:** 2026-07-17
- **Number:** 0039, allocated directly at Bertrand's request alongside ADR-0038
  (out-of-band, re-checked against the index). Normal flow allocates via `producer`.

## Context

The crew leans well on installed skills — BMAD (`bmad-*`) for process, plus the two
project skills `verify` and `sprite-hole-audit`. But several **project-specific
procedures are still executed by hand every time**, re-derived from prose in agent files,
`HARNESS.md`, or ADRs. Each is a good skill candidate: a repeated, well-bounded procedure
with a clear trigger and owner. This ADR does not build them — it **records the backlog**
so the work can be opened as normal stories and prioritised, rather than lost.

Selection criteria for "is this a skill?": (a) done more than a few times, (b) a stable
procedure, not a judgement call, (c) a single clear owner lane, (d) reused across
sessions. Anything failing these stays prose guidance.

## Decision

Track the following candidate skills. Priority is a starting suggestion, not a commitment;
`pm` + `producer` sequence them. None is a merge blocker for ADR-0038.

| Skill (proposed name) | Owner lane                 | Trigger                                        | What it packages                                                                                                                                                             | Priority |
| --------------------- | -------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `flux-prompt`         | `concept-artist`           | New/failed asset family in `levelArt.json`     | FLUX-aware prompt skeleton: silhouette-first, positively described, negative-free, house-style checklist, hand-off note to the `lead-art` prompt gate.                       | High     |
| `adr-new`             | `tech-writer` / `producer` | A decided outcome needs an ADR                 | Allocate + re-check the next `NNNN` (the rule-#9 collision guard), scaffold the Nygard template, append the index row. Kills the recurring duplicate-number bug (two 0020s). | High     |
| `handoff-log`         | any lane                   | Taking or returning a story                    | Write a normalised entry into the story's `docs/handoffs/` shard (start / finish + File List / `VERDICT: PASS\|FAIL`), keep `docs/agent-handoffs.md` index honest.           | Medium   |
| `levelart-add`        | `dev-tooling-assets`       | Adding a level                                 | One `levelArt.json` entry + the matching gameplay map, per `HARNESS.md`, wired so `rosterAssetCoverage` stays green.                                                         | Medium   |
| `perf-protocol`       | `gpu-specialist`           | Perf-sensitive change reaches VERIFY           | Emit a ready-to-run on-target profiling protocol + the `DEFERRED-ON-TARGET` tracking stub for `producer` to chase (ADR-0037).                                                | Medium   |
| `references-check`    | `tech-writer`              | PR touches `docs/references/**` or agent files | Lint the curated library: dead links, missing one-line context, missing licence note on asset sources.                                                                       | Low      |

## Consequences

- Building a skill is itself a small story through the normal pipeline (design-light,
  single dev/tooling lane, one code-review). The `skill-creator` skill is available to
  scaffold them.
- Packaging `adr-new` and `handoff-log` also hardens two known process failure modes
  (duplicate ADR numbers; un-logged hand-offs = "didn't happen") beyond prose reminders.
- Left unbuilt, these stay as prose in agent files and `HARNESS.md` — functional but
  re-derived each time, which is exactly the cost this backlog exists to retire.
- Superseding note: as each skill ships, tick it here or supersede this ADR with a
  "skills shipped" record so the backlog can't rot silently.
