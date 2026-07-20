# Hand-offs — menus/UI-completion cycle (epic-menus-ui-completion: M1, M2, M3 + UX spec)

Covers the epic-level DESIGN GATE run before lane split. `producer` may shard per-story
(M1/M2/M3) at sprint planning; this block is the design-gate record for all three.

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20

- claim: gate the menus/UI-completion cycle — epic + 3 PM stories (M1 name-entry, M2
  difficulty-separation, M3 a11y-consolidation) + UX spec `spec-menus-ui-completion.md`;
  resolve 7 open questions from both lanes.
- release: verdict doc `docs/game-design/design-gate-menus-ui-completion.md`; index updated
  (`docs/game-design/README.md`); surgical edits applied to M1 (input length ≤16 + Q1/Q2
  decisions), M2 (file-map corrected: keep PRESSION in OPTIONS + add NIVEAUX header, not
  removal/new rubrique; VIES stays in OPTIONS), UX spec (Q7 single-flag heuristic, Q3 Option A
  chosen, §6 all resolved). 7 decisions: Q1 native byline / Q2 `NAME_ENTRY` after
  `NARRATIVE_POST` / Q3 promoted NIVEAUX PRESSION header + Option A / Q4 S0.1-owns-schema
  sequencing / Q5 `reducedMotion` default false + live-union / Q6 outcome-contract boundary /
  Q7 `muf_seen_tutorial_nudge`. File List: see verdict doc §Edits.
- VERDICT: PASS — design gate: epic-menus-ui-completion (lead-game-designer)
- VERDICT: PASS — design gate: story-highscore-name-entry M1 (lead-game-designer)
- VERDICT: PASS — design gate: story-difficulty-modifiers-separation M2 (lead-game-designer)
- VERDICT: PASS — design gate: story-accessibility-settings-consolidation M3 (lead-game-designer)
- VERDICT: PASS — design gate: ux/spec-menus-ui-completion (lead-game-designer)

Conditions/routes (not blockers): M3 PASS conditional on the Q5 live-union semantics.
`story-timer-duel-telegraph.md` AC13 (other epic, socle-fidélité) must be reconciled from
seed-once to the union model before either story ships — routed to `game-designer` +
`senior-architect` (authority ADR). Next stage → `senior-architect` lane cut + scope ADR;
sequence M2 & M3 on shared `OptionsColophon.tsx`/`PauseScreen.tsx`.

## stage-3. LANE CUT — senior-architect (Winston) — 2026-07-20

- claim: turn the gated cycle into a buildable lane split + scope/contract ADR.
- release: **ADR-0052** (`docs/adr/0052-menus-ui-completion-scope-and-contracts.md`, Accepted)
  — scope verdicts, `NAME_ENTRY` phase + deferred-save contract, `reducedMotion` live-union
  authority, OPTIONS/PAUSE extract-a-shared-component call, M2/M3 sequencing. Index
  regenerated. Number self-allocated via `adr-new` (no producer number pre-recorded);
  re-check at merge.

### Lanes

**M1 — high-score name entry** (cross-boundary; run the two lanes in parallel, integrate at App.tsx)

- `dev-gameplay` (pure, TDD): `src/game/systems/highScoreSystem.ts` — `ScoreEntry.name?: string`,
  tolerant `isValidEntry` (legacy blobs load), `saveScore` accepts name, ≤16+trim+plain-text
  clamp in the pure layer; new pure `muf_player_name` serializer (identity, not `Prefs`).
- `dev-r3f-render`: new `src/render/ui/HighScoreEntry.tsx` (reuses `print/` primitives);
  `src/render/ui/menu/ScoresUne.tsx` renders `name`/fallback.
- **Shared seam → `src/render/scene/App.tsx` phase machine** (owner: `dev-r3f-render`, architect
  sign-off): add `NAME_ENTRY` `AppPhase` (render-layer only, NO `src/game` stateMachine/levels
  touch), defer the single `saveScore()` behind the phase, unlock side-effect untouched.

**M2 — difficulty separation** (`dev-r3f-render` only, XS)

- `src/render/ui/menu/FlyerWall.tsx` — new `PRESSION` ballot header (reuses shared ballot
  primitive + `Prefs.difficulty`/`onSave`; `role=radiogroup`; gated OFF under `SHORT_LANDSCAPE`).
- Does **not** modify `OptionsColophon`/`PauseScreen` (PRESSION/VIES stay). No `MainMenu` rubrique.

**M3 — accessibility consolidation** (cross-boundary)

