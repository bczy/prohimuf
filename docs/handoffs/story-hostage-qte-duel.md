# Handoffs — Hostage QTE rework: "Le duel de la porte cochère" (ADR-0034)

Encodes **ADR-0034** (ACCEPTED, F1 tableau vivant + F2 règle du tir) and the `QteSpec`
tuning fields from **ADR-0035** (ACCEPTED, F3 per-level curve). No new ADR — see
"ADR note" below for the in-intent clarifications this contract locks.

## 3. HOW — senior-architect (Winston) — 2026-07-17

- claim: freeze the `src/game/types/hostageQte.ts` code contract that both dev lanes build
  against, assign non-overlapping lanes, and pin the safety invariants + tie-break rule.
- release: FROZEN interface below + lane plan + invariants. Contract is frozen FIRST
  (dev-gameplay writes the types file, no logic), then both lanes fan out in parallel.

### Frozen type surface — `src/game/types/hostageQte.ts`

This is the boundary. Field names/types below are LAW; both lanes code against them. Types
only — zero React/Three, zero functions (rules live in `qteSystem.ts`).

```ts
import type { Vec2 } from "@game/types/vector";

/** Top-level life-cycle. Forward-only: ZOOMING → ACTIVE → (WON | LOST) → DONE.
 *  DONE persists so the QTE fires exactly once per level. (KEPT from ADR-0030.) */
export type QtePhase = "ZOOMING" | "ACTIVE" | "WON" | "LOST" | "DONE";

/** Captor sub-state during ACTIVE (ADR-0034 D2). COVERED = dragging the hostage as a
 *  human shield, NOT shootable (no valid kill zone); PEEKING = brief telegraphed head
 *  exposure AND the captor's own shot (D3: the opening IS the danger window). */
export type CaptorStance = "COVERED" | "PEEKING";

/** What a shot resolves to (ADR-0034 D4/D6). "head" is returned ONLY while PEEKING; the
 *  classifier is stance-aware so head-during-peek is the sole kill route by construction,
 *  and the head band is spatially disjoint from the hostage band (G6). */
export type QteZone = "head" | "body" | "hostage" | "miss";

/** Authored per-level QTE data (`LevelConfig.hostageQte`). Deterministic, no randomness.
 *  Belliard-first (ADR-0035 D3); absent ⇒ no QTE, level stays byte-for-byte deterministic. */
export interface QteSpec {
  /** When the level's elapsed seconds cross this, the QTE fires (once). (KEPT.) */
  readonly triggerAtElapsedSeconds: number;
  /** Progressive-zoom duration, seconds; the "OTAGE" banner shows during it. (KEPT, D5.) */
  readonly zoomSeconds: number;
  /** Captor START world position (same space as bullets/crosshair). Live pos moves from here. */
  readonly anchor: Vec2;
  /** Porte-cochère world target. Captor reaching it = spatial fail → LOST (ADR-0034 D1). */
  readonly porteCochere: Vec2;
  /** Retreat speed, world units/s toward the door — the SOLE clock (ADR-0035 D1). */
  readonly retreatSpeed: number;
  /** COVERED interval between peeks, seconds (ADR-0035 D1). Must be ≥ TELEGRAPH_LEAD_SECONDS. */
  readonly peekCadenceSeconds: number;
  /** Authored PEEKING exposure, seconds (ADR-0035 D1). Clamped up to PEEK_MIN_SECONDS (G5). */
  readonly peekDurationSeconds: number;
}

/** Runtime state of the (single) QTE — a small live one-actor simulation while the rest of
 *  the scene is frozen. `null` until triggered; then persists through DONE. */
export interface HostageQte {
  readonly phase: QtePhase;
  /** Captor sub-state (ADR-0034 D2). Only meaningful during ACTIVE; COVERED otherwise. */
  readonly stance: CaptorStance;
  /** True during the last TELEGRAPH_LEAD_SECONDS of COVERED before a peek — the G4 tell.
   *  Structural (not an authored flag): the tick sets it so render can draw the pre-peek cue. */
  readonly telegraphActive: boolean;
  /** Seconds left in the current stance segment (COVERED: time-to-next-peek; PEEKING:
   *  exposure remaining). Drives the COVERED↔PEEKING sub-machine. */
  readonly stanceRemaining: number;
  /** LIVE captor position — the MOVING anchor (ADR-0034 D6), advanced each tick toward the
   *  door. Render draws the tableau here; the camera FOLLOWS it. */
  readonly anchor: Vec2;
  /** Retreat kinematics — the reused Courier {x,y,dir,speed} model (ADR-0034 D1). */
  readonly dir: 1 | -1;
  readonly speed: number;
  /** The porte-cochère world target (copied from spec): the spatial-fail point and the
   *  door render/camera-goal. Distance anchor→porteCochere is the diegetic timer (D1). */
  readonly porteCochere: Vec2;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. (KEPT.) */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Brief hold in WON/LOST before DONE so the verdict reads on screen. (KEPT, D6.) */
  readonly resultRemaining: number;
  /** The "OTAGE" warning is shown (true during ZOOMING). (KEPT, D6.) */
  readonly warning: boolean;
}
```

