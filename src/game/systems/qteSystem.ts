import type {
  HostageQte,
  HostageAccomplice,
  QteSpec,
  QteZone,
  RingZone,
  CaptorStance,
} from "@game/types/hostageQte";
import type { Vec2 } from "@game/types/vector";
import { hash32, smoothstep } from "@game/systems/hash";

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

// --- Accomplice (second shooter) — F4 / ADR-0036 ---------------------------------
// When a level authors an accomplice, it OWNS the player-directed fire: the captor's
// own counter-fire (`QTE_UNANSWERED_PEEK` on a blown peek) is SUPPRESSED and the
// accomplice fires on its own deterministic cadence instead (INVARIANT P3-ACC —
// exactly one player-directed fire channel armed, selected by accomplice presence).
/** A landed accomplice shot drains this — deliberately the SAME magnitude as
 *  `QTE_UNANSWERED_PEEK` so replacing the captor's counter-fire is net-neutral and the
 *  severity ordering (body −5 < panic −6 < accomplice/peek −8 ≪ hostage −30 ≪ +40) holds. */
export const ACCOMPLICE_SHOT_DAMAGE = -8;
/** Wind-up lead before an accomplice shot — its OWN named constant (NOT aliased to
 *  `TELEGRAPH_LEAD_SECONDS`; separate names so a future edit to one doesn't silently move
 *  the other). `fireIntervalSeconds` must be STRICTLY > this (asserted in `createQte`) so
 *  the tell is a discrete wind-up beat, never the whole cadence. */
export const ACCOMPLICE_TELL_SECONDS = 0.35;

// --- Spatial-colour ring model (spatial-colour revision of ADR-0034) -------------
// A shot that HITS the wandering reticle ring (within RING_HIT_RADIUS of its centre)
// during a PEEKING exposure chips the captor's HP by the ring's anatomy zone
// (`ringZoneAt`): a VITAL centre chips the most (drawn GREEN), a LIMB chips less
// (YELLOW), an OFF centre does nothing (RED). Depleting the HP wins the rescue. The
// GAME owns the semantic zone + the damage; the render lane maps the zone to a colour.
/** Ring-hit tolerance: an impact within this world-radius of the ring centre is a hit. */
export const RING_HIT_RADIUS = 0.3;
/** VITAL ring hit (head/torso, GREEN) — the heaviest chip. */
export const CAPTOR_DAMAGE_VITAL = 2;
/** LIMB ring hit (arm/leg, YELLOW) — the lighter chip. */
export const CAPTOR_DAMAGE_LIMB = 1;

/** The HP a ring hit chips for a given anatomy zone (`off` → 0, no chip). */
export function colourDamage(zone: RingZone): number {
  if (zone === "vital") return CAPTOR_DAMAGE_VITAL;
  if (zone === "limb") return CAPTOR_DAMAGE_LIMB;
  return 0;
}

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
/**
 * Resting/centre of the wandering reticle ring (anchor-relative). `targetOffset` rests here
 * while COVERED/ZOOMING (with `ringZone` forced `"off"`) and wanders around it (± the
 * amplitudes below) while PEEKING. Replaces the retired head-band `HEAD_NEUTRAL` — the ring
 * roams the captor's anatomy (`ringZoneAt`) rather than centring a fixed head kill-box.
 */
export const WANDER_CENTRE: Vec2 = { x: -0.2, y: 0.6 };
/**
 * Half-extents of the wander amplitude box, anchored on `WANDER_CENTRE` (spatial-colour
 * hitbox-diagram roam so the ring visits the torso, both shoulders and the head). Reproduces
 * the authored roam box (−0.20 ± 0.78 = [−0.98, +0.58]; 0.60 ± 0.40 = [+0.20, +1.00]). SYSTEM
 * constants — only the seed is authored (F3 may promote these; fallback 0.70/0.35 if it clips
 * at zoom). The over-hostage wedge is auto-excluded by the box-disjoint G6 clamp.
 */
