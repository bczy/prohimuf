# Tech Plan — Player shot: flat instant impact + wall mark (STORY-SHOT-FLAT-IMPACT)

**Stage 3 (TECH PLAN).** Author: `senior-architect` (Winston) · Date: 2026-07-14
**Inputs:** gated spec `docs/game-design/spec-shot-flat-impact.md` (design gate PASS),
story `_bmad-output/planning-artifacts/story-player-shot-flat-impact.md`.
**Decision record:** `docs/adr/0040-render-transient-impact-effects.md`.
**Status:** APPROVED for build — two parallel lanes, one typed seam.

This plan freezes the exact contracts (types, signatures, file-by-file change list) so
`dev-gameplay` and `dev-r3f-render` can build in parallel without touching each other's
files. All tuning values are transcribed from spec §5 with their owning layer.

---

## 1. Headline decisions

**D-A — Decal-set ownership (ADR-0040): ENDORSE render-transient.** Wall marks, explosion,
and tracer are cosmetic and rule-free (spec D4.4), so they live in `src/render/effects/**`,
**not** in `GameState`. This follows ADR-0003 verbatim (viewport/cosmetic state lives in the
bridge, not the rule state — see `useGameLoop.ts:108`). The pure game produces only the
**facts** for one tick: impact point + hit/miss classification + struck slot. The bounded
FIFO decal set (cap 16) and every cosmetic constant are owned by render.

**D-B — Pure hit-resolution API: hitscan at fire time, one `ImpactEvent` per shot.** The
player shot leaves `state.bullets` entirely (no `Bullet`, no `velocity`, no per-tick
advance). New pure resolver `resolvePlayerShot(...)` in `bulletSystem.ts` resolves at fire
time against the live enemy set. `crosshairToWorld` stays the aiming SoT. Enemy fire
(`fromPlayer === false`) is untouched — it stays a travelling projectile. Orphaned
`fireBullet` and `checkBulletHits` (both player-only) are removed.

**D-C — Seam rule R1: RATIFIED.** `dev-gameplay` owns `src/game/**` **and** the
`src/hooks/useGameLoop.ts` bridge edit; it lands the seam types + hook wiring **first** and
releases. `dev-r3f-render` then consumes the seam and owns `src/render/**` only. The two
lanes never edit the same file. The single coupling point is the `useGameLoop` signature
(one new **optional** param) + two exported seam types — all authored by `dev-gameplay`.

---

## 2. The seam (the only cross-lane contract)

### 2.1 `ImpactEvent` — pure game type (owned by `dev-gameplay`)

Lives in `src/game/types/feedback.ts` (alongside `HitEvent` / `PointHitEvent`; pure data,
zero React/Three). Produced by `resolvePlayerShot`, carried transiently on `GameState`,
drained by the bridge.

```ts
import type { Vec2 } from "@game/types/vector";

// One resolved player shot, surfaced for transient render effects (explosion,
// optional tracer, wall mark). Cosmetic-only: carries facts, no rule. At most
// one per tick. Consumed per-frame by the hooks bridge — never persisted.
export interface ImpactEvent {
  readonly classification: "hit" | "miss";
  // World point the shot struck (IMPACT_POINT). Wall-mark anchor for BOTH
  // hit and miss; explosion anchor on a MISS. From crosshairToWorld at fire time.
  readonly impactPoint: Vec2;
  // Present only when classification === "hit". slotPosition is the struck
  // slot's screenPosition (a fact the game already holds); render anchors the
  // HIT explosion at slotPosition.y − TARGET_BASE_DROP (drop is a RENDER const).
  readonly hit?: {
    readonly enemyId: number;
    readonly slotIndex: number;
    readonly slotPosition: Vec2;
  };
}
```

Units: world units (same space as `slot.screenPosition`, `crosshairToWorld`). `impactPoint`
already includes the camera pan offsets (it is the output of `crosshairToWorld`).

### 2.2 `GameState.impactEvents` — transient per-tick field (owned by `dev-gameplay`)

Add to `src/game/types/gameState.ts`, mirroring `feedback?` / `pointFeedback?`:

```ts
  // Player-shot impacts from the latest tick (transient; drives render effects
  // — explosion, tracer, wall marks). 0 or 1 element (one shot per tick).
  readonly impactEvents?: readonly ImpactEvent[];
```

Semantics: identical to `feedback` — set on every tick, read once by the bridge in the same
frame, never carried forward. Empty/absent when the player did not fire.

### 2.3 `ImpactChannel` — bridge↔render transport (owned by `dev-gameplay`)

Defined and exported from `src/hooks/useGameLoop.ts` (like `MobileControls`). Carries the
per-frame event queue **and** the level-scope reset signal in one ref, so render clears its
persistent FIFO deterministically.

