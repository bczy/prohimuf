# 0033 — Hostage QTE: the accomplice (second shooter) (F4)

- **Status:** Proposed (deferred until F1–F3 pass playtest)
- **Date:** 2026-07-17
- **Depends on:** [ADR-0031](./0031-hostage-qte-duel-porte-cochere.md) (the duel and its
  counter-fire role, which this accomplice **replaces**),
  [ADR-0032](./0032-hostage-qte-difficulty-curve.md) (the per-level curve this rides).
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (the `Courier`-model /
  additive-entity precedent for a new tableau actor), the brainstorming session
  [`brainstorming-session-2026-07-17-1.md`](../../_bmad-output/brainstorming/brainstorming-session-2026-07-17-1.md)
  (F4, ideas #8 + coherence-pass role division).

## Context

The session kept the **accomplice** (idea #8) as the late-level escalation but explicitly
**deferred** it: it needs a new entity and a new sprite lane, and the duel (F1+F2) must ship
and prove itself first. The prioritization named it "Deferred: ship the duel first."

Crucially, the coherence pass resolved a stacking risk: up to three incoming-fire sources
(captor counter-fire #9, accomplice #8, slow-mo ambient #3) would become noise and violate
P3 (readable danger). The resolution: slow-mo was deleted (the level stays frozen), and the
accomplice does **not add** a third gun — it **replaces** the captor's counter-fire.

This ADR is **Proposed**, not Accepted: it records the shape of the deferred feature so F1–F3
are designed without foreclosing it, but the go/no-go waits on the duel's playtest.

## Decision (proposed)

### D1 — A second shooter in the tableau, late levels only

Add an **accomplice**: a second entity in the QTE tableau that **fires at the player**. It
appears only in advanced levels, gated through the same per-level authoring the difficulty
curve uses ([ADR-0032](./0032-hostage-qte-difficulty-curve.md)).

### D2 — Role division: the accomplice _replaces_ the captor's counter-fire

When the accomplice is present, the **captor stops firing at the player** and concentrates
on the hostage/retreat; the **accomplice owns all incoming fire at the player**. This is a
role division, not an addition — one active threat on the player at a time (captor on the
hostage, accomplice on you), preserving P3. The captor's `PEEKING` remains the kill window;
the danger now comes from the accomplice, so _when_ the opening is safe to seize becomes a
target-priority read rather than a straight reaction.

### D3 — New entity + new sprite lane

The accomplice is a new pure-logic entity in the QTE runtime (position, fire cadence) and a
new sprite set. It follows the additive-entity discipline of ADR-0004 (a new `readonly`
field + its own pure resolution, boundary law preserved) and the art-lane / cop-fallback
pattern of ADR-0030/0031.

## Consequences

**Positive**

- Adds a _decision_ (which threat to watch, when to take the opening), not just a harder
  shot — the escalation the session wanted for late levels.
- The replace-not-stack rule keeps incoming fire to one readable source, honouring P3 even at
  peak difficulty.
- Fully deferred: F1–F3 can ship and be judged without it; this ADR only reserves the design
  space.

**Negative / costs**

- A new tableau entity and sprite set — the reason it is deferred. Not worth the lane until
  the core duel proves fun.
- The counter-fire _ownership handoff_ (captor → accomplice when present) is a branch in the
  ADR-0031 counter-fire logic; F1 should keep that logic factored so the handoff is a clean
  swap, not a rewrite.

**Gotchas**

- Do not let both the captor and the accomplice fire at the player in the same level — that
  is the exact P3 violation the coherence pass ruled out. The replacement must be total.
- Re-confirm go/no-go against the F1–F3 playtest success metrics before promoting this ADR to
  Accepted; if the duel already lands, a late-level second shooter may be unnecessary
  complexity.
