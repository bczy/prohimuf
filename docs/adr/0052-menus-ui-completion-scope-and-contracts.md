# 0052 — Menus/UI completion scope, `NAME_ENTRY` phase, `reducedMotion` live-union authority, and the OPTIONS/PAUSE shared-options contract

- **Status:** Accepted
- **Date:** 2026-07-20
- **Number:** 0052, allocated via the `adr-new` skill during the `senior-architect` lane
  cut for `epic-menus-ui-completion` (no `producer` number was pre-recorded in
  `docs/handoffs/story-menus-ui-completion.md`; self-allocated as max+1 over local files,
  the index, and `origin/main`, same posture as ADR-0038/0039). Re-check at merge.

## Context

The `menus/UI-completion` cycle (`epic-menus-ui-completion`) audited `src/render/ui` against
the shipped game and scoped three stories past the `lead-game-designer` design gate
(`docs/game-design/design-gate-menus-ui-completion.md`, 2026-07-20, PASS — 7 decisions
ratified):

- **M1** `story-highscore-name-entry` — sign a qualifying high score.
- **M2** `story-difficulty-modifiers-separation` — promote the `PRESSION` (difficulty) dial
  out of the buried OPTIONS row into the `NIVEAUX` browse.
- **M3** `story-accessibility-settings-consolidation` — add a persisted reduced-motion
  escape hatch and consolidate the OPTIONS/PAUSE surfaces into one coherent system.

Three forces make this an architecture decision, not just three feature tickets:

1. **A schema/phase change crossing the game↔render↔bridge boundary** (M1: `ScoreEntry.name`
   - a new phase + a deferred save).
2. **A cross-epic contract collision.** M3 and the queued `story-timer-duel-telegraph`
   (`S0.1`, epic `socle-fidélité`) both add `Prefs.reducedMotion` + a toggle, and they
   currently specify _contradictory semantics_ (S0.1 AC13 = seed-once-from-OS-then-persist;
   M3/UX = live union). Two authorities for one accessibility concept is exactly the DRY
   failure PROJECT*GUIDELINES forbids ("une seule source de vérité par concept"), and one of
   the two models can end up \_weaker* than the live OS setting.
3. **A shared UI surface (`OptionsColophon.tsx`/`PauseScreen.tsx`) that has already drifted**
   — divergent labels (`ÉCRAN CATHODIQUE` vs `TUBE CATHODIQUE` for the same `Prefs.crt`),
   missing rows in Pause, and no `aria` state on either — and that M2 and M3 both touch.

The design gate explicitly routed the scope ratification, the `reducedMotion` authority
call, the embed-vs-extract component boundary (Q6), and the M2/M3 sequencing to
`senior-architect`. This ADR records those calls so no lane re-litigates them.

## Decision

### 1. Scope verdicts (ratified — closed, not re-openable without a new ADR)

| Item                               | Verdict                                 | Basis                                                                                                                                                                                                            |
| ---------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 high-score name entry           | **[FIDÈLE]**                            | Arcade high-score lineage; PROJECT_GUIDELINES §8 scopes "leaderboard". Finishes a feature already ¾ built (`isHighScore` computed, `ScoresUne` rendered).                                                        |
| M2 difficulty separation           | **[FIDÈLE]**                            | §8 scopes "niveaux de difficulté"; the lever exists (`DIFFICULTY_CONFIG`), only its _visibility_ moves.                                                                                                          |
| M3 accessibility consolidation     | **[EXTENSION] (conscious, documented)** | Reduced-motion is a 2020s WCAG practice Prohibition predates; justified — widens _who can play_ without touching `Récupérer → Livrer → Éviter`. Same category already justified in `story-timer-duel-telegraph`. |
| Controller remapping UI            | **REJECTED**                            | No keybinding scheme exists — controls are "déplacement + une action" (§5 rule 5). Config for a scheme that doesn't exist (YAGNI). Revisit only if a rebindable-input path ships.                                |
| Online / server-backed leaderboard | **REJECTED**                            | §8 lists "Backend / serveur / base de données" out of scope. The local per-device `PARIS-MINUIT` UNE is the in-scope "leaderboard narratif". Hard reject, not a sizing call.                                     |

Two audit gaps were already closed by the shipped pre-game redesign (ADR-0021) and need no
story: the **tutorial entry point** (now a first-class always-unlocked flyer in `FlyerWall`)
and **settings-complet** (OPTIONS substantially shipped; the only real hole was
accessibility, now M3). M3/UX only adds first-_visit_ discoverability (one flag,
`muf_seen_tutorial_nudge`) — not a new tutorial flow.

### 2. `NAME_ENTRY` — new render-layer `AppPhase`, single deferred save