- `dev-gameplay` (pure, TDD): `src/game/systems/prefsSystem.ts` — `reducedMotion` field
  (**only if S0.1 hasn't landed it** — single-owner rule below).
- `dev-r3f-render`: extract shared `OptionsControls` (ballot/VU rows + `role=radiogroup`/
  `aria-checked`/≥44px a11y on the ballot primitive) consumed by `OptionsColophon` +
  `PauseScreen`; rebuild Pause body (adds VIES/PRESSION + false-affordance note), CRT+reduced-
  motion under one AFFICHAGE/ACCESSIBILITÉ heading, close CRT-toggle a11y debt; `CrtPass`/`print`
  read the shared derived signal (ADR-0052).

### Shared seams to serialise

- **`App.tsx` phase machine** — M1 only (M2/M3 don't touch it).
- **`OptionsColophon.tsx` / `PauseScreen.tsx` / shared ballot primitive** — M3 territory; M2 only
  _reuses_ the ballot primitive in `FlyerWall`.

### Sequencing rule

- **M3 component slice BEFORE M2.** M3 lands the shared `OptionsControls` + ballot-primitive a11y
  contract (`role=radiogroup`/`aria-checked`/44px) FIRST — this slice touches
  `OptionsColophon`/`PauseScreen`/the primitive, **not `prefsSystem.ts`**, so it is independent of
  the reducedMotion schema and the S0.1 cross-epic dependency, and can land early. M2 then builds
  its `PRESSION` header on that a11y-correct shared component (no throwaway inline ballot, no
  cross-lane a11y smudge). M3's `reducedMotion` slice runs on its own track (never touches M2's
  files) — may land before or after M2.
- M1 is independent of M2/M3 — run in parallel.

### Cross-epic dependency

- **`Prefs.reducedMotion` single-owner** vs `story-timer-duel-telegraph` (S0.1, socle-fidélité):
  first lane into `prefsSystem.ts` owns the schema addition + logs the claim here; the other
  rebases. **Default owner = S0.1.** M3 always owns consolidation + CRT-toggle a11y debt
  regardless of order. **Blocker:** S0.1 AC13 must be amended seed-once → union model (routed to
  `game-designer`) before either ships; S0.1's AIMING/shake ADR references ADR-0052 for the
  authority, does not re-decide it.
- HANDOFF → `producer`: schedule M3-component-slice → M2; enforce the single-owner claim.

## stage-4. DEV (M3 reducedMotion slice) — dev-gameplay (Amelia) — 2026-07-20

- **SINGLE-OWNER CLAIM:** M3 lands the `Prefs.reducedMotion` schema addition in
  `prefsSystem.ts` first (S0.1 `story-timer-duel-telegraph` had not touched the file — grep
  confirmed `reducedMotion` absent before this change). S0.1 now **rebases** — consumes the
  shipped field, does not re-add it.
- claim: pure-logic side of M3 — `Prefs.reducedMotion` field + migration + TDD, per ADR-0052 §3.
- release: `src/game/systems/prefsSystem.ts` (field on `Prefs`, `DEFAULT_PREFS.reducedMotion:
false`, boolean-tolerant migration in `loadPrefs`); `src/game/systems/__tests__/prefsSystem.test.ts`
  (+5 tests). **Per ADR-0052 (supersedes story text outcome-b seed-once):** default `false`,
  **no seed-from-OS** — `prefsSystem` stays a pure reducer/serializer, no `matchMedia`. Legacy
  blobs without the field load as `reducedMotion: false`. The LIVE-UNION `prefs || OS` is the
  render/bridge lane's job (wave-2), NOT here.
- verify: `yarn typecheck` clean · `yarn test --run` 821/821 (prefsSystem 16/16) · `yarn lint` clean.
- File List: `src/game/systems/prefsSystem.ts`, `src/game/systems/__tests__/prefsSystem.test.ts`.
- HANDOFF → `dev-r3f-render` (wave-2 wiring): `Prefs.reducedMotion: boolean` (default `false`)
  is persisted in the `muf_prefs` blob. Build the shared derived signal `prefs.reducedMotion || OS`
  at the bridge edge (resolve `matchMedia` there) + the toggle row grouped with CRT.

## stage-4. DEV (M1 pure-logic slice) — dev-gameplay (Amelia) — 2026-07-20

- claim: pure side of M1 — `ScoreEntry.name`, sanitizer, deferred-save seam, `muf_player_name`
  serializer; TDD. Did NOT touch `src/render`/`src/hooks`/`prefsSystem.ts` (M3 lane owns it).
- release: `src/game/systems/highScoreSystem.ts` — `ScoreEntry.name?: string` (optional on read);
  tolerant `isValidEntry` (legacy blobs without `name` load; corrupt non-string `name` drops the
  row only); `saveScore` sanitises + omits empty `name` (skip = byte-identical to legacy); new pure
  `sanitizeName` (strip control chars → trim → clamp `MAX_NAME_LENGTH=16` → trim), `resolveDisplayName`
  (single fallback seam → `ANONYMOUS_NAME = "ANONYME"`, narrative-owned copy slot), `loadPlayerName`/
  `savePlayerName` (`muf_player_name` plain-string key, mirrors the `muf_progress` idiom).
  `src/game/systems/__tests__/highScoreSystem.test.ts` (+18 tests, 12→30).
- verify: `yarn typecheck` clean · `yarn test` 843/843 (highScoreSystem 30/30) · `yarn lint` clean.
- File List: `src/game/systems/highScoreSystem.ts`, `src/game/systems/__tests__/highScoreSystem.test.ts`.
- HANDOFF → `dev-r3f-render` (wave-2 wiring, `App.tsx`): the current auto-save is `App.tsx:228`
  (`saveScore(...)` inside the `GAME_OVER`/`LEVEL_COMPLETE` effect, `App.tsx:213-249`, guarded by
  `isShippedLevel`, 226-237). When `isHighScore(selectedLevel.id, hudData.score)` is true, do NOT
  call `saveScore` at :228 — route to `NAME_ENTRY`, hold `{score,wave,date}`, and call
  `saveScore(levelId, { score, wave, date, name })` **exactly once** on resolution (submit/skip).
  Pure API to call: `sanitizeName(raw)` (live input clamp), `resolveDisplayName(name)` (ScoresUne
  row + entry lead-story display), `loadPlayerName()` (pre-fill), `savePlayerName(name)` (persist
  last byline on submit). The next-level unlock (`App.tsx:230-236`) stays on today's schedule —
  never gate it behind the name.
