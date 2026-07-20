# Delta — LOOT crate moves to the sidewalk (placement + art revision)

**Feature:** relocate the armament crate from the **window slot** to the **street-level
sidewalk**, rendered as a **real wooden crate** (FLUX sprite).
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-20
**Status:** DRAFT (round 2) — amended per Karim's round-1 gate (PASS-WITH-CORRECTIONS,
`docs/handoffs/story-loot-crate-sidewalk.md`, be9b5ce): C1 runtime-x formula + C2 mobile-frame
reachability resolved, premises N1/N2/N3/N5 corrected; confirmed points (precedence, D9-1/D9-2,
W1 stencil) untouched. **Needs Karim's round-2 PASS** before `senior-architect` (ADR-0053).
**Supersedes, in `docs/game-design/weapons.md`:** the placement half of **§5.1 (R2/R3/R4)**,
**§5.2** (window-slot acquisition geometry), **§5.3** (window-channel triage / the R4
three-read claim), **§5.4** (W2 spawn-exclusion) and the crate durations in `lootSystem.ts`
(`LOOT_VISIBLE_DURATION`). **Everything else in weapons.md holds verbatim** — the resolution
model (§2), discrimination integrity (§3), QTE freeze (§4), auto-return/HUD (§6), tuning of
A-B-C (§7), the §8 contract, and ACs 1–6, 10–15. This is a **placement/art revision, not a
rebalance** (see D9).
**Trigger:** Bertrand playtest of PR #115 — the drawn window-slot placeholder "ne ressemble
pas à une caisse" (`docs/handoffs/story-loot-crate-sidewalk.md`).
**Grounds on the RUNTIME (Belliard) model, not the test fixtures:** `resolvePlayerShot`/
`HIT_RADIUS 0.8` (`bulletSystem.ts`), `resolveCourierShot`/`COURIER_HIT_RADIUS 1.2`
(`courierSystem.ts`), `tickLoot` + its constants (`lootSystem.ts`); runtime `streetY = −4.8`
(`GameScene.tsx:276`, `= −facadeH·0.4`) and Belliard delivery `stopPosition.y = −4.5`
(`levels.ts:104`); crate world-x = `mergedFacade.slots[slotIndex].screenPosition.x`
(tile-derived, `GameScene.tsx:198-205`) with runtime `col` a **sequential 0..N index** — the
`col·2 − 18` / `streetY = −5` figures from the first draft were the `facade01.ts` / test-fixture
harness, **not** runtime, and are corrected throughout per Karim's C1/N1. Mobile framing:
`MOBILE_ZOOM_FACTOR 1.7` (ADR-0026), resting frame ≈ `x∈[−5.3,5.3]`, `y∈[−3.5,3.5]`.

## Cahier des charges note

Prohibition ST (1987) had **no pickup at all** — the crate system is already a documented
[EXTENSION] (weapons.md §0). Moving it to the sidewalk does **not** widen that extension; it
makes it **closer to genre canon**: the environmental shoot-a-crate of Operation Wolf / Wild
Guns is a **street object**, never a window pop-up. The placeholder's window slot was the less
faithful choice. Core loop `Récupérer → Livrer → Éviter` untouched.

---

## 1. Placement (supersedes §5.2 geometry; keeps the deterministic seed)

- **D1 — Depth.** The crate is a **static street entity** planted on the sidewalk at a fixed
  world-y `LOOT_STREET_Y = −4.3` (verify-tunable). Runtime facts (C1/N1): couriers ride
  `streetY = −4.8` and the Belliard truck stops at `y = −4.5`, so `−4.3` sits only **0.5 u**
  above the courier lane and **0.2 u** above the truck — a thin sidewalk strip against the
  building base, **not** the ~0.7 u offset the first draft claimed (that used the `−5` test
  fixture). Vertical offset is therefore **not** the disambiguator (see D7); crate↔traffic
  separation is carried by the box-vs-figure shape read, the street-vs-window z-band, and the
  D9-2 x-gap. `−4.3` sits near the **16:9 cover-crop bottom** (~`−4.5/−4.6`, where the truck
  wheels clip), **not** "well inside" the ortho half-height (`−6`) — the full crate + glyph +
  rim must be verified inside the crop (AC-D8); `LOOT_STREET_Y` is verify-tunable, raise if it
  clips.
- **D2 — Horizontal position, reused seed.** Keep `attemptSpawn`'s existing deterministic
  slot pick verbatim (`seed = |nextId|`, `eligible[seed % eligible.length]`). The crate's
  world-x is the picked slot's **`slot.screenPosition.x`** (tile-derived at runtime, C1); runtime
  `col` is a sequential index, so the harness `col·2 − 18` formula is **not** used. Only the
  crate's **y** decouples — from the slot's window-row y to `LOOT_STREET_Y`. Placement stays
  replay-safe with zero new seed model; `LootCrate` keeps `slotIndex` as the x carrier.
