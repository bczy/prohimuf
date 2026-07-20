# 0053 — LOOT crate moves to the sidewalk: street-y placement + FLUX sprite with drawn fallback

- **Status:** Accepted
- **Date:** 2026-07-20
- **Story:** caisse en bois sur le trottoir — LOOT crate revision (`docs/handoffs/story-loot-crate-sidewalk.md`)
- **Design delta (GATED):** [../game-design/weapons-crate-sidewalk-delta.md](../game-design/weapons-crate-sidewalk-delta.md)
  (lead-game-designer round-2 PASS; 4 pins P1–P4 carried to this lane)
- **Number:** 0053, reserved by `producer` (Marion) at story opening (shard stage-0) — not self-allocated.
- **Grounds on / relates to:** **ADR-0055** (weapons pickup / LOOT entity — this ADR supersedes its
  D5 _placement_ clause only, see below), ADR-0040 (player-shot hitscan primitive),
  ADR-0049 (generated sprite with procedural fallback — the render idiom reused here),
  ADR-0011/0025 (render-side neon rim), ADR-0003/0026 (mobile pan / zoom-out framing),
  ADR-0002 (delivery state on `GameState`).

## Context

ADR-0055 D5 landed the armament crate as a **new entity** (not an `EnemyKind`) that **seats in a
window slot** and is resolved/rendered at that slot's `screenPosition` (window row). PR #115
shipped it as a code-drawn glyph placeholder. Bertrand's playtest verdict: the placeholder "ne
ressemble pas à une caisse", and a window pop-up is the less genre-faithful placement (Operation
Wolf / Wild Guns crates are **street objects**). The gated design delta relocates the crate to the
**sidewalk** and upgrades it to a **real wooden-crate FLUX sprite**, keeping the crate an
[EXTENSION] (crate pickup was never in Prohibition ST) but bringing it closer to genre canon. This
is a **placement + art revision, not a rebalance** (cadence/stock untouched, delta D10).

The delta discloses this is a **real code change** touching the game/render boundary, so it needs
an ADR. The forces the architect must settle:

1. **Position model** — the crate keeps its deterministic column seed but must resolve and render
   at a fixed street-y, not the window row. Does it keep `slotIndex`, or move to an x-only model?
2. **`resolvePlayerShot`** — it currently reads the crate hit-point from
   `facade.slots[loot.slotIndex].screenPosition` (window y). It must resolve the crate at street-y
   **without** perturbing the nearest-wins / step-ordering precedence (AC-D3 regression).
3. **Spawn filter inputs** — `attemptSpawn` gains the near-centre x-bound (D3) and a NEW
   delivery-gap constraint (D9-2) that needs **delivery data the pure loot system does not receive
   today**. Threading it must preserve the boundary law (data in, no React/Three).
4. **Art loading** — a FLUX crate sprite when the asset exists, the code-drawn box as fallback so
   the dev lane never blocks on the CI render farm; the A/B/C glyph composited render-side.
5. **Relationship to ADR-0055** — which of its clauses survive.

Boundary law (unchanged): `src/game/**` pure, holds all rules; `src/render/**` renders state;
`src/hooks/**` is the only bridge.

## Decision

### D1 — Position model: KEEP `slotIndex` (column seed + x carrier); decouple only y

The crate stays a `LootCrate { id, slotIndex, state, timer, weapon }` — **`slotIndex` is retained
unchanged**, we do **not** move to an x-only model. Rationale (all three would break under an
x-only model):

- The deterministic slot pick (`seed = |nextId|`, `eligible[seed % eligible.length]`) is the
  replay-safe spawn contract (ADR-0055; loot-id-as-seed, MINEUR-2). `slotIndex` is how the crate
  carries its **world-x** (`slot.screenPosition.x`, tile-derived, `GameScene.tsx:198-205`).
