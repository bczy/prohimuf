/**
 * Run statistics — the local-first run report (ADR-0076).
 *
 * Types only — zero functions, zero React/Three (convention `src/game/types/**`).
 * This module is THE contract between the two dev lanes: `dev-gameplay` writes it,
 * `dev-r3f-render` imports it read-only and never edits it (hand-off §4.2).
 *
 * Two data shapes, deliberately (ADR-0076 D1):
 * - `RunStats` — a small monotone accumulator carried INSIDE `GameState`, holding
 *   ONLY what the tick destroys and cannot be recovered later.
 * - `RunSummary` — the presentation-ready record, derived at read time from the
 *   terminal state by `buildRunSummary`.
 */

/**
 * Why the run ended (spec §2.6, ADR-0076 D2). Derived from the terminal state,
 * never accumulated. ASCII-folded uppercase: the export blob must survive any
 * terminal or paste-target encoding; the accented display strings live in ONE
 * lookup in the render lane (gate Q7 — accents are typography, not vocabulary).
 *
 * There is deliberately no `ABANDON`: quitting to the menu produces no end screen
 * and no summary (spec D2.6.3).
 */
export type EndCause = "SANTE" | "TEMPS" | "QUOTA" | "BOSS_GAGNE" | "BOSS_PERDU";

/**
 * Outcome of the scripted delivery (spec D2.2.3). `null` means the level authors
 * no delivery at all — rendered `—`, never `0`.
 *
 * - `REUSSIE` — the window was held (latched at the transition tick).
 * - `PERDUE` — integrity reached 0 before the window ended (latched).
 * - `INTERROMPUE` — the run ended while the vehicle was INCOMING or DELIVERING,
 *   with no latched outcome. Neither a success nor a failure.
 * - `NON_DECLENCHEE` — the run ended before the scripted trigger instant.
 */
export type DeliveryIssue = "REUSSIE" | "PERDUE" | "INTERROMPUE" | "NON_DECLENCHEE";

/**
 * The monotone run accumulator, carried as `GameState.stats` and folded EXACTLY
 * once per tick (ADR-0076 D3). It holds only the irrecoverable:
 * - crate pickups (a crate is consumed by the shot that takes it),
 * - hearts lost split by source (the net `lives` delta is polluted by crate heals),
 * - the starting heart gauge (a reading landmark, not a ceiling on the total),
 * - the latched delivery outcome and its integrity at the latch tick (the vehicle
 *   goes `→ GONE` right after, so the outcome is unreadable from the final state).
 *
 * Everything else lives in `RunSummary`, derived at read time.
 */
export interface RunStats {
  /** Crates picked up this run (spec §2.1.1). */
  readonly pickupsCollected: number;
  /** Crates that entered play this run — the denominator (spec D2.1.2). */
  readonly cratesSpawned: number;
  /** Hearts lost to enemy fire, quarter-heart lattice (ADR-0066). Never decreases. */
  readonly heartsLostToDamage: number;
  /** Hearts lost to civil-courier faults, whole hearts. Never decreases. */
  readonly heartsLostToFaults: number;
  /**
   * The gauge the run STARTED with (player preference, 1..5) — a reading landmark
   * reported alongside the losses, NOT a ceiling on their total: a crate heal can
   * hand hearts back, so exposure may legitimately exceed it (spec D2.3.4).
   */
  readonly heartsAtStart: number;
  /** The latched delivery outcome, written once, never re-written (spec D2.2.2). */
  readonly deliveryOutcome: "SUCCESS" | "FAILED" | null;
  /**
   * Vehicle integrity at the latch tick, `null` while no outcome is latched. The
   * gauge MAXIMUM is not recorded: it is seeded once from the spec and never
   * mutated, so it is still readable from the vehicle at the end of the run.
   */
  readonly deliveryIntegrityAtLatch: number | null;
}

/**
 * The countable facts of ONE tick, passed explicitly to `foldRunStats`. Explicit
 * and structural — never inferred from a cosmetic channel (ADR-0076 D3).
 */
export interface RunStatsTickFacts {
  /** A crate entered play this tick (`lootTick.spawned`). */
  readonly crateSpawned: boolean;
  /** A crate was consumed by a player shot this tick. */
  readonly cratePicked: boolean;
  /** Hearts removed by enemy fire this tick (already invulnerability-gated). */
  readonly damageTaken: number;
  /** Hearts removed by a civil-courier fault this tick (positive magnitude). */
  readonly faultLivesLost: number;
  /**
   * The player's gauge BEFORE this tick's deltas. The tick's contribution is clipped
   * to it (damage first, then the fault) so a 1.0 blow landing on 0.5 heart charges
   * 0.5 — never a loss the player did not take (spec D2.3.4).
   */
  readonly livesBefore: number;
  /** The delivery's terminal transition this tick, or `null`. */
  readonly deliveryOutcome: "SUCCESS" | "FAILED" | null;
  /** Vehicle integrity on that transition tick (ignored when outcome is `null`). */
  readonly deliveryIntegrity: number | null;
}

