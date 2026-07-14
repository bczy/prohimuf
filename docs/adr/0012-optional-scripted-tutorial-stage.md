# 0012 — Optional scripted tutorial stage before Rue Belliard

- **Status:** Accepted
- **Date:** 2026-07-11
- **Supersedes:** —
- **Amended by:** [ADR-0015](./0015-device-forked-tutorial-script.md) (D4 §2 — device-forked control panels),
  [ADR-0020](./0020-code-drawn-gesture-icons.md) (D5 — additive `gesture` illustration channel; "no generation" guarantee preserved)
- **Related:** [ADR-0002](./0002-cargo-delivery-core-loop-state.md) (deliveries),
  [ADR-0004](./0004-enemies-car-hostage-taker.md) (roster, unlock gate, `energy`),
  `docs/architecture.md`, `docs/diagrams/app-phase-flow.md`,
  `_bmad-output/guidelines/PROJECT_GUIDELINES.md` (scope guard).

## Context

muf currently has **no onboarding**. A new player lands on the level-select menu, launches
Rue Belliard, and must infer the core loop (`Récupérer → Livrer → Éviter`), the controls
(shoot, camera pan, mobile gestures), the shipped bestiary (window cops + the street
courier) and the HUD from a single line of oblique dialogue
("Les fenêtres, Muf. Les fenêtres." — `PRE_LEVEL_NARRATIVE.belliard`,
`src/game/systems/narrativeSystem.ts:13-21`). The original _Prohibition_ (Atari ST, 1987)
shipped with a printed manual; a browser game has none.

The strongest justification is **mobile control discoverability**. On desktop the scheme is
"aim + one action", learned in ~10s by design (guidelines §5, UX rule 5), so the desktop gap
is thin; but the mobile gestures — the two-axis swipe pan of ADR-0003/0008 — are not
discoverable at all. The bestiary/HUD panels are a secondary benefit, and V1 documents only
what is actually launchable today: window cops, the courier, the delivery loop and the base
HUD (see D4/D5). The drive-by car and hostage taker are roster-gated to future stories S2/S3
(`src/game/levels/levels.ts:56-58`; today Belliard runs `roster: { streetSpawns: ["courier"] }`
at `:59`), and the `energy` stat / hostage archetype are not yet in the engine (`EnemyKind`,
`src/game/types/enemy.ts:5`, is `"normal" | "riot" | "biker" | "civilian" | "bonus"`).

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
  `selectedLevel`/`buildHudInitial` seeds (`App.tsx:80-88`, currently
  `LEVELS[0] as unknown as LevelConfig` — a double cast forced by
  `noUncheckedIndexedAccess`), the `handlePlay` fallback (`App.tsx:172`), the Scores tab
  default (`MainMenu.tsx:171`), and — most sharply — the audio-tension effect
  `1 - hudData.timeRemaining / selectedLevel.timeSeconds` (`App.tsx:136-139`), which divides
  by `selectedLevel.timeSeconds` with **no phase guard**.
- `levelArt.consistency.test.ts:14-18` asserts `LEVELS` ↔ `levelArt.json` declare the exact
  same ordered `(id, name)` pairs; a tutorial entry has no backdrop art of its own.
- `stateMachine.test.ts:87-96` iterates **all** of `LEVELS` asserting
  `deliveries.length > 0` on every entry — a data-shape invariant that a `deliveries: []`
  tutorial entry would break outright.

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

A single tutorial entry is **prepended** to `LEVELS`, ahead of `belliard`. Because
`LevelConfig` (`src/game/levels/levels.ts:17-33`) requires more than the loop fields, the
entry must be **complete**, and it splits in two:

- **Diegetic, displayed fields (authored copy, _not_ inert)** — `id: "tutorial"`,
  `kind: "tutorial"`, `name: "Tutoriel"` (or an in-world title), plus a `district`/`year`
  set in the 1998-Paris fiction. `LevelCard` renders `level.name` and
  `level.district — level.year` (`src/render/ui/MainMenu.tsx:117,122`), so these carry weight
  on the card and must be written, not stubbed.