- The co-location guards (ADR-0055 D5 amendment (a)/(b)) key off `slotIndex`
  (`stateMachine.ts` wave-rollover `excludeSlots: [state.loot.slotIndex]`, `attemptSpawn`'s
  occupied-slot filter). They stay valid and correct.
- `resolvePlayerShot`'s deterministic tie-break spans enemies ∪ {crate} on `slotIndex`.

**Only the crate's _y_ decouples**: from the slot's window-row `screenPosition.y` to a fixed world
constant `LOOT_STREET_Y = −4.3` (delta D1, verify-tunable). The crate's x stays
`slot.screenPosition.x`. This is the minimum-surface change and is exactly what delta D2 fixes.

### D2 — New game constants in `lootSystem.ts` (single source of truth)

Added to `src/game/systems/lootSystem.ts` (the existing home of `LOOT_SPAWN_MIN_COL_GAP` and the
duration constants):

- `LOOT_STREET_Y = −4.3` — the crate's fixed world-y on the sidewalk strip. Consumed by **both**
  `bulletSystem.resolvePlayerShot` (game) and `LootCrate.tsx` (render, importing a pure game
  constant is boundary-legal — render reads game). One definition, two readers.
- `LOOT_MAX_ABS_X = 7` — near-centre spawn bound (D3), **world-origin-anchored** (the pure spawn
  cannot read live camera pan; ADR-0003/0026 keep pan out of `GameState` — delta N5).
- `CRATE_DELIVERY_GAP_X = 2.0` — the D9-2 delivery x-gap.
- `LOOT_VISIBLE_DURATION 4.0 → 6.0` (delta D4); `LOOT_APPEARING_DURATION 0.3 → 0.45` (delta D5).

All are `verify`-tunable §7-style values, not gated. `LOOT_STREET_Y` in particular is the AC-D8
crop-clearance knob (see D5 below), tuned at the composite/verify gate, not by unit test.

### D3 — `resolvePlayerShot`: crate resolves at street-y, ordering byte-identical

In `bulletSystem.ts`, the crate branch changes **one line of intent**: the crate hit-point becomes
`(slot.screenPosition.x, LOOT_STREET_Y)` instead of `(slot.screenPosition.x, slot.screenPosition.y)`
(`LOOT_STREET_Y` imported from `lootSystem`; acyclic — `lootSystem` imports only types). Everything
else is untouched:

- The enemy scan loop, `HIT_RADIUS = 0.8`, the nearest-wins comparison, and the `crateWins`
  tie-break (`crate.dist < best.dist || (== && crate.slotIndex < best.enemy.slotIndex)`) are
  **byte-identical**.
- Step-1 (window enemies ∪ VISIBLE crate) **before** step-2 (courier-on-miss, in
  `weaponSystem`/`stateMachine`) is untouched — this ADR does not touch `weaponSystem.ts`.

So AC-D3 holds by construction (pin P2): a shot within `HIT_RADIUS` of the crate still resolves as
`loot-hit` even with a courier overlapping, yielding no courier penalty and no score/lives delta.
The crate now simply lives far from the window row in y, so it rarely competes with a window enemy
— but the _mechanism_ that guarantees crate-beats-courier (step-1 consumes the resolution) is
exactly the shipped one.

### D4 — Spawn filter: near-centre x-bound + delivery-gap, with delivery data threaded as pure input

`attemptSpawn`'s eligible-slot filter gains two predicates alongside the kept
`canSpawnLootAt` (§5.4 firefight col-gap ≥2, **D9-1 unchanged**) and the occupied-slot guard:

1. **Near-centre bound (D3):** `Math.abs(slot.screenPosition.x) ≤ LOOT_MAX_ABS_X`. Pure, needs no
   new input — `screenPosition.x` is already on each slot; the filter carries it through alongside
   `col`.
2. **Delivery gap (D9-2):** when a delivery vehicle is active at its stop line,
   `Math.abs(slot.screenPosition.x − stopX) ≥ CRATE_DELIVERY_GAP_X`.

