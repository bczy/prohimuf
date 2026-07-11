# 0006 — Directional, mirrored multi-pose sprite generation for car & hostage entities

- **Status:** Proposed
- **Date:** 2026-06-22
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (D1 street entities, D4 dual-mode
  hostage, the car shooter-seat / muzzle-flash table), [ADR-0005](./0005-dynamic-verification-harness.md)
  (the texture-coverage gate runs in this harness/CI), [ADR-0007](./0007-shared-harness-library.md)
  (fetch/cutout via the shared lib), `scripts/gen-enemy-types.mjs`, `scripts/cutout-enemies.mjs`,
  `.github/workflows/gen-sprites.yml`,
  [`enemy-bestiary.md`](../../_bmad-output/guidelines/enemy-bestiary.md) (§2, §3).

## Context

ADR-0004 added two new enemies that are mobile, directional street actors: the drive-by `car`
(D1) and the street/window `hostage_taker` (D4). Both depend on art that **does not yet exist**.

The forces, read from the real code:

- **The generator only knows window cops.** `scripts/gen-enemy-types.mjs` `ASSETS` (lines 25–60)
  declares exactly six static, front-facing poses: `enemy_riot` / `enemy_riot_shooting`,
  `enemy_biker` / `enemy_biker_shooting`, `enemy_civilian`, `enemy_bonus`. Every prompt ends in
  "standing facing forward". There is **no `car_drive`, no `car_shoot`, and no hostage pose**.
  The `.github/workflows/gen-sprites.yml` job runs this script then `cutout-enemies.mjs` — so CI
  can only ever produce the poses the spec array lists.

- **ADR-0004 demands directional, mirrored, multi-pose art.** Its shooter-seat table
  (`0004-enemies-car-hostage-taker.md:218-231`) requires the car to read as a moving silhouette
  with the muzzle flash on the **trailing seat**, **mirrored on `dir`**, in two poses (`drive`
  with no flash, `shoot` with flash). The hostage taker (bestiary §3.5,
  `0002:128-129`) requires a **double hitbox** — kidnapper reward zone vs. hostage penalty zone —
  that is **spatially separated and visually distinct** (otage clearly in the foreground, captif,
  unarmed), or the anti-bullshit-death guarantee collapses.

- **Render deliberately ships before art via a cop fallback — and that is the trap.**
  `src/render/scene/enemyTextures.ts:55-57`: `getEnemyTexture` resolves `fileFor(kind, …)` then
  `return cache.get(file) ?? cache.get(fallback) ?? null`, where `fallback` is
  `FALLBACK_SHOOT`/`FALLBACK_IDLE` = `enemy_shooting.png`/`enemy_sprite.png`
  (`enemyTextures.ts:17-18`). On a load error `ensureLoaded` (lines 40-44) latches the missing
  file into `failed` and serves the plain cop **forever, silently**. ADR-0004 leans on this on
  purpose (its "Render can ship before assets" consequence) to decouple lanes. **But if the car
  and hostage sprites are never actually generated, both entities render as a plain cop with no
  error**: the player cannot tell which side the car shooter fires from, and cannot tell the
  hostage from the kidnapper. The legibility ADR-0004 fought for is destroyed by the very fallback
  that let render ship early.

- **`fileFor` already encodes the naming the spec must honour.** `enemyTextures.ts:20-30` derives
  the file from `ARCHETYPES[kind].spriteBase` (`enemyTypes.ts:20`) plus a `_shooting` suffix and a
  `_<variant>` suffix. So a `car` archetype with `spriteBase: "car"` will request
  `car.png` / `car_shooting.png`. The generator's spec array is the only place that decides whether
  those files come into existence. Note also the `EnemyKind` union (`src/game/types/enemy.ts:5`)
  is still the legacy five — `car`/`hostage_taker` arrive on ADR-0004's serial `enemy.ts` lane; the
  sprite spec must land in lock-step with the archetype that names its `spriteBase`.

This ADR closes the asset half of ADR-0004: it makes the missing sprites a **build failure**, not
a silent cop.

## Decision

### D1 — Extend the sprite **spec data**, not the fetch mechanics

Add to `gen-enemy-types.mjs`'s `ASSETS` array exactly the poses bestiary V1 requires, and nothing
more:

- `car_drive` and `car_shoot` — one base orientation, the `shoot` pose carrying the muzzle flash on
  the **trailing** side per the ADR-0004 shooter-seat table.
- the `hostage_taker` / hostage pair — the kidnapper sprite with the hostage rendered clearly in the
  **foreground** (unarmed, captive posture), so the two hitbox zones are visually separable
  (bestiary §3.5).

These are pure additions to the spec array (name + prompt + size + mirror-policy). The fetch loop,
retry/backoff, and chroma-key in `cutout-enemies.mjs` are **untouched** — they already iterate the
array generically. `spriteBase` on the new archetypes points at these roots so `fileFor`
(`enemyTextures.ts:20-30`) resolves them without a render change.

