# 0083 — Portrait-robot input & presentation layer: gesture-agnostic intents, house BD-comics DA, CSS Modules

- **Status:** Proposed
- **Date:** 2026-08-05
- **Number:** 0083. Twice renumbered, and both collisions are recorded here because the
  project already lost a day to two ADR-0020s. Allocated as **0081** by producer (Marion) at
  story intake 2026-08-05; moved to **0082** the same day when `main` merged
  `0081-mcp-level-editor-server.md`; moved again to **0083** on 2026-08-11 when merging `main`
  revealed `0082-flyer-cascade-session-key.md` — already Accepted — had taken 0082 too. The
  lesson is in the number itself: a branch that lives 81 commits behind `main` cannot hold an
  ADR number, and only merging tells you so. **File and title
  renamed** on 2026-08-05 from `0081-portrait-robot-input-and-atari-st-render.md` — the
  scaffold's "Atari ST render" framing is void: Bertrand arbitrated on 2026-08-05 that the DA
  stays **house BD-comics** (story AC7), and the ST source is historical grounding for the
  _mise-en-scène_ only, never a production constraint. **Renumbered twice — see the Number field above for both collisions.** First move on 2026-08-05 due to
  collision with ADR-0081 (MCP level-editor server) merged to origin/main via PR #159.\*\*
- **Author:** decision content by `senior-architect` (Winston), stage 3 TECH PLAN.
- **Relates to:** ADR-0079 (the DOM phase this layer draws), ADR-0080 (the catalogue it
  displays), ADR-0046 (CSS Modules + `tokens.ts`→CSS-var bridge — the law this screen obeys),
  ADR-0003 (mobile touch controls), ADR-0015 (device-forked copy), ADR-0023 (print/paper
  surfaces — the `NarrativeScreen` family this screen joins), `tapGestureSystem.ts` (the
  precedent for a _pure_ gesture rule with an impure binding).
