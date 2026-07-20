# Story — High-score name entry (`M1`)

**Epic:** `epic-menus-ui-completion` · **Sequence:** M1 · **Type:** feature completion,
cross-boundary (game schema + render screen + bridge wiring in `App.tsx`).

## Why

Prohibition-lineage arcade games close the loop on a good run by letting the player sign
it — the score means nothing on the wall of fame if nobody knows whose it is. Today `muf`
computes `isHighScore` every frame (`App.tsx:439`) and shows a live `★HI` flag during play
(`ScoreReadout.tsx`), but at the moment that actually matters — `GAME_OVER`/`LEVEL_COMPLETE`
— the score silently auto-saves anonymously (`App.tsx:226-228`, `saveScore(...)` with no
name) and `EndScreen.tsx` never even reads the `isHighScore` flag it was handed. The
PARIS-MINUIT leaderboard (`ScoresUne.tsx`) already renders a "classement" — every row today
is nameless. This story closes the loop the feature was built for.

## Cahier des charges check

> "Did Prohibition Atari ST have high-score name entry?"

**[FIDÈLE]** — arcade high-score initials entry is one of the most standard conventions of
the era Prohibition belongs to, and PROJECT_GUIDELINES §8 explicitly scopes "leaderboard" as
in-scope, full-feature-set-original. This story does not invent a feature; it finishes one
that is already three-quarters built (`isHighScore` computed, leaderboard rendered) but
missing its one interactive step.

## Scope (V1)