**REMOVED (per D6):** `QteBodyPart`, `captorHp`/`captorHpMax`, `windowSeconds`/
`windowRemaining`, `hostageHp`/`hostageHpMax`, `bonusScore`/`bonusEnergy` on `QteSpec`.
**ADDED:** `CaptorStance`, `stance`/`telegraphActive`/`stanceRemaining`, the moving
`anchor` + `dir`/`speed`, `porteCochere` (spec+runtime), and the stance-aware `QteZone`.
**KEPT:** scripted trigger, forward-only phase machine, WON/LOST hold, `anchor`, `warning`.

### `qteSystem.ts` contract deltas (dev-gameplay)

- **Classifier — FROZEN signature:** `qteZoneAt(dx: number, dy: number, stance: CaptorStance): QteZone`.
  Returns `"head"` ONLY when `stance === "PEEKING"`, in a band spatially disjoint from the
  `"hostage"` band (G6). COVERED ⇒ head band is closed (→ `"body"`/`"miss"`). Offsets are
  anchor-relative, so G6 holds under the moving tableau.
- **`QteTickResult` loses `scoreDelta`** — energy is the sole currency (D5). Only
  `{ qte, energyDelta }` remains. The `stateMachine` call site drops its `score:` fold.
- **Energy prices become system constants** (defaults, tunable — not per-level knobs, so
  they leave `QteSpec`): `RESCUE_REFILL` (WON, big +), `BODY_DRAIN` (small −),
  `HOSTAGE_PENALTY` (heavy −), `PANIC_PENALTY` (fire during ZOOMING, −),
  `UNANSWERED_PEEK_DRAIN` (−, charged ONCE per closed exposure). No passive per-second drain (D5).
- **`tickQte` ACTIVE** now: advance the moving anchor (`dir*speed*delta`); run the
  COVERED↔PEEKING sub-machine off `stanceRemaining`/cadence/duration; set `telegraphActive`;
  resolve `fire` via the stance-aware classifier (head→WON, body→drain, hostage→penalty);
  charge counter-fire once on a PEEKING→COVERED close that stayed ACTIVE (unanswered peek);
  LOST when the anchor reaches `porteCochere`.
- **`tickQte` ZOOMING** now charges `PANIC_PENALTY` on `fire` (D4).
- **Removed:** `CAPTOR_HP_MAX`, `HOSTAGE_HP_MAX`, `PART_DAMAGE`, `QTE_WINDOW_SECONDS`,
  `QTE_TIMEOUT_PENALTY`, the timeout-loss branch, `damageForPart`.

### Safety invariants — assert IN CODE, not trusted from data

- **G5 exposure floor:** `PEEK_MIN_SECONDS = 0.5`. Clamp the runtime exposure
  `max(PEEK_MIN_SECONDS, spec.peekDurationSeconds)` before it reaches the tick. Assert
  against the RUNTIME value the tick uses (ADR-0035 gotcha), not just the authored field.
