import type {
  BossQte,
  BossQteSpec,
  BossQteZone,
  BossRingZone,
  BossStance,
} from "@game/types/bossQte";
import type { Vec2 } from "@game/types/vector";

// Boss QTE encounter — "le Commandant" (ADR-0051). A SEPARATE, additive pure system (D1):
// it does NOT modify the frozen, shipped hostage QTE (`qteSystem.ts` / `hostageQte.ts`).
// It REUSES the shell SHAPE — the forward-only `ZOOMING → ACTIVE → (WON|LOST) → DONE`
// machine, the two-stance skeleton (`SHIELDED ↔ EXPOSED`), the spatial-colour wandering
// ring, and the seeded-pure-PRNG determinism LAW (authored seed + pure closed-form of
// accumulated sim state; NO Math.random / Date.now / per-tick PRNG cursor) — but authors
// what genuinely diverges: an HP phase sequence, per-phase window escalation, a damage-free
// telegraphed phase break (an ACTIVE sub-state), a blown-window loss clock, and full-figure
// boss anatomy (the hostage G6 human-shield clamp DROPS — no shield → the ring roams freely).
// Pure logic: zero React/Three, unit-tested to 100 %.

// --- Reused shell timers (ADR-0030/0034) -----------------------------------------
export const QTE_ZOOM_SECONDS = 2;
/** On-screen hold of the WON/LOST verdict before the encounter resolves to DONE. */
export const QTE_RESULT_HOLD = 2.2;

// --- Safety invariant floors — asserted IN CODE against the authored spec, never trusted --
/** G5 (reused): an EXPOSED window must stay answerable within human reaction time even at
 *  max difficulty. Every phase's EXPOSED duration is asserted ≥ this at `createBossQte`. */
export const PEEK_EXPOSURE_FLOOR = 0.5;
/** A NEW asserted floor on the per-phase `telegraphLeadSeconds` — deliberately EQUAL to the
 *  shipped hostage tell (`TELEGRAPH_LEAD_SECONDS 0.35`) so the boss is never LESS readable
 *  than the proven duel. NOT a reuse of that fixed constant: a fixed constant cannot ramp
 *  0.45 → 0.40 → 0.35 per phase (ADR-0051 D2, K1 close). Phase 3 sits exactly ON the floor. */
export const BOSS_TELEGRAPH_LEAD_FLOOR = 0.35;
/** The damage-free, telegraphed, re-`SHIELDED` phase-break beat between phases (an ACTIVE
 *  sub-state). Longer than an in-phase telegraph so the pattern change is unmissable. */
export const PHASE_BREAK_SECONDS = 1.0;

// --- Energy economy — outcome currency only (reused ledger + boss-only refill) ----------
// Severity stays strictly monotonic: body −5 < panic −6 < phase-scaled drain −5/−6/−8,
// and the defeat refill +50 dominates (above the hostage +40 — a harder, required fight).
/** Boss defeated (`bossHp → 0`): the gate's reward. Once, terminal (ADR-0051 D2). */
export const QTE_BOSS_REFILL = 50;
/** Firing during the zoom OR a phase break — "don't shoot what you can't read". Per shot. */
export const QTE_PANIC_SHOT = -6;
/** A boss-body hit off the ring (spraying the shield / off-ring mass). Per body-zone hit. */
export const QTE_BODY_HIT = -5;

// --- Spatial-colour ring model (reused shape, boss-authored bands) -----------------------
/** Ring-hit tolerance: an impact within this world-radius of the ring centre is a hit. */
export const RING_HIT_RADIUS = 0.3;
/** VITAL ring hit (head, GREEN) — the heaviest chip. */
export const BOSS_DAMAGE_VITAL = 2;
/** LIMB ring hit (torso/shoulders, YELLOW) — the lighter chip. */
export const BOSS_DAMAGE_LIMB = 1;

/** The HP a ring hit chips for a given anatomy zone (`off` → 0, no chip). */
export function bossColourDamage(zone: BossRingZone): number {
  if (zone === "vital") return BOSS_DAMAGE_VITAL;
  if (zone === "limb") return BOSS_DAMAGE_LIMB;
  return 0;
}

