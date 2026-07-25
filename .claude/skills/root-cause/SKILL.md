---
name: root-cause
description: >
  Diagnose a bug in muf BEFORE fixing it: reproduce it as a failing test, trace it to the
  ONE mechanism that produces it, and only then change code — so the fix lands on the
  cause and the regression test survives it. Use it the moment a defect appears (a
  Bertrand bug report, an escaped regression, a red test, a broken visual/asset, a
  reviewer's CONFIRMED finding) or when someone says "fix this bug", "ça marche pas",
  "corrige la régression", "pourquoi ça fait ça". Refuses the symptomatic patch: no fix
  is written until the failing reproduction exists and the cause is named out loud.
  Owner: the owning dev lane (`dev-gameplay` / `dev-r3f-render` / `dev-tooling-assets`);
  `qa-lead` specs the regression test when the bug escaped a gate.
---

# root-cause — reproduce, name the cause, then fix

The failure mode this exists to kill: an agent reads a bug report, spots a plausible
line, patches it, sees green, and ships. The symptom disappears, the mechanism stays,
and the bug returns under another shape — with a test that would not have caught it
either. The order below is the whole point; it is not negotiable when a defect is real.

## Step 1 — reproduce, mechanically

Nothing is written until the bug is **observed** in this repo:

- Logic → a **failing Vitest case** in `src/game/systems/__tests__/` that fails for the
  reported reason (read its failure message: it must describe the bug, not a typo in the
  test).
- Player-visible → the `verify` skill: drive the flow in the headless browser, screenshot
  the wrong frame, note the exact step. Mobile vs desktop is a fork (ADR-0003) — reproduce
  on the device class where it was reported.
- Asset / pipeline → re-run the generator or the checker (`check-sprite-integrity`,
  `check-art-prompts`, …) and keep the failing output.

**Cannot reproduce?** Stop. Say so, list what you tried and what information is missing,
and ask Bertrand — never "fix" a bug you have not seen. A guess plus green tests is not
a fix.

## Step 2 — trace to the mechanism (no edits yet)

Work backwards from the observed wrong value/frame to the code that produces it. Use
**codegraph** (`codegraph_callers` / `_callees` / `_impact`) rather than grep-reading
whole files. Usual muf grounds:

| Symptom shape                     | Look first at                                                         |
| --------------------------------- | --------------------------------------------------------------------- |
| Wrong rule, score, timer, spawn   | the pure system in `src/game/systems/**` and its state transition      |
| State stuck / screen won't advance | the machine in `src/game/state/**` — which transition never fires      |
| Renders wrong but state is right  | `src/render/**` or the `src/hooks/**` bridge (stale closure, ordering) |
| Right on desktop, wrong on mobile | the ADR-0003 UA fork, touch handling, viewport/orientation             |
| Sprite holes, halos, grey patches | the keying/generation pipeline in `scripts/**`, not the renderer       |
| Passes locally, fails in CI       | timing, asset availability, headless GPU (SwiftShader)                 |

Stop when you can finish this sentence with **one** mechanism:
_"The bug happens because \<X\> does \<Y\>, so \<Z\> is wrong."_
If it needs an "and", you have two bugs — split them and run this once per bug.

## Step 3 — state the diagnosis before touching code

Write it out, explicitly:

- **Root cause** — the one mechanism, with `file:line`.
- **Why it was not caught** — the missing test, the untested branch, the gate that let it
  through. This is what turns a fix into a lesson.
- **Blast radius** — who else calls this (codegraph): are there sibling bugs with the same
  cause? Fix the cause once, not each of its symptoms.

## Step 4 — fix the cause, keep the reproduction

Fix the mechanism named in step 3, not the place where the symptom surfaced. The step-1
reproduction becomes the **permanent regression test** — it must fail before your fix and
pass after it, and it is never softened to fit. Then `rtk tsc` + `rtk vitest` + `rtk lint`
(+ `verify` for anything player-visible).

Guard against scope creep: this fixes **one** bug. Other defects spotted while tracing are
reported, not fixed (Karpathy §3).

## Step 5 — report

```
Root cause — <bug in one line>
Reproduced: <failing test path | verify screenshot + step | failing checker output>
Cause: file:line — <the ONE mechanism>
Not caught because: <missing test / untested branch / gate hole>
Blast radius: <other call sites with the same cause / none>
Fix: <what changed, and why it is the cause and not the symptom>
Regression test: <path> — red before, green after
Checks: tsc/vitest/lint <+ verify>
Also spotted (NOT fixed): <… / none>
```

Log it in the story's shard, or as the fix-lane line in `docs/handoffs/fixes.md` (the
"Root cause:" phrasing there is already the house habit — keep it).

## Guardrails

- No fix before a reproduction. No reproduction ⇒ escalate, do not improvise.
- The regression test is written **first** and is never weakened to make the fix pass.
- One bug per pass. Two mechanisms = two passes.
- Symptom-site patches (clamping the value where it blew up, swallowing an error, adding a
  guard at the crash site) are exactly what this skill forbids — unless that guard IS the
  named cause.
- Escaped bugs (found after a gate) belong in `qa-lead`'s plan as a regression spec — tell
  her, so the hole is closed in the suite and not only in the code.
