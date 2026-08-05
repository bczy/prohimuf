# 0081 — Portrait-robot input & presentation layer: gesture-agnostic intents, house BD-comics DA, CSS Modules

- **Status:** Proposed
- **Date:** 2026-08-05
- **Number:** 0081, allocated by producer (Marion) at story intake 2026-08-05. **File and title
  renamed** on 2026-08-05 from `0081-portrait-robot-input-and-atari-st-render.md` — the
  scaffold's "Atari ST render" framing is void: Bertrand arbitrated on 2026-08-05 that the DA
  stays **house BD-comics** (story AC7), and the ST source is historical grounding for the
  *mise-en-scène* only, never a production constraint.
- **Author:** decision content by `senior-architect` (Winston), stage 3 TECH PLAN.
- **Relates to:** ADR-0079 (the DOM phase this layer draws), ADR-0080 (the catalogue it
  displays), ADR-0046 (CSS Modules + `tokens.ts`→CSS-var bridge — the law this screen obeys),
  ADR-0003 (mobile touch controls), ADR-0015 (device-forked copy), ADR-0023 (print/paper
  surfaces — the `NarrativeScreen` family this screen joins), `tapGestureSystem.ts` (the
  precedent for a *pure* gesture rule with an impure binding).
- **Inputs (canonical):** `docs/game-design/design-gate-portrait-robot.md` §3 and **A4-bis**
  (Bertrand, 2026-08-05, which reverses A4's touch mapping);
  `docs/game-design/ux/portrait-robot-ux.md` (round 2 pending — non-blocking, see D3);
  `docs/art-direction/brief-portrait-robot.md`.

## Context

The input question is unsettled **on purpose, and only on one axis**. A4-bis fixes the mobile
primary gesture — a horizontal swipe **directly on the targeted band**, no selection tap, no
"active band" under the finger — and explicitly defers the desktop pointer mapping to a Figma
proposal. Four sub-questions ride with it and belong to `ux-designer`'s round 2: swipe angle
threshold, trigger distance, discrete-vs-inertial scrolling, and minimum band height.

An architecture that hard-codes a gesture would therefore be obsolete before the Figma comes
back. But the **rule** underneath is completely settled and completely stable: *band `i` moves
to variant `j`*. That asymmetry — an unstable gesture over a stable rule — is the entire
subject of this ADR.

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
  | { readonly kind: "SUBMIT" }
  | { readonly kind: "ABANDON" };
```

`applyPortraitIntent(scene, intent): PortraitScene` in `src/game/systems/portraitRobotSystem.ts`
is the **only** mutator of the selection. It knows nothing about fingers, keys, pointers or
DOM events. Consequences that make this the decision and not a naming convention:

- The vocabulary has **no gesture-shaped member**. There is no `SWIPE`, no `TAP`, no
  `ARROW_LEFT`. When the Figma lands, the desktop mapping adds a line to a table in
  `src/hooks`, and **`src/game` does not change at all** — no rebuild of the state machine, no
  new test.
- `CYCLE` carries its band explicitly, so A4-bis's "no active band under the finger" is
  expressible without a selection concept. `FOCUS` exists **only** for the keyboard and
  screen-reader path (which does need a cursor); it is orthogonal to `CYCLE` and never a
  precondition of it. A future mapping that reinstates a selection tap would use `FOCUS` +
  `CYCLE` with zero change to the rule.
- `SET` exists for direct addressing (a chevron long-press menu, a Figma proposal that jumps to
  a variant, keyboard `1..6`) so a future mapping never has to emit six `CYCLE`s in a loop.

`applyPortraitIntent` is total: an out-of-range index, an unknown band, an intent after
resolution — all return the scene unchanged. Input is untrusted; a screen that hangs on a
malformed gesture would be a bug reported as "the swipe froze".

### D2 — The gesture *classification* is pure; the gesture *binding* is a hook

The `tapGestureSystem.ts` precedent, extended:

- **`src/game/systems/swipeGestureSystem.ts` (pure).** `classifySwipe(dx, dy, dtMs)` →
  `"left" | "right" | "none"`, with the thresholds as named exported constants:
  `SWIPE_MIN_DISTANCE`, `SWIPE_MAX_ANGLE_DEG` (the diagonal-ambiguity guard Tony documented and
  A4-bis asks to *quantify* rather than reject), `SWIPE_MAX_MS`. Normalised coordinates, no
  DOM, unit-tested at the boundaries — including the diagonal cases, which is precisely the
  risk A4-bis leaves open.
- **`src/hooks/usePortraitGestures.ts` (bridge).** Owns pointer/touch/key listeners, feeds raw
  deltas through `classifySwipe`, and emits `PortraitIntent`s. It holds the **mapping table**
  and nothing else:

  | Input | Intent | Status |
  | --- | --- | --- |
  | horizontal swipe on band `i` | `CYCLE(i, ±1)` | **primary, mobile** (A4-bis) |
  | tap on chevron ◀ ▶ of band `i` | `CYCLE(i, ∓1)` | affordance + accessibility target ≥44×44 (A4-bis) |
  | `↑` / `↓` | `FOCUS(prev/next band)` | keyboard socle, acquired |
  | `←` / `→` | `CYCLE(focused, ∓1)` | keyboard socle, acquired |
  | `Enter` | `SUBMIT` | acquired |
  | `Escape` / Android back | `ABANDON` (via confirmation) | acquired |
  | desktop pointer | **TBD — Figma** | one row to add, zero game change |

  **V1 is discrete-swipe: one swipe = one variant.** Predictable under a chrono, and it is the
  V1 leaning A4-bis already records; inertial scrolling would need a velocity model in the pure
  layer for a gesture whose spec is not written. If `ux-designer` round 2 rules otherwise, the
  change is confined to this hook plus one pure velocity threshold.

This is the answer to "keep the input layer gesture-agnostic": the game layer sees intents, the
hook owns the mapping, and the only pure code that knows what a swipe *is* is a three-constant
classifier with no opinion on what a swipe *means*.

### D3 — The four open UX numbers are constants, not architecture

`SWIPE_MIN_DISTANCE`, `SWIPE_MAX_ANGLE_DEG`, the discrete/inertial choice and the minimum band
height are **tuning values behind named constants** (the first two in `swipeGestureSystem.ts`,
the last in the CSS Module as a token-driven custom property). Round 2 of `ux-designer` can
land them without touching a single structural decision — which is why the gate could hand the
TECH PLAN over before that round closes, and why this ADR does not wait for it.

### D4 — Presentation: house BD-comics, DOM, CSS Modules + tokens

- **DA: house BD-comics ink-on-paper** (AC7). No dithering, no digitised photo, no ST palette,
  no period pastiche. What is borrowed from the ST source is *mise-en-scène* only — large
  target portrait, breathing full-screen composition, tense countdown. **Any drift back toward
  a dithered/photo look is a regression against a settled arbitration, not an interpretation**
  (story Risk 4).
- **Structure:** `src/render/ui/portrait/PortraitRobotScreen.tsx` +
  `PortraitRobotScreen.module.css`, joining the `NarrativeScreen` / `EndScreen` print family.
  Four `<img>` bands in a CSS grid, medallion at **≥28 % of width** in mobile landscape,
  adjacent to the bands (gate A8).
- **ADR-0046 compliance, no exception:** zero hex, zero font-family, zero breakpoint literal in
  the CSS file — all from `print/tokens.ts` through the existing CSS-var bridge. Runtime values
  — the télécarte unit count, the reveal timeline progress, the focus liseré intensity — travel
  as inline **CSS custom properties** (`style={{ "--units": n }}`), never as inline rules.
- **Selection liseré:** a CSS falloff (gradient/`box-shadow` decreasing to zero, never a flat
  fill — bible §2.1) on the **keyboard-focused** band only. The touch path has no active band
  by construction (A4-bis), so on mobile the liseré is a transient swipe echo, not a state.
- **Xerox grain:** one post-composition overlay over the assembled face — one layer, not four
  (art brief §7.3 Q4, confirmed).
- **No CRT.** `CrtPass` lives inside `GameScene`; a DOM screen cannot inherit it. See ADR-0079
  D1/C4 — `lead-art`'s §4 needs rewriting on that basis.
- **Copy is canon (gate A6):** `TÊTE À CONNAÎTRE`, `SORTIR LA TÊTE`, `LA COUPE / LE REGARD / LE
  NEZ / LA BOUCHE`, `TÉLÉCARTE · {n} UNITÉS`, « la page 23 ». The internal ids stay
  `hair/eyes/nose/mouth` and **never reach the screen**. The player-facing strings come from
  the catalogue's `label` and from `narrativeSystem` — the render lane authors no copy.

### D5 — Chrono, `RotateOverlay`, and accessibility

- The chrono is `remainingSeconds` in the pure scene (ADR-0079 D2), displayed as
  `ceil(remaining / 2.5)` units. **The conversion is in the pure layer**, not in the component:
  the palier thresholds (7 / 4 / 2 units) drive copy, audio and the `aria-live` announcement,
  and three consumers must not each re-derive the same division.
- **`RotateOverlay` ⇒ pause** (gate A7). Implemented as ADR-0079 D6 states: the hook stops
  calling `tickPortraitScene`. The rule contains no pause branch, so "paused" cannot drift out
  of sync with what the player can see — the overlay's presence *is* the pause.
- **Accessibility floor:** chevrons ≥44×44 px as real focusable buttons; band position announced
  as `{n} sur {total}`; the three chrono paliers announced through one `aria-live="polite"`
  region; the confirmation dialog focus-trapped. `aria-pressed` is **not** used — the indicative
  lock it belonged to was cut (gate A8).
- **`prefers-reduced-motion`** is honoured through the existing `useReducedMotionRoot` signal:
  the 2.6 s reveal degrades to an instant state change with the same hold, never to a skipped
  verdict.

### D6 — Explicitly not built

No dithering/palette quantisation; no ST font; no analog-stick/gamepad path (no gamepad support
exists in the build); no inertial scrolling in V1; no mini-crop, no indicative band lock, no
per-trait feedback (all cut at the gate); no `aria-pressed`; no CRT.

## Consequences

**C1 — The desktop mapping is a one-row change.** When the Figma lands, `usePortraitGestures`
gains a row and possibly a pointer-drag call into the *existing* `classifySwipe`. No ADR
re-opens, no pure test changes. That is the whole return on D1.

**C2 — A second gesture module now exists beside `tapGestureSystem`.** Two small pure gesture
modules rather than one grab-bag: they share no state and no thresholds (a shoot tap and a band
swipe are different physical acts with different tolerances). If a third appears, merging them
is a trivial follow-up; pre-merging them now would couple the shooting tolerances to a UX round
that has not closed.

**C3 — The screen carries real accessibility surface for the first time outside the menus.** It
is the first *timed, interactive* DOM screen in the build; the `aria-live` chrono pattern it
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

---

**Next stage:** dev lanes per `docs/handoffs/story-portrait-robot.md` §3.