- **`NAME_ENTRY` is a new `AppPhase` value**, inserted `NARRATIVE_POST → NAME_ENTRY →
EndScreen`, only when `isHighScore(levelId, score)` is true. It is a **render/bridge-layer
  phase**, added the same way `TITLE`/`TUTORIAL`/`NARRATIVE_POST` were — **no `src/game`
  `stateMachine.ts`/`levels.ts` touch**. The non-high-score path stays byte-identical to
  today (silent save, straight to `EndScreen`).
- **The save is deferred, not duplicated.** The `App.tsx` effect that today calls
  `saveScore()` immediately on `GAME_OVER`/`LEVEL_COMPLETE` (`App.tsx:226-228`) instead
  **holds** the `{score, wave, date}` triple when `isHighScore` is true and calls
  `saveScore()` **exactly once**, name attached, after `NAME_ENTRY` resolves (submit _or_
  skip). Contract: **one save, name attached-or-fallback, never two writes to
  `muf_scores_<id>`.**
- **The next-level unlock side-effect is unaffected** — it fires on today's schedule, never
  gated behind typing a name.
- **Persistence stays pure in `src/game`.** `ScoreEntry` gains `name?: string` (optional on
  read); `isValidEntry` stays tolerant so legacy blobs without a name load and render a
  fallback (`ANONYME`/`SANS NOM`, narrative-owned). Length-clamp (≤16, no minimum) + trim +
  plain-text guarantee are enforced in the pure layer. The `muf_player_name` convenience key
  (last-used byline, distinct from `Prefs` — it is identity, not a setting) is a pure
  serializer in `src/game`, read/written at the bridge edge like the other `localStorage`
  serializers. **No React/Three in the save path.**

### 3. `Prefs.reducedMotion` — default `false`, LIVE-UNION, single derived signal (canonical)

- **Default `false`** — default `true` would mute the Paper-Mario motion identity (§5,
  load-bearing) for every new player; the OS half of the union still covers OS-reduce users
  out of the box.
- **Semantics = live union, not seed-once.** Effective reduced motion =
  `prefs.reducedMotion === true` **OR** the live `prefers-reduced-motion: reduce` OS query,
  computed as **one shared derived signal at the render/bridge edge** and read by every
  consumer (`CrtPass`, the `print/` primitives, and — once it ships — shake/hitstop). This
  is the only model that holds the invariant **"the toggle may strengthen reduced motion but
  must never weaken a live OS `reduce`."** The seed-once model (S0.1 AC13) can go weaker than
  the live OS setting (seed `true` → player toggles `false` → motion runs while the OS asks
  for reduce) — it is **superseded**.
- **`src/game` boundary:** `prefsSystem.ts` stays a pure reducer/serializer — it never calls
  `window.matchMedia`. The OS boolean is resolved at the bridge/render edge and fed into the
  derived signal; `Prefs.reducedMotion` is just a persisted boolean field.
- **`CrtPass` authority (resolves the S0.1 `[GATE-FLAG]`):** `CrtPass.tsx` stops polling
  `matchMedia` on its own and **reads the shared derived signal** — one owner of "is motion
  reduced right now", not two. The `print/` primitives and `base.css` motion-zeroing extend
  to the same union (the existing `@media` block keeps working; a `data-reduced-motion`
  attribute driven by `prefs.reducedMotion` is the second trigger). Any consumer that must
  stay independent must document why against this ADR — the default is: consume the signal.
- **AC13 must be amended before either story ships.** `story-timer-duel-telegraph` AC13 is
  reconciled to the union model (drop seed-once; default `false`; OS is a live input to the
  shared signal) — routed to `game-designer`. S0.1's own AIMING/shake ADR **references this
  ADR for the reducedMotion authority rather than re-deciding it**, so the authority lives in
  exactly one place.

