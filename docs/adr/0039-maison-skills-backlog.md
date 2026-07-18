# 0039 — "Maison" skills backlog: repeated procedures to package as skills

- **Status:** Accepted (2026-07-18)
- **Date:** 2026-07-17
- **Number:** 0039, allocated directly at Bertrand's request alongside ADR-0038
  (out-of-band, re-checked against the index). Normal flow allocates via `producer`.

## Context

The crew leans well on installed skills — BMAD (`bmad-*`) for process, plus the project
skills `verify`, `sprite-hole-audit` and now `flux-prompt`. But several **project-specific
procedures are still executed by hand every time**, re-derived from prose in agent files,
`HARNESS.md`, or ADRs. Each is a good skill candidate: a repeated, well-bounded procedure
with a clear trigger and owner. This ADR does not build them — it **records the backlog**
so the work can be opened as normal stories and prioritised, rather than lost.

Selection criteria for "is this a skill?": (a) done more than a few times, (b) a stable
procedure, not a judgement call, (c) a single clear owner lane, (d) reused across
sessions. Anything failing these stays prose guidance.

## Decision

`flux-prompt` shipped first (ADR-0038 / PR #78) as the method-packaging cut. The remaining
candidates below are tracked, not built; `pm` + `producer` sequence them, priority is a
starting suggestion, and building a skill is itself a small pipeline story. `Status` ticks
what has shipped so the backlog cannot rot silently.

### Process & orchestration (highest ROI — currently redone by hand each PR)

| Skill          | Owner lane           | Trigger                                                 | What it packages                                                                                                                                                                                                                  | Priority | Status              |
| -------------- | -------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| `review-panel` | `senior-architect`   | Before any merge (stage 6)                              | Fan out the 4 mandated reviewers (`code-review` high, `bmad-code-review`, `bmad-review-edge-case-hunter`, `security-review`) in parallel on `git diff origin/main...HEAD`, adversarially verify each finding, produce the triage. | High     | ✅ shipped (PR #78) |
| `crew-sync`    | `dev-tooling-assets` | Any edit to `.claude/agents/**` or the bitmap generator | Regenerate singles + poster (`muf-crew-bitmap.py`), re-pin the freshness manifest (`check-agents-infographic.mjs --update`), verify `FRESH`.                                                                                      | High     | ✅ shipped (PR #78) |
| `open-pr`      | any lane             | After a push to `claude/**`                             | Compute the preview slug, fill `.github/pull_request_template.md`, open the **draft** PR, subscribe to activity.                                                                                                                  | Medium   | backlog             |
| `fix-lane`     | dev lane             | Small single-lane already-gated diff                    | Run the two-tier fix path: tsc/vitest/lint → one `code-review` (high) → one line in `docs/handoffs/fixes.md`; escalate to the full pipeline the moment a criterion breaks.                                                        | Medium   | backlog             |

### Authoring, tracking & content

| Skill          | Owner lane                            | Trigger                                    | What it packages                                                                                                                                                               | Priority | Status              |
| -------------- | ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------- |
| `flux-prompt`  | `concept-artist`                      | New/failed asset family in `levelArt.json` | FLUX-aware prompt skeleton: silhouette-first, positively described, negative-free, house-style checklist, hand-off to the `lead-art` prompt gate.                              | High     | ✅ shipped (PR #78) |
| `adr-new`      | `tech-writer` / `producer`            | A decided outcome needs an ADR             | Allocate + re-check the next `NNNN` (the rule-#9 collision guard), scaffold the Nygard template, append the index row. Kills the recurring duplicate-number bug (two 0020s).   | High     | ✅ shipped (PR #78) |
| `handoff-log`  | any lane                              | Taking or returning a story                | Write a normalised entry into the story's `docs/handoffs/` shard (start / finish + File List / `VERDICT: PASS\|FAIL`), keep `docs/agent-handoffs.md` honest.                   | Medium   | backlog             |
| `story-open`   | `producer`                            | Opening a multi-lane story                 | Open the tracking: `docs/handoffs/` shard, sprint entry, ADR-number allocation (rule #9). Upstream complement of `handoff-log`.                                                | Medium   | backlog             |
| `levelart-add` | `dev-tooling-assets`                  | Adding a level                             | One `levelArt.json` entry + the matching gameplay map, per `HARNESS.md`, wired so `rosterAssetCoverage` stays green.                                                           | Medium   | backlog             |
| `enemy-new`    | `dev-tooling-assets` + `dev-gameplay` | A new enemy type                           | `enemies` entry in `levelArt.json` (prompt + flipbook frames) + bestiary entry + state-machine wiring + roster-coverage test. Today split across three lanes and several ADRs. | Medium   | backlog             |
| `asset-gen`    | `dev-tooling-assets`                  | Assets ready to generate                   | Marker-push dispatch → render farm, bounded retries, PNG retrieval, hand-off to the `lead-art` gate. Wraps the Pollinations/FLUX flow + `HARNESS.md`.                          | Medium   | backlog             |

### Gate-runners (mechanical checklist ONLY — the verdict stays with the gate owner)

| Skill                 | Owner lane                   | Trigger                                        | What it packages                                                                                                                                    | Priority | Status  |
| --------------------- | ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `perf-protocol`       | `gpu-specialist`             | Perf-sensitive change reaches VERIFY           | Emit a ready-to-run on-target profiling protocol + the `DEFERRED-ON-TARGET` tracking stub for `producer` to chase (ADR-0037).                       | Medium   | backlog |
| `a11y-audit`          | `ux-designer`                | Built screens reach VERIFY                     | Run the objective WCAG 2.2 / touch-target / reduced-motion / aria checks, output a ticked checklist as a pre-verdict; the UX PASS/FAIL stays human. | Medium   | backlog |
| `audio-licence-check` | `sound-designer` / `qa-lead` | An audio asset lands                           | Verify per-file licence + attribution (`docs/qa/plan-story-audio-licence-attribution.md`), fail if a source is uncredited.                          | Medium   | backlog |
| `design-gate-check`   | `lead-game-designer`         | A design spec reaches the gate                 | Verify the objective part of a spec (cahier-des-charges scope, core loop, verifiability) before the human PASS/FAIL.                                | Low      | backlog |
| `references-check`    | `tech-writer`                | PR touches `docs/references/**` or agent files | Lint the curated library: dead links, missing one-line context, missing licence note on asset sources.                                              | Low      | backlog |

## What must NOT become a skill

Taste calls and pure gate verdicts — `pm` acceptance, `lead-art` PASS/FAIL on craft, the
"human ears" audio verdict, design arbitration. These are judgements, not procedures;
freezing them into a skill would make them rigid and wrong. The gate-runners above hand the
gate owner a mechanical checklist, **never** the verdict.

## Consequences

- Building a skill is itself a small story through the normal pipeline (design-light,
  single dev/tooling lane, one code-review). The `skill-creator` skill scaffolds them.
- The highest-ROI cluster is process/orchestration (`review-panel`, `crew-sync`,
  `open-pr`, `fix-lane`): these retire work the main session redoes by hand every PR.
- Packaging `adr-new`, `handoff-log` and `story-open` also hardens known process failure
  modes (duplicate ADR numbers; un-logged hand-offs = "didn't happen") beyond prose.
- Left unbuilt, these stay as prose in agent files and `HARNESS.md` — functional but
  re-derived each time, which is exactly the cost this backlog exists to retire.
- Superseding note: as each skill ships, tick its `Status` here (as `flux-prompt` is), or
  supersede this ADR with a "skills shipped" record.
