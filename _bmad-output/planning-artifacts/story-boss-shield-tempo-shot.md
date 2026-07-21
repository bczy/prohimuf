# Story — Boss "Le Commandant": shield-break tempo shot (per-window third choice)

**Epic:** boss QTE encounter family (`docs/adr/0051-boss-qte-encounter-system.md` →
`docs/adr/0052-boss-qte-differentiation-levers.md` → `docs/adr/0053-niveau-final-live-boss-level.md`,
the shipped, live, canon "le Commandant" duel) · **Origin:** Bertrand, approved in brainstorming ·
**Type:** single new lever inside the already-frozen boss QTE contract — additive, optional, no
new verb, no boundary change expected. Same class as ADR-0052's 5 differentiation levers (lever 1
points-faibles-multiples, 2 décor, 3 parade, 4 renfort, 5 coup-de-grâce); this is effectively a
**6th lever**, kept in its own story per the one-variable-at-a-time discipline every prior boss
revision has followed.

## Why

The boss is shipped and live (ADR-0053), but every `EXPOSED` window today resolves to the same
two-way read the hostage duel already established (vital ring = hard/high value, limb ring =
safe/low value). Nothing in the fight lets a skilled player **choose the fight's pace**, only its
outcome per window. Bertrand's brainstorming call: give the player a third, per-window option —
shoot the boss's own lowered riot shield instead of his body — that deals real but modest damage
AND compresses the next `SHIELDED` lull by a fixed amount. This is a **mastery ceiling**, not a
new mechanic to learn: ignore it entirely and the fight plays exactly as ADR-0051/0052 shipped it
(vital/limb only, unchanged pacing). Engage with it and a confident player can accelerate their own
fight — a strategic lever on top of an already-legible duel, not a new verb, not a new failure mode.

This is explicitly a **depth/ceiling feature**, not a difficulty or accessibility fix: it adds an
optional expert path through an existing, gated system. `PROJECT_GUIDELINES.md` KISS/YAGNI apply —
this is scoped to be exactly that one lever, nothing broader.

## Cahier des charges check

> "Did Prohibition Atari ST have this?"

**No** — Prohibition ST had no boss at all (already ruled [EXTENSION] at the story origin,
`story-boss-encounter-qte.md`, and re-confirmed for every subsequent boss lever, ADR-0052). This
story does not reopen that verdict; it is a **conscious, incremental extension of an
already-extended, already-documented system** — same documentation standard (an ADR extending
ADR-0052, not amending it, mirroring how ADR-0052 extended ADR-0051 without reopening it).

- `Éviter` — untouched. The player still reads and reacts to a telegraphed window; the shield
  option does not introduce a new threat-discrimination rule.
- `Récupérer` / `Livrer` — untouched. The boss remains the terminal, required obstacle on `Livrer`
  established by ADR-0051 D3/D4 and shipped live by ADR-0053; this lever changes nothing about the
  gate, the win/loss condition, or the energy ledger's shape — it adds a third scoring option
  **inside** an already-existing window, at existing stakes.
- Anti-"bullshit death" guardrail (§5.6, load-bearing on every boss revision so far): the shield
  point must be exactly as telegraphed and exactly as legible as the vital/limb rings it sits
  alongside — **not** a hidden fourth rule the player has to discover blind. This is the design
  loop's job to prove at the gate, not assumed here.

## Scope decision (V1) — what this story is, and what it is deliberately not

**IN:**

- Exactly **one** new per-window option, live only during an already-`EXPOSED` window (phase 2+,
  per the brief): a **fixed** hit point on the boss's lowered shield, distinct from the existing
  vital/limb wandering rings.
