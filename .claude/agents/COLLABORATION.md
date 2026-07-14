# Agent collaboration protocol — muf

Twelve subagents work the muf project. They run **in parallel where paths don't overlap**,
but they **always coordinate** through this protocol. Read this before acting.

## Roster & ownership

| Agent | Persona | Owns | Never touches |
| --- | --- | --- | --- |
| `pm` | John 📋 | PRD, epics, stories, scope (`_bmad-output/planning-artifacts/`) | production code |
| `senior-architect` | Winston 🏗️ | architecture, ADRs, boundaries, cross-cutting sign-off | feature implementation |
| `lead-game-designer` | Karim 🧭 | design gate (specs & scripts), design↔art↔dev sync, `docs/game-design/README.md` | first-draft specs, production code |
| `game-designer` | Sacha 🎮 | mechanics, tuning values, 3C — specs in `docs/game-design/` | production code, lore, visual style |
| `narrative-designer` | Yasmine ✒️ | universe, cast, every player-facing word — scripts in `docs/game-design/` | production code, mechanics, visuals |
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
            → DESIGN LOOP (only when the story touches how the game plays or its fiction)
                → game-designer      ┐ specs in parallel on
                → narrative-designer ┘ non-overlapping deliverables
                → lead-game-designer DESIGN GATE (PASS required — see below)
            → senior-architect (how, boundaries, lane assignment + parallel plan)
                → dev-r3f-render  ┐
                → dev-gameplay    ├─ build in parallel on non-overlapping paths
                → dev-tooling     ┘
                → senior-architect (review, integration sign-off)
                → CODE-REVIEW PANEL (mandatory before any merge to main — see below)
            → pm (acceptance vs story + PROJECT_GUIDELINES)
```

## The design flow (any change to mechanics, tuning, 3C, universe, cast or in-game text)

```
pm story (what/why)
     ↓
lead-game-designer splits & sequences the design work
     ↓
game-designer (mechanics, tuning tables,  ┐ parallel when deliverables
               3C specs)                  │ don't overlap; they reconcile
narrative-designer (bible, character      │ directly when fiction and
                    sheets, scripts)      ┘ mechanics meet
     ↓
lead-game-designer DESIGN GATE — PASS/FAIL per deliverable vs PROJECT_GUIDELINES
(cahier des charges test, core loop, verifiability, coherence with gated specs
 and with the art bible). Max 2 rework rounds per cycle, then escalate to Bertrand.
     ↓
FAIL → designer iterates · PASS → senior-architect (lanes) → devs implement the spec
```

Design deliverables live under `docs/game-design/` (index: `docs/game-design/README.md`,
kept by `lead-game-designer`). Designers write specs and scripts, never production code:
`dev-gameplay` transcribes gated tuning values and narrative scripts into `src/game/**`.
Character/asset VISUALS stay in the art flow — a character sheet feeds `concept-artist`,
it never bypasses `lead-art`'s gates. Every gate verdict is logged in
`docs/agent-handoffs.md`.

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
                              documented scripts — filters what reaches lead-art;
                              for any runtime-composed visual the technical pass ALSO
                              inspects the in-game COMPOSITE at real in-game size, not
                              the source PNG alone — a glow's alpha falloff is only
                              visible on the composite)
     ↓
lead-art ASSET GATE (PASS/FAIL per sprite vs docs/art-direction.md;
                     mechanical gate passing does not bind the verdict)
     ↓
lead-art COMPOSITE GATE (Gate 4 — runtime-composed visuals only: neon rims, glows,
                         additive/emissive effects. lead-art verdicts REAL in-game
                         screenshots; an asset-gate PASS does NOT cover runtime
                         composition. « un halo est un dégradé, jamais un aplat » —
                         a binary-alpha glow with no falloff FAILs here)
     ↓
FAIL → concept-artist iterates (one variable per roll, max 2 batches/cycle,
        then escalate options to Bertrand) · PASS → pm/product acceptance
```

Every gate verdict is logged in `docs/agent-handoffs.md`.

**Runtime-composed visuals (the composite gate wiring).** Some visuals are NOT present
in the delivered PNGs — they are composed live in `src/render` (the ADR-0011 neon rim,
glows, additive effects). These have no acceptance surface in the asset gate, which judges
only the source sprite. So:

- **`dev-r3f-render`** MUST deliver REAL in-game screenshots (via the e2e scripts / the
  `verify` skill) alongside ANY change to a runtime-composed visual. A code diff is not a
  deliverable here; the on-screen composite is.
- **`game-graphist`**'s TECHNICAL pass inspects that composite at real in-game size — the
  glow's alpha falloff and edge behaviour only exist on the composite, never on the PNG.
- The **orchestrator** routes those screenshots to `lead-art` for the composite gate
  (Gate 4) before merge. No screenshots reaching `lead-art` = the runtime visual is
  ungated = it does not merge.

## Rules of engagement
1. **No code before a story.** `pm` defines it; `senior-architect` makes it buildable and
   assigns lanes. Devs implement only assigned, scoped work. When the story touches
   gameplay (mechanics/tuning/3C) or fiction (universe/cast/in-game text), the design
   loop runs first and no dev implements an ungated design: `lead-game-designer`'s
   DESIGN GATE PASS is required before the architect assigns lanes.
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
