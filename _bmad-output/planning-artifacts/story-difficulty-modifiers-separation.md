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

- Difficulty (`PRESSION`) becomes visually and navigationally **distinct** from the audio/CRT
  settings. **Gate ruling 2026-07-20 (Q3):** the chosen shape is a **glanceable `PRESSION`
  ballot header row above the flyer grid inside the NIVEAUX rubrique body** (UX spec §5),
  reusing OptionsColophon's ballot vocabulary — NOT a new sommaire rubrique and NOT a removal
  from OPTIONS. PRESSION stays writable from OptionsColophon too (same `Prefs.difficulty` field,
  single source of truth); the header is a second, more prominent point of access. On the
  short-landscape mobile sub-class (`SHORT_LANDSCAPE`, ≤480px tall) the header is **not** added
  (Option A, see below) to protect the gated `pregame-landscape-ux.md` chrome budget — PRESSION
  stays reachable via OPTIONS there, a documented non-regression.
- **Gate ruling 2026-07-20 (Q3):** only `PRESSION` is promoted to the NIVEAUX header; `VIES`
  stays in the OPTIONS/PAUSE consolidated surface (owned by M3), NOT promoted. Rationale:
  PRESSION is the "which gig, how hard" decision that belongs co-located with the level browse;
  VIES is a run-config modifier that belongs with settings, and keeping the promoted header to a
  single row protects the layout budget (parity with the short-landscape chrome-budget reasoning
  below).
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

**Gate-decided shape (Q3, 2026-07-20): promoted NIVEAUX header, additive — no removal, no new rubrique.**

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-r3f-render` | `src/render/ui/menu/OptionsColophon.tsx` | **No change from this story** — `PRESSION` (and `VIES`) STAY here (OPTIONS remains the full settings surface and the sole difficulty access on short-landscape mobile per Option A). Do NOT remove them. (M3 separately regroups the CRT/reduced-motion rows on this surface — sequence with M3, see epic.) |
| `dev-r3f-render` | `src/render/ui/menu/FlyerWall.tsx` (or the NIVEAUX rubrique body) | Add a `PRESSION` ballot header row above the flyer grid (UX §5), reusing OptionsColophon's ballot/X-stamp vocabulary and the shared `Prefs.difficulty`/`onSave` round-trip. `role="radiogroup"` per UX §3/§5. Gated OFF under `SHORT_LANDSCAPE` (Option A). |
| `dev-r3f-render` | `src/render/ui/MainMenu.tsx` | **No `RUBRIQUES` change** — no new sommaire tab (rejected in favour of the in-NIVEAUX header). |

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