- Firing on it deals damage (magnitude = `game-designer`'s call, not this story's) **and**
  shortens the *next* `SHIELDED` lull by a fixed amount (also `game-designer`'s call).
- The three-way per-window choice this creates (vital = hard/high value/no tempo effect, limb =
  safe/full recovery, shield = easy/tempo-accelerating) is the entire deliverable. It is a
  **decision layered onto an existing window**, not a new phase, not a new stance, not a new
  top-level state.
- Ignoring the shield point entirely must leave the fight byte-behaviour-identical to the
  ADR-0052-shipped duel (additive-and-optional law, same as every prior lever: `decorProp` absent,
  no charged window, no renfort surge ⇒ V1-identical). The shield point is the same class of
  guarantee — an authored/constant field that, unused, changes nothing.

**OUT of V1 (explicitly deferred, not silently dropped):**

- Any change to `maxBlownWindows`, the vital/limb ring damage values, `QTE_BOSS_REFILL`, or any
  other already-frozen ADR-0051/0052 constant. This story adds a lever; it does not retune the
  fight around it (mirrors ADR-0052 D1's "extends in place, does not reopen" discipline).
- Any change to `SHIELDED` duration's absolute floor, the telegraph floor
  (`BOSS_TELEGRAPH_LEAD_FLOOR`), or `PEEK_EXPOSURE_FLOOR` — the tempo compression applies to the
  *next* lull only and must never be able to drive a lull below the asserted floors. That is a
  hard boundary for `game-designer`'s tuning, not a value this story sets.
- A shield point during phase 1, or during `SHIELDED`/phase-break/`FINISHER` — per the brief, this
  is a phase-2+ `EXPOSED`-only option. Widening it to phase 1 or other states is a distinct scope
  call, not assumed here.
- Any new top-level phase, new player verb, or new control scheme. This is decoded from the exact
  same `fire` + `impactPoint` surface every prior lever used (ADR-0052 D1's binding constraint) —
  a fourth spatial hit-test on the existing tick, nothing new in the input contract.
- Any change to a shipped, non-boss level, or to the hostage QTE (`qteSystem.ts`/`hostageQte.ts`
  stay untouched, same as every boss lever before it).
- Stacking with, or interaction rules against, the other 5 differentiation levers (two-ring
  vital/limb split, parade, décor, renfort, coup-de-grâce) beyond "the shield point is a fourth
  hit-testable point living in the same window" — any deeper interaction (e.g. does the shield
  point coexist with the two-ring lever's dual vital/limb rings, does renfort modulate its tempo
  discount) is `game-designer`'s call to make explicit at the design gate, not pre-decided here.

## Acceptance criteria (PM-level — gate the scope, not the mechanic)

| # | Criterion |
| --- | --- |
| AC1 | The gated design spec explicitly defines: the shield hit-point's placement/size, its damage value, the fixed lull-compression amount, and which phases/states it is live in (phase 2+ `EXPOSED`, per the brief) — silence on any of these is a design-gate FAIL. |
| AC2 | The lull compression can never drive a `SHIELDED` duration below the already-asserted floors (`BOSS_TELEGRAPH_LEAD_FLOOR`, the `lull > lead` invariant, any existing minimum-lull guarantee) — asserted in code, not trusted from authored data, mirroring every prior boss-lever floor discipline. |
| AC3 | The fight, with the shield point never fired at, is byte-behaviour-identical to the ADR-0052-shipped duel (additive-and-optional law). |
| AC4 | No change lands in `qteSystem.ts`, `hostageQte.ts`, `stateMachine.ts`'s freeze law, or any shipped non-boss level. Cross-boundary surface stays inside `bossQteSystem.ts` / `types/bossQte.ts` (+ the logic-free render read), mirroring ADR-0052 D1. |
| AC5 | An ADR is merged that **extends** ADR-0052 in place (does not amend or reopen it), documenting the new lever's reuse-vs-newly-authored map, per the ADR-0051/0052 revision-log discipline. |
| AC6 | The shield point's telegraph/legibility is proven at the design gate to be exactly as readable as the existing vital/limb rings — no blind discovery, no undocumented fourth rule (§5.6). |
| AC7 | `pm` re-reviews the gated spec before `senior-architect` cuts lanes, confirming no drift beyond the single lever scoped above (no retuning of frozen constants, no new phase/state, no widening beyond phase 2+ `EXPOSED`). |

## Out of scope (V1)

- Retuning any already-frozen ADR-0051/0052 constant.
- Extending the shield point to phase 1, `SHIELDED`, phase-break, or `FINISHER`.
- Any new top-level phase, verb, or control scheme.
- Explicit interaction rules with the other 5 differentiation levers, beyond design-gate sign-off
  that the hit-test coexists safely.
- Any change outside the boss QTE system (hostage duel, other levels, shipped constants elsewhere).

## File map (indicative only — `senior-architect` owns the real lane cut at TECH PLAN)

| Lane | Likely touch | Note |
| --- | --- | --- |
| `dev-gameplay` | `src/game/systems/bossQteSystem.ts`, `src/game/types/bossQte.ts` | New fixed hit-point, damage constant, lull-compression logic + floor asserts. Pure, TDD, zero React/Three. |
| `dev-r3f-render` | `src/render/scene/BossQteSprite.tsx` (+ `BossHpBar.tsx` if a tempo-read is proposed) | Draws the shield hit-point read; logic-free. |
| `senior-architect` | `docs/adr/` | New ADR extending ADR-0052 in place, per AC5. |

## Definition of Done (story-level, pre-dev)

- [ ] Design loop run: `game-designer` (mechanic/tuning: damage value, lull-compression amount,
      hit-point size/placement) + `ux-designer` if a tempo-read surface is proposed.
- [ ] `lead-game-designer` design gate: PASS or PASS-WITH-CORRECTIONS logged with a `VERDICT:`
      line, explicitly covering AC1/AC2/AC6.
- [ ] `pm` re-review of the gated spec against this story's scope decisions (AC7).
- [ ] `senior-architect` TECH PLAN: ADR extending ADR-0052 drafted, lane cut confirmed (AC4/AC5).
- [ ] Hand-off logged in `docs/handoffs/story-boss-shield-tempo-shot.md`, indexed in
      `docs/agent-handoffs.md`.