- **Inputs (canonical):** `docs/game-design/design-gate-portrait-robot.md` §3, **A4-bis**
  (Bertrand, 2026-08-05, which reverses A4's touch mapping) and **§8 amendements post-gate**
  (B1 no CTA / B2 continuous chrono / B3 desktop drag, and the derived A12bis-A16);
  `docs/game-design/ux/portrait-robot-ux.md` (round 2 pending — non-blocking, see D3);
  `docs/art-direction/brief-portrait-robot.md`.

## Context

The input question is unsettled **on one axis and one only**. A4-bis fixes the mobile primary
gesture — a horizontal swipe **directly on the targeted band**, no selection tap, no "active
band" under the finger. **B3 has since closed the desktop axis: horizontal mouse drag on the
band**, same mental model. Three sub-questions still ride with `ux-designer`'s round 2: swipe
angle threshold, trigger distance (and its drag equivalent, the _cran_ distance), and minimum
band height. The discrete-vs-inertial question is closed by B3's "same mental model" — a drag
that cycles by crans is discrete on both device classes.

An architecture that hard-codes a gesture would still be obsolete before round 2 comes back.
But the **rule** underneath is completely settled and completely stable: _band `i` moves to
variant `j`_. That asymmetry — an unstable gesture over a stable rule — is the entire subject
of this ADR.

**B1 changes the shape of the input layer, not only its tuning.** With the CTA gone, no
gesture produces a validation; the scene resolves by itself the instant the 4 bands are right.
The consequence for this ADR is D1's vocabulary: an intent that no geste can emit has no place
in a vocabulary of gestes. See D1 and the Révisions section.

Second force: the DA. The scaffold assumed dithered Atari ST digitised faces. That is dead
(AC7). The screen is house BD-comics ink-on-paper, and per ADR-0079 D1 it is a **DOM screen**,
so it is structurally outside `CrtPass`.

Third force: ADR-0046 is law. Every hex and font comes from `print/tokens.ts`; no `style={{…}}`
except for genuinely runtime-computed values, which travel as inline **CSS custom properties**.

## Decision

### D1 — The pure layer speaks **intents**, never gestures

```ts
export type PortraitIntent =
  | { readonly kind: "CYCLE"; readonly band: PortraitBandId; readonly delta: 1 | -1 }
  | { readonly kind: "SET"; readonly band: PortraitBandId; readonly index: number }
  | { readonly kind: "FOCUS"; readonly band: PortraitBandId }
  | { readonly kind: "ABANDON" };
```

**`SUBMIT` is deleted, not internalised** (B1 / gate A12bis). It had exactly one emitter — the
`SORTIR LA TÊTE` button and its `Enter` key — and that emitter no longer exists. The two
options were weighed:

- _Keep it as an intent emitted by the reducer itself._ Rejected, and this is the load-bearing
  call. `PortraitIntent` is defined as **the vocabulary of what a player asks for** — that
  definition is the whole reason `src/game` can ignore fingers, keys and pointers. An intent
  no hook can construct breaks that definition twice over: it makes the union no longer a
  description of input, and it leaves a **loaded gun in the type** — a member the render lane
  can legally dispatch, which is precisely how a deleted CTA gets re-implemented by accident
  six weeks from now. A reducer that dispatches to itself is also a state machine with two
  entry points and one of them untestable from the outside.
- _Delete it, and give the resolution a named home._ Retained. Bertrand's objection is right —
  a resolution that is no longer an intent must live somewhere named, not dissolve into an
  `if`. It lives in **`resolvePortraitScene`** (ADR-0079 D2), which already existed as the
  single resolution function for timeout and abandon, and which is now also the lock-in path.
  The trigger is named too: the lock-in test is a **post-condition of every entry**, specified
  in ADR-0079 D8. So the resolution did not lose a name, it changed from a _request_ name to a
  _rule_ name — which is the honest description of what B1 did to the design.

The mapping table (D2) is consequently **total again**: every row is a real geste with a real
emitter. That totality is the invariant worth protecting — a row with no left-hand side is
dead code with a marketing department.

`ABANDON` keeps its emitter (`Escape` / Android back, via the confirmation) and stays.

`applyPortraitIntent(scene, intent): PortraitScene` in `src/game/systems/portraitRobotSystem.ts`
is the **only** mutator of the selection. It knows nothing about fingers, keys, pointers or
DOM events. Consequences that make this the decision and not a naming convention:

- The vocabulary has **no gesture-shaped member**. There is no `SWIPE`, no `DRAG`, no `TAP`,
  no `ARROW_LEFT`. This is the claim B3 has now tested in the real world, and the verdict is
  in D2bis: **`src/game`'s vocabulary absorbed the desktop drag with zero new member and zero
  new test on the reducer** — but the hook cost more than the "one row" this ADR originally
  promised. The prediction is kept, corrected, in C1.
- `CYCLE` carries its band explicitly, so A4-bis's "no active band under the finger" is
  expressible without a selection concept. `FOCUS` exists **only** for the keyboard and
  screen-reader path (which does need a cursor); it is orthogonal to `CYCLE` and never a
  precondition of it. A future mapping that reinstates a selection tap would use `FOCUS` +
  `CYCLE` with zero change to the rule.
- `SET` exists for direct addressing (keyboard `1..6`, a chevron long-press menu) so a mapping
  never has to emit six `CYCLE`s in a loop. **B3 cashed this in**: a fast desktop drag crossing
  three crans in one frame emits **one `SET`**, not three `CYCLE`s — which also keeps the
  lock-in test (ADR-0079 D8) evaluated once per band change rather than three times on
  intermediate states the player never aimed at. This member was speculative when written; it
  is load-bearing now.

`applyPortraitIntent` is total: an out-of-range index, an unknown band, an intent after
resolution — all return the scene unchanged. Input is untrusted; a screen that hangs on a
malformed gesture would be a bug reported as "the swipe froze". **Since B1 it is also the
place the scene can end**: every entry is followed by the 4/4 post-condition (ADR-0079 D8), so
`applyPortraitIntent` can return a `RESOLVED` scene. It remains total and pure; the resolution
is a return value, not an event.

### D2 — The gesture _classification_ is pure; the gesture _binding_ is a hook

The `tapGestureSystem.ts` precedent, extended:

- **`src/game/systems/swipeGestureSystem.ts` (pure).** `classifySwipe(dx, dy, dtMs)` →
  `"left" | "right" | "none"`, with the thresholds as named exported constants:
  `SWIPE_MIN_DISTANCE`, `SWIPE_MAX_ANGLE_DEG` (the diagonal-ambiguity guard Tony documented and
  A4-bis asks to _quantify_ rather than reject), `SWIPE_MAX_MS`. Normalised coordinates, no
  DOM, unit-tested at the boundaries — including the diagonal cases, which is precisely the
  risk A4-bis leaves open.
- **`src/hooks/usePortraitGestures.ts` (bridge).** Owns pointer/touch/key listeners, feeds raw
  deltas through `classifySwipe`, and emits `PortraitIntent`s. It holds the **mapping table**
  and nothing else:

  | Input                                 | Intent                       | Status                                            |
  | ------------------------------------- | ---------------------------- | ------------------------------------------------- |
  | horizontal swipe on band `i`          | `CYCLE(i, ±1)`               | **primary, mobile** (A4-bis)                      |
  | tap on chevron ◀ ▶ of band `i`        | `CYCLE(i, ∓1)`               | affordance + accessibility target ≥44×44 (A4-bis) |
  | `↑` / `↓`                             | `FOCUS(prev/next band)`      | keyboard socle, acquired                          |
  | `←` / `→`                             | `CYCLE(focused, ∓1)`         | keyboard socle, acquired                          |
  | `1`…`9`, `0`                          | `SET(focused, n-1)`          | keyboard direct addressing — `0` = 10ᵉ variante   |
  | `Escape` / Android back               | `ABANDON` (via confirmation) | acquired                                          |
  | ~~`Enter`~~                           | ~~`SUBMIT`~~                 | **removed — B1, no CTA to activate**              |
  | **horizontal mouse drag on band `i`** | `SET(i, index + crans)`      | **primary, desktop (B3)** — see D2bis             |

  **V1 is discrete on both device classes: one swipe = one cran, one drag = one cran per
  `DRAG_CRAN_DISTANCE` of travel.** Predictable under a chrono, and B3's "same mental model as
  the touch swipe" settles the discrete-vs-inertial question that A4-bis left open: an inertial
  desktop drag would _not_ be the same mental model as a discrete touch swipe, so choosing
  inertia would break the arbitration, not refine it.

### D2bis — What B3's drag actually costs, stated honestly

A swipe and a drag are **not the same kind of gesture**, and this ADR must not pretend they
are. A swipe is _terminal_: it is judged once, when the finger leaves. A drag is _continuous_:
it has a pointer-down, an unbounded stream of moves each of which may cross zero, one or
several crans, and a pointer-up. `classifySwipe(dx, dy, dtMs) → "left" | "right" | "none"`
cannot express that, because it answers a question about a finished gesture.

So the pure layer gains **one function, not a row**:

```ts
// src/game/systems/swipeGestureSystem.ts
export const DRAG_CRAN_DISTANCE: number; // normalised px per cran (ux round 2)
export function accumulateDrag(
  carriedPx: number,
  deltaPx: number,
): { readonly crans: number; readonly carriedPx: number };
```

`accumulateDrag` is a pure, total, integer-quantising accumulator: it folds a move delta into a
carried remainder and returns how many whole crans were crossed (signed, possibly 0, possibly
several) plus the remainder to carry. It has the properties a drag needs and a swipe never
did — **monotonicity** (dragging back and forth returns you to where you started, no drift) and
**no frame-rate dependence** (10 small moves and 1 big move of the same total travel produce
the same cran count). Both are unit-testable at the boundary and both are exactly where a
hand-rolled `if (dx > 30)` in a hook would have failed silently.

The hook grows correspondingly: a small pointer state machine (`pointerdown` → `setPointer
Capture` → accumulate on `pointermove` → release), a per-band carried remainder, and a
click-vs-drag disambiguation so a drag that starts on a chevron does not also fire the
chevron's tap. That is **~30-40 lines in `usePortraitGestures`, not one table row.**

**What did hold, and it is the part that mattered:** the drag needed **no new intent member,
no change to `applyPortraitIntent`, no new test in `src/game/systems/portraitRobotSystem.ts`,
and no ADR re-opening on the rule.** `SET` — written speculatively for exactly this shape of
future — absorbed it. The boundary held; the estimate of the _hook's_ cost did not. Both facts
are recorded in C1 rather than one of them being quietly dropped.

This is the answer to "keep the input layer gesture-agnostic": the game layer sees intents, the
hook owns the mapping, and the only pure code that knows what a swipe _is_ is a three-constant
classifier with no opinion on what a swipe _means_.

### D3 — The open UX numbers are constants, not architecture

`SWIPE_MIN_DISTANCE`, `SWIPE_MAX_ANGLE_DEG`, **`DRAG_CRAN_DISTANCE`** and the minimum band
height are **tuning values behind named constants** (the first three in
`swipeGestureSystem.ts`, the last in the CSS Module as a token-driven custom property). The
discrete/inertial choice has left this list — B3 closed it (D2). Round 2 of `ux-designer` can
land the numbers without touching a single structural decision — which is why the gate could
hand the TECH PLAN over before that round closes, and why this ADR does not wait for it.

### D4 — Presentation: house BD-comics, DOM, CSS Modules + tokens

- **DA: house BD-comics ink-on-paper** (AC7). No dithering, no digitised photo, no ST palette,
  no period pastiche. What is borrowed from the ST source is _mise-en-scène_ only — large
  target portrait, breathing full-screen composition, tense countdown. **Any drift back toward
  a dithered/photo look is a regression against a settled arbitration, not an interpretation**
  (story Risk 4).
- **Structure:** `src/render/ui/portrait/PortraitRobotScreen.tsx` +
  `PortraitRobotScreen.module.css`, joining the `NarrativeScreen` / `EndScreen` print family.
  Four `<img>` bands in a CSS grid, medallion at **≥28 % of width** in mobile landscape,
  adjacent to the bands (gate A8).
- **ADR-0046 compliance, no exception:** zero hex, zero font-family, zero breakpoint literal in
  the CSS file — all from `print/tokens.ts` through the existing CSS-var bridge. Runtime values
  — the **chrono gauge fill ratio**, the reveal timeline progress, the focus liseré intensity —
  travel as inline **CSS custom properties** (`style={{ "--gauge": r }}`), never as inline
  rules. The gauge is a `scaleX`/`width` driven by a `0..1` ratio: **no number is rendered**
  (B2 / gate A13), so the DOM carries no digit a copy pass could ever have to translate.
- **No CTA.** There is no button, no chain, no focus stop and no reserved screen zone for one
  (B1). The vertical budget it occupied goes to the bands and the medallion; `ux-designer`
  owns the redistribution, and the screen must not grow a "confirm" affordance under any other
  name.
- **Selection liseré:** a CSS falloff (gradient/`box-shadow` decreasing to zero, never a flat
  fill — bible §2.1) on the **keyboard-focused** band only. The touch path has no active band
  by construction (A4-bis), so on mobile the liseré is a transient swipe echo, not a state.
- **Xerox grain:** one post-composition overlay over the assembled face — one layer, not four
  (art brief §7.3 Q4, confirmed).
- **No CRT.** `CrtPass` lives inside `GameScene`; a DOM screen cannot inherit it. See ADR-0079
  D1/C4 — `lead-art`'s §4 needs rewriting on that basis.
- **Copy is canon (gate A6, amended by §8):** `TÊTE À CONNAÎTRE`, `LA COUPE / LE REGARD / LE
NEZ / LA BOUCHE`, « la page 23 ». **`SORTIR LA TÊTE` is dead** (B1 — it was a button label,
  and KENZA's spoken line « Sors-moi une tête, une seule » is dialogue, not IHM).
  **`TÉLÉCARTE · {n} UNITÉS` is dead** (B2/A13 — there are no units); the gauge label is a new
  short deliverable owed by `narrative-designer`, and until it lands the render lane ships the
  gauge **with no label at all** rather than inventing copy. The internal ids stay
  `hair/eyes/nose/mouth` and **never reach the screen**. The player-facing strings come from
  the catalogue's `label` and from `narrativeSystem` — the render lane authors no copy.

### D5 — Chrono, `RotateOverlay`, and accessibility

- The chrono is `remainingSeconds` in the pure scene (ADR-0079 D2), **continuous** (B2). There
  is no unit conversion anywhere — `ceil(remaining / 2.5)` is deleted, not moved. The component
  reads two things and derives nothing: a `0..1` gauge ratio and the scene's current
  **`palier`** (ADR-0079 D9), a monotone descending enum computed in the pure layer. Copy,
  audio and the `aria-live` announcement all key off the _change_ of that one value, so a
  continuous chrono cannot make three consumers announce on three slightly different frames —
  nor announce every frame, which is exactly what `remaining <= 10` in a component would do.
- **`RotateOverlay` ⇒ pause** (gate A7). Implemented as ADR-0079 D6 states: the hook stops
  calling `tickPortraitScene`. The rule contains no pause branch, so "paused" cannot drift out
  of sync with what the player can see — the overlay's presence _is_ the pause.
- **Accessibility floor:** chevrons ≥44×44 px as real focusable buttons; band position announced
  as `{n} sur {total}`; the three chrono paliers announced through one `aria-live="polite"`
  region; the confirmation dialog focus-trapped. `aria-pressed` is **not** used — the indicative
  lock it belonged to was cut (gate A8).
- **`prefers-reduced-motion`** is honoured through the existing `useReducedMotionRoot` signal:
  the reveal degrades to an instant state change with the same hold, never to a skipped
  verdict.
- **Two reveal durations, from the scene, never from the component** (gate A15): `2.6 s` at
  `PARTIAL`/`FAILED` (per-band crawl, the corrections _are_ the information) and `1.4 s` at
  `IDENTIFIED` (lock-in flash + 4 simultaneous stamps, nothing left to inform). Both constants
  live in `portraitRobotSystem.ts` beside the rest of gate §3; the screen reads
  `scene.revealSeconds`. A `switch` on the outcome inside the `.tsx` would put two gate numbers
  in the render layer — same breach as ADR-0079 A5, at a smaller scale.
- **The lock-in is the only in-phase feedback, and it is terminal** (gate A16). The screen
  renders no per-band correctness cue of any kind — no tint, no check, no `aria` hint, no
  subtle timing tell. The single permitted signal is the phase ending. This is a render-lane
  prohibition as much as a design one, because per-trait feedback is exactly the sort of thing
  that arrives as a well-meant polish PR.

### D6 — Explicitly not built

No dithering/palette quantisation; no ST font; no analog-stick/gamepad path (no gamepad support
exists in the build); no inertial scrolling; no mini-crop, no indicative band lock, no
per-trait feedback (all cut at the gate); no `aria-pressed`; no CRT. **And, since B1: no
validation button, no `SUBMIT` intent, no `Enter` binding, no confirm-guard delay, no chrono
digit or unit count, and no anti-brute-force counter-measure** (gate A16 — no input cooldown,
no per-cran penalty, no attempt cap; the sweep covers ~11 % of the space in 35 s and is a
dominated strategy, so a counter-measure would be complexity against a non-exploit).

## Consequences

**C1 — The desktop mapping was NOT a one-row change. The boundary claim held; the cost
estimate did not.** This ADR predicted, on 2026-08-05: _"when the desktop Figma lands, it is a
line of table in `usePortraitGestures` and zero change in `src/game`"_. B3 landed the same day.
Scored honestly:

| Claim                                                              | Verdict                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Zero change in `src/game`'s **intent vocabulary**                  | **HELD.** `SET` absorbed the drag; no member added, no member changed.                                                         |
| Zero change to `applyPortraitIntent` / its tests                   | **HELD.** The reducer never learned what a pointer is.                                                                         |
| No ADR re-opened on the **rule**                                   | **HELD.** This revision touches input plumbing and D1's vocabulary (because of B1, not B3).                                    |
| "A line of table" in the hook                                      | **FALSE.** ~30-40 lines: a pointer state machine, per-band carried remainder, pointer capture, click-vs-drag disambiguation.   |
| "possibly a pointer-drag call into the _existing_ `classifySwipe`" | **FALSE.** `classifySwipe` judges a _finished_ gesture; a drag is continuous. One new pure function, `accumulateDrag` (D2bis). |

**The error was a category error, and it is worth naming so it is not repeated.** I treated
"swipe" and "drag" as the same gesture on two devices because the _design_ said "same mental
model". They are the same **mental** model and two different **physical** models: one is judged
once at release, the other is a stream with an intermediate state that must be rendered while
it happens. Design equivalence does not imply implementation equivalence, and an architect who
takes a UX sentence as an engineering estimate will under-quote every time.

**What the abstraction actually bought** is still the whole point, and it is not small: the
change was confined to **one hook and one pure classifier module**, and the diff never crossed
the game/render seam. Under alternative A1 (bind gestures to the reducer), the same
arbitration would have added a `DRAG` intent with an intermediate `dragging` state _inside
`src/game`_, rewritten the reducer's tests, and produced a state machine whose shape tracked a
Figma. The ADR's decision was right; its estimate was optimistic. Both are now on the record.

**C2 — A second gesture module now exists beside `tapGestureSystem`.** Two small pure gesture
modules rather than one grab-bag: they share no state and no thresholds (a shoot tap and a band
swipe are different physical acts with different tolerances). If a third appears, merging them
is a trivial follow-up; pre-merging them now would couple the shooting tolerances to a UX round
that has not closed.

**C3 — The screen carries real accessibility surface for the first time outside the menus.** It
is the first _timed, interactive_ DOM screen in the build; the `aria-live` chrono pattern it
establishes is likely to be reused, and should be reviewed as a pattern, not as one screen.

**C4 — `ux-designer` round 2 is not on the critical path**, by construction (D3). If it slips,
the lane ships with the provisional constants and re-tunes; if it lands early, nothing has to be
undone.

## Alternatives Considered

**A1 — Bind gestures straight to the reducer (`onSwipeLeft` → mutate band).** The shortest path
and the one that ages worst: every unresolved UX question (desktop pointer, angle threshold,
discrete vs inertial) would be a change inside `src/game`, and the reducer's tests would encode
a gesture vocabulary the design has explicitly not fixed. Rejected as the boundary breach it is.

**A2 — Keep the "active band + chevrons" model of the UX spec and treat the swipe as optional.**
This was gate A4, and Bertrand reversed it (A4-bis). Recorded here so the reversal is not
silently re-litigated: the swipe is primary and there is no selection tap. The chevrons survive
as affordance and accessibility targets, which is why `FOCUS` remains in the intent vocabulary.

**A3 — Put the swipe thresholds in the hook as literals.** Rejected: they are the numbers
`ux-designer` round 2 will tune and `qa-lead` will test at the boundary. Named constants in a
pure module make them unit-testable and reviewable; literals in an effect make them invisible.

**A4 — Render the scene as pixel art in a canvas to get the ST look.** Void: the DA arbitration
kills the ST look (AC7), and ADR-0079 D1 kills the canvas. Listed only so the scaffold's
premise is explicitly buried rather than quietly dropped.

**A5 — Reuse `HUD.tsx`'s inline-style approach for speed.** Rejected on ADR-0046, which is law
and whose whole point was to stop new inline-styled surfaces from appearing. A new screen has no
migration excuse.

**A6 — Keep `SUBMIT` as an internal intent emitted by the reducer.** Rejected in D1. Recorded
here because it is the tempting answer: it preserves a familiar shape (everything that happens
is an intent) at the cost of the one property that makes the shape worth having (an intent is
what a player asks for). A vocabulary that describes both player requests and reducer
self-calls describes neither, and the unreachable member is a re-entry point for the CTA B1
just deleted.

**A7 — Model the desktop drag with a `DRAG` intent carrying an in-progress delta.** The
"obvious" way to handle a continuous gesture, and the boundary breach D1 exists to prevent: it
would put a transient UI state (a pointer mid-travel) inside `src/game`, make the reducer's
tests encode pointer semantics, and mean that a change to `DRAG_CRAN_DISTANCE` — a UX tuning
number — edits the game layer. The intermediate state of a drag belongs to the hook that owns
the pointer; only its _outcome in crans_ crosses the seam, as `SET`.

## Révisions

**2026-08-05 — révision 1 (post-gate §8, arbitrages Bertrand B1/B2/B3).** Body edited in place
(Status still `Proposed`).

| Change                                                                                                                                                                                                                        | Driver                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **`SUBMIT` removed** from `PortraitIntent`; resolution renamed into a rule (`resolvePortraitScene`, triggered by the entry post-condition ADR-0079 D8) rather than an intent. New alternative A6 records the option not taken | B1 · gate A12bis                       |
| **Desktop mapping closed**: horizontal mouse drag → `SET(i, index + crans)`. New **D2bis** with the pure `accumulateDrag` + `DRAG_CRAN_DISTANCE`; new alternative A7                                                          | B3                                     |
| **C1 rewritten as a scored prediction** — boundary claim HELD, "one row" claim FALSE, with the category error named                                                                                                           | B3, applied to this ADR's own forecast |
| `Enter` row struck from the mapping table; `1…6` → `SET` row added                                                                                                                                                            | B1                                     |
| D3: discrete/inertial leaves the open-questions list (closed by B3); `DRAG_CRAN_DISTANCE` joins it                                                                                                                            | B3                                     |
| D4/D5: `TÉLÉCARTE · {n} UNITÉS` and the unit conversion deleted (continuous gauge, no digit); no CTA zone; two `revealSeconds` read from the scene; per-trait feedback prohibition restated at render level                   | B2 · gate A13/A15/A16                  |
| D6: added the explicit non-build list for the deleted CTA chain and the refused anti-brute-force counter-measures                                                                                                             | B1 · gate A16                          |

**Not changed:** D1's core (intents not gestures), D2's pure/impure split, D4's DA and
ADR-0046 compliance, D5's `RotateOverlay` pause and accessibility floor, alternatives A1-A5.

---

**Next stage:** dev lanes per `docs/handoffs/story-portrait-robot.md` §3.