**Single-owner rule for the `prefsSystem.ts` schema (avoids two lanes adding the field
twice).** Whichever of {`S0.1`, `M3`} opens a `prefsSystem.ts` lane first **owns the
`reducedMotion` schema addition** (field + `DEFAULT_PREFS` + seed/migrate-once path + TDD)
and logs the claim in `docs/handoffs/`. Default expectation = **S0.1 owns it** (it fully
specs the field, the WCAG flash cap, and mandates the authority ADR). The other story
**rebases** — consumes the shipped field, does not re-add it. **Regardless of order, M3
always owns the consolidation deliverable** (grouping CRT + reduced-motion under one
"AFFICHAGE / ACCESSIBILITÉ" heading, rebuilding Pause's options body to match, closing the
pre-existing CRT toggle's `aria-pressed`/44px debt).

### 4. OPTIONS/PAUSE — **extract a shared options-body component** (my embed-vs-extract call)

The gate (Q6) fixed the _outcome_ — Pause's options body and the Menu OPTIONS colophon must
expose the **same field set, same char-for-char labels (`TUBE CATHODIQUE` canonical), same
ballot/VU visual system, same a11y contract** (`role="radiogroup"`/`role="radio"` +
`aria-checked`, ≥44px) — plus the false-affordance "prend effet à la prochaine partie" note
under `VIES`/`PRESSION` in Pause. It left the component boundary to me.

**Decision: extract, do not embed and do not duplicate.** The shared ballot/VU rows + their
a11y contract become one component (e.g. `OptionsControls`, co-located with the ballot
primitives), consumed by **both** `OptionsColophon` and `PauseScreen`. Each host keeps its
own outer chrome (colophon masthead / orange back-page _ours_ vs the pause modal frame with
REPRENDRE/RETOUR) and supplies its own row config (Pause adds the false-affordance note).

Rationale — **DRY wins here specifically because duplication has already cost us**: the
current two divergent implementations drifted into a label mismatch, missing rows, and a
missing a11y contract. That is demonstrated divergence, not speculative flexibility, so the
extraction is _not_ a Karpathy-guideline over-abstraction — it is the fix for an observed
bug class. **Embedding the whole `OptionsColophon` inside `PauseScreen` is rejected**: it
would drag the colophon's masthead/stock chrome into the modal and couple the two hosts'
layouts. The a11y upgrade (`role=radiogroup`/`aria-checked`/44px) lands on the **shared
ballot primitive** so every consumer inherits it once.

### 5. M2/M3 sequencing on the shared seam → **M3-component-slice before M2**

M2's corrected file map does **not** modify `OptionsColophon`/`PauseScreen` (PRESSION/VIES
stay there); it adds a `PRESSION` ballot header in `FlyerWall` that **reuses the same ballot
primitive** and must carry the same `role="radiogroup"` a11y contract (UX §5). The binding
constraint is therefore the **shared ballot primitive's a11y contract, owned by M3**.

- **M3's component + ballot-primitive a11y slice lands first.** This slice touches
  `OptionsColophon`/`PauseScreen`/the shared ballot primitive — **not `prefsSystem.ts`** — so
  it is **independent of the reducedMotion schema question and the S0.1 cross-epic
  dependency**. It can land early.
- **M2 lands after**, building the `NIVEAUX` `PRESSION` header on the now-shared,
  a11y-correct ballot component — inheriting the contract for free, with no throwaway inline
  ballot for M3 to retrofit and no cross-lane a11y-ownership smudge.
- **M3's reducedMotion slice** (`prefsSystem.ts` schema + toggle) runs on its own track under
  the single-owner rule above; it never touches files M2 touches, so it may land before or
  after M2.

This keeps the XS, dependency-free M2 from being held hostage to M3's cross-epic schema
entanglement while still guaranteeing M2 never ships a half-a11y ballot.

## Consequences

**Positive**

- The `reducedMotion` concept has exactly one authority (the shared derived signal) across
  two epics; the "never weaker than OS" accessibility invariant is structurally guaranteed.
- The OPTIONS/PAUSE label/a11y drift becomes impossible to reintroduce — one component owns
  labels, controls, and the `radiogroup` contract.
- M1's save path stays pure and single-write; legacy score blobs keep loading.
- M2 (XS, ready) is not blocked on the S0.1 cross-epic dependency — only on M3's
  dependency-free component slice.

**Negative / cost**

- One new shared component and a ballot-primitive a11y refactor before M2 can consume it —
  a real serialisation point that `producer` must schedule (M3-component-slice → M2).
- `story-timer-duel-telegraph` AC13 **must be amended to the union model before either story
  ships** — a required edit to an in-flight story of another epic (routed to
  `game-designer`). If S0.1 ships its seed-once AC13 unamended, this ADR is violated.

**Gotchas to watch**

- **Single-owner claim must be logged.** The first lane into `prefsSystem.ts` logs the
  `reducedMotion` schema claim in `docs/handoffs/`; the other rebases. Default owner = S0.1.
- **S0.1's AIMING/shake ADR must reference (not duplicate) this ADR** for the reducedMotion
  authority — otherwise the two-authority DRY problem re-appears one layer up.
- **Pause gains `VIES`/`PRESSION`** (with the false-affordance note) as part of M3's
  consolidation — this supersedes the earlier epic-audit framing that Pause "correctly omits"
  them. M2 still does not touch Pause; the Pause row additions are M3's.
- `NAME_ENTRY` is render-layer only — reviewers must reject any PR that adds it to the
  `src/game` `stateMachine` or reads `isHighScore`/`localStorage` from inside `src/game/`
  render code.