- **D3 — Near-centre spawn constraint (NEW, testable, world-origin-anchored).** Restrict
  eligible slots to those whose **`|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X = 7`** (verify-tunable;
  anchored to the **world origin**, since the pure spawn cannot read live camera pan —
  ADR-0003/0026 keep pan out of `GameState`, N5). Rationale: keep the crate near screen centre so
  a **centred** player engages it with little or no pan on desktop; on **mobile** the crate is
  street content **below the resting frame** (`y −4.3 < −3.5`) and is engaged by the same
  pan-down / zoom-out the couriers (`−4.8`) and truck (`−4.5`) already require (ADR-0003/0026) —
  there is **no "no-pan" guarantee on mobile**, and a player panned away from centre may miss a
  crate (accepted, consistent with missing other central action, N5). Unsatisfiable ⇒ defer
  (unchanged `attemptSpawn` behaviour).
- **D4 — Lifetime.** `LOOT_VISIBLE_DURATION 4.0 → 6.0 s` (verify-tunable). Rationale: a small
  static object at the frame's bottom edge reads **slower** than a window pop-up inside the
  active engagement zone, it loses the window-unfold motion that snapped the eye to it, **and on
  mobile it sits off the resting frame** (reached by pan) — all three lengthen the reaction time
  the player needs. +50 % restores parity of _reaction time_, not of generosity.
  `HIDDEN`/`APPEARING` unchanged.
- **D5 — Appear/disappear feel (no window unfold).** APPEARING becomes a **short drop-and-settle**:
  the crate arrives from just above frame and settles onto the pavement over
  `LOOT_APPEARING_DURATION` (bump `0.3 → 0.45 s` for a readable drop). Despawn is **not** a fold-away:
  the neon rim (R3) **blinks/dims over the last ~0.8 s** of VISIBLE as a leaving telegraph, then
  the crate is removed on expiry (still `GameState.loot → null`; no new state, render-only cue).

## 2. Hit contract (supersedes §5.3; the triage gets EASIER)

- **D6 — Precedence is unchanged and already correct.** `resolvePlayerShot` resolves the
  VISIBLE crate in **step 1** (window-priority, nearest-within-`HIT_RADIUS 0.8`) **before**
  courier-on-miss (step 2, `COURIER_HIT_RADIUS 1.2`). Moving the crate to street y changes
  **only** the crate's hit-point y; the step-1-before-step-2 ordering is untouched. Therefore:
  - **The crate always wins over a courier** in any overlap (step 1 consumes the resolution).
    A **pickup shot near the crate can never penalise a courier**, and a courier crossing the
    crate's x can never "eat" the pickup shot. This **replaces** the §5.3 window-channel
    concern (B6-b): the crate no longer competes in the window row at all.
  - **Triage gets EASIER, state it plainly:** loot **leaves the window channel**, so the
    window row reverts to the **two-read** menace/innocent triage of ADR-0040 — the §5.1 **R4
    three-read** requirement **dissolves** (no longer applies). The new read (crate vs courier
    at street level) is a **static-object vs moving-human** read, the easiest discrimination
    in the game.
- **D7 — Crate↔courier disambiguation.** No spawn-time exclusion against couriers is possible
  or needed (couriers traverse the whole street; they are not fixed). Disambiguation of the
  **shot** is by **precedence (D6), not distance** — a VISIBLE crate consuming step 1 is never
  re-evaluated against couriers, so a near-crate shot always equips and never penalises a
  courier (VERIFIED by Karim, N3). There is effectively **no vertical gap** to lean on (crate
  `−4.3` vs courier `−4.8` = 0.5 u, truck `−4.5` = 0.2 u; N1): the **visual** read is carried by
  the box-vs-figure silhouette, the street-vs-window z-band, and D9-2's x-gap from the parked
  truck — not by a depth offset. Innocents/couriers near the crate provably cannot eat the
  pickup shot (D6). Residual, accepted (N4/P3): an intentional near-crate shot always equips and
  discards the current special's stock (weapons.md §5.2) — mitigated by W1 (glyph pre-fire) + R3
  (glow) + D9-1; `verify` confirms accidental-pickup rate stays low.

## 3. W-guardrails delta

- **D8 — W1 (glyph-before-fire) HOLDS, relocated.** The A/B/C glyph moves from a drawn overlay
  to a **stenciled letter on the crate's front planks**, legible at street distance **before**
  the collecting shot (spec §5.1-R2, AC8 unchanged in intent). This supersedes the shard's
  "glyph in HUD only" note — glyph-before-fire is a **gated guardrail**, so it must live on the
  crate face; a HUD-only glyph would break W1 (blind pickup).
- **D9 — W2 (spawn-exclusion) becomes a street rule, measurable** (both predicates CONFIRMED by
  Karim). Replace the window-only §5.4 predicate with two combined constraints, on the chosen
  slot's index `col` and its world-x `cx = slot.screenPosition.x` (C1: runtime x, not `col·2 − 18`):
  1. **Firefight gap (kept):** `∀ active-engaged enemy a : |col − a.col| ≥ LOOT_SPAWN_MIN_COL_GAP (=2)`
     — unchanged from §5.4; still valid because the reticle sweeps _down_ from an active column,
     so a crate directly below it would sit under the reticle's vertical travel.
  2. **Delivery gap (NEW):** when a delivery vehicle is `INCOMING`/at stop,
     `|cx − delivery.stopPosition.x| ≥ CRATE_DELIVERY_GAP_X (= 2.0)` — the crate must not
     spawn under/behind the vehicle sprite the player is defending. Unsatisfiable ⇒ defer.
     This is the "not under an active firefight line," made testable against courier paths (D7:
     precedence, no spawn rule) and the delivery stop (constraint 2). All other W-guardrails and
     all ACs **untouched**.

