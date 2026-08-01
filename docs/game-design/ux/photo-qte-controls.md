# UX spec — Photo-paparazzi QTE: controls & HUD (ADR-0077)

**Surface:** the photo set-piece's dedicated full-screen telephoto view — input scheme
(desktop + mobile), HUD dress inside that view, and the planche-contact (contact sheet)
screen at scene end.
**Author:** `ux-designer` (Tony) · **Date:** 2026-08-01
**Status:** DRAFT — awaiting `lead-game-designer` (Karim) DESIGN GATE PASS.
**Decided upstream (not re-opened here):**
[ADR-0077](../../adr/0077-qte-photo-paparazzi-set-pieces.md) — the verb is frame + zoom +
shoot (D2), zoom is a fill-the-frame/sway trade-off (D3), feedback is two-beat (mechanical
click at the shutter, semantic verdict only at the contact sheet) (D8), tension is a
suspicion gauge fed by shutter-noise-vs-sound-cover plus finite film (D6), spotted = abort
to checkpoint, no death (D7). This spec owns only what the ADR explicitly delegates to
`ux-designer`: **"the desktop+mobile control scheme and its accessibility envelope."**
Tuning numbers (sway curve, gauge rates, film count, frame-fill thresholds) are
`game-designer`'s; the exact reward/fiction is `game-designer`+`narrative-designer`'s; the
look (type, grain, neon, photocopy treatment) is `lead-art`'s.
**Scope guard:** PROJECT_GUIDELINES §5 (Règles UX Non-Négociables), notably rule 5
("déplacement + une action — appris en 10 secondes") and rule 6 (no death "bullshit").
**Cahier des charges test:** Prohibition (Atari ST) had no photo mini-game — this is a
**conscious, documented extension** (ADR-0077 §Decision preamble). Its ergonomics are
therefore built by direct analogy to the one set-piece muf already ships and has gated
(the porte-cochère hostage duel, ADR-0034 + `spec-hostage-qte-hud-readability.md`), not
invented from nothing: same "dedicated full-screen view, world paused, diegetic reads over
abstract bars" family.

Render lane owner: `dev-r3f-render` (Amelia) — new telephoto view + contact-sheet screen
under `src/render`. Input lane owner: existing `useTouchControls`/`useGameLoop` pattern
(pinch-zoom, one-finger pan, two-finger tap) is reused/extended, not reinvented — see §1.6.
Gameplay state (suspicion value, film count, frame-fill validity, pose sequencing) is
`src/game`, owned by `dev-gameplay`; this spec says what must be **read and pressed**, not
how it is computed.

---

## 1. Control scheme — desktop and mobile

Four verbs, matching ADR-0077 D2's "frame + zoom + shoot" plus the posture toggle the ADR
delegates here. Kept to four so the set-piece stays learnable inside PROJECT_GUIDELINES
rule 5's spirit (core game is "move + one action"; a dedicated set-piece may need more, but
every added verb still needs a reason — here each of the four maps to one ADR mechanic,
none is decorative).

| Verb                     | Desktop                                           | Mobile                                                                    | Reuses                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Move the viewfinder      | Mouse position (absolute)                         | One-finger drag (relative pan)                                            | Core-game aim model: mouse = absolute crosshair, touch = relative pan (`useGameLoop.ts` "on mobile the crosshair sits at the last tap; on desktop it tracks the mouse") |
| Zoom (fill-frame ↔ sway) | Mouse wheel, continuous                           | Two-finger pinch, continuous                                              | `useTouchControls.ts` `MIN_ZOOM_FRACTION`/`MAX_ZOOM_FRACTION` pinch model, same axis (in = tighter/riskier)                                                             |
| Shutter                  | Left click                                        | Two-finger tap                                                            | Core-game "shoot" gesture (`pendingTaps` two-finger tap), re-skinned: same muscle memory, different consequence (evidentiary, not lethal)                               |
| Raise / lower the camera | Hold **Space** (press-and-hold, released = lower) | Hold a fixed on-screen button, bottom-corner, thumb zone (press-and-hold) | New — no existing analog; §1.5                                                                                                                                          |

### 1.1 Move the viewfinder (D2)

