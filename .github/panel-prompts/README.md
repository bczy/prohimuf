# Code-review panel — prompts

This directory holds the six prompts invoked by
`.github/workflows/code-review-panel.yml` to implement the mandatory merge
gate defined in ADR-0063 and `.claude/agents/COLLABORATION.md:206-233`, run
via Claude Code's subscription auth (`anthropics/claude-code-action@v1` +
`CLAUDE_CODE_OAUTH_TOKEN` — see ADR-0070).

## Files

| File                  | Role                                                 | Runs in job(s)               |
| --------------------- | ---------------------------------------------------- | ---------------------------- |
| `_harness.md`         | Shared transport contract, prepended to every prompt | all reviewer jobs + `verify` |
| `code-review.md`      | Correctness / simplification / efficiency            | `code-review`                |
| `edge-case-hunter.md` | Every branch/boundary of the diff                    | `edge-case-hunter`           |
| `bmad-review.md`      | Blind Hunter / Edge Case Hunter / Acceptance Auditor | `bmad-review`                |
| `security-review.md`  | Attacker-controlled surface                          | `security-review`            |
| `skeptic.md`          | Adversarial verification of findings                 | `verify`                     |

Each prompt is versioned. A change to a prompt is a diff that goes through
the panel like any other change; owner for wording is `tech-writer`,
owner for content is `senior-architect`.

## I/O contract

**Input** (all reviewer jobs — `code-review`, `edge-case-hunter`,
`bmad-review`, `security-review`): the prompt text is `_harness.md` +
`<role>.md`, passed to `claude-code-action` as its `prompt` input. The
repository is checked out at the PR's head commit alongside a `panel-input/`
artifact (`pr.json` — title/body, `diff.patch` — unified diff
`origin/main...HEAD`, `files.txt` — name-status listing); the agent has
`Read`/`Glob`/`Grep` tools to explore the checkout for grounding, per
`_harness.md` §1.

**Output** (all reviewer jobs) — structured output enforced via
`claude_args: --json-schema`, not stdout text:

```json
{
  "reviewed_files": ["src/game/systems/foo.ts"],
  "findings": [
    {
      "severity": "BLOQUANT" | "MAJEUR" | "MINEUR",
      "file": "src/game/systems/foo.ts",
      "line": 42,
      "title": "short title",
      "scenario": "concrete failure scenario in one paragraph",
      "suggested_fix": "one-sentence fix path (optional)"
    }
  ]
}
```

`reviewed_files` is the anti-hollow-review signal: `scripts/panel-write-findings.mjs`
fails the job (DEGRADED) if it's empty while the diff touched files, and logs
— without enforcing — any changed file missing from it.

**Skeptic job (`verify`)** is given every reviewer's findings, each tagged
with a small integer `id` assigned before the call
(`scripts/panel-write-confirmed.mjs prepare`), and answers with structured
output `{ "verdicts": [{ "id", "confirmed", "refutation"? }] }` — the id and
verdict only, never the full finding, so it can flip a verdict but cannot
rewrite a finding's severity/file/title. The harness
(`scripts/lib/panelFindings.mjs#mergeConfirmations`) merges verdicts back
onto the ORIGINAL finding objects; any `id` the skeptic doesn't answer is
confirmed by default. Only `confirmed: true` findings reach the triage job.

**Triage job** does not use an LLM; it consumes the confirmed findings and:

1. Posts each as a PR review comment (via `gh api`).
2. Publishes a check run named `panel-verdict` with conclusion:
   - `neutral`, title `SKIPPED — <reason>`, if the panel never started
     (disabled, or the OAuth token secret is absent) — non-blocking.
   - `success` (`PASS`) if 0 CONFIRMED findings.
   - `neutral` (`CONDITIONAL`) if the highest CONFIRMED severity is `MAJEUR`.
   - `failure` — `FAIL` if any CONFIRMED finding is `BLOQUANT`, or
     `DEGRADED` if any panel job failed to complete (checked first: an
     incomplete panel's tally is not authoritative).
3. Writes a summary comment on the PR.

## Fix-lane bypass

If the PR carries the `fix-lane` label, only `code-review` runs; the
skeptic and triage jobs still run but consume a single-source input.
See ADR-0032.

## Local pre-check

The Claude Code Skill `/review-panel` fan-outs equivalent local Task
calls for fast feedback. Its verdict is advisory; the CI verdict is
merge-gating. See ADR-0063 §5.
