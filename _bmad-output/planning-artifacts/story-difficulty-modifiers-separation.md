# Story — Separate difficulty/modifiers from general OPTIONS (`M2`)

**Epic:** `epic-menus-ui-completion` · **Sequence:** M2 · **Type:** IA/presentation fix,
render-only.

## Why

`OptionsColophon.tsx` (MENU ▸ OPTIONS) currently mixes five unrelated concerns in one
undifferentiated list of `BallotRow`/`VuMeter` controls: audio (SFX, music), a save-slot
setting (VIES/lives), the actual game-difficulty lever (PRESSION), and a rendering toggle
(CRT). Bertrand's audit correctly flags that "difficulty" reads as just another options row,
not the first-class choice PROJECT_GUIDELINES §8 gives it ("niveaux de difficulté" is
explicitly named in the full-feature-set-original list, on par with score/vies/timer/menu).
A player scanning OPTIONS for "how hard is this going to be" has to read past audio sliders
to find it.

## Cahier des charges check

> "Did Prohibition Atari ST have difficulty levels?"

**[FIDÈLE]** — PROJECT_GUIDELINES §8 lists "niveaux de difficulté" explicitly in scope. This
story does not add a difficulty system (it already exists, `DIFFICULTY_CONFIG` in
`levels.ts`, wired via `prefs.difficulty`) — it only fixes where/how the existing lever is
surfaced, so it is legible as its own choice rather than buried in generic settings.

## Scope (V1)

- Difficulty (`PRESSION`) becomes visually and/or navigationally **distinct** from the
  audio/CRT settings — exact shape (new sommaire rubrique, a labelled sub-section within
  OPTIONS, or folding it into the level-selection step) is a design-loop call (epic open
  question #3), constrained to stay small.
- `VIES` (lives) is a genuine game modifier too (changes how many hits you can take) and
  should move alongside difficulty if the design loop agrees they're the same category
  ("comment tu joues" vs "comment ça sonne / comment ça rend") — PM leans yes, not gating the
  story on it; `game-designer` confirms the grouping.
- No new difficulty tiers, no new modifiers, no per-level override — the three existing
  tiers (`easy`/`normal`/`hard`) and their existing `DIFFICULTY_CONFIG` values are untouched.
- `PauseScreen.tsx` is explicitly NOT touched — it deliberately omits difficulty/lives
  (can't change mid-run) and that stays correct.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | The MENU | The player navigates to the difficulty control | It is reachable through a path that reads as distinct from "OPTIONS" generic settings (own rubrique, own labelled section with a visible separation, or its own step) — not one row among five in an undifferentiated list. |
| AC2 | The difficulty control | The player changes it | The value writes through the existing `onSave`/`Prefs.difficulty` path unchanged — no schema change, no new persistence key. |
| AC3 | `DIFFICULTY_CONFIG` and `buildLevelParams` (`App.tsx:107-113`) | A level launches | Byte-identical behavior to today — this story is presentation/IA only, zero gameplay-value change. |
| AC4 | Existing audio (SFX/music) and CRT settings | After the split | Still reachable, still write through the same `Prefs` fields, unaffected by the reorganisation. |
| AC5 | Keyboard/touch-only navigation | The player reaches the (possibly new) difficulty surface | Roving focus + always-visible marker (existing `useRovingIndex`/`MarkerCircle` pattern) — no new focus-trap, no regression versus the current `BallotRow` accessibility. |
| AC6 | The build | Reviewed against PROJECT_GUIDELINES §5 rule 1 (<10s launch-to-play) | The reorganisation adds at most one extra navigational step for a returning player who already knows where difficulty lives — never a mandatory extra screen before play. |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-r3f-render` | `src/render/ui/menu/OptionsColophon.tsx` | Remove the `PRESSION` (and, if design confirms, `VIES`) `BallotRow`(s) from the generic colophon list. |
| `dev-r3f-render` | `src/render/ui/MainMenu.tsx` | If the design-loop picks a new sommaire rubrique: add it to `RUBRIQUES` + render branch (mirrors the existing `levels`/`scores`/`prefs` pattern). If instead a sub-section within OPTIONS: no `MainMenu.tsx` change needed. |
| `dev-r3f-render` | new (if new rubrique chosen): `src/render/ui/menu/DifficultyColophon.tsx` (naming TBD) | New small surface, reuses `print/` tokens + `BallotRow`-equivalent pattern from `OptionsColophon.tsx` — no bespoke visual system. |

## Out of scope (V1)

- Any new difficulty tier, any change to `DIFFICULTY_CONFIG` values or `enemySpeedMultiplier`
  math.
- Per-level difficulty override, difficulty preview/description beyond what's already shown
  via `difficultyMark()` on flyers.
- Touching `PauseScreen.tsx`.
- Any schema change to `Prefs` — `difficulty` and `lives` fields stay exactly as they are.

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Tests Vitest écrits et verts if any pure render helper moves (e.g. a `derivations.ts`
      re-export) — no `src/game` change expected, so likely no new game-layer tests.
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] Validé contre le Test du Cahier des Charges (FIDÈLE, logged above).
- [ ] `src/game/**` byte-identical (presentation-only story).
- [ ] Browser-verified: difficulty is reachable and visually distinct from generic options;
      audio/CRT settings still work; keyboard/touch nav intact.
- [ ] Design-loop sign-off on the IA shape (epic open question #3) before dev starts.