- **Desktop:** mouse position maps directly to viewfinder centre, identical model to the
  standing crosshair (`crosshairToWorld`) — no re-education needed, same input feel as
  every other aiming surface in the game.
- **Mobile:** one-finger drag pans the viewfinder relative to its last position, same
  gesture and directionality as the standing camera-pan swipe. It must **not** carry flick
  inertia (`flickVelocityX/Y`) — inertia is a "look around the street" affordance; the photo
  QTE's fill-the-frame trade-off (D3) needs the frame to stop exactly where the finger
  stops, or overshoot invisibly fails a frame the player thought was good. **Decision: flick
  is disabled inside the photo QTE's pan handler** (a new, scoped instance, not the shared
  one) — flag to `dev-r3f-render`/`dev-gameplay` at the seam.

### 1.2 Zoom — the frame-fill/sway lever (D3)

- **Desktop:** mouse wheel, continuous, no discrete steps — the player must be able to
  nudge zoom by a hair to solve the fill-the-frame trade-off, not jump between fixed levels.
- **Mobile:** two-finger pinch, same `PINCH_MIN_DELTA` "engage" threshold pattern as the
  existing camera pinch-zoom, so a two-finger tap-for-shutter is never misread as a pinch
  (and vice versa) — reuse the existing spread-delta gate, don't reinvent a new
  disambiguation rule.
- **Direction convention:** pinch-out / scroll-forward = zoom **in** (tighter frame, more
  sway) — matches the existing camera pinch convention's sense of "spread apart = see less,
  see it bigger," so players don't have to relearn a reversed axis inside the QTE.

### 1.3 Shutter (D2, D8)

- **Desktop:** left click. **Mobile:** two-finger tap — the same physical gesture core
  gameplay uses for "fire," which is deliberate: the player already has this reflex from the
  main game, and re-skinning it (bullet → shutter click) costs zero relearning while still
  making the fiction shift legible (D8's two-beat feedback carries the meaning change, not
  the input).
- Shutter presses while the camera is **lowered** (§1.5) are inert — swallowed, not queued,
  not penalised — same "invalid-state input is silently absorbed" pattern already used for
  refractory taps in the weapon system (`useGameLoop.ts` burst/refractory comment). No
  phantom click sound, no film consumed, no suspicion cost: a lowered camera cannot take a
  photo, full stop.

### 1.4 Raise / lower the camera — the posture toggle (delegated by ADR-0077)

This is the one verb the ADR does not describe mechanically, only names. Design intent:

- **Raised** = committed to framing. Zoom is live, sway accrues (D3), the shutter is armed,
  and shutter noise feeds the suspicion gauge against the scene's sound cover (D6).
- **Lowered** = the safe posture. The viewfinder retracts to a neutral, un-zoomed wide
  preview of the scene (helps the player reacquire where the action is inside a narrow
  telephoto FOV — a real problem at high zoom), sway resets to zero, and **suspicion does
  not climb**. The shutter is disarmed (§1.3).
