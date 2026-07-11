# 0004 — New enemy entities: drive-by car, hostage taker, per-level roster, and the `energy` stat

- **Status:** Accepted
- **Date:** 2026-06-22
- **Supersedes:** —
- **Related:** [ADR-0001](./0001-github-pages-deployment.md), `docs/architecture.md`,
  `_bmad-output/guidelines/enemy-bestiary.md` (§2, §3, §4, §5),
  stories `story-level-roster-belliard.md`, `story-car-drive-by.md`, `story-hostage-taker.md`.

## Context

The shooting-gallery prototype has two spawn modalities today:

1. **Window pop-ups** — `Enemy` entities driven by the `enemySystem` state machine
   (`HIDDEN → APPEARING → VISIBLE → SHOOTING/HIDDEN → HIT → DEAD`). The kind is chosen by
   `pickKind(seed)` in `src/game/types/enemyTypes.ts`, which indexes a module-level
   `WEIGHTED` array built once from every archetype's `weight`. Win condition counts
   `score >= enemiesToWin`.
2. **Street entities** — the `Courier` (livreur), a mobile `{ x, y, dir, speed }` entity that
   enters from one edge, traverses, and is culled off-screen. It is spawned on a dedicated
   timer (`courierSpawnInterval`) **outside** `pickKind`, ticked in `stateMachine.ts`
   step 7b, and is a _penalty-if-shot_ (no window slot; uses `PointHitEvent` for
   world-anchored feedback). Its archetype carries `weight: 0`, which removes it from the
   weighted window pool.

The bestiary (`enemy-bestiary.md`) introduces two new enemies plus a rollout constraint:

- **`car`** — a _rewarded_ street threat (drive-by). Two occupants; only the trailing-seat
  shooter fires. Tank-ier than a window cop (`hp=2`, `scoreDelta=+3`). Must read as a moving
  silhouette with a predictable muzzle-flash side.
- **`hostage_taker`** — a precision-shot target with a **double hitbox** (reward = kidnapper,
  penalty = hostage). Ships in **both** window and street modes. A timeout _executes_ the
  hostage. Magnitudes ("lose a lot" for a _bavure_, "lose a little" for a timeout) cannot be
  expressed by the discrete 3-lives counter and motivate a new continuous stat.
- **Belliard-first rollout** — the new mobs must be active on `belliard` only, never silently
  leaking into the validated `stalingrad` / `vitry` experiences.

Architectural forces in play, established by reading the code (not the stories):

- **`stateMachine.ts` is the single integration point.** It owns the street-spawn loop, the
  `pickKind` call site (via `spawnWave`), the aggregation of every per-tick delta into
  `GameState`, and `createInitialState`. **All three stories converge here** — this is the
  primary shared-file risk, not `src/game/state/index.ts` (a 6-line re-export barrel).
- **`tickGameState` already has 11 positional parameters** and is at the limit of what is
  legible. Threading three more positionals per story (`roster`, car field, hostage field +
  energy) is untenable and would be a maintenance trap.
- **`GameState` is a flat, `readonly` record** with no `energy` field. `energy` (0–100,
  continuous) does **not** exist anywhere in `src/` today (verified). Introducing it changes
  the game-state contract — this is the trigger that makes this an ADR rather than a plain story.
- The render layer degrades gracefully: `getEnemyTexture` falls back to the normal-cop sprite
  for any not-yet-generated texture (`car_*`, `hostage_*`), so render and asset-generation
  work can proceed independently and out of order.

## Decision

### D1 — Street entities (`car`, street `hostage_taker`) follow the `Courier` model, not a window spawn

New mobile, directional entities reuse the `Courier` primitive shape
(`{ id, x, y, dir: 1 | -1, speed }`) and the courier lifecycle: edge spawn at
`dir === 1 ? -(halfWidth + MARGIN) : halfWidth + MARGIN`, linear traverse, off-screen cull.
They are **spawned on dedicated street timers** (`carSpawnInterval`, hostage street timer)
analogous to `courierSpawnInterval`, and they are **excluded from `pickKind` / `WEIGHTED`**.