export const WANDER_AMP_X = 0.78;
export const WANDER_AMP_Y = 0.4;
/**
 * One wander leg (waypoint→waypoint) lasts this long. Chosen with `MAX_LEG_DISPLACEMENT` so
 * a capped leg's peak speed — smoothstep peaks at 1.5× the average mid-leg — lands near the
 * game-designer feel target of ≈ 1.8 world u/s: 0.45 × 1.5 / 0.38 ≈ 1.78 u/s.
 */
export const LEG_DURATION = 0.38;
/**
 * Anti-jitter floor: consecutive waypoints are nudged at least this far apart, so the ring
 * never quivers in place (a degenerate near-zero leg reads as a stutter, not a peek).
 */
export const MIN_LEG_DISPLACEMENT = 0.15;
/**
 * Speed cap: a single leg is pulled in to at most this far, so the WIDER roam box can't spawn
 * a corner-to-corner "teleport-fast" leg. Bounds the peak wander speed (see `LEG_DURATION`).
 */
export const MAX_LEG_DISPLACEMENT = 0.45;
/**
 * G6 safety margin — the ASSERTED minimum gap `clampTargetOffsetG6` forces between the ring's
 * circle and the hostage AABB, on every side. Not trusted from tuning.
 */
export const G6_MARGIN = 0.1;
/**
 * G6 dilation pad — the hostage AABB is inflated by this on every side to form the forbidden
 * region for the ring CENTRE (`RING_HIT_RADIUS` clears the band, `+ G6_MARGIN` is the gap).
 */
export const G6_PAD = RING_HIT_RADIUS + G6_MARGIN; // 0.30 + 0.10 = 0.40
// Captor body silhouette (the covered mass; kill-safe by itself).
export const BODY_DX_MIN = -0.85;
export const BODY_DX_MAX = 0.85;
export const BODY_DY_MIN = -1.0;
export const BODY_DY_MAX = 0.95;

// --- Captor anatomy bands for the ring centre (spatial-colour, anchor-relative) --------
// The wandering ring centre is classified against the captor's anatomy per the game-designer's
// hitbox diagram: VITAL (the head, popped over the hostage), LIMB (the torso + the two
// shoulders), else OFF (the gun-arm, the legs, the free right arm and empty air all fall
// through). VITAL takes precedence over LIMB where the head abuts the torso/shoulders. The
// head strip sits ABOVE the hostage silhouette (dy ≥ +0.58 > HOSTAGE_DY_MAX +0.15), so the
// reachable kill zone and the bavure band never share space.
export const VITAL_DX_MIN = -0.2;
export const VITAL_DX_MAX = 0.2;
export const VITAL_DY_MIN = 0.58;
export const VITAL_DY_MAX = 1.0;
export const TORSO_DX_MIN = -0.32;
export const TORSO_DX_MAX = 0.32;
export const TORSO_DY_MIN = -0.05;
export const TORSO_DY_MAX = 0.58;
export const L_SHOULDER_DX_MIN = -0.58;
export const L_SHOULDER_DX_MAX = -0.2;
export const L_SHOULDER_DY_MIN = 0.46;
export const L_SHOULDER_DY_MAX = 0.8;
export const R_SHOULDER_DX_MIN = 0.2;
export const R_SHOULDER_DX_MAX = 0.58;
export const R_SHOULDER_DY_MIN = 0.46;
export const R_SHOULDER_DY_MAX = 0.8;

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
 * Which anatomy zone the wandering RING CENTRE (anchor-relative offset) sits over
 * (spatial-colour model, hitbox-diagram bands). Precedence VITAL > LIMB > OFF: a VITAL centre
 * (the head) chips the most HP, a LIMB centre (torso OR either shoulder) chips less, an OFF
 * centre (gun-arm / legs / right arm / empty air) chips nothing. Pure geometry — no stance,
 * no HP; the tick reads the LAST-DRAWN cache `qte.ringZone` (colour-honesty) for scoring.
 */