- **Inert gameplay fields, never read** — `enemiesToWin: 0`, `timeSeconds: 0`,
  `deliveries: []`, `enemySpeedMultiplier: 1`, `unlocked: true`. Every consumer branches on
  `kind` before touching them (D3); D2 additionally replaces the
  `enemySpeedMultiplier`-derived difficulty badge with a static `TUTORIEL` badge, so even
  that last read is bypassed.

Rationale: one ordered source of truth. The menu renders the tutorial first for free, and
`kind` keeps the existing three levels byte-for-byte untouched (absence = `"playable"`,
mirroring the `roster?` convention of ADR-0004 D2). Rejected alternative — a discriminated
union `LevelEntry = TutorialConfig | LevelConfig` — is semantically purer but forces type
narrowing on every existing `LEVELS` consumer for a single static entry; rejected
alternative — a hard-coded card outside `LEVELS` — creates a composite menu order that
"before Rue Belliard" would no longer be provable from data.

Helper for the "first playable" assumption: export a typed, **non-undefined**
`FIRST_PLAYABLE_LEVEL` from `levels.ts` (e.g. `LEVELS.find((l) => l.kind !== "tutorial")`
narrowed with an invariant, so `noUncheckedIndexedAccess` sees a `LevelConfig`, not
`LevelConfig | undefined`) and use it wherever `LEVELS[0]` currently stands in for Belliard:
the `selectedLevel`/`buildHudInitial` seeds (`App.tsx:80-88`) — which also **retires the
`LEVELS[0] as unknown as LevelConfig` double casts** — the `handlePlay` fallback
(`App.tsx:172`), the Scores tab default (`MainMenu.tsx:171`), and the audio-tension divisor
(`App.tsx:137`, see D3).

### D2 — Menu card: same `LevelCard` chassis, always unlocked, `TUTORIEL` badge, no stats

The tutorial reuses `LevelCard` (`src/render/ui/MainMenu.tsx:82-168`) with
`kind`-conditional rendering:

- **Always unlocked**, regardless of `muf_progress` / `unlockedLevels`. The `unlocked` prop
  is computed at the **call site** (`MainMenu.tsx:432`, today
  `unlocked={unlockedLevels.has(level.id)}`) → `level.kind === "tutorial" ||
unlockedLevels.has(level.id)`. `LevelCard` already gates its badge, its `⏱ / 🎯` stat row
  and its `MEILLEUR` best-score block behind `{unlocked && …}` (`MainMenu.tsx:128-165`), so
  the `kind` branch lives **inside** `LevelCard`: swap the `enemySpeedMultiplier`-derived
  difficulty badge for a static **`TUTORIEL`** badge and omit the stat/score rows (nothing to
  score).
- The level-select **default highlight/focus stays on `FIRST_PLAYABLE_LEVEL`** (Belliard),
  and the `TUTORIEL` badge reads as an optional/secondary affordance — the hurried player
  (guidelines §5, UX rule 1: launch → gameplay < 10s) must not be funnelled into the tutorial.
- The **Scores tab** filter (`MainMenu.tsx:177`) additionally requiring `kind !== "tutorial"`
  is **defense-in-depth, not a correctness requirement**: `unlockedLevels` can never contain
  `tutorial` (default `new Set(["belliard"])`, `levels.ts:124`; the unlock chain only ever
  targets index ≥ 1, D3), so the tutorial is already absent from the tab buttons.
  `saveScore`/`isHighScore` are never invoked for it (it never reaches the score-saving
  effect — see D3).

### D3 — Flow: a new `AppPhase` `"TUTORIAL"`; exit or skip returns to `MENU`

`App.tsx` (`src/render/scene/App.tsx`):

- `AppPhase` gains `"TUTORIAL"`. `handlePlay` branches first on
  `level.kind === "tutorial"` → `setAppPhase("TUTORIAL")`, bypassing
  `buildHudInitial`/`buildLevelParams`/`GameScene` entirely — no game state is created.
  **The tutorial branch must NOT call `setSelectedLevel`** (`App.tsx:174`): `selectedLevel`
  has to stay a playable level, or the un-guarded audio-tension effect
  `1 - hudData.timeRemaining / selectedLevel.timeSeconds` (`App.tsx:136-139`) divides by the
  tutorial's `timeSeconds: 0` and pushes **`NaN`** into `setTension`. For the same reason the
  initial `selectedLevel` seed (`App.tsx:80-88`) must be `FIRST_PLAYABLE_LEVEL`, **not**
  `LEVELS[0]` (now the tutorial). If a future refactor genuinely needs `selectedLevel` to
  hold the tutorial, that effect must first gain an `appPhase === "PLAYING"` (or
  `timeSeconds > 0`) guard — flagged here so it is not rediscovered as a runtime `NaN`.
