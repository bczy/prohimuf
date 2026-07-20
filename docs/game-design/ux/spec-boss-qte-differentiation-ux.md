# UX spec — Boss-QTE differentiation pack: accessibility, parry, finisher, multi-target legibility

**Surface:** the boss QTE ("le Commandant") once levers 1 (points faibles multiples), 2
(décor interactif / audio-tell), 3 (parade façon Sekiro) and 5 (coup de grâce cinématique)
land on top of the V1 shell (ADR-0051).
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-20
**Status:** DRAFT — awaiting `lead-game-designer` (Karim) DESIGN GATE PASS, part of the
same gate as `game-designer`'s mechanic/tuning spec and `narrative-designer`'s fiction, per
`_bmad-output/planning-artifacts/story-boss-qte-differentiation.md` Definition of Done.
**Decided upstream (not re-opened here):** the mechanic shape of each lever — 1-A/1-B/1-C
(discrete alternation vs. simultaneous dual target), 3-A/3-B (new input vs. timing-
reinterpretation; parry payoff/whiff cost), 5-A/5-B (HOLD sub-state shape; guaranteed-
success vs. new failure surface) — is `game-designer`'s call, running in parallel. This
spec states the **legibility requirement** each of those mechanic shapes must satisfy,
whichever way `game-designer` resolves them, and rules on the one item that is squarely
mine: **Open Question 2-C, the audio-tell accessibility constraint.**
**Also decided upstream, unchanged:** `spec-boss-qte-hp-read.md` (D1-D3, the diegetic
posture/phase-break read + the overridden HUD boss-HP bar) — this spec is additive to it,
not a revision. The bar's behaviour at `bossHp === 0` (§3.2 below) is the only place this
spec touches that surface.
**Scope guard:** `PROJECT_GUIDELINES.md` §5 rules 4 & 6 (explicit failure reason, never a
"mort bullshit") and the project's "not colour-alone" principle (ADR-0034 D2.4/D4.2,
already applied to the peek tell and the ring) — this spec extends that principle to the
**audio axis** (2-C) and restates it for the parry tell and the multi-target read.
**No mechanics/tuning numbers, no visual style, no production code** — those are
`game-designer`'s, `lead-art`'s (Nico's), and `dev-r3f-render`'s (Amelia's) lanes
respectively. Every requirement below is stated as a legibility/accessibility constraint,
verifiable on a screenshot or an e2e capture.

---

## 1. Open Question 2-C — the audio-tell accessibility ruling (gate-critical)

### 1.1 The ruling

> **During the smoke effect (lever 2), the audio tell ADDS a redundant channel; it never
> REPLACES the visual telegraph. The visual telegraph must remain present — degraded in
> clarity by the smoke, never removed — for the full duration smoke is active.**

Two sentences, restated as the binding constraint: **(1)** a player who cannot hear the
audio tell at all (deaf/hard-of-hearing, muted device, audio permission denied) must be
able to clear the smoke-obscured window using the visual channel alone, exactly as they
clear every other window in the fight; **(2)** the audio channel is reinforcement for
players who CAN use it (mirrors the sighted-vs-colour-blind logic already applied to the
ring and the peek tell) — it never carries information the visual channel does not also
carry, in some degraded-but-still-present form.

### 1.2 Why (the "not colour-alone" principle, restated on the audio axis)

`PROJECT_GUIDELINES.md`'s explicit-failure-reason rule (§5.4) and the anti-"mort bullshit"
floor (§5.6) are channel-agnostic: a player who did everything right and still lost must
be able to point at what they missed. Today that guarantee is delivered visually
(`telegraphActive`, ADR-0051 D2/D5) and the project already treats "never colour alone" as
load-bearing for a **sighted** player with a colour deficiency (ADR-0034 D2.4/D4.2, and
this pack's own D1.3/D2.4 below). The smoke effect introduces the first scenario where the
proposed fix is itself an accessibility hazard on a **different** axis: routing the tell
through audio when vision is degraded helps a hearing player and actively excludes a deaf
or hard-of-hearing one from the exact information a sighted player still gets "for free"
once the smoke clears (the telegraph is time-boxed, not permanently blinding). Replacing
the visual channel with an audio one during smoke would recreate, on the audio axis, the
identical failure the colour-alone rule forbids on the visual axis: **one player-population
loses an entire tell for one window type, for reasons outside their control.** The fix is
therefore not "swap the channel," it is "keep the channel, degrade it consciously, add a
second one for players who can use it" — the same shape the not-colour-alone rule already
takes (colour is reinforcement, form/motion/position is the guaranteed carrier).

### 1.3 What "degraded, not removed" means (the constraint on the visual side)

I do not decide HOW the visual telegraph is drawn through smoke — that is `lead-art`'s
execution and `game-designer`'s pacing — but the constraint on it is specific enough to
verify:

- **D1.1 — The telegraph's existing lead-time floor (`BOSS_TELEGRAPH_LEAD_FLOOR`) still
  applies unchanged through smoke.** Smoke may reduce contrast/sharpness; it must not
  compress the time budget. A telegraph that starts late because it had to "burn through"
  visual noise first is a lead-time violation wearing a smoke costume.
- **D1.2 — Degradation must be readable as "form persists, clarity drops," not "cue
  vanishes."** Acceptable: reduced contrast, softened edges, partial occlusion, a duller
  version of the same shape/motion. Not acceptable: the telegraph cue disappearing
  entirely for any sub-interval of its lead time, replaced only by an audio cue with
  nothing on screen.
- **D1.3 — The degraded visual cue must still pass the existing not-colour-alone bar on
  its own** (§4.1 below) — smoke plus a colour-only residual cue is a double failure, not
  a single one cancelling out.

### 1.4 What's audio's to decide, and the seam to reconcile

The **character** of the audio tell — its sound design, whether it's a stinger, a
directional pan, a rising drone — is `sound-designer` (Malik)'s lane, ruling on the same
Open Question from the audio side per the story's own routing. What I am ruling on is the
**constraint the audio design must satisfy**: it is additive, never load-bearing alone.
If Malik's parallel ruling proposes the audio channel as the PRIMARY or SOLE tell during
smoke (rather than a redundant add-on to a still-present, degraded visual), that is a
direct conflict with this ruling and must be reconciled by `lead-game-designer` (Karim)
before the design gate — **flagged explicitly here**, not silently resolved either way.
Whichever of us wrote second does not win by default; this is a seam, not a race.

**Acceptance (§1):**

- A1. Frame-sequence capture of a smoke-active telegraph window, **audio muted**: the
  visual cue is present, distinguishable in form from ambient smoke motion, and its
  visible onset-to-window duration is not shorter than the same telegraph's duration
  outside smoke.
- A2. The same capture in grayscale (§4.1's not-colour-alone check, doubled up under
  smoke): the degraded cue is still perceptible without colour.
- A3. Design-gate note confirms `sound-designer`'s audio-tell ruling and this ruling agree
  on "additive, not replacing" — or, if they diverge, that the divergence is logged and
  routed to `lead-game-designer` rather than silently picked.

---

## 2. Parry legibility (lever 3, Open Question 3-C — UX side)

`game-designer` decides 3-A (new input vs. timing-reinterpretation of the existing click)
and 3-B (payoff/whiff cost). This section specifies what must be true of the **cue** in
either case, and adds the device-class split the mechanic spec won't need to cover.

### 2.1 The parry window needs its own distinguishable tell — restated as a hard requirement

The story's own framing (3-C) already leans this way; I confirm it as non-optional from a
legibility standpoint, for the same reason `spec-boss-qte-hp-read.md` §2.1 required a
dedicated phase-break cue: **a player cannot commit correctly to "parry" vs. "shoot" if
the two windows are visually identical and only distinguishable by which one currently is.**
This is a variant of the D2.2 "not colour-alone" family applied to a NEW distinction (two
live-but-different windows), not the original one (live vs. not).

- **D2.1 — The parry tell and the `EXPOSED`-shoot tell must differ in FORM, not only in
  which state field is currently true.** A colour swap alone (e.g. the ring tinting
  differently for a parry beat) is not sufficient — it repeats exactly the colour-alone
  failure the project already forbids elsewhere. The two tells need a distinguishable
  silhouette/motion signature (e.g., a raised-weapon windup reads as "parry beat" by pose
  alone; an open, unguarded stance reads as "shoot beat" by pose alone) so a colour-blind
  player, or a fast glance under smoke (§1), can still tell them apart.
- **D2.2 — Placement is diegetic, at the point of action, not a HUD icon.** Mirrors
  `spec-hostage-qte-hud-readability.md` D2.2 (the peek tell originates where the head
  emerges): the parry tell must originate on/at the boss body — the weapon, the windup
  point, the anatomy the player is already tracking — not a separate HUD prompt requiring
  a second point of visual attention. A HUD "PARRY NOW" icon would also repeat the
  meter-family object §6/`spec-boss-qte-hp-read.md` §0.1 already argues against for this
  fight's vocabulary; the diegetic tell is both the more legible and the more consistent
  choice. (If `game-designer`'s 3-A lands on a genuinely new input — a second click zone
  distinct from the body ring — that zone's cue is still diegetic: it appears where the
  new hitbox lives, not floated in the HUD.)
- **D2.3 — Lead time for the parry tell is held to the SAME floor discipline as the
  existing telegraph** (`BOSS_TELEGRAPH_LEAD_FLOOR`), not a separate, looser bar invented
  for the new verb. A parry that "reads fine most of the time" at a shorter lead than the
  proven shoot-telegraph reintroduces exactly the unreadable-window risk ADR-0051's own
  floor exists to prevent. Numeric value is `game-designer`'s (3-C, tuning), but the
  requirement that it not undercut the existing floor is mine to hold the line on.

### 2.2 Device classes

- **D2.4 — Desktop: the parry and shoot tells must both be distinguishable at normal
  play-distance mouse aim, without requiring the player to look away from the crosshair
  toward a HUD element** (consistent with D2.2 — diegetic, at the point of aim).
- **D2.5 — Mobile/touch: the parry tell's readable area must be at least as large as the
  existing ring's readable area at the boss zoom, and the input target (whatever 3-A
  resolves to) must meet the project's standing **44×44 CSS px minimum touch target\*\*
  (already the applied floor project-wide — `docs/game-design/pre-game-experience-ux.md`
  §3.4, `docs/game-design/ux/flyer-wall-format.md`; WCAG 2.5.8's 24×24 px is the
  regulatory floor, 44×44 px is what this project actually ships). If 3-A resolves to
  timing-reinterpretation of the SAME click (no new hitbox), this is automatically
  satisfied by the existing ring's hit radius and needs no new touch-target work — flagged
  so `game-designer`'s 3-A choice is read, correctly, as also a mobile-effort choice, not
  a mechanic-only one. If 3-A resolves to a genuinely new input (second click zone /
  modifier), that new zone independently owes the same 44×44 px floor.
- **D2.6 — Input copy, if any is added (tutorial hint, on-screen prompt), follows
  ADR-0015's device-forked wording:** desktop copy says `clic`/`souris`; mobile copy never
  says "tap" alone for what is actually a two-finger gesture — if the existing fire input
  is `deux doigts` (ADR-0003/ADR-0015) and 3-A keeps parry on the SAME input reinterpreted
  by timing, any copy describing "how to parry" must still say `deux doigts`, not "tap,"
  on mobile. This is a seam with `narrative-designer` (in-game words are Yasmine's) —
  flagged, not authored here.

### 2.3 Reduced motion

- **D2.7 — The parry tell degrades the same way the existing telegraph and phase-break
  pulse degrade under `prefers-reduced-motion: reduce`: no flash faster than ~3 Hz (WCAG
  2.3.1 floor, same rule as `spec-boss-qte-hp-read.md` D3.1 and
  `spec-hostage-qte-hud-readability.md` D4.1), and the SIGNAL is preserved as a held,
  non-strobing pose/shape change** rather than removed. A player with reduced-motion
  enabled must still be able to tell parry-beat from shoot-beat — reduced motion means
  "don't flash," not "don't distinguish."

**Acceptance (§2):**

- A4. Frame-sequence capture of a parry-beat telegraph vs. a shoot-beat (`EXPOSED`)
  telegraph, grayscale: distinguishable by form/pose alone (D2.1).
- A5. Same pair of captures at mobile-landscape viewport and at the boss zoom: both tells
  legible at arm's length on a phone (D2.5).
- A6. If a new input hitbox exists (3-A dependent): measured hit-area ≥ 44×44 CSS px.
- A7. e2e with `prefers-reduced-motion: reduce`: parry tell present, non-strobing, still
  distinguishable from the shoot tell (D2.7).

---

## 3. Finisher legibility (lever 5, Open Question 5-A — UX side)

`game-designer` decides the exact trigger shape (5-A: fires-immediately vs. a dedicated
HOLD sub-state the player clicks through) and whether it carries a failure mode (5-B). I
specify what must be true of the cue and its relationship to the HUD HP bar regardless of
which way 5-A/5-B land, plus the mobile touch-target requirement the story explicitly asks
for.

### 3.1 Reading as "one final ceremonial input," not "another shoot beat"

- **D3.1 — The finisher's visual state must be unmistakably DIFFERENT from every ordinary
  `EXPOSED`/parry window that preceded it**, not a same-looking window with a different
  outcome attached. A player must never wonder "is this just another normal shot" at the
  exact moment the fight ends — the whole point of a ceremonial beat is that it announces
  itself as the last one. Concretely: a distinct visual treatment at the moment `bossHp`
  crosses 0 (freeze-frame, slow-zoom-in, desaturation step, or an equivalent one-shot
  event marker) — same category as the phase-break pulse (`spec-boss-qte-hp-read.md`
  D2.1: a momentary, non-repeating event marker, not a persistent meter, and therefore
  compatible with §6's "no stress bar" the same way that pulse already was).
- **D3.2 — If 5-A resolves to a dedicated HOLD sub-state (mirroring the porte-cochère
  precedent), that sub-state must be visually distinct from the existing
  `QTE_RESULT_HOLD` breather, not the same freeze relabelled.** The existing HOLD is a
  passive "let the verdict land" beat with no input; a finisher HOLD is an ACTIVE
  "waiting for your one click" beat. Conflating the two visually risks a player sitting
  through the finisher window thinking it is the passive breather and never clicking —
  which, if 5-B carries any failure mode at all, is a bullshit-adjacent trap (a click the
  player didn't know was expected). Whatever cue marks "click now" (crosshair pulse,
  prompt glyph, boss freeze-pose) must positively signal "this one wants input," distinct
  from a HOLD that wants nothing.
- **D3.3 — Not colour-alone, not text-alone, restated for the finisher.** If a prompt is
  textual (e.g. a stamp-style "ACHEVER" cue, `narrative-designer`'s copy), it is
  reinforcement, never the sole channel, per the same rule already applied to the
  phase-break banner (`spec-boss-qte-hp-read.md` D2.2) — a player on a small mobile
  viewport or who can't parse fast French text must still register "input expected now"
  from motion/pose/framing alone.

### 3.2 Relationship to the existing HUD HP bar at 0

- **D3.4 — The bar visually confirms "empty" as a one-shot state change, not a silent
  drain-to-zero.** The bar (`BossHpBar.tsx`) already animates fill width continuously
  (120 ms linear transition) — that continuous drain is the correct read for "still
  fighting." At the exact instant `bossHp` reaches 0, the bar should register the SAME
  category of one-shot event marker the phase dividers already imply structurally
  (§0.1's family: a momentary marker is fine, a new continuous gauge is not) — e.g. the
  fill settling at 0% with a brief settle/pulse on the track itself (not a strobe;
  respects D2.7/D3.1's reduced-motion floor), rather than simply reading "empty" with no
  distinguishing beat. This reinforces the finisher's own cue (D3.1); it does not replace
  it — a player looking at the HUD bar and a player looking at the boss silhouette must
  both get the "he's down, act now" signal independently, since attention will be split
  between the two right when it matters most.
- **D3.5 — The bar does not gain a new persistent state for "finisher pending."** No new
  HUD label, no "READY TO FINISH" text chip bolted onto the bar — that would be exactly
  the kind of new gauge-family object §0.1 of `spec-boss-qte-hp-read.md` already argued
  against for this fight (a running status readout the player's eye is meant to return
  to). The bar's job stays "how much HP," reinforced once, at zero; the finisher's own
  diegetic cue (D3.1-D3.3) carries the "act now" instruction.

### 3.3 Touch-target size on mobile

- **D3.6 — The finisher's input target meets the project's standing 44×44 CSS px minimum**
  (same floor as §2.2 D2.5), and should be generous rather than precise: this is a
  one-shot, low-frequency, high-stakes ceremonial input (unlike the ring, which the
  player aims dozens of times per fight), so there is no tuning reason to keep its hitbox
  tight. **Recommendation to `game-designer`/`dev-r3f-render`:** size the finisher's
  effective hit area at or above the existing ring's `RING_HIT_RADIUS`-derived footprint,
  and consider a full-frame or near-full-frame tap acceptance during the HOLD sub-state
  (if 5-A resolves to one) so a slightly mistimed or off-target tap on a small screen
  still registers — a missed finisher due to touch-target precision, not due to missing
  the timing window, would be an unearned failure the anti-bullshit guardrail (§5.6)
  already forbids elsewhere. This is a recommendation on generosity, not a tuning number;
  the click/tap timing window itself stays `game-designer`'s (5-B).

**Acceptance (§3):**

- A8. Frame capture at the instant `bossHp` crosses 0: a distinct one-shot visual cue
  fires on the boss silhouette AND (separately) the HUD bar settles/pulses once at 0% —
  neither is a strobe (checked under `prefers-reduced-motion: reduce` too).
- A9. If a dedicated finisher HOLD sub-state exists: side-by-side capture of the ordinary
  `QTE_RESULT_HOLD` breather vs. the finisher HOLD shows a visibly distinct treatment.
- A10. Measured finisher hit-area at mobile-landscape viewport: ≥ 44×44 CSS px, and
  reviewer-checked as generous relative to the ring's ordinary hit radius.
- A11. Grayscale + no-text capture of the finisher cue: still legible as "input expected
  now" (D3.3).

---

## 4. Multiple weak points (lever 1) — readability without colour-alone coding

`game-designer` decides 1-A (discrete alternation vs. simultaneous dual target), 1-B (does
exposing one shield the other), and 1-C (phase-gated or present from phase 1). This
section specifies the legibility floor for whichever shape is chosen, and states a
default placement recommendation.

### 4.1 The floor that applies regardless of 1-A's answer

- **D4.1 — "Which point is live" must be readable from silhouette/pose/position, never
  from colour alone.** This restates the project's existing rule (ADR-0034 D2.4/D4.2,
  already applied to the ring and the peek tell) for the new two-target case. A tint-only
  distinction between "head is live" and "body is live" (e.g. the ring glowing one hue
  over the head, a different hue over the body, with no other change) fails this bar —
  colour-blind players and any degraded-visibility state (smoke, §1) lose the read
  entirely. The distinction needs a FORM component: e.g. a distinct outline/highlight
  shape at the live zone, a boss pose/guard change that visibly protects the shielded
  zone, or (for the discrete-alternation case) a windup/transition animation marking the
  mode switch itself, not just a static state that differs only in colour once already
  switched.
- **D4.2 — Placement stays diegetic, on the boss anatomy itself — no new HUD indicator
  for "which point is live."** A HUD arrow/icon pointing at the live zone would be a new
  status-readout object the player's eye returns to continuously, the same family §0.1 of
  `spec-boss-qte-hp-read.md` already argued against for this fight's HUD vocabulary
  (before Bertrand's HP-bar override, which was a distinct, narrower exception for a
  single quantified value — not a precedent for a second HUD gauge). The read belongs on
  the boss body, where the player is already looking to aim.

### 4.2 If 1-A resolves to DISCRETE alternation (mode commits to head-window or

body-window for a stretch)

- **D4.3 — The mode-switch itself needs a transition tell, not just two static end
  states.** A player glancing mid-fight must be able to tell "we just switched to
  body-mode" versus "we've been in body-mode for a while and I should have already
  adjusted" — both matter for correctly timing the read, but the SWITCH is the moment of
  highest risk of a missed read (mirrors why `spec-boss-qte-hp-read.md` §2.1 required a
  dedicated phase-break cue rather than relying on the end-state pose alone). The
  transition should carry its own brief, non-strobing motion cue (a guard-shift animation,
  a telegraphed windup before the new mode's window opens) — not an instant, silent flag
  flip.
- **D4.4 — Lead time for the mode-switch tell is held to the same floor discipline as the
  shoot/parry telegraphs (§2.1 D2.3)** — the numeric value is `game-designer`'s, the
  requirement that it not be shorter than the proven floor is mine.

### 4.3 If 1-A resolves to SIMULTANEOUS dual target (head and body both live at once)

- **D4.5 — Spatial separation alone is likely sufficient for the base "which is which"
  read** (head and body are anatomically distinct, non-overlapping regions of the SAME
  silhouette — unlike the hostage duel's D3.1 problem, where two DIFFERENT silhouettes
  competed for the same screen space and needed an authored gap). This spec does not
  require an additional form marker purely to distinguish head-region from body-region —
  position already carries that. **What DOES need a form marker (not colour alone) is
  each zone's LIVE/SHIELDED state** (per 1-B): if exposing one shields the other, the
  shielded zone must show a visibly different pose/covering (a guard raised over the
  shielded region, a visible block), not merely a colour change on the same static pose.
  A player must be able to tell "the body is currently unshootable" from the boss's stance
  alone, in greyscale.
- **D4.6 — If 1-B means both are live together with no shielding relationship, each
  zone's damage-eligibility state (live vs. temporarily depleted/on cooldown, if any such
  state exists in the tuning) still needs the same form-based, not-colour-alone read as
  D4.1** — flagged conditionally, since it depends on a 1-B answer not yet made.

### 4.4 Device classes and phase-gating (1-C)

- **D4.7 — If 1-C phase-gates the multi-target read to phase 2/3 (soft onboarding in
  phase 1), the FIRST introduction of the second target needs its own one-shot
  "new pattern" cue** — reusing the phase-break pulse family already specified
  (`spec-boss-qte-hp-read.md` D2.1) rather than a silent escalation the player discovers
  by trial and error. Introducing a genuinely new read (a second live zone) invisibly, at
  the same moment as an ordinary phase transition, risks the transition's OWN cue being
  read as "just a phase change" when it is actually also "the rules just changed" — worth
  flagging to `game-designer` as a reason the two might need to be visually differentiated
  from each other if 1-C lands this way, not assumed identical.
- **D4.8 — Both target zones (or the alternating zone) must remain legible at
  mobile-landscape viewport and DPR** — same "arm's length on a phone" bar already applied
  to the hostage duel's head/hostage separation (`spec-hostage-qte-hud-readability.md`
  D3.3) and this fight's HP bar. No device-specific exception; if the boss zoom makes a
  dual-target read illegible on a small viewport, that is a `verify`-stage finding to
  raise, not something to silently accept.

**Acceptance (§4):**

- A12. Grayscale capture of the live/shielded (or live/live) state: distinguishable by
  pose/form alone, not only by colour (D4.1, D4.5, D4.6).
- A13. If discrete alternation: frame-sequence capture of a mode switch shows a transition
  cue, not an instant silent flip (D4.3).
- A14. If phase-gated (1-C): capture of the FIRST multi-target introduction shows a
  distinguishing "new pattern" marker, reviewer-checked against an ordinary phase-break
  capture for the same fight (D4.7).
- A15. Mobile-landscape capture at the boss zoom: both/either target zone(s) legible at
  arm's-length-on-a-phone scrutiny (D4.8).

---

## Seams handed off explicitly

- **→ `sound-designer` (Malik):** reconcile the 2-C ruling (§1) — the audio tell's
  CHARACTER is his; the constraint that it is additive, never sole-channel, is this
  spec's. Flagged to `lead-game-designer` if the two rulings diverge.
- **→ `game-designer` (Sacha):** every mechanic-shape decision this spec is conditioned
  on (1-A/B/C, 3-A/B, 5-A/B) plus the parry/finisher lead-time and hit-area numbers; this
  spec states the floor those numbers must clear, not the numbers themselves.
- **→ `narrative-designer` (Yasmine):** any textual reinforcement copy (finisher prompt,
  mode-switch banner, mobile parry-input hint) — in-game words are hers; this spec only
  requires such copy never be the sole channel (D3.3, D2.6) and, where it describes
  input, follow ADR-0015 device wording (`clic`/`souris` vs. `deux doigts`).
- **→ `lead-art` (Nico):** the actual FORM/pose/motion treatment for every "not
  colour-alone" requirement above (D2.1, D3.1, D4.1, D4.3, D4.5) — this spec specifies
  that a form distinction must exist and be legible at arm's length on a phone; the look
  is his.
- **→ `dev-r3f-render` (Amelia):** everything drawn — §1-§4 render behaviour, the smoke
  degraded-telegraph treatment, the parry/finisher cues, the multi-target read, all
  reduced-motion branches, the HUD bar's zero-state settle. Verify on both device classes
  at stage-5 `verify`; I review the built screens against A1-A15 there.
- **→ `lead-game-designer` (Karim):** design-gate owner; explicitly asked to confirm the
  2-C ruling (§1) is either concurred with by `sound-designer` or the divergence is
  resolved before PASS, per the story's own routing of that Open Question to both lanes.

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS, alongside
`game-designer`'s and `narrative-designer`'s parallel specs for the same story, per the
story's Definition of Done. It does not reopen `spec-boss-qte-hp-read.md`'s already-gated
C1 ruling (D1-D3 there are unchanged) and does not reopen the V1 design gate (ADR-0051).
