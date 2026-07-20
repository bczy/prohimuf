# Story — Accessibility settings consolidation (`M3`)

**Epic:** `epic-menus-ui-completion` · **Sequence:** M3 · **Type:** conscious documented
extension, cross-boundary (pref schema + two settings surfaces + a live-`matchMedia`
authority question).

## Why

`muf`'s only player-facing accessibility control today is the CRT toggle ("TUBE CATHODIQUE" /
"ÉCRAN CATHODIQUE" in `OptionsColophon.tsx`/`PauseScreen.tsx`). Reduced motion is honoured
**automatically and invisibly** in two independent places — `CrtPass.tsx:70-85` (live
`window.matchMedia` read + change-listener, freezes CRT grain/flicker) and the `print/`
primitives (per the pre-game-redesign plan: "`prefers-reduced-motion` is honoured inside
`PaperSheet`/primitives … forced to 0") — but there is **no in-game toggle** a player can use
if they can't or don't set the OS-level preference (shared machine, unfamiliar OS, or simply
wants motion reduced for `muf` specifically without changing it system-wide). That is a real
accessibility gap, not a cosmetic one.

## Cahier des charges check

> "Did Prohibition Atari ST have accessibility settings?"

**[EXTENSION]** — conscious, documented, justified. Prohibition (1987) predates the concept;
this is a 2020s-era practice (WCAG, `prefers-reduced-motion`), same category as the
screenshake/hitstop accessibility work already justified in `story-timer-duel-telegraph.md`.
Kept because: `Éviter` is unaffected (no gameplay-rule change); it widens *who can comfortably
play* without widening the core loop or adding a verb; the CRT toggle already establishes the
precedent that motion/visual-effect controls belong in `muf`'s options surfaces.

## Sequencing (read before scoping work — avoids a schema collision)

`story-timer-duel-telegraph.md` (queued in `_bmad-output/planning-artifacts/`, **not yet
built** — no entry in `docs/handoffs/`, `reducedMotion` absent from `prefsSystem.ts` as of
this writing) **already specs** adding `Prefs.reducedMotion` (its AC13) plus a labelled toggle
on `PauseScreen`/`OptionsColophon` (its AC19, same two files this story would touch) and
**already flags** the exact `CrtPass`-vs-`Prefs.reducedMotion` dual-authority question this
story exists to resolve (its `[GATE-FLAG]`, quoted below).

**This story must NOT duplicate that work.** Two outcomes, `producer`/`senior-architect` to
call at sprint planning (epic open question #4):

- **(a) `story-timer-duel-telegraph` lands first:** this story's `Prefs.reducedMotion` +
  toggle scope is already done — M3 shrinks to the *consolidation* work only: resolving the
  `CrtPass` authority question (if not already resolved by that story's ADR), and ensuring
  the toggle reads as part of one coherent "ACCESSIBILITÉ" surface rather than a stray row.
- **(b) M3 lands first:** M3 owns the `Prefs.reducedMotion` field + toggle in full (this
  story's original scope below), and `story-timer-duel-telegraph` is updated at its own
  opening to consume the already-shipped field instead of re-adding it.

The acceptance criteria below are written for outcome (b) — the full scope — since that is
the not-yet-decided default; if (a) applies by the time this story is picked up, strike
AC1–AC3/AC7 (already satisfied) and keep AC4–AC6/AC8 (the consolidation/authority work).

> Quoted `[GATE-FLAG]` from `story-timer-duel-telegraph.md` (context, not to be re-litigated
> here, only resolved by whichever story lands the fix): _"Two reduced-motion authorities
> will exist after this story ships: `CrtPass.tsx` (lines 70-77) reads `window.matchMedia`
> LIVE with a change-listener re-poll, while the new `Prefs.reducedMotion` seeds ONCE from
> the OS signal and then persists as a player-editable value, never re-polled. … either (a)
> migrate `CrtPass.tsx` to read the shared `Prefs.reducedMotion` value instead of polling
> `matchMedia` itself, or (b) consciously document why the two coexist."_

## Scope (V1)

- Add `Prefs.reducedMotion: boolean`, seeded once from `window.matchMedia("(prefers-reduced-
  motion: reduce)")` on first load (or migrated from a legacy blob missing the field), then
  persisted and player-editable thereafter — never re-polled once a player value exists
  (mirrors the pattern already specced in `story-timer-duel-telegraph` AC13, if not already
  shipped by then).
- A labelled toggle, same visual/interaction language as the existing CRT toggle, on both
  `PauseScreen.tsx` and `OptionsColophon.tsx`.
- Resolve the `CrtPass`-vs-`Prefs.reducedMotion` authority question (architect call): either
  migrate `CrtPass.tsx` to read `Prefs.reducedMotion` (killing its own live `matchMedia` poll)
  or document why it must stay independent — this story does not ship without that call being
  made and recorded in an ADR.
- Reconcile the `print/` primitives' own reduced-motion handling with the same source of
  truth where practical (DRY, PROJECT_GUIDELINES "une seule source de vérité par concept") —
  or document why it's a legitimately separate concern, same bar as the `CrtPass` question.
- Both toggles get correct `aria-pressed` + a ≥44×44px hit target. This also closes the
  pre-existing CRT-toggle accessibility debt that `story-timer-duel-telegraph` explicitly
  flagged and deferred ("the existing CRT toggle's lack of both is flagged as a separate
  fix-lane item, not silently inherited here" — its AC19/Out-of-scope) — this story is that
  fix-lane item's home, folded in rather than shipped as a separate one-line fix.

> [AMENDMENT 2026-07-20 — ADR-0054 / stage-6 merge gate, PR #116] The shipped scope
> supersedes the seed-once model specced above. Per **ADR-0054 §3**, `Prefs.reducedMotion`
> defaults to **`false`** and is **never seeded from the OS** — `prefsSystem.ts` stays a pure
> reducer/serializer with no `matchMedia`. The effective value is the **live union**
> `prefs.reducedMotion || OS prefers-reduced-motion`, resolved once at the render/bridge edge
> (`useReducedMotionRoot`, mirrored onto `:root[data-reduced-motion]`); the toggle can
> strengthen but never weaken a live OS `reduce`. Therefore **AC1** and the first Scope (V1)
> bullet ("seeded once from `window.matchMedia`…, never re-polled") are replaced by "default
> `false`, no OS seed, live union at the bridge" — a legacy blob missing the field loads as
> `false`. **AC5** is amended: the reduced-motion and difficulty controls ship as the shared
> `BallotRow` primitive (`role="radiogroup"` + `role="radio"`/`aria-checked`, ≥44×44px) — the
> ARIA radio pattern per the UX spec, **not** a `<button aria-pressed>` toggle; `aria-pressed`
> in AC5 is superseded by `aria-checked` on the radio boxes (the pre-existing CRT-toggle a11y
> debt is still closed, via the same primitive). All other ACs stand as shipped.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | A first-time player, or a returning player whose stored `muf_prefs` blob predates `reducedMotion` | muf loads | `Prefs.reducedMotion` seeds once from the OS `prefers-reduced-motion` signal before first render, then persists as the player-editable value — never silently re-polled afterward. *(Skip if already shipped by `story-timer-duel-telegraph` — see Sequencing.)* |
| AC2 | `Prefs.reducedMotion` toggle, on either `PauseScreen` or `OptionsColophon` | The player changes it | The value persists to `muf_prefs` and is read by every consumer (CrtPass and/or `print/` primitives, per the resolved authority) within the same session, no reload required. |
| AC3 | The toggle, in either location | Rendered | Same `Toggle`/`BallotRow` visual language as the shipped CRT control — no bespoke new widget. |
| AC4 | The `CrtPass`-vs-`Prefs` dual-authority question | This story ships | It is resolved per **ADR-0054** (live union / single shared derived signal — `CrtPass` reads the shared signal, does not poll `matchMedia` itself) — not left as two silently-coexisting reduced-motion sources. |
| AC5 | The CRT toggle (pre-existing) and the new reduced-motion toggle | Reviewed for accessibility | Both expose `aria-pressed={value}` on their `<button>` and a ≥44×44px hit target (closes the debt `story-timer-duel-telegraph` flagged and deferred). |
| AC6 | The OPTIONS/PAUSE surfaces after this story | Read together | CRT + reduced-motion are grouped/labelled as one coherent "accessibilité / affichage" concern (visually adjacent, shared heading or section), not two unrelated toggles scattered among audio sliders. |
| AC7 | `Prefs.reducedMotion === true` | The game renders | Motion actually reduces somewhere the player can observe within one glance (CRT grain/flicker freeze at minimum) — the toggle must have a visible effect, not just persist a flag nobody reads. *(Cross-check with whatever `story-timer-duel-telegraph` shipped, if it landed first — its shake/hitstop/flash reductions should also respond to this same flag once merged.)* |
| AC8 | The build | Reviewed against PROJECT_GUIDELINES §9 | `src/game/**` boundary respected: `Prefs.reducedMotion` is a pure field/reducer in `prefsSystem.ts`; any `window.matchMedia` read happens only at the render/bridge edge, never inside `src/game` (same rule `story-timer-duel-telegraph` states for its own AC13). |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/systems/prefsSystem.ts` | Add `reducedMotion: boolean` to `Prefs`/`DEFAULT_PREFS`; extend `loadPrefs` to seed-once from an injected OS-resolved boolean when the field is absent (pure reducer — does not call `matchMedia` itself). **Coordinate with `story-timer-duel-telegraph` — do not add this field twice; check its status before starting.** |
| `dev-gameplay` | `src/game/systems/__tests__/prefsSystem.test.ts` | TDD: default value, seed-once-then-persist, legacy-blob migration. |
| `dev-r3f-render` | `src/render/ui/PauseScreen.tsx`, `src/render/ui/menu/OptionsColophon.tsx` | New `reducedMotion` toggle, grouped with CRT under one labelled section (AC6); `aria-pressed` + ≥44px on both this and the pre-existing CRT toggle (AC5). |
| `dev-r3f-render` / architect | `src/render/effects/CrtPass.tsx` | Resolve the dual-authority question: either read `Prefs.reducedMotion` instead of its own `matchMedia` poll, or keep it and document why (AC4). |
| `dev-r3f-render` / architect | `src/render/ui/print/*` (primitives honouring reduced motion per the pre-game-redesign plan) | Same reconciliation as `CrtPass` — read the shared source where practical. |
| `tech-writer` / `senior-architect` (handoff) | `docs/adr/` | **ADR-0054 already records** the `CrtPass`/`print`-vs-`Prefs.reducedMotion` authority decision (live union / single derived signal) — consume it; no new ADR needed for this story. |

## Out of scope (V1)

- Any accessibility control beyond CRT + reduced-motion (no new speculative settings — no
  colorblind mode beyond what `story-discrimination-daltonien-safe.md` already covers, no
  font-size control, no subtitle/caption system) — YAGNI, nothing here is requested or
  guideline-mandated beyond these two.
- Re-tuning the screenshake/hitstop values themselves — owned entirely by
  `story-timer-duel-telegraph` if/when it ships; this story only ensures the toggle they both
  read from is singular and coherent.
- `story-difficulty-modifiers-separation`'s IA split (M2) — separate story, no dependency.

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Tests Vitest écrits et verts (`prefsSystem.ts` changes, TDD) — skip if already covered
      by `story-timer-duel-telegraph` under outcome (a).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] Validé contre le Test du Cahier des Charges (EXTENSION, conscious, justified — logged
      above).
- [ ] `src/game/**` boundary respected: pref field pure, `matchMedia` reads only at the
      render/bridge edge.
- [ ] Browser-verified: toggle persists, has a visible effect, `aria-pressed` + hit target
      correct on both CRT and reduced-motion controls.
- [ ] Implementation matches ADR-0054's dual-authority resolution (AC4) — `CrtPass`/`print`
      read the shared derived signal; no second reduced-motion authority introduced.
- [ ] Checked against `story-timer-duel-telegraph`'s status before starting (Sequencing
      section) — no duplicate `Prefs.reducedMotion` addition.
