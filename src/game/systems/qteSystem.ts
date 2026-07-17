import type { HostageQte, QteSpec, QteZone, CaptorStance } from "@game/types/hostageQte";
import type { Vec2 } from "@game/types/vector";

// Hostage-taker cinematic QTE — "Le duel de la porte cochère" (ADR-0034, F1+F2).
// Pure logic: zero React/Three, unit-tested. When the scripted trigger fires the
// rest of the scene freezes and the camera zooms; then the captor RETREATS toward
// a porte cochère dragging the hostage. The distance to the door is the SOLE clock
// (reaching it = failure). He alternates COVERED (human shield, unshootable) and
// brief telegraphed PEEKING exposures — during which he ALSO fires at the player.
// The only kill route is a head hit during a peek; energy is the outcome currency.
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
 *  ≥ this so a tell always fits before every exposure. */
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
// Traced against the moving tableau the render lane draws: the captor ≈1.9 u tall
// on a 2.0 plane centred on the (moving) anchor, using the kneeling hostage held
// front-right as a living shield. Offsets are anchor-relative so G6 (below) holds
// under the moving tableau. The hostage silhouette takes precedence over the
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
 * Seed a fresh QTE in the ZOOMING phase. Copies the retreat kinematics from the
 * spec (`dir` = sign(door − start), `speed`, `porteCochere`) and the peek cadence
 * / exposure into the runtime record — the tick has only the runtime and needs
 * them. The SAFETY INVARIANTS are enforced HERE, against the authored data (not
 * trusted): the G5 exposure floor is clamped up, and the G4 telegraph fit + D1
 * "door strictly ahead, non-zero retreat" are asserted (ADR-0034 gotchas).
 */
export function createQte(spec: QteSpec): HostageQte {
  const dx = spec.porteCochere.x - spec.anchor.x;
  if (dx === 0) {
    throw new Error("QteSpec invariant (D1): porteCochere must be strictly ahead of anchor");
  }
  if (spec.retreatSpeed <= 0) {
    throw new Error("QteSpec invariant (D1): retreatSpeed must be > 0 — the clock must run");
  }
  if (spec.peekCadenceSeconds < TELEGRAPH_LEAD_SECONDS) {
    throw new Error(
      "QteSpec invariant (G4): peekCadenceSeconds must be ≥ TELEGRAPH_LEAD_SECONDS so a tell fits",
    );
  }
  const dir: 1 | -1 = dx > 0 ? 1 : -1;
  // G5: clamp the runtime exposure so the tick can never see a sub-floor peek.
  const peekDurationSeconds = Math.max(PEEK_EXPOSURE_FLOOR, spec.peekDurationSeconds);
  return {
    phase: "ZOOMING",
    stance: "COVERED",
    telegraphActive: false,
    stanceRemaining: spec.peekCadenceSeconds,
    anchor: spec.anchor,
    dir,
    speed: spec.retreatSpeed,
    porteCochere: spec.porteCochere,
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
 *   When the zoom elapses → ACTIVE, COVERED, the retreat clock starts.
 * - ACTIVE (ORDER MATTERS — deterministic tie-break, ADR-0034 gotcha): (1) resolve
 *   `fire` FIRST via the stance-aware classifier — a head-during-peek WINS; body /
 *   hostage bleed energy; miss does nothing. (2) If not won, advance the retreat and
 *   check the door — reaching it → LOST (no extra charge, the loss was paid
 *   peek-by-peek). (3) Otherwise tick the COVERED↔PEEKING sub-machine, set the G4
 *   tell, and charge the unanswered-peek drain ONCE on a PEEKING→COVERED close.
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
      // Zoom finished → open the duel: ACTIVE, COVERED, retreat clock starts now.
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
      // door-reached (tie-break: the shot wins).
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

      // (2) Advance the retreat, then check the door — reaching it loses the QTE
      // with NO extra energy charge (the cost was already paid peek-by-peek).
      const anchor: Vec2 = { x: qte.anchor.x + qte.dir * qte.speed * delta, y: qte.anchor.y };
      if (qte.dir * (anchor.x - qte.porteCochere.x) >= 0) {
        return { qte: { ...qte, phase: "LOST", anchor }, energyDelta };
      }

      // (3) Tick the COVERED↔PEEKING sub-machine.
      let stance: CaptorStance = qte.stance;
      let stanceRemaining = qte.stanceRemaining - delta;
      if (stanceRemaining <= 0) {
        if (stance === "COVERED") {
          // Open an exposure. G5: never below the runtime floor.
          stance = "PEEKING";
          stanceRemaining = Math.max(qte.peekDurationSeconds, PEEK_EXPOSURE_FLOOR);
        } else {
          // Close an exposure. A peek that CLOSES was by definition unanswered (a
          // head hit during it would have WON), so charge the counter-fire ONCE.
          stance = "COVERED";
          stanceRemaining = qte.peekCadenceSeconds;
          energyDelta += QTE_UNANSWERED_PEEK;
        }
      }
      // The G4 tell shows in the last TELEGRAPH_LEAD_SECONDS of a COVERED beat.
      const telegraphActive = stance === "COVERED" && stanceRemaining <= TELEGRAPH_LEAD_SECONDS;

      return {
        qte: { ...qte, anchor, stance, stanceRemaining, telegraphActive },
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
