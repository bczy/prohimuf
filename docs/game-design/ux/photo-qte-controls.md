# UX spec — Photo-paparazzi QTE: controls & HUD (ADR-0077)

**Surface:** the photo set-piece's dedicated full-screen telephoto view — input scheme
(desktop + mobile), HUD dress inside that view, and the planche-contact (contact sheet)
screen at scene end.
**Author:** `ux-designer` (Tony) · **Date:** 2026-08-01
**Status:** DRAFT — Rev.2, addressing the round-1 design gate
(`docs/game-design/design-gate-photo-qte.md`): blocking **T-1** (third bracket state,
`locked`) and **T-2** (mobile simultaneous-contact budget), plus conditions **T-3…T-6**.
Round 2, awaiting `lead-game-designer` (Karim) DESIGN GATE PASS.
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

| Verb                     | Desktop                                           | Mobile                                                                                     | Reuses                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Move the viewfinder      | Mouse position (absolute)                         | One-finger drag (relative pan)                                                             | Core-game aim model: mouse = absolute crosshair, touch = relative pan (`useGameLoop.ts` "on mobile the crosshair sits at the last tap; on desktop it tracks the mouse") |
| Zoom (fill-frame ↔ sway) | Mouse wheel, continuous                           | Two-finger pinch, continuous                                                               | `useTouchControls.ts` `MIN_ZOOM_FRACTION`/`MAX_ZOOM_FRACTION` pinch model, same axis (in = tighter/riskier)                                                             |
| Shutter                  | Left click                                        | Two-finger tap                                                                             | Core-game "shoot" gesture (`pendingTaps` two-finger tap), re-skinned: same muscle memory, different consequence (evidentiary, not lethal)                               |
| Raise / lower the camera | Hold **Space** (press-and-hold, released = lower) | **Tap-to-toggle** a fixed on-screen button, bottom-corner, thumb zone (§1.4 — device fork) | New — no existing analog; §1.5                                                                                                                                          |

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

**Device fork (T-2, round-2 correction).** Round 1 specified press-and-hold on both devices.
Karim's gate named the resulting mobile contact budget precisely: while raised, the scheme
demanded the held raise button (1 contact) **+** one-finger pan (1) **+** two-finger pinch
(2) **+** two-finger tap shutter (2) simultaneously — up to **3 concurrent contacts** on a
hand-held landscape phone, one of which (the raise thumb) must not drift for the whole
framing or it silently disarms the shutter for 0.40 s (D1.b) at the worst possible moment.
ADR-0003 makes mobile _supported_, and supported means playable at that budget — it wasn't.
The fix is a **device fork on this one verb only**, not a redesign of the other three:

- **Desktop — unchanged, hold-to-raise.** Space, press-and-hold, released = lower. It
  mirrors the real-world action it depicts (you hold a camera up to your eye), needs no
  copy, and the mouse/keyboard split means the hold costs no contact the other three verbs
  need — desktop was never in K-2's budget.
- **Mobile — tap-to-toggle, not hold.** A single tap on the fixed on-screen button raises;
  a single tap on the same button lowers. This removes the sustained raise contact
  entirely: the canvas gesture layer (`useTouchControls.ts`) already time-multiplexes pan
  (1 finger) and pinch/shutter (2 fingers, disambiguated by movement, never both at once —
  `mode: "pan" | "two"`) onto **at most 2 simultaneous contacts**, and the toggle now adds
  **zero** sustained contacts on top of that. Framing + zooming + shooting on mobile never
  requires more than 2 fingers down at once, satisfying the gate's "≤2 simultaneous
  contacts, one of which may be the held raise" constraint with margin — there is no longer
  a third contact to spend the budget on. It also removes the drift-disarm failure mode
  outright: there is no held thumb to slip.
