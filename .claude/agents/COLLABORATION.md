# Agent collaboration protocol — muf

Nine subagents work the muf project. They run **in parallel where paths don't overlap**,
but they **always coordinate** through this protocol. Read this before acting.

## Roster & ownership

| Agent | Persona | Owns | Never touches |
| --- | --- | --- | --- |
| `pm` | John 📋 | PRD, epics, stories, scope (`_bmad-output/planning-artifacts/`) | production code |
| `senior-architect` | Winston 🏗️ | architecture, ADRs, boundaries, cross-cutting sign-off | feature implementation |
| `lead-art` | Nico 🎯 | `docs/art-direction.md` + references, visual acceptance gate (prompts & generated assets) | pipeline mechanics, first-draft prompts |
| `art-advisor` | Estelle 📼 | references & cultural grounding (advice only, read-only) | any file except via lead-art |
| `concept-artist` | Maud ✍️ | prompt/style strings in `levelArt.json`, `docs/art-direction/prompt-drafts.md` | sizes/ids/paths/structure, workflows |
| `game-graphist` | Serge 🕹️ | production passes (readability/keying annotations, `scripts/retouch-sprites.mjs`) | direction verdicts, prompt authorship, CI workflows |
| `dev-r3f-render` | Amelia 🎨 | `src/render/**`, view-side `src/hooks/**` | `src/game/**`, `scripts/**` |
| `dev-gameplay` | Amelia 🧠 | `src/game/**`, logic-side `src/hooks/**` | `src/render/**`, `scripts/**` |
| `dev-tooling-assets` | Amelia 🛠️ | `scripts/**`, `levelArt.json` (structure), `.github/**`, config | game rules, scene code, prompt strings |

## The flow (always collaborate, never silo)

```
Bertrand → pm (what/why, scoped story)
            → senior-architect (how, boundaries, lane assignment + parallel plan)
                → dev-r3f-render  ┐
                → dev-gameplay    ├─ build in parallel on non-overlapping paths
                → dev-tooling     ┘
                → senior-architect (review, integration sign-off)
                → CODE-REVIEW PANEL (mandatory before any merge to main — see below)
            → pm (acceptance vs story + PROJECT_GUIDELINES)
```

## The code-review panel (MANDATORY gate before merging to main)

No branch merges to `main` without a multi-reviewer code review of the full diff
(`git diff origin/main...HEAD`). The panel runs **in parallel** (one message, four Task
calls), each reviewer applying a **different review skill** so the methods stay orthogonal:

| Reviewer | Skill | Angle |
| --- | --- | --- |
| Architect A | `code-review` (effort high) | correctness bugs, reuse, simplification, efficiency |
| Architect B | `bmad-code-review` | BMAD adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor vs the story/ADR criteria) |
| Architect C | `bmad-review-edge-case-hunter` | every branch/boundary condition of the diff |
| Architect D | `security-review` | attacker-controlled surface (URL params, localStorage, asset paths, scripts) |

Protocol: reviewers are **read-only** and report findings as
`[BLOQUANT|MAJEUR|MINEUR] + file:line + concrete failure scenario`. Every non-trivial
finding is then **adversarially verified** (a skeptic agent tries to refute it against the
real code); only CONFIRMED findings are acted on. `senior-architect` triages, applies or
rejects-with-reason, re-runs `rtk tsc` + `rtk vitest` + `rtk lint`. The panel outcome
(findings → verdict → action) is logged in `docs/agent-handoffs.md` and summarized in the
PR. A PR with an unresolved CONFIRMED BLOQUANT/MAJEUR finding must not be merged.

## The art flow (any generated asset — vehicles, enemies, level art)

```
art-advisor (references, period grounding — advice)
     ↓
concept-artist (drafts prompts, positive shape language, shared style block)
     ↓
game-graphist PRE-PROD PASS (readability at game size, keying soundness —
                             numbered annotations; concept-artist integrates)
     ↓
lead-art PROMPT GATE (PASS required before any levelArt.json prompt commit;
                      scripts/check-art-prompts.mjs must also pass — it runs in CI)
     ↓
dispatch generation (marker push, see docs/ci.md) — the workflow runs
scripts/check-sprite-style.mjs on each output and retries bad rolls (bounded)
     ↓
game-graphist TECHNICAL PASS (real-size inspection, fringe/halo cleanup via
                              documented scripts — filters what reaches lead-art)
     ↓
lead-art ASSET GATE (PASS/FAIL per sprite vs docs/art-direction.md;
                     mechanical gate passing does not bind the verdict)
     ↓
FAIL → concept-artist iterates (one variable per roll, max 2 batches/cycle,
        then escalate options to Bertrand) · PASS → pm/product acceptance
```

Every gate verdict is logged in `docs/agent-handoffs.md`.

## Rules of engagement
1. **No code before a story.** `pm` defines it; `senior-architect` makes it buildable and
   assigns lanes. Devs implement only assigned, scoped work.
2. **Boundary rule is law.** `src/game` imports no React/Three; `src/render` holds no game
   rules; `src/hooks` is the only bridge. Any change crossing a lane → `senior-architect`
   sign-off, logged below.
3. **Parallel-safe = non-overlapping paths.** The only routinely shared seam is
   `src/hooks/**` (render ↔ gameplay): announce, serialise, don't both edit at once.
4. **Log every hand-off** in `docs/agent-handoffs.md` (template there). One line to claim
   work, one to release it + File List.
5. **Tooling discipline.** Use `rtk` for dev commands (compact output) and `codegraph` to
   locate symbols/callers before editing. Verify with `rtk tsc` + `rtk vitest` + `rtk lint`
   before declaring done — and never claim green tests that aren't.
6. **Scope guard.** Everything is checked against
   `_bmad-output/guidelines/PROJECT_GUIDELINES.md` and the core loop
   `Récupérer → Livrer → Éviter`.
7. **Language.** Communicate with Bertrand in the `communication_language` from
   `_bmad/bmm/config.yaml`.
8. **Code-review panel is a merge gate.** Any branch headed for `main` goes through the
   multi-skill panel above after the architect sign-off. No merge with an unresolved
   CONFIRMED BLOQUANT/MAJEUR finding. (Hard enforcement on GitHub — branch protection /
   required review — is a repo setting only Bertrand can flip.)

## How to launch them
From the main session, launch agents with the Task tool. Independent lanes go in **one
message with multiple tool calls** so they run concurrently, e.g. `dev-r3f-render` +
`dev-gameplay` + `dev-tooling-assets` in parallel after `senior-architect` has partitioned
the work. Use `pm` and `senior-architect` first to open and plan the loop.
