import type { HostageQte, QteSpec, QteZone, CaptorStance } from "@game/types/hostageQte";
import type { Vec2 } from "@game/types/vector";

// Hostage-taker cinematic QTE — "the static duel" (revises ADR-0034 after playtest).
// Pure logic: zero React/Three, unit-tested. When the scripted trigger fires the rest
// of the scene freezes and the camera zooms onto the captor, who then stands STILL,
// holding the hostage as a shield (the retreat toward a porte cochère read as "sliding
// on the floor" in play and is removed — the anchor is now a fixed point). He alternates
// COVERED (human shield, unshootable) and brief telegraphed PEEKING exposures — during
// which he ALSO fires at the player. The only kill route is a head hit during a peek.
// Every peek that closes WITHOUT a clean headshot is a "blown" opening: it drains energy
// and counts toward the captor executing the hostage. After `maxBlownPeeks` blown peeks
// he kills her (the sole failure) — the blown-peeks count is the SOLE clock (it replaces
// the removed retreat/distance clock). Energy is the outcome currency.
//
// Reworks the ADR-0030 static tableau: the captor health bar, the PART_DAMAGE
// body-part table and the windowSeconds countdown all left the contract (D6).

// --- Kept phase timers (ADR-0030 shell, ADR-0034 D6 keeps them) -----------------
export const QTE_ZOOM_SECONDS = 2;
// On-screen hold of the WON/LOST verdict before the scene resumes — long enough
// to actually read the stamped "OTAGE SAUVÉE / PERDUE" over the zoomed tableau.
export const QTE_RESULT_HOLD = 2.2;

// --- Safety invariants — asserted IN CODE against the runtime, never trusted -----
/** G5 (ADR-0034): a peek must stay answerable within human reaction time even at
 *  max difficulty. The runtime exposure is clamped UP to this at `createQte`. */
export const PEEK_EXPOSURE_FLOOR = 0.5;
/** G4 (ADR-0034): every peek is preceded by a perceptible, structural tell — the
 *  last `TELEGRAPH_LEAD_SECONDS` of the COVERED beat. `peekCadenceSeconds` must be
 *  STRICTLY > this so the tell is a discrete wind-up, not the entire COVERED beat. */
export const TELEGRAPH_LEAD_SECONDS = 0.35;

// --- Energy economy — outcome currency only, no passive drain (ADR-0034 D5) ------
// Game-wide constants (a rescue is a rescue on every level); NOT per-level knobs.
// Severity is strictly monotonic: body −5 < panic −6 < unanswered peek −8 ≪
// hostage −30, and the rescue refill +40 dominates.
/** Clean rescue (head during PEEKING): the QTE is the level's fuel station. */
export const QTE_RESCUE_REFILL = 40;
/** Bavure — a stray hit on the hostage. The heaviest single event. */
export const QTE_HOSTAGE_HIT = -30;
/** An ignored opening is also an incoming shot — charged ONCE per closed exposure. */
export const QTE_UNANSWERED_PEEK = -8;
/** Firing during the 2 s zoom — "don't shoot what you can't read". Per shot. */
export const QTE_PANIC_SHOT = -6;
/** A captor-body hit (any time) — reckless spray bleeds you. Per body-zone hit. */
export const QTE_BODY_HIT = -5;

// --- Shot classifier bands (anchor-relative world offsets, y up) -----------------
// Traced against the tableau the render lane draws: the captor ≈1.9 u tall on a 2.0
// plane centred on the (static) anchor, using the kneeling hostage held front-right as
// a living shield. Offsets are anchor-relative so G6 (below) holds; the anchor is
// static, so nothing here moves. The hostage silhouette takes precedence over the
// captor's body; the peeking head pops over his far shoulder — up and to the left,
// clear of her silhouette with a non-zero gap (G6).
//
// Hostage silhouette (kneeling shield, front-right, lower).
export const HOSTAGE_DX_MIN = 0.0;
export const HOSTAGE_DX_MAX = 0.75;
export const HOSTAGE_DY_MIN = -1.05;
export const HOSTAGE_DY_MAX = 0.15;
// Peeking head band (over his far shoulder, up-left, clear of the hostage — G6 gap).
export const HEAD_DX_MIN = -0.6;
export const HEAD_DX_MAX = -0.1;
export const HEAD_DY_MIN = 0.5;
export const HEAD_DY_MAX = 1.0;
// Captor body silhouette (the covered mass; kill-safe by itself).
export const BODY_DX_MIN = -0.85;
export const BODY_DX_MAX = 0.85;
export const BODY_DY_MIN = -1.0;
export const BODY_DY_MAX = 0.95;