- Extend `ScoreEntry` with a `name` field (or the fanzine-native equivalent the design loop
  confirms — see epic open question #1), persisted through the existing `muf_scores_<id>`
  `localStorage` key. Legacy entries without a name must still load and render (empty/blank
  name, not a crash — mirrors the existing `isValidEntry` tolerant-parse pattern).
- A new, skippable entry step, reached only when `isHighScore` is true at the moment the
  score is about to save. Single short text input (**max 16 chars, no minimum** — gate ruling
  2026-07-20, reuses the already-gated `[CREW_NAME]` budget so the byline shares the visual
  register of the crew names on the flyers; an empty field submits the anonymous fallback),
  fanzine-styled (reuses `print/` tokens/primitives, not a bespoke look). Form ratified by the
  gate: a **native `<input>` typewriter byline on the PARIS-MINUIT UNE**, not a 3-initial
  arcade wheel (gate Q1, see `docs/game-design/design-gate-menus-ui-completion.md`).
- Wiring: `App.tsx` must not call `saveScore` before the name is captured (today it saves
  immediately on the `GAME_OVER`/`LEVEL_COMPLETE` effect) — the entry step, when triggered,
  gates the save; when not a high score, behavior is byte-identical to today (auto-save,
  straight to `END`).
- The score is saved with a name even if the player skips/times out entry — reuse whatever
  the anonymous placeholder already reads as in the fanzine voice (e.g. "ANONYME" /
  "SANS NOM"), not a raw empty string in the UI (though the stored field may be empty).

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | A run ends (`GAME_OVER` or `LEVEL_COMPLETE`) and the score qualifies as a high score for that level (`isHighScore(levelId, score)` true) | The end-of-run flow runs | The player is shown a name-entry step before the score is persisted; the step is skippable in one action (consistent with PROJECT_GUIDELINES §5 rule 3, cutscenes/screens skippable). |
| AC2 | A run ends and the score does NOT qualify as a high score | The end-of-run flow runs | Behavior is unchanged from today: no entry step, score saves silently (anonymous), straight to `EndScreen`. |
| AC3 | The player types a name and confirms | The score saves | `ScoreEntry.name` (or confirmed field name) persists in `localStorage` under the existing `muf_scores_<levelId>` key; `ScoresUne.tsx`'s classement renders that name in the row. |
| AC4 | The player skips/times out the entry step | The score saves | The score still persists (never dropped), with a fanzine-voiced anonymous placeholder shown in the leaderboard row — never a raw blank cell, never a crash. |
| AC5 | A `muf_scores_<levelId>` blob written before this story ships (no `name` field) | `ScoresUne.tsx` loads it | It still renders without crashing (existing `isValidEntry` tolerant-parse pattern extended, not replaced) — the anonymous placeholder shows for legacy entries missing a name. |
| AC6 | The name-entry input | The player types | Input is clamped to **≤16 chars (gate ruling 2026-07-20, matching the gated `[CREW_NAME]` budget), no minimum** — an empty/whitespace-only field submits the anonymous fallback (AC4). It cannot submit control characters/HTML that would break the leaderboard row's plain-text rendering (trim + length-clamp is enough — no rich text, no HTML). |
| AC7 | Keyboard-only or touch-only player reaches the entry step | They interact | The input and its confirm/skip actions are reachable and operable without a mouse (tab order / touch target ≥44×44px), consistent with the roving-focus pattern already used across `print/` surfaces (`useRovingIndex`, `SelectableListItem`). |
| AC8 | The build | Reviewed against PROJECT_GUIDELINES §5 | Total added-screen time stays inside the "3-5 min mission, <10s launch-to-play, one-action skip" envelope — the entry step must not become a mandatory multi-field form. |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/systems/highScoreSystem.ts` | Add `name` (or design-confirmed field) to `ScoreEntry`; extend `isValidEntry` to tolerate its absence (legacy migration, AC5); `saveScore` accepts the field. Pure, TDD. |
| `dev-gameplay` | `src/game/systems/__tests__/highScoreSystem.test.ts` | New/updated tests: name persists, legacy blob without name still loads, bound/trim behavior if enforced at this layer vs render layer (architect to decide the boundary — see below). |
| `dev-r3f-render` | new: `src/render/ui/HighScoreEntry.tsx` (or equivalent, naming TBD) | The entry screen/step — reuses `print/` tokens + primitives (`PaperSheet`, `MarkerCircle`, `useRovingIndex`), fanzine-styled short text input. |
| `dev-r3f-render` | `src/render/ui/menu/ScoresUne.tsx` | Render `s.name` (or placeholder) in the classement row. |
| shared / architect-assigned | `src/render/scene/App.tsx` | Gate the existing `saveScore(...)` call (`App.tsx:226-228`) behind the new entry step when `isHighScore` is true; wire the new phase/step into the `END`-bound flow (exact mechanism — new `AppPhase` value vs an `EndScreen` sub-state — is an architect call per epic open question #2). |

## Out of scope (V1)

- Any change to how `isHighScore`/ranking is computed (`highScoreSystem.ts` logic beyond the
  new field) — top-10, per-level, `score > lowest` ordering all stay as shipped.
- Online/shared leaderboard, profiles, avatars — rejected at the epic level (backend out of
  scope per PROJECT_GUIDELINES §8).
- Editing/deleting a past entry, renaming after the fact.
- Any change to `EndScreen.tsx`'s existing `phase`/`score`/`wave`/`onRestart` contract beyond
  what's needed to sequence the new step — this stays a small, additive change, not a rewrite
  of the end-of-run flow.

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Tests Vitest écrits et verts (`highScoreSystem.ts` changes, TDD).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] Validé contre le Test du Cahier des Charges (see above — FIDÈLE, logged).
- [ ] `src/game/**` boundary respected: `name` field + validation are pure; the entry screen
      and its wiring live in `src/render`/bridge only.
- [ ] Browser-verified: a high-score run shows the entry step; a non-high-score run doesn't;
      the leaderboard shows the entered name; a legacy (pre-story) score blob still renders.
- [x] Design-loop sign-off on signature format and trigger point (epic open questions 1–2) —
      **GATED 2026-07-20** (`design-gate-menus-ui-completion.md`): signature = native `<input>`
      typewriter byline on the PARIS-MINUIT UNE (not a 3-initial wheel); trigger = a new
      `NAME_ENTRY` `AppPhase`, inserted **after** `NARRATIVE_POST` (if scripted) and **before**
      `EndScreen`, save deferred to its resolution, next-level unlock unaffected.