```ts
import type { ImpactEvent } from "@game/types/feedback";

export interface ImpactChannel {
  // Per-frame queue: the bridge pushes each tick's impactEvents; the effects
  // component splices it empty each frame (single consumer, like Floater[]).
  readonly queue: ImpactEvent[];
  // Monotonic; the bridge bumps it on every createInitialState (mount + restart).
  // The effects component clears its wall-mark FIFO + transient pools when it
  // sees this change. This is how "cleared on level restart" (spec D4.3) lands.
  resetNonce: number;
}
```

**Bridge wiring (`useGameLoop`):** new **optional** trailing param
`impactChannelRef?: React.RefObject<ImpactChannel>`.

- On each `createInitialState` call (initial `useRef` is fine to leave at nonce 0; the
  restart branch at `useGameLoop.ts:156-165`): if `impactChannelRef?.current` exists,
  `impactChannelRef.current.resetNonce += 1`.
- After the tick, drain like `feedback`: if `next.impactEvents` and the channel exists,
  `for (const ev of next.impactEvents) impactChannelRef.current.queue.push(ev)`.

`GameScene.tsx` (render lane) creates the ref
(`useRef<ImpactChannel>({ queue: [], resetNonce: 0 })`) and passes it to both `useGameLoop`
and the new `<ImpactEffects>` component — exactly the `feedbackRef` → `useGameLoop` +
`<FeedbackLayer>` pattern already in the file.

---

## 3. Pure resolver contract (`dev-gameplay`)

In `src/game/systems/bulletSystem.ts`:

```ts
export interface PlayerShotResult {
  readonly enemies: readonly Enemy[]; // enemies after the (0-or-1) hit
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  readonly targetsDown: number;
  readonly events: readonly HitEvent[]; // takedown floaters — UNCHANGED semantics
  readonly impact: ImpactEvent; // exactly one per shot (hit or miss)
}

export function resolvePlayerShot(
  crosshair: Crosshair,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  cameraOffsetX?: number,
  cameraOffsetY?: number,
  viewW?: number,
  viewH?: number,
): PlayerShotResult;
```

Algorithm (all rules from spec §1):

1. `impactPoint = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH)`.
2. Candidate = enemy with `state ∉ {DEAD, HIT, HIDDEN}`, whose `facade.slots[slotIndex]`
   exists, with `distance(impactPoint, slot.screenPosition) ≤ HIT_RADIUS`.
3. **Nearest wins**: pick the smallest distance; tie on exactly-equal distance → **lowest
   `slotIndex`** (D1.5). At most one enemy hit.
4. On a hit: `hitEnemy(enemy)` (existing — `hp-1`, state `HIT`). Reward deltas land **only
   when `hp-1 <= 0`**, using the exact same `ARCHETYPES[kind]` deltas and pushing the exact
   same `HitEvent` shape as today (byte-identical to the removed `checkBulletHits`). Emit
   `impact = { classification: "hit", impactPoint, hit: { enemyId, slotIndex, slotPosition:
slot.screenPosition } }`.
5. On a miss: no enemy/score/lives/time change; emit
   `impact = { classification: "miss", impactPoint }`; `enemies` returned unchanged.

`HIT_RADIUS = 0.8` stays the **only** cosmetic-adjacent constant in `src/game` (it is a rule
— the hit disc). Everything else visual is render.

**Removed (orphaned by this change, both player-only):** `fireBullet`, `checkBulletHits`,
the `HitResult` interface. **Kept:** `tickBullets`, `BULLET_SPEED` (enemy bullets still
travel), `Bullet` type.

### 3.1 `stateMachine.tickGameState` wiring

- **Step 4 (player fire):** replace the `fireBullet(...)` push. On `fire`, call
  `resolvePlayerShot(crosshair, activeEnemies, facade, cameraOffsetX, cameraOffsetY, viewW,
viewH)` → `shot`. Do **not** add anything to `bullets`. Carry `shot` forward. On no fire,
  synthesize a zero result (`enemies: activeEnemies`, all deltas 0, `events: []`,
  `impactEvents: []`).
