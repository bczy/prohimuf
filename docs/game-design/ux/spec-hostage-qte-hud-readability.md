# UX spec — Hostage-QTE readability & HUD (ADR-0034 F1+F2, "duel de la porte cochère")

**Surface:** the hostage-taker QTE — HUD readout + in-world feedback the player READS.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-17
**Status:** DRAFT — awaiting `lead-game-designer` (Karim) DESIGN GATE PASS, then `senior-architect`.
**Decided upstream (not re-opened here):** the mechanic is
[ADR-0034](../../adr/0034-hostage-qte-duel-porte-cochere.md) (D1 distance-as-clock, D2
COVERED↔PEEKING, D3 peek=danger window, D4 shot rules). This spec owns only how the player
**perceives** that mechanic: HUD hierarchy, glance-legibility of the tell, spatial fairness,
accessibility. It sets **no** style (type/neon/grain = `lead-art`, Nico) and **no** tuning
number (cadence/lead-time/floors = `game-designer` + ADR-0035).
**Scope guard:** PROJECT_GUIDELINES §5 (Règles UX Non-Négociables). Prohibition (Atari ST) had
a hostage set-piece; this reworks its ergonomics for browser+touch consciously (P3, P4).
**Cahier des charges verdict:** removing two HUD gauges and moving the clock in-world is a
**restoration of legibility**, not new scope — the abstract bars were the deviation.

Render lane owner: `dev-r3f-render` (Amelia) — `src/render/ui/HUD.tsx`,
`src/render/scene/HostageQteSprite.tsx`, `src/render/scene/hostageCue.ts`. Contract fields it
reads come from `src/game` (pure); field removals are the architect/`dev-gameplay` call per
ADR-0034 D6 — this spec only says what must and must not be **drawn**.

---

## 1. What the HUD must STOP showing, and what replaces it

**D1.1 — Remove the captor health bar.** The `preneur` gauge (`HUD.tsx` ~L402–421, fed by
`captorFill` ~L226–229) leaves the screen. The duel is binary (ADR-0034 D4): there is no HP to
depict, and a draining bar would lie about a chip-damage model that no longer exists.

**D1.2 — Remove the countdown bar.** The `compte à rebours` gauge (`HUD.tsx` ~L422–443, fed by
`countdownFill` ~L230–233) leaves the screen. Per ADR-0034 D1 there is exactly **one** clock and
it is diegetic; a HUD countdown is the second clock the ADR explicitly deletes.

**D1.3 — Nothing replaces them on the HUD.** No new bar, ring, or numeric timer is added for
distance-to-door. The bottom-centre gauge stack is **empty** during the QTE. The retreat distance
IS the timer (D1.4). Adding any HUD surrogate for it re-introduces the two-clock problem.

**D1.4 — The clock is in-world; both endpoints must be on-screen to be readable.** A diegetic
timer only reads if the player can see _both_ the moving captor AND the goal line. Readability
requirement for the scene/camera lane: the **porte cochère** (the door the captor retreats toward)
must be **visible in-frame** whenever the QTE is `ACTIVE`, and the captor→door gap must stay
legible as the camera tracks the moving anchor (ADR-0034 §Consequences: the zoom driver follows
the retreat). If the door leaves the frame, the timer becomes invisible and the rule breaks. This
is a framing constraint, not a HUD element.

**D1.5 — Keep the OTAGE banner (2 s zoom).** The centred `OTAGE` stamp (`HUD.tsx` ~L455–480,
`qte.warning`) is **unchanged** — it is the set-piece's "read this, don't shoot yet" beat and pairs
with D4's penalised zoom-shot. Keep the WON/LOST verdict stamp (~L482–511) too; it is the payoff.

**D1.6 — Hostage-HP pips: seam flag, not a decision.** The `otage ♥♥♥` pip row (`HUD.tsx`
~L444–452, `qte.hostageHp`) sits on a contract seam. ADR-0034 D4 makes a hostage hit a **single
binary heavy penalty**, which implies no hostage HP to pip — but ADR-0034 D6's removed-fields list
does **not** name `hostageHp`. **UX position:** if the contract keeps hostage HP, the pips still
violate D1.3's "empty gauge stack" and the diegetic-clock principle, so they should leave the HUD
regardless; a hostage hit is already read in-world (D3.4 stray-hit flash). **FLAG to
`lead-game-designer` + `senior-architect`:** confirm `hostageHp` leaves the contract; either way
the pip row is removed from the HUD. I do not decide the contract.

