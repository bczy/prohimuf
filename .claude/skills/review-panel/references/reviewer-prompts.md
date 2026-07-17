# Reviewer prompts — ready-to-use

Spawn these as **four subagents in one message** (parallel). Fill `<BRANCH>` and paste a
one-paragraph `<DIFF SUMMARY>` (what the change does + whether it's player-visible or
docs/config) so each reviewer scopes its effort correctly. Keep each reviewer **read-only**;
their final message IS the report.

Shared preamble (prepend to each):

> You are one reviewer in muf's mandatory code-review panel for `<BRANCH>` (cwd repo root).
> Review the branch diff: `git diff origin/main...HEAD`. Context: `<DIFF SUMMARY>`.
> Adversarially verify each finding against the real code before reporting (run the
> generator/test/lint, read the actual lines). Report ONLY verified findings, most severe
> first: `[BLOQUANT|MAJEUR|MINEUR|NIT] · file:line · CONFIRMED|PLAUSIBLE · one-line defect
> + concrete failure scenario`. State explicitly if nothing survives. Do NOT edit files.

## Reviewer A — `code-review` (effort high)

> Run the `code-review` skill at HIGH effort on the diff. Focus on correctness bugs first,
> then reuse/simplification/efficiency. Concentrate on the executable code in the diff;
> for prose/config changes, check only for statements that are factually wrong about the
> code they describe.

## Reviewer B — `bmad-code-review`

> Run the `bmad-code-review` skill on the diff. Apply the BMAD adversarial layers — Blind
> Hunter (does it do what it claims), Edge Case Hunter, Acceptance Auditor (vs the story's
> acceptance criteria and any ADR the diff cites). Check the diff delivers exactly what its
> story/ADR promises, and internal consistency across the changed files.

## Reviewer C — `bmad-review-edge-case-hunter`

> Run the `bmad-review-edge-case-hunter` skill on the diff. Walk every branch and boundary
> condition of the changed executable code: empty/missing inputs, off-by-one, unguarded
> dict/array access, fallback paths, layout/overflow math, and any freshness/CI-gate
> contract the change affects. Verify each against a live run where useful.

## Reviewer D — `security-review`

> Run the `security-review` skill on the diff. Assess attacker-controlled surface: URL
> params, localStorage, asset/file paths, script inputs, and — for muf specifically — any
> new tool grant / dependency / external URL introduced (least-privilege, typosquat,
> secret exposure, injection). Keep it proportionate to the diff's real surface.

## Triage note (senior-architect, after all four return)

Do NOT re-review from scratch — read the four reports, verify any PLAUSIBLE finding you
doubt, then triage in one pass that also serves as the integration review (boundary law,
seams, deps/deploy). Route DOC findings to `tech-writer`. End with MERGE / NO-MERGE.
