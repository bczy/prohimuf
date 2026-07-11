# 0012 — Optional scripted tutorial stage before Rue Belliard

- **Status:** Proposed
- **Date:** 2026-07-11
- **Supersedes:** —
- **Related:** [ADR-0002](./0002-cargo-delivery-core-loop-state.md) (deliveries),
  [ADR-0004](./0004-enemies-car-hostage-taker.md) (roster, unlock gate, `energy`),
  `docs/architecture.md`, `docs/diagrams/app-phase-flow.md`,
  `_bmad-output/guidelines/PROJECT_GUIDELINES.md` (scope guard).

## Context

muf currently has **no onboarding**. A new player lands on the level-select menu, launches
Rue Belliard, and must infer the core loop (`Récupérer → Livrer → Éviter`), the controls
(shoot, camera pan, mobile gestures), the enemy bestiary (window cops, courier, drive-by
car, hostage taker, `energy`) and the HUD from a single line of diegetic dialogue
("Les fenêtres, Muf. Les fenêtres." — `PRE_LEVEL_NARRATIVE.belliard`,
`src/game/systems/narrativeSystem.ts`). The original _Prohibition_ (Atari ST, 1987)
shipped with a printed manual; a browser game has none, and mobile players
(ADR-0003/0008) get controls that are not discoverable at all.

**Cahier-des-charges test:** _Prohibition_ had no tutorial → this is a **conscious,
documented extension**. Mitigations that keep it faithful to the source: the stage is
**optional** (never gates progression), **skippable at any moment**, purely
**informative** (zero gameplay rules added or changed), and written in the same diegetic
fanzine voice as the existing narrative screens.

Forces established by reading the code:

- The level-select menu (`src/render/ui/MainMenu.tsx`) maps **directly over `LEVELS`**
  (`src/game/levels/levels.ts`) in array order; there is no secondary ordering concept.
  Placing an entry at the head of `LEVELS` is the only way to appear "before Rue
  Belliard" without inventing a composite menu order.
- A scripted, non-interactive screen primitive **already exists**: `NarrativeScreen`
  (`src/render/ui/NarrativeScreen.tsx`) — fanzine frame, typewriter effect,
  click/key advance, progress dots, optional "Passer" button — driven by pure
  `NarrativeScene` data from `src/game/systems/narrativeSystem.ts`. Building a second
  scripted-screen system would violate DRY.
- `App.tsx` orchestrates flow through `AppPhase`
  (`"MENU" | "NARRATIVE_PRE" | "PLAYING" | "NARRATIVE_POST" | "END"`); `handlePlay`
  currently assumes every menu card launches gameplay.
- Several places assume `LEVELS[0]` is a playable level: the default
  `selectedLevel`/`buildHudInitial` seeds (`App.tsx:81-84`), the `handlePlay` fallback
  (`App.tsx:172`), and the Scores tab default (`MainMenu.tsx:171`).
- `levelArt.consistency.test.ts` asserts `LEVELS` ↔ `levelArt.json` declare the exact
  same ids in the same order; a tutorial entry has no backdrop art of its own.

## Decision

Add an **optional, scripted, informative-only tutorial stage** that always appears as the
**first card** of the level-select menu, before Rue Belliard. No interactivity beyond
advance/skip in V1.

### D1 — The tutorial is a `LEVELS` entry discriminated by a new `kind` field

`LevelConfig` gains an **optional** discriminant:

```ts
// src/game/levels/levels.ts — additive, optional
readonly kind?: "playable" | "tutorial"; // absent ⇒ "playable"
```

A single tutorial entry (`id: "tutorial"`, `kind: "tutorial"`) is **prepended** to
`LEVELS`, ahead of `belliard`. Gameplay-only fields it cannot honour are set to inert
values (`enemiesToWin: 0`, `timeSeconds: 0`, `deliveries: []`, `unlocked: true`) and are
**never read**, because every consumer branches on `kind` before touching them (D3).

Rationale: one ordered source of truth. The menu renders the tutorial first for free, and
`kind` keeps the existing three levels byte-for-byte untouched (absence = `"playable"`,
mirroring the `roster?` convention of ADR-0004 D2). Rejected alternative — a discriminated
union `LevelEntry = TutorialConfig | LevelConfig` — is semantically purer but forces type
narrowing on every existing `LEVELS` consumer for a single static entry; rejected
alternative — a hard-coded card outside `LEVELS` — creates a composite menu order that
"before Rue Belliard" would no longer be provable from data.

Helper for the "first playable" assumption: export
`FIRST_PLAYABLE_LEVEL` (or equivalent) from `levels.ts` and use it wherever `LEVELS[0]`
currently stands in for Belliard (`App.tsx:81-84`, `App.tsx:172` fallback,
`MainMenu.tsx:171` Scores default).

### D2 — Menu card: same `LevelCard` chassis, always unlocked, `TUTORIEL` badge, no stats

The tutorial reuses `LevelCard` (`src/render/ui/MainMenu.tsx:82-168`) with
`kind`-conditional rendering:

- **Always unlocked**, regardless of `muf_progress` / `unlockedLevels` — the check is
  `level.kind === "tutorial" || unlockedLevels.has(level.id)`.
- Badge **`TUTORIEL`** replaces the `FACILE/MOYEN/DIFFICILE` difficulty badge; the
  `⏱ / 🎯` stat row and the `MEILLEUR` best-score block are omitted (nothing to score).
- The **Scores tab excludes it** (`MainMenu.tsx:177` filter additionally requires
  `kind !== "tutorial"`), and `saveScore`/`isHighScore` are never invoked for it (the
  tutorial never reaches the score-saving effect — see D3).

### D3 — Flow: a new `AppPhase` `"TUTORIAL"`; exit or skip returns to `MENU`