**Acceptance (D1):**

- A1. Screenshot at desktop AND mobile-landscape during `ACTIVE`: no bar or pip is drawn in the
  bottom-centre region; the region is empty. (both device classes)
- A2. Screenshot during `ZOOMING`: OTAGE banner present; no captor bar, no countdown bar.
- A3. Screenshot during `ACTIVE`: the porte-cochère door is visible in-frame alongside the captor.
- A4. Screenshot on WON and on LOST: the verdict stamp renders as today.

---

## 2. The peek TELL — readable danger, never punitive RNG (ADR-0034 P3, G4)

The peek is simultaneously the only kill window and the only incoming-fire moment (D3). The player
must always be able to conclude "**I cracked**", never "that was unreadable". The tell is what makes
that true. These are **readability requirements** on the render lane; the exact durations are
`game-designer`/ADR-0035 tuning, not mine.

**D2.1 — The tell precedes the peek (anticipation, not reaction-only).** The pre-peek cue must
**begin before** the `COVERED → PEEKING` transition, giving the eye a wind-up. The tell is the
warning; the peek is the answerable window (G5 floor ≥ 0.5 s). The render lane must key the tell off
a game-provided pre-peek signal, not off the peek itself (a tell that starts _with_ the exposure
gives zero anticipation and fails P3). The lead-time value is authored per level (ADR-0035) with a
system floor; render must render whatever lead the state exposes without swallowing it.

**D2.2 — The tell originates at the peek location.** The cue must appear at the **screen point where
the head will emerge**, so it directs gaze to the kill zone before it opens. A non-localised
full-screen flash tells the player "something" but not "aim here" — it fails the "aim where you look"
contract and pushes the player toward panic spray (which D4 penalises). Directional, not ambient.

**D2.3 — The tell is a distinct signal, not more of the ambient tension.** Today `hostageCue.ts`
climbs a calm-pink→alarm-red tint continuously (`hostageColor`, driven by the now-deleted
`windowRemaining`/tension). With the countdown gone, that continuous climb loses its driver.
The peek tell must read as a discrete **"NOW"** event, visually separable from any residual ambient
mood pulse — a step-change in form (motion/shape/brightness), not a slightly-warmer tint the player
can't time. If a general rising-tension mood is retained, the tell must be clearly louder than it.

**D2.4 — The tell carries motion/shape, not colour alone (a11y — see §4).** Acceptable channels:
a wind-up motion (shoulder/gun-barrel rise), a localised shape/outline that appears, a
brightness/scale pulse at the head point. Colour may reinforce but must never be the sole carrier.

**Acceptance (D2):**

- A5. Frame-sequence (or slowed capture) shows the tell visible **before** the head is exposed,
  co-located with where the head appears.
- A6. Grayscale screenshot of a mid-tell frame: the tell is still perceptible (form/position/
  brightness), proving it is not colour-only.
- A7. Playtest note from `game-designer`: every failed peek reads as "I was late/early", not "I
  didn't see it coming" (P3 acceptance, logged at VERIFY).

## 3. Head-vs-hostage must never be a coin-flip (ADR-0034 G6)

**D3.1 — The peeking head silhouette must clear the hostage silhouette by a visible margin.** The
head exposure (the sole valid kill target, D4) must emerge into empty space **beside/over** the
hostage, with a clear gap between the head's visible silhouette and the hostage's silhouette, at
**all** zoom levels the tracking camera produces and at **both** device pixel ratios. The player must
never have to guess "is that pixel his head or her head/shoulder?" before firing — a mis-read there
converts a fair duel into a hostage-hit heavy penalty (D4) the player didn't earn.