export function ringZoneAt(offset: Vec2): RingZone {
  const { x, y } = offset;
  if (inBand(x, y, VITAL_DX_MIN, VITAL_DX_MAX, VITAL_DY_MIN, VITAL_DY_MAX)) return "vital";
  const torso = inBand(x, y, TORSO_DX_MIN, TORSO_DX_MAX, TORSO_DY_MIN, TORSO_DY_MAX);
  const lShoulder = inBand(
    x,
    y,
    L_SHOULDER_DX_MIN,
    L_SHOULDER_DX_MAX,
    L_SHOULDER_DY_MIN,
    L_SHOULDER_DY_MAX,
  );
  const rShoulder = inBand(
    x,
    y,
    R_SHOULDER_DX_MIN,
    R_SHOULDER_DX_MAX,
    R_SHOULDER_DY_MIN,
    R_SHOULDER_DY_MAX,
  );
  if (torso || lShoulder || rShoulder) return "limb";
  return "off";
}

/**
 * Which zone a shot at anchor-relative offset (dx, dy) strikes AFTER it has already MISSED
 * the reticle ring (spatial-colour revision retires the head band — captor damage flows
 * through the ring, `ringZoneAt`). The hostage silhouette takes precedence (a bavure), then
 * the captor body (a small energy bleed), else empty space (`miss`). Anchor-relative and
 * stance-free: this only classifies the off-ring backdrop.
 */
export function qteZoneAt(dx: number, dy: number): QteZone {
  if (inBand(dx, dy, HOSTAGE_DX_MIN, HOSTAGE_DX_MAX, HOSTAGE_DY_MIN, HOSTAGE_DY_MAX)) {
    return "hostage";
  }
  if (inBand(dx, dy, BODY_DX_MIN, BODY_DX_MAX, BODY_DY_MIN, BODY_DY_MAX)) {
    return "body";
  }
  return "miss";
}

// --- Seeded head wander — a PURE closed-form function of accumulated peek-time -----------
// While PEEKING the head kill-zone drifts between hashed WAYPOINTS. Waypoint[k] is a cheap
// integer hash of (targetSeed, peekIndex, k) mapped uniformly into the amplitude box; the
// head eases (smoothstep) from waypoint[k] to waypoint[k+1] over LEG_DURATION, where
// k = floor(t / LEG_DURATION) and `t` is the peek-elapsed seconds. Smoothstep decelerates
// to ZERO velocity AT each waypoint — that momentary stillness is the intended fair firing
// window. Because the result is a function of `t` ALONE (never a per-tick stepped PRNG),
// re-chunking the same total elapsed yields the SAME offset: replay-deterministic and
// framerate-independent. NO Math.random / Date.now anywhere.

/** Raw waypoint k: the hash split into two 16-bit halves, each mapped uniformly onto the
 *  amplitude box [−AMP, +AMP]. Absolute (uncoupled); anti-jitter refines it in `wander`. */
function rawWaypoint(targetSeed: number, peekIndex: number, k: number): Vec2 {
  const h = hash32(targetSeed, peekIndex, k);
  const ux = (h >>> 16) / 0x10000; // [0, 1)
  const uy = (h & 0xffff) / 0x10000; // [0, 1)
  return { x: (ux * 2 - 1) * WANDER_AMP_X, y: (uy * 2 - 1) * WANDER_AMP_Y };
}

