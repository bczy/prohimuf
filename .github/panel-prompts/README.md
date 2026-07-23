# Code-review panel — prompts

This directory holds the five system prompts invoked by
`.github/workflows/code-review-panel.yml` to implement the mandatory merge
gate defined in ADR-0063 and `.claude/agents/COLLABORATION.md:206-233`.

## Files

| File                  | Role                                                 | Runs in job        |
| --------------------- | ---------------------------------------------------- | ------------------ |
| `code-review.md`      | Correctness / simplification / efficiency            | `code-review`      |
| `edge-case-hunter.md` | Every branch/boundary of the diff                    | `edge-case-hunter` |
| `bmad-review.md`      | Blind Hunter / Edge Case Hunter / Acceptance Auditor | `bmad-review`      |
| `security-review.md`  | Attacker-controlled surface                          | `security-review`  |
| `skeptic.md`          | Adversarial verification of findings                 | `verify`           |

Each prompt is versioned. A change to a prompt is a diff that goes through
the panel like any other change; owner for wording is `tech-writer`,
owner for content is `senior-architect`.

## I/O contract

**Input** (all reviewer jobs — `code-review`, `edge-case-hunter`,
`bmad-review`, `security-review`):

```
<system_prompt>
   <contents of the .md file for this job>
</system_prompt>
<user_prompt>
   PR title: <string>
   PR description: <markdown>
   Base branch: main
   Head SHA: <sha>
   Changed files:
     - path/one.ts (+12/-3)
     - path/two.md (+40/-1)
   Unified diff:
   <git diff origin/main...HEAD>
   Story context (if handoff shard exists):
   <contents of docs/handoffs/<story>.md>
</user_prompt>
```

**Output** (all reviewer jobs) — a JSON array on stdout:

```json
[
  {
    "severity": "BLOQUANT" | "MAJEUR" | "MINEUR",
    "file": "src/game/systems/foo.ts",
    "line": 42,
    "title": "short title",
    "scenario": "concrete failure scenario in one paragraph",
    "suggested_fix": "one-sentence fix path (optional)"
  }
]
```

**Skeptic job (`verify`)** takes the concatenation of the four reviewer
JSON arrays and outputs the same schema plus a top-level
`"confirmed": true | false` field per finding. Only `confirmed: true`
findings reach the triage job.

**Triage job** does not use an LLM; it consumes the confirmed findings and:

1. Posts each as a PR review comment (via `gh api`).
2. Publishes a check run named `panel-verdict` with conclusion:
   - `PASS` if 0 CONFIRMED findings.
   - `CONDITIONAL` if all CONFIRMED findings are `MINEUR`.
   - `FAIL` if any CONFIRMED finding is `BLOQUANT` or `MAJEUR`.
3. Writes a summary comment on the PR.

## Fix-lane bypass

If the PR carries the `fix-lane` label, only `code-review` runs; the
skeptic and triage jobs still run but consume a single-source input.
See ADR-0032.

## Local pre-check

The Claude Code Skill `/review-panel` fan-outs equivalent local Task
calls for fast feedback. Its verdict is advisory; the CI verdict is
merge-gating. See ADR-0063 §5.
