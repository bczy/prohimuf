import type { Vec2 } from "@game/types/vector";

/**
 * Boss QTE encounter — "le Commandant" (ADR-0051). A cinematic capstone duel that
 * REUSES the ADR-0030/0034 shell SHAPE (freeze + progressive zoom + forward-only phase
 * machine + the spatial-colour wandering ring + the seeded-pure determinism law), but is
 * a SEPARATE, additive system (ADR-0051 D1) — it does NOT modify the frozen, shipped
 * hostage QTE (`hostageQte.ts` / `qteSystem.ts`).
 *
 * The boss is the terminal beat on `Livrer` (ADR-0051 D3): it triggers when the kill
 * quota is reached, REPLACING the abrupt "quota met → LEVEL_COMPLETE" with a required
 * duel. He alternates `SHIELDED` (behind cover, unshootable, not firing) and brief,
 * telegraphed `EXPOSED` windows — the SOLE shootable moment is the SOLE dangerous one.
 * Shooting the wandering ring while `EXPOSED` chips his `bossHp` by the anatomy colour
 * under the ring (`vital` 2 / `limb` 1 / `off` 0); depleting `bossHp` WINS. Crossing an
 * HP phase threshold triggers a damage-free, telegraphed PHASE BREAK (an `ACTIVE`
 * sub-state) that re-parameterises the window per phase (the fight tightens). The loss
 * clock is the blown-window count (`maxBlownWindows`): an `EXPOSED` that CLOSES having
 * chipped 0 HP is "blown" — reaching the cap fails the level.
 *
 * There is NO human shield (the hostage G6 clamp DROPS): the ring roams the full boss
 * anatomy freely. Energy is the outcome currency. Types only: zero React/Three, zero
 * functions (the `types/` law) — the rules live in `bossQteSystem.ts`.
 */

/**
 * Life-cycle of the boss QTE. Strictly forward-only:
 * `ZOOMING → ACTIVE → FINISHER → WON → DONE` (or `ACTIVE → LOST → DONE`).
 *
 * ADR-0052 D3 (lever 5) inserts a new TOP-LEVEL `FINISHER` node between `ACTIVE` and `WON`
 * — a ceremonial, guaranteed-success, damage-free coup-de-grâce beat that awaits a final
 * `fire` OR a `FINISHER_HOLD_SECONDS` timeout before paying `QTE_BOSS_REFILL` on the WON it
 * resolves to. This is the ONE clause ADR-0052 narrows from ADR-0051 D1's "top-level machine
 * byte-shape-identical to the shell"; the isolation / additive-and-optional property is
 * untouched. `isBossQteActive` includes `FINISHER` so the freeze holds through the beat.
 *
 * The PHASE BREAK stays a sub-state of `ACTIVE` (`BossQte.phaseBreakRemaining`), and the
 * parry STAGGER is likewise an `ACTIVE` sub-state (`BossQte.staggerRemaining`) — only the
 * post-combat finisher earns a top-level node (ADR-0052 D3 rationale). `DONE` persists so
 * the encounter resolves exactly once.
 */
export type BossQtePhase = "ZOOMING" | "ACTIVE" | "FINISHER" | "WON" | "LOST" | "DONE";

/**
 * The boss's sub-state during `ACTIVE` (re-theme of the hostage `COVERED ↔ PEEKING`).
 * `SHIELDED`: behind cover / riot shield — not shootable, not firing; telegraphs the
 * next window. `EXPOSED`: he opens fire on the courier and drops cover — the sole
 * shootable moment and the sole dangerous one (the ADR-0034 D3 fusion). During a phase
 * break the stance is forced `SHIELDED` (with `phaseBreakRemaining > 0`).
 */
export type BossStance = "SHIELDED" | "EXPOSED";

