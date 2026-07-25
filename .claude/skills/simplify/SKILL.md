---
name: simplify
description: >
  Degrease a branch diff BEFORE it reaches the stage-6 review panel: hunt the code the
  change added but does not need (speculative abstraction, single-use indirection, dead
  branches for impossible states, duplicated constants, re-implemented helpers), apply
  only the cuts that stay green, and hand the judgement calls to the owning lane. Use it
  at the end of stage 5 (VERIFY), once tsc/vitest/lint are green and before
  `review-panel` / pushing for review — or when someone asks to "simplify this", "clean
  up before review", "is this over-engineered", "dégraisser le diff", "réduire le diff".
  Scope is strictly `git diff origin/main...HEAD`: it never refactors pre-existing code
  and never changes behaviour. Owner: the owning dev lane (`dev-gameplay` /
  `dev-r3f-render` / `dev-tooling-assets`). It does NOT replace the review panel — it
  makes the panel read less.
---

# simplify — the pre-review degreasing pass

Simplification findings that surface in stage 6 are expensive: they arrive mixed with
real bugs, and every cut re-opens the panel. This skill moves that pass **before** the
gate, where the diff is still the author's. Karpathy §2 (simplicity first) and §3
(surgical changes) are the doctrine; this is the procedure.

**Non-goal:** it is not a refactor licence. Every line you remove must be a line **this
branch added**.

## Step 0 — preconditions (stop if unmet)

```bash
git fetch origin main --quiet
git diff --stat origin/main...HEAD
```

- Baseline must be **green already** (`rtk tsc` + `rtk vitest` + `rtk lint`). Simplifying
  a red branch hides which change broke what.
- Docs/config-only diff, or under ~30 changed lines of code → **skip**, say so, stop.
- Record the baseline line count: it is the before/after evidence.

## Step 1 — read the diff for weight, not for bugs

Read `git diff origin/main...HEAD` once, hunting only these. Bugs are the panel's job —
if you spot one, note it for the lane, do not fix it here.

| Smell                       | Concretely, in muf                                                             |
| --------------------------- | ------------------------------------------------------------------------------ |
| Speculative abstraction     | interface/factory/strategy with exactly one implementation and one caller       |
| Single-use indirection      | a helper or wrapper called once, that reads better inlined                      |
| Unused flexibility          | options bag, config flag or optional param no caller ever sets non-default      |
| Impossible-state defence    | a guard for a state the type system already forbids (strict TS, no `any`)       |
| Duplicated tuning           | a constant re-declared instead of read from the existing tuning/config source   |
| Re-implemented helper       | logic that already exists in `src/game/systems/**` or an existing util          |
| Render-side ceremony        | `useMemo`/`useState`/`useEffect` around a value that is plain derived state     |
| Orphans **you** created     | imports/vars/exports this branch made unused (only yours — never pre-existing)  |
| Test bloat                  | tests asserting implementation details rather than the behaviour of the system  |
| Dead prose                  | comments restating the code, or describing a version of it that no longer exists |

Ask, per hunk: **would a senior engineer call this overcomplicated?** If the answer needs
a paragraph of justification, it is a PROPOSED item, not an APPLIED one.

## Step 2 — sort each candidate into two buckets

**APPLY** — mechanical, behaviour-preserving, provable by the existing suite:
inlining a single-use helper, deleting an unused param/flag/export the branch added,
collapsing an interface with one impl, dropping an impossible guard, reusing an existing
constant or helper, removing a redundant comment, cutting an orphan import.

**PROPOSE** — anything that needs a judgement the lane owns. Never applied here:
anything observable to the player (game feel, timing, visuals, audio), a design/tuning
value (belongs to `game-designer`), moving code across the `src/game` ↔ `src/hooks` ↔
`src/render` boundary or changing a public module contract (belongs to
`senior-architect`, ADR territory), deleting a test, wording of in-game text
(`narrative-designer`), or anything you would describe as "while I was there".

## Step 3 — apply in small batches, prove green each time

Batch by theme (one concern at a time), and after **each** batch:

```bash
rtk tsc && rtk vitest && rtk lint      # fallback: yarn typecheck && yarn test && yarn lint
```

Red at any point → **revert that batch**, move the item to REVERTED with the failure as
its reason. Do not chase a fix: a cut that needs a fix was never a safe cut.
Player-visible surface touched despite the rule → re-run `verify` for runtime evidence.

Bounded: **one pass, max 3 batches**. If you still see weight after that, the rest is
PROPOSED — the diff is telling you it needs a design call, not more trimming.

## Step 4 — report, log, hand back

```
Simplify — <branch>  ·  <N> files, <before> → <after> changed lines (−<X>)
APPLIED (green: tsc/vitest/lint <+ verify>):
  - file:line — <smell> → <cut>            (× per item, grouped by batch)
PROPOSED (needs the owning lane / a gate):
  - file:line — <smell> → <suggestion> → owner: <lane>  · why not applied: <reason>
REVERTED: <item + what went red / none>
Bugs spotted (NOT fixed — for the panel/lane): <… / none>
Ready for: review-panel
```

Log the APPLIED/PROPOSED split in the story's shard (`docs/handoffs/story-<slug>.md`);
on the fix lane, one line in `docs/handoffs/fixes.md`. PROPOSED items that survive are
raised in the panel by the reviewers — that is the correct place for them.

## Guardrails

- **Diff-scoped, always.** Pre-existing dead code is mentioned, never deleted (§3).
- **Zero behaviour change.** If the tests cannot prove it, it is PROPOSED.
- Never delete or weaken a test to make a cut fit.
- Never cross the boundary law to simplify — that is an architecture decision, not a cut.
- This runs **before** the panel and replaces none of it; a PASS here is not a gate.
- Smaller is the goal, clever is not: if a cut makes the code shorter and harder to
  read, it is not a simplification.
