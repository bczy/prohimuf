# AGENTS.md — muf

Vendor-neutral orientation for **any** AI coding agent working in this repo
(Claude Code, GitHub Copilot, Cursor, Codex, Aider, …). This is the single
source of truth for project facts and universal rules. Vendor-specific
overlays live in:

- `CLAUDE.md` — Claude Code (subagent crew, BMAD orchestration, hooks, rtk/codegraph).
- `.github/copilot-instructions.md` — GitHub Copilot (CLI/app **and** coding agent;
  starts by telling you which of the two you are, since they differ in tooling).

Read this file first, then your vendor-specific overlay if any.

## What this is

**muf** — a browser remake of _Prohibition_ (Atari ST, 1987), reset in the late-90s
Parisian clandestine rave scene. 2D flat sprites (fanzine B&W + acid neon) in a 3D
React Three Fiber world. Current prototype = the shooting-gallery phase. See `README.md`.

## Stack

React 19 · React Three Fiber + Three.js · TypeScript (strict) · Vite · Vitest ·
Howler.js (audio) · Yarn 4 (node-modules linker) · asset gen via Pollinations.ai (FLUX).

Node.js **24** (see `.github/workflows/ci.yml`). Enable Yarn via `corepack enable`.

## Commands

| Task       | Command          |
| ---------- | ---------------- |
| Dev server | `yarn dev`       |
| Typecheck  | `yarn typecheck` |
| Tests      | `yarn test`      |
| Lint       | `yarn lint`      |
| Format     | `yarn format`    |
| Build      | `yarn build`     |

Claude Code sessions may use `rtk` (Rust Token Killer) as a token-saving proxy
over `tsc`/`vitest`/`grep`/`git` — see `CLAUDE.md`. All other agents use `yarn`
directly.

## Architecture (enforced — see `docs/architecture.md`)

- `src/game/**` — **pure** game logic, **zero React/Three deps**. `types/` (no functions),
  `systems/` (pure, unit-tested), `maps/`, `entities/`, `state/`.
- `src/render/**` — R3F only: `scene/`, `ui/`, `effects/`. Renders state; no game rules.
- `src/hooks/**` — the **only** bridge between pure logic and R3F.
- `scripts/**` + `.github/workflows/**` — asset-gen pipeline & CI render farm (`HARNESS.md`).

**Boundary rule (law):** game logic never imports React/Three; rendering never holds
rules. This is the single most important rule in the repo — respect it in every edit.

## Scope guard (non-negotiable)

`_bmad-output/guidelines/PROJECT_GUIDELINES.md`. Core loop = `Récupérer → Livrer → Éviter`.
"Cahier des charges" test before any feature: _did Prohibition Atari ST have it?_
Yes → implement faithfully. No → conscious, documented, justified extension only.

## Working rules

- Strict TypeScript, no `any`. Respect ESLint/Prettier; Husky + lint-staged run on commit.
- TDD for `src/game`: tests in `src/game/systems/__tests__/` must pass 100%.
- **Do not manually run `yarn typecheck` / `yarn test` / `yarn lint` / `yarn format` (or
  their `rtk`/individual-file equivalents) as a blanket verification pass before
  committing.** The pre-commit hook (`.husky/pre-commit`: `lint-staged` + `lint` +
  `format:check`) already runs these on every commit — let it do its job. Never skip or
  bypass the hook (no `--no-verify`), and never report work as "verified" based on a
  manual run instead of a real commit going through it. It is still fine to run a
  single targeted test file while actively writing/debugging code (TDD red→green loop),
  just not a full-suite check as a pre-commit ritual.
- Adding a level = one entry in `src/game/levels/levelArt.json` + matching gameplay map
  (`HARNESS.md`). Art generation normally runs in CI, not the local sandbox.
- Conventional Commits (commitlint enforced).
- Every PR description must include the branch-preview link (see the "Preview" section
  of the PR template): `https://bczy.github.io/prohimuf/preview/<slug>/`, where `<slug>`
  is the branch name with any BYTE outside `[a-zA-Z0-9._-]` replaced by `-` — per byte,
  not per character: a UTF-8 `é` (2 bytes) becomes `--` (the workflow uses `tr -c`)
  (deployed by `deploy-preview.yml` on each push to `claude/**`).
- Record significant architecture decisions and changes as ADRs in `docs/adr/`
  (see `docs/adr/README.md`). When a change alters module boundaries, deployment,
  dependencies, or the game/render/hooks contract, add or update an ADR in the same PR.

## Merge gate (all agents)

Every merge to `main` must clear the **4-reviewer merge-gate panel** — same
skills, same doctrine, same verdict for every agent (Claude Code, Copilot,
human). Two runtimes execute the same panel:

- **CI panel** (`.github/workflows/code-review-panel.yml`, ADR-0063): 6 parallel
  jobs (4 reviewers + skeptic + triage) publishing the `panel-verdict` check
  run. This is the source of truth when the repo variable `PANEL_ENABLED=true`.
  Any agent pushes and lets CI run — no local simulation.
- **Local panel** (Claude Code `/review-panel` skill, `Task` + `subagent_type`):
  pre-push convenience for agents that have it. Its verdict is advisory once
  the CI panel is enabled.

Copilot Coding Agent and Cursor lack `Task` — they MUST NOT self-simulate the
4-reviewer panel in a single conversation. Push, mark ready-for-review, let
the CI panel run. (Copilot **CLI/app** does have `Task` and loads
`.claude/agents/**`; for it the local panel is an advisory pre-check like
Claude's.)

## AIDD context (informational — not required to use it)

This repo is scaffolded with **BMAD-METHOD v6.3** (`_bmad/`, artifacts in
`_bmad-output/`). The BMAD personas (John/Winston/Amelia/Otis/Sally/Mary/Paige) are
exposed to Claude Code as a full **subagent crew** (`.claude/agents/`) with a
production pipeline; see `CLAUDE.md`. Any runtime that loads `.claude/agents/**`
as delegable agents — Claude Code, and the **Copilot CLI/app** — is expected to
orchestrate that crew rather than work solo (Copilot's own overlay,
`.github/copilot-instructions.md`, says how). Runtimes without it (Copilot
Coding Agent, Cursor, …) follow the rules above and produce single-agent output.
The gates that matter (CI typecheck/test/lint/e2e, code review, ADRs) apply
equally regardless of which agent opened the PR.

## Behavioral guidelines (Karpathy)

Reproduced from [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
(derived from Andrej Karpathy's observations on LLM coding pitfalls). They complement —
never override — the project rules above. Bias toward caution over speed; for trivial
tasks, use judgment.

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

The test: every changed line should trace directly to the user's request.

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