function inBand(
  dx: number,
  dy: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): boolean {
  return dx >= xMin && dx <= xMax && dy >= yMin && dy <= yMax;
}

/**
 * Which zone a shot at anchor-relative offset (dx, dy) strikes — STANCE-AWARE
 * (ADR-0034 D4/D6). `"head"` is returned ONLY while `PEEKING`, so head-during-peek
 * is the sole kill route by construction; during `COVERED` the head band yields
 * `"body"` or `"miss"` (no kill zone). The hostage silhouette takes precedence, and
 * the head band is spatially disjoint from the hostage band with a non-zero gap (G6).
 */
export function qteZoneAt(dx: number, dy: number, stance: CaptorStance): QteZone {
  if (inBand(dx, dy, HOSTAGE_DX_MIN, HOSTAGE_DX_MAX, HOSTAGE_DY_MIN, HOSTAGE_DY_MAX)) {
    return "hostage";
  }
  if (stance === "PEEKING" && inBand(dx, dy, HEAD_DX_MIN, HEAD_DX_MAX, HEAD_DY_MIN, HEAD_DY_MAX)) {
    return "head";
  }
  if (inBand(dx, dy, BODY_DX_MIN, BODY_DX_MAX, BODY_DY_MIN, BODY_DY_MAX)) {
    return "body";
  }
  return "miss";
}

/** True while the QTE holds the scene frozen (ZOOMING…LOST); DONE/null resume the sim. */
export function isQteActive(qte: HostageQte | null): boolean {
  return (
    qte !== null &&
    (qte.phase === "ZOOMING" ||
      qte.phase === "ACTIVE" ||
      qte.phase === "WON" ||
      qte.phase === "LOST")
  );
}

/**
 * Fire the QTE at most once per level: only when a spec exists, none has fired
 * yet (`qte === null`), and the level's elapsed time has reached the trigger.
 */
export function shouldTriggerQte(
  spec: QteSpec | null,
  qte: HostageQte | null,
  elapsed: number,
): boolean {
  return spec !== null && qte === null && elapsed >= spec.triggerAtElapsedSeconds;
}

/**
 * Seed a fresh QTE in the ZOOMING phase. Copies the STATIC anchor, the peek cadence /
 * exposure and the blown-peeks cap into the runtime record — the tick has only the
 * runtime and needs them. The SAFETY INVARIANTS are enforced HERE, against the authored
 * data (not trusted): non-finite numerics are rejected (C6), `maxBlownPeeks` must be a
 * positive integer (the failure clock must count), the G5 exposure floor is clamped up,
 * and the G4 telegraph fit is asserted (ADR-0034 gotchas).
 */
