# UX spec — Boss-QTE HP read & phase-transition legibility (OQ6, "le Commandant")

**Surface:** the boss QTE ("le Commandant") — how the player reads boss HP, and above all how the
player reads a **phase transition**, at a glance, on both device classes.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-19
**Status:** DRAFT — resolves story Open Question 6 (`_bmad-output/planning-artifacts/story-boss-encounter-qte.md`),
tracked as gate condition **C1** in `docs/handoffs/story-boss-encounter-qte.md` §4 (does **not**
block the design gate PASS already granted; it blocks `dev-r3f-render` starting the HP-read
surface).
**Decided upstream (not re-opened here):** the mechanic —
`docs/game-design/spec-boss-qte-encounter.md` §OQ2/§2.3/§4.3 — `SHIELDED↔EXPOSED` skeleton, the
spatial-colour wandering ring, `bossHp 24` / `phaseCount 3` / phase thresholds at HP 16 and 8, the
damage-free `PHASE_BREAK_SECONDS 1.0 s` re-`SHIELDED` beat at every threshold cross. This spec owns
only how the player **perceives** that state: HUD-vs-diegetic, and the transition read. It sets
**no** tuning number and **no** visual style (type/neon/grain/pose art = `lead-art`, Nico; banner
copy = `narrative-designer`, Yasmine).
**Scope guard:** `PROJECT_GUIDELINES.md` §5 rules 4 & 6 (explicit failure reason; never a "mort
bullshit") and §6 ("la musique est le seul indicateur de tension — pas de barre de stress").
**Precedent considered, not silently inherited:** ADR-0034 K-4 (hostage `captorHp`, binary/near-3,
ruled **diegetic pips, no HUD bar**). The gate (C1) correctly required a _fresh_ ruling here — the
boss is multi-hit (24 HP) and phased, a different shape. This spec reasons from scratch below and
lands, for different reasons, on the same _family_ of answer (diegetic), not a rubber stamp.

---

## 0. The ruling (headline)

> **OVERRIDDEN 2026-07-19 by Bertrand, after playtesting the harness:** diegetic-only was not
> legible enough in practice ("gênant de ne pas voir l'énergie du boss") — he asked directly for a
> HUD health bar. This is the product owner's explicit call after hands-on play, which outranks
> the §6/no-HUD reasoning below. The reasoning §0.1-§0.2 stays on record (it was sound reasoning
> from the spec, not an error), but the ruling itself no longer holds: **a HUD boss-HP bar ships.**
> `dev-r3f-render` implements against `bossHp`/`bossHpMax` (already exposed by `bossQteSystem.ts`),
> segmented by phase threshold (16/8) if convenient, no new game-layer field required. D1-D3 (the
> diegetic posture-escalation and phase-transition-pulse requirements) are UNCHANGED and still
> apply **in addition to** the bar — the bar solves "how much HP is left," not "a phase just
> changed," which is still a distinct legibility need per §2.1.

**No HUD element for boss HP. Diegetic only, in two parts already paid for by the planned art
budget** (`docs/game-design/spec-boss-qte-encounter.md` §7-9: shielded / telegraph-windup /
exposed-firing / hit / per-phase posture / defeated, ≈5 poses):

1. **Continuous "how hurt is he" read = the existing per-phase posture pose**, already budgeted —
   made a legibility _requirement_, not a new asset (§1).
2. **Phase transition = a dedicated, attention-grabbing trigger cue that does NOT depend on the
   player reading text or noticing a duration** — the actual new spec content of this document,
   because posture-swap-alone and PHASE_BREAK_SECONDS-alone both fail to guarantee "immediately
   understood" (§2, with the concrete numeric risk that motivates it).

No numeric HP counter, no bar (segmented or continuous), no per-hit pip stack. Reasoning below.

### 0.1 Why not a HUD bar (or a segmented-by-phase bar)

- **§6 is explicit and this is the same family of object.** "Pas de barre de stress" targets a
  persistent quantified meter reporting an intensity/danger value during play — a boss-HP bar,
  segmented or not, is structurally that object (a live, ticking gauge the player's eye returns to)
  even though its subject is the boss's health rather than the player's stress. The spirit —
  _tension is felt, not read off a meter_ — applies squarely; a green-to-red HP bar draining toward
  a boss kill is exactly the kind of legibility-via-meter the guideline rejects in favour of
  diegetic and audio cues.
- **A literal per-HP pip stack is the wrong grain, not just the wrong style.** 24 HP at 2/1/0
  damage per shot means ~12-16 landed hits across ~26 attempts (`spec-boss-qte-encounter.md` §4.2
  winnability math) — 24 individual pips is clutter on a mobile screen and, ticking down one at a
  time, _is_ a bar in disguise (a fine-grained, continuously-updating meter), not a simpler
  alternative to one.
- **Fanzine identity (cahier des charges spirit):** House of the Dead/Time Crisis (the veille's own
  reference) use literal boss-HP bars. Copying that HUD language verbatim is the un-conscious path,
  not the extension `PROJECT_GUIDELINES.md`'s test demands. The existing damage-on-sprite +
  posture-escalation vocabulary (already how the hostage duel reads a landed hit, D3.4 in
  `spec-hostage-qte-hud-readability.md`) is the muf-native localisation of "boss is hurting" —
  extend it, don't reskin a genre-standard bar into neon.
- **Not required by the anti-"mort bullshit" contract.** The boss's sole loss route
  (`maxBlownWindows`) is entirely driven by _window_ telegraphs (already guaranteed legible,
  `spec-boss-qte-encounter.md` §2.4), not by HP visibility — a player who never once glances at
  "how much HP is left" cannot die from that ignorance. What genuinely IS safety-relevant is
  knowing a _pattern has changed_ (§2 below), which is a different, narrower legibility need than
  a running HP total and does not require a persistent meter to satisfy.

### 0.2 What this keeps simple (the "don't over-design" instruction, honoured)

No new art asset is requested beyond what `spec-boss-qte-encounter.md` §7 flag 9 already lists to
`lead-art`. No new game-layer field is required either: `phase` (1/2/3) and "how far into the
current phase" are both cheaply derivable in the render lane from `bossHp` plus the already-shipped
`phaseCount`/threshold constants (`bossHp` compared to 16/8) — a pure `phaseIndexAt(bossHp)`-style
helper, render-owned, no game-layer contract change (flagged to `senior-architect` at §4, not
mandated by me).

---

## 1. The continuous read — per-phase posture, made a legibility requirement

**D1.1 — The per-phase posture must read as progressively more damaged/harried than the previous
phase, in silhouette alone.** Phase 1 → 2 → 3 postures (already budgeted, `spec-boss-qte-encounter.md`
§7 flag 9) are not just three arbitrary variants — they must form a visibly ordered escalation
(more torn clothing / more hunched-forward stance / more visible strain), so a player who glances at
the boss silhouette mid-fight can place roughly "early / mid / late fight" without any counter.
This is an ordering requirement on the art direction (Nico's to execute, mine to specify), verifiable
by a side-by-side screenshot of the three postures.

**D1.2 — The per-hit reaction pose (already budgeted) is the fine-grained "I'm landing hits" read.**
Every ring-vital/limb chip that lands already triggers a hit reaction (per the planned pose set) —
this is kept exactly as planned, giving per-shot feedback for free. Off/miss shots must NOT trigger
the hit-reaction pose (it would lie about landing damage) — mirrors the honesty discipline already
established for the hostage duel's colour-vs-score alignment (ADR-0034 Rev. 4).

**D1.3 — Neither D1.1 nor D1.2 is colour-dependent.** Both reads must work in the fanzine B&W layer
(silhouette/pose/decal), with neon acting as reinforcement only — consistent with the existing
"not colour alone" rule this project already applies to the ring (ADR-0034 D4.2) and extended here
to boss damage state.

**Acceptance (D1):**

- A1. Screenshot, boss silhouette only, greyscale: phase 1/2/3 postures are visually distinguishable
  from each other and read as an ordered escalation (a reviewer can rank them "least → most
  damaged" without being told which is which).
- A2. Frame capture of a landed vital/limb hit: hit-reaction pose fires. Frame capture of a miss/off
  shot: it does not.

---

## 2. The phase transition — the actual new requirement

### 2.1 Why posture-swap-alone and duration-alone both fail "immediately understood"

Two numeric facts from `spec-boss-qte-encounter.md` §4.3 make this the load-bearing part of this
spec, not a restatement of what the mechanic already guarantees:

- **`PHASE_BREAK_SECONDS = 1.0 s` is not reliably distinguishable from an ordinary `SHIELDED` lull
  by DURATION alone**, especially late in the fight: phase-3's ordinary lull is **1.2 s** — _longer_
  than the 1.0 s phase-break that precedes it. A player timing the fight by feel has no duration cue
  to tell "this is a pattern change" from "he's just recovering as usual." (Phase-1/2 lulls, at
  2.0 s/1.6 s, are longer still, so the risk is worst exactly where it matters most — entering the
  hardest phase.)
- **A silhouette pose swap alone can be missed** if the player's eye is still tracking the last
  wandering ring position, mid-reload of attention, or simply not fixed on the boss's exact outline
  at the instant of the swap (1.0 s is short). Relying solely on "the posture is now different" risks
  the exact "that was unreadable" failure mode §5.6/P3 forbids elsewhere in this feature family.

**Conclusion: the phase break needs its own explicit, attention-grabbing trigger — separate from,
and in addition to, the posture swap — that a player registers even if they are not staring
precisely at the boss silhouette at that instant, and that does NOT require reading text within the
1.0 s window.**

### 2.2 The required trigger — form/motion + optional audio, not text-dependent

**D2.1 — A screen-level, non-diegetic pulse cue marks the instant of every phase break**, distinct
from the ambient QTE dim-wash/verdict treatments already shipped (D1.5-style precedent, `HUD.tsx`
OTAGE/verdict banners) — e.g. a brief vignette flash or desaturation pulse timed to
`PHASE_BREAK_SECONDS`'s onset. This is a **momentary, one-shot event marker**, not a persistent
meter — the same category the OTAGE banner and WON/LOST verdict stamp already occupy, which the
design gate has already accepted as compatible with §6 (§6 bans _quantified, continuously-updating_
gauges; a one-shot "something just happened" pulse is not that). Exact treatment is `lead-art`'s;
this spec requires only that the cue exists, is non-diegetic, and is legible without reading.

**D2.2 — Registration must not require reading text.** If `narrative-designer`/`lead-art` choose to
add a textual stamp (e.g. a torn-flyer "PHASE II" card, reusing the OTAGE-banner mechanism) it is
**reinforcement, never the sole channel** — mirrors the existing "not colour alone" discipline
(§1.3) applied here as "not text-alone." A player who cannot read fast enough, or is on a small
mobile viewport, must still register the transition from motion/flash/pose alone. Banner copy, if
used, is `narrative-designer`'s lane (in-game words are Yasmine's) — flagged, not decided here.

**D2.3 — An audio stinger is the natural third channel, and legitimately reuses §6's own rule
rather than fighting it.** §6 already designates music as _the_ tension carrier ("tempo s'accélère
quand les flics approchent"). A tempo/instrumentation shift or a short stinger at each phase break is
therefore not a deviation from §6 — it is §6 applied to this specific beat. Recommended to
`game-designer`/`sound-designer`, not mandated by this spec (their lane).

**D2.4 — The forced re-`SHIELDED` pose at a phase break must itself look distinct from an ordinary
mid-phase `SHIELDED` lull** (a re-arming/re-posturing animation, not the idle covered pose held
slightly longer) — since duration cannot be relied on (§2.1), the pose transition itself must carry
recognisable new motion, not just a state-flag swap invisible to the player.

**Acceptance (D2):**

- A3. Frame-sequence capture of a phase-break: a screen-level pulse/flash cue is present at onset,
  distinct from the ambient QTE wash and from the WON/LOST verdict treatment.
- A4. The same capture with any textual stamp removed/hidden (or muted, mobile-narrow crop): the
  pulse + pose-swap alone are still sufficient to identify "a phase break just happened" (reviewer
  check, not a strict automated assert).
- A5. Frame comparison of an ordinary `SHIELDED` lull vs. a phase-break `SHIELDED`: the two are
  visually distinguishable by pose/motion, not only by (unreliable) duration.

---

## 3. Accessibility

**D3.1 — Reduced motion: the pulse must not strobe, and must degrade to a held, static cue.** Under
`prefers-reduced-motion: reduce`, the phase-break pulse must not flash faster than ~3 Hz (WCAG 2.3.1
floor, same rule already applied to the hostage duel's tell/alarm, D4.1 in
`spec-hostage-qte-hud-readability.md`) and must remain _perceivable_ — a single non-repeating
brightness/vignette step, not a strobe, exactly mirroring the existing hostage-duel precedent.

**D3.2 — Not colour alone, not text alone (§1.3, §2.2 restated as an accessibility floor).** The
phase-break cue and the damage-state posture must both work in greyscale/without reading — a
colour-blind player or a player who can't parse a fast-appearing French banner phrase must still be
able to time the transition from motion/pose/flash alone.

**D3.3 — Contrast as function.** The pulse/vignette must read against every backdrop the boss QTE's
zoom can land on (night-street palette, per `docs/art-direction.md`), at arm's length on a phone —
Nico's execution, this spec's bar.

**D3.4 — If a textual stamp is added, it follows the OTAGE-banner's existing DOM/aria treatment
(no new accessibility debt).** `HUD.tsx`'s current OTAGE/verdict banners carry no dedicated
`aria-live` region today; a boss-phase stamp should not introduce a new gap relative to that
baseline, and is a reasonable place to add one if `dev-r3f-render`/tech-writer want to close it —
flagged as a nice-to-have, not a blocker for this spec (no regression either way).

**Acceptance (D3):**

- A6. e2e with emulated `prefers-reduced-motion: reduce`: phase-break capture shows a steady,
  non-strobing cue (no >3 Hz flash), and the transition is still identifiable.
- A7. Grayscale capture of a phase-break frame: pulse + pose-swap still legible without colour.

---

## 4. Seams handed off explicitly

- **→ `lead-art` (Nico):** D1.1's ordered-escalation requirement on the 3 per-phase postures
  (already budgeted, no new asset request); D2.1/D2.4's pulse + distinct re-`SHIELDED` animation
  treatment (style is yours, the _read_ is this spec's).
- **→ `narrative-designer` (Yasmine):** D2.2's optional banner copy, if the crew wants a textual
  reinforcement (e.g. reusing the OTAGE-banner mechanism with "PHASE II"-style fanzine-stamp text) —
  not required by this spec, but if added it must respect "reinforcement, never sole channel."
- **→ `game-designer` (Sacha) / sound-designer:** D2.3's audio-stinger/tempo-shift recommendation at
  each phase break — a legitimate, in-spirit use of §6's music-as-tension rule; not mandated.
- **→ `senior-architect` (Winston) / `dev-gameplay`:** confirm the render-derivable `phase`/
  `phaseIndexAt(bossHp)` helper (§0.2) needs no new `src/game` contract field — pure derivation from
  already-planned `bossHp` + threshold constants is my expectation, not a ruling; flag if the tech
  plan finds otherwise.
- **→ `dev-r3f-render` (Amelia):** everything drawn — §1-§3 render behaviour, the pulse cue, the
  posture ordering, reduced-motion branch. Verify on both device classes at stage-5 `verify`; I
  review the built screens against A1-A7 there, per the collaboration contract.

**Gate:** this closes gate condition C1 (`docs/handoffs/story-boss-encounter-qte.md` §4). It does
not reopen the already-granted PASS-WITH-CORRECTIONS verdict; it is input for `senior-architect`'s
TECH PLAN and downstream art/dev lanes.
