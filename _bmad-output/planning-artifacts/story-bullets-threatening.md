# STORY-BULLETS-THREATENING — Enemy bullets read as coming toward the player, with visible on-screen impact

- **Status:** In progress
- **Owner:** Copilot (single-agent implementation, no crew orchestration)
- **ADR:** [ADR-0064](../../docs/adr/0064-directional-enemy-fire-and-3d-bullet-and-player-hit-channel.md)

## Player statement

> Je voudrais que l'on ait beaucoup plus l'impression qu'on nous tire dessus. Là
> les tirs tombent bêtement vers le bas. Je voudrais que les balles viennent
> beaucoup plus vers nous. Il faudrait du coup que la balle soit modélisée en 3D,
> qu'elle parte du tireur avec une direction vers nous avec une précision
> relative. La condition est que l'on voie distinctement la balle venir vers nous
> et qu'un impact soit visible sur l'écran.

## Acceptance criteria

1. **AC1 — Directional velocity.** A pure function
   `spawnEnemyBullet(id, origin, target, jitter, speed)` in
   `src/game/systems/enemyFireSystem.ts` returns a `Bullet` whose velocity is a
   unit vector from `origin` to `target + jitter`, times `speed`. Unit-tested.
2. **AC2 — Jittered aim.** A pure `sampleDiscJitter(rng, radius)` returns a
   uniformly-sampled 2D offset inside a disc of the given radius. Deterministic
   under a seeded RNG. Statistically bounded (∥jitter∥ ≤ radius always).
3. **AC3 — No more vertical fall.** `stateMachine.ts` no longer spawns bullets
   with `{ x: 0, y: -BULLET_SPEED }`; the SHOOTING → spawn path uses
   `spawnEnemyBullet(...)` with the player-hit centre as target and a
   `AIM_JITTER_RADIUS` disc for imprecision. Existing SHOOTING/state tests
   continue to pass; the "bullet already on the player" test at
   `stateMachine.test.ts:990` is intact (it tests the hit disc, not the
   direction).
4. **AC4 — Player-hit event.** Each tick where an enemy bullet enters the
   player-hit disc, `state.playerHitEvents` contains a `PlayerHitEvent` at
   the bullet's world position. Transient, drained by the bridge.
5. **AC5 — 3D bullet sprite.** `BulletSprite.tsx` renders each enemy bullet as
   a lit 3D mesh (cylinder body + sphere cap, emissive material). The mesh is
   oriented along its velocity vector each frame. The mesh scales with
   proximity to the player (closer = bigger), between a documented MIN and MAX.
6. **AC6 — On-screen impact.** A new `PlayerHitEffects.tsx` consumes a new
   `PlayerHitChannel` and plays, per event: a full-screen red flash (~150 ms),
   and — outside reduced-motion — a brief camera shake (~200 ms).
7. **AC7 — Boundary intact.** No React/Three import lands in `src/game/**`.
   `yarn lint` (which runs the no-restricted-imports boundary rule) is green.
8. **AC8 — Harness.** A `scripts/harness-bullet-trajectory.mjs` (paired with
   `.claude/skills/harness-bullet-trajectory/SKILL.md`) demonstrates the
   directional velocity property: given a fixed origin and target, the sampled
   velocities all lie within `atan2(jitterRadius, distance)` of the ideal
   vector — proof that the shot goes _toward_ the player and not straight down.

## Out of scope (explicit)

- **Pollinations 3D asset generation.** No text-to-3D endpoint is available in
  this repo today (see ADR-0064 D5); the bullet uses procedural Three geometry.
  A follow-up ADR can swap it for a loaded mesh with zero call-site change.
- **Per-archetype tuning.** `AIM_JITTER_RADIUS` and `BULLET_SPEED` stay global
  in V1; per-enemy-kind tuning is a follow-up.
- **New SFX** on player-hit. Reuses existing HUD audio channel.