- **G4 telegraph:** `TELEGRAPH_LEAD_SECONDS = 0.35`, structural to the COVERED→PEEKING
  transition (never an authored flag). Assert `peekCadenceSeconds ≥ TELEGRAPH_LEAD_SECONDS`
  so a tell always fits before every peek.
- **G6 spatial separation:** unit-test `qteZoneAt` — no `(dx,dy)` maps to both `head` and
  `hostage`, with a non-zero gap between the bands. Assert directly, not via draw order.
- **Unanswered-peek charge-once:** structural — the drain fires only on the
  PEEKING→COVERED transition tick while phase stays ACTIVE (mirrors the existing forward-only
  once-only pattern). Never per-tick during the exposure.
- **Deterministic tie-break:** resolve `fire` BEFORE the spatial-fail check. A same-tick
  winning head-shot beats the anchor reaching the door → WON (mirrors ADR-0030
  kill-vs-timeout precedent).

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                       | Against the frozen contract                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts`, `src/game/systems/qteSystem.ts`, `src/game/systems/stateMachine.ts` (QTE block ~L133–160 + drop the `score:` fold), `src/game/levels/levels.ts` (belliard `QteSpec`), `src/game/systems/__tests__/` | writes the pure contract + rules + invariant tests                    |
| **dev-r3f-render** | `src/render/scene/HostageQteSprite.tsx`, `src/render/scene/qteCamera.ts`, `src/render/scene/hostageCue.ts`, `src/render/ui/HUD.tsx` (+ its `HudHostageQte` slice), **`src/hooks/useGameLoop.ts`** (zoom driver ~L274–310)           | reads `HostageQte`, draws the moving tableau, camera FOLLOWS `anchor` |

**No shared-file contention.** `tickQte` is called inside `stateMachine.ts` (game lane);
`useGameLoop.ts` only _reads_ `gameStateRef.current.qte` for the camera (render lane) — the
two files never both get written. `isQteActive(qte)` signature is unchanged; the camera
follows the moving anchor largely for free because `qtePose(base, qte.anchor, p)` re-reads
the live anchor each frame (ACTIVE pin `p=1` → `camera.x = anchor.x`). Render's real job:
keep the follow smooth and restore base framing EXACTLY on DONE across the mobile-pan /
edge-scroll writers.

**Sequencing:** (1) dev-gameplay lands the FROZEN types file first (interface only, no
logic) → handoff. (2) Then both lanes fan out in parallel as concurrent Task calls on the
non-overlapping paths above. `HudHostageQte` (render-owned, in `HUD.tsx`) mirrors the new
runtime fields — render updates it once the types are frozen.

**Art = deferred CI art-lane dependency.** New drag / covered / peeking-with-gun-raised
sprites ship via the CI art lane (levelArt.json / dev-tooling-assets). The render lane MUST
NOT block on them: keep the `resolveEnemyTexture("hostage_taker", …)` cop fallback (per
ADR-0030/0034) behind a stance→texture-key indirection so landing the real art is a data
swap. The cop fallback will read wrong for a _moving_ captor — acceptable placeholder;
flag to lead-art.

### ADR note — no new ADR

ADR-0034 (F1/F2) + ADR-0035 (`QteSpec` tuning fields) fully cover this. Three encodings this
contract locks are clarifications WITHIN that intent, not new decisions — flagged for
pm/producer confirmation, reversible if Bertrand disagrees:

1. **`hostageHp` removed** — D4 makes the duel binary (headshot-or-nothing) and hostage-hit
   a flat heavy energy penalty, not a death/loss route; D5 makes energy the only currency.
   The sole LOST route is the spatial fail (door).
2. **`scoreDelta` removed from the QTE** — D5: "score is not the stake"; energy is the single
   currency. The ADR-0030 D4 rule (rescue never advances the kill quota) still holds.
3. **Energy prices are system constants, not `QteSpec` fields** — they are economy/anti-
   frustration invariants, not the per-level difficulty knobs ADR-0035 enumerates
   (retreat speed / peek cadence / peek duration). `bonusScore`/`bonusEnergy` leave `QteSpec`.

## 4. DEV (render lane) — dev-r3f-render (Amelia) — 2026-07-17

- claim: implement the RENDER + view-hook side of ADR-0034 F1+F2 against the FROZEN
  `hostageQte.ts` contract — moving-tableau draw, following camera, discrete peek tell,
  HUD gauge removal, reduced-motion a11y. No `src/game/**` touched.
- release: File List below. Verified by manual type/field review against the frozen
  contract (local toolchain unavailable — no `node_modules`, corepack/yarn download is
  proxy-blocked, so `tsc`/`vitest`/`lint` could not be run here; final integrated run is
  at merge, per architect note).

### File List (render + view-hook lane only)

- `src/hooks/useGameLoop.ts` — zoom driver now FOLLOWS the moving `qte.anchor`; framing
  target biased toward the door via `qteFollowTarget` so the diegetic captor→door clock
  stays in-frame (UX D1.4). Restore path unchanged ⇒ exact base-framing restore on DONE
  preserved; pinch/edge-scroll `isQteActive` gating unchanged.
- `src/render/scene/qteCamera.ts` — added `qteFollowTarget(anchor, porteCochere)` +
  `QTE_DOOR_LEAD` / `QTE_DOOR_LEAD_MAX`. `qteZoomInProgress` / `qtePose` unchanged
  (ACTIVE/WON/LOST still pinned at progress=1 while the camera pans with the anchor).
- `src/render/scene/HostageQteSprite.tsx` — draws the MOVING tableau at `qte.anchor`
  (captor + dragged hostage + peek cue). COVERED↔PEEKING by FORM (peek cue absent/present)
  keyed off `stance`; pre-peek tell keyed off `telegraphActive` (anticipation). Removed all
  `captorHp`/`hostageHp`/`window*` reads. Stance→texture indirection (`resolveCaptorTexture`)
  keeps the cop fallback behind a key so real drag/covered/peeking art is a later data swap.
- `src/render/scene/hostageCue.ts` — removed the `windowRemaining`-driven `hostageTension`
  ramp + `hostageColor`; added discrete `peekTellVisual` (step-change NOW, motion/shape
  carried, colour never sole), `captorTint`, `hostageAlarmColor` (steady under reduced
  motion). `energyFloater` kept (still used by `useGameLoop`).
- `src/render/ui/HUD.tsx` — removed the `preneur` (captor-HP), `compte à rebours`
  (countdown) gauges and the `otage ♥` pip row; `HudHostageQte` slimmed to `{ phase,
warning }`. Kept OTAGE banner + WON/LOST verdict + dim wash.
- `src/render/scene/__tests__/hostageCue.test.ts`,
  `src/render/scene/__tests__/qteCamera.test.ts` — rewritten/extended for the new API.

### Contract gaps flagged to dev-gameplay / senior-architect

- **No hostage-hit signal on `HostageQte`.** UX spec D3.4 wants the localised in-world
  "you hit HER" white flash KEPT, but the frozen contract exposes no per-shot outcome
  (no `hostageHp`, no `lastShotZone`/`hostageHitNonce`, and the frozen tick emits no
  feedback events). I dropped the white flash cleanly. To restore D3.4, the gameplay lane
  would need a transient hostage-hit signal (nonce or last-resolved-`QteZone`) on the
  runtime record, or a QTE feedback event surfaced through the frozen-tick path.
- **Head-zone vs visible-head alignment (G6 / UX D3.2) not yet reconcilable.** I placed the
  peek cue front-left of the captor (anchor + (−0.5, +0.7)), clear of the hostage
  (anchor + (+0.32, −0.3)). The new stance-aware `qteZoneAt` head band coords live in the
  gameplay lane; the visible-head-vs-hit-zone match must be reconciled at the composite
  gate against the real peeking art (ADR-0034 Gotchas). Constants are placeholders.
- **Art dependency (lead-art):** cop fallback reads wrong for a MOVING captor; drag /
  covered / peeking-with-gun-raised sprites land later via CI, swapped in at
  `resolveCaptorTexture`.
