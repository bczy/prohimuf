# Hand-offs — story-boss-shield-tempo-shot

Boss "le Commandant" lever 6: shield-break tempo shot (per-window third choice / "cran de sûreté").
Story: `_bmad-output/planning-artifacts/story-boss-shield-tempo-shot.md`.

## §1 — `game-designer` (Sacha) → `lead-game-designer` (Karim): design spec, DESIGN GATE requested — 2026-07-21

**Deliverable:** `docs/game-design/spec-boss-shield-break-tempo-shot.md` (DRAFT, needs gate PASS).

**Decisions (mechanic + tuning + interactions):**

- 6-A: a FIXED third hit point (not a 4th wandering ring, not a moving shield) —
  `BOSS_SHIELD_POINT {x:0.4,y:−0.2}` anchor-relative, caught within `RING_HIT_RADIUS 0.30`.
- 6-B: chips `BOSS_SHIELD_DAMAGE 1` HP (limb-equivalent, flows through the existing chip path) AND
  shortens the NEXT `SHIELDED` lull by `SHIELD_BREAK_LULL_CUT 0.5 s` — next-lull-only, non-cumulative,
  floored strictly > the phase `telegraphLeadSeconds` (AC2), cleared by any break/stagger/finisher/loss
  (never compresses the `PHASE_BREAK_SECONDS` beat). At shipped values: phase-2 lull 1.6→1.1 s, phase-3
  1.2→0.7 s; floor never binds.
- 6-C: live in phase 2+ NORMAL `EXPOSED` windows only (phase-1 onboarding preserved; charged/parry,
  break, stagger, finisher, zoom excluded).
- 6-D (the call the story delegated): coexists with lever 1 (deterministic ring-precedence hit order);
  mutually exclusive with lever 3 (no shield in a charged window → parry skill-check preserved) and
  lever 2 (distinct in time); orthogonal to lever 4 (a shield-answered window is never blown → renfort
  drain never applies); routes into lever 5 finisher on a kill.

**Scope held:** no frozen ADR-0051/0052 constant retuned; no new phase/stance/verb/control; same
`fire`+`impactPoint` surface; additive-and-optional (never-fired ⇒ byte-identical, AC3); all floors
asserted-not-trusted. Winnability re-check (W1/W2/W3) flagged as a stage-5 `verify` item on the pinned
`targetSeed`.

**Open flags:** (1) `{0.4,−0.2}` catch-disc marginally overlaps the limb ring corner — harmless under
ring-precedence, nudge to y≈−0.30…−0.35 if stage-5 read is confusing (gate awareness). (2) pending-cut
data shape + extends-ADR-0052-in-place → `senior-architect`. (3) optional compressed-lull read surface
→ `ux-designer` (only if proposed; no new HUD stress bar). (4) shield-down pose read → `lead-art`.

**Requesting:** design-gate `VERDICT:` covering story AC1 (four values defined) / AC2 (floor) / AC6
(legibility parity), before `pm` re-review (AC7) and `senior-architect` TECH PLAN (AC5).

## §2 — `lead-game-designer` (Karim) → dev/architect: DESIGN GATE VERDICT — 2026-07-21

**Deliverable gated:** `docs/game-design/spec-boss-shield-break-tempo-shot.md` **Rev. 2**
(note: this handoff §1 records the pre-Rev.2 `{0.4,−0.2}`; the gated spec is `{0.4,−0.32}`, the
disjointness nudge TAKEN — see below).

**VERDICT: PASS-WITH-CORRECTIONS.**

Gate legs, all clear:

- **Scope ([EXTENSION]):** conscious, documented refinement of the already-ratified boss extension
  (ADR-0051/0052/0053; Prohibition ST had no boss). Does not reopen that verdict. No new verb — same
  `fire`+`impactPoint` surface, no frozen constant retuned. PASS.
- **Core loop / 3-5 min:** lives inside an existing `EXPOSED` window; `Éviter` gains no discrimination
  rule, `Livrer` gate/energy/win-loss shape untouched. It can only make the fight FASTER, never longer,
  and is optional. PASS.
- **Verifiability (story AC1):** all four values pinned — placement `{0.4,−0.32}`, size
  `RING_HIT_RADIUS 0.30`, damage `1 HP`, cut `0.5 s` next-lull-only/non-cumulative/floored, live states
  (phase 2+ normal `EXPOSED`). Named against real constants. Disjointness math verified independently:
  nearest limb-box point `(0.28,−0.03)` → `√(0.12²+0.29²)=0.3138 > 0.30` ✓; vital box far. Implementable
  without guessing. PASS.
- **Anti-"mort bullshit" floors (AC2/AC6):** shortened lull strictly `> telegraphLeadSeconds`, asserted
  vs the RUNTIME row not authored data; `PHASE_BREAK_SECONDS` never compressed (cut discarded on a
  crossing chip); a shield-break ANSWERS the window → no new failure surface → player can never LOSE by
  engaging. Mirrors ADR-0051/0052 discipline. PASS.
- **Additive-and-optional (AC3):** never firing the shield ⇒ byte-identical trajectory (no energy delta,
  chip on the existing path, pending-cut arms only on a hit). PASS.
- **Coherence — fiction lane:** locks 1:1 with `spec-boss-belliard-fiction.md` §2 (cover prop lowered→
  shootable, "il peut plus rester planqué" = next lull shorter). lead-art canon (separate cover prop,
  bare-headed boss) correctly APPLIED in Rev.2. PASS.

**Corrections (dev/architect fold-in, no design rework):**

- **K-1 (verifiability, load-bearing — protects lever-3 parry integrity / §3 W3):** the §4 fire-
  resolution shield catch test reads "gated on `phaseIndex ≥ 1`". Gate it on the FULL `shieldPointLive`
  predicate (§6-C: phase 2+ AND normal/non-charged AND not break/stagger/finisher), not the partial
  phase gate — a shield shootable in a charged window would break the §6-D.2 exclusivity and let a
  shield-grind bypass the parry demand. §6-C already defines the predicate; §4 must reference it verbatim
  (assert-not-re-derive).
- **K-2 (cross-spec coherence — NEW, flag to `game-designer`+`narrative-designer`+`qa-lead`):** the
  shield is a **system constant** ("one live encounter" in §2), but there are now TWO live encounters —
  Belliard (this flag-gated story) AND the already-gated Niveau Final live-ship (README 2026-07-20).
  Lever 6 therefore appears at the Niveau Final too, retroactively, and (a) the Niveau Final cover-prop
  fiction is unwritten (the shield read is motivated only for Belliard's `porte cochère`; l'Éden needs
  its own read), and (b) the §3 W1/W2/W3 winnability re-check must run on BOTH pinned seeds, folded into
  the Belliard "first boss" re-check the live story already flags. Not a hole in THIS spec (correctly
  scoped as a constant) — a downstream coherence item to sequence before either goes live.

**Iteration count:** round 1 of 2. Cleared to `senior-architect` TECH PLAN with K-1 folded; K-2 tracked
for the verify leg / narrative follow-up. Story AC1/AC2/AC6 covered.
