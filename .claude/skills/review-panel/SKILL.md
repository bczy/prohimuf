---
name: review-panel
description: >
  Run muf's MANDATORY 4-reviewer code-review panel — the stage-6 merge gate — on a
  branch diff. Use this before merging ANY feature/refactor branch to main, or whenever
  someone asks to "run the review panel", "run code review before merge", "review this
  PR/branch", "is this mergeable", or "run the merge gate". It fans out four orthogonal
  reviewers in parallel (code-review high, bmad-code-review, bmad-review-edge-case-hunter,
  security-review) on `git diff origin/main...HEAD`, adversarially verifies every finding,
  and produces the senior-architect triage + integration sign-off in one pass — ending
  with a clear MERGE / NO-MERGE verdict. NOT for a small single-lane fix (that uses the
  one-reviewer fix lane). Owner: senior-architect (Winston). Requires the Task/Agent tool
  to spawn subagents.
---

# review-panel — the stage-6 merge gate

No branch merges to `main` without this. It packages the protocol in
`.claude/agents/COLLABORATION.md` §"code-review panel" so the gate runs the same way every
time: four orthogonal reviewers in parallel, adversarial verification, one triage pass that
IS the architect's integration review. A small single-lane already-gated fix uses the
**one-reviewer fix lane** instead — do not run the full panel for that.

## Step 1 — scope the diff

Establish the review surface and share it with every reviewer:

```
git fetch origin main --quiet
git diff --stat origin/main...HEAD
```

If the diff is empty or the branch is behind, stop and say so. Note whether the change is
player-visible (needs runtime evidence) or docs/config only (scope reviewers accordingly).
If the owning lane's stage-5 `simplify` pass left **PROPOSED** items (cuts it judged were
not its call), pass that list to reviewer A — they are candidate findings already scoped,
not settled decisions.

## Step 2 — fan out the four reviewers IN PARALLEL

Spawn **four subagents in a single message** (one Task/Agent call each) so they run
concurrently. Each applies a **different** review skill so the methods stay orthogonal —
never give two reviewers the same skill. Ready-to-use prompts: **`references/reviewer-prompts.md`**.

| Reviewer | Skill | Angle |
| --- | --- | --- |
| A | `code-review` (effort **high**) | correctness bugs, reuse, simplification, efficiency |
| B | `bmad-code-review` | BMAD adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor vs the story/ADR criteria) |
| C | `bmad-review-edge-case-hunter` | every branch / boundary condition of the diff |
| D | `security-review` | attacker-controlled surface (URL params, localStorage, asset paths, scripts) |

Each reviewer is **read-only** (spawn them without Write/Edit intent), reviews
`git diff origin/main...HEAD`, and reports findings as
`[BLOQUANT|MAJEUR|MINEUR|NIT] · file:line · CONFIRMED|PLAUSIBLE · one-line defect + concrete
failure scenario`. Tell each to **adversarially verify its own findings against the real
code** before reporting, and to state explicitly when nothing survives.

## Step 3 — adversarial verification

For any non-trivial finding a reviewer marked PLAUSIBLE (or that you doubt), have a skeptic
pass try to **refute it against the real code** — run the generator, the test, the lint,
read the actual lines. Only **CONFIRMED** findings are acted on. This is what stops
plausible-but-wrong findings from blocking a good merge or, worse, driving a bad fix.

## Step 4 — triage = the integration review (one pass, senior-architect)

Winston reads the full diff once and, in the same pass:

- **Triages** each CONFIRMED finding → prescribe a fix (to the **owning lane**, never
  implement feature code himself) or reject-with-reason.
- Delivers the **INTEGRATION REVIEW**: the boundary law (`src/game` no React/Three,
  `src/render` no rules, `src/hooks` the only bridge), cross-lane seams, dependency/deploy
  impact — integration and triage are ONE stage, not two serial reads.
- **Routes DOC findings** (ADR / bible / README / JSDoc realignments) to `tech-writer`.

## Step 5 — fixes, re-verify, re-run

The owning lane applies fixes; then `rtk tsc` + `rtk vitest` + `rtk lint` re-run. If the
diff changed **materially**, re-run the panel (bounded by the story's verify↔build cap).

## Step 6 — verdict, log, summarize

End with an explicit verdict and record it:

- **MERGE** — no unresolved CONFIRMED BLOQUANT/MAJEUR finding remains.
- **NO-MERGE** — at least one unresolved CONFIRMED BLOQUANT/MAJEUR; name it and the owning lane.

Log the outcome (findings → verdict → action) in the story's handoffs shard
(`docs/handoffs/story-<slug>.md`) and summarize it in the PR. **A PR with an unresolved
CONFIRMED BLOQUANT/MAJEUR finding must not be merged.**

## Output template

```
Panel — <branch> vs origin/main  ·  <N> files, <player-visible|docs/config>
Reviewers (parallel): code-review(high) · bmad-code-review · edge-case-hunter · security-review
CONFIRMED findings (most severe first):
  - [SEV] file:line — <defect> → prescribed: <fix> → owner: <lane>   (or: rejected — <reason>)
Integration review: boundary law <ok|violation: …> · seams <…> · deps/deploy <…>
DOC findings → tech-writer: <…/none>
Verdict: MERGE | NO-MERGE (<blocker + lane if NO-MERGE>)
Logged: docs/handoffs/story-<slug>.md · PR summary updated
```

## Guardrails

- Four **different** skills, in **parallel** (one message). Serial or duplicated skills defeat the panel.
- Reviewers are read-only; the owning lane applies fixes, not the reviewers or the triager.
- Never mark MERGE with an unresolved CONFIRMED BLOQUANT/MAJEUR.
- Full panel only. A single-lane already-gated fix belongs to the fix lane (one `code-review` high).
