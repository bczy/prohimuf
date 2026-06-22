# Story — Drive-by car (`car`)

**Epic:** `epic-enemies-car-hostage.md` · **Sequence:** S2 (requires S1) · **Type:** new enemy archetype, street-mobile.

## Why

The shooting gallery currently has one street threat (`courier`) which is a *penalty if you fire*. We need a **rewarded** street threat that breaks the static pop-up rhythm and forces the player to read a moving silhouette — sharpening `Éviter` (a moving shooter) and rewarding `Livrer` (a +3 score on a tank-ier kill). The car reuses the `Courier` movement primitive to stay DRY and YAGNI-safe.

## Cahier des charges check

> "Did Prohibition Atari ST have drive-by cars?"

**No.** Conscious extension justified against the **core loop**:
- `Éviter` — a horizontally moving shooter introduces a new threat axis (lead the target, dodge a sweeping line of fire).
- `Livrer` — risk/reward: +3 score for two HP, harder than a window flic.
- Anti-bullshit-death rule: the **driver does not shoot**; the shooter is always on the trailing seat with a mirrored muzzle flash. The player can always tell where the bullet will come from.

## Scope (V1)

- New `EnemyKind = "car"`, new `ARCHETYPES.car` entry mirroring `enemy-bestiary.md` §2.4 (`hp=2`, `shoots=true`, `scoreDelta=+3`, `livesDelta=0`, `countsAsTarget=true`, weight irrelevant — does not enter `WEIGHTED`).
- New `Car` entity type next to `Courier`: `{ id, x, y, dir, speed, shooterSeat: "rear" | "front_passenger", hp }`.
- New `carSystem` (pure, in `src/game/systems/`) for spawn, tick (move + occasional shoot), bullet hit, off-screen cull. Modelled on `courierSystem`; **must not** import React/Three.
- New dedicated street spawner timer `carSpawnInterval(spawnCount)` analogous to `courierSpawnInterval`; gated by S1's `roster.streetSpawns.includes("car")`.
- Render: new R3F component `src/render/scene/CarDrivers.tsx` (name TBD by Winston) reads state and renders. Sprite is **mirrored on `dir`** with the muzzle-flash on the trailing-seat side.
- Asset pipeline: a new generator `scripts/gen-car-enemies.mjs` aligned with `gen-enemy-types.mjs`, producing two poses per variant (`drive`, `shoot`) on a black background; cutout reuses `cutout-enemies.mjs`. Lazy-loaded via `enemyTextures.ts`.
- Belliard `roster.streetSpawns` extended to `["courier", "car"]` (and only Belliard — AC E2 of the epic).

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | Belliard run with `roster.streetSpawns` including `"car"` | First car spawn timer fires | A `Car` enters from `dir === 1 ? -halfWidth - MARGIN : halfWidth + MARGIN`, with `speed ∈ [COURIER_SPEED * 0.8, COURIER_SPEED * 1.2]` modulated by `level.enemySpeedMultiplier`. |
| AC2 | A live car | Each tick | Driver never produces a `Bullet`; the **shooter** seat produces a bullet with cadence consistent with bestiary §2.4 ("limited fire window during traversal"). |
| AC3 | Player bullet collides with the car | Hit resolves | The car loses 1 HP; on second hit it goes to a `DEAD` state, awards `+3` score (`scoreDelta`), emits a `PointHitEvent`, and disappears. `livesDelta = 0`, `timeDelta = 0`. |
| AC4 | Car traverses fully without being killed | Off-screen cull triggers | Car is removed without score/penalty (it escaped). |
| AC5 | `dir = +1` | Render frame | Sprite is mirrored such that the driver silhouette leads on the right; muzzle flash on the **left** (trailing) side; bullet origin matches the flash position. |
| AC6 | `dir = -1` | Render frame | Mirror of AC5: driver leads on the left; muzzle flash on the **right** side. |
| AC7 | A `stalingrad` or `vitry` run | Any duration | Zero `Car` ever spawns (gated by S1 roster). |
| AC8 | TypeScript strict | `rtk tsc` | Zero errors, no `any`, `src/game/**` holds no React/Three import. |
| AC9 | Vitest | `rtk vitest` | New `carSystem` tests cover AC1–AC4 deterministically (seeded); full suite green. |
| AC10 | Bestiary trace | Reviewer reads `ARCHETYPES.car` | Each numeric value (`hp`, `scoreDelta`, `livesDelta`, `timeDelta`) traces verbatim to `enemy-bestiary.md` §2.4. |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/types/enemy.ts` | Extend union: add `"car"`. |
| `dev-gameplay` | `src/game/types/enemyTypes.ts` | Add `ARCHETYPES.car` (weight stays 0 or excluded from `WEIGHTED`). |
| `dev-gameplay` | `src/game/types/car.ts` (new) | Define `Car` interface (`x`, `y`, `dir`, `speed`, `hp`, `shooterSeat`). |
| `dev-gameplay` | `src/game/systems/carSystem.ts` (new) | `spawnCar`, `tickCars`, `carSpawnInterval`, `checkCarHits`, occupant-shooting logic. Pure. |
| `dev-gameplay` | `src/game/systems/__tests__/carSystem.test.ts` (new) | AC1–AC4 with seeded determinism. |
| `dev-gameplay` | `src/game/state/*` (caller of street tick) | Plumb cars alongside couriers, gated by `roster.streetSpawns`. |
| `dev-r3f-render` | `src/render/scene/CarDrivers.tsx` (new) or sibling to `Couriers.tsx` | Read state, render sprite, mirror per `dir`, position muzzle flash on the shooter seat. **Logic-free.** |
| `dev-r3f-render` | `src/hooks/**` | If a bridge hook is needed for cars analogous to couriers, add it here; this is the only shared seam with gameplay. |
| `dev-tooling-assets` | `scripts/gen-car-enemies.mjs` (new) | FLUX prompts for car body + driver + shooter, two poses (`drive`, `shoot`), aligned silhouettes, black background. |
| `dev-tooling-assets` | `scripts/cutout-enemies.mjs` (extend or replicate) | Process car frames. |
| `dev-tooling-assets` | `src/render/scene/enemyTextures.ts` | Register lazy texture loaders for `car_*`. |
| `dev-gameplay` | `src/game/levels/levels.ts` | Add `"car"` to `belliard.roster.streetSpawns`. Stalingrad/vitry untouched. |

## Out of scope (V1)

- **Driver-killable mechanic** ("kill driver → car spins out into the scene"). Future story, intentionally deferred (YAGNI).
- Car explosions / debris physics.
- Multiple shooters per car (rule §2.2: exactly one).
- Honking / horn audio cue.
- Car spawns in `stalingrad`/`vitry`.
- Re-tuning existing archetypes (`normal`/`riot`/`biker`/`bonus`/`civilian`).

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] TDD: Vitest written first; AC1–AC4 covered and green; full suite green (`rtk vitest`).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] `src/game/**` boundary respected (no React/Three import).
- [ ] Browser validation on Belliard: at least one car spawns per minute on average; visual mirror rule (AC5/AC6) verified by eye; second hit kills the car.
- [ ] Browser validation on Stalingrad and Vitry: no car ever spawns (AC7).
- [ ] Each `ARCHETYPES.car` numeric value cross-referenced to bestiary §2.4 in the PR description.
- [ ] ADR added if Winston judges the new street entity a contract change (likely yes — `roster.streetSpawns` gains a member that affects game state shape).
- [ ] Hand-off logged in `docs/agent-handoffs.md`.
