# Story — Per-level roster (Belliard-first rollout gate)

**Epic:** `epic-enemies-car-hostage.md` · **Sequence:** S1 (must land before S2 and S3) · **Type:** scaffolding, no new visible enemy yet.

## Why

S2 (`car`) and S3 (`hostage_taker`) need a way to be **active on Belliard only** without polluting `stalingrad` and `vitry`. Today `LevelConfig` carries no roster information — every level uses the same `ARCHETYPES` weights and the same street spawner. Without this story, shipping either new enemy violates the rollout discipline (`stalingrad`/`vitry` would silently get the new mobs) and the Cahier des Charges audit ("conscious extension, scoped").

## Scope

- Add an **optional** `roster` field to `LevelConfig` exactly as proposed in `enemy-bestiary.md` §5.
- Wire window spawn (`pickKind` path in `enemySystem`) and street spawn (`courierSystem` plus future car/hostage spawners) to **read this field**.
- Default behaviour (field absent) **must equal today's behaviour, byte-for-byte**.
- Belliard gets a `roster` field that opts in to the new street entities once S2/S3 land — but in S1 it can stay empty since neither archetype exists yet. We ship the **gate**, not the content.

## Cahier des charges check

> "Did Prohibition Atari ST have per-level rosters?"

**No.** Conscious extension justified by the **rollout discipline** itself: V1 enemies are an extension; gating them per level is the safety net that lets us iterate on Belliard without touching the validated `stalingrad`/`vitry` experience. Justified against the core loop because it serves `Éviter` differentiation across districts (Belleville's neighbourhoods will not all play the same).

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | `LevelConfig` for `stalingrad` and `vitry` has **no** `roster` field | A wave spawns | The `EnemyKind` distribution is **identical** to pre-story output for the same seed (snapshot/property test). |
| AC2 | A level has `roster.windowWeights` override | A wave spawns | The weighted pool is built from `{ ...defaultWeights, ...roster.windowWeights }`, with `weight: 0` removing the kind entirely. |
| AC3 | A level has `roster.streetSpawns: ["courier"]` | Street spawner ticks | Only couriers spawn in the street (current behaviour preserved). |
| AC4 | A level has `roster.streetSpawns: []` | Street spawner ticks | Nothing spawns in the street (system is silent, no warnings, no errors). |
| AC5 | `belliard` gets `roster: { streetSpawns: ["courier"] }` in this story | Game runs | Belliard plays exactly as today (no new enemies yet — gate only). |
| AC6 | Any consumer of `pickKind` | Reads weights | Function signature accepts an optional weighted pool override; default call site (no override) is unchanged behaviour and unchanged signature externally if possible (add a sibling helper rather than break callers). |
| AC7 | TypeScript strict | `rtk tsc` | Zero errors. `EnemyKind` union is **not** mutated in this story (kinds added in S2/S3). |
| AC8 | Unit tests | `rtk vitest` | New tests cover AC1–AC4; full suite green. |

## File map (for the architect to allocate lanes)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/levels/levels.ts` | Add optional `roster` field on `LevelConfig`; add `roster: { streetSpawns: ["courier"] }` to `belliard`. |
| `dev-gameplay` | `src/game/types/enemyTypes.ts` | Export a helper that builds a `WEIGHTED` array from an override map (do **not** mutate the existing `WEIGHTED` constant; add `pickKindFor(seed, weights)` alongside `pickKind`). |
| `dev-gameplay` | `src/game/systems/enemySystem.ts` (or its caller in `src/hooks/**` if that's where level config is read) | Plumb `roster.windowWeights` from the active `LevelConfig` into the spawn call. |
| `dev-gameplay` | `src/game/systems/courierSystem.ts` **or** a new tiny `src/game/systems/streetSpawnSystem.ts` | Read `roster.streetSpawns`; if absent → default current behaviour; if present and lacks `"courier"` → suppress courier spawn. **Pure**, no React/Three. |
| `dev-gameplay` (tests) | `src/game/systems/__tests__/levelRoster.test.ts` (new) | Cover AC1–AC4 with deterministic seeds + snapshot of distribution shape. |
| `senior-architect` | `docs/adr/` | Add a short ADR if the `roster` field is judged a contract change for the level loader. |

**No `src/render/**` change in S1.** No new sprite. No new asset script. This is pure scaffolding.

## Out of scope (S1)

- Adding `car` or `hostage_taker` to any roster (those land in S2/S3).
- Changing `enemiesToWin` semantics.
- Persisting roster info to save state.
- UI surfacing the roster anywhere.

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Vitest written **first** for AC1–AC4 and green; full project suite green (`rtk vitest`).
- [ ] `rtk tsc` clean, no `any`, no boundary violation.
- [ ] `rtk lint` clean.
- [ ] Cahier des Charges note recorded in the PR description (§Why above).
- [ ] Browser smoke on Belliard: visually identical to `main` (gate only).
- [ ] `stalingrad`/`vitry` browser smoke: identical to `main`.
- [ ] Hand-off logged in `docs/agent-handoffs.md`.