/** The pickups line of the summary — `null` on a level that authors no crates. */
export interface PickupsSummary {
  readonly collected: number;
  readonly spawned: number;
}

/** The delivery line of the summary — `null` on a level that authors no delivery. */
export interface DeliverySummary {
  readonly issue: DeliveryIssue;
  /**
   * Remaining integrity, integer FLOOR percentage (spec D2.2.4 — 99.6 ⇒ 99, never
   * 100). `null` when the issue carries no meaningful percentage (`PERDUE` is 0 by
   * construction, `NON_DECLENCHEE` has none).
   */
  readonly integrityPct: number | null;
}

/** The damage line of the summary — hearts lost, split by source. */
export interface HeartsLostSummary {
  /** `damage + faults` — total exposure, each tick clipped to the live gauge (D2.3.4). */
  readonly total: number;
  readonly damage: number;
  readonly faults: number;
  /** The STARTING gauge — a reading landmark; `total` may exceed it after a heal. */
  readonly max: number;
}

/**
 * The finished, presentation-ready record of a run, built ONCE at read time by
 * `buildRunSummary(state)` (ADR-0076 D1). Deliberately carries NO `levelId`: level
 * identity is known by the render shell, not by the tick; it is attached at
 * report-build time.
 */
export interface RunSummary {
  /** Final score, exactly as the game holds it (floored at 0 by the tick — C6). */
  readonly score: number;
  /** Effective play time, one decimal (spec D2.4.2). Excludes pauses and QTEs. */
  readonly durationSeconds: number;
  /** Wave reached (non-regression with today's end screen). */
  readonly wave: number;
  /** Why the run ended (spec §2.6). */
  readonly endCause: EndCause;
  /** `null` on a level that authors no crates — rendered `—`, never `0/0`. */
  readonly pickups: PickupsSummary | null;
  /** `null` on a level that authors no delivery. */
  readonly delivery: DeliverySummary | null;
  /** Hearts lost, split by source. */
  readonly heartsLost: HeartsLostSummary;
}

/** The four funnel milestones (ADR-0076 D4). Independent locks, never chained. */
export type Milestone = "titleSeen" | "tutorialCleared" | "firstDeliveryDone" | "belliardCleared";

/**
 * The persisted funnel — an object of INDEPENDENT booleans, never an ordered list
 * (gate ruling D4.3): clearing Belliard without ever seeing a delivery must not
 * erase anything. Each flag can only ever flip `false → true`.
 */
export interface FunnelState {
  readonly titleSeen: boolean;
  readonly tutorialCleared: boolean;
  readonly firstDeliveryDone: boolean;
  readonly belliardCleared: boolean;
}

/** Schema discriminator of the exported blob, so a paste is identifiable alone. */
export const RUN_REPORT_SCHEMA = "muf.run-report";

/**
 * Export schema version. Bumped ONLY on a breaking change (a field removed,
 * renamed, or whose meaning/unit changes); adding an optional field does not
 * bump it (ADR-0076 D5).
 */
export const RUN_REPORT_VERSION = 1;

/**
 * `localStorage` key of the funnel — a fifth, distinct `muf_*` key, never shared
 * with `muf_prefs` / `muf_progress` / `muf_scores_*` / `muf_player_name`
 * (story AC7, gate A2). The I/O itself lives in `src/hooks`, never in `src/game`.
 */
export const FUNNEL_STORAGE_KEY = "muf_funnel";

/**
 * The exported run report (ADR-0076 D5). Structurally free of any stable
 * identifier: its builder's inputs are `RunSummary`, `FunnelState` and `levelId`,
 * none of which can reach `muf_player_name`. No timestamp, no device identifier,
 * no free text.
 */
export interface RunReport {
  readonly schema: typeof RUN_REPORT_SCHEMA;
  readonly version: typeof RUN_REPORT_VERSION;
  readonly level: string;
  readonly end: {
    readonly cause: EndCause;
    readonly wave: number;
  };
  readonly counters: {
    readonly score: number;
    readonly durationSeconds: number;
    readonly pickups: PickupsSummary | null;
    readonly delivery: DeliverySummary | null;
    readonly heartsLost: HeartsLostSummary;
  };
  readonly funnel: FunnelState;
}
