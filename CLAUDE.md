# CLAUDE.md — muf

Orientation for AI coding agents working in this repo. Read this first.

## What this is

**muf** — a browser remake of _Prohibition_ (Atari ST, 1987), reset in the late-90s
Parisian clandestine rave scene. 2D flat sprites (fanzine B&W + acid neon) in a 3D
React Three Fiber world. Current prototype = the shooting-gallery phase. See `README.md`.

## Stack

React 19 · React Three Fiber + Three.js · TypeScript (strict) · Vite · Vitest ·
Howler.js (audio) · Yarn 4 (Plug'n'Play) · asset gen via Pollinations.ai (FLUX).

## Commands

Use **`rtk`** as a compact proxy for dev commands (saves tokens); fall back to `yarn` if
rtk is unavailable.

| Task       | Preferred     | Fallback         |
| ---------- | ------------- | ---------------- |
| Dev server | `yarn dev`    | —                |
| Typecheck  | `rtk tsc`     | `yarn typecheck` |
| Tests      | `rtk vitest`  | `yarn test`      |
| Lint       | `rtk lint`    | `yarn lint`      |
| Format     | `yarn format` | —                |
| Build      | `yarn build`  | —                |

## Architecture (enforced — see `docs/architecture.md`)

- `src/game/**` — **pure** game logic, **zero React/Three deps**. `types/` (no functions),
  `systems/` (pure, unit-tested), `maps/`, `entities/`, `state/`.
- `src/render/**` — R3F only: `scene/`, `ui/`, `effects/`. Renders state; no game rules.
- `src/hooks/**` — the **only** bridge between pure logic and R3F.
- `scripts/**` + `.github/workflows/**` — asset-gen pipeline & CI render farm (`HARNESS.md`).

**Boundary rule (law):** game logic never imports React/Three; rendering never holds rules.

## Scope guard (non-negotiable)

`_bmad-output/guidelines/PROJECT_GUIDELINES.md`. Core loop = `Récupérer → Livrer → Éviter`.
"Cahier des charges" test before any feature: _did Prohibition Atari ST have it?_
Yes → implement faithfully. No → conscious, documented, justified extension only.

## AIDD setup

This project runs on **BMAD-METHOD v6.3** (`_bmad/`, skills under `.claude/skills/bmad-*`,
artifacts in `_bmad-output/`). BMAD config: `_bmad/bmm/config.yaml`
(language = English, planning → `_bmad-output/planning-artifacts/`).

### Subagent team (`.claude/agents/`)

A crew of subagents (full roster & protocol: `.claude/agents/COLLABORATION.md`) that runs
in parallel but always coordinates there and logs in the sharded handoffs log
(`docs/handoffs/`, index `docs/agent-handoffs.md`). Core crew,
each fronting a BMAD persona:

| Subagent             | Role                                  | BMAD bridge                             |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `pm`                 | Product / PRD / stories / scope       | `bmad-agent-pm` (John)                  |
| `producer`           | Pipeline execution, sprint status     | `bmad-sprint-planning/-status` (Marion) |
| `senior-architect`   | Architecture, boundaries, sign-off    | `bmad-agent-architect` (Winston)        |
| `lead-game-designer` | Design gate + design/art/dev sync     | — (Karim)                               |
| `game-designer`      | Mechanics, tuning, 3C specs           | BMGD `gds` module when installed        |
| `narrative-designer` | Universe, cast, in-game text scripts  | BMGD `bmgd-narrative` when installed    |
| `ux-designer`        | Screens/flows/HUD UX + accessibility  | `bmad-agent-ux-designer` (Tony)         |
| `qa-lead`            | Test plans, regressions, quality gate | `bmad-qa-generate-e2e-tests` (Inès)     |
| `gpu-specialist`     | Frame budget, perf verdicts (GPU)     | — (Ben)                                 |
| `tech-writer`        | DOCS lane: ADRs, doc↔code coherence   | `bmad-agent-tech-writer` (Otis)         |
| `dev-r3f-render`     | `src/render` + view hooks             | `bmad-agent-dev` (Amelia)               |
| `dev-gameplay`       | `src/game` pure logic (TDD)           | `bmad-agent-dev` (Amelia)               |
| `dev-tooling-assets` | `scripts/`, `levelArt.json`, CI       | `bmad-agent-dev` (Amelia)               |

(The art crew — `lead-art`, `art-advisor`, `concept-artist`, `game-graphist` — and the
`sound-designer` are documented in COLLABORATION.md.)

