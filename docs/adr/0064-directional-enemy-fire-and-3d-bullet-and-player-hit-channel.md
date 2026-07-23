# 0064 — Directional enemy fire, 3D bullet sprite, and player-hit render channel

- **Status:** Accepted
- **Date:** 2026-07-23
- **Story:** STORY-BULLETS-THREATENING
- **Relates to:** ADR-0002 (aiming SoT), ADR-0003 (viewport/cosmetic state in the
  bridge), ADR-0040 (player-shot hitscan + `ImpactEvent` render channel).

## Context

Enemy return fire today is unthreatening. Two symptoms, one root cause each:

1. **Bullets fall straight down.** `stateMachine.ts:406` hard-codes every enemy
   bullet's velocity as `{ x: 0, y: -BULLET_SPEED }` — a purely vertical descent,
   independent of the shooter's on-screen position and of the player's location.
   The bullet does not travel _from the enemy toward the player_.
2. **Bullets are flat 2D discs.** `BulletSprite.tsx:45` renders each bullet as an
   8-segment `circleGeometry` of radius 0.1 with a flat `meshBasicMaterial`. It
   never changes size with distance, never orients along its motion, and reads as
   a small red dot rather than a projectile approaching the camera.
3. **Getting hit is silent on-screen.** `stateMachine.ts:450` decrements `lives`
   when a bullet enters the player-hit disc but emits no render-side signal. The
   only player-hit feedback today is the HUD lives counter — the player has to
   look away from the action to know they were hit.

The boundary law (PROJECT_GUIDELINES §4, `docs/architecture.md`) is
non-negotiable: `src/game/**` is pure (no React/Three) and holds all rules;
`src/render/**` renders state and holds no rules; `src/hooks/**` is the only
bridge. The `Bullet` position model is 2D (`Vec2` in the game plane) — this ADR
keeps it 2D and adds visual depth by rendering it in 3D against the existing
camera; it does not upgrade the physical model to a `Vec3`.

Bertrand also asked for a Pollinations-generated 3D asset. Pollinations exposes
image (FLUX/kontext) endpoints only; the repo has no glTF loader, no
`public/assets/*.glb`, and no `scripts/gen-*` calling a 3D endpoint. Rather than
open a speculative pipeline for one bullet, this ADR ships **procedural Three
geometry** (cylinder + sphere with an emissive material) — enough to read as a
threatening 3D projectile, zero new dependency, zero external API budget. If a
text-to-3D endpoint is later validated, a follow-up ADR can swap the geometry
for a loaded mesh with zero call-site change.

## Decision

### D1. Enemy fire becomes directional, with jittered aim

A new pure system `src/game/systems/enemyFireSystem.ts` owns bullet spawning:

```ts
export function spawnEnemyBullet(
  id: number,
  origin: Vec2, // enemy slot screenPosition
  target: Vec2, // player-hit centre (0, 0) — the aim SoT
  jitter: Vec2, // uniform-disc offset from the caller (rng-provided)
  speed: number, // BULLET_SPEED, unchanged
): Bullet;
```

- Velocity is `normalize(target + jitter - origin) * speed` — the bullet travels
  from the shooter toward the player with relative accuracy.
- Jitter is provided by the caller (RNG lives outside — the function stays pure
  and deterministic for tests).
- The uniform-disc sampler `sampleDiscJitter(rng, radius)` is exported for
  callers that don't want to hand-roll it.