/**
 * The boss anatomy under the wandering reticle ring's centre (spatial-colour model,
 * reused from the hostage `RingZone` shape). `vital` = head (a ring hit here chips the
 * most HP → drawn GREEN); `limb` = torso + shoulders (chips less → YELLOW); `off` = arms
 * + legs + empty space (a ring hit does 0 → RED). The GAME owns this semantic zone; the
 * render maps it to a colour — the game never names a colour.
 */
export type BossRingZone = "vital" | "limb" | "off";

/**
 * What a shot that MISSES the reticle ring resolves to. With no human shield there is no
 * `hostage` bavure zone (ADR-0051 D1): `body` is a boss-body hit off the ring (a small
 * energy bleed — spraying the shield / off-ring mass); `miss` is empty space.
 */
export type BossQteZone = "body" | "miss";

/**
 * Authored per-level boss QTE data (`LevelConfig.bossQteSpec`). Deterministic, scripted
 * — no randomness. In V1 the ONLY non-null instance lives on the NON-SHIPPED Belliard
 * dev-harness (ADR-0051 D4); every shipped level authors `null`, so the whole feature is
 * additive-and-optional and the shipped win path is byte-for-byte unchanged.
 *
 * The per-phase escalation table (EXPOSED / lull / telegraph / wander / drain) is a
 * SYSTEM CONSTANT for V1 (`BOSS_PHASE_TABLE` in `bossQteSystem.ts`), NOT authored here —
 * a multi-encounter curve story (the ADR-0035 F3 seam) promotes it to spec fields when a
 * curve needs them. `phaseCount`/`bossHp` are spec fields from day one so a later
 * mini-boss tier (Option C) stays a data-only story. Safety invariants that clamp these
 * are asserted in `createBossQte`, never trusted (ADR-0051 D7).
 */
export interface BossQteSpec {
  /** Progressive-zoom duration, in seconds (the establishing hold). */
  readonly zoomSeconds: number;
  /** Boss world position — a STATIC point the camera zooms onto and holds. */
  readonly anchor: Vec2;
  /**
   * Number of HP phases the boss is sequenced into (default 3 — House of the Dead).
   * The tier lever (mini-boss = 1). Integer ≥ 1 and ≤ `BOSS_PHASE_TABLE.length`,
   * asserted in `createBossQte` (a phase must have an escalation row to run).
   */
  readonly phaseCount: number;
  /**
   * Boss hit points — the kill currency (default 24 = 3 × 8). A ring hit while
   * `EXPOSED` chips this by the ring's zone colour (`vital` 2 / `limb` 1 / `off` 0);
   * reaching 0 WINS. Integer ≥ 1, asserted. Per-phase HP thresholds are DERIVED from
   * `bossHp` + `phaseCount` (`phaseIndexAt`), so the render never re-encodes them.
   */
  readonly bossHp: number;
  /**
   * Number of blown windows (an `EXPOSED` that CLOSES having chipped 0 HP) that fail
   * the level → `LOST`. The sole failure clock (re-key of the hostage `maxBlownPeeks`).
   * Integer ≥ 1, asserted in `createBossQte` — the clock must count.
   */
  readonly maxBlownWindows: number;
  /**
   * Authored seed for the deterministic, replay-safe ring wander. During `EXPOSED` the
   * ring wanders as a PURE function of this seed, the window ordinal and the
   * window-elapsed time — never `Math.random`/`Date.now`. Finite, asserted (C6). The
   * per-phase wander SPEED, amplitudes and leg duration are system constants; only the
   * seed is authored per level (F3 may promote the others later).
   */
  readonly targetSeed: number;
  /**
   * OPTIONAL interactive décor prop (ADR-0052 lever 2). A single authored prop that arms
   * during a SHIELDED lull in `armPhaseIndex` (0-based phase); shooting it while armed
   * drops it on the boss for a fixed `BOSS_DECOR_DAMAGE` burst, single-use, PURE UPSIDE
   * (no failure surface). Absent / `undefined` ⇒ no prop ⇒ byte-behaviour-identical to V1
   * (the additive-and-optional law). `armPhaseIndex` is an integer in `[0, phaseCount − 1]`,
   * `position` is anchor-relative and finite — both asserted in `createBossQte`. Array
   * promotion (multiple props) is the deferred F3 seam.
   */
  readonly decorProp?: { readonly position: Vec2; readonly armPhaseIndex: number };
}

