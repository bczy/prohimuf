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

| Deliverable                                                  | Author                         | Gated             | Notes                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `tutorial-visual-gestures.md` — gesture-icon + bestiary spec | Sacha (`game-designer`)        | 2026-07-14 · PASS | 11-panel structure ratified; downstream: `senior-architect` ADR-0015 D3 amendment (AC11), `lead-art` glow-hue + falloff at composite gate |
| `tutorial-script-visual-gestures.md` — expanded French copy  | Yasmine (`narrative-designer`) | 2026-07-14 · PASS | Copy TRUE to `ARCHETYPES`; device-accurate-copy pins hold; both `[FLAG]`s resolved by Sacha's spec                                        |

_The design lane opened on 2026-07-14. Existing de-facto design surfaces (shipped tuning
values in `src/game/**`, narrative scenes in `src/game/systems/narrativeSystem.ts`,
ADR-0012/0015 decisions) are grandfathered: they change only through this flow from now on._

### In flight / gated

| Deliverable                                                      | Owner                | Gate verdict                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre-game-experience-ux.md`                                      | `game-designer`      | **PASS w/ conditions** 2026-07-14 (`pre-game-design-gate.md`)                                                                                    |
| `pregame-copy-deck.md`                                           | `narrative-designer` | **PASS w/ conditions** 2026-07-14 (`pre-game-design-gate.md`)                                                                                    |
| `spec-hostage-qte-duel-porte-cochere.md` (ADR-0034 F1+F2 tuning) | `game-designer`      | **PASS w/ corrections** 2026-07-17 — apply G-1 (remove +8 rescue score bonus; energy = sole currency, D5). Log: `story-hostage-qte-rework.md` §4 |
| `ux/spec-hostage-qte-hud-readability.md` (ADR-0034 F1+F2 HUD)    | `ux-designer`        | **PASS w/ conditions** 2026-07-17 — apply U-1 (global energy readout stays visible during QTE). Log: `story-hostage-qte-rework.md` §4            |

### Gated canon (pending `narrative-bible.md`)

Net-new named entities PASSed as conscious extension (gate 2026-07-14, condition f1) —
sound-systems, distinct from §7 recruitable contacts; to be folded into a future
`narrative-bible.md`:

- **SPIRALE 23** — Belliard (19e) crew · **KANAL SYSTEM** — Stalingrad (19e) crew
  (relates to Faïza/§7) · **NADIR 94** — Vitry (94) crew (relates to DJ Masta Klem/§7).
- **PARIS-MINUIT** — fictional establishment night-tabloid (the SCORES UNE).
- Infoline numbers (fictional, `08 36` period pattern), incl. Vitry `…94 09` (9th-floor
  callback to the shipped Vitry post-scene). Tutorial has **no** infoline by design.
