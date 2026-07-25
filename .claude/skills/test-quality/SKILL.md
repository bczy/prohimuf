---
name: test-quality
description: >
  Audit the tests a branch ADDED, by breaking the code on purpose and checking they go
  red. Green says the suite ran; only a deliberate mutation says the suite would have
  caught the bug. Use it at stage 5 (VERIFY) on any diff that adds or changes tests,
  before the QUALITY GATE — or when someone asks "are these tests any good", "do the
  tests actually test anything", "coverage is up but is it real", "ces tests servent à
  quoi". Probes are throwaway: every mutation is reverted immediately, nothing it writes
  ever reaches a commit. Owner: `qa-lead` (Inès) — she runs the probes and verdicts;
  the owning dev lane writes any test the audit finds missing.
---

# test-quality — do these tests fail when they should?

A test that cannot fail is worse than no test: it costs runtime and buys false
confidence, and it makes coverage lie. This skill spends a few minutes proving the new
tests bite, so `qa-lead`'s QUALITY GATE is a verdict about behaviour rather than about a
green exit code.

Compatible with Inès's iron rule: the mutations below are **probes on a scratch tree**,
not authorship. She writes no production code and no test implementation — she breaks
code temporarily, reads what happens, reverts, and reports.

## Step 0 — clean tree, or stop

```bash
git status --porcelain          # MUST be empty — probes need a clean revert point
git diff --name-only origin/main...HEAD | grep -E '(__tests__|\.test\.|scripts/e2e)'
```

An uncommitted work-in-progress makes `git checkout --` dangerous: commit or stash first.
No test files in the diff → report that instead (a behavioural change with zero test is
itself the finding, routed to the owning lane).

## Step 1 — read the new tests for the cheap smells first

No probe needed to see these:

| Smell                  | What it looks like                                                     |
| ---------------------- | ---------------------------------------------------------------------- |
| Tautology              | asserts a literal it just computed, or `expect(x).toBe(x)`              |
| Mock asserting a mock  | the only assertion is that a stub was called with what the test passed  |
| Implementation mirror  | asserts internal shape/order that no player or caller depends on        |
| No boundary            | only the happy path: no zero, max, empty roster, timer edge, reload     |
| Snapshot as a verdict  | a snapshot that will be blessed on the next change without being read   |
| Absent device fork     | player-visible behaviour tested on one device class only (ADR-0003)     |
| Silent async           | awaits nothing, so the assertion runs before the behaviour              |

## Step 2 — mutate, run, revert (the actual probe)

For each behaviour the diff claims to cover, break its **source** in one small way and
check the suite goes red for the right reason. Do them **one at a time**:

```bash
#  edit the source line (invert a comparison, off-by-one a bound,
#  return early, drop a clamp, neutralise a state transition)
rtk vitest <path/to/the.test.ts>       # expect RED, and read the failure message
git checkout -- <mutated file> || git restore --source=HEAD <mutated file>  # ALWAYS, immediately, before the next probe
```

High-value mutations in muf: flip a `<` to `<=` on a timer/score/ammo bound; make a
system return its input unchanged; remove a state transition guard in `src/game/state/**`;
return a constant from a pure system; skip a clamp.

Verdict per probe:

- **BITES** — red, and the message names the behaviour. The test is doing its job.
- **SURVIVES** — still green: the mutation is untested. This is a finding.
- **NOISY** — red, but the message is about a mock, a snapshot or a shape rather than the
  behaviour. The test passes for the wrong reason; treat as a weak test.

Bounded: probe the behaviours the story is about — **max ~8 probes**, not every line.
This is a spot-check for bite, not a mutation-testing campaign.

## Step 3 — coverage as a secondary signal only

```bash
yarn test:coverage        # thresholds: 80% on src/game
```

Coverage that rose while probes SURVIVE is the exact lie this skill exists to expose —
say so in those words. Never accept a coverage number as evidence on its own.

## Step 4 — verdict into the QUALITY GATE

```
Test quality — <branch> · <N> test files in diff · <N> probes
BITES:    <test> ← mutation <what was broken>              (× per probe)
SURVIVES: <behaviour> — untested → missing case: <what to add> → owner: <dev lane>
NOISY:    <test> — passes for the wrong reason: <why> → <fix>
Smells:   <tautology/mock-asserting-mock/… + file:line, or none>
Coverage: <src/game %> (secondary signal)
Tree restored: git status clean ✓
Verdict → QUALITY GATE: PASS | FAIL (<the untested behaviour that blocks>)
```

FAIL names the behaviour and routes to the owning dev lane, per stage 5. Log it in
`docs/qa/plan-story-<slug>.md`; a bug that escaped a gate becomes a regression spec there
(see `root-cause` step 5).

## Guardrails

- **Revert every mutation immediately** — `git status` must be clean when you finish, and
  it goes in the report. A committed probe is a catastrophe, not an oversight.
- Probes are **source** mutations, never test edits: weakening a test to see it fail proves
  nothing.
- Inès verdicts and specs; the owning dev lane writes the missing tests. She never fixes
  the suite herself.
- SURVIVES is not automatically a FAIL — deliberately uncovered surface is legitimate if
  the test plan says so and says why. Undocumented, it is a finding.
- Do not run this on a diff with no behavioural change (docs, config, prompts).
