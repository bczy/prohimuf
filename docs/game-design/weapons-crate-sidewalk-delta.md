# Delta — LOOT crate moves to the sidewalk (placement + art revision)

**Feature:** relocate the armament crate from the **window slot** to the **street-level
sidewalk**, rendered as a **real wooden crate** (FLUX sprite).
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-20
**Status:** DRAFT — **needs `lead-game-designer` (Karim) PASS** before `senior-architect`
(ADR-0053) and any dev implementation.
**Supersedes, in `docs/game-design/weapons.md`:** the placement half of **§5.1 (R2/R3/R4)**,
**§5.2** (window-slot acquisition geometry), **§5.3** (window-channel triage / the R4
three-read claim), **§5.4** (W2 spawn-exclusion) and the crate durations in `lootSystem.ts`
(`LOOT_VISIBLE_DURATION`). **Everything else in weapons.md holds verbatim** — the resolution
model (§2), discrimination integrity (§3), QTE freeze (§4), auto-return/HUD (§6), tuning of
A-B-C (§7), the §8 contract, and ACs 1–6, 10–15. This is a **placement/art revision, not a
rebalance** (see D9).
**Trigger:** Bertrand playtest of PR #115 — the drawn window-slot placeholder "ne ressemble
pas à une caisse" (`docs/handoffs/story-loot-crate-sidewalk.md`).
**Grounds on the shipped model:** `resolvePlayerShot`/`HIT_RADIUS 0.8` (`bulletSystem.ts`),
`resolveCourierShot`/`COURIER_HIT_RADIUS 1.2` (`courierSystem.ts`), `tickLoot`+its constants
(`lootSystem.ts`), `CourierField.streetY = −5` + delivery `stopPosition` (`deliverySystem.ts`),
`crosshairSystem` `VIEW_W = 18`, `VIEW_H = 12`, façade pitch `x = col·2 − 18` (`facade01.ts`).

## Cahier des charges note

Prohibition ST (1987) had **no pickup at all** — the crate system is already a documented
[EXTENSION] (weapons.md §0). Moving it to the sidewalk does **not** widen that extension; it
makes it **closer to genre canon**: the environmental shoot-a-crate of Operation Wolf / Wild
Guns is a **street object**, never a window pop-up. The placeholder's window slot was the less
faithful choice. Core loop `Récupérer → Livrer → Éviter` untouched.

---

## 1. Placement (supersedes §5.2 geometry; keeps the deterministic seed)

- **D1 — Depth.** The crate is a **static street entity** planted on the pavement at a fixed
  world-y `LOOT_STREET_Y = −4.3` (verify-tunable). Rationale: couriers and the delivery
  vehicle ride the **road lane** at `streetY = −5`; `−4.3` sits ~0.7 u **further back against
  the building base** = the _sidewalk_ strip, not the road. It is well inside the default
  frame (bottom edge `y = −6`), so **no pan is ever required vertically**.
- **D2 — Horizontal position, reused seed.** Keep `attemptSpawn`'s existing deterministic
  column pick verbatim (`seed = |nextId|`, `eligible[seed % eligible.length]`). The crate's
  world-x is that **column's** x (`col·2 − 18`); only its **y** changes from the slot's window-row
  y to `LOOT_STREET_Y`. So placement stays replay-safe with zero new seed model. `LootCrate`
  keeps `slotIndex` as the column carrier (the row is now irrelevant to its y).
- **D3 — In-frame constraint (NEW, testable).** Eligible columns are further restricted to
  those whose world-x is inside the default viewport with margin:
  `|col·2 − 18| ≤ LOOT_MAX_ABS_X = 7` (leaves the 0.8 disc + margin inside the ±9 edge).
  Rationale: a bottom-edge street object that _also_ needed a horizontal pan to reach would
  blow the readable pickup window. A sidewalk crate must be **shootable from the default
  frame**. Unsatisfiable this tick ⇒ defer (unchanged `attemptSpawn` behaviour).
- **D4 — Lifetime.** `LOOT_VISIBLE_DURATION 4.0 → 6.0 s` (verify-tunable). Rationale: a small
  static object at the frame's bottom periphery reads **slower** than a window pop-up inside
  the active engagement zone, and it loses the window-unfold motion that snapped the eye to it.
  +50 % restores parity of _reaction time_, not of generosity. `HIDDEN`/`APPEARING` unchanged.
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
  or needed (couriers traverse the whole street; they are not fixed). Disambiguation is by
  **precedence (D6), not distance**. The only distance rule is **cosmetic separation**: the
  0.7 u sidewalk-vs-road offset (D1) keeps the crate silhouette base from visually merging with
  a passing courier; verify-tunable, raise if the two read as one blob. Innocents/couriers near
  the crate provably cannot eat the pickup shot (D6) — this is the discrimination guarantee the
  gate is asserting.

## 3. W-guardrails delta

- **D8 — W1 (glyph-before-fire) HOLDS, relocated.** The A/B/C glyph moves from a drawn overlay
  to a **stenciled letter on the crate's front planks**, legible at street distance **before**
  the collecting shot (spec §5.1-R2, AC8 unchanged in intent). This supersedes the shard's
  "glyph in HUD only" note — glyph-before-fire is a **gated guardrail**, so it must live on the
  crate face; a HUD-only glyph would break W1 (blind pickup).
- **D9 — W2 (spawn-exclusion) becomes a street rule, measurable.** Replace the window-only
  §5.4 predicate with two combined constraints on the chosen column's world-x `cx = col·2 − 18`:
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

- **AC-D1** — Crate renders and is resolvable at `y = LOOT_STREET_Y (−4.3)`, on a column with
  `|col·2 − 18| ≤ 7` (in default frame, no pan needed); spawn column still the deterministic
  seed pick. Unit-tested.
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

## Hand-offs (log in `docs/agent-handoffs.md`)

- → `lead-art` / `concept-artist` (Maud): A1–A4 real wooden crate sprite (FLUX), glyph-on-face
  legibility, neon rim, cutout solidity. Spec = the read; prompt/style = theirs.
- → `senior-architect` (Winston): ADR-0053 — `LOOT_STREET_Y`/`LOOT_MAX_ABS_X`/
  `CRATE_DELIVERY_GAP_X` constants + the street-y hit-point path (crate hit-point y decouples
  from the façade slot row); placement amendment to ADR-0052 D5.
- → `ux-designer` (Tony): no HUD change — glyph stays on the crate face, not HUD (D8).