Flow — the production pipeline (stages 0-8, hand to hand; full protocol in
COLLABORATION.md, mermaid diagram in `docs/diagrams/agent-workflows.md`): `pm` (what) →
**design loop** when the story touches gameplay, fiction or screens/flows/accessibility
(`game-designer` + `narrative-designer` + `ux-designer` in parallel →
`lead-game-designer` design gate) →
`senior-architect` (how + lane assignment) → dev lanes in parallel on non-overlapping
paths (∥ art lane when assets are needed) → **verify** (orchestrated by `qa-lead`:
tsc/vitest/lint + e2e + `game-designer` playtest vs spec, `ux-designer` review of built
screens/flows on both device classes, composite gate for runtime visuals,
`gpu-specialist` perf verdict for perf-sensitive changes — all funnelled into the
quality gate) →
**code-review panel** (mandatory merge gate) whose triage by `senior-architect` IS his
integration review (one stage, one read) → `pm` accepts. `producer` drives the pipeline
itself (stage tracking, tier calls, hand-off chasing, caps, escalations, ADR number
allocation). Launch independent dev lanes in a single message (parallel Task calls).

**Fix lane (two-tier rule):** a small diff owned by a SINGLE dev lane — no design, no
asset, no dependency/boundary change, polish/bug-fix of already-gated behaviour — skips
the full pipeline: owning dev lane → tsc/vitest/lint (+ `verify` if player-visible) →
ONE `code-review` (high) reviewer → Bertrand merges. Logged as one line in
`docs/handoffs/fixes.md`. Doubt or a broken criterion ⇒ full pipeline
(COLLABORATION.md §fix lane).

**Mandatory merge gate:** before ANY merge to `main`, the full diff
(`git diff origin/main...HEAD`) goes through a 4-reviewer panel run in parallel, each with
a different skill — `code-review` (high), `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review` — findings adversarially verified, then
triaged by `senior-architect`. No merge with an unresolved CONFIRMED blocking/major
finding. Protocol: `.claude/agents/COLLABORATION.md` §"code-review panel".

### Default orchestration policy (Bertrand's standing preference)

**For every non-trivial task, orchestrate this crew in parallel by default — do not work
solo.** Open with `pm`, plan lanes with `senior-architect`, then fan out the dev lanes as
concurrent Task calls on non-overlapping paths, and close with architect review + `pm`
acceptance. A `UserPromptSubmit` hook (`.claude/hooks/bmad-crew-reminder.sh`) re-injects this
on every prompt; the policy is here so it stays readable and versioned.

**Non-trivial** = any feature, refactor, or bug that touches code/assets, or any design work.
**Exceptions (act directly, no crew):** questions & explanations, read-only exploration,
research, one-line/micro edits (typo, local rename), and one-off git/CI commands. When in
doubt on a borderline task, prefer the crew. To pause it for a session: `export MUF_CREW_OFF=1`.

### Tooling for agents

- **rtk** (Rust Token Killer) — CLI proxy that compresses `tsc`/`vitest`/`grep`/`git`
  output. A PreToolUse hook rewrites bash commands automatically once installed.
- **codegraph** — local code knowledge graph over MCP (see `.mcp.json`): query symbols,
  imports and call chains instead of grepping. Use it to find callers before editing.

## Working rules

- Strict TypeScript, no `any`. Respect ESLint/Prettier; Husky + lint-staged run on commit.
- TDD for `src/game`: tests in `src/game/systems/__tests__/` must pass 100%.
- Verify before claiming done: `rtk tsc` + `rtk vitest` + `rtk lint`. Never report green
  tests that aren't.
- Adding a level = one entry in `src/game/levels/levelArt.json` + matching gameplay map
  (`HARNESS.md`). Art generation normally runs in CI, not the local sandbox.
- Conventional Commits (commitlint enforced).
- Every PR description must include the branch-preview link (see the "Preview" section
  of the PR template): `https://bczy.github.io/prohimuf/preview/<slug>/`, where `<slug>`
  is the branch name with any character outside `[a-zA-Z0-9._-]` replaced by `-`
  (deployed by `deploy-preview.yml` on each push to `claude/**`).
- Record significant architecture decisions and changes as ADRs in `docs/adr/`
  (see `docs/adr/README.md`). When a change alters module boundaries, deployment,
  dependencies, or the game/render/hooks contract, add or update an ADR in the same PR.

## Behavioral guidelines (Karpathy)

Reproduced from [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
(derived from Andrej Karpathy's observations on LLM coding pitfalls). They complement —
never override — the project rules above.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific
instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use
judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work")
require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites
due to overcomplication, and clarifying questions come before implementation rather than
after mistakes.