### D2 — Generate ONE base orientation; the left/right mirror is a render transform per `dir`

We generate a single facing per pose. The `dir === -1` view is produced at render time by a flip on
the `CarDrivers.tsx` (and hostage) mesh — **not** by generating a second mirrored asset. ADR-0004's
table already specifies that the sprite is "mirrored on `dir`" with the flash on the trailing side;
that mirror is a presentation concern and belongs in `src/render/**`, which holds the per-`dir`
transform already used by directional street sprites. Generating mirrored art would double the asset
count and the CI render-farm cost for zero information gain.

### Four principles

- **TDD (first-class — the failing test comes first).** Before any sprite is generated, add a
  coverage test (the gate of ADR-0005) asserting: _every `EnemyKind` referenced by any level's
  `roster` (`windowWeights` keys + `streetSpawns`) resolves to a real, on-disk, non-fallback
  texture for each pose it advertises._ Concretely the first failing assertion is
  `expect(resolvedSpriteFiles).not.toContain(FALLBACK_IDLE_FILE)` /
  `…not.toContain(FALLBACK_SHOOT_FILE)` for `car` (`car.png`, `car_shooting.png`) and
  `hostage_taker`. With Belliard's roster opting these kinds in, the test is **red** today because
  the files do not exist and `getEnemyTexture` would return the cop fallback. We then add the spec
  entries (D1) and let CI generate until the test is green. This converts the exact silent trap
  ADR-0004 opened into a loud CI failure.

- **SOLID (SRP + DIP).** SRP: the **sprite spec** (data — name, prompt, size, mirror-policy) is one
  responsibility; the **fetch/cutout mechanics** (ADR-0007's shared lib) are another; the **per-`dir`
  mirror** is a third and lives in render. We change only the spec, leaving the other two intact.
  DIP: the generator and the coverage test both depend on the _spec abstraction_ (the `ASSETS` array
  - the archetype `spriteBase`) rather than on hard-coded filenames, so adding a pose is a data edit,
    not a mechanics edit — and `fileFor` already consumes that same abstraction.

- **YAGNI.** Exactly two poses per car variant (`drive`/`shoot`) plus the single hostage pair — the
  minimum the V1 bestiary names. No walk-cycle sheet, no per-frame animation strip, no second
  mirrored render, no "front-passenger-leaning" alternate the bestiary §2.3 explicitly defers. The
  scope guard holds: this is only the art the V1 enemy work needs.

- **DRY.** The mirror is one render transform reused for both `dir` values, not duplicated art
  (D2). Fetch + chroma-key reuse the shared lib (ADR-0007) rather than re-implementing the HTTP/retry
  and flood-fill in this script. The naming contract is single-sourced through `spriteBase` →
  `fileFor`, so spec, generator, and the coverage test never restate filenames independently.

## Consequences

**Positive**

- Legibility is **enforced by a test, not by hope**. A missing car/hostage sprite fails CI instead
  of silently degrading to a cop, closing the trap from `enemyTextures.ts:55-57`.
- Render still ships before art: the fallback in `getEnemyTexture` stays, so a dev branch mid-epic
  renders a placeholder rather than crashing — but the ADR-0005 gate prevents shipping that
  **fallback to production**.
- Adding the poses is a pure spec-data edit; the fetch loop, the chroma-key step, and the
  `gen-sprites.yml` workflow are unchanged and keep working for the existing cop sprites.
- The boundary law is respected: no game rule moves into render. The only render change is the
  per-`dir` mirror transform, which is presentation, and live game state still reaches render solely
  through `src/hooks/useGameLoop.ts`.

**Negative / costs**

- The coverage test **couples roster data to asset existence**: editing a level's `roster` to opt in
  a kind now also obliges its sprites to exist, or CI goes red. This is the intended coupling, but it
  means a roster change and an asset change can no longer land in fully independent PRs once a kind is
  active.
- Two extra base poses (plus the hostage pair) add to the CI render-farm time and to the committed
  asset bytes. Small, bounded by YAGNI, but non-zero.

**Gotchas to watch**

- You will likely need a **documented, temporary "pending-generation" allowlist** so the coverage
  test can stay green while a kind is wired up but its sprite is still queued in CI. This allowlist
  **must not become permanent** — every entry is a kind that currently renders as a cop in
  production. Treat a non-empty allowlist as epic-debt: it must be empty before the epic closes, and
  the test should print which kinds are being skipped so it cannot rot silently.
- The `shoot` pose's muzzle flash must match the **trailing** side of the _base_ orientation; if the
  base flash is on the wrong side, the D2 mirror propagates a bullshit death to **both** directions.
  Verify the base pose against the ADR-0004 shooter-seat table before generating.
- `spriteBase` on the new archetypes is the single source of the filename `fileFor` requests; a typo
  there means the texture loads the fallback and the coverage test (correctly) fails — fix the
  archetype, not the test.
