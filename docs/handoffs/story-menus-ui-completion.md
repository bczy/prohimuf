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

## stage-4. DEV (M3 component slice) — dev-r3f-render (Amelia) — 2026-07-20

- claim: the ADR-0052 §4/§5 Extract slice — shared `OptionsControls` (ballot/VU rows + a11y
  contract) consumed by BOTH `OptionsColophon` and `PauseScreen`, each keeping its own chrome.
  Structure + a11y + drift-kill only. Did NOT touch `prefsSystem.ts` (no `reducedMotion` row —
  that is wave-2's, per the reducedMotion-slice handoff above), `FlyerWall.tsx`, `App.tsx`.
- release:
  - NEW `src/render/ui/controls/BallotRow.tsx` (+ `.module.css`) — the reusable ballot primitive
    and **sole owner of the a11y contract**: `role="radiogroup"` + `aria-labelledby` (named from
    the visible row label) on the row, `role="radio"` + `aria-checked` on each box, ≥44×44px hit
    targets, `useRovingIndex` keyboard nav, X-stamp. Exported from the `controls` barrel.
  - NEW `src/render/ui/controls/VuMeter.tsx` (+ `.module.css`) — native `<input type=range>` under
    the print skin (keeps implicit `role=slider`), now with `aria-label`. Exported from the barrel.
  - NEW `src/render/ui/menu/OptionsControls.tsx` (+ `.module.css`) — the shared OPTIONS body:
    controlled (`prefs` + `onChange(patch)`), maps the single `Prefs` store → 5 rows (BRUITS DE
    RUE, LA SONO, VIES, PRESSION, TUBE CATHODIQUE). `runScopedNote?` renders the false-affordance
    caveat under VIES/PRESSION; `style`/`className` passthrough lets a host set `--ballot-stamp-bg`.
  - `OptionsColophon.tsx` — now renders `<OptionsControls>`; inline `BallotRow`/`VuMeter` removed;
    moved CSS out of its module. **Pixel-stable** (same rows/labels/order; default stamp bg = orange).
  - `PauseScreen.tsx` — **rebuilt options body**: killed the hand-rolled range `Slider` + on/off
    `Toggle` + leftover scanline `<div>`; now renders `<OptionsControls>` with the "prend effet à
    la prochaine partie" note and `--ballot-stamp-bg: var(--stock-shell)`. **Pause now shows the
    previously-missing VIES + PRESSION rows** and the canonical `TUBE CATHODIQUE` (was `ÉCRAN
CATHODIQUE`). Orphaned CSS (`.field/.fieldLabel/.slider/.toggle*`) removed.
  - `vitest.config.ts` — added the `@render` alias (present in vite/tsconfig, missing here) so the
    render lane can unit-test its own components. NEW `src/render/ui/menu/__tests__/OptionsControls.test.ts`
    (+8 tests via `renderToStaticMarkup`) pins the radiogroup/radio/aria-checked contract, the
    canonical label, native sliders, and the run-scoped note.
- verify: `yarn typecheck` clean · `yarn test` 851/851 (OptionsControls 8/8) · `yarn lint` clean · Prettier applied.
- HANDOFF → M2 `FlyerWall` lane: consume `BallotRow` from `@render/ui/controls` for the `PRESSION`
  header — the `role="radiogroup"` a11y contract comes for free (ADR-0052 §5). Props:
  `{ label, hint?, options: BallotChoice[], note? }`, `BallotChoice = { key, label, selected, onSelect }`.
- HANDOFF → M3 reducedMotion wave-2 lane: add a `MOUVEMENT RÉDUIT` `OUI/NON` ballot to
  `OptionsControls` (one `BallotRow`, grouped with `TUBE CATHODIQUE`) once `Prefs.reducedMotion`
  is wired through — this slice deliberately left it out. `OptionsControls` is controlled, so just
  extend the row map + the `Prefs` patch surface.

### M2 — difficulty separation (PRESSION promoted to NIVEAUX header) · `dev-r3f-render` (Amelia) · 2026-07-20

- start→finish: single lane, no boundary/dep/schema change (presentation/IA only), `src/game/**` byte-identical.
- File List:
  - `src/render/ui/menu/FlyerWall.tsx` — new required props `prefs` + `onSavePrefs`; renders a compact
    `PRESSION` `BallotRow` header (label + hint identical to OptionsControls) above the flyer grid,
    wrapped in a `.muf-pression-header` div. Exports a pure `buildPressionChoices(prefs, onSavePrefs)`
    helper: `selected` reads straight from `prefs.difficulty` (no local copy — single source of truth),
    each `onSelect` writes `{ ...prefs, difficulty }` through `onSavePrefs`.
  - `src/render/ui/menu/FlyerWall.module.css` — NEW `.pressionHeader` (wall-aligned padding,
    `--ballot-stamp-bg: var(--stock-shell)` to match the shell backing, same override PauseScreen makes).
  - device gating (Option A): the existing `SHORT_LANDSCAPE_MEDIA` `<style>` block gains a
    `.muf-pression-header { display: none; }` rule — same CSS-class chrome-gating primitive the wall
    already uses for its rack reflow and MainMenu uses for its masthead. Header hidden on short-landscape;
    PRESSION stays reachable via OPTIONS there (documented non-regression). Budget untouched in the gated breakpoint.
  - `src/render/ui/MainMenu.tsx` — threads its existing `prefs`/`onSavePrefs` (App-owned store) into
    `FlyerWall`. App is the single source of truth; FlyerWall reads the prop directly (no duplicated state),
    so the header and the OptionsColophon `PRESSION` row can never diverge.
  - NEW `src/render/ui/menu/__tests__/FlyerWall.test.ts` (7 tests) — a11y contract (1 radiogroup named from
    label, 3 radio + aria-checked, exactly one checked matching `prefs.difficulty`), Option-A gating class +
    `display:none` under `SHORT_LANDSCAPE_MEDIA`, and the single-pref write-through via `buildPressionChoices`.
- OptionsColophon / OptionsControls / PauseScreen: NOT touched (M2 leaves PRESSION in OPTIONS; the header is a
  second access point to the same field). Difficulty labels defined locally from the `Prefs["difficulty"]`
  union since OptionsControls does not export them.
- verify: `yarn typecheck` clean · `yarn test` 858/858 (FlyerWall 7/7) · `yarn lint` clean · Prettier applied.

## stage-4. DEV (M1 render slice + App.tsx phase wiring) — dev-r3f-render (Amelia) — 2026-07-20

- claim: the render side of M1 — the `NAME_ENTRY` `AppPhase` + screen, the deferred-save
  wiring in `App.tsx`, and the `resolveDisplayName` byline in `ScoresUne`. Consumes the pure
  API shipped by the M1 pure-logic slice; did NOT touch `src/game`, `prefsSystem`, `FlyerWall`,
  `OptionsColophon`/`OptionsControls`/`PauseScreen` (other lanes).
- release:
  - NEW `src/render/ui/NameEntryScreen.tsx` (+ `.module.css`) — the typed byline on the
    PARIS-MINUIT UNE (reuses `PaperSheet`/newsprint/rose + masthead register). Native `<input>`
    (`maxLength=16`, live `sanitizeName`, pre-filled from `loadPlayerName()`), `[ SIGNER ]`
    submit + `[ PASSER ]` skip, Enter submits / Escape skips, label↔input association,
    focus-on-mount + select, ≥44px targets, scroll-safe for the mobile on-screen keyboard.
  - `src/render/scene/App.tsx` — new `NAME_ENTRY` `AppPhase` (render-layer only, NO `src/game`
    stateMachine/levels touch). Save deferred: the `GAME_OVER`/`LEVEL_COMPLETE` effect now HOLDS
    `{score,wave,date}` in `pendingScore` when `isHighScore` is true and calls `saveScore`
    exactly once on submit/skip (name attached on submit via `savePlayerName`+`saveScore`,
    omitted on skip); non-high-score path saves immediately, byte-identical to before. Routing:
    `NARRATIVE_POST → NAME_ENTRY → END`, else `NAME_ENTRY → END`, else `→ END`. **Next-level
    unlock untouched — fires on today's schedule, never gated behind the name.** Added
    `?preview=nameentry` harness hook (mirrors `?preview=end`).
  - `src/render/ui/menu/ScoresUne.tsx` (+ `.module.css`) — each classement row shows a
    `resolveDisplayName(s.name)` byline under the score; the lead-story kicker shows the top
    signer. Legacy/skipped rows show `ANONYME`, never a blank cell.
  - NEW `src/render/ui/__tests__/NameEntryScreen.test.ts` (+10: a11y contract via
    `renderToStaticMarkup` + focus/submit/skip via `react-dom/client`+`act`) and NEW
    `src/render/ui/menu/__tests__/ScoresUne.test.ts` (+3: signed name / legacy-ANONYME fallback).
- verify: `yarn typecheck` clean · `yarn test` 871/871 (new: 13/13) · `yarn lint` clean · Prettier applied.
- File List: `src/render/ui/NameEntryScreen.tsx`, `src/render/ui/NameEntryScreen.module.css`,
  `src/render/scene/App.tsx`, `src/render/ui/menu/ScoresUne.tsx`, `src/render/ui/menu/ScoresUne.module.css`,
  `src/render/ui/__tests__/NameEntryScreen.test.ts`, `src/render/ui/menu/__tests__/ScoresUne.test.ts`.
- FLAG → senior-architect / game-designer (playtest): the input uses live `sanitizeName` per the
  contract; its outer `.trim()` per keystroke means an internal space typed left-to-right (e.g.
  "DJ MEHDI") collapses (the space is trailing at that instant). Pasting a spaced name works, and
  the pure layer sanitises on save regardless, so the leaderboard is never corrupted. If spaced
  bylines must be typeable, the one-line fix is a live control-strip+clamp that defers the trim to
  submit — flagged rather than unilaterally deviating from the "live sanitizeName" instruction.
