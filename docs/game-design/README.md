# Game design — index

Design deliverables for **muf**, kept by `lead-game-designer` (Karim). This index is the
single source of truth for what is designed, what is gated, and who owns what. Protocol:
`.claude/agents/COLLABORATION.md` §"The design flow".

## Ownership

| Deliverable                               | Author               | Gate                 |
| ----------------------------------------- | -------------------- | -------------------- |
| `gdd.md` — game design document           | `game-designer`      | `lead-game-designer` |
| `3c.md` — camera / character / controller | `game-designer`      | `lead-game-designer` |
| `tuning.md` — gameplay values + rationale | `game-designer`      | `lead-game-designer` |
| `narrative-bible.md` — universe & lore    | `narrative-designer` | `lead-game-designer` |
| `characters.md` — cast sheets             | `narrative-designer` | `lead-game-designer` |
| per-feature specs / per-scene scripts     | lane owner           | `lead-game-designer` |

Rules of the folder:

- Specs and scripts only — **no production code**. Gated tuning values and narrative
  scripts are transcribed into `src/game/**` by `dev-gameplay`.
- Everything here passes the "cahier des charges" test against
  `_bmad-output/guidelines/PROJECT_GUIDELINES.md` before gating.
- Gate verdicts are logged in `docs/agent-handoffs.md`.

## Status

**Gated:**

| Deliverable | Author | Gated | Notes |
| ----------- | ------ | ----- | ----- |
| `tutorial-visual-gestures.md` — gesture-icon + bestiary spec | Sacha (`game-designer`) | 2026-07-14 · PASS | 11-panel structure ratified; downstream: `senior-architect` ADR-0015 D3 amendment (AC11), `lead-art` glow-hue + falloff at composite gate |
| `tutorial-script-visual-gestures.md` — expanded French copy | Yasmine (`narrative-designer`) | 2026-07-14 · PASS | Copy TRUE to `ARCHETYPES`; device-accurate-copy pins hold; both `[FLAG]`s resolved by Sacha's spec |

_The design lane opened on 2026-07-14. Existing de-facto design surfaces (shipped tuning
values in `src/game/**`, narrative scenes in `src/game/systems/narrativeSystem.ts`,
ADR-0012/0015 decisions) are grandfathered: they change only through this flow from now on._