export function createQte(spec: QteSpec): HostageQte {
  // C6: reject non-finite authored numerics up front — NaN/Infinity slips past the
  // integer/`Math.max` guards and can wedge the peek sub-machine open forever. Guard
  // every scalar the tick reads before any of them is used.
  const numerics: readonly number[] = [
    spec.triggerAtElapsedSeconds,
    spec.zoomSeconds,
    spec.anchor.x,
    spec.anchor.y,
    spec.peekCadenceSeconds,
    spec.peekDurationSeconds,
    spec.maxBlownPeeks,
  ];
  if (!numerics.every((n) => Number.isFinite(n))) {
    throw new Error(
      "QteSpec invariant (C6): all authored numerics must be finite (no NaN/Infinity)",
    );
  }
  // The blown-peeks count is the sole failure clock — it must be a whole, ≥ 1 count,
  // or the loss can never arrive (or arrives fractionally).
  if (!Number.isInteger(spec.maxBlownPeeks) || spec.maxBlownPeeks < 1) {
    throw new Error(
      "QteSpec invariant: maxBlownPeeks must be an integer ≥ 1 — the failure clock must count",
    );
  }
  if (spec.peekCadenceSeconds <= TELEGRAPH_LEAD_SECONDS) {
    throw new Error(
      "QteSpec invariant (G4): peekCadenceSeconds must be > TELEGRAPH_LEAD_SECONDS so a discrete tell fits",
    );
  }
  // G5: clamp the runtime exposure so the tick can never see a sub-floor peek.
  const peekDurationSeconds = Math.max(PEEK_EXPOSURE_FLOOR, spec.peekDurationSeconds);
  return {
    phase: "ZOOMING",
    stance: "COVERED",
    telegraphActive: false,
    stanceRemaining: spec.peekCadenceSeconds,
    anchor: spec.anchor,
    blownPeeks: 0,
    maxBlownPeeks: spec.maxBlownPeeks,
    peekCadenceSeconds: spec.peekCadenceSeconds,
    peekDurationSeconds,
    zoomRemaining: spec.zoomSeconds,
    zoomSeconds: spec.zoomSeconds,
    resultRemaining: QTE_RESULT_HOLD,
    warning: true,
  };
}

export interface QteTickResult {
  readonly qte: HostageQte;
  /**
   * Energy delta from THIS tick (transition-only; never re-charged). Energy is the
   * QTE's SOLE outcome currency (ADR-0034 D5, design gate G-1): score is not the
   * stake, so the QTE never moves score — a rescue still never advances the kill quota.
   */
  readonly energyDelta: number;
}

const NO_DELTA = { energyDelta: 0 } as const;

/**
 * Advance the QTE one tick.
 *
 * - ZOOMING: counts the zoom down; a `fire` this beat is a PANIC shot (energy −).
 *   When the zoom elapses → ACTIVE, COVERED, warning off.
 * - ACTIVE (ORDER MATTERS — deterministic tie-break, ADR-0034 gotcha): (1) resolve
 *   `fire` FIRST via the stance-aware classifier — a head-during-peek WINS; body /
 *   hostage bleed energy; miss does nothing. (2) If not won, advance the COVERED↔PEEKING
 *   sub-machine over the FULL delta (a large delta may cross several segments), set the
 *   G4 tell, and charge the unanswered-peek drain ONCE per PEEKING→COVERED close crossed.
 *   Each such close also increments `blownPeeks`; reaching `maxBlownPeeks` executes the
 *   hostage → LOST (no extra charge, the cost was paid peek-by-peek) and HALTS the loop
 *   at the fatal close (a large delta must not overshoot past the execution). A same-tick
 *   winning headshot, resolved first, beats the fatal peek → WON.
 * - WON/LOST: hold briefly, then DONE. DONE/default are no-ops.
 */
