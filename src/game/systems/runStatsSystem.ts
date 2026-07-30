import type { GameState } from "@game/types/gameState";
import type {
  DeliverySummary,
  EndCause,
  PickupsSummary,
  RunStats,
  RunStatsTickFacts,
  RunSummary,
} from "@game/types/runStats";

/**
 * Run statistics — the accumulator and its read-time projection (ADR-0076 D1/D2/D3).
 *
 * Pure: no `Date.now()`, no `Math.random()`, no browser I/O. Every value is a
 * function of the tick facts or of the frozen terminal state, so a run replayed
 * from the same tick sequence produces the same summary (story AC1/AC8).
 */

/** Seed an empty run record. `heartsAtStart` is the player's starting gauge (1..5). */
export function createRunStats(heartsAtStart: number): RunStats {
  return {
    pickupsCollected: 0,
    cratesSpawned: 0,
    heartsLostToDamage: 0,
    heartsLostToFaults: 0,
    heartsAtStart,
    deliveryOutcome: null,
    deliveryIntegrityAtLatch: null,
  };
}

/**
 * Fold ONE tick's facts into the record — called exactly once per tick, right
 * after `newLives` is computed (ADR-0076 D3).
 *
 * Monotone by construction: the facts only ever carry losses (a crate heal moves
 * the player's gauge, never this exposure record — spec D2.3.3), the delivery latch
 * is written once and never re-written (spec D2.2.5), and each tick's contribution
 * is clipped to what the LIVE gauge actually held that tick (spec D2.3.4) so an
 * oversized fatal blow never charges damage the player did not take.
 *
 * There is deliberately NO ceiling on the run total: a crate can hand hearts back,
 * so cumulated exposure may legitimately exceed the starting gauge (`4.5 ♥` on a
 * gauge of 3 is a fact, not a bug — the measure is exposure, not balance).
 */
export function foldRunStats(prev: RunStats, facts: RunStatsTickFacts): RunStats {
  // Room in the gauge AT THIS TICK. Damage is charged first, then the fault, both
  // against the same live gauge — the two can land on the same tick.
  const damage = Math.min(facts.damageTaken, facts.livesBefore);
  const fault = Math.min(facts.faultLivesLost, facts.livesBefore - damage);

  const latching = prev.deliveryOutcome === null && facts.deliveryOutcome !== null;

  return {
    pickupsCollected: prev.pickupsCollected + (facts.cratePicked ? 1 : 0),
    cratesSpawned: prev.cratesSpawned + (facts.crateSpawned ? 1 : 0),
    heartsLostToDamage: prev.heartsLostToDamage + damage,
    heartsLostToFaults: prev.heartsLostToFaults + fault,
    heartsAtStart: prev.heartsAtStart,
    deliveryOutcome: latching ? facts.deliveryOutcome : prev.deliveryOutcome,
    deliveryIntegrityAtLatch: latching ? facts.deliveryIntegrity : prev.deliveryIntegrityAtLatch,
  };
}

/**
 * Why the run ended — a TOTAL function of the terminal state, in the precedence of
 * ADR-0076 D2. Nothing is accumulated for it and the tick has zero touch points:
 * the five branches map one-to-one onto exit branches that already exist.
 */
function deriveEndCause(state: GameState): EndCause {
  if (state.bossQte !== null && state.bossQte.phase === "DONE") {
    return state.bossQte.bossHp <= 0 ? "BOSS_GAGNE" : "BOSS_PERDU";
  }
  if (state.phase === "GAME_OVER") return state.lives <= 0 ? "SANTE" : "TEMPS";
  // The only other terminal phase is LEVEL_COMPLETE, and on a boss-less level the
  // only road to it is the kill quota (no `enemiesToWin` parameter needed).
  return "QUOTA";
}

/** Integer FLOOR percentage (spec D2.2.4 — 99.6 ⇒ 99, never 100). */
function integrityPct(integrity: number, integrityMax: number): number {
  return Math.floor((integrity / integrityMax) * 100);
}

/**
 * The delivery line (spec D2.2.3). The latched outcome wins whenever there is one
 * — the vehicle is `GONE` by the end of the run, so the terminal state cannot tell
 * a success from a failure (spec D2.2.2).
 */
function deriveDelivery(state: GameState): DeliverySummary | null {
  const { deliveryVehicle, stats } = state;
  if (state.deliverySpec === null || deliveryVehicle === null) return null;

  if (stats.deliveryOutcome === "FAILED") return { issue: "PERDUE", integrityPct: null };
  if (stats.deliveryOutcome === "SUCCESS") {
    // `integrityMax` is seeded once and never mutated, so the live vehicle still
    // carries the denominator of the latch tick.
    const integrity = stats.deliveryIntegrityAtLatch ?? 0;
    return {
      issue: "REUSSIE",
      integrityPct: integrityPct(integrity, deliveryVehicle.integrityMax),
    };
  }
  // No latch: either the run ended while the vehicle was on the street (neither a
  // success nor a failure — spec D2.2.5), or it ended before the scripted trigger.
  if (deliveryVehicle.phase === "INCOMING" || deliveryVehicle.phase === "DELIVERING") {
    return {
      issue: "INTERROMPUE",
      integrityPct: integrityPct(deliveryVehicle.integrity, deliveryVehicle.integrityMax),
    };
  }
  return { issue: "NON_DECLENCHEE", integrityPct: null };
}

/** The crates line — `null` on a level that authors none, never `0/0` (AC-8). */
function derivePickups(state: GameState): PickupsSummary | null {
  if (state.lootSpec === null) return null;
  return { collected: state.stats.pickupsCollected, spawned: state.stats.cratesSpawned };
}

/**
 * Build the presentation-ready record from a terminal state — once, at read time.
 * Every presentation rule (rounding, floor-not-round, `—` vs `0`, cause precedence)
 * lives here and nowhere in the render lane (ADR-0076 D6).
 *
 * Deliberately carries NO `levelId`: level identity belongs to the render shell,
 * and is attached at report-build time.
 */
export function buildRunSummary(state: GameState): RunSummary {
  const { stats } = state;
  return {
    score: state.score,
    // One decimal (spec D2.4.2). `elapsedSeconds` is already effective play time:
    // it is frozen during pause, QTEs and the boss duel (ADR-0076 C2).
    durationSeconds: Math.round(state.elapsedSeconds * 10) / 10,
    wave: state.wave,
    endCause: deriveEndCause(state),
    pickups: derivePickups(state),
    delivery: deriveDelivery(state),
    heartsLost: {
      total: stats.heartsLostToDamage + stats.heartsLostToFaults,
      damage: stats.heartsLostToDamage,
      faults: stats.heartsLostToFaults,
      max: stats.heartsAtStart,
    },
  };
}