// --- Per-phase escalation table (ADR-0051 D2 / spec §4.3) --------------------------------
// SYSTEM CONSTANTS for V1 (one encounter, no curve yet) — promoted to `BossQteSpec` fields
// only when a multi-encounter curve story needs them (the ADR-0035 F3 seam). One lever moves
// per phase: EXPOSED tightens, SHIELDED lull shrinks, the tell shortens (never below the
// floor), the wander speeds up, and a missed window costs more. The table length is the max
// `phaseCount` a spec may author (a phase must have a row to run).
export interface BossPhaseTuning {
  /** EXPOSED window duration, seconds. Asserted ≥ `PEEK_EXPOSURE_FLOOR`. */
  readonly exposedSeconds: number;
  /** SHIELDED lull between windows, seconds. Asserted STRICTLY > `telegraphLeadSeconds`. */
  readonly shieldedLullSeconds: number;
  /** Window tell lead, seconds. Asserted ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` and < the lull. */
  readonly telegraphLeadSeconds: number;
  /** Peak wander speed target, world u/s — drives the wander leg duration (see below). */
  readonly wanderSpeed: number;
  /** Energy drain on a blown (unanswered) window — phase-scaled, charged ONCE per close. */
  readonly shotDrain: number;
}

export const BOSS_PHASE_TABLE: readonly BossPhaseTuning[] = [
  {
    exposedSeconds: 1.6,
    shieldedLullSeconds: 2.0,
    telegraphLeadSeconds: 0.45,
    wanderSpeed: 1.0,
    shotDrain: -5,
  },
  {
    exposedSeconds: 1.3,
    shieldedLullSeconds: 1.6,
    telegraphLeadSeconds: 0.4,
    wanderSpeed: 1.3,
    shotDrain: -6,
  },
  {
    exposedSeconds: 1.0,
    shieldedLullSeconds: 1.2,
    telegraphLeadSeconds: 0.35,
    wanderSpeed: 1.6,
    shotDrain: -8,
  },
];

// --- Boss anatomy bands for the ring centre (spatial-colour, anchor-relative) ------------
// A FULL-FIGURE commander (no hostage silhouette, no G6 clamp — ADR-0051 D1): the wander box
// may cover the whole anatomy freely. VITAL (head) precedence over LIMB (torso + the two
// shoulders); everything else (arms, legs, empty air) falls through to OFF.
export const BOSS_VITAL_DX_MIN = -0.2;
export const BOSS_VITAL_DX_MAX = 0.2;
export const BOSS_VITAL_DY_MIN = 0.6;
export const BOSS_VITAL_DY_MAX = 1.0;
export const BOSS_TORSO_DX_MIN = -0.35;
export const BOSS_TORSO_DX_MAX = 0.35;
export const BOSS_TORSO_DY_MIN = -0.1;
export const BOSS_TORSO_DY_MAX = 0.6;
export const BOSS_L_SHOULDER_DX_MIN = -0.6;
export const BOSS_L_SHOULDER_DX_MAX = -0.2;
export const BOSS_L_SHOULDER_DY_MIN = 0.45;
export const BOSS_L_SHOULDER_DY_MAX = 0.85;
export const BOSS_R_SHOULDER_DX_MIN = 0.2;
export const BOSS_R_SHOULDER_DX_MAX = 0.6;
export const BOSS_R_SHOULDER_DY_MIN = 0.45;
export const BOSS_R_SHOULDER_DY_MAX = 0.85;
// Full body silhouette (the off-ring backdrop → a small `body` bleed).
export const BOSS_BODY_DX_MIN = -0.85;
export const BOSS_BODY_DX_MAX = 0.85;
export const BOSS_BODY_DY_MIN = -1.05;
export const BOSS_BODY_DY_MAX = 1.05;

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
 * Which anatomy zone the wandering RING CENTRE (anchor-relative offset) sits over (full-figure
 * commander, no G6 hostage clamp). Precedence VITAL > LIMB > OFF: a VITAL centre (the head)
 * chips the most HP, a LIMB centre (torso OR either shoulder) chips less, an OFF centre (arms /
 * legs / empty air) chips nothing. Pure geometry — no stance, no HP.
 */
export function bossRingZoneAt(offset: Vec2): BossRingZone {
  const { x, y } = offset;
  if (inBand(x, y, BOSS_VITAL_DX_MIN, BOSS_VITAL_DX_MAX, BOSS_VITAL_DY_MIN, BOSS_VITAL_DY_MAX)) {
    return "vital";
  }
  const torso = inBand(
    x,
    y,
    BOSS_TORSO_DX_MIN,
    BOSS_TORSO_DX_MAX,
    BOSS_TORSO_DY_MIN,
    BOSS_TORSO_DY_MAX,
  );
  const lShoulder = inBand(
    x,
    y,
    BOSS_L_SHOULDER_DX_MIN,
    BOSS_L_SHOULDER_DX_MAX,
    BOSS_L_SHOULDER_DY_MIN,
    BOSS_L_SHOULDER_DY_MAX,
  );
  const rShoulder = inBand(
    x,
    y,
    BOSS_R_SHOULDER_DX_MIN,
    BOSS_R_SHOULDER_DX_MAX,
    BOSS_R_SHOULDER_DY_MIN,
    BOSS_R_SHOULDER_DY_MAX,
  );
  if (torso || lShoulder || rShoulder) return "limb";
  return "off";
}