- **Hold-to-raise, not a mode toggle switch.** Both devices use a **press-and-hold**
  control (Space on desktop, a fixed on-screen button on mobile), not a tap-to-toggle. This
  matters for two reasons: (a) it mirrors the real-world action it depicts (you hold a
  camera up to your eye; you don't flip a switch), so no copy is needed to explain it — the
  affordance is physically self-evident; (b) it gives the player a **zero-cost bail-out at
  all times** — releasing the hold instantly and unconditionally returns to the suspicion-
  safe, sway-safe lowered state, which doubles as an escape hatch inside the set-piece
  (§3.4) without a separate control to learn.
- **Mobile placement:** a fixed-position button in a bottom screen corner, chosen away from
  the one-finger pan zone (anywhere on the viewfinder) and the two-finger tap shutter (also
  anywhere on the viewfinder), so raising/lowering never competes for the same screen real
  estate as framing or firing. Exact corner (bottom-left vs bottom-right) is a `lead-art`
  layout call inside this spec's "away from the other two gestures" constraint.
- **Rejected alternative — tap-to-toggle raise/lower.** A tap toggle would need an explicit
  visual mode indicator (raised vs lowered isn't otherwise obvious at a glance the way "my
  thumb is on the button" is) and loses the free escape-hatch property above. Hold-to-raise
  costs nothing (holding a button is not fatiguing over a set-piece's short duration, ADR-0077
  Context: scripted, per-level, not open-ended) and buys the escape hatch for free.

### 1.5 Rejected alternatives (control scheme)

- **Drag-to-pan on desktop** (mirroring the raise/lower's hold semantics) was considered for
  viewfinder move, to keep desktop and mobile symmetric. Rejected: it would break the
  existing absolute-mouse-aim convention every other aiming surface in the game already
  teaches (crosshair, hostage duel), forcing a third input model into one session. Consistency
  with the standing convention wins over device symmetry.
- **A separate "abort scene" button.** Not needed — see §3.4: the standing pause control and
  the free lower-camera bail already cover this without adding a fifth verb.

**Acceptance (§1):**

- A1. e2e at desktop viewport: mouse-move relocates the viewfinder 1:1 with no re-centring
  jump; wheel changes zoom continuously; left-click only registers a shutter event while
  Space is held.
- A2. e2e at a mobile-landscape viewport (ADR-0003 viewport set): one-finger drag pans the
  viewfinder with **no** residual motion after finger-lift (flick disabled, assert
  `flickVelocityX/Y` unused in this handler); a two-finger pinch changes zoom without
  triggering a shutter tap, and vice versa.
- A3. Shutter input while the hold-button/Space is released produces zero film consumption,
  zero suspicion delta, zero click sound — assert on the game-state delta across the tick.

---

## 2. HUD dress of the telephoto view

The lesson already gated on the hostage duel applies directly here (D1 of
`spec-hostage-qte-hud-readability.md`): **diegetic reads over abstract HUD bars**, wherever
the fiction offers a diegetic instrument. A 1998 analogue camera offers three, for free:
the mechanical frame counter, a light-meter-style needle, and the AF-confirmation bracket.
Using them also reconciles ADR-0077's mandatory suspicion/film readouts with
PROJECT_GUIDELINES §6 ("la musique est le seul indicateur de tension — pas de barre de
stress"): these are not a generic stress bar bolted onto the screen, they are the tool's own
dials, in-world.

```
┌──────────────────────────────────────────────────────┐
│  ○ 14                                    ⟨needle⟩ ▤   │  ← corners: frame counter (L),
│                                                        │     suspicion needle (R)
│                    ┌ ┐          ┌ ┐                    │
│                                                        │
│                    └ ┘  target  └ ┘                    │  ← centre: AF-style corner
│                                                        │     brackets = focus indicator
│                                                        │
│                                                        │
│                                        [ hold: 👁 ]    │  ← mobile only: raise/lower
└──────────────────────────────────────────────────────┘
```

### 2.1 Film counter — diegetic, top-left (or wherever `lead-art` frames the eyepiece vignette)

A mechanical-style counter window (like an SLR's exposure-count dial), decrementing by one
on every shutter release regardless of the shot's eventual verdict (a "wasted" frame still
uses film — the ADR is explicit that every frame counts). No colour semantics; a numeral in
the fanzine mono/stencil face already used elsewhere. This is the sole moment-to-moment
"how many chances do I have left" read — it must be visible in **both** raised and lowered
posture (running out of film is a stake that exists regardless of posture).

### 2.2 Suspicion — a needle, not a bar

**Decision: the suspicion gauge is rendered as an analogue needle/dial (light-meter or VU-
meter form), not a linear HUD bar.** This satisfies ADR-0077 D6's mandatory display while
keeping the "no abstract stress bar" spirit the hostage-duel gate already established for
this codebase. The needle:

- Only moves while the camera is **raised** (§1.4) — a lowered camera cannot be spotted
  from noise it isn't making, so the needle visibly holds still, teaching the raise/lower
  trade-off for free.
- Reads through shape/position, not colour alone (§3.3): needle angle is the primary
  signal; a red zone painted at the dial's far end is a reinforcement, never the only tell.
- Sits in a screen corner opposite the film counter, so the two "how much room do I have
  left" readouts (time-pressure via suspicion, attempts-pressure via film) don't compete for
  the same glance.

### 2.3 Focus / frame-fill indicator — AF brackets, not a proof verdict

**Decision: corner brackets around the viewfinder's centre, exactly like a phone or DSLR's
autofocus-confirmation frame** — a convention every player already knows from a real
camera app, requiring zero new copy. Brackets read:

- **Loose/dashed** when the current frame-fill is outside the valid window (too wide or too
  tight, ADR-0077 D3a).
- **Tight/solid** when the frame-fill is inside the valid window — this is a **composition**
  read only ("this shot is well-framed"), never a **content** read ("this is the master
  proof"). Those are two different axes: frame-fill validity is knowable and shown live;
  which specific well-framed shot counts as master vs bonus vs nothing is reserved for the
  contact sheet per ADR-0077 D8's two-beat rule. The brackets must never pre-empt that by
  changing form/colour for master-vs-bonus — only for in-frame vs out-of-frame.
- Sway (D3b) visibly perturbs the brackets' position/jitter, which is the only depiction of
  sway difficulty — see §3.1 for its reduced-motion form.

### 2.4 What stays OFF this HUD

- **No numeric suspicion value, no numeric sway value.** Per D8, the player gets mechanical
  feedback at the shutter and semantic feedback at the contact sheet — a live number for
  either would leak a running verdict the ADR reserves for those two beats.
  Contradicts nothing above: the needle shows relative position (a glance read, "am I
  getting risky"), not a resolved value.
- **No standing global energy readout inside this view.** Unlike the hostage duel (where
  energy is the literal stake, D1.3bis), the photo QTE's stake per ADR-0077 D7 is scene
  abort/retry, not energy loss — carrying the energy stat into a scene where it is inert
  would mislead the player into believing it's live. **Flag to `game-designer`:** confirm no
  hidden energy cost exists on "spotted"; if one is added later, the energy readout must
  return per the same D1.3bis principle.

**Acceptance (§2):**

- A4. Screenshot during the QTE, camera raised: frame counter, suspicion needle and AF
  brackets are all visible and legible at both device classes.
- A5. Screenshot during the QTE, camera lowered: frame counter still visible; suspicion
  needle frozen (assert no delta across ticks while lowered); AF brackets not required to
  render (no framing to validate without a live viewfinder).
- A6. Grayscale screenshot: suspicion needle position and AF-bracket state are both
  distinguishable without colour.
- A7. No numeric suspicion or sway value appears anywhere in the DOM/canvas text during
  `ACTIVE` (grep the frame's text content in the e2e capture).

---

## 3. Accessibility

### 3.1 Reduced-motion: sway must degrade to a non-motion signal, not disappear

Per this project's established rule (`spec-hostage-qte-hud-readability.md` D4.1 — "degrade
the animation, keep the signal"), and per this brief's own non-negotiable ("reduced-motion
for the sway — il FAUT une alternative"): under `prefers-reduced-motion: reduce` (or the
in-app `data-reduced-motion="true"` flag, matching the project's OS-query-union pattern),
the AF brackets **must not visibly jitter/strobe** at high zoom, but the difficulty the sway
represents (holding a precise frame gets harder as zoom increases) must remain legible and
must remain a skill the player exercises — it cannot simply vanish (that would make the
zoom trade-off free for reduced-motion players, an unfair difficulty cliff in the other
direction).

**Decision:** under reduced motion, sway is represented as a **slow, smooth positional
drift** of the AF brackets (large amplitude, low frequency, well under the ~3 Hz seizure
floor and with no discontinuous jump) rather than high-frequency jitter. The player still
has to actively counter-steer the viewfinder to keep the brackets aligned — the _task_
(active correction under increasing displacement) survives; only the _motion quality_
(fast small shake → slow wide drift) changes. This is the same "form persists, signal
survives, only the motion channel changes" shape as D4.1's hostage-duel tell.
**Tuning seam → `game-designer`:** the exact reduced-motion drift curve must produce
comparable difficulty to the standard sway curve at each zoom level — that calibration is
tuning, not UX; I only require that "comparable challenge, non-strobing form" property
holds, checked at playtest.

### 3.2 Touch targets ≥ 44×44 CSS px (project standing floor)

- The mobile raise/lower hold-button (§1.4): ≥44×44px, and given it is **held** rather than
  tapped, err generously larger (recommend ≥56px) so a held thumb doesn't drift off the hit
  area mid-hold and accidentally lower the camera during a critical frame.
- Any contact-sheet navigation control (§4.3): ≥44×44px, same floor as
  `ux-run-stats-endscreen.md` §3.2 and `spec-boss-qte-differentiation-ux.md`.

### 3.3 B&W fanzine legibility — contrast as function, never colour-only

- The suspicion needle (§2.2), the AF brackets (§2.3), and every contact-sheet verdict
  stamp (§4.2) must each be readable from **shape/position/text alone**, verified in a
  grayscale capture — matching the standing rule from every prior QTE spec in this folder.
  Colour (if `lead-art` adds a neon accent) may reinforce, never carry, any of these three
  reads.
- Contrast against the backdrop: the AF brackets and needle must clear legibility contrast
  against whatever key-pose backdrop sits behind them at all authored scenes — same
  "contrast-as-function" requirement as `spec-hostage-qte-hud-readability.md` D4.3, applied
  here to the viewfinder overlay instead of the exposed-head tell.

### 3.4 Escape hatch — the player is never trapped in the set-piece

Two independent, discoverable ways out, neither of which is the ADR's "spotted" failure
path (which is a gameplay outcome, not an accessibility affordance):

- **Standing pause stays live.** The QTE does not intercept or disable the game's existing
  pause control. Pausing mid-photo-QTE freezes film count, suspicion needle position and
  sway exactly where they were (no gauge decay/growth while paused) and resumes to the same
  state — same "a toggle/escape that doesn't persist is a lie" standard this brief opens
  with, applied to "pausing must not cost you the attempt."
- **Free zero-cost bail via lower-camera (§1.4).** Releasing the hold at any time returns to
  the safe, suspicion-frozen, sway-reset lowered posture with no penalty — a player who
  feels rushed, motion-sick, or just needs to reorient always has an immediate, self-evident
  way to step back without losing film or triggering "spotted."
- **Flag to `dev-gameplay`/`senior-architect`:** confirm the pause implementation
  (`paused` flag in `useGameLoop`) already freezes this QTE's own gauges by construction
  (tick-gated) rather than needing bespoke pause-handling in the new state machine — if the
  new photo-QTE state lives outside the tick-gated loop, this must be re-verified explicitly.

**Acceptance (§3):**

- A8. e2e with emulated `prefers-reduced-motion: reduce`: capture sequence during rising
  zoom shows smooth, non-strobing bracket drift (no frame-to-frame jump exceeding a "slow
  drift" delta budget) — no high-frequency jitter present.
- A9. e2e: pausing mid-QTE and resuming after a delay shows identical film count, needle
  position and (reduced-motion) drift phase before and after — zero gauge movement while
  paused.
- A10. e2e: releasing the raise hold immediately (next tick) freezes the suspicion needle
  and disarms the shutter, at both device classes.
- A11. Touch-target audit: raise/lower button and contact-sheet nav controls both ≥44×44
  CSS px at a mobile-landscape viewport.

---

## 4. Planche contact (contact sheet) — reading verdicts, navigation

Appears once per set-piece conclusion (success, or film exhausted without a master proof —
"spotted" scatters the scene per D7 and likely skips straight to checkpoint-retry rather
than a contact sheet; **flag to `game-designer`:** confirm whether "spotted" ever reaches
the contact sheet or always bypasses it — this spec covers the sheet's contents either way).

### 4.1 Layout — one glance, no pagination, while film count stays small

Every frame shot during the scene renders as one thumbnail in a single grid, sized to fit
one viewport without scrolling or paging, following the same "3 cards max per viewport row"
discipline as level-select and the same "no extra step" principle as the run-stats endscreen
detail panel. **Constraint on tuning:** this only holds if authored film counts
(`game-designer`'s call, ADR-0077 D6) stay within a glanceable ceiling — **recommend ≤8
frames per set-piece** so the grid never needs pagination; if a design wants more, flag back
to me before shipping, since a paginated contact sheet reintroduces the "extra step" cost
this genre of screen exists to avoid.

### 4.2 Verdict stamps — legible without colour, three states

Photocopy-B&W fanzine treatment (`lead-art`'s look; this spec fixes only that each state is
distinguishable by shape/text, not hue):

- **MASTER PROOF** — the mandatory incriminating shot: a distinct ink-stamp mark (e.g. a
  bold rectangular stamp with its own glyph/text, not a generic checkmark that could be
  confused with "bonus").
- **Bonus proof** — any other valid, well-composed shot of a secondary photographable
  instant (D5): a different stamp shape/mark from the master's, so the two are never
  confused at a glance even in grayscale.
- **Rejected** — blurred (mechanical click was "mou," per D8) or out-of-frame shots: an
  unambiguous reject mark (e.g. a crossed-out or "X" stamp), plus the thumbnail itself
  rendered visibly blurred/degraded so the reject reads even to a player who can't parse the
  stamp glyph.

All three stamps must be told apart in a grayscale capture (A13 below) — this is the exact
moment ADR-0077 D8 promised the player the semantic verdict it withheld at the shutter; if
the three states aren't unambiguous here, the whole two-beat feedback design fails its one
job.

### 4.3 Navigation and exit

- **No per-frame drill-down required for the common case** (§4.1's ≤8-frame ceiling): the
  grid itself, plus its stamps, is the full read. If `lead-art`/`game-designer` still want a
  tap-to-enlarge inspect state for storytelling value, it is additive, optional, and must
  not gate the primary CTA behind it.
- **One primary CTA**, sized ≥44×44px, whose label matches the outcome
  (`Continuer` if the master proof was captured, `Réessayer` otherwise) — exact trigger
  condition is `dev-gameplay`'s state machine, this spec only requires the CTA read matches
  the state the player is looking at (never a generic "OK" that hides whether they passed).
- Standard input equivalence: click/tap the CTA on both devices; no keyboard-only trap
  (Enter/Space also triggers it, consistent with the project's existing menu-button
  convention).

**Acceptance (§4):**

- A12. Screenshot of the contact sheet at both device classes: all shots fit one viewport,
  no scroll/pagination control present, for a set-piece authored at or under 8 frames.
- A13. Grayscale screenshot: master-proof, bonus-proof and rejected stamps are each
  distinguishable from the other two by shape/text alone.
- A14. Screenshot on a "no master proof" outcome vs a "master proof captured" outcome: CTA
  label differs and matches the state.
- A15. CTA hit area ≥44×44 CSS px at a mobile-landscape viewport; Enter/Space also
  activates it on desktop.

---

## Seams handed off explicitly

- **→ `game-designer` (Sacha):** reduced-motion drift-curve calibration (§3.1); confirm
  whether "spotted" reaches the contact sheet or bypasses it (§4); confirm no hidden energy
  cost on abort, or restore the energy readout if one exists (§2.4); film-count ceiling for
  the no-pagination contact sheet (§4.1, recommend ≤8).
- **→ `narrative-designer` (Yasmine):** none directly from this spec — the raise/lower and
  shutter copy (if any on-screen label is needed beyond the self-evident hold-button icon)
  should stay wordless per the tutorial's device-fork precedent (ADR-0015 D3: no extra copy
  where the affordance is physically self-evident); flag if a label is wanted after all.
- **→ `lead-art` (Nico):** exact placement/skin of the frame counter, needle dial, AF
  brackets and verdict stamps (functions fixed above, look is yours); mobile raise/lower
  button corner choice within the "away from pan/tap zones" constraint (§1.4).
- **→ `dev-gameplay`:** flick-disabled scoped pan handler for the photo QTE (§1.1); shutter
  input swallowed while lowered, no state/side-effect (§1.3); suspicion frozen while lowered
  and while paused (§2.2, §3.4); frame-fill vs master/bonus content are two separate,
  independently computed fields — the render lane must not be handed a single flag that
  conflates them (§2.3).
- **→ `dev-r3f-render`:** everything drawn — §2 HUD dress, §3 reduced-motion branch, §4
  contact sheet. Verify on both device classes at VERIFY; I review the built screens against
  A1–A15 there.
- **→ `sound-designer`:** the shutter's crisp/dull click timbre pairing with D8's
  focus-held/blurred outcome is a joint UX×audio read (mechanical feedback channel) — audio
  carries the "crisp vs dull" distinction as much as any visual does; reconcile the exact
  sound design with this spec's requirement that the click alone, with no visual cue,
  should already hint focus state to an attentive ear.

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS before it reaches
`senior-architect`. Flagged, per the standard design-loop protocol.