function clampToRange(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Anti-jitter: if `raw` sits within MIN_LEG_DISPLACEMENT of the previous waypoint, push it
 *  out to that floor (inward-biased when degenerate) and clamp back into the box, so every
 *  leg has perceptible travel. Uses only the two adjacent waypoints → bounded, no recursion. */
function antiJitter(raw: Vec2, prev: Vec2): Vec2 {
  const dx = raw.x - prev.x;
  const dy = raw.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d >= MIN_LEG_DISPLACEMENT) return raw;
  let ux: number;
  let uy: number;
  if (d > 1e-6) {
    ux = dx / d;
    uy = dy / d;
  } else {
    // Degenerate coincident waypoints: step toward the box centre (guaranteed headroom).
    ux = prev.x <= 0 ? 1 : -1;
    uy = 0;
  }
  return {
    x: clampToRange(prev.x + ux * MIN_LEG_DISPLACEMENT, -WANDER_AMP_X, WANDER_AMP_X),
    y: clampToRange(prev.y + uy * MIN_LEG_DISPLACEMENT, -WANDER_AMP_Y, WANDER_AMP_Y),
  };
}

/** Speed cap: pull `p` in along the leg toward `prev` so the step is at most
 *  MAX_LEG_DISPLACEMENT. Both endpoints are in-box, so the interpolated point stays in-box
 *  (convex). Applied AFTER anti-jitter, so the leg keeps MIN ≤ len ≤ MAX (MIN < MAX). */
function capLeg(p: Vec2, prev: Vec2): Vec2 {
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d <= MAX_LEG_DISPLACEMENT) return p;
  const s = MAX_LEG_DISPLACEMENT / d;
  return { x: prev.x + dx * s, y: prev.y + dy * s };
}

/**
 * The seeded ring-wander offset (relative to WANDER_CENTRE) at peek-elapsed `t` seconds.
 * PURE and closed-form in (targetSeed, peekIndex, t): waypoints are hashed, coupled only by
 * a bounded anti-jitter + speed-cap forward pass (a peek is a few legs, so `k` is tiny), and
 * the eased result is a convex blend of two in-box waypoints, so it stays within the
 * amplitude box. Framerate-independent: a function of `t` alone (re-chunking delta agrees).
 */
export function wander(targetSeed: number, peekIndex: number, t: number): Vec2 {
  const leg = Math.max(0, t) / LEG_DURATION;
  const k = Math.floor(leg);
  const s = smoothstep(leg - k);
  // Forward pass building canonical waypoints 0..k+1 (shared endpoints ⇒ C0-continuous).
  let prev = rawWaypoint(targetSeed, peekIndex, 0);
  let wpK = prev; // canonical waypoint[k]
  let wpK1 = prev; // canonical waypoint[k+1]
  for (let i = 1; i <= k + 1; i++) {
    const next = capLeg(antiJitter(rawWaypoint(targetSeed, peekIndex, i), prev), prev);
    if (i === k) wpK = next;
    if (i === k + 1) wpK1 = next;
    prev = next;
  }
  return {
    x: wpK.x + (wpK1.x - wpK.x) * s,
    y: wpK.y + (wpK1.y - wpK.y) * s,
  };
}

/**
 * G6 safety net — ASSERTED, never trusted from tuning (architect ruling §22: BOX-disjoint,
 * replacing the old X-disjoint form). The hostage AABB, dilated by `G6_PAD` on every side,
 * is the forbidden region for the ring CENTRE: keeping the centre out of it keeps the ring
 * circle (radius `RING_HIT_RADIUS`) clear of the hostage band by ≥ `G6_MARGIN`. A centre
 * inside the forbidden box is pushed out by the cheaper of two escapes — LEFT off his flank
 * (to the box's left edge) or UP above her head (to the box's top edge). Pushing UP (not
 * DOWN) keeps the centre-top strip (dy ≥ +0.55) reachable, so the head kill zone stays
 * shootable. Pure, deterministic and idempotent. Applied to EVERY offset.
 */