**D3.2 — Aim honesty: what looks like head IS head.** The game's "head" hit-zone
classifier (ADR-0034 D6) and the **visible** exposed-head region must coincide. The zone the engine
scores as a winning headshot must sit fully inside the pixels the player reads as head, and the
hostage silhouette must sit fully outside it. No invisible head hitbox extending over her; no visible
head pixels that score as body/miss. (Today the tableau is authored so hit bands match the sprite —
`HostageQteSprite.tsx` L14–34; under a _moving_ peek this alignment must be re-verified against the
new art, per ADR-0034 Gotchas.)

**D3.3 — This is a joint art×game×UX property.** The exact separation distance and the head/hostage
sprite anchors are `lead-art` (silhouette design) + `game-designer`/`dev-gameplay` (zone geometry).
UX owns the **requirement**: separation must be non-ambiguous at a glance at arm's length on a phone.
Reconcile at the composite gate against the real peeking-head + hostage sprites.

**D3.4 — Stray-hostage-hit feedback is kept and localised.** The hostage's white hit-flash
(`HostageQteSprite.tsx` L163–177) stays as the in-world "you hit HER" read, replacing any HUD pip
(D1.6). A hostage hit must be unmistakable in the moment so the player learns the boundary.

**Acceptance (D3):**

- A8. Screenshot of a `PEEKING` frame at min and max tracked zoom, both DPRs: a visible gap between
  head silhouette and hostage silhouette; neither overlaps.
- A9. Overlay/debug capture (or code assertion, per ADR-0034 Gotchas) shows the head hit-zone fully
  inside the visible head region and disjoint from the hostage silhouette.

## 4. Accessibility

**D4.1 — Reduced-motion: the tell must not strobe.** Under `prefers-reduced-motion: reduce`, the
peek tell and any alarm/execution flash (`hostageColor(..., alarm=true)`, `HostageQteSprite.tsx`
L144/L170–172) must **not** flash faster than ~3 Hz (WCAG 2.3.1 seizure floor) and should degrade to
a **steady, non-strobing** form: a static appearing outline/glow that switches on for the tell/peek
and holds, rather than a pulsing strobe. Crucially, the tell must **remain perceivable** in this
mode — reduced-motion means "don't flash", not "don't warn". Degrade the _animation_, keep the
_signal_.

**D4.2 — Not colour alone (reinforces D2.4/D3.2).** COVERED vs PEEKING, and the tell, must each be
distinguishable without hue: by silhouette/pose change (head absent vs exposed) and by
position/brightness. A colour-blind player, or a grayscale screenshot, must still be able to time the
peek and pick the head.

**D4.3 — Contrast as function.** The exposed head must meet a legibility contrast against whatever
sits directly behind it (facade/door) so it reads at arm's length on a phone; if the neon tint would
sink the head into the background at some retreat positions, the head keeps a form/outline read
independent of tint. (Hue/treatment is Nico's; the _legible-at-arm's-length_ bar is UX's.)

**Acceptance (D4):**

- A10. e2e with emulated `prefers-reduced-motion: reduce`: capture during a peek/alarm shows a steady
  cue (no mid-strobe frame); assert the render path selects the non-strobing branch (no >3 Hz flash).
- A11. Grayscale capture of COVERED vs PEEKING: the two states are distinguishable by form alone.
- A12. Reduced-motion capture still shows the tell present (signal preserved).

---

## Seams handed off explicitly

- **→ `game-designer` (Sacha):** pre-peek lead-time value + the ambient-mood question in D2.3 (is a
  residual tension climb kept now that `windowRemaining` is gone?). Tuning is yours; I spec only that
  the tell out-reads it.
- **→ `lead-art` (Nico):** peeking-head + hostage silhouettes designed for the D3.1 clear-gap and the
  D2.4 form-carried tell; tint/neon treatment. I spec function; you spec look.
- **→ `dev-gameplay` / `senior-architect`:** the D1.6 `hostageHp` contract question and the D3.2
  head-zone-vs-visible-head assertion (ADR-0034 D6/Gotchas).
- **→ `dev-r3f-render` (Amelia):** everything drawn — §1 removals, §2–§4 render behaviour. Verify on
  both device classes at VERIFY; I review the built screens against A1–A12 there.

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS before it reaches
`senior-architect`. Flagged.