Rationale: a drive-by and a traversing kidnapper are _physically_ street actors with entry/exit
and a travel direction — the window state machine (`HIDDEN/APPEARING/VISIBLE/...` keyed to a
fixed facade `slotIndex`) cannot represent them without distortion. Reusing the courier model is
DRY, keeps `pickKind` deterministic and unpolluted, and means each new street entity is an
additive `readonly` field on `GameState` plus its own pure system — no edit to existing window
or weighting logic. The archetypes for `car` and `hostage_taker` therefore do **not** rely on
`weight` for street spawning (mirroring `civilian`'s `weight: 0` convention).

The **window** `hostage_taker` is the exception that _does_ use the state machine and _may_
enter `WEIGHTED` — see D4 (it only enters when the level's roster opts it in).

### D2 — Per-level roster is an **optional** field on `LevelConfig`; absence = today's behaviour, byte-for-byte

```ts
// src/game/levels/levels.ts — additive, optional
readonly roster?: {
  readonly windowWeights?: Partial<Record<EnemyKind, number>>; // override window pool
  readonly streetSpawns?: readonly ("courier" | "car" | "hostage_taker")[]; // active street entities
};
```

Semantics (locked):

- **Field absent** ⇒ identical to current behaviour. Window pool = the existing `WEIGHTED`;
  street spawner = courier-only (today's hard-coded behaviour). This must hold _byte-for-byte
  for the same seed_ (asserted by a snapshot/property test, story S1 AC1).
- **`windowWeights` present** ⇒ the weighted window pool is built from
  `{ ...defaultWeights, ...windowWeights }`; an entry of `weight: 0` removes that kind entirely.
- **`streetSpawns` present** ⇒ exactly the listed street entities are active. `[]` ⇒ a silent
  street (no spawns, no warnings). Absent ⇒ legacy courier-only default.
- **Belliard-first:** only `belliard` opts in (`streetSpawns: ["courier"]` in S1, extended to
  `["courier", "car", "hostage_taker"]` and `windowWeights: { hostage_taker: 8 }` as S2/S3 land).
  `stalingrad` / `vitry` keep **no `roster` field** and are therefore frozen at the validated
  experience.

This gate is the rollout safety net. It honours the Cahier-des-Charges discipline (V1 enemies
are a _conscious_ extension; gating them per district lets us iterate on Belliard without
regressing the other levels).

### D3 — `pickKind` is **not** mutated; add a sibling `pickKindFor(seed, weights)`

The existing `pickKind(seed)` and the module-level `WEIGHTED` constant are **frozen**. S1 adds a
pure sibling helper that builds a weighted array from an override map and picks from it:

```ts
export function buildWeighted(weights: Partial<Record<EnemyKind, number>>): readonly EnemyKind[];
export function pickKindFor(seed: number, weights: Partial<Record<EnemyKind, number>>): EnemyKind;
```

`spawnWave` gains an **optional** weights argument; when omitted it calls `pickKind` exactly as
today (no behavioural or external-signature change for existing callers). This keeps AC1's
byte-for-byte guarantee trivially true and avoids breaking the four existing call sites.

### D4 — `hostage_taker` is dual-mode by **spawn path**, single by **archetype**

One `ARCHETYPES.hostage_taker` entry (DRY). The _window_ path uses the `enemySystem` machine
extended with one new terminal transition: on `visibleDuration` timeout, `hostage_taker` routes
to a terminal **`EXECUTES`** path (hostage dies → timeout penalty) instead of looping back to
`HIDDEN`. Every other kind's `nextState` / `durationFor` output stays byte-identical (asserted).
The _street_ path uses a `HostageTaker` courier-style entity with a **fixed-delay** timeout
(bestiary §3.3); the off-screen cull applies the timeout penalty **once** as well, so an escape
is never free and never double-charged (story S3 AC6).

The double hitbox resolves with **hostage-precedence**: when a single bullet could overlap both
zones in one frame, the foreground hostage zone wins — you cannot "shoot through" the hostage to
claim the reward. This is the anti-bullshit-death guarantee and is unit-asserted (S3 AC7).

### D5 — `energy` — **introduce `energy: number` (0–100) into `GameState`** (story S3 option _a_)

We adopt **option a**: a single continuous `energy` slice, of which the hostage taker is the
**first and only** consumer in V1. The discrete `lives` counter is left untouched and continues
to own net-life losses. Rejected alternative (option b — map hostage penalties onto `lives`):
it collapses the "lose a lot / lose a little" nuance that is the _entire design purpose_ of the
hostage taker; a half-life loss is not representable and the bestiary magnitudes (≈−25 vs ≈−10
on 100) become meaningless.

Boundary & scope fences (locked, YAGNI):

- `energy` is a pure `readonly` data field on `GameState`, initialised to **100** in
  `createInitialState`. Arithmetic/clamping live in a pure helper `energySystem.ts`
  (`applyEnergy(current, delta) → clamp[0,100]`), unit-tested. **No game rule in render.**
- The HUD reads it (`HudData.energy?`, rendered in `HUD.tsx`) and floats the delta — **read-only,
  `src/render/ui/**`only**. The bridge is`useGameLoop.ts` (`onHudUpdate`+`floaterFor`), the
  single sanctioned game↔render seam.
- `PointHitEvent` / `HitEvent` gain an **optional** `energyDelta` (default `0`, additive — no
  regression for existing emitters such as the courier).
- **Out of scope:** energy regeneration, energy-driven death/game-over, energy thresholds gating
  difficulty, and any second consumer. Reaching 0 has **no special effect** beyond the clamp.

### D6 — Manage the convergence at `stateMachine.ts` by bundling spawn context, and serialise the shared files

Because `tickGameState` is already at 11 positional args and all three stories must touch it, the
threading of new per-level context is done by **extending the existing `LevelParams`-style context
object** rather than adding positional parameters. S1 (the gate) introduces the seam:
`roster` reaches `tickGameState` through the level-params/options object that `useGameLoop`
already assembles, and the step-7b street block reads `streetSpawns` from it. S2 and S3 then add
their entity arrays to `GameState` (`cars`, `hostageTakers`) and their own pure systems, hanging
off the seam S1 established — they do **not** re-plumb the signature.

The following files are **shared across stories and MUST be edited serially** (see lane plan):
`stateMachine.ts`, `levels.ts`, `enemy.ts` (the `EnemyKind` union), `enemyTypes.ts`
(`ARCHETYPES`), `feedback.ts`, and the render-side seam `useGameLoop.ts`. Everything else
(new per-entity systems, types, sprites, asset scripts, tests) is on disjoint paths and runs in
parallel.

## Consequences

**Positive**

- The game↔render↔hooks contract is preserved. New street systems are pure (`src/game/**`, zero
  React/Three); new sprites are logic-free (`src/render/**`); the only bridge remains
  `src/hooks/useGameLoop.ts`. `HUD.tsx` stays render-only (it imports only the `Phase`/`HudData`
  types).
- Additive-and-optional everywhere (`roster?`, `energyDelta?`, `energy` initialised, sibling
  `pickKindFor`) ⇒ **zero regression** on `stalingrad`/`vitry` and on existing emitters; the
  58+ Vitest suite stays green throughout.
- `pickKind` / `WEIGHTED` frozen ⇒ window spawn determinism is provably unchanged.
- Belliard-first gate makes the rollout reversible and district-differentiated by data alone
  (no code change to add/remove a mob from a level once the systems exist).
- Render can ship before assets: `getEnemyTexture`'s cop fallback means `car_*`/`hostage_*`
  sprites render as a placeholder until CI generates them — decoupling the tooling-assets lane.

**Negative / costs**

- `GameState` grows (`energy`, plus `cars` and `hostageTakers` arrays). Every place that
  spreads `GameState` in `stateMachine.ts` (several early-return branches: game-over, time-out,
  normal) must carry the new fields — easy to miss one. Mitigated by the type being `readonly`
  and exhaustive (TS will flag a missing field in an object literal that claims to be `GameState`).
- `stateMachine.ts` becomes the serialisation bottleneck for the epic. The three stories cannot
  land their `stateMachine.ts` edits truly concurrently; the lane plan sequences them
  (S1 → then S2 ∥ S3 merge-coordinated on this file).
- One new terminal enemy state (`EXECUTES`) widens the `EnemyState` union and the
  `nextState`/`durationFor` switches; care is needed to keep all non-hostage kinds byte-identical
  (covered by an existing-kinds snapshot test).

**Gotchas to watch**

- The off-screen cull and the fixed-delay timeout for the street hostage must apply the timeout
  penalty **exactly once** (S3 AC6). Whichever fires first wins; the other must be a no-op.
- Hostage-precedence in the double-hitbox resolver is a _safety_ property — assert it directly,
  don't rely on z-order or iteration order.
- The car's muzzle-flash side and bullet origin must match the **trailing seat** per `dir`
  (see car shooter-seat decision below); a mismatch reintroduces a bullshit death (bullet from
  the wrong side).
- `energyDelta` defaults to `0`; the courier and all existing emitters must keep emitting events
  without it (optional field, not required) — verify no emitter is forced to set it.

## Car shooter-seat / muzzle-flash decision (bestiary §2.3 — confirmed)

**Confirmed, not amended.** The shooter occupies the seat **in retreat** relative to the
direction of travel (the trailing side); the driver leads (head of the vehicle) and **never
fires**. The muzzle flash and the bullet spawn origin are on the **trailing side**, and the
sprite is **mirrored on `dir`**:

| `dir` | Travel  | Driver seat (lead) | Shooter seat (trailing)        | Muzzle flash / bullet origin |
| ----- | ------- | ------------------ | ------------------------------ | ---------------------------- |
| `+1`  | → right | front-right        | rear (or rear-left passenger)  | **left** (trailing) side     |
| `-1`  | ← left  | front-left         | rear (or rear-right passenger) | **right** (trailing) side    |

Rationale: it keeps the line of fire unobstructed by the driver and makes the threat _legible_
(the player can always predict the bullet's side from the car's facing), satisfying the
anti-bullshit-death rule. The bestiary's alternative ("front passenger leaning out of the
window") is **declined for V1** because it puts the shooter ahead of/behind the driver
inconsistently across the mirror and risks the driver masking the muzzle; if a future story wants
that pose, it must document why the driver does not occlude the shot. Two poses per variant are
required: `drive` (no flash) and `shoot` (flash on the trailing side), mirroring the existing
`enemy_sprite` / `enemy_shooting` convention. `Car.shooterSeat: "rear" | "front_passenger"`
selects the silhouette but does not change the firing side (always trailing).
