---
name: fix-lane
description: >
  Run muf's two-tier FIX LANE end to end on a small single-lane change: prove the five
  criteria hold, implement, verify, get ONE `code-review` (high) reviewer, and log the
  cycle as one line in docs/handoffs/fixes.md. Use it for a bug fix, a polish tweak or a
  copy-size adjustment on already-gated behaviour — or when someone says "petit fix",
  "quick fix", "c'est un one-liner", "pas besoin du pipeline complet", "fix lane this".
  Its first job is honest tiering: it ESCALATES to the full pipeline the moment a
  criterion breaks, so the cheap tier never becomes a way to smuggle a feature past the
  gates. Owner: the owning dev lane; `producer` (Marion) records the tier and challenges
  abuse. NOT for a multi-lane change, a design/asset surface, or anything ADR-worthy —
  that is the full pipeline and `review-panel`.
---

# fix-lane — the cheap tier, honestly applied

The full pipeline exists for FEATURES. Paying it on a one-line bug fix is waste; bending
it silently is worse. This skill makes the two-tier rule
(`.claude/agents/COLLABORATION.md` §fix lane) mechanical, including the part everyone
skips — **the escalation when the fix turns out not to be one**.

## Step 1 — the five criteria (ALL must hold, out loud)

Answer each with the evidence, not with "yes":

| #   | Criterion              | Broken when…                                                                                       |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | One owning lane        | the diff spans `src/game` + `src/render`, or crosses the boundary; `src/hooks` only on your side     |
| 2   | No design surface      | it changes how the game plays (mechanic, tuning value, 3C) or any player-facing word                 |
| 3   | No asset surface       | a prompt, sprite or audio file is added or changed                                                   |
| 4   | No architecture surface | a new dependency, a boundary/contract change, anything ADR-worthy                                   |
| 5   | Small + already gated  | the behaviour was never gated, or the diff is a feature in disguise (one reviewer cannot hold it)    |

Doc surface counts too: touching gated doc content (ADR, art/audio bibles, README,
`architecture.md`, game-design specs) escalates — only same-lane JSDoc wording stays.

**Any answer "no" ⇒ stop and escalate** to the full pipeline, entering at the stage the
change violates (design surface → `lead-game-designer`; boundary/dep → `senior-architect`;
asset → the art flow). Say which criterion broke. When in doubt: full pipeline.

## Step 2 — implement on the owning lane

A defect? Run **`root-cause`** first — reproduction, named mechanism, regression test —
then fix. Only the owning lane touches code; if you find yourself editing another lane's
paths, criterion 1 just broke.

## Step 3 — verify

```bash
rtk tsc && rtk vitest && rtk lint     # fallback: yarn typecheck && yarn test && yarn lint
```

Player-visible → `verify` (screenshots as evidence, both device classes if HUD/controls
are involved). Past the ~30-line floor → a **`simplify`** pass; below it, skip — a real
fix-lane diff is already small.

## Step 4 — ONE reviewer, not the panel

A single subagent running **`code-review` at effort high** on `git diff origin/main...HEAD`,
read-only. Findings are fixed or refuted with the code in hand. No 4-reviewer panel, no pm
story, no design gate, no architect stage.

If the reviewer's findings force the diff to grow across lanes or into a design/asset/
architecture surface — escalate (step 1 again). A fix that needed a redesign was never a fix.

## Step 5 — log one line, then hand to Bertrand

Append to `docs/handoffs/fixes.md` (newest first), in the house format:

```
- <date> · <branch> (PR #<n>) · <owning lane> · <one-line what, with the root cause when
  it was a bug> · checks: tsc/vitest(<n>)/lint [+verify] · review: code-review(high)
  CLEAR|findings→fixed
```

Then `open-pr`, ticking the **🛵 Course express** route in the template (not the tournée
complète). Merge stays Bertrand's.

## Step 6 — report

```
Fix lane — <branch> · lane: <dev-…>
Criteria: 1 one-lane ✓ · 2 no design ✓ · 3 no asset ✓ · 4 no architecture ✓ · 5 small+gated ✓
What: <one line>            (root cause: <…> when applicable)
Checks: tsc/vitest(<n>)/lint <+ verify screenshots>
Review: code-review(high) — CLEAR | <findings → fixed/refuted>
Logged: docs/handoffs/fixes.md · PR #<n> (Course express ticked)
```

## Guardrails

- The tier is **proposed**, never self-granted: `producer` records it and can refuse it.
- A gate owner (`lead-art`, `lead-game-designer`, `sound-designer`, `gpu-specialist`,
  `senior-architect`) can reclaim any fix touching their surface — one call re-routes it.
- Escalation mid-flight is a feature, not a failure: it re-enters the pipeline at the
  violated stage and never continues here.
- A fix closing an OVER-budget on-target perf item is NOT closed by the reviewer alone —
  `gpu-specialist`'s PERF re-verdict is required (stage-5 §perf re-entry).
- One reviewer here is the whole gate: never claim the merge-gate panel ran.