- **Enemy fire (step 5):** UNCHANGED — reads `state.enemies` / `activeEnemies` exactly as
  today. It does not read the player-hit result, so a same-tick player kill does **not**
  suppress the enemy telegraph shot (preserves today's enemy-fire cadence — spec §6).
- **Step 6 `tickBullets`:** UNCHANGED (now only ever advances enemy bullets).
- **Step 7:** remove `checkBulletHits`. Everywhere the old `hitResult` was consumed
  (`scoreDelta`, `livesDelta`, `timeDelta`, `targetsDown`, `events` → `feedback`, and
  `enemies`), use `shot` instead. `hitResult.bullets` is gone — `courierBullets` now starts
  from `movedBullets` (all enemy bullets), not `hitResult.bullets`.
- **Returns (all three exit points):** add `impactEvents: shot.impact ? [shot.impact] : []`
  (or `[]` when no fire) alongside `feedback` / `pointFeedback`.

Order rationale: `activeEnemies` (post enemy-tick, pre-hit) is the snapshot both the player
resolver and the enemy-fire step read, matching today. The player-hit result becomes the
enemy set carried forward.

---

## 4. Tuning constants — owning layer (transcribed from spec §5)

| Constant              | Value | Owner layer                     | File                                        |
| --------------------- | ----- | ------------------------------- | ------------------------------------------- |
| `HIT_RADIUS`          | 0.8   | **game** (rule — hit disc)      | `src/game/systems/bulletSystem.ts` (exists) |
| `EXPLOSION_DURATION`  | 250ms | render                          | `src/render/effects/**`                     |
| `EXPLOSION_SIZE_HIT`  | 1.4   | render (world diam)             | `src/render/effects/**`                     |
| `EXPLOSION_SIZE_MISS` | 0.9   | render (world diam)             | `src/render/effects/**` (0.7→0.9 per D3.5)  |
| `TARGET_BASE_DROP`    | 0.45  | render (hit explosion drop)     | `src/render/effects/**`                     |
| `TRACER_DURATION`     | 50ms  | render                          | **DROPPED** at composite gate (D2.4)        |
| `TRACER_WIDTH`        | 0.06  | render (world)                  | **DROPPED** at composite gate (D2.4)        |
| `MUZZLE_ORIGIN_Y`     | −6\*  | render — **DERIVE** (see below) | **DROPPED** with the tracer (D2.4)          |
| `WALL_MARK_CAP`       | 16    | render (FIFO bound)             | `src/render/effects/**`                     |
| `WALL_MARK_SIZE`      | 0.35  | render (world diam)             | `src/render/effects/**`                     |

\* **Non-blocking note (2) — do NOT hardcode −6.** If the tracer ships, derive the muzzle
origin Y from the live viewport: `muzzleY = camera.position.y − viewH/2` where
`viewH = size.height / camera.zoom` (read via `useThree` inside the effects component). −6 is
the spec's illustrative value at the default framing only; hardcoding it breaks under
vertical pan.

---

## 5. Lane briefs

### Lane A — `dev-gameplay` (owns `src/game/**` + `src/hooks/useGameLoop.ts`; TDD)

**Runs FIRST and releases the seam (R1).** Files:

- **CREATE / MODIFY tests** `src/game/systems/__tests__/bulletSystem.test.ts`:
  - Remove the `fireBullet` and `checkBulletHits` describe blocks.
  - Keep the `crosshairToWorld` and `tickBullets` blocks (tickBullets stays).
  - Add `resolvePlayerShot` TDD suite:
    - aim-on-enemy (within 0.8 of a live slot) ⇒ hit; `impact.classification === "hit"`,
      `impact.hit.slotIndex`/`enemyId`/`slotPosition` correct; enemy state → `HIT`.
    - aim-off, **including a live enemy directly above the aim point beyond 0.8** ⇒ miss;
      `classification === "miss"`, no `hit`, enemies unchanged (AC2 / A2).
    - two live enemies both within 0.8 ⇒ **nearest** hit; exact-tie ⇒ **lowest `slotIndex`**
      (D1.5). Assert only one enemy transitions to `HIT` (the one-shot-one-enemy delta).
    - `DEAD`/`HIT`/`HIDDEN` never hit (D1.4).
    - reward parity: a takedown yields the same `scoreDelta`/`livesDelta`/`timeDelta`/
      `targetsDown` and the same `HitEvent` as the old `checkBulletHits` did (AC5).
    - multi-`hp` (riot) non-lethal hit ⇒ `impact` present, `hp` decremented, **no** reward
      deltas, **no** `HitEvent` (spec D1.6 / D3.1 independence).
- **MODIFY** `src/game/types/feedback.ts`: add `ImpactEvent` (§2.1).
- **MODIFY** `src/game/types/gameState.ts`: add `impactEvents?` (§2.2).
- **MODIFY** `src/game/systems/bulletSystem.ts`: add `PlayerShotResult` + `resolvePlayerShot`
  (§3); remove `fireBullet`, `checkBulletHits`, `HitResult`; keep `tickBullets`,
  `BULLET_SPEED`.
- **MODIFY** `src/game/systems/stateMachine.ts`: rewire per §3.1 (import `resolvePlayerShot`,
  drop `fireBullet`/`checkBulletHits` imports; keep `tickBullets`, `BULLET_SPEED`; add
  `impactEvents` to all return points).
  - Add / update a `stateMachine` test: firing adds **no** player bullet to `state.bullets`
    (AC1), and `next.impactEvents` has length 1 on fire, 0 otherwise.
- **MODIFY** `src/hooks/useGameLoop.ts`: export `ImpactChannel` (§2.3); add optional trailing
  param `impactChannelRef?`; bump `resetNonce` in the restart branch; drain
  `next.impactEvents` into `impactChannelRef.current.queue` next to the existing `feedback`
  drain. **Do not** touch render files.

**Honor:** boundary law (no React/Three in `src/game`); reward math byte-identical; enemy
fire path untouched. **Verify:** `rtk tsc` + `rtk vitest` + `rtk lint` green before release.

### Lane B — `dev-r3f-render` (owns `src/render/**` only; consumes the seam)

**Starts after Lane A releases `ImpactEvent` + `ImpactChannel` + the `useGameLoop`
signature.** Files:

- **CREATE** `src/render/effects/ImpactEffects.tsx` — single consumer of the `ImpactChannel`
  (mirror the `FeedbackLayer` pooled-mesh pattern). Responsibilities:
  - Each frame: if `channel.resetNonce !== lastSeen` → clear the wall-mark FIFO + transient
    explosion/tracer pools, store `lastSeen` (spec D4.3 level-scope clear).
  - Splice `channel.queue`; for each `ImpactEvent`:
    - **Explosion (required, spec §3):** spawn one 250ms burst. HIT → size
      `EXPLOSION_SIZE_HIT` at `(hit.slotPosition.x, hit.slotPosition.y − TARGET_BASE_DROP)`.
      MISS → size `EXPLOSION_SIZE_MISS` at `impactPoint`.
    - **Wall mark (required, spec §4):** push a `WALL_MARK_SIZE` decal at `impactPoint` into
      a FIFO; past `WALL_MARK_CAP = 16` evict the oldest. Non-glowing, inert (loi du glow).
    - **Tracer (optional, spec §2, droppable at art gate):** static segment
      `impactPoint → (impactPoint.x, muzzleY)` where `muzzleY = camera.position.y − viewH/2`
      (note 2), width `TRACER_WIDTH`, life `TRACER_DURATION`, opacity-fade only, never
      animate endpoints.
  - Transcribe all render constants from §4 into this file (or a local `constants.ts` in
    `effects/`).
- **MODIFY** `src/render/scene/GameScene.tsx`: create
  `const impactChannelRef = useRef<ImpactChannel>({ queue: [], resetNonce: 0 })`; pass it as
  the new `useGameLoop` arg and to `<ImpactEffects channelRef={impactChannelRef} />` (add the
  element near `<FeedbackLayer>`). Import `ImpactChannel` from `@hooks/useGameLoop`.
- **MODIFY** `src/render/scene/BulletSprite.tsx`: remove the now-dead player-bullet path
  (the `bullet_player.png` `TextureLoader` `useEffect`, `playerTexRef`, and the
  `bullet.fromPlayer` texture branch). Player bullets no longer exist in `state.bullets`;
  render enemy bullets only. Surgical orphan removal (Karpathy §3) — do not restyle the rest.

**Honor:** no game rule in render (read the queue, do not re-resolve hits); hit vs miss must
read at a glance (explosion size, spec D3.2); marks inert/non-glowing (D4.4). **Verify:**
`/verify` in-browser for AC3 (impact effect), AC4 (marks appear on hit+miss, cap holds,
cleared on restart); composite/art gate for the runtime look.

---

## 6. Parallel-safety verdict

**PARALLEL-SAFE with an ordering constraint (R1).** File sets are disjoint:
Lane A = `src/game/**` + `src/hooks/useGameLoop.ts`; Lane B = `src/render/scene/GameScene.tsx`,
`src/render/scene/BulletSprite.tsx`, `src/render/effects/ImpactEffects.tsx`. The only coupling
is the seam (`ImpactEvent`, `ImpactChannel`, the `useGameLoop` signature), all authored by
Lane A. Lane A lands and releases the seam first (types compile standalone; the new
`useGameLoop` param is optional so nothing breaks before Lane B wires it); Lane B then
consumes. No shared file is edited by both lanes → no serialization needed beyond R1.

## 7. Routed non-blocking notes (from the design gate)

1. **QA (behavioural delta):** one shot now downs **at most one** enemy (nearest wins, D1.5).
   Today a travelling bullet could down multiple overlapping enemies. `qa-lead` regression
   must expect this — asserted in Lane A's nearest-wins test and in the e2e overlap case.
2. **Tracer muzzle origin:** derive `camera.position.y − viewH/2`, never hardcode −6 (§4).
   Owned by Lane B.
3. **Playtest watch:** explosion anchor (hit → slot base) vs wall mark (→ `impactPoint`)
   diverge at the disc edge — expected by design (D3.4/D4.1). `game-designer` playtest to
   confirm the divergence reads as intentional, not as a bug, at the 0.8 boundary.