export function clampTargetOffsetG6(offset: Vec2): Vec2 {
  const fxMin = HOSTAGE_DX_MIN - G6_PAD; // -0.40
  const fxMax = HOSTAGE_DX_MAX + G6_PAD; //  1.15
  const fyMin = HOSTAGE_DY_MIN - G6_PAD; // -1.45
  const fyMax = HOSTAGE_DY_MAX + G6_PAD; //  0.55
  const inside = offset.x > fxMin && offset.x < fxMax && offset.y > fyMin && offset.y < fyMax;
  if (!inside) return offset;
  const costLeft = offset.x - fxMin; // push off his flank
  const costUp = fyMax - offset.y; // push above her head
  return costLeft <= costUp ? { x: fxMin, y: offset.y } : { x: offset.x, y: fyMax };
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
    spec.targetSeed,
    spec.captorHp,
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
  // The captor's HP is the kill currency — it must be a whole, ≥ 1 count, or the rescue is
  // either unwinnable or already won at seed time.
  if (!Number.isInteger(spec.captorHp) || spec.captorHp < 1) {
    throw new Error(
      "QteSpec invariant: captorHp must be an integer ≥ 1 — the captor must have hit points to deplete",
    );
  }
  if (spec.peekCadenceSeconds <= TELEGRAPH_LEAD_SECONDS) {
    throw new Error(
      "QteSpec invariant (G4): peekCadenceSeconds must be > TELEGRAPH_LEAD_SECONDS so a discrete tell fits",
    );
  }
  // G5: clamp the runtime exposure so the tick can never see a sub-floor peek.
  const peekDurationSeconds = Math.max(PEEK_EXPOSURE_FLOOR, spec.peekDurationSeconds);
  // F4 (ADR-0036): seed the accomplice when authored. ABSENT ⇒ null ⇒ byte-identical to
  // today (the null-guard IS the byte-identity). The cadence gets the same C6 finite guard
  // as every other authored numeric, plus a discrete-tell floor mirroring the G4 assert.
  let accomplice: HostageAccomplice | null = null;
  if (spec.accomplice !== undefined) {
    if (!Number.isFinite(spec.accomplice.fireIntervalSeconds)) {
      throw new Error(
        "QteSpec invariant (C6): accomplice.fireIntervalSeconds must be finite (no NaN/Infinity)",
      );
    }
    if (spec.accomplice.fireIntervalSeconds <= ACCOMPLICE_TELL_SECONDS) {
      throw new Error(
        "QteSpec invariant: accomplice.fireIntervalSeconds must be > ACCOMPLICE_TELL_SECONDS so a discrete wind-up tell fits",
      );
    }
    // Seed the cooldown to a FULL interval so the first shot lands one interval into ACTIVE
    // (grace — the duel never opens on an instant hit).
    accomplice = {
      fireIntervalSeconds: spec.accomplice.fireIntervalSeconds,
      fireCooldownRemaining: spec.accomplice.fireIntervalSeconds,
      telegraphActive: false,
    };
  }
  return {
    phase: "ZOOMING",
    stance: "COVERED",
    telegraphActive: false,
    stanceRemaining: spec.peekCadenceSeconds,
    anchor: spec.anchor,
    // The ring rests at WANDER_CENTRE until the first PEEKING wander; the seed is mirrored
    // onto the runtime so the tick can compute the pure wander offset.
    targetOffset: WANDER_CENTRE,
    targetSeed: spec.targetSeed,
    blownPeeks: 0,
    maxBlownPeeks: spec.maxBlownPeeks,
    peekCadenceSeconds: spec.peekCadenceSeconds,
    peekDurationSeconds,
    // The captor starts at full HP; the ring rests OFF (no chip) until the first peek.
    captorHp: spec.captorHp,
    ringZone: "off",
    zoomRemaining: spec.zoomSeconds,
    zoomSeconds: spec.zoomSeconds,
    resultRemaining: QTE_RESULT_HOLD,
    warning: true,
    accomplice,
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
 * - ACTIVE (ORDER MATTERS — deterministic tie-break, spatial-colour revision): (1) resolve
 *   `fire` FIRST. A RING HIT (PEEKING and within RING_HIT_RADIUS of the drawn ring centre)
 *   chips the captor by the LAST-DRAWN `ringZone` colour (`vital` 2 / `limb` 1 / `off` 0);
 *   depleting HP → WON (+refill). A non-killing chip records HP, charges no energy, and falls
 *   through. A shot that MISSES the ring is classified by `qteZoneAt` — hostage/body bleed
 *   energy, miss nothing (no captor damage). (2) If not won, advance the COVERED↔PEEKING
 *   sub-machine over the FULL delta (a large delta may cross several segments), set the
 *   G4 tell, and charge the unanswered-peek drain ONCE per PEEKING→COVERED close crossed
 *   with `captorHp > 0`. Each such close also increments `blownPeeks`; reaching
 *   `maxBlownPeeks` executes the hostage → LOST (no extra charge) and HALTS the loop at the
 *   fatal close. Tie-break: a same-tick DEPLETING ring hit, resolved first, beats the fatal
 *   peek → WON; a mere chip on that peek → LOST.
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
      let captorHp = qte.captorHp;

      // (1) Resolve the player's shot FIRST — a DEPLETING ring hit beats a same-tick fatal
      // peek close (tie-break: the shot wins). Aim-honesty: the ring is centred on
      // `qte.targetOffset` — the offset the render drew LAST frame — and scored against
      // `qte.ringZone` — the colour drawn there (colour-honesty), so the player shoots
      // exactly what they saw. The anchor is static; only the ring has moved.
      if (fire) {
        const ringCentreX = qte.anchor.x + qte.targetOffset.x;
        const ringCentreY = qte.anchor.y + qte.targetOffset.y;
        const isRingHit =
          qte.stance === "PEEKING" &&
          Math.hypot(impactPoint.x - ringCentreX, impactPoint.y - ringCentreY) <= RING_HIT_RADIUS;
        if (isRingHit) {
          // Colour-honest chip: the LAST-DRAWN zone's damage. `off` (red) chips 0 but still
          // consumes the shot (no fall-through to the off-ring classifier).
          captorHp = qte.captorHp - colourDamage(qte.ringZone);
          if (captorHp <= 0) {
            return {
              qte: { ...qte, phase: "WON", captorHp: 0 },
              energyDelta: QTE_RESCUE_REFILL,
            };
          }
          // A non-killing chip: HP recorded, NO energy charged, fall through to the peek loop.
        } else {
          // The shot missed the ring → classify the backdrop it struck (no captor damage).
          const zone = qteZoneAt(impactPoint.x - qte.anchor.x, impactPoint.y - qte.anchor.y);
          if (zone === "body") energyDelta += QTE_BODY_HIT;
          else if (zone === "hostage") energyDelta += QTE_HOSTAGE_HIT;
          // "miss": nothing.
        }
      }

      // (1b) Tick the accomplice (F4 / ADR-0036). Runs AFTER the fire-resolves-first WON
      // check (a depleting ring hit ends the duel above, so NO accomplice shot is charged
      // that tick) and BEFORE the stance loop, so the ticked `acc` is folded into BOTH the
      // LOST early-return and the normal return. CORRECTNESS: `acc` MUST be written into
      // every non-WON ACTIVE exit or the cooldown desyncs. Pure countdown accumulator over
      // ACTIVE time: consume whole intervals so a large delta never swallows a shot (each
      // iteration subtracts a strictly-positive interval > ACCOMPLICE_TELL_SECONDS > 0 ⇒
      // bounded/terminating), and re-chunking `delta` yields the identical shot count
      // (framerate-independent, replay-safe — no Math.random / Date.now).
      let acc = qte.accomplice;
      if (acc !== null) {
        let cd = acc.fireCooldownRemaining;
        let rem = delta;
        while (rem >= cd) {
          rem -= cd;
          energyDelta += ACCOMPLICE_SHOT_DAMAGE;
          cd = acc.fireIntervalSeconds;
        }
        cd -= rem;
        acc = { ...acc, fireCooldownRemaining: cd, telegraphActive: cd <= ACCOMPLICE_TELL_SECONDS };
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
          // Close an exposure. A "blown peek" = a PEEKING→COVERED close with the captor still
          // alive (`captorHp > 0`): the opening went unanswered (a depleting ring hit would
          // have WON and returned above), so charge the counter-fire ONCE and count the blown
          // opening. A non-killing chip earlier this tick left captorHp > 0, so the chip does
          // NOT spare the peek — it still blows.
          // C2: a body/hostage/miss shot fired during this closing peek is charged on
          // BOTH axes — the shot drain resolved above AND this close drain — by design
          // (reckless spray AND a non-answer to the opening; INTENDED, do not net).
          stance = "COVERED";
          stanceRemaining = qte.peekCadenceSeconds;
          if (captorHp > 0) {
            blownPeeks += 1;
            // P3-ACC: the captor's own counter-fire is armed ONLY when there is no
            // accomplice. When one is present it OWNS the player-directed drain (Channel A
            // ticked above), so the captor stops firing at the player and keeps only the
            // execution clock (`blownPeeks`). Never both, never neither (a tautology on the
            // null-guard). Absent ⇒ charge exactly as today (byte-identical).
            if (qte.accomplice === null) energyDelta += QTE_UNANSWERED_PEEK;
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
                  captorHp,
                  telegraphActive: false,
                  // The fatal close is a PEEKING→COVERED close → the ring resets to rest, OFF.
                  targetOffset: WANDER_CENTRE,
                  ringZone: "off",
                  // Carry the ticked accomplice — else its cooldown desyncs on the loss tick.
                  accomplice: acc,
                },
                energyDelta,
              };
            }
          }
        }
      }
      // Advance within the landed segment. On a boundary crossing the current segment
      // resets to its FULL duration (the trailing overshoot is discarded, exactly as
      // the prior single-toggle path did — preserving small-delta behaviour bit-for-bit).
      if (!crossed) stanceRemaining -= remaining;
      // The G4 tell shows in the last TELEGRAPH_LEAD_SECONDS of a COVERED beat.
      const telegraphActive = stance === "COVERED" && stanceRemaining <= TELEGRAPH_LEAD_SECONDS;

      // (3) Compute the OUTGOING ring offset + its cached `ringZone` for the RESULTING stance.
      // During PEEKING the ring wanders (seeded, pure) around WANDER_CENTRE as a function of
      // the peek-elapsed time, G6-clamped clear of the hostage, and `ringZone` is the anatomy
      // under that centre (`ringZoneAt`); during COVERED/ZOOMING it rests at WANDER_CENTRE
      // with `ringZone` forced OFF (no chip while covered). `peekIndex` is the resulting
      // `blownPeeks` (0-based peek ordinal — it increments only on close), and `t` is the
      // peek-elapsed seconds (peekDuration − stanceRemaining, clamped ≥ 0).
      let targetOffset: Vec2;
      let ringZone: RingZone;
      if (stance === "PEEKING") {
        const t = Math.max(0, qte.peekDurationSeconds - stanceRemaining);
        const w = wander(qte.targetSeed, blownPeeks, t);
        targetOffset = clampTargetOffsetG6({
          x: WANDER_CENTRE.x + w.x,
          y: WANDER_CENTRE.y + w.y,
        });
        ringZone = ringZoneAt(targetOffset);
      } else {
        targetOffset = WANDER_CENTRE;
        ringZone = "off";
      }

      return {
        qte: {
          ...qte,
          stance,
          stanceRemaining,
          blownPeeks,
          captorHp,
          telegraphActive,
          targetOffset,
          ringZone,
          // The ticked accomplice (unchanged `qte.accomplice` when this level has none).
          accomplice: acc,
        },
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