**Threading the delivery data (pin P1).** The pure loot system takes **no delivery input today**.
`tickLoot`/`attemptSpawn` gain **one new parameter carrying pre-computed pure data** — the
recommended shape is `deliveryGap: { stopX: number } | null` (or equivalently `stopX: number | null`):

- `stateMachine.ts` assembles it at the existing step-3b `tickLoot` call site (which runs
  **before** the delivery tick at 7c, so it reads the pre-tick `state.deliveryVehicle` /
  `state.deliverySpec` — a stable snapshot). It passes non-null **only** when
  `state.deliveryVehicle.phase ∈ { "INCOMING", "DELIVERING" }`, with
  `stopX = state.deliverySpec.stopPosition.x` (the **stop** position — where the truck will
  defend — not the live in-transit x). Otherwise `null` ⇒ the D9-2 predicate is skipped.
- This keeps `lootSystem` **delivery-type-agnostic** (it receives a number/enum, never
  `DeliveryVehicle`), so the boundary law holds: data in, no React/Three, deterministic, unit-
  testable. The phase-gating lives in `stateMachine` (which already knows the delivery types),
  matching D9-2's "when a delivery vehicle is INCOMING/at stop".

Unsatisfiable this tick ⇒ **deferred** (unchanged `attemptSpawn` behaviour — timer stays elapsed,
retries next tick; never force-placed).

### D5 — Render: FLUX crate sprite with code-drawn fallback; glyph + neon rim composited render-side

`LootCrate.tsx` (render lane) changes on three axes; the game side owns none of this:

- **Position/size.** Mount at `(slot.screenPosition.x, LOOT_STREET_Y)` (import `LOOT_STREET_Y`
  from `lootSystem`), x still keyed by `loot.slotIndex`. The crate plane **decouples from
  `slot.size`** (it is no longer a window occupant): a **fixed crate world-size**, verify-tunable,
  tuned at the composite/verify gate for AC-D8 (full crate + glyph + rim must clear the 16:9
  cover-crop bottom ≈ −4.5/−4.6; raise `LOOT_STREET_Y` if it clips).
- **Sprite with drawn fallback (ADR-0049 idiom, so the dev lane never blocks on the render farm).**
  A base **wooden-crate FLUX sprite** is loaded async and swapped into the cache on success; the
  **existing code-drawn box** is the synchronous, guaranteed fallback and is therefore **kept, not
  deleted**, until CI generates the asset (mirrors `nearForegroundTextures.ts`; cutout/keying per
  the `enemyTextures.ts` load-with-fallback precedent). A missing block / 404 / non-DOM keeps the
  drawn box.
- **Glyph composited render-side.** The A/B/C glyph is **not baked into the FLUX asset** (one crate
  asset serves all three weapons): it is composited render-side over the crate (per-weapon via the
  existing `weaponGlyph` derivation), keeping W1/D8 "glyph legible on the crate face before the
  collecting shot". This satisfies pin — the glyph lives on the crate face, **not** the HUD.
- **Neon rim + feel.** Render-side neon rim (ADR-0011/0025 precedent) so "ce qui brille est
  interactif" reads at street level; **hue is lead-art's call (pin P4)** — art-advisor recommends
  green `#78FF3C`, cyan fallback, adjudicated at the composite gate (green-crate vs green enemy
  early-telegraph co-occurrence). APPEARING is a **drop-and-settle** over `LOOT_APPEARING_DURATION`
  (render-only); despawn is a **neon-rim blink/dim over the last ~0.8 s** of VISIBLE (render-only,
  no new game state — `GameState.loot → null` on expiry unchanged).

**Art asset ownership (shared-file coordination, shard stage-0).** The `loot` art block in
`src/game/levels/levelArt.json` (prompt / seed / asset path / size) is **`concept-artist`'s file** —
authored in the ∥ art lane, gated by lead-art, generated in CI. **Neither dev lane edits
`levelArt.json`.** `LootCrate.tsx` consumes `levelArt.loot.asset` **read-only** with the procedural
fallback when the block/PNG is absent.