## 4. Art hand-off → `lead-art` (Maud) / `concept-artist` (Maud)

Requirements only (silhouette read); the FLUX **prompt** is `concept-artist`'s (flux-prompt
skill), style is `lead-art`'s:

- **A1** — A **real wooden crate**: squat, ground-sitting, **visible planks**, unmistakably a
  non-human OBJECT (spec §5.1-R1 holds) at the frame's bottom edge.
- **A2** — A **big stenciled glyph** (A/B/C) on the front face, high-contrast, legible at
  street distance before firing (D8 / W1).
- **A3** — **Neon rim** per house style (acid-neon four-hex palette, `docs/art-direction.md`
  §2) so "ce qui brille est interactif" (R3) reads at street level; rim supports the D5
  pre-despawn blink.
- **A4** — Silhouette-first, background-free cutout (chroma-key clean, no see-through planks —
  cf. `sprite-hole-audit`). Confirms the crate cannot be misread as a human under triage.

## 5. Tuning (explicitly UNCHANGED — this is not a rebalance)

- **D10** — **Spawn cadence stays `spawnIntervalSeconds = 15 s`; all stock values (B rounds,
  C presses) stay exactly as weapons.md §7.** This delta touches **placement geometry, lifetime
  (D4/D5) and art** only. The A-B-C balance envelope, W6 (telegraph fairness) and W7 (≤40 %
  uptime) are **untouched and not re-opened**. Any change to cadence/stock would be a separate
  rebalance story.

---

## Acceptance criteria (delta-only; adds to / amends weapons.md §9)

- **AC-D1** — Crate renders and is resolvable at `y = LOOT_STREET_Y (−4.3)`, on a slot with
  **`|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X (=7)`** (world-origin-anchored, C1/N5); spawn slot
  still the deterministic seed pick. On desktop the crate is near-centre; on mobile it is
  street content below the resting frame, engaged by pan/zoom-out like the couriers/truck
  (ADR-0003/0026) — **no "no-pan" claim**. A player panned away from centre may miss it
  (accepted). Unit-tested (spawn x-bound + slot pick).
- **AC-D2** — `VISIBLE = 6.0 s`; APPEARING is a drop-settle (`0.45 s`); a leaving blink covers
  the last ~0.8 s. `HIDDEN`/state-machine shape otherwise unchanged.
- **AC-D3** — A shot within `HIT_RADIUS` of the crate resolves as **loot-hit** even with a
  courier overlapping (step-1 precedence); that shot yields **no** courier penalty and **no**
  `scoreDelta`/`livesDelta` (regression on AC7-loot). Unit-tested.
- **AC-D4** — Window row is back to a two-read triage (R4 no longer applies); crate reads as a
  static object vs moving-human courier (composite gate confirms at street level).
- **AC-D5** — Glyph is on the crate face and legible before the collecting shot (W1 / D8).
- **AC-D6** — Spawn obeys both D9 constraints (firefight col-gap ≥2 **and** delivery-x-gap ≥2.0
  when a vehicle is present); deferred if unsatisfiable. Unit-tested.
- **AC-D7** — Spawn cadence and all stock values are byte-identical to weapons.md §7 (D10).
- **AC-D8** (**N2**, empirical — verify/composite gate, not unit) — At `LOOT_STREET_Y`, the
  **full crate + stencil glyph + neon rim clear the 16:9 cover crop** (visible bottom ≈
  `−4.5/−4.6`) on both device classes; if any part clips, raise `LOOT_STREET_Y` (verify-tunable).

## Hand-offs (log in `docs/agent-handoffs.md`)

- → `lead-art` / `concept-artist` (Maud): A1–A4 real wooden crate sprite (FLUX), glyph-on-face
  legibility, neon rim, cutout solidity. Spec = the read; prompt/style = theirs.
- → `senior-architect` (Winston): ADR-0053. **This is a real code change, not "no code
  change" (N3):** (a) `resolvePlayerShot` today reads the crate hit-point from
  `facade.slots[loot.slotIndex].screenPosition` (window y) — it must resolve the crate at
  street-y instead (decouple the crate's y, or `LootCrate` gains its own position); (b)
  `tickLoot`/`attemptSpawn` gains the `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X` filter (D3) and
  the D9-2 delivery phase + `stopPosition.x` check; (c) new constants `LOOT_STREET_Y`/
  `LOOT_MAX_ABS_X`/`CRATE_DELIVERY_GAP_X`; `LOOT_VISIBLE_DURATION 4.0 → 6.0`. Placement amendment
  to ADR-0052 D5.
- → `ux-designer` (Tony): no HUD change — glyph stays on the crate face, not HUD (D8).
