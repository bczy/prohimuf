# muf — Project Documentation

**Generated:** 2026-07-23
**Project type:** Browser game (React Three Fiber)

---

## Agent orientation

Agents (Claude Code / Copilot / Cursor / …) start here.

| Document                                                                | Description                                                                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](../AGENTS.md)                                             | Vendor-neutral orientation (canonical) — stack, commands, boundary law, scope guard, working rules |
| [`CLAUDE.md`](../CLAUDE.md)                                             | Claude Code overlay — subagent crew, BMAD skills, rtk/codegraph tooling                            |
| [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) | GitHub Copilot overlay — CLI vs Coding Agent runtimes, crew orchestration & routing, sandbox setup |
| [`.claude/agents/COLLABORATION.md`](../.claude/agents/COLLABORATION.md) | Agent collaboration protocol — roster, production pipeline, gates, fix lane                        |

---

## Contents

Product & process:

| Document                                 | Description                                                |
| ---------------------------------------- | ---------------------------------------------------------- |
| [overview.md](./overview.md)             | Project vision — gameplay and universe                     |
| [architecture.md](./architecture.md)     | Technical architecture — folder structure and boundary law |
| [game-systems.md](./game-systems.md)     | Game logic systems — state machine and enemies             |
| [render-layer.md](./render-layer.md)     | R3F scene — LevelBackdrop and sprites                      |
| [audio-system.md](./audio-system.md)     | Howler-based audio system — tiers and cues                 |
| [asset-pipeline.md](./asset-pipeline.md) | Asset generation — Pollinations FLUX pipeline              |
| [ci.md](./ci.md)                         | CI/CD — Pages deploy and branch previews                   |
| [dev-guidelines.md](./dev-guidelines.md) | Coding standards — TDD YAGNI DRY                           |
| [roadmap.md](./roadmap.md)               | Sprint status and known gaps                               |

Decision records & specs:

| Document                                                                           | Description                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [adr/README.md](./adr/README.md)                                                   | Architecture Decision Records — index and convention                     |
| [art-direction.md](./art-direction.md)                                             | Art bible — visual acceptance surface                                    |
| [audio-direction.md](./audio-direction.md)                                         | Audio bible — sonic acceptance surface                                   |
| [game-design/README.md](./game-design/README.md)                                   | Design deliverables — specs and scripts                                  |
| [qa/README.md](./qa/README.md)                                                     | QA index — test plans and regressions                                    |
| [handoffs/](./handoffs/)                                                           | Sharded hand-off logs; index at [agent-handoffs.md](./agent-handoffs.md) |
| [drift-audit-2026-07.md](./drift-audit-2026-07.md)                                 | Latest doc-drift audit (Sujet 1 catch-up)                                |
| [follow-ups-2026-07-post-drift-audit.md](./follow-ups-2026-07-post-drift-audit.md) | Owner-routed follow-ups from the 2026-07 audit                           |

## Diagrams

| Diagram                                                              | Incorporated in                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [diagrams/architecture-layers.md](./diagrams/architecture-layers.md) | [architecture.md](./architecture.md)                                    |
| [diagrams/data-flow.md](./diagrams/data-flow.md)                     | [architecture.md](./architecture.md)                                    |
| [diagrams/enemy-state-machine.md](./diagrams/enemy-state-machine.md) | [game-systems.md](./game-systems.md)                                    |
| [diagrams/app-phase-flow.md](./diagrams/app-phase-flow.md)           | [render-layer.md](./render-layer.md)                                    |
| [diagrams/agent-workflows.md](./diagrams/agent-workflows.md)         | [`.claude/agents/COLLABORATION.md`](../.claude/agents/COLLABORATION.md) |

---

## Quick Reference

| Area         | Current state                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Active level | `belliard` (ADR-0059) — PNG art layers via `LevelBackdrop`                                                              |
| Game mode    | Shooting gallery + boss QTE (ADR-0051 / ADR-0052 / ADR-0060)                                                            |
| Entry point  | `src/main.tsx` → `App.tsx`                                                                                              |
| Dev command  | `yarn dev`                                                                                                              |
| Test command | `yarn test`                                                                                                             |
| ADR registry | [`docs/adr/README.md`](./adr/README.md) or [https://bczy.github.io/prohimuf/adr/](https://bczy.github.io/prohimuf/adr/) |