### D6 — Relationship to ADR-0055 (precise supersession)

This ADR **supersedes ADR-0055's D5 _placement_ clause only**. Precisely:

- **Superseded (D5 placement):** "the crate … shares the window channel by **occupying** a slot",
  resolved/rendered at `slot.screenPosition` (window y). Replaced by: the crate is a static
  **street** entity at `LOOT_STREET_Y`; `slotIndex` now carries **x only**; `resolvePlayerShot`
  resolves it at street-y (D3). ADR-0055's §5.4 durations `LOOT_VISIBLE_DURATION` (4.0→6.0) and
  `LOOT_APPEARING_DURATION` (0.3→0.45) are superseded by D2 here.
- **Survives verbatim from ADR-0055 D5:** the crate is a **new entity, not an `EnemyKind`**
  (structurally off the `ARCHETYPES`/score-lives path, AC7-loot); the `LootCrate` shape and
  `LootState` machine; `slotIndex` as the deterministic seed's x-carrier; the co-location guards
  (D5 amendment (a) `attemptSpawn` occupied-slot filter and (b) `spawnWave` `excludeSlots`) — still
  correct and kept; **D9-1** firefight col-gap = §5.4 `LOOT_SPAWN_MIN_COL_GAP` (unchanged).
- **Untouched (all other ADR-0055 clauses):** D1 weapon state, D2 N-resolution hitscan primitive
  and `weaponSystem` fold, D3 `impactEvents` widening, D4 burst, D7 QTE-freeze, D8 Belliard-first.
- **New here (no ADR-0055 equivalent):** D9-2 delivery x-gap and its data threading (D4 above);
  the FLUX-sprite-with-drawn-fallback render model (D5 above).

## Consequences

**Positive.**

- Minimum-surface change: only the crate's **y** source and the **spawn filter inputs** move on the
  game side; the ADR-0040/0052 resolution primitive and ordering are byte-identical (AC-D3 safe).
- `slotIndex` retention keeps replay-safety, the co-location guards, and the tie-break invariant
  intact — zero new seed/determinism model.
- The render farm never blocks the dev lane (ADR-0049 drawn-fallback idiom); one FLUX asset serves
  all three weapons (glyph render-side).
- Clean parallel lanes on disjoint paths (see the story shard lane cut): `src/game` vs
  `src/render`, with `levelArt.json` owned by the ∥ art lane.

**Negative / gotchas.**

- `LOOT_STREET_Y` is a game constant read by the render lane. It is the **single source of truth**
  (defined in `lootSystem`); `LootCrate.tsx` must **import** it, never re-declare −4.3 as a render
  literal (the value is fixed here so both lanes can proceed in parallel).
- The crate plane size decouples from the window opening — the render lane must pick a fixed crate
  world-size; AC-D8 crop clearance is an **empirical** verify/composite item, not a unit test
  (pin P3). `LOOT_STREET_Y` is the tuning knob there.
- D9-2 threads delivery data into a previously delivery-agnostic pure system; reviewers must
  confirm the phase gate lives in `stateMachine` and only pure data crosses into `lootSystem`
  (no `DeliveryVehicle` object, no React/Three) — boundary law preserved (pin P1).
- Two texture sources per crate (drawn box + generated PNG) until the asset lands — accepted, the
  drawn path is the explicit tested fallback (same trade as ADR-0049).

## Notes for downstream

- Unit targets (pin P3): the `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X` filter and the D9-2 gap are
  tested against **`mergedFacade`-shaped** slots (tile-derived x), **not** `facade01` fixture
  arithmetic; the AC-D3 street-y precedence regression is a `bulletSystem` unit test.
- The ADR index (`docs/adr/README.md`) is script-generated (`scripts/gen-adr-index.mjs`, ADR-0041)
  — regenerated, not hand-edited.