/**
 * Runtime state of the (single) boss QTE, or `null` until triggered / when the level has
 * no boss. What the render lane reads to drive the shared zoom camera (the same
 * `{ anchor, phase, zoomRemaining, zoomSeconds }` field names the hostage exposes, so the
 * camera driver drives it unchanged — ADR-0051 D1), the tableau, the phase posture, the
 * telegraph and the phase-break cue. `null` until triggered; then persists through `DONE`.
 * All fields `readonly` (pure state-in / state-out).
 */
export interface BossQte {
  readonly phase: BossQtePhase;
  /** Boss sub-state during `ACTIVE` (`SHIELDED` while zooming / holding / breaking). */
  readonly stance: BossStance;
  /**
   * The window tell is showing: true during the last `telegraphLeadSeconds` (of the
   * CURRENT phase) of a `SHIELDED` beat, cueing the imminent `EXPOSED`. The render draws
   * the tell. During a phase break the render reads `phaseBreakRemaining > 0` for the
   * distinct, non-text/non-duration break cue instead (ADR-0051 D5).
   */
  readonly telegraphActive: boolean;
  /** Seconds left in the current sub-segment (SHIELDED lull, EXPOSED window, or break). */
  readonly stanceRemaining: number;
  /**
   * Seconds left in the current PHASE BREAK, or 0 when not in a break. While > 0 the
   * stance is forced `SHIELDED`, no window opens/closes, no damage is dealt or taken, and
   * a fire is a PANIC shot (an unreadable frame). The render's dedicated phase-break cue
   * (ADR-0051 D5) keys on this being > 0 — a break is shorter than phase-3's ordinary
   * lull and cannot be told apart by duration, so it needs its own read.
   */
  readonly phaseBreakRemaining: number;
  /**
   * Boss world position — STATIC. Copied once from the spec at `createBossQte` and never
   * mutated; the camera zooms onto it and holds (no follow).
   */
  readonly anchor: Vec2;
  /**
   * Current reticle-RING centre, ANCHOR-RELATIVE — the point the render draws the ring at
   * and that `bossRingZoneAt` classifies for the spatial-colour read. During `EXPOSED`
   * (not breaking) it wanders (seeded, pure, full-anatomy — no G6 clamp); otherwise it
   * rests at `BOSS_WANDER_CENTRE` with the ring forced `off`. In the two-ring phase-2+ mode
   * (ADR-0052 lever 1) this is RING A — the VITAL/tête ring (fixed identity `vital`, 2 HP),
   * wandering the head sub-box; in phase 1 it is the single V1 ring.
   */
  readonly targetOffset: Vec2;
  /**
   * RING B centre, ANCHOR-RELATIVE (ADR-0052 lever 1). The LIMB/corps ring — a FIXED
   * identity (`BOSS_RING_B_ZONE = "limb"`, 1 HP), wandering the torso sub-box on a slower,
   * decorrelated seeded path. LIVE only during a two-ring EXPOSED window (`phaseIndex ≥ 1`,
   * `stance === "EXPOSED"`, not breaking / staggering / charged); otherwise rests at
   * `BOSS_WANDER_CENTRE`. The render derives ring-B liveness from that same condition and
   * draws it with the fixed limb colour. Phase 1 leaves this resting (single-ring V1).
   */
  readonly targetOffsetB: Vec2;
  /**
   * Authored wander seed — the runtime mirror of `BossQteSpec.targetSeed` (copied once at
   * `createBossQte`). The tick has ONLY the runtime record, so it needs the seed here to
   * compute the pure wander offset each `EXPOSED` tick. Finite (asserted, C6).
   */
  readonly targetSeed: number;
  /**
   * The boss anatomy under the ring centre right now — a DERIVED cache
   * (`= bossRingZoneAt(targetOffset)`), recomputed at each ACTIVE tick's end from the
   * last-drawn offset. The render maps it to the ring colour and the tick scores a ring
   * hit against THIS value (colour-honesty). Rests at `"off"` while SHIELDED / zooming /
   * breaking (no chip).
   */
  readonly ringZone: BossRingZone;
  /**
   * Boss hit points remaining (starts = `spec.bossHp`, never < 0). A ring hit while
   * `EXPOSED` chips it by the ring's `ringZone` colour-damage; reaching 0 → WON. The kill
   * currency; `blownWindows` is the LOSS clock. At `DONE`, `bossHp <= 0` ⇔ the boss was
   * defeated (the game layer reads this to decide WIN vs FAIL).
   */
  readonly bossHp: number;
  /**
   * The boss's full HP — the runtime mirror of `BossQteSpec.bossHp` (copied at
   * `createBossQte`). With `phaseCount` it lets the render derive the current phase from
   * `bossHp` via `phaseIndexAt`, so it never re-encodes the HP thresholds (ADR-0051 D5).
   */
  readonly bossHpMax: number;
  /**
   * Number of HP phases — the runtime mirror of `BossQteSpec.phaseCount`. Selects the
   * escalation rows and bounds `phaseIndexAt`.
   */
  readonly phaseCount: number;
  /**
   * The phase index (0-based) currently driving the window escalation. Updated the moment
   * a chip crosses a threshold (== `phaseIndexAt(bossHp, bossHpMax, phaseCount)` after
   * every tick). The render may read this OR derive it from `bossHp` via `phaseIndexAt`.
   */
  readonly phaseIndex: number;
  /**
   * Whether the CURRENT `EXPOSED` window has chipped ≥ 1 HP. Reset to false when a window
   * opens; set true when a chip lands. A window that CLOSES with this false (and the boss
   * still alive) is "blown": it charges the phase drain once and counts toward the loss.
   */
  readonly windowChipped: boolean;
  /**
   * Blown windows so far (an `EXPOSED` closed having chipped 0 HP). Starts 0, +1 per such
   * close. Reaching `maxBlownWindows` loses the encounter. This IS the diegetic clock.
   */
  readonly blownWindows: number;
  /**
   * The blown-window cap that fails the level — the runtime mirror of
   * `BossQteSpec.maxBlownWindows` (copied at `createBossQte`).
   */
  readonly maxBlownWindows: number;
  /**
   * The window ordinal, 0-based — +1 each time an `EXPOSED` opens. Feeds the seeded
   * wander so each window presents a distinct (but deterministic) reticle path.
   */
  readonly windowOrdinal: number;
  /**
   * The 0-based index of the current/most-recent EXPOSED window WITHIN the current phase
   * (ADR-0052 levers 3 & 4). Reset to `-1` on entering a phase (and at ACTIVE start), +1
   * each window open. Drives the deterministic charged-window cadence (`isChargedWindow`)
   * and the renfort surge onset (`isRenfortWindow`). Game-internal; the render reads the
   * derived `chargedWindow` / `renfortActive` flags, not this counter.
   */
  readonly phaseWindowIndex: number;
  /**
   * The current-or-imminent EXPOSED window is a CHARGED / parry window (ADR-0052 lever 3):
   * the boss winds up a heavy shot the player must PARRY by firing on the `BOSS_PARRY_POINT`
   * within `parryWindowSeconds`. Set true during the preceding SHIELDED lull (so the
   * distinct parry telegraph can lead) and for the whole charged window; there are NO rings
   * during a charged window (`ringZone` rests `off`). Phase 1 never charges.
   */
  readonly chargedWindow: boolean;
  /**
   * Seconds left in the parry STAGGER, or 0 when not staggered (ADR-0052 lever 3). A
   * successful parry briefly staggers the boss damage-free (stance forced `SHIELDED`), then
   * — unlike the phase break which re-SHIELDs — opens a BONUS EXPOSED window (the tempo
   * flip). While > 0 no window opens/closes and a `fire` is a PANIC shot.
   */
  readonly staggerRemaining: number;
  /**
   * The décor prop is ARMED and shootable right now (ADR-0052 lever 2): true only during a
   * SHIELDED lull of `decorProp.armPhaseIndex`, before it is consumed. Derived each tick;
   * the render draws the armed glow. `false` for every boss without a `decorProp`.
   */
  readonly decorArmed: boolean;
  /**
   * The décor prop has been spent (ADR-0052 lever 2). Once true it stays true (single-use).
   * `false` for every boss without a `decorProp`.
   */
  readonly decorConsumed: boolean;
  /**
   * The authored décor prop (runtime mirror of `BossQteSpec.decorProp`), or `null` when the
   * boss has none (ADR-0052 lever 2). Carries the anchor-relative `position` the tick
   * hit-tests and the render draws. `null` ⇒ the whole décor path no-ops (additive law).
   */
  readonly decorProp: { readonly position: Vec2; readonly armPhaseIndex: number } | null;
  /**
   * Scripted smoke stretch is active (ADR-0052 lever 2): a phase-3 frenzy flag the render /
   * audio use to degrade — never remove — the visual telegraph. The GAME owns only this
   * boolean and the floor guarantee (the telegraph lead stays ≥ `BOSS_TELEGRAPH_LEAD_FLOOR`
   * — trivially held, the leads are constants ≥ the floor); the degradation look is render.
   */
  readonly smokeActive: boolean;
  /**
   * The in-tableau renfort pressure SURGE is active for the current/imminent window
   * (ADR-0052 lever 4): a telegraphed, seeded, phase-3 stretch during which a BLOWN window
   * drains the heavier `QTE_RENFORT_DRAIN` instead of the phase drain — priced in the SAME
   * energy/window ledger, NEVER a second loss clock. Reads as "pas ses hommes" (frame-edge
   * motion, no shootable body). Derived from `phaseWindowIndex`; the render draws the cue.
   */
  readonly renfortActive: boolean;
  /**
   * Seconds left in the ceremonial FINISHER beat (ADR-0052 lever 5), or 0 outside it. Seeded
   * to `FINISHER_HOLD_SECONDS` when `bossHp` hits 0; a `fire` OR its elapse resolves the
   * beat to `WON`. Damage-free — zero failure surface.
   */
  readonly finisherRemaining: number;
  /**
   * A shield-break (lever 6, spec-boss-shield-break-tempo-shot) is pending its one-shot tempo
   * cut. Set true when a `fire` catches the lowered cover prop's fixed point
   * (`BOSS_SHIELD_POINT`) during a phase-2+ NORMAL EXPOSED window; consumed at the NEXT ordinary
   * SHIELDED lull open, which is shortened by `SHIELD_BREAK_LULL_CUT` (floored strictly above the
   * phase tell so the window telegraph is never swallowed). Non-cumulative — one pending cut at a
   * time (a double-break yields a single 0.5 s cut). Cleared WITHOUT applying on any phase-break /
   * stagger / finisher / LOST transition (the cut never compresses `PHASE_BREAK_SECONDS` or a
   * stagger setup). `false` for a boss never shot on the shield point (the additive-and-optional
   * law — such a run is byte-behaviour-identical to ADR-0052/0053).
   */
  readonly shieldBreakPending: boolean;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Brief hold in WON/LOST before DONE (so the result reads on screen). */
  readonly resultRemaining: number;
  /** The establishing "boss" warning is shown (true during ZOOMING). */
  readonly warning: boolean;
}