- `AIM_JITTER_RADIUS = 1.2` world units (roughly the player-hit disc's diameter)
  is the default — enough to miss half the shots on a straight vector but keep
  the "on approach" cue.

The RNG seed comes from the enemy id + a `_nextBulletId` counter — deterministic
per bullet, no test flake, no `Math.random()` in the pure layer.

`stateMachine.ts` swaps the hard-coded `{ x: 0, y: -BULLET_SPEED }` for a call
to `spawnEnemyBullet(...)`; every other rule (SHOOTING gate, `tickBullets`,
out-of-bounds cull, player-hit disc) is unchanged.

### D2. `PlayerHitEvent` transient + `PlayerHitChannel` bridge

Mirror of ADR-0040's `ImpactEvent` / `ImpactChannel`, in the opposite direction
(enemy → player):

- `src/game/types/feedback.ts` adds `PlayerHitEvent { worldPoint: Vec2 }` —
  the position at which the enemy bullet crossed the player-hit disc.
- `GameState.playerHitEvents?: readonly PlayerHitEvent[]` is transient (same
  contract as `impactEvents`), emitted by `stateMachine.ts` in the exact loop
  that decrements `lives`. Zero rule change on `lives`, one new fact surfaced.
- `useGameLoop.ts` exposes `PlayerHitChannel { queue: PlayerHitEvent[]; resetNonce: number }`
  drained per-frame by a new render component. Level-restart bumps `resetNonce`
  same as `ImpactChannel`.

### D3. `BulletSprite` becomes a 3D projectile

- Geometry: `cylinderGeometry` (body, oriented along its motion) + a small
  `sphereGeometry` cap at the leading edge, both with `meshStandardMaterial`
  (copper `#c07a3a`, emissive `#ff5522`, `emissiveIntensity 0.7`) — reads as a
  hot brass bullet against the fanzine B&W facade.
- Per-frame orientation: the mesh's quaternion is set from the bullet's velocity
  so the body always points along its flight vector — the bullet visibly aims
  at the player.
- Scale-by-distance: `scale = clamp(BASE + K * distanceToPlayer, MIN, MAX)`
  where `distanceToPlayer = length(bullet.position)` (the player is at origin).
  A closer bullet is bigger — the primary "coming at us" cue.
- Pool size stays `MAX_BULLETS = 20`; no dependency change; boundary intact.

### D4. `PlayerHitEffects` renders the on-screen impact

New component `src/render/effects/PlayerHitEffects.tsx`, sibling of
`ImpactEffects`:

- **Full-screen red flash** — a wide plane in front of the camera, additive
  `#ff2020`, opacity `0.55 → 0` over `150 ms`. Categorical cue: "you were hit".
- **Camera shake** — a small translational offset on the group holding the
  scene, decaying over `200 ms` with amplitude `0.15` world units. Disabled
  under `reducedMotion` (Prefs) — accessibility.
- Pool of 6 flashes (rapid-fire safety). Same drain-splice pattern as
  `ImpactEffects`.

### D5. Reject Pollinations-generated 3D for now

Pollinations exposes no text-to-3D endpoint accessible from this repo; the
render layer has no GLB loader. Adding both for a single bullet asset violates
Karpathy §Simplicity First and the scope guard. If a future spike validates
text-to-3D, a follow-up ADR swaps the primitives for a loaded mesh with zero
call-site change (the sprite pool is the seam).

## Consequences

**Positive.**

- Bullets read as "coming toward the player" — the immersion bug is fixed at
  the source (one velocity vector, one 3D orientation, one scale ramp).
- Getting hit is unmissable — full-screen flash + shake is a categorical cue
  that stands independent from the HUD counter.
- Boundary intact. The pure layer stays free of React/Three; the render layer
  reads facts and holds no rules; the bridge stays the only seam.
- Zero new dependency, zero external API call, trivial GPU cost (20 lit meshes
  + one plane + a decaying group offset).

**Negative / risk.**

- One existing test (`stateMachine.test.ts:990`) uses `{ x: 0, y: -BULLET_SPEED }`
  as test _data_, not as an assertion — it stays valid. Adaptation is limited to
  a new `enemyFireSystem.test.ts` file.
- `meshStandardMaterial` needs a light in the scene; the R3F scene already has
  the ambient/directional pair for enemies, so no new light. Verified.
- The shake respects reduced-motion, but the red flash does not (a colour flash
  is not a motion cue). Colour-blind players still get the shake + the HUD.

**Rejected alternatives.**

- Widen `Bullet` to `Vec3`. Overkill: the game plane is 2D, the depth cue lives
  in the RENDER (orientation + scale), not in the rules.
- Ship Pollinations text-to-3D pipeline for the bullet. Speculative
  infrastructure for one asset — see D5.
- Post-process bloom on the bullet. Adds a full render pass to gain a cue we
  already get from `emissiveIntensity` on the material. Deferred.

## Rollout

Single PR. Sequence: pure system + tests → state emission → hook channel →
render mesh + effects → `GameScene.tsx` wire → harness. `yarn typecheck && yarn
test && yarn lint` green before push; CI 4-reviewer merge-gate panel is the
authority.
