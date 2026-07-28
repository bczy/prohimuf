# UX spec — Telegraphing the delivery assault (K-5, `spec-delivery-van-assault.md` D5)

**Surface:** the `Livrer` set-piece's fairness signal — what the player is told, and when, before the
`DELIVERING` gauge can drop.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-26
**Status:** DRAFT — needs `lead-game-designer` (Karim) DESIGN GATE PASS before `senior-architect` /
`dev-r3f-render`.
**Trigger:** `lead-game-designer`'s design-gate finding **K-5** on
`docs/game-design/spec-delivery-van-assault.md` (log:
`docs/handoffs/story-offscreen-enemies-frozen.md` § Design gate), re-scoped from "non-blocking
follow-up" to **blocking for stage-5 acceptance and for the merge**. Also `pm` (John)'s scope note
recommending this story open immediately, not as an indeterminate backlog item.
**Decided upstream (not re-opened here):** the assault mechanic itself — directed 2-enemy seating at
`INCOMING`, camera-independent damage, retirement at window close (D1-D4 of Sacha's spec). This spec
owns only what the player **perceives** before and during that mechanic: an early signal at `INCOMING`
and a direction cue toward the delivery point. **No tuning number is mine** (`t_fail`, window seconds,
`DAMAGE_PER_ASSAILANT_PER_SECOND` stay `game-designer`'s, currently under Rev.2 rework) and **no style**
(chip typography, ink, exact glyph rendering stay `lead-art`'s).
**Scope guard:** PROJECT*GUIDELINES §5 rule 6 — *"Jamais de mort 'bullshit' — les règles des flics sont
visibles et cohérentes"_ — and rule 4 — _"Chaque mort/échec: raison explicite affichée"\_. This spec is
not a stylistic extension of the mechanic; it is what makes an **already-ratified** mechanic comply
with a **non-negotiable** rule. The cahier des charges question ("did Prohibition Atari ST have this?")
was already answered for the mechanic itself in Sacha's spec §8 (conscious extension, ratified); the
signal that makes it fair is not a further extension, it is the closing of a rule-6 gap.

**Robustness note (read this before the numbers below):** Sacha's Rev.2 (K-1…K-4) is still in
flight and will change `t_fail` and possibly the window/damage constants. Every decision in this spec
is **structural**, not tuned to today's numbers — it fires the earliest possible signal at a phase
boundary (`INCOMING`'s first tick) and a direction cue driven by the same on-screen predicate the
mechanic itself uses. Whatever Rev.2's numbers land on, this spec does not need to be re-gated.

---

## 0. The gap, restated precisely

Today (`src/render/ui/hud/DeliveryIntegrityBanner.tsx:26`) the only visible signal is gated
`deliveryPhase === "DELIVERING"` — i.e. the player is told the objective exists at the **same tick**
the gauge starts draining. `INCOMING` (4.4–5.8 s per level, Sacha's spec D2) already elapses in
complete silence on the HUD. A player at the far end of the street (edge-scroll 8 u/s, up to 31 u,
ADR-0071/§4 of Sacha's spec) who is not already looking toward the stop position has **zero** warning
time and must physically travel during the fraction of `DELIVERING` that remains before `t_fail` —
today's disclosed shortfall is exactly the panel's K-5 finding. Two independent gaps compound this:

1. **No `INCOMING`-phase signal at all** (D1 below).
2. **No indication of _where_ to go** once warned — the street is up to 31 u long and the player may
   guess the wrong direction, burning half their travel budget (D2 below).

---

## 1. D1 — Signal at `INCOMING` start

**D1.1 — Trigger tick.** The signal appears at the exact tick `HudData.delivery.phase` (as read by the
DOM HUD) first reports `"INCOMING"`. This requires **no new plumbing**: verified against the real code,
`DeliveryVehicleSprite.tsx:174-182` already calls `onHudChange({ phase, integrity, integrityMax })`
unconditionally on every phase change, **before** the `onStage`/hostage-QTE visibility gate — so
`INCOMING` already reaches the DOM HUD today; only the render branch that reads it is missing.

**D1.2 — What renders.** Extend the existing top-center banner group
(`DeliveryIntegrityBanner.tsx`) with a new branch for `phase === "INCOMING"`, using the **same**
chip + gauge-track DOM structure already shipped for `DELIVERING` (`styles.deliveryBanner` /
`styles.chip` / `styles.deliveryTrack`/`styles.gaugeFill`) — no new widget grammar:

- **Distinct label**, not just a distinct colour (accessibility, D3.1): e.g. illustrative-only
  `"LIVRAISON EN APPROCHE"` vs the existing `"LIVRAISON — PROTÉGEZ LE VÉHICULE !"`. **This copy is not
  canonical** — final wording is `narrative-designer` (Yasmine)'s call per the collaboration contract
  (in-game words are hers); I only require that the two labels differ in text.
- **The same gauge track, pre-filled and static.** During `INCOMING`, `data.delivery.integrity` is
  already at `integrityMax` (damage is phase-gated to `DELIVERING`, Sacha's spec D1) — so the existing
  `deliveryFill` computation already yields `1.0` here for free. No new field, no new derivation: the
  bar simply previews, un-drained, what the player is about to defend. This primes the mental model
  before the moment that matters (rule 4: the "reason" for a later failure is legible from the first
  frame that failure becomes possible, not only after).
- Optionally a distinct ink for the `INCOMING` chip vs the `DELIVERING` chip (anticipation vs
  active-drain) — colour is a reinforcement, never the sole distinguisher (D1.2's text requirement
  already satisfies non-colour-alone; `lead-art`'s call which ink).

**D1.3 — Continuity, not a pop-in-pop-out.** The banner container is present continuously from the
first `INCOMING` tick through `SUCCESS`/`FAILED` (it already un-mounts cleanly on those phases, per the
existing `PhaseMessageBanner`-style verdict swap) — the `INCOMING`→`DELIVERING` transition swaps the
chip's **content**, it must not cause the container to unmount and remount (no flash/gap at the phase
boundary a player could read as "the signal went away, then came back").

**D1.4 — Why this alone materially fixes the fairness gap (robust to Rev.2).** Moving the earliest
signal from `DELIVERING`'s first tick to `INCOMING`'s first tick hands the player the **entire**
`INCOMING` duration (4.4–5.8 s, level-dependent) as extra travel budget, on top of whatever `t_fail`
Rev.2 lands on. Today's worst measured shortfall (Vitry/Niveau-Final: 0 s of warning vs up to 3.9 s of
required travel) is not a close call once `INCOMING`'s ~5 s is added back — this is the single highest-
leverage change in this spec and holds regardless of exactly where Sacha's K-2 retune settles `t_fail`.

**Acceptance:**

- **A1.** Screenshot at the first HUD-visible `INCOMING` tick (desktop AND mobile-landscape): the banner
  renders with `INCOMING` copy and a full, non-draining gauge track.
- **A2.** Screenshot at the first `DELIVERING` tick: the SAME banner now shows the existing drain copy
  and gauge, with no intervening unmount (capture the transition frame-by-frame or via the state seam;
  the container element persists across the two ticks).
- **A3.** Grayscale capture of the `INCOMING` chip next to the `DELIVERING` chip: distinguishable by
  text alone (D3.1).

---

## 2. D2 — Off-screen direction cue toward the delivery point

**D2.1 — Existing precedent, and why it does not directly apply.** The HUD already ships an off-screen
indicator: `OffscreenArrowIndicator` (`src/render/ui/hud/OffscreenArrowIndicator.tsx`), a 4-edge arrow
ring driven by `computeTargetIndicator` (`src/hooks/useGameLoop.ts:102-135`) — but that indicator points
at the **nearest live enemy relative to the crosshair**, inside a small dead-zone (`DIRECTION_DEAD_ZONE
= 0.2`), which fires even while the target is on-screen (it is an **aim-assist**, not an off-screen
warning). Reusing its 4 edge slots verbatim for the van risks two semantically unrelated cues (nearest
enemy to shoot vs. where the delivery point is) landing in the **same pixel slot** at the same moment
and reading as one contradictory arrow. This spec asks for a **new, narrower** signal instead — see
D2.3.

**D2.2 — Trigger predicate: reuse `isOnScreen`, not a dead-zone.** The cue is active iff
`data.delivery.phase ∈ { "INCOMING", "DELIVERING" }` **and** the delivery vehicle's world position is
NOT on screen, using **the exact same predicate ADR-0071 uses to freeze enemies**:
`isOnScreen(vehicle.position, cameraOffsetX, cameraOffsetY)` (`src/game/systems/viewport.ts`, already
pure, already imported by `stateMachine.ts`). This is a fairness-critical reuse, not a convenience one:
by construction, **the cue is on exactly when the assailants are frozen-and-exposed** (ADR-0071) — the
cue and the mechanic can never disagree about what counts as "off screen". `useGameLoop.ts` already has
both `cameraOffsetX/Y` and `next.deliveryVehicle` in scope (it reads the latter nowhere yet, but the
type is already `GameState.deliveryVehicle`) — no `src/game` change is needed, only a new derivation
alongside the existing `computeTargetIndicator`, e.g. `computeDeliveryDirection(state, cameraOffsetX,
cameraOffsetY)`, returning the same 4-boolean shape as `HudTargetIndicator` (up/down/left/right — the
existing type, reused, not duplicated) surfaced as a new sibling field on `HudData` (e.g.
`deliveryDirection?: HudTargetIndicator`), never on `HudDelivery` (that type is emitted from
`DeliveryVehicleSprite.tsx`, which does not have camera offsets in scope — keep the computation where
the data already lives, in the hook).

**D2.3 — Placement: attached to the banner, not a new edge ring.** Render 0–2 small arrow glyphs
(one horizontal, one vertical — the up/down/left/right booleans are pairwise mutually exclusive per
axis by construction, same as the existing ring's math) directly on/beside the `INCOMING`/`DELIVERING`
banner chip from D1 — NOT at the screen edges. This anchors the cue to a location the player already
associates with the delivery objective (the same chip they just read for D1), and structurally cannot
collide with the unrelated nearest-enemy ring, which stays exactly as it is. Reuse the ring's existing
flat glyph token (`ACID.yellow` fill, `INK.black` keyline, `non-scaling-stroke`, zero glow —
`OffscreenArrowIndicator.tsx:39-57`) for visual consistency — same family of glyph, new anchor point.
Exact layout (which side of the chip, corner badge vs inline) is `lead-art`/`dev-r3f-render`'s call; the
functional requirement is: presence/absence and rotation must be independently correct per axis, and
neither glyph may obscure the chip's copy text or the gauge track.

**D2.4 — Sizing: inherit the chip's own font token, not a new breakpoint literal.** Size the glyph
relative to the chip's existing `font-size` custom property (`var(--font-size-base)` /
`var(--font-size-xl)`), so it shrinks for free at the short-landscape breakpoint
(`SHORT_LANDSCAPE_MEDIA`) exactly as the chip text already does — no new media query, no new size
token (DRY, matches ADR-0046's token discipline).

**D2.5 — Both axes matter, not just left/right.** ADR-0008's two-axis pan (mobile
`MOBILE_ZOOM_FACTOR` crop) can put a ground-level street actor off the TOP or BOTTOM of frame, not only
off one side — this is exactly why D2.2 asks for the full 2D `isOnScreen`, not an X-only check.

**D2.6 — Live recompute, not a one-shot.** Recomputed every HUD push (same cadence as the existing
`targetIndicator`, i.e. whenever the value changes) so it tracks the camera in real time: it
disappears the instant the van is framed, reappears the instant it leaves frame, for the entire span
`INCOMING → DELIVERING` (not only one of the two).

**D2.7 — Scope: one cue for the whole set-piece, not one per assailant.** The cue points at the
delivery **vehicle's** position, not at each seated assailant individually. Rationale: the two
assailants seat within `ASSAULT_RADIUS = 7` u of the vehicle by construction (Sacha's spec D2.1) and
travel with the set-piece as one unit — "go to the delivery point" is the whole instruction a player
needs; a second, third cue for each assailant would be noise without adding actionable information.
(A useful side-effect, not a requirement of this spec: once assailants seat in `VISIBLE`
(Sacha's spec D2.4), the pre-existing nearest-enemy ring will independently start pointing at them too,
for free, once they become the nearest live target — no change needed there.)

**Acceptance:**

- **A4.** With `phase === "INCOMING"` and the camera panned so the vehicle's position fails
  `isOnScreen`, both left/right AND up/down variants: the corresponding glyph(s) render, rotation
  matching the true bearing (assert via `__MUF_STATE__`/HUD snapshot, ADR-0005 seam).
- **A5.** Same setup but with the camera panned onto the vehicle (`isOnScreen` true): no glyph renders
  (chip text only).
- **A6.** Repeat A4/A5 with `phase === "DELIVERING"`: same behaviour.
- **A7.** Repeat A4 with the camera panned only vertically (Y-axis) off-frame, X on-frame (ADR-0008
  two-axis case): the vertical glyph renders alone, no horizontal glyph.

---

## 3. Accessibility

**D3.1 — Not colour alone (INCOMING vs DELIVERING).** Already satisfied by D1.2 (distinct text); any
ink difference `lead-art` adds is reinforcement only.

**D3.2 — Not colour alone (direction).** The glyph's SHAPE (rotation) carries the direction, exactly
like the existing ring — no colour-only direction signal is introduced.

**D3.3 — No new motion; no reduced-motion carve-out needed, IF the implementation stays this way.**
This spec adds no animation: the `INCOMING`↔`DELIVERING` swap is a discrete phase-triggered content
change (matching the zero-transition precedent of the existing `SUCCESS`/`FAILED` verdict stamp), and
the direction glyph is a static rotated shape (matching the existing ring, whose own animated
properties — opacity/scale on `active` — are decorative, not the carrier of information: shape/position
already is). **Explicit non-goal:** do not add a fade/slide transition to the banner swap or the glyph
appearance without gating it behind `prefers-reduced-motion`/`data-reduced-motion` per the established
house pattern (`src/render/ui/base.css`); if in doubt, ship it with zero transition, matching every
sibling verdict stamp.

**D3.4 — ARIA.** Arrow glyph SVGs stay `aria-hidden="true"` (decorative, matches
`OffscreenArrowIndicator.tsx:43`). The banner's copy text is plain DOM text, already exposed to
assistive tech with no extra work. No `aria-live` region is introduced — matches the existing house
pattern (no HUD element in this game uses `aria-live`; this real-time action HUD is not currently
screen-reader-live-region territory, and changing that project-wide is out of this spec's scope).

**D3.5 — Contrast at arm's length.** The direction glyph must hold the same legibility floor as the
existing ring (flat acid-yellow fill + ink-black keyline, zero glow) at both device pixel ratios — reuse
the token, do not reinvent a fainter or glowing variant.

**Acceptance:**

- **A8.** Grayscale capture of `INCOMING` vs `DELIVERING` banners (repeats A3) and of an active
  direction glyph: all remain distinguishable/legible without hue.
- **A9.** e2e with emulated `prefers-reduced-motion: reduce`: capture across the `INCOMING → DELIVERING`
  boundary and an off-screen→on-screen camera pan shows no animated transition frame on either the
  banner swap or the glyph's appearance/disappearance.

---

## 4. Mobile / device-class specifics

**D4.1 — Short-landscape clearance.** At the documented short-landscape breakpoint
(`SHORT_LANDSCAPE_MEDIA`, `max-height` 360–430 px, `pointer: coarse`), the extended banner (now
carrying up to 2 extra glyphs) must render fully inside the viewport with **no clipping and no overlap**
against the top ticker HUD row (`HUD.module.css` `.hud` strip) — screenshot-verifiable, same device
class the existing arrow ring already special-cases (`OffscreenArrowIndicator.tsx:79-86`).

**D4.2 — Mobile timing is `game-designer`'s to re-verify, not mine to tune, but flag it explicitly.**
Sacha's spec §6/§4.2 already prices the mobile worst case (1.5 taps/s, +0.5 s reaction) in
**assailant-seconds spent shooting**. This spec adds a **second** mobile cost the existing playtest
capture does not yet measure: the time from "cue noticed" to "player physically arrives at the delivery
point" via edge-scroll/swipe, which on mobile shares the same 8 u/s speed as desktop but a slower input
cadence to _start_ moving. Recommend Sacha's stage-5 playtest (`spec-delivery-van-assault.md` §6) add
this measurement once both specs ship, not only the assailant-seconds budget. Non-blocking for this
spec's own gate; blocking for the joint stage-5 sign-off on the whole feature.

---

## 5. Alternatives considered and rejected

| Option                                                              | Why rejected                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse `OffscreenArrowIndicator`'s 4 edge slots verbatim for the van | Same-slot collision with the unrelated nearest-enemy aim-assist ring at the same moment (D2.1).                                                                                                                                                                                                                                                 |
| Scripted camera auto-pan/snap to the van at `INCOMING`              | Removes the player agency Sacha's spec explicitly rewards (pre-emption during `INCOMING`, D2 rationale); no auto-camera mechanism exists in this control model (ADR-0003/0008 are player-driven edge-scroll/swipe only) — would be a new mechanic, fails YAGNI and the cahier des charges test.                                                 |
| Audio-only cue (tempo spike) as the sole signal                     | Guidelines §6 makes music the _ambient tension_ indicator, not the vehicle for an explicit objective signal; fails rule 4's "raison explicite **affichée**" (a displayed reason) taken literally. Flagged as a valuable non-blocking **companion** — `sound-designer`'s call, not decided here.                                                 |
| Full-screen flash / camera shake at the `INCOMING` trigger          | Motion-heavy (reduced-motion friction by default) and non-directional — repeats the "ambient, not directional" mistake already rejected in the hostage-QTE UX spec (`spec-hostage-qte-hud-readability.md` D2.2/D2.3).                                                                                                                           |
| New HUD field on `DeliverySpec`/`LevelConfig` for direction data    | Unnecessary: the vehicle's live world position is already in `GameState.deliveryVehicle`, read where the camera offsets already live (`useGameLoop.ts`). Adding authored per-level data would also collide with Sacha's AC15 (no new field on `DeliverySpec`/`LevelConfig`), even though that AC does not technically bind this HUD-only field. |

---

## 6. Implementation summary (for the deciding/implementing lanes, not a decision itself)

Given entirely for `senior-architect`/`dev-r3f-render` convenience — restates the above, decides
nothing new:

- `src/render/ui/hud/DeliveryIntegrityBanner.tsx` (+ `.module.css`): new `INCOMING` render branch
  (D1.2), optional direction glyphs (D2.3).
- `src/hooks/useGameLoop.ts`: new `computeDeliveryDirection` alongside the existing
  `computeTargetIndicator` (D2.2), reusing `isOnScreen` from `src/game/systems/viewport.ts` — **zero
  `src/game` changes**.
- `src/render/ui/hud/types.ts`: one new optional field, `HudData.deliveryDirection?: HudTargetIndicator`
  (reuses the existing type, D2.2).
- No change to `HudDelivery`, `DeliveryVehicleSprite.tsx`, `DeliverySpec`, or `LevelConfig`.
- No new asset, no new dependency, no new `src/game` state or rule.

---

## Seams handed off explicitly

- **→ `narrative-designer` (Yasmine):** final `INCOMING` chip copy (D1.2's placeholder is illustrative
  only) — same seam Sacha's spec D5 already names for "who ambushes the delivery."
- **→ `lead-art` (Nico):** `INCOMING` vs `DELIVERING` chip ink differentiation (reinforcement only,
  D1.2), exact glyph placement on/around the chip (D2.3's functional-not-pixel requirement).
- **→ `game-designer` (Sacha):** D4.2's mobile cue-to-arrival timing addition to the stage-5 playtest
  capture; reconcile this spec's "robust to Rev.2" claim once K-1…K-4 land (I do not expect a re-gate,
  but will re-check against the final numbers at stage 5).
- **→ `senior-architect` / `dev-r3f-render` (Amelia):** §6 implementation summary; confirm
  `HudData.deliveryDirection` as a render-lane-only addition needs no ADR (matches the existing
  `targetIndicator` precedent, no boundary change).
- **→ `lead-game-designer` (Karim):** DESIGN GATE PASS requested. I verified every code citation above
  against the shipped files at the time of writing (line numbers as of this branch).

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS before it reaches `senior-architect`.