`App.tsx`:

- `AppPhase` gains `"TUTORIAL"`. `handlePlay` branches first on
  `level.kind === "tutorial"` → `setAppPhase("TUTORIAL")`, bypassing
  `buildHudInitial`/`buildLevelParams`/`GameScene` entirely — no game state is created.
- The `"TUTORIAL"` phase renders `NarrativeScreen` with the tutorial scene,
  `showSkipButton`, and `onDone={handleBackToMenu}`. **Finishing and skipping both
  return to the menu**; the tutorial unlocks nothing (Belliard is already unlocked by
  default) and **writes nothing** to `muf_progress` or high scores. It is replayable at
  will.
- The index-based unlock chain (`LEVELS[currentIdx + 1]`, `App.tsx:148-153`) is only
  reached from gameplay (`LEVEL_COMPLETE`), which the tutorial never enters; completing
  Belliard (now index 1) still unlocks Stalingrad (index 2) — the relative `+1` logic is
  unaffected. Add a regression test asserting the tutorial entry can never be the
  _source_ nor the _target_ of an unlock.
- Extend the preview harness (`?preview=tutorial`, `App.tsx:29-32`) so the render farm /
  `verify` skill can screenshot the tutorial without playing.

### D4 — Content: pure data in `src/game`, diegetic voice, covering loop + controls + bestiary + HUD

The script lives beside the existing narrative data as a `NarrativeScene`
(e.g. `TUTORIAL_NARRATIVE` in `src/game/systems/narrativeSystem.ts`) — pure data,
zero React/Three imports, per the boundary law. It covers, in order:

1. **Core loop** — `Récupérer → Livrer → Éviter`: pick up the cargo, deliver it
   (the scripted vehicle, ADR-0002), avoid the heat.
2. **Controls** — click/tap to shoot; camera pan (desktop edge/drag, mobile two-axis
   swipe, ADR-0003/0008); fullscreen toggle; Escape to pause.
3. **Enemies & dangers** — window cops, the courier (never shoot the livreur), the
   drive-by car (watch the trailing side), the hostage taker (precision shot; the
   hostage costs `energy`, ADR-0004).
4. **HUD** — timer, lives, score, kill target, delivery window, `energy`.

Voice: DISPATCH/KENZA briefing Muf, same register as `PRE_LEVEL_NARRATIVE` — informative
content, fanzine tone. French, like all player-facing copy.

### D5 — Panels are illustrated with **existing in-game assets only**

`NarrativeLine` gains an optional `image?: string` (path under `assets/`), and
`NarrativeScreen` renders it above the dialogue box when present. Only sprites and art
**already shipped** are referenced (enemy poses, vehicle sprites, HUD elements) — no new
Pollinations/FLUX generation, no CI render-farm run, no lead-art gate for this stage.
The extension is additive: existing narrative scenes omit `image` and render exactly as
today.

### D6 — Non-goals (V1) and future interactivity

Out of scope, locked: any interactive step ("now shoot this target"), tutorial-driven
unlocks, "seen ✓" persistence, per-panel audio, dedicated generated art, analytics.
If a future version makes the tutorial interactive (guided shots on a live scene), that
changes the game/render contract and **requires a new ADR** superseding this section —
D1's `kind` discriminant and D3's phase are designed to survive that evolution.

## Consequences

**Positive**

- The game↔render↔hooks contract is preserved: tutorial copy is pure data in
  `src/game/**`; `NarrativeScreen`/`MainMenu`/`App` changes are render-only; no new
  bridge is needed (the tutorial never touches `useGameLoop`).
- Everything is additive-and-optional (`kind?`, `image?`) — the three existing levels,
  their narrative scenes, and the seeded gameplay are byte-for-byte unchanged.
- Onboarding for browser/mobile players without betraying the arcade purity of the
  levels themselves; the stage is skippable, replayable, and never gates progression.
- `?preview=tutorial` gives the verification harness a free capture point.

**Negative / costs**

- `LEVELS[0]` stops meaning "first playable level"; every current and future consumer
  must go through `FIRST_PLAYABLE_LEVEL` or filter on `kind`. This is the main
  regression surface of the change.
- The tutorial entry carries inert gameplay fields (`enemiesToWin: 0`, …) that type-check
  but are meaningless — acceptable debt for one static entry, revisit (union type) if a
  second non-playable stage ever appears.
- Tutorial copy duplicates knowledge that lives in systems (control mappings, enemy
  rules); when a mechanic changes, the tutorial text must be updated by hand.

**Gotchas to watch**

- `levelArt.consistency.test.ts:14-18` compares `LEVELS` ↔ `levelArt.json` ids
  **exactly**: the tutorial has no backdrop entry, so the assertion must compare
  `LEVELS.filter((l) => l.kind !== "tutorial")` — do **not** add a dummy `levelArt.json`
  entry (it would ripple into the asset pipeline and prompt gates).
- The narrative-keys assertion (`levelArt.consistency.test.ts:20-28`) requires
  `PRE_/POST_LEVEL_NARRATIVE` keys ⊆ level ids: keep the tutorial script in its **own**
  constant (`TUTORIAL_NARRATIVE`), never keyed as `PRE_LEVEL_NARRATIVE.tutorial`, or the
  pre-level flow in `handlePlay` would try to run it as a level intro.
- `ScoresTab` defaults to `LEVELS[0]?.id` (`MainMenu.tsx:171`) — left as-is it would
  select a level that has no scores and is filtered from the tab buttons; switch it to
  the first playable id.
- Asset paths referenced by `image` must survive the base-URL prefix
  (`import.meta.env.BASE_URL`, cf. `NarrativeScreen.tsx:78`) on GitHub Pages
  (ADR-0001) — use the same interpolation, not absolute paths.