- The `"TUTORIAL"` phase renders `NarrativeScreen` with the **`TUTORIAL_NARRATIVE`** scene
  (its own constant — never `PRE_LEVEL_NARRATIVE.tutorial`, see Gotchas), `showSkipButton`,
  and `onDone={handleBackToMenu}`. **Finishing and skipping both return to the menu**; the
  tutorial unlocks nothing (Belliard is already unlocked by default) and **writes nothing** to
  `muf_progress` or high scores. It is replayable at will.
- The index-based unlock chain (`LEVELS[currentIdx + 1]`, `App.tsx:148-153`) is only
  reached from gameplay (`LEVEL_COMPLETE`), which the tutorial never enters; completing
  Belliard (now index 1) still unlocks Stalingrad (index 2) — the relative `+1` logic is
  unaffected, and persistence is by **id**, so the chain survives the index shift. The
  regression coverage lands in **two halves**: (a) a pure `src/game` data invariant — the
  tutorial sits at index 0 and can be neither the _source_ nor the _target_ of a `+1` unlock;
  (b) a render/App-side guarantee that the `handlePlay` tutorial branch creates no game state
  and returns to `MENU`.
- Extend the preview harness so the render farm / `verify` skill can screenshot the tutorial
  without playing. This has **two moving parts, both required**: the phase-seed ternary
  (`App.tsx:74-76`, reading the `PREVIEW_SCREEN` parsed at `:31-32`) gains a
  `PREVIEW_SCREEN === "tutorial"` → `"TUTORIAL"` branch, **and** the hardcoded capture calls
  in `scripts/screenshot-preview.mjs:167-169` gain a `captureScreen(…, "?preview=tutorial")`.
  The per-level loop there (`screenshot-preview.mjs:157-164`) reads its list from
  `levelArt.json` (`:29`), not from `levels.ts`, so it will **never** reach the tutorial on
  its own — hence the explicit second call.

### D4 — Content: pure data in `src/game`, diegetic briefing voice, covering only what ships today

The script lives beside the existing narrative data as a `NarrativeScene`
(`TUTORIAL_NARRATIVE` in `src/game/systems/narrativeSystem.ts`) — pure data, zero
React/Three imports, per the boundary law. **V1 covers only mechanics present in a
launchable level today.** The sole default-launchable level, Belliard, runs window cops plus
a single street courier (`roster: { streetSpawns: ["courier"] }`, `levels.ts:59`). It covers,
in order:

1. **Core loop** — `Récupérer → Livrer → Éviter`: pick up the cargo, deliver it via the
   scripted delivery vehicle (ADR-0002), avoid the heat.
2. **Controls** — click/tap to shoot; camera pan (desktop edge/drag, **mobile two-axis
   swipe**, ADR-0003/0008 — the primary reason this stage exists). No fullscreen/pause copy:
   `Escape` on the narrative screen **advances** rather than pauses
   (`NarrativeScreen.tsx:57`), so a "pause" instruction here would be wrong, and the
   fullscreen toggle is an accessory, not part of the core loop.
3. **Enemies** — the window cops (legitimate targets) and the street courier (never shoot the
   livreur).
4. **HUD** — timer, lives, score, kill target, delivery window.

**Deferred to stories S2/S3, alongside the roster that introduces them:** the drive-by car,
the hostage taker and the `energy` stat get their tutorial panels only once those mechanics
ship (`levels.ts:56-58`; `EnemyKind` carries no hostage archetype today, `enemy.ts:5`).
Teaching them now would document mechanics absent from every launchable level — a YAGNI trap
and a scope-guard violation.

