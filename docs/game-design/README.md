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

| Deliverable                                                                               | Owner                           | Gate verdict                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-game-experience-ux.md`                                                               | `game-designer`                 | **PASS w/ conditions** 2026-07-14 (`pre-game-design-gate.md`)                                                                                                                                                                                                                                                                                                                 |
| `pregame-copy-deck.md`                                                                    | `narrative-designer`            | **PASS w/ conditions** 2026-07-14 (`pre-game-design-gate.md`)                                                                                                                                                                                                                                                                                                                 |
| `spec-hostage-qte-duel-porte-cochere.md` (ADR-0034 F1+F2 tuning)                          | `game-designer`                 | **PASS w/ corrections** 2026-07-17 — apply G-1 (remove +8 rescue score bonus; energy = sole currency, D5). Log: `story-hostage-qte-duel.md` §5                                                                                                                                                                                                                                |
| `ux/spec-hostage-qte-hud-readability.md` (ADR-0034 F1+F2 HUD)                             | `ux-designer`                   | **PASS w/ conditions** 2026-07-17 — applied U-1 (global energy readout stays visible during QTE). Log: `story-hostage-qte-duel.md` §5                                                                                                                                                                                                                                         |
| `spec-hostage-qte-static-duel.md` (static duel + blown-peeks clock, reverses ADR-0034 D1) | `game-designer`                 | **PASS w/ corrections** 2026-07-18 — static captor / N=4 / single diegetic clock / F-1 reversal CONFIRMED; C-1 applied (`blownPeeksToLose`→`maxBlownPeeks`, `tech-writer`); Flag A ADR record applied (ADR-0034 Revision 2, `tech-writer`); Flag B blown-peeks read → ux/lead-art (open). Log: `story-hostage-qte-duel.md` §10                                                |
| `spec-foreground-parallax.md` + `near-foreground-parallax-ux.md`                          | `game-designer` + `ux-designer` | **PASS w/ conditions** 2026-07-17 (`story-near-foreground-parallax.md` §3; ADR-0045, PR #76). Rulings: Vitry opt-out RATIFIED, mobile bottom-band ACCEPTED (D9.3 fallback), extension CONFIRMED. Conditions C1 decor=zero-glow, C2 car-roofline false-affordance, C3 pin mobile HUD-clearance %, C4 VERIFY leg.                                                               |
| `ux/flyer-wall-format.md` (+ `art-direction.md` §2bis.2 materiality)                      | `ux-designer` + `lead-art`      | **PASS w/ amendments** 2026-07-19 (`story-flyer-paper-materiality.md`). Max-width reconciled to `FLYER_MAX_WIDTH_PX = 280` (art was "~300–340 px"); art §2bis.2 pt5 dense-overlap/rotation-spread pile re-tuning DEFERRED out of scope (conflicts UX wrap-grid + exceeds AC1); flagged to `lead-art`. Materiality ingredients 1–4/6 + A5 ratio PASS. All 8 story ACs covered. |
| `spec-boss-qte-encounter.md` (boss QTE mechanic + tuning) + `spec-boss-encounter-fiction.md` (fiction "le Commandant") | `game-designer` + `narrative-designer` | **PASS w/ corrections** 2026-07-19 (`story-boss-encounter-qte.md` §4). OQ1 (required gate on `Livrer`), OQ2 (SHIELDED↔EXPOSED + wandering ring + 3 phases) & OQ5 (le Commandant = BAC apex, extends §7, no 4th faction) RATIFIED; mechanic↔fiction lock seamless; anti-bullshit floors reuse verified vs. shipped code (G6 safely dropped). Corrections: K1 (telegraph-floor value 0.35 vs mis-stated 0.25 — verifiability), K2 (JOINT lead+pm+architect — resolve required-gate × Belliard-placeholder × unbuilt-finale seam before lanes). OQ3 → **Option A in V1, tier=data for later C** (C4, pm concurs at AC7). OQ6 HP-read → `ux-designer` (C1, blocks render only, not this gate). Fiction canon flags ratified (C2); full-figure-enemy + non-CRS coherence → `lead-art` (C3). |

### Recherche / veille (pre-gate — non gaté)

Livrables d'idéation produits par la veille concurrentielle du 2026-07-18. **Non gatés** :
matière d'entrée pour de futures specs, à passer au design gate avant toute implémentation.

| Deliverable                          | Author          | Statut                                           |
| ------------------------------------ | --------------- | ------------------------------------------------ |
| `veille-concurrentielle-shooters.md` | `game-designer` | **Pre-gate** — features candidates (tiers S/A/B) |
| `pre-spec-weapons.md`                | `game-designer` | **Pre-gate** — modèle multi-armes par pickup     |

### Gated canon (pending `narrative-bible.md`)

Net-new named entities PASSed as conscious extension (gate 2026-07-14, condition f1) —
sound-systems, distinct from §7 recruitable contacts; to be folded into a future
`narrative-bible.md`:

- **SPIRALE 23** — Belliard (19e) crew · **KANAL SYSTEM** — Stalingrad (19e) crew
  (relates to Faïza/§7) · **NADIR 94** — Vitry (94) crew (relates to DJ Masta Klem/§7).
- **PARIS-MINUIT** — fictional establishment night-tabloid (the SCORES UNE).
- Infoline numbers (fictional, `08 36` period pattern), incl. Vitry `…94 09` (9th-floor
  callback to the shipped Vitry post-scene). Tutorial has **no** infoline by design.
