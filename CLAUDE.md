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

A 5-agent crew that runs in parallel but always coordinates via
`.claude/agents/COLLABORATION.md` and logs in `docs/agent-handoffs.md`. Each fronts a BMAD
persona:

| Subagent             | Role                               | BMAD bridge                      |
| -------------------- | ---------------------------------- | -------------------------------- |
| `pm`                 | Product / PRD / stories / scope    | `bmad-agent-pm` (John)           |
| `senior-architect`   | Architecture, boundaries, sign-off | `bmad-agent-architect` (Winston) |
| `dev-r3f-render`     | `src/render` + view hooks          | `bmad-agent-dev` (Amelia)        |
| `dev-gameplay`       | `src/game` pure logic (TDD)        | `bmad-agent-dev` (Amelia)        |
| `dev-tooling-assets` | `scripts/`, `levelArt.json`, CI    | `bmad-agent-dev` (Amelia)        |

Flow: `pm` (what) → `senior-architect` (how + lane assignment) → the three devs build in
parallel on non-overlapping paths → `senior-architect` reviews → `pm` accepts. Launch
independent dev lanes in a single message (parallel Task calls).

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