- **The escape hatch survives the toggle, as required.** §1.5's original objection to
  tap-to-toggle was the missing "obviously held" affordance and the loss of a _free_
  bail-out. Both are answered directly: (a) the button's **icon swaps on state change**
  (raised icon ↔ lowered icon — a code-drawn gesture icon per the ADR-0020 precedent, no
  copy), so posture is legible at a glance without relying on proprioception; (b) the
  bail-out is still **one tap, zero cost** — tapping the same button while raised lowers
  immediately, freezing suspicion and resetting sway exactly as the held-release did in
  round 1. "Free" survives; "held" does not need to.
- **Mobile placement:** unchanged — a fixed-position button in a bottom screen corner,
  chosen away from the one-finger pan zone (anywhere on the viewfinder) and the two-finger
  tap shutter (also anywhere on the viewfinder). Exact corner (bottom-left vs bottom-right)
  is a `lead-art` layout call inside this spec's "away from the other two gestures"
  constraint.
- **Why not "shrink the touch budget some other way" instead (e.g. one-finger tap
  shutter).** Rejected: the two-finger tap is the core game's shared shoot gesture (§1.3);
  re-deriving a one-finger shutter here would desync it from `pendingTaps`/`isDoubleTap` and
  create the exact "double-tap shoots" ambiguity that ADR-0003/D7 already solved once for
  pan vs. fire. The raise verb was the only one both (a) new to this set-piece and (b) not
  load-bearing on a _held_ semantic for the fiction (§1.4's diegesis is "the camera reaches
  your eye," which a tap-raise still depicts — it is the _release_ that is the hold, not the
  raise). Fixing the one new verb is cheaper and safer than touching three shipped ones.

### 1.5 Rejected alternatives (control scheme)