export function tickQte(
  qte: HostageQte,
  fire: boolean,
  impactPoint: Vec2,
  delta: number,
): QteTickResult {
  switch (qte.phase) {
    case "ZOOMING": {
      // A shot at an unreadable frame is penalised every time (D4), whether or not
      // the zoom ends this beat.
      const energyDelta = fire ? QTE_PANIC_SHOT : 0;
      const zoomRemaining = qte.zoomRemaining - delta;
      if (zoomRemaining > 0) {
        return { qte: { ...qte, zoomRemaining }, energyDelta };
      }
      // Zoom finished → open the duel: ACTIVE, COVERED.
      return {
        qte: {
          ...qte,
          phase: "ACTIVE",
          stance: "COVERED",
          stanceRemaining: qte.peekCadenceSeconds,
          telegraphActive: false,
          zoomRemaining: 0,
          warning: false,
        },
        energyDelta,
      };
    }
    case "ACTIVE": {
      let energyDelta = 0;

      // (1) Resolve the player's shot FIRST — a winning head-shot beats a same-tick
      // fatal peek close (tie-break: the shot wins). The anchor is static, so the
      // classifier reads the fixed anchor-relative offset.
      if (fire) {
        const zone = qteZoneAt(
          impactPoint.x - qte.anchor.x,
          impactPoint.y - qte.anchor.y,
          qte.stance,
        );
        if (zone === "head") {
          return {
            qte: { ...qte, phase: "WON" },
            energyDelta: QTE_RESCUE_REFILL,
          };
        }
        if (zone === "body") energyDelta += QTE_BODY_HIT;
        else if (zone === "hostage") energyDelta += QTE_HOSTAGE_HIT;
        // "miss": nothing.
      }

      // (2) Tick the COVERED↔PEEKING sub-machine over the FULL delta (C1). A delta
      // larger than the current segment must not silently swallow the skipped peeks:
      // consume whole segments one at a time, charging each CLOSED exposure. Each
      // iteration subtracts a strictly-positive stance duration (peekCadence >
      // TELEGRAPH_LEAD_SECONDS > 0, peekDuration ≥ PEEK_EXPOSURE_FLOOR > 0), so
      // `remaining` strictly decreases and the loop is provably bounded (terminates).
      // Small deltas cross ≤ 1 boundary → identical to the prior single toggle.
      let stance: CaptorStance = qte.stance;
      let stanceRemaining = qte.stanceRemaining;
      let blownPeeks = qte.blownPeeks;
      let remaining = delta;
      let crossed = false;
      while (remaining >= stanceRemaining) {
        remaining -= stanceRemaining;
        crossed = true;
        if (stance === "COVERED") {
          // Open an exposure. G5: never below the runtime floor.
          stance = "PEEKING";
          stanceRemaining = Math.max(qte.peekDurationSeconds, PEEK_EXPOSURE_FLOOR);
        } else {
          // Close an exposure. A peek that CLOSES was by definition unanswered (a
          // head hit during it would have WON), so charge the counter-fire ONCE and
          // count the blown opening.
          // C2: a body/hostage/miss shot fired during this closing peek is charged on
          // BOTH axes — the shot drain resolved above AND this close drain — by design
          // (reckless spray AND a non-answer to the opening; INTENDED, do not net).
          stance = "COVERED";
          stanceRemaining = qte.peekCadenceSeconds;
          blownPeeks += 1;
          energyDelta += QTE_UNANSWERED_PEEK;
          // The blown-peeks clock reaching the cap = the captor executes the hostage.
          // HALT at this fatal close (no extra energy charge, no overshoot past it).
          if (blownPeeks >= qte.maxBlownPeeks) {
            return {
              qte: {
                ...qte,
                phase: "LOST",
                stance,
                stanceRemaining,
                blownPeeks,
                telegraphActive: false,
              },
              energyDelta,
            };
          }
        }
      }
      // Advance within the landed segment. On a boundary crossing the current segment
      // resets to its FULL duration (the trailing overshoot is discarded, exactly as
      // the prior single-toggle path did — preserving small-delta behaviour bit-for-bit).
      if (!crossed) stanceRemaining -= remaining;
      // The G4 tell shows in the last TELEGRAPH_LEAD_SECONDS of a COVERED beat.
      const telegraphActive = stance === "COVERED" && stanceRemaining <= TELEGRAPH_LEAD_SECONDS;

      return {
        qte: { ...qte, stance, stanceRemaining, blownPeeks, telegraphActive },
        energyDelta,
      };
    }
    case "WON":
    case "LOST": {
      const resultRemaining = qte.resultRemaining - delta;
      if (resultRemaining > 0) return { qte: { ...qte, resultRemaining }, ...NO_DELTA };
      return { qte: { ...qte, phase: "DONE", resultRemaining: 0 }, ...NO_DELTA };
    }
    default:
      return { qte, ...NO_DELTA };
  }
}