Voice: DISPATCH/KENZA briefing Muf in a **distinct briefing register** — informative, terse,
diegetic — **not** the oblique/atmospheric register of `PRE_LEVEL_NARRATIVE`
(`narrativeSystem.ts:13-21`, e.g. "Les fenêtres, Muf."), which never explains a rule. The
briefing stays fanzine in tone and well short of §8's out-of-scope "système de dialogue
élaboré": short imperative lines keyed one-per-panel, no branching, no state. French, like
all player-facing copy.

### D5 — Panels illustrated with shipped sprites where they exist, text-only otherwise

`NarrativeLine` gains an optional `image?: string` (path under `assets/`), and
`NarrativeScreen` renders it above the dialogue box when present. **Only art already in
`public/assets/` is referenced, and only where it actually exists:** window cops
(`enemy_sprite*.png`, `enemy_shooting*.png`, `enemy_riot*.png`, `enemy_biker*.png`), the
courier (`enemy_civilian.png`), the bonus (`enemy_bonus.png`), and the delivery-vehicle
sprites (`vehicles/{truck,car,moto}.png`). Panels with **no shipped sprite are text-only**
— the per-line `image?` being optional makes this free. Concretely, there is **no** drive-by
car sprite (`vehicles/car.png` is the _delivery_ vehicle, not a threat — do **not** repurpose
it), **no** hostage sprite, and **no** HUD image asset (the HUD is DOM/CSS in `HUD.tsx`; the
`hud_*` entries in `scripts/generate-game-assets.mjs` were never generated).

Consequently this stage triggers **no** Pollinations/FLUX generation, **no** CI render-farm
run and **no** lead-art gate. Rejected alternative — commissioning a fresh FLUX run for
car/hostage/HUD panels — reintroduces exactly the art gate this ADR avoids, for content whose
car/hostage half is itself deferred (D4). The extension stays additive: existing narrative
scenes omit `image` and render exactly as today (chroma-keyed sprites shown raw, without the
in-scene neon rim of ADR-0011 — slightly flatter than in play, acceptable for a briefing).

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
  must go through `FIRST_PLAYABLE_LEVEL` or filter on `kind` — the seeds, the `handlePlay`
  fallback, the Scores default, and most sharply the un-guarded tension divisor
  (`App.tsx:137`, `NaN` on divide-by-zero). This is the main regression surface of the change.
- The tutorial entry carries inert gameplay fields (`enemiesToWin: 0`, `timeSeconds: 0`,
  `deliveries: []`, `enemySpeedMultiplier: 1`) that type-check but are meaningless — while its
  `name`/`district`/`year` are _not_ inert (they render on the card, `MainMenu.tsx:117,122`,
  so they are authored copy). Acceptable debt for one static entry; revisit (union type) if a
  second non-playable stage ever appears.
- Tutorial copy duplicates knowledge that lives in systems (control mappings, enemy
  rules); when a mechanic changes, the tutorial text must be updated by hand.

**Gotchas to watch**

- `levelArt.consistency.test.ts:14-18` compares `LEVELS` ↔ `levelArt.json` as ordered
  `(id, name)` pairs (`.map((l) => ({ id, name }))`) — **not** ids alone: the tutorial has
  no backdrop entry, so the assertion must compare `LEVELS.filter((l) => l.kind !==
"tutorial")`. Do **not** add a dummy `levelArt.json` entry (it would ripple into the asset
  pipeline and prompt gates). The test's third case (`:30-37`, every delivery's
  `vehicleType` is declared) is already tutorial-safe: it loops `level.deliveries`, which is
  `[]` for the tutorial.
- `stateMachine.test.ts:87-96` ("every level parks its delivery stop…") iterates **all** of
  `LEVELS` and asserts `level.deliveries.length > 0` per entry — it fails outright on the
  tutorial's `deliveries: []`. It must be filtered to
  `LEVELS.filter((l) => l.kind !== "tutorial")` too. This is the invariant half of D3's
  regression coverage; CI fails loudly if the filter is forgotten.
- `GameScene.tsx:83` (`LEVELS.find((l) => l.id === levelId)?.roster`) is another `LEVELS`
  consumer, but safe: it looks up by id and only mounts for a playable level, so the tutorial
  (which never enters `GameScene`) is never matched. Listed for completeness.
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