/**
 * Which zone a shot at anchor-relative offset (dx, dy) strikes AFTER it has MISSED the reticle
 * ring. No human shield (ADR-0051 D1) → no bavure: a hit inside the boss silhouette is a small
 * `body` bleed, else empty space (`miss`). Anchor-relative and stance-free.
 */
export function bossQteZoneAt(dx: number, dy: number): BossQteZone {
  if (inBand(dx, dy, BOSS_BODY_DX_MIN, BOSS_BODY_DX_MAX, BOSS_BODY_DY_MIN, BOSS_BODY_DY_MAX)) {
    return "body";
  }
  return "miss";
}

// --- Phase derivation --------------------------------------------------------------------
/**
 * The current phase index (0-based, in `[0, phaseCount − 1]`) for a given remaining HP,
 * DERIVED from the total HP + phase count so the render never re-encodes the thresholds
 * (ADR-0051 D2/D5: 24 HP / 3 phases → thresholds 16 and 8). Damage taken = `maxHp − currentHp`;
 * the phase advances every `maxHp / phaseCount` HP of damage, clamped into range. Pure.
 */
export function phaseIndexAt(currentHp: number, maxHp: number, phaseCount: number): number {
  const band = maxHp / phaseCount;
  const damage = maxHp - currentHp;
  const idx = Math.floor(damage / band);
  if (idx < 0) return 0;
  if (idx > phaseCount - 1) return phaseCount - 1;
  return idx;
}

// --- Seeded ring wander — a PURE closed-form of accumulated window-elapsed time -----------
// COPIED from the hostage closed-form (ADR-0034 Rev. 3) and PARAMETERISED by a per-phase
// wander config (the hostage wander has no speed knob — ADR-0051 D1). Waypoint[k] is a cheap
// integer hash of (targetSeed, windowIndex, k) mapped into the amplitude box; the ring eases
// (smoothstep) from waypoint[k] to waypoint[k+1] over `legDuration`, where k = floor(t /
// legDuration) and `t` is the window-elapsed seconds. Smoothstep decelerates to ZERO velocity
// AT each waypoint — that momentary stillness is the intended fair firing window. A function of
// `t` ALONE (never a per-tick stepped PRNG): re-chunking the same total elapsed yields the same
// offset (replay-deterministic, framerate-independent). NO Math.random / Date.now anywhere.

/** Wander amplitude box half-extents (anchored on `BOSS_WANDER_CENTRE`), covering the head,
 *  torso and both shoulders so the ring visits every scoring band. SYSTEM constants. */
export const BOSS_WANDER_CENTRE: Vec2 = { x: 0, y: 0.5 };
export const BOSS_WANDER_AMP_X = 0.55;
export const BOSS_WANDER_AMP_Y = 0.5;
/** Anti-jitter floor: consecutive waypoints are pushed at least this far apart. */
export const BOSS_MIN_LEG_DISPLACEMENT = 0.13;
/** Speed cap: a single leg is pulled in to at most this far. With smoothstep's 1.5× peak this
 *  bounds the peak wander speed to `1.5 × MAX_LEG_DISPLACEMENT / legDuration` (see below). */
export const BOSS_MAX_LEG_DISPLACEMENT = 0.4;

/**
 * The per-phase wander leg duration (seconds) that yields the phase's authored peak wander
 * SPEED. Smoothstep peaks at 1.5× the average mid-leg, a capped leg travels at most
 * `MAX_LEG_DISPLACEMENT`, so `peakSpeed ≈ 1.5 × MAX_LEG_DISPLACEMENT / legDuration` ⇒
 * `legDuration = 1.5 × MAX_LEG_DISPLACEMENT / peakSpeed`. Faster phases → shorter legs →
 * harder tracking (the "point faible qui se déplace" as the difficulty ramp).
 */
export function bossWanderLegDuration(wanderSpeed: number): number {
  return (1.5 * BOSS_MAX_LEG_DISPLACEMENT) / wanderSpeed;
}

