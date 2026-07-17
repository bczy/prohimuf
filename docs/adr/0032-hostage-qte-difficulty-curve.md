# 0032 — Hostage QTE per-level difficulty curve for the duel (F3)

- **Status:** Accepted
- **Date:** 2026-07-17
- **Depends on:** [ADR-0031](./0031-hostage-qte-duel-porte-cochere.md) (the duel this curve
  tunes — retreat, `COVERED ↔ PEEKING`, counter-fire, head-only shot rules).
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (D2 the Belliard-first
  rollout via an optional per-level field — the precedent this ADR follows),
  [ADR-0033](./0033-hostage-qte-accomplice.md) (F4, a further late-level escalation lever),
  the brainstorming session
  [`brainstorming-session-2026-07-17-1.md`](../../_bmad-output/brainstorming/brainstorming-session-2026-07-17-1.md)
  (F3, guardrails G2/G4/G5), `src/game/types/hostageQte.ts` (`QteSpec`).

## Context

ADR-0031 makes the hostage QTE a live duel but leaves its intensity as fixed defaults.
`QteSpec` is already an authored per-level record (ADR-0030), so difficulty progression
needs **no new architecture** — only new authored fields and a rollout gate (session Theme
D, idea #12). Belliard teaches the phase; later levels punish.

The session also drew a hard line between _challenge_ and _fake difficulty_ via the
anti-frustration guardrails. Two of them govern the curve directly:

- **G2** — peeks shorter than comfortable-aim time (target ≈ 0.8–1.2 s), tuned per level.
- **G5** — a **hard floor of ≈ 0.5 s exposure**, even at maximum difficulty.
- **G4** — every exposure telegraphed by a readable pre-peek tell; peeks are never random
  with no tell (P3: the player must always conclude "I cracked", never "unreadable").

The risk this ADR guards against: a difficulty curve expressed _only_ as data conventions
lets a future authored level (or a typo) set an unwinnable peek (< human reaction time) or
drop the telegraph, silently breaking P3.

## Decision

### D1 — Extend `QteSpec` with the duel's tuning knobs

`QteSpec` gains the per-level difficulty fields for the ADR-0031 duel:

- **retreat speed** — how fast the captor drags the hostage toward the porte cochère (the
  sole clock; faster = less time to seize an opening).
- **peek cadence** — how often exposures occur.
- **peek duration** — how long each `PEEKING` exposure lasts.

These replace the removed `windowSeconds` / `captorHp` / `PART_DAMAGE` knobs. Belliard is
authored generous (slow retreat, frequent long peeks near the G2 target); later levels
tighten toward the floors.

### D2 — The anti-frustration floors are invariants enforced in code, not data conventions

G2/G4/G5 are **baked into the system regardless of level data**:

- Exposure duration is **clamped to ≥ 0.5 s** (G5) before it reaches the runtime, so no
  authored `QteSpec` — however aggressive — can produce a sub-reaction-time peek.
- Every peek is **telegraphed** (G4): the pre-peek tell is a structural part of the
  `COVERED → PEEKING` transition, not an optional per-level flag an author can forget.
- The G2 comfortable-aim ceiling is the _authoring target_; the G5 floor is the _enforced
  invariant_. Between them, level data is free.

These are asserted in unit tests against the authored specs, so a level that tries to
violate a floor is caught in code, not in playtest. This is the difference this ADR
insists on: **guardrails as invariants, not conventions.**

### D3 — Belliard-first rollout (ADR-0004 precedent)

Following ADR-0004 D2, the reworked duel is authored on **`belliard` first**; the validated
`stalingrad` / `vitry` experiences carry no reworked `QteSpec` and are frozen. The per-level
curve is therefore reversible and district-differentiated **by data alone** once the system
exists — no code change to retune or to add a level to the rollout.

## Consequences

**Positive**

- Zero new architecture: escalation rides the existing per-level `QteSpec` plumbing.
- P3 is protected structurally — an aggressive or mistaken authored level cannot produce an
  unreadable or unwinnable peek, because the floors live in code.
- Belliard-first keeps the rollout reversible and the other districts untouched, exactly as
  ADR-0004 established for the original enemy roster.

**Negative / costs**

- The clamps mean authored values and _effective_ values can diverge (a spec asking for
  0.3 s yields 0.5 s). The `QteSpec` fields must be documented as "targets, clamped to the
  floors" so a designer is not surprised the level plays gentler than authored.
- Balancing the retreat-speed clock against peek cadence is coupled — a faster retreat with
  rarer peeks can become unwinnable even with every individual peek above the floor. The
  invariants bound single values, not their _combination_; that stays a playtest concern.

**Gotchas**

- Assert the floors against the **runtime** exposure the tick actually uses, not just the
  authored field — a transform between the two could reintroduce a sub-floor peek.
- Keep the G2 target and the G5 floor as separate, named constants; collapsing them invites
  a future edit that lowers the "target" and accidentally lowers the enforced floor with it.
