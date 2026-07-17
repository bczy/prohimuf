# 0040 — Player-shot hitscan resolution + render-transient impact effects (explosion, tracer, wall marks)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Story:** STORY-SHOT-FLAT-IMPACT
- **Spec:** [../game-design/spec-shot-flat-impact.md](../game-design/spec-shot-flat-impact.md)
- **Tech plan:** [../game-design/techplan-shot-flat-impact.md](../game-design/techplan-shot-flat-impact.md)
- **Relates to:** ADR-0002 (aiming SoT / `crosshairToWorld`), ADR-0003 (viewport &
  cosmetic state live in the bridge, not `GameState`), ADR-0008 (two-axis pan offsets).

## Context

The player shot in the shooting-gallery phase spawns a `Bullet` at the crosshair with
`velocity.y = +20` and resolves hits along the rising path each tick (`bulletSystem.ts`).
This makes the shot visibly climb and lets it hit an enemy _above_ the aim point. The
design gate (spec, GATED 2026-07-14) restores faithful behaviour: **instant impact at the
aimed point**, an impact explosion, and persistent facade wall marks. Two boundary
questions were deferred to the architect (spec §D4.5, story AC6):

1. Where does the player-shot hit resolution live now that there is no travelling player
   projectile?
2. Where does the bounded, level-scoped **wall-mark decal set** live — in `GameState`
   (rule state) or as render-transient state?

The boundary law (PROJECT_GUIDELINES §4 / architecture.md): `src/game/**` is pure (no
React/Three) and holds all rules; `src/render/**` renders state and holds no rules;
`src/hooks/**` is the only bridge. Wall marks are, by design (spec D4.4), **cosmetic and
rule-free**: they do not block, count, gate hit tests, or affect scoring.

## Decision

**1. Player shot becomes a pure hitscan resolved at fire time.** The player shot no longer
enters `state.bullets`, has no `velocity`, and no per-tick advance. A new pure function
`resolvePlayerShot(...)` in `src/game/systems/bulletSystem.ts` computes the impact point via
`crosshairToWorld` (aiming SoT, ADR-0002/0008 — unchanged), applies the existing hit disc
(`HIT_RADIUS = 0.8`), selects **nearest-eligible enemy, tie → lowest `slotIndex`** (one
target per shot), and reuses the existing reward math (`ARCHETYPES` deltas, `hitEnemy`,
`HitEvent`) byte-identically. **Enemy return fire is unchanged**: `fromPlayer === false`
bullets remain travelling projectiles in `state.bullets` (`tickBullets`, `BULLET_SPEED`,
`OUT_OF_BOUNDS` cull). Only the player branch leaves the bullet path. The now-orphaned
`fireBullet` and `checkBulletHits` (both player-only) are removed.

**2. Hit resolution stays pure `src/game`; the effect/decal state is render-transient.**
The pure game emits, per player shot, exactly one `ImpactEvent` (classification `hit` |
`miss`, the world `impactPoint`, and on a hit the struck `enemyId` / `slotIndex` /
`slotPosition`) on a transient per-tick field `GameState.impactEvents` — mirroring the
existing transient `feedback` / `pointFeedback` fields (consumed per-frame, never persisted
in the rule state). The **explosion, optional tracer, and wall-mark decal set all live in
`src/render/effects/**`** as render-transient state, consumed from the tick via the hooks
bridge. `GameState` stays rule-only: it carries the impact **facts** for one tick, not the
decal **set**.

**3. The wall-mark set is a bounded FIFO owned by render, cleared by a bridge reset
signal.** The `WALL_MARK_CAP = 16` FIFO buffer and every cosmetic tuning constant
(explosion sizes/durations, `TARGET_BASE_DROP`, tracer geometry, `WALL_MARK_SIZE`) live in
`src/render/effects/**`. Level-scoping (spec D4.3 — cleared on level restart / new level) is
delivered by a monotonic `resetNonce` the bridge bumps whenever it calls
`createInitialState`; the effects component clears its FIFO when the nonce changes (and
naturally on unmount for a new level). The only game-owned constant remains `HIT_RADIUS`.

This follows the ADR-0003 precedent verbatim: viewport/cosmetic state that carries no game
rule lives in the bridge/render, not in `GameState`.

## Consequences

**Positive.**

- `GameState` stays rule-only and byte-identical in scoring/win-gate; existing hit/score
  tests keep their reward assertions (only trajectory/aim-point assertions change).
- The impact effects are structurally incapable of reintroducing the climbing bug: no
  `Bullet`, no advanced position — a tracer, if shipped, is a still line that only fades.
- Clean parallel lanes: pure resolution + bridge wiring (`dev-gameplay`) vs. all visuals
  (`dev-r3f-render`) touch disjoint files behind one typed seam (`ImpactEvent` +
  `ImpactChannel`).

**Negative / gotchas.**

- Wall marks are **not** in `GameState`, so they are not serialized/replayable and not
  unit-testable in `src/game`. Accepted: they are cosmetic (D4.4). Their bound (cap 16) and
  level-scoping are asserted at the render/e2e layer, not in game unit tests.
- **Behavioural delta for QA:** one shot now downs **at most one** enemy (nearest wins).
  Today a travelling bullet could graze multiple overlapping enemies across ticks. Windows
  are spaced, so this is a degenerate case, but regression tests must expect it (spec A2/D1.5).
- The reset signal is bridge-owned (`resetNonce`); render must clear on nonce-change **and**
  handle its own unmount, or marks could leak across a level change that reuses the scene.
- The tracer muzzle origin must be derived from `cameraOffsetY − viewH/2` (live viewport),
  **not** the spec's illustrative `MUZZLE_ORIGIN_Y = −6`, so it tracks vertical pan.

## Amendment (2026-07-14 — Stage 6 integration)

The tracer (always framed here as _optional / if shipped_) was **dropped** at the composite
gate per spec D2.4: it read as noise against the lit facade and added nothing over the
explosion + wall mark. **Nothing shipped for it** — no `TRACER_*` constants, no `useThree`
muzzle derivation in `ImpactEffects.tsx`, so the muzzle-origin gotcha above is now moot.

In its place, a **read-strength rework** shipped, all render-transient and rule-free (same
boundary decision as above): a brief NORMAL-blended **dark backing disc** under each burst
(so the additive neon reads on a bright facade), a **hit-only white flash** as the
categorical hit/miss cue, miss explosion diameter raised `0.7 → 0.9`, and a plateau opacity
envelope on the burst. Each transient runs a capped pool (12) alongside the `WALL_MARK_CAP =
16` FIFO. These are cosmetic constants owned entirely by `src/render/effects/**`; the game
seam (`ImpactEvent` = classification + `impactPoint` + optional `hit`) is unchanged.