/** Cheap 32-bit integer hash (FNV-1a mix + avalanche) of three integers → uint32. */
function hash32(a: number, b: number, c: number): number {
  let h = 2166136261 >>> 0;
  h = Math.imul(h ^ (a >>> 0), 16777619);
  h = Math.imul(h ^ (b >>> 0), 16777619);
  h = Math.imul(h ^ (c >>> 0), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Raw waypoint k: the hash split into two 16-bit halves, each mapped uniformly onto the
 *  amplitude box [−AMP, +AMP]. Absolute (uncoupled); anti-jitter refines it in `bossWander`. */
function rawWaypoint(targetSeed: number, windowIndex: number, k: number): Vec2 {
  const h = hash32(targetSeed, windowIndex, k);
  const ux = (h >>> 16) / 0x10000; // [0, 1)
  const uy = (h & 0xffff) / 0x10000; // [0, 1)
  return { x: (ux * 2 - 1) * BOSS_WANDER_AMP_X, y: (uy * 2 - 1) * BOSS_WANDER_AMP_Y };
}

function clampToRange(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Anti-jitter: if `raw` sits within MIN_LEG_DISPLACEMENT of `prev`, push it out to that floor
 *  and clamp back into the box, so every leg has perceptible travel. Bounded, no recursion. */
function antiJitter(raw: Vec2, prev: Vec2): Vec2 {
  const dx = raw.x - prev.x;
  const dy = raw.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d >= BOSS_MIN_LEG_DISPLACEMENT) return raw;
  let ux: number;
  let uy: number;
  if (d > 1e-6) {
    ux = dx / d;
    uy = dy / d;
  } else {
    ux = prev.x <= 0 ? 1 : -1;
    uy = 0;
  }
  return {
    x: clampToRange(prev.x + ux * BOSS_MIN_LEG_DISPLACEMENT, -BOSS_WANDER_AMP_X, BOSS_WANDER_AMP_X),
    y: clampToRange(prev.y + uy * BOSS_MIN_LEG_DISPLACEMENT, -BOSS_WANDER_AMP_Y, BOSS_WANDER_AMP_Y),
  };
}

/** Speed cap: pull `p` in along the leg toward `prev` so the step is at most
 *  MAX_LEG_DISPLACEMENT. Both endpoints in-box ⇒ the interpolated point stays in-box (convex). */
function capLeg(p: Vec2, prev: Vec2): Vec2 {
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d <= BOSS_MAX_LEG_DISPLACEMENT) return p;
  const s = BOSS_MAX_LEG_DISPLACEMENT / d;
  return { x: prev.x + dx * s, y: prev.y + dy * s };
}

/** Smoothstep 3u²−2u³ (zero velocity at u=0 and u=1 → the deceleration firing window). */
function smoothstep(u: number): number {
  return u * u * (3 - 2 * u);
}

/**
 * The seeded ring-wander offset (relative to `BOSS_WANDER_CENTRE`) at window-elapsed `t`
 * seconds, for a phase whose wander leg lasts `legDuration`. PURE and closed-form in
 * (targetSeed, windowIndex, t, legDuration): hashed waypoints, coupled only by a bounded
 * anti-jitter + speed-cap forward pass (a window is a few legs, so `k` is tiny), eased as a
 * convex blend of two in-box waypoints (stays in the box). Framerate-independent.
 */
export function bossWander(
  targetSeed: number,
  windowIndex: number,
  t: number,
  legDuration: number,
): Vec2 {
  const leg = Math.max(0, t) / legDuration;
  const k = Math.floor(leg);
  const s = smoothstep(leg - k);
  let prev = rawWaypoint(targetSeed, windowIndex, 0);
  let wpK = prev; // canonical waypoint[k]
  let wpK1 = prev; // canonical waypoint[k+1]
  for (let i = 1; i <= k + 1; i++) {
    const next = capLeg(antiJitter(rawWaypoint(targetSeed, windowIndex, i), prev), prev);
    if (i === k) wpK = next;
    if (i === k + 1) wpK1 = next;
    prev = next;
  }
  return {
    x: wpK.x + (wpK1.x - wpK.x) * s,
    y: wpK.y + (wpK1.y - wpK.y) * s,
  };
}

// --- Phase-tuning lookup (bounded to the authored `phaseCount` ≤ table length) -----------
function phaseTuning(phaseIndex: number): BossPhaseTuning {
  const clamped =
    phaseIndex < 0
      ? 0
      : phaseIndex > BOSS_PHASE_TABLE.length - 1
        ? BOSS_PHASE_TABLE.length - 1
        : phaseIndex;
  // Bounds are enforced by `createBossQte` (phaseCount ≤ table length) + `phaseIndexAt`
  // clamping, so this index is always valid; the local clamp is belt-and-braces.
  const row = BOSS_PHASE_TABLE[clamped];
  if (row === undefined) {
    throw new Error("bossQteSystem invariant: phase index out of the escalation table");
  }
  return row;
}

// --- Lifecycle ---------------------------------------------------------------------------
/** True while the boss QTE holds the scene frozen (ZOOMING…LOST); DONE/null resume the sim. */
export function isBossQteActive(qte: BossQte | null): boolean {
  return (
    qte !== null &&
    (qte.phase === "ZOOMING" ||
      qte.phase === "ACTIVE" ||
      qte.phase === "WON" ||
      qte.phase === "LOST")
  );
}

/**
 * Fire the boss QTE at most once per level: only when a spec exists, none has fired yet
 * (`qte === null`), and the kill quota is reached — the boss is the terminal beat on `Livrer`
 * (ADR-0051 D3), REPLACING the abrupt quota → LEVEL_COMPLETE transition with the duel.
 */
export function shouldTriggerBossQte(
  spec: BossQteSpec | null,
  qte: BossQte | null,
  kills: number,
  enemiesToWin: number,
): boolean {
  return spec !== null && qte === null && kills >= enemiesToWin;
}

/**
 * Seed a fresh boss QTE in the ZOOMING phase. The SAFETY INVARIANTS are enforced HERE, against
 * the authored data (never trusted — ADR-0051 D7): non-finite numerics are rejected (C6);
 * `phaseCount` is a positive integer with an escalation row per phase; `bossHp` and
 * `maxBlownWindows` are positive integers (the kill currency and the failure clock must count);
 * every USED phase's EXPOSED ≥ `PEEK_EXPOSURE_FLOOR`, its `telegraphLeadSeconds` ≥
 * `BOSS_TELEGRAPH_LEAD_FLOOR` AND strictly < its SHIELDED lull; and the phase break is a
 * positive, telegraph-fitting beat (≥ `BOSS_TELEGRAPH_LEAD_FLOOR`).
 */
export function createBossQte(spec: BossQteSpec): BossQte {
  // C6: reject non-finite authored numerics up front — NaN/Infinity slips past the
  // integer/`Math.max` guards and can wedge the sub-machine open forever.
  const numerics: readonly number[] = [
    spec.zoomSeconds,
    spec.anchor.x,
    spec.anchor.y,
    spec.phaseCount,
    spec.bossHp,
    spec.maxBlownWindows,
    spec.targetSeed,
  ];
  if (!numerics.every((n) => Number.isFinite(n))) {
    throw new Error(
      "BossQteSpec invariant (C6): all authored numerics must be finite (no NaN/Infinity)",
    );
  }
  // `phaseCount` selects the escalation rows — a whole count in [1, table length], or a phase
  // has no row to run (and the tier lever must be a real integer).
  if (!Number.isInteger(spec.phaseCount) || spec.phaseCount < 1) {
    throw new Error(
      "BossQteSpec invariant: phaseCount must be an integer ≥ 1 — the tier lever must count",
    );
  }
  if (spec.phaseCount > BOSS_PHASE_TABLE.length) {
    throw new Error(
      `BossQteSpec invariant: phaseCount (${String(spec.phaseCount)}) exceeds the escalation table (${String(BOSS_PHASE_TABLE.length)}) — every phase must have a tuning row`,
    );
  }
  // The boss HP is the kill currency — whole and ≥ 1, or the fight is unwinnable or pre-won.
  if (!Number.isInteger(spec.bossHp) || spec.bossHp < 1) {
    throw new Error(
      "BossQteSpec invariant: bossHp must be an integer ≥ 1 — the boss must have hit points to deplete",
    );
  }
  // The blown-window count is the sole failure clock — whole and ≥ 1, or the loss never arrives.
  if (!Number.isInteger(spec.maxBlownWindows) || spec.maxBlownWindows < 1) {
    throw new Error(
      "BossQteSpec invariant: maxBlownWindows must be an integer ≥ 1 — the failure clock must count",
    );
  }
  // Per-phase window floors — asserted for EVERY phase this spec will actually run.
  for (let i = 0; i < spec.phaseCount; i++) {
    const row = phaseTuning(i);
    if (!Number.isFinite(row.exposedSeconds) || row.exposedSeconds < PEEK_EXPOSURE_FLOOR) {
      throw new Error(
        `BossPhaseTuning invariant (G5): phase ${String(i)} EXPOSED must be finite and ≥ PEEK_EXPOSURE_FLOOR`,
      );
    }
    if (
      !Number.isFinite(row.telegraphLeadSeconds) ||
      row.telegraphLeadSeconds < BOSS_TELEGRAPH_LEAD_FLOOR
    ) {
      throw new Error(
        `BossPhaseTuning invariant (G4): phase ${String(i)} telegraphLeadSeconds must be finite and ≥ BOSS_TELEGRAPH_LEAD_FLOOR`,
      );
    }
    if (
      !Number.isFinite(row.shieldedLullSeconds) ||
      row.shieldedLullSeconds <= row.telegraphLeadSeconds
    ) {
      throw new Error(
        `BossPhaseTuning invariant (G4): phase ${String(i)} SHIELDED lull must be STRICTLY > its telegraphLeadSeconds so the tell is a discrete wind-up`,
      );
    }
    if (!Number.isFinite(row.wanderSpeed) || row.wanderSpeed <= 0) {
      throw new Error(
        `BossPhaseTuning invariant: phase ${String(i)} wanderSpeed must be finite and > 0`,
      );
    }
    if (!Number.isFinite(row.shotDrain)) {
      throw new Error(
        `BossPhaseTuning invariant (C6): phase ${String(i)} shotDrain must be finite`,
      );
    }
    // The phase break is a real, telegraph-fitting beat: at least as long as this phase's tell
    // (a new pattern never opens un-warned — spec §2.4 anti-"mort bullshit"). `PHASE_BREAK_SECONDS`
    // (1.0 s) ≥ every tell (≥ the 0.35 s floor); asserted against the runtime row, not trusted.
    if (!Number.isFinite(PHASE_BREAK_SECONDS) || PHASE_BREAK_SECONDS < row.telegraphLeadSeconds) {
      throw new Error(
        `bossQteSystem invariant: PHASE_BREAK_SECONDS must be ≥ phase ${String(i)} telegraphLeadSeconds — the break must telegraph`,
      );
    }
  }

  const firstLull = phaseTuning(0).shieldedLullSeconds;
  return {
    phase: "ZOOMING",
    stance: "SHIELDED",
    telegraphActive: false,
    stanceRemaining: firstLull,
    phaseBreakRemaining: 0,
    anchor: spec.anchor,
    targetOffset: BOSS_WANDER_CENTRE,
    targetSeed: spec.targetSeed,
    ringZone: "off",
    bossHp: spec.bossHp,
    bossHpMax: spec.bossHp,
    phaseCount: spec.phaseCount,
    phaseIndex: 0,
    windowChipped: false,
    blownWindows: 0,
    maxBlownWindows: spec.maxBlownWindows,
    windowOrdinal: 0,
    zoomRemaining: spec.zoomSeconds,
    zoomSeconds: spec.zoomSeconds,
    resultRemaining: QTE_RESULT_HOLD,
    warning: true,
  };
}

export interface BossQteTickResult {
  readonly qte: BossQte;
  /**
   * Energy delta from THIS tick (transition-only; never re-charged). Energy is the boss
   * QTE's SOLE outcome currency (ADR-0051 D2 / D5 reuse): the encounter never moves score.
   */
  readonly energyDelta: number;
}

const NO_DELTA = { energyDelta: 0 } as const;

/** The wandering ring offset + its cached zone for a resulting stance/phase. During EXPOSED
 *  (not breaking) the ring wanders (seeded, pure, full-anatomy); otherwise it rests OFF. */
function ringFor(
  qte: BossQte,
  stance: BossStance,
  phaseBreakRemaining: number,
  stanceRemaining: number,
  windowOrdinal: number,
  phaseIndex: number,
): { targetOffset: Vec2; ringZone: BossRingZone } {
  if (stance === "EXPOSED" && phaseBreakRemaining <= 0) {
    const row = phaseTuning(phaseIndex);
    const t = Math.max(0, row.exposedSeconds - stanceRemaining);
    const legDuration = bossWanderLegDuration(row.wanderSpeed);
    const w = bossWander(qte.targetSeed, windowOrdinal, t, legDuration);
    const targetOffset = { x: BOSS_WANDER_CENTRE.x + w.x, y: BOSS_WANDER_CENTRE.y + w.y };
    return { targetOffset, ringZone: bossRingZoneAt(targetOffset) };
  }
  return { targetOffset: BOSS_WANDER_CENTRE, ringZone: "off" };
}

/**
 * Advance the boss QTE one tick.
 *
 * - ZOOMING: counts the zoom down; a `fire` this beat is a PANIC shot (energy −). When the
 *   zoom elapses → ACTIVE, SHIELDED.
 * - ACTIVE (ORDER MATTERS — deterministic tie-break): (1) resolve `fire` FIRST. A RING HIT
 *   (EXPOSED, not breaking, within RING_HIT_RADIUS of the drawn ring centre) chips `bossHp`
 *   by the LAST-DRAWN `ringZone` colour (`vital` 2 / `limb` 1 / `off` 0); depleting HP → WON
 *   (+refill). A non-depleting chip marks the window answered and, if it crosses a phase
 *   threshold, triggers the damage-free PHASE BREAK. A shot that MISSES the ring (or lands
 *   while SHIELDED) is classified `body` (−5) / `miss` (0); a shot during a phase break is a
 *   PANIC shot (−6). (2) If not won, advance the SHIELDED↔EXPOSED (+ phase-break) sub-machine
 *   over the FULL delta, set the tell, and charge the phase drain ONCE per EXPOSED→SHIELDED
 *   close that chipped 0 HP (a "blown window"), incrementing `blownWindows`; reaching
 *   `maxBlownWindows` → LOST (HALT at the fatal close). Tie-break: a same-tick DEPLETING ring
 *   hit, resolved first, beats a same-tick fatal blown window → WON; a mere chip does not.
 * - WON/LOST: hold briefly, then DONE. DONE/default are no-ops.
 */
export function tickBossQte(
  qte: BossQte,
  fire: boolean,
  impactPoint: Vec2,
  delta: number,
): BossQteTickResult {
  switch (qte.phase) {
    case "ZOOMING": {
      const energyDelta = fire ? QTE_PANIC_SHOT : 0;
      const zoomRemaining = qte.zoomRemaining - delta;
      if (zoomRemaining > 0) {
        return { qte: { ...qte, zoomRemaining }, energyDelta };
      }
      return {
        qte: {
          ...qte,
          phase: "ACTIVE",
          stance: "SHIELDED",
          stanceRemaining: phaseTuning(qte.phaseIndex).shieldedLullSeconds,
          telegraphActive: false,
          zoomRemaining: 0,
          warning: false,
        },
        energyDelta,
      };
    }
    case "ACTIVE": {
      let energyDelta = 0;
      let bossHp = qte.bossHp;
      let phaseIndex = qte.phaseIndex;
      let stance: BossStance = qte.stance;
      let stanceRemaining = qte.stanceRemaining;
      let phaseBreakRemaining = qte.phaseBreakRemaining;
      let windowChipped = qte.windowChipped;
      let windowOrdinal = qte.windowOrdinal;
      let blownWindows = qte.blownWindows;
      const inBreakAtStart = qte.phaseBreakRemaining > 0;

      // (1) Resolve the player's shot FIRST — a DEPLETING ring hit beats a same-tick fatal
      // window close (tie-break). Aim-honesty: the ring is centred on `qte.targetOffset`
      // (last-drawn) and scored against `qte.ringZone` (last-drawn colour).
      if (fire) {
        if (inBreakAtStart) {
          // An unreadable frame — "don't shoot what you can't read".
          energyDelta += QTE_PANIC_SHOT;
        } else if (qte.stance === "EXPOSED") {
          const ringCentreX = qte.anchor.x + qte.targetOffset.x;
          const ringCentreY = qte.anchor.y + qte.targetOffset.y;
          const isRingHit =
            Math.hypot(impactPoint.x - ringCentreX, impactPoint.y - ringCentreY) <= RING_HIT_RADIUS;
          if (isRingHit) {
            const dmg = bossColourDamage(qte.ringZone);
            if (dmg > 0) {
              bossHp = qte.bossHp - dmg;
              windowChipped = true;
              if (bossHp <= 0) {
                return {
                  qte: {
                    ...qte,
                    phase: "WON",
                    bossHp: 0,
                    windowChipped: true,
                    phaseIndex: qte.phaseCount - 1,
                  },
                  energyDelta: QTE_BOSS_REFILL,
                };
              }
              // Non-depleting chip: did it cross into a new phase? Trigger the damage-free,
              // telegraphed PHASE BREAK (an ACTIVE sub-state) — forcibly re-SHIELD, no
              // window opens/closes, no blown charge (the window WAS answered).
              const newPhase = phaseIndexAt(bossHp, qte.bossHpMax, qte.phaseCount);
              if (newPhase > phaseIndex) {
                phaseIndex = newPhase;
                phaseBreakRemaining = PHASE_BREAK_SECONDS;
                stance = "SHIELDED";
                stanceRemaining = PHASE_BREAK_SECONDS;
                windowChipped = false;
              }
            }
            // A `ringZone === "off"` hit chips 0 but still consumes the shot (no fall-through).
          } else {
            const zone = bossQteZoneAt(impactPoint.x - qte.anchor.x, impactPoint.y - qte.anchor.y);
            if (zone === "body") energyDelta += QTE_BODY_HIT;
            // "miss": nothing.
          }
        } else {
          // SHIELDED (not breaking): a shot sprays the shield / off-ring body or misses.
          const zone = bossQteZoneAt(impactPoint.x - qte.anchor.x, impactPoint.y - qte.anchor.y);
          if (zone === "body") energyDelta += QTE_BODY_HIT;
        }
      }

      // (2) Tick the SHIELDED↔EXPOSED (+ phase-break) sub-machine over the FULL delta. Consume
      // whole segments one at a time, charging each CLOSED blown window exactly ONCE. Each
      // iteration subtracts a strictly-positive segment duration (lull > telegraph ≥ floor > 0,
      // EXPOSED ≥ PEEK_EXPOSURE_FLOOR > 0, break = PHASE_BREAK_SECONDS > 0), so `remaining`
      // strictly decreases and the loop is provably bounded (terminates). Small deltas cross ≤ 1
      // boundary → a single toggle.
      let remaining = delta;
      let crossed = false;
      while (remaining >= stanceRemaining) {
        remaining -= stanceRemaining;
        crossed = true;
        if (phaseBreakRemaining > 0) {
          // The break ends → resume normal cycling at the (already-advanced) phase with a
          // fresh SHIELDED lull. No window bookkeeping across a break.
          phaseBreakRemaining = 0;
          stance = "SHIELDED";
          stanceRemaining = phaseTuning(phaseIndex).shieldedLullSeconds;
        } else if (stance === "SHIELDED") {
          // Open a window at the CURRENT phase. Fresh window → not yet chipped.
          stance = "EXPOSED";
          stanceRemaining = Math.max(phaseTuning(phaseIndex).exposedSeconds, PEEK_EXPOSURE_FLOOR);
          windowChipped = false;
          windowOrdinal += 1;
        } else {
          // Close a window. A "blown window" = an EXPOSED→SHIELDED close with the boss still
          // alive AND 0 HP chipped this window: charge the phase drain ONCE and count it.
          stance = "SHIELDED";
          stanceRemaining = phaseTuning(phaseIndex).shieldedLullSeconds;
          if (bossHp > 0 && !windowChipped) {
            blownWindows += 1;
            energyDelta += phaseTuning(phaseIndex).shotDrain;
            if (blownWindows >= qte.maxBlownWindows) {
              return {
                qte: {
                  ...qte,
                  phase: "LOST",
                  stance,
                  stanceRemaining,
                  phaseBreakRemaining: 0,
                  bossHp,
                  phaseIndex,
                  windowChipped: false,
                  blownWindows,
                  windowOrdinal,
                  telegraphActive: false,
                  targetOffset: BOSS_WANDER_CENTRE,
                  ringZone: "off",
                },
                energyDelta,
              };
            }
          }
        }
      }
      // Advance within the landed segment (on a crossing the segment was reset to its full
      // duration above — the trailing overshoot is discarded, preserving small-delta behaviour).
      if (!crossed) {
        stanceRemaining -= remaining;
        // Count the phase break DOWN in lockstep with its SHIELDED hold on every non-crossing
        // tick — but only for a break already OPEN at the start of this tick, so the tick that
        // TRIGGERS a break still reports the full `PHASE_BREAK_SECONDS`. Without this the break
        // stayed pinned at its trigger value until the crossing snapped it to 0, so the render's
        // brace pulse (`1 − phaseBreakRemaining / PHASE_BREAK_SECONDS`) never played under the
        // real clamped per-frame delta (`MAX_DELTA` 0.1 < `PHASE_BREAK_SECONDS` 1.0).
        if (inBreakAtStart && phaseBreakRemaining > 0) {
          phaseBreakRemaining = Math.max(0, phaseBreakRemaining - remaining);
        }
      }

      // The window tell shows in the last `telegraphLeadSeconds` of a normal SHIELDED beat
      // (NOT during a phase break — the render reads `phaseBreakRemaining > 0` for that cue).
      const telegraphActive =
        stance === "SHIELDED" &&
        phaseBreakRemaining <= 0 &&
        stanceRemaining <= phaseTuning(phaseIndex).telegraphLeadSeconds;

      // (3) The OUTGOING ring offset + cached zone for the RESULTING stance/phase.
      const { targetOffset, ringZone } = ringFor(
        qte,
        stance,
        phaseBreakRemaining,
        stanceRemaining,
        windowOrdinal,
        phaseIndex,
      );

      return {
        qte: {
          ...qte,
          stance,
          stanceRemaining,
          phaseBreakRemaining,
          bossHp,
          phaseIndex,
          windowChipped,
          blownWindows,
          windowOrdinal,
          telegraphActive,
          targetOffset,
          ringZone,
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