- **Drag-to-pan on desktop** (mirroring the raise/lower's hold semantics) was considered for
  viewfinder move, to keep desktop and mobile symmetric. Rejected: it would break the
  existing absolute-mouse-aim convention every other aiming surface in the game already
  teaches (crosshair, hostage duel), forcing a third input model into one session. Consistency
  with the standing convention wins over device symmetry.
- **A separate "abort scene" button.** Not needed — see §3.4: the standing pause control and
  the free lower-camera bail already cover this without adding a fifth verb.
- **Hold-to-raise on mobile too, round 1's shape.** Rejected in round 2 — see T-2 above:
  it is the specific scheme that breaches the ≤2-simultaneous-contact floor. Kept on
  desktop, where the budget problem does not exist.

**Acceptance (§1):**

- A1. e2e at desktop viewport: mouse-move relocates the viewfinder 1:1 with no re-centring
  jump; wheel changes zoom continuously; left-click only registers a shutter event while
  Space is held.
- A2. e2e at a mobile-landscape viewport (ADR-0003 viewport set): one-finger drag pans the
  viewfinder with **no** residual motion after finger-lift (flick disabled, assert
  `flickVelocityX/Y` unused in this handler); a two-finger pinch changes zoom without
  triggering a shutter tap, and vice versa.
- A3. Shutter input while lowered (Space released on desktop; toggled-lowered on mobile)
  produces zero film consumption, zero suspicion delta, zero click sound — assert on the
  game-state delta across the tick.
- A3bis (T-2). e2e at a mobile-landscape viewport, camera raised: a single tap on the
  raise/lower button toggles posture with **no other finger down** (assert the toggle needs
  zero sustained contact); count the maximum simultaneous `touches.length` observed across
  a full frame-attempt (raise → pan → pinch → shutter tap) and assert it never exceeds
  **2**; assert the button's rendered icon differs between raised and lowered states
  (grayscale-legible, no colour-only tell, same floor as A6).

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
│                                                        │     brackets — 3 states, §2.3
│                                                        │
│                                                        │
│                                          [ 👁 raise ]  │  ← mobile only: raise/lower
└──────────────────────────────────────────────────────┘   (tap-to-toggle, §1.4)
```

### 2.1 Film counter — diegetic, top-left (or wherever `lead-art` frames the eyepiece vignette)

A mechanical-style counter window (like an SLR's exposure-count dial), decrementing by one
on every shutter release regardless of the shot's eventual verdict (a "wasted" frame still
uses film — the ADR is explicit that every frame counts). No colour semantics; a numeral in
the fanzine mono/stencil face already used elsewhere. This is the sole moment-to-moment
"how many chances do I have left" read — it must be visible in **both** raised and lowered
posture (running out of film is a stake that exists regardless of posture); at the ratified
`filmCount = 6` it counts down `6 → 0` across the scene.

**T-6 reconciliation (minor, no re-gate).** Round 1 specified a mechanical dial with a bare
numeral; the fiction spec's §4.2 independently supplied a `POSES : {n}` (12-character)
caption. **Decision: the dial with its numeral is the counter itself; `POSES` is used only
as the dial's engraved caption if `lead-art`'s eyepiece-vignette treatment needs a label at
all** (a real SLR frame-counter window is often unlabelled, so the caption is optional
dressing, not a second readout) — there is one number on screen, not two, whichever way
`lead-art` frames it.

### 2.2 Suspicion — a needle, not a bar, and not a light meter (T-4)

**Decision: the suspicion gauge is rendered as an analogue needle/dial, not a linear HUD
bar.** This satisfies ADR-0077 D6's mandatory display while keeping the "no abstract stress
bar" spirit the hostage-duel gate already established for this codebase. The needle:

- Only moves while the camera is **raised** (§1.4) — a lowered camera cannot be spotted
  from noise it isn't making, so the needle visibly holds still, teaching the raise/lower
  trade-off for free.
- Reads through shape/position, not colour alone (§3.3): needle angle is the primary
  signal; a red zone painted at the dial's far end is a reinforcement, never the only tell.
- Sits in a screen corner opposite the film counter, so the two "how much room do I have
  left" readouts (time-pressure via suspicion, attempts-pressure via film) don't compete for
  the same glance.

**T-4 correction — the dial form is ratified, the light-meter _reading_ is not.** Round 1's
"light-meter or VU-meter form" phrasing invited exactly the wrong metaphor: a light meter
measures _light_, and this gauge is driven purely by shutter-noise-vs-sound-cover (D6), not
brightness. If the dress reads as an exposure meter, an attentive player will build a false
causal model — "shoot in the bright parts" — for a mechanic that has nothing to do with
light. **Decision: keep the analogue-dial form (needle + scale, the VU-meter's mechanical
silhouette), but no copy, glyph, numeral, or art treatment on this dial may present it as a
light/exposure instrument** (no lux markings, no sun/aperture iconography, no "EV" framing).
The house rule this satisfies (G-2, gate §6) is: an instrument of the fiction's own tool,
carrying no numeral, readable by shape/position — a VU-meter-style noise gauge clears that
bar; a light meter does not, because it teaches the wrong lever. **Handed to `lead-art`
(Nico) as a hard constraint on the dress, not a look choice** — see the seams list.

### 2.3 Focus / frame-fill indicator — AF brackets, three states, never the verdict (T-1)

**Decision: corner brackets around the viewfinder's centre, exactly like a phone or DSLR's
autofocus-confirmation frame** — a convention every player already knows from a real
camera app, requiring zero new copy. Round 2 correction (T-1, imposed by the gate, mirrored
by the mechanic spec's `T5 FOCUS HELD` test): a two-state bracket (dashed/solid) can show
composition validity but cannot show that the **0.35 s continuous hold** (D2/T5,
`FOCUS_HOLD`) the shutter actually checks has been satisfied — a player who releases the
instant the brackets turn solid, before the hold completes, gets a silent `REJECTED` with no
warning they were ever close. **The brackets now carry three states:**

- **`dashed`** — composition invalid (frame-fill outside the valid window, too wide or too
  tight, ADR-0077 D3a) **or** containment/margin broken. Nothing is charging.
- **`solid`** — composition valid (inside the fill window, contained with margin) and the
  focus hold has **started charging**, but has not yet reached `FOCUS_HOLD`. A shutter
  release here still `REJECTED`s (T5 not yet true) — the bracket only promises "you are on
  the right track," not "shoot now."
- **`locked`** — focus has been held continuously for `FOCUS_HOLD ≥ 0.35 s`; a release now
  will pass T5. This is the only state in which the shutter's outcome depends solely on
  which instant (`I.role`) the timeline is in — a fact the brackets never disclose.

**What the three states must never do — the anti-leak floor (F12, gate §3).** All three
readbacks are **composition/focus-mechanics only**:

- They never change form/colour for master-vs-bonus-vs-nothing — that axis is reserved for
  the contact sheet (ADR-0077 D8's two-beat rule). `locked` on a `NO_SUBJECT` frame and
  `locked` on the master instant must render **identically**.
- They must not pre-empt or anticipate "something is about to happen now" — per the
  mechanic spec's F12(2), the subject track's own transit between instants must not begin
  before that instant's authored tell, and the brackets, reading the track live, inherit
  that guarantee rather than adding a leak of their own. `locked`/`solid`/`dashed` transitions
  driven by the player's own framing and hold timing are fine; a transition driven by the
  track pre-empting the next instant is not, and is a `dev-gameplay` implementation
  obligation (F12), not a UX one.
- Sway (D3b) visibly perturbs the brackets' position/jitter in all three states — that is
  the only depiction of sway difficulty (§3.1 for its reduced-motion form), and it does not
  change which of the three states is showing.

**Rejected alternative — a numeric or progress-ring hold timer.** A visible "0.35 s"
countdown or filling ring would be a stronger tell than the state machine needs and would
read as exactly the kind of stress-bar numeral PROJECT_GUIDELINES §6 forbids; `solid →
locked` as a binary state change is legible without a number and matches the AF-confirmation
convention the whole indicator borrows.

### 2.4 What stays OFF this HUD

- **No numeric suspicion value, no numeric sway value, no hold-timer numeral.** Per D8, the
  player gets mechanical feedback at the shutter and semantic feedback at the contact sheet
  — a live number for any of these would leak a running verdict the ADR reserves for those
  two beats. Contradicts nothing above: the needle shows relative position and the brackets
  show a three-state read (a glance read, "am I getting risky" / "am I locked"), never a
  resolved value.
- **No standing global energy readout inside this view — ratified, not a flag.** Round 1
  flagged this pending confirmation; the mechanic spec now states it flatly (§D7.1 / F8:
  `SPOTTED` moves **no** energy, no score, no run, no quota, asserted as a zero-delta test).
  Unlike the hostage duel (where energy is the literal stake, D1.3bis), the photo QTE's
  stake is scene abort/retry only — carrying the energy stat into a scene where it is
  structurally inert would mislead the player into believing it's live. Closed: the energy
  readout stays off this HUD, full stop, no future re-open unless a future ADR moves energy
  onto this set-piece (at which point D1.3bis applies again by the same logic).

**Acceptance (§2):**

- A4. Screenshot during the QTE, camera raised: frame counter, suspicion needle and AF
  brackets are all visible and legible at both device classes.
- A5. Screenshot during the QTE, camera lowered: frame counter still visible; suspicion
  needle frozen (assert no delta across ticks while lowered); AF brackets not required to
  render (no framing to validate without a live viewfinder).
- A6. Grayscale screenshot: suspicion needle position and **all three** AF-bracket states
  (`dashed`/`solid`/`locked`) are each distinguishable from the other two, without colour.
- A7. No numeric suspicion, sway, or hold-timer value appears anywhere in the DOM/canvas
  text during `ACTIVE` (grep the frame's text content in the e2e capture).
- A7bis (T-1/F12). Scripted playtest capture: a `locked`-state frame shot on a `NO_SUBJECT`
  interval and a `locked`-state frame shot on the master interval render **pixel-identical**
  bracket dress (diff the bracket region only) — the lock state never varies with the
  hidden verdict.

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

- The mobile raise/lower toggle button (§1.4, T-2 correction): ≥44×44px. It is now a
  **tap**, not a hold, so the round-1 "err larger for a held thumb" reasoning no longer
  applies — but keep the generous ≥56px target anyway, since a mis-tap on a moving thumb
  mid-reframe (toggling posture by accident) is exactly as costly as the round-1 drift-off
  failure it replaces, just triggered differently.
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
  sway exactly where they were (no gauge decay/growth while paused) — same "a toggle/escape
  that doesn't persist is a lie" standard this brief opens with, applied to "pausing must
  not cost you the attempt."
- **Free zero-cost bail via lower-camera (§1.4).** Desktop: releasing the Space hold at any
  time returns to the safe, suspicion-frozen, sway-reset lowered posture. Mobile (T-2): a
  single tap on the same button does the same. Either way, no penalty — a player who feels
  rushed, motion-sick, or just needs to reorient always has an immediate, self-evident way
  to step back without losing film or triggering "spotted."
- **T-5 correction — posture on resume-from-pause, previously unspecified.** Round 1 said
  "resumes to the same state," but a **held** control (desktop Space, and round 1's mobile
  hold) is not reliably still held across a pause overlay — the player's finger/key may have
  left the input entirely while the overlay had focus, and "resume to RAISED" would then be
  reviving a hold that no longer physically exists. **Decision: posture always resumes
  `LOWERED`**, regardless of the posture at the moment pause was triggered. The focal value
  is retained (D1.a — this is not a re-zoom penalty), sway is at zero (as it always is when
  lowered), and the shutter re-arms from a fresh raise (`SHUTTER_ARM_SECONDS` runs again) on
  whichever device: press-and-hold Space again on desktop, one tap on mobile. This is one
  rule for both devices — the toggle model (T-2) makes it cheap on mobile too (a single tap
  re-raises), so there is no asymmetric cost to pausing on either input scheme.
- **Flag to `dev-gameplay`/`senior-architect`:** confirm the pause implementation
  (`paused` flag in `useGameLoop`) already freezes this QTE's own gauges by construction
  (tick-gated) rather than needing bespoke pause-handling in the new state machine — if the
  new photo-QTE state lives outside the tick-gated loop, this must be re-verified explicitly.

**Acceptance (§3):**

- A8. e2e with emulated `prefers-reduced-motion: reduce`: capture sequence during rising
  zoom shows smooth, non-strobing bracket drift (no frame-to-frame jump exceeding a "slow
  drift" delta budget) — no high-frequency jitter present.
- A9. e2e: pausing mid-QTE (both while raised and while lowered) and resuming after a delay
  shows (a) identical film count and needle position immediately before pause vs immediately
  after resume — zero gauge movement while paused — and (b) posture is **`LOWERED`** on
  resume in both cases, shutter disarmed, focal value unchanged from its pre-pause value
  (T-5).
- A10. e2e: releasing the raise hold on desktop, or tapping the toggle button on mobile,
  immediately (next tick) freezes the suspicion needle and disarms the shutter — at both
  device classes.
- A11. Touch-target audit: raise/lower button and contact-sheet nav controls both ≥44×44
  CSS px at a mobile-landscape viewport.

---

## 4. Planche contact (contact sheet) — reading verdicts, navigation

Appears once per set-piece conclusion — **ratified by the gate, no longer an open flag**:
`SPOTTED` reaches the contact sheet exactly like `ROLL_END`/`SCENE_END` (mechanic spec §1.1),
truncated to whatever frames were actually shot before the scatter. This is the sheet's only
mode of appearance; there is no bypass path to design against.

### 4.1 Layout — one glance, no pagination, at the ratified film count

Every frame shot during the scene renders as one thumbnail in a single grid, sized to fit
one viewport without scrolling or paging, following the same "3 cards max per viewport row"
discipline as level-select and the same "no extra step" principle as the run-stats endscreen
detail panel. **Ratified, not a recommendation any more:** `filmCount = 6` (mechanic spec
§5.1 — 3 authored instants + 3 spare frames), which lays out as a clean **2 × 3 grid**
(3 thumbnails per row × 2 rows), inside this spec's own ≤8 no-pagination ceiling (mechanic
spec F6) with headroom to spare. If a future set-piece wants a different film count, the
ceiling (≤8, no-pagination) is the standing constraint to check against, not this specific
grid shape.

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

### 4.3 Navigation and exit — retry AND decline, never retry alone (T-3, pairs with K-4/F-1)

- **No per-frame drill-down required for the common case** (§4.1's 2×3 grid): the grid
  itself, plus its stamps, is the full read. If `lead-art`/`game-designer` still want a
  tap-to-enlarge inspect state for storytelling value, it is additive, optional, and must
  not gate the primary CTA behind it.
- **T-3 correction — two CTAs on the no-master-proof branch, not one.** Round 1 specified a
  single primary CTA whose label switched between `Continuer` and `Réessayer`. The gate
  named the resulting contradiction directly: both specs simultaneously assert the
  set-piece is "bonus, never a gate," yet a player without a master proof was offered
  exactly one button, and it read "do it again" — an unbounded retry loop bolted in front of
  a 3–5 minute mission, which _is_ a soft gate in practice however the docs describe it.
  **Decision:** on a no-master-proof outcome (whether via `ROLL_END`, `SCENE_END`, or
  `SPOTTED`), the sheet shows **two** controls:
  - **`Réessayer`** (primary, as before) — checkpoint retry, unchanged.
  - **A decline CTA** (secondary, same row, both ≥44×44px) that leaves the set-piece for
    good and returns to the Stalingrad delivery at the baseline (×1.00) boss state — no
    master proof, no bonus, no bad ending, just "you didn't get the shot, moving on." Exact
    label is `narrative-designer`'s (F-1 pairs this UX correction with Yasmine's decline
    copy — fiction variant (c), _"Alors ils remettront ça. Ils remettent toujours ça,"_
    already reads as a decline, not a retry, so the button text should say so plainly rather
    than implying another attempt is expected).
  - On a **master-proof** outcome there remains exactly **one** CTA, `Continuer` — the
    two-button layout only appears on the branch where a choice (retry vs move on) actually
    exists.
- Standard input equivalence: click/tap either CTA on both devices; no keyboard-only trap
  (Enter/Space also triggers the focused CTA, consistent with the project's existing
  menu-button convention); Tab/arrow order between the two CTAs on the no-master branch
  follows the project's standing focus-order convention (primary action first).

**Acceptance (§4):**

- A12. Screenshot of the contact sheet at both device classes: all 6 shots fit one viewport
  in a 2×3 grid, no scroll/pagination control present.
- A13. Grayscale screenshot: master-proof, bonus-proof and rejected stamps are each
  distinguishable from the other two by shape/text alone.
- A14. Screenshot on a "no master proof" outcome (including a truncated `SPOTTED` sheet)
  shows **two** CTAs, `Réessayer` and the decline control, both labelled distinctly from
  each other and from `Continuer`; screenshot on a "master proof captured" outcome shows
  **exactly one** CTA, `Continuer`.
- A14bis (T-3/K-4). e2e: activating the decline CTA on a no-master-proof outcome returns
  play to the Stalingrad delivery with the boss `rewardMultiplier` at its baseline (×1.00)
  and consumes **zero** additional retries/time beyond the single press — assert the
  transition happens in one input, no confirmation dialog, no second screen.
- A15. Both CTAs (where two are shown) hit area ≥44×44 CSS px at a mobile-landscape
  viewport, with visible spacing so a fat-finger tap cannot trigger the wrong one; Enter/Space
  also activates the focused CTA on desktop.

---

## Seams handed off explicitly (round 2, post-gate)

**Closed by the round-1 gate — no longer open flags, restated here so this spec is
self-contained:**

- `SPOTTED` reaches the contact sheet, truncated, with `Réessayer` + decline (§4). Not a
  bypass path — settled.
- No hidden energy cost on any outcome; the energy readout stays off this HUD, structurally
  (§2.4). Closed, not conditional.
- `filmCount = 6`, laid out as a fixed **2 × 3** grid, no pagination (§4.1). Not a
  recommendation — the ratified value.
- Reduced-motion sway (§3.1: slow positional drift, non-strobing, comparable challenge) —
  form ratified by the gate; the exact drift-curve **calibration** remains
  `game-designer`'s tuning call, checked at playtest against the "comparable challenge"
  property this spec states.

**Still open, this round's hand-offs:**

- **→ `game-designer` (Sacha):** reduced-motion drift-curve calibration against the standard
  sway curve (§3.1, tuning only, form is fixed); the F12(1)/(2) authored-data legs that make
  §2.3's anti-leak floor assertable (subject-box-matches-silhouette tolerance, no-early-transit
  keyframes) are yours per the mechanic spec's K-2 correction — this UX spec only states what
  the brackets must never leak, not how the track data proves it.
- **→ `narrative-designer` (Yasmine):** the decline CTA's label (§4.3, T-3/F-1 pairing) —
  fiction variant (c) already supplies the tone (_"Alors ils remettront ça"_), this spec only
  fixes that it must be a visually and semantically distinct **second** button, never folded
  into `Réessayer`'s copy. Raise/lower and shutter stay wordless per the tutorial's
  device-fork precedent (ADR-0015 D3: no extra copy where the affordance is physically
  self-evident) — the mobile toggle's icon swap (§1.4) is a code-drawn gesture icon
  (ADR-0020 precedent), not a copy need; flag if a label is wanted after all.
- **→ `lead-art` (Nico):** exact placement/skin of the frame counter, needle dial, AF
  brackets (now three states, §2.3) and verdict stamps (functions fixed above, look is
  yours); mobile raise/lower button corner choice within the "away from pan/tap zones"
  constraint (§1.4), plus its two icon states (raised/lowered, §1.4); **two hard
  constraints, not look choices** — (1) T-4: the suspicion dial's dress may never present as
  a light/exposure meter (no lux markings, no sun/aperture iconography) since the mechanic
  it reads is shutter-noise-vs-cover, not brightness; (2) F-4/F12: the drawn subject at every
  keyframe must match the validation box the mechanic spec authors — the art and the
  keyframe table are one deliverable, and this scene's subject must read **without** the
  interactive-glow vocabulary (guidelines §5) since it is the interactive element but must
  never itself be shot.
- **→ `dev-gameplay`:** flick-disabled scoped pan handler for the photo QTE (§1.1); shutter
  input swallowed while lowered, no state/side-effect (§1.3); mobile raise/lower as a
  **toggle** (tap raises, tap lowers — no held-contact state to track, §1.4, T-2); posture
  always resumes `LOWERED` on unpause regardless of pre-pause posture, focal retained,
  shutter re-arms on next raise (§3.4, T-5); suspicion frozen while lowered and while paused
  (§2.2, §3.4); the third bracket state (`dashed`/`solid`/`locked`) is driven by `T3∧T4`
  (composition) and `T5` (`FOCUS_HOLD` continuity) only, and must render identically
  regardless of the hidden `NO_SUBJECT`/`master`/`bonus` verdict (§2.3, F12 — A7bis is the
  check); frame-fill vs master/bonus content stay two separate, independently computed
  fields, never a single flag (§2.3); the decline CTA (§4.3) transitions to the Stalingrad
  delivery at baseline (×1.00) `rewardMultiplier` in one input, no intermediate state.
- **→ `dev-r3f-render`:** everything drawn — §2 HUD dress (three-state brackets, non-light-
  meter needle dress), §3 reduced-motion branch, §4 contact sheet (2×3 grid, two-CTA
  no-master branch), the mobile toggle button's two icon states. Verify on both device
  classes at VERIFY; I review the built screens against A1–A15 (+ A3bis, A7bis, A14bis)
  there.
- **→ `sound-designer` (Malik):** the shutter's crisp/dull click timbre pairing with D8's
  focus-held/blurred outcome is a joint UX×audio read (mechanical feedback channel) — audio
  carries the "crisp vs dull" distinction as much as any visual does; reconcile the exact
  sound design with this spec's requirement that the click alone, with no visual cue,
  should already hint focus state to an attentive ear. Unchanged by round 2.

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS before it reaches
`senior-architect`. Round 2, submitted against the cap in
`docs/game-design/design-gate-photo-qte.md` §8.
