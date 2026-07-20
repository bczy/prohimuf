import type {
  BossQte,
  BossQteSpec,
  BossQteZone,
  BossRingZone,
  BossStance,
} from "@game/types/bossQte";
import type { Vec2 } from "@game/types/vector";

// Boss QTE encounter — "le Commandant" (ADR-0051, extended by ADR-0052). A SEPARATE,
// additive pure system (D1): it does NOT modify the frozen, shipped hostage QTE
// (`qteSystem.ts` / `hostageQte.ts`). It REUSES the shell SHAPE — the forward-only phase
// machine, the two-stance skeleton (`SHIELDED ↔ EXPOSED`), the spatial-colour wandering
// ring, and the seeded-pure-PRNG determinism LAW (authored seed + pure closed-form of
// accumulated sim state; NO Math.random / Date.now / per-tick PRNG cursor) — but authors
// what genuinely diverges. ADR-0052 layers five differentiation levers on top, ALL inside
// this file + `types/bossQte.ts` (no `stateMachine.ts` / `src/hooks` / shipped-level edit):
//   1. dual VITAL/LIMB rings, phase-escalated (phase 1 = single V1 ring).
//   2. an optional interactive décor prop (SHIELDED-gap, single-use, pure upside).
//   3. a CHARGED parry window on the same fire-click (STAGGER reward, whiff cost).
//   4. an in-tableau, seeded renfort pressure surge (modulates the blown-window drain only).
//   5. a ceremonial FINISHER coup-de-grâce phase before WON.
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
// Severity stays strictly monotonic: body −5 ≤ panic −6 ≤ phase-scaled drain −5/−6/−8 ≤
// charged whiff −10 ≤ renfort drain −12 (ADR-0052 spec §3-B / §4-B), and the defeat refill
// +50 dominates (above the hostage +40 — a harder, required fight).
/** Boss defeated (`bossHp → 0`): the gate's reward. Once, terminal (ADR-0051 D2). Paid on the
 *  FINISHER → WON resolution (ADR-0052 D3), never doubled. */
export const QTE_BOSS_REFILL = 50;
/** Firing during the zoom, a phase break, a stagger, OR a missed parry — "don't shoot what
 *  you can't read / spray when you should parry". Per shot. */
export const QTE_PANIC_SHOT = -6;
/** A boss-body hit off the ring (spraying the shield / off-ring mass). Per body-zone hit. */
export const QTE_BODY_HIT = -5;

// --- Spatial-colour ring model (reused shape, boss-authored bands) -----------------------
/** Ring-hit tolerance: an impact within this world-radius of the ring centre is a hit. Also
 *  reused as the parry-point catch radius (ADR-0052 lever 3) and the décor-prop catch radius. */
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

// --- ADR-0052 lever 1 — dual VITAL/LIMB rings (phase 2+) ---------------------------------
// A second simultaneous ring during EXPOSED: VITAL/tête (fixed 2 HP, small, fast, risky) +
// LIMB/corps (fixed 1 HP, larger, slow, the safe bank). Each ring's wander sub-box is ⊂ its
// anatomy band (colour-honesty), asserted in `createBossQte`. The player chooses which to
// answer; one shared `windowChipped` bool (a chip from EITHER answers the window — no double
// jeopardy). Phase 1 stays the single V1 ring (onboarding).
/** VITAL/tête ring wander sub-box (⊂ head band): centre + half-extents. Small + fast. */
export const BOSS_VITAL_WANDER_CENTRE: Vec2 = { x: 0, y: 0.8 };
export const BOSS_VITAL_WANDER_AMP_X = 0.16;
export const BOSS_VITAL_WANDER_AMP_Y = 0.16;
/** LIMB/corps ring wander sub-box (⊂ torso band): centre + half-extents. Larger + slow. */
export const BOSS_LIMB_WANDER_CENTRE: Vec2 = { x: 0, y: 0.25 };
export const BOSS_LIMB_WANDER_AMP_X = 0.28;
export const BOSS_LIMB_WANDER_AMP_Y = 0.28;
/** Per-ring wander-speed multiplier on the phase wander speed (vital full, limb easier). */
export const BOSS_VITAL_WANDER_SPEED_MULT = 1.0;
export const BOSS_LIMB_WANDER_SPEED_MULT = 0.6;
/** Ring B's FIXED anatomical identity — the limb/corps colour, never `bossRingZoneAt`-read. */
export const BOSS_RING_B_ZONE: BossRingZone = "limb";
/** Decorrelating salt for ring B's seeded wander: a fixed large ODD constant XORed into the
 *  seed so ring A and ring B never share a path. Pure (a seed transform), determinism law
 *  unchanged — dev-gameplay's authored choice per the ADR-0052 lever-1 reuse map. */
export const BOSS_RING_B_SALT = 0x9e3779b1;

// --- ADR-0052 lever 3 — parry / charged windows ------------------------------------------
/** The raised-sidearm parry point, anchor-relative — a `fire` landing here (within
 *  RING_HIT_RADIUS) during a CHARGED window is a parry ("il tire sur l'arme"). */
export const BOSS_PARRY_POINT: Vec2 = { x: -0.4, y: 0.3 };
/** Parry success chip (HP) — equals a vital hit; the harder read earns the top chip. */
export const QTE_PARRY_CHIP = 2;
/** Charged shot unanswered (window closes, no parry) — the boss's big swing, one blown
 *  window; REPLACES the phase drain on that close (single charge). Energy. */
export const QTE_CHARGED_WHIFF = -10;
/** The brief damage-free stagger a successful parry opens before the BONUS EXPOSED window
 *  (dev-gameplay authored: the ADR-0052 spec fixes the reward shape but leaves the stagger
 *  DURATION open — a small "briefly staggered" beat, asserted > 0). */
export const STAGGER_SECONDS = 0.3;
/** Charged-window cadence (system constants for V1, F3-promotable): phase 2 teaches ONE
 *  charged window at this 0-based phase-window index (the 2nd window — separated from the
 *  phase-1→2 two-ring split, per Karim advisory 1); phase 3 charges every OTHER window. */
const PARRY_PHASE2_TEACH_INDEX = 1;
const PARRY_PHASE3_CHARGED_PARITY = 1;

/**
 * Whether the EXPOSED window at 0-based `phaseWindowIndex` of `phaseIndex` is a CHARGED /
 * parry window (ADR-0052 lever 3 cadence). Phase 1 (index 0) never charges (onboarding);
 * phase 2 (index 1) charges exactly the teach window; phase 3+ charges every other window.
 * Pure — a deterministic function of the two indices, no state.
 */
export function isChargedWindow(phaseIndex: number, phaseWindowIndex: number): boolean {
  if (phaseWindowIndex < 0) return false;
  if (phaseIndex === 1) return phaseWindowIndex === PARRY_PHASE2_TEACH_INDEX;
  if (phaseIndex >= 2) return phaseWindowIndex % 2 === PARRY_PHASE3_CHARGED_PARITY;
  return false;
}

// --- ADR-0052 lever 2 — interactive décor prop -------------------------------------------
/** Décor prop burst (HP) — a single-use, pure-upside chunk dropped on the boss (⅛ of 24). */
export const BOSS_DECOR_DAMAGE = 3;

// --- ADR-0052 lever 5 — ceremonial FINISHER ----------------------------------------------
/** The FINISHER hold: generous enough to click deliberately, short enough not to stall a
 *  passive player (auto-resolves on timeout). Asserted > 0. */
export const FINISHER_HOLD_SECONDS = 1.5;

// --- ADR-0052 lever 4 — in-tableau renfort pressure surge --------------------------------
/** A BLOWN window under the surge drains this (energy) INSTEAD of the phase drain — the SAME
 *  blown-window event at a higher magnitude, a single charge, the loss clock untouched. */
export const QTE_RENFORT_DRAIN = -12;
/** Scripted, seeded renfort surge descriptor (system constant for V1, F3-promotable): which
 *  phase, the 0-based phase-window onset ordinal, and its duration in windows. Reads as a
 *  lost CRS section swept in by the millennium chaos ("pas ses hommes"). */
export interface RenfortSurge {
  readonly phaseIndex: number;
  readonly onsetWindowIndex: number;
  readonly durationWindows: number;
}
export const RENFORT_SURGE: RenfortSurge = {
  phaseIndex: 2,
  onsetWindowIndex: 1,
  durationWindows: 2,
};

/**
 * Whether the EXPOSED window at 0-based `phaseWindowIndex` of `phaseIndex` falls under the
 * renfort surge (ADR-0052 lever 4). Pure, deterministic — the surge is a scripted window
 * range, never `Math.random` / `Date.now` / a per-tick cursor. This is the ONLY renfort
 * predicate; it reads two integer indices and NOTHING from the frozen level pipeline.
 */
export function isRenfortWindow(phaseIndex: number, phaseWindowIndex: number): boolean {
  if (phaseWindowIndex < 0) return false;
  if (phaseIndex !== RENFORT_SURGE.phaseIndex) return false;
  return (
    phaseWindowIndex >= RENFORT_SURGE.onsetWindowIndex &&
    phaseWindowIndex < RENFORT_SURGE.onsetWindowIndex + RENFORT_SURGE.durationWindows
  );
}

// --- Per-phase escalation table (ADR-0051 D2 / ADR-0052 lever 3) --------------------------
// SYSTEM CONSTANTS for V1 (one encounter, no curve yet) — promoted to `BossQteSpec` fields
// only when a multi-encounter curve story needs them (the ADR-0035 F3 seam). One lever moves
// per phase: EXPOSED tightens, SHIELDED lull shrinks, the tell shortens (never below the
// floor), the wander speeds up, and a missed window costs more. `parryLeadSeconds` /
// `parryWindowSeconds` are authored only for phases that carry a charged window (phase 2+).
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
  /** CHARGED-window telegraph lead, seconds (ADR-0052 lever 3). Longer than the shoot tell
   *  (a harder reactive read); asserted ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` and < the lull. Only
   *  the phases that carry a charged window author it. */
  readonly parryLeadSeconds?: number;
  /** CHARGED-window (parry) duration, seconds (ADR-0052 lever 3). Asserted ≥
   *  `PEEK_EXPOSURE_FLOOR`. Only the phases that carry a charged window author it. */
  readonly parryWindowSeconds?: number;
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
    parryLeadSeconds: 0.8,
    parryWindowSeconds: 0.7,
  },
  {
    exposedSeconds: 1.0,
    shieldedLullSeconds: 1.2,
    telegraphLeadSeconds: 0.35,
    wanderSpeed: 1.6,
    shotDrain: -8,
    parryLeadSeconds: 0.6,
    parryWindowSeconds: 0.6,
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

/** True iff the axis-aligned box (`centre` ± amp) is fully CONTAINED in the band — the
 *  colour-honesty ⊂ assertion for the lever-1 ring sub-boxes (ADR-0052 D5). */
function boxInBand(
  centre: Vec2,
  ampX: number,
  ampY: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): boolean {
  return (
    centre.x - ampX >= xMin &&
    centre.x + ampX <= xMax &&
    centre.y - ampY >= yMin &&
    centre.y + ampY <= yMax
  );
}

/**
 * Which anatomy zone the wandering RING CENTRE (anchor-relative offset) sits over (full-figure
 * commander, no G6 hostage clamp). Precedence VITAL > LIMB > OFF: a VITAL centre (the head)
 * chips the most HP, a LIMB centre (torso OR either shoulder) chips less, an OFF centre (arms /
 * legs / empty air) chips nothing. Pure geometry — no stance, no HP. Drives the phase-1 single
 * ring; the two-ring case uses FIXED identities (ADR-0052 lever 1), not this re-read.
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
// COPIED from the hostage closed-form (ADR-0034 Rev. 3) and PARAMETERISED by a wander config
// (per-phase speed + per-ring amplitude box — the hostage wander has no such knobs, ADR-0051
// D1 / ADR-0052 lever 1). Waypoint[k] is a cheap integer hash of (targetSeed, windowIndex, k)
// mapped into the amplitude box; the ring eases (smoothstep) from waypoint[k] to waypoint[k+1]
// over `legDuration`, where k = floor(t / legDuration) and `t` is the window-elapsed seconds.
// Smoothstep decelerates to ZERO velocity AT each waypoint — that momentary stillness is the
// intended fair firing window. A function of `t` ALONE (never a per-tick stepped PRNG):
// re-chunking the same total elapsed yields the same offset (replay-deterministic,
// framerate-independent). NO Math.random / Date.now anywhere.

/** Full-anatomy wander amplitude box half-extents (anchored on `BOSS_WANDER_CENTRE`) — the
 *  phase-1 single ring visits every scoring band. SYSTEM constants. */
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
 *  amplitude box [−amp, +amp]. Absolute (uncoupled); anti-jitter refines it in `bossWanderBox`. */
function rawWaypointBox(
  targetSeed: number,
  windowIndex: number,
  k: number,
  ampX: number,
  ampY: number,
): Vec2 {
  const h = hash32(targetSeed, windowIndex, k);
  const ux = (h >>> 16) / 0x10000; // [0, 1)
  const uy = (h & 0xffff) / 0x10000; // [0, 1)
  return { x: (ux * 2 - 1) * ampX, y: (uy * 2 - 1) * ampY };
}

function clampToRange(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Anti-jitter: if `raw` sits within MIN_LEG_DISPLACEMENT of `prev`, push it out to that floor
 *  and clamp back into the box, so every leg has perceptible travel. Bounded, no recursion. */
function antiJitterBox(raw: Vec2, prev: Vec2, ampX: number, ampY: number): Vec2 {
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
    x: clampToRange(prev.x + ux * BOSS_MIN_LEG_DISPLACEMENT, -ampX, ampX),
    y: clampToRange(prev.y + uy * BOSS_MIN_LEG_DISPLACEMENT, -ampY, ampY),
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
 * The seeded ring-wander offset within an amplitude box (± `ampX`/`ampY`) at window-elapsed
 * `t` seconds, for a ring whose leg lasts `legDuration`. PURE and closed-form in
 * (targetSeed, windowIndex, t, legDuration, amp): hashed waypoints, coupled only by a bounded
 * anti-jitter + speed-cap forward pass (a window is a few legs, so `k` is tiny), eased as a
 * convex blend of two in-box waypoints (stays in the box). Framerate-independent. The lever-1
 * VITAL / LIMB sub-rings pass their own sub-box amplitudes (and ring B a decorrelating seed
 * salt); the phase-1 single ring uses the full-anatomy box via `bossWander`.
 */
export function bossWanderBox(
  targetSeed: number,
  windowIndex: number,
  t: number,
  legDuration: number,
  ampX: number,
  ampY: number,
): Vec2 {
  const leg = Math.max(0, t) / legDuration;
  const k = Math.floor(leg);
  const s = smoothstep(leg - k);
  let prev = rawWaypointBox(targetSeed, windowIndex, 0, ampX, ampY);
  let wpK = prev; // canonical waypoint[k]
  let wpK1 = prev; // canonical waypoint[k+1]
  for (let i = 1; i <= k + 1; i++) {
    const next = capLeg(
      antiJitterBox(rawWaypointBox(targetSeed, windowIndex, i, ampX, ampY), prev, ampX, ampY),
      prev,
    );
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
 * The phase-1 single-ring wander offset (relative to `BOSS_WANDER_CENTRE`) — `bossWanderBox`
 * over the full-anatomy amplitude box. Byte-behaviour-identical to the V1 closed-form
 * (ADR-0051): the two-ring escalation (ADR-0052 lever 1) calls `bossWanderBox` directly with
 * the VITAL / LIMB sub-boxes; phase 1 stays exactly this.
 */
export function bossWander(
  targetSeed: number,
  windowIndex: number,
  t: number,
  legDuration: number,
): Vec2 {
  return bossWanderBox(
    targetSeed,
    windowIndex,
    t,
    legDuration,
    BOSS_WANDER_AMP_X,
    BOSS_WANDER_AMP_Y,
  );
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
/** True while the boss QTE holds the scene frozen (ZOOMING…LOST, incl. the FINISHER beat —
 *  ADR-0052 D3, so the level does not complete mid-finisher); DONE/null resume the sim. */
export function isBossQteActive(qte: BossQte | null): boolean {
  return (
    qte !== null &&
    (qte.phase === "ZOOMING" ||
      qte.phase === "ACTIVE" ||
      qte.phase === "FINISHER" ||
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
 * the authored data (never trusted — ADR-0051 D7 / ADR-0052 D5): non-finite numerics are
 * rejected (C6); `phaseCount` is a positive integer with an escalation row per phase; `bossHp`
 * and `maxBlownWindows` are positive integers; every USED phase's EXPOSED ≥
 * `PEEK_EXPOSURE_FLOOR`, its `telegraphLeadSeconds` ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` AND strictly
 * < its SHIELDED lull; the phase break telegraphs; each parry-carrying phase's
 * `parryLeadSeconds` ≥ the tell floor and < its lull, `parryWindowSeconds` ≥ the exposure
 * floor; the lever-1 ring sub-boxes are ⊂ their anatomy bands; `STAGGER_SECONDS` and
 * `FINISHER_HOLD_SECONDS` > 0; the renfort descriptor is sane; and any authored `decorProp`
 * has a finite anchor-relative position and an in-range integer `armPhaseIndex`.
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
    // ADR-0052 lever 3 — a charged-window phase (phase 2+) carries its own asserted parry
    // floors: the tell ≥ the shot-tell floor and < the lull (same shape as the normal tell,
    // longer), the window ≥ the exposure floor (answerable within reaction time).
    if (isChargedWindow(i, PARRY_PHASE2_TEACH_INDEX) || isChargedWindow(i, PARRY_PHASE3_CHARGED_PARITY)) {
      const lead = row.parryLeadSeconds;
      const win = row.parryWindowSeconds;
      if (lead === undefined || !Number.isFinite(lead) || lead < BOSS_TELEGRAPH_LEAD_FLOOR) {
        throw new Error(
          `BossPhaseTuning invariant (ADR-0052 lever 3): phase ${String(i)} parryLeadSeconds must be finite and ≥ BOSS_TELEGRAPH_LEAD_FLOOR`,
        );
      }
      if (lead >= row.shieldedLullSeconds) {
        throw new Error(
          `BossPhaseTuning invariant (ADR-0052 lever 3): phase ${String(i)} parryLeadSeconds must be STRICTLY < its SHIELDED lull`,
        );
      }
      if (win === undefined || !Number.isFinite(win) || win < PEEK_EXPOSURE_FLOOR) {
        throw new Error(
          `BossPhaseTuning invariant (ADR-0052 lever 3): phase ${String(i)} parryWindowSeconds must be finite and ≥ PEEK_EXPOSURE_FLOOR`,
        );
      }
    }
  }

  // ADR-0052 lever 1 — colour-honesty: each ring sub-box must be ⊂ its anatomy band, so the
  // ring's drawn colour equals the anatomy it sits over equals the chip it scores.
  if (
    !boxInBand(
      BOSS_VITAL_WANDER_CENTRE,
      BOSS_VITAL_WANDER_AMP_X,
      BOSS_VITAL_WANDER_AMP_Y,
      BOSS_VITAL_DX_MIN,
      BOSS_VITAL_DX_MAX,
      BOSS_VITAL_DY_MIN,
      BOSS_VITAL_DY_MAX,
    )
  ) {
    throw new Error(
      "bossQteSystem invariant (ADR-0052 lever 1): the VITAL ring sub-box must be ⊂ the head band",
    );
  }
  if (
    !boxInBand(
      BOSS_LIMB_WANDER_CENTRE,
      BOSS_LIMB_WANDER_AMP_X,
      BOSS_LIMB_WANDER_AMP_Y,
      BOSS_TORSO_DX_MIN,
      BOSS_TORSO_DX_MAX,
      BOSS_TORSO_DY_MIN,
      BOSS_TORSO_DY_MAX,
    )
  ) {
    throw new Error(
      "bossQteSystem invariant (ADR-0052 lever 1): the LIMB ring sub-box must be ⊂ the torso band",
    );
  }

  // ADR-0052 levers 3 & 5 — the stagger and finisher beats must be real positive holds.
  if (!Number.isFinite(STAGGER_SECONDS) || STAGGER_SECONDS <= 0) {
    throw new Error("bossQteSystem invariant (ADR-0052 lever 3): STAGGER_SECONDS must be > 0");
  }
  if (!Number.isFinite(FINISHER_HOLD_SECONDS) || FINISHER_HOLD_SECONDS <= 0) {
    throw new Error(
      "bossQteSystem invariant (ADR-0052 lever 5): FINISHER_HOLD_SECONDS must be > 0",
    );
  }

  // ADR-0052 lever 4 — the renfort surge descriptor is a sane, telegraphed, seeded shape.
  if (
    !Number.isInteger(RENFORT_SURGE.phaseIndex) ||
    !Number.isInteger(RENFORT_SURGE.onsetWindowIndex) ||
    RENFORT_SURGE.onsetWindowIndex < 0 ||
    !Number.isInteger(RENFORT_SURGE.durationWindows) ||
    RENFORT_SURGE.durationWindows < 1
  ) {
    throw new Error(
      "bossQteSystem invariant (ADR-0052 lever 4): the renfort surge descriptor must be an in-range, positive-duration window range",
    );
  }
  // The surge onset is telegraphed by the preceding SHIELDED lull ≥ the tell floor — asserted
  // when the surge phase is one this spec actually runs.
  if (RENFORT_SURGE.phaseIndex < spec.phaseCount) {
    const surgeLull = phaseTuning(RENFORT_SURGE.phaseIndex).shieldedLullSeconds;
    if (surgeLull < BOSS_TELEGRAPH_LEAD_FLOOR) {
      throw new Error(
        "bossQteSystem invariant (ADR-0052 lever 4): the renfort surge onset must be telegraphable (its phase lull ≥ the tell floor)",
      );
    }
  }

  // ADR-0052 lever 2 — an authored décor prop must have a finite anchor-relative position and
  // an in-range integer arm phase; absent ⇒ the additive-and-optional law (no prop, no change).
  const decorProp = spec.decorProp ?? null;
  if (decorProp !== null) {
    if (!Number.isFinite(decorProp.position.x) || !Number.isFinite(decorProp.position.y)) {
      throw new Error(
        "BossQteSpec invariant (ADR-0052 lever 2): decorProp.position must be finite (C6)",
      );
    }
    if (
      !Number.isInteger(decorProp.armPhaseIndex) ||
      decorProp.armPhaseIndex < 0 ||
      decorProp.armPhaseIndex > spec.phaseCount - 1
    ) {
      throw new Error(
        "BossQteSpec invariant (ADR-0052 lever 2): decorProp.armPhaseIndex must be an integer in [0, phaseCount − 1]",
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
    targetOffsetB: BOSS_WANDER_CENTRE,
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
    phaseWindowIndex: -1,
    chargedWindow: false,
    staggerRemaining: 0,
    decorArmed: false,
    decorConsumed: false,
    decorProp,
    smokeActive: false,
    renfortActive: false,
    finisherRemaining: 0,
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

/** True iff `(px,py)` is within `RING_HIT_RADIUS` of the anchor-relative point `(ox,oy)`. */
function withinCatch(
  px: number,
  py: number,
  anchor: Vec2,
  ox: number,
  oy: number,
): boolean {
  return Math.hypot(px - (anchor.x + ox), py - (anchor.y + oy)) <= RING_HIT_RADIUS;
}

/**
 * Which ring a `fire` struck during a NORMAL (non-charged) EXPOSED window, or `"none"`.
 * Phase 1: the single V1 ring — a hit returns its last-drawn `ringZone` (may be `off`, chip 0,
 * shot consumed). Phase 2+: two FIXED-identity rings (ADR-0052 lever 1) — ring A is VITAL, ring
 * B is LIMB; on overlap the harder VITAL read scores (deterministic tie-break). `"none"` ⇒ the
 * shot missed both rings and falls through to the body/miss classification.
 */
function ringHitZone(qte: BossQte, impactPoint: Vec2): BossRingZone | "none" {
  const hitA = withinCatch(
    impactPoint.x,
    impactPoint.y,
    qte.anchor,
    qte.targetOffset.x,
    qte.targetOffset.y,
  );
  if (qte.phaseIndex >= 1) {
    if (hitA) return "vital";
    const hitB = withinCatch(
      impactPoint.x,
      impactPoint.y,
      qte.anchor,
      qte.targetOffsetB.x,
      qte.targetOffsetB.y,
    );
    if (hitB) return BOSS_RING_B_ZONE;
    return "none";
  }
  if (hitA) return qte.ringZone;
  return "none";
}

/** The FINISHER transition seed (ADR-0052 D3): any depleting chip (ring / parry / décor) opens
 *  the ceremonial beat instead of returning WON directly. Damage-free, energyDelta 0; the
 *  +refill is paid on the FINISHER → WON resolution. */
function toFinisher(qte: BossQte): BossQteTickResult {
  return {
    qte: {
      ...qte,
      phase: "FINISHER",
      bossHp: 0,
      phaseIndex: qte.phaseCount - 1,
      stance: "SHIELDED",
      stanceRemaining: 0,
      phaseBreakRemaining: 0,
      staggerRemaining: 0,
      windowChipped: true,
      chargedWindow: false,
      telegraphActive: false,
      targetOffset: BOSS_WANDER_CENTRE,
      targetOffsetB: BOSS_WANDER_CENTRE,
      ringZone: "off",
      finisherRemaining: FINISHER_HOLD_SECONDS,
      renfortActive: false,
      smokeActive: false,
      decorArmed: false,
    },
    energyDelta: 0,
  };
}

/** Open a fresh EXPOSED window at `phaseIndex`: bumps the ordinals, decides whether it is a
 *  CHARGED / parry window (ADR-0052 lever 3), and sizes its duration (`parryWindowSeconds`
 *  when charged, else `exposedSeconds`, both ≥ the exposure floor). Pure. */
function openWindow(
  phaseIndex: number,
  windowOrdinal: number,
  phaseWindowIndex: number,
): {
  windowOrdinal: number;
  phaseWindowIndex: number;
  chargedWindow: boolean;
  stanceRemaining: number;
} {
  const nextOrdinal = windowOrdinal + 1;
  const nextPhaseWindowIndex = phaseWindowIndex + 1;
  const charged = isChargedWindow(phaseIndex, nextPhaseWindowIndex);
  const row = phaseTuning(phaseIndex);
  const dur = charged ? (row.parryWindowSeconds ?? row.exposedSeconds) : row.exposedSeconds;
  return {
    windowOrdinal: nextOrdinal,
    phaseWindowIndex: nextPhaseWindowIndex,
    chargedWindow: charged,
    stanceRemaining: Math.max(dur, PEEK_EXPOSURE_FLOOR),
  };
}

/**
 * Advance the boss QTE one tick (ADR-0051 core + ADR-0052 five levers).
 *
 * - ZOOMING: counts the zoom down; a `fire` this beat is a PANIC shot. Zoom elapses → ACTIVE.
 * - ACTIVE (ORDER MATTERS — deterministic tie-break): (1) resolve `fire` FIRST. During a normal
 *   EXPOSED window a RING HIT chips `bossHp` by the ring's zone (single V1 ring phase 1; two
 *   fixed-identity rings phase 2+, overlap → vital); during a CHARGED window a `fire` on the
 *   parry point is a PARRY (+chip, STAGGER → bonus window) and any other `fire` is a −6 panic
 *   (non-consuming); during a SHIELDED lull a `fire` on an ARMED décor prop drops it (+3, once);
 *   a depleting chip → FINISHER (lever 5); a threshold-crossing chip → the damage-free PHASE
 *   BREAK. Off-ring / shielded sprays bleed body −5. (2) Advance the SHIELDED↔EXPOSED sub-machine
 *   (with the phase-break, stagger, charged and renfort sub-states) over the FULL delta, charging
 *   each BLOWN close ONCE: a normal blown window drains the phase drain, a charged whiff −10, a
 *   renfort-flagged blown window the heavier −12 (whichever magnitude is greater — never stacked);
 *   reaching `maxBlownWindows` → LOST. (3) Derive the tell, the ring/parry reads and the
 *   décor/smoke/renfort flags for the resulting stance.
 * - FINISHER: a ceremonial hold — any `fire` OR a `FINISHER_HOLD_SECONDS` timeout → WON (+refill).
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
      let staggerRemaining = qte.staggerRemaining;
      let windowChipped = qte.windowChipped;
      let windowOrdinal = qte.windowOrdinal;
      let phaseWindowIndex = qte.phaseWindowIndex;
      let blownWindows = qte.blownWindows;
      let chargedWindow = qte.chargedWindow;
      let decorConsumed = qte.decorConsumed;
      const decorProp = qte.decorProp;
      const inBreakAtStart = qte.phaseBreakRemaining > 0;
      const inStaggerAtStart = qte.staggerRemaining > 0;

      // A chip (ring / parry / décor) that advances the phase: forcibly re-SHIELD into the
      // damage-free, telegraphed PHASE BREAK. Returns true iff a break was triggered.
      const applyPhaseBreakIfCrossed = (): boolean => {
        const newPhase = phaseIndexAt(bossHp, qte.bossHpMax, qte.phaseCount);
        if (newPhase > phaseIndex) {
          phaseIndex = newPhase;
          phaseBreakRemaining = PHASE_BREAK_SECONDS;
          stance = "SHIELDED";
          stanceRemaining = PHASE_BREAK_SECONDS;
          windowChipped = false;
          phaseWindowIndex = -1;
          chargedWindow = false;
          staggerRemaining = 0;
          return true;
        }
        return false;
      };

      // (1) Resolve the player's shot FIRST — a DEPLETING chip beats a same-tick fatal window
      // close (tie-break). Aim-honesty: rings/parry-point are the LAST-DRAWN reads.
      if (fire) {
        if (inBreakAtStart || inStaggerAtStart) {
          // An unreadable / damage-free frame — "don't shoot what you can't read".
          energyDelta += QTE_PANIC_SHOT;
        } else if (qte.stance === "EXPOSED") {
          if (qte.chargedWindow) {
            // ADR-0052 lever 3 — a CHARGED window: a shot on the parry point is a PARRY.
            const parried = withinCatch(
              impactPoint.x,
              impactPoint.y,
              qte.anchor,
              BOSS_PARRY_POINT.x,
              BOSS_PARRY_POINT.y,
            );
            if (parried) {
              bossHp = qte.bossHp - QTE_PARRY_CHIP;
              windowChipped = true;
              if (bossHp <= 0) return toFinisher(qte);
              // A threshold-crossing parry takes the (bigger) PHASE BREAK; otherwise the
              // parry reward is the STAGGER → bonus EXPOSED window (the tempo flip).
              if (!applyPhaseBreakIfCrossed()) {
                staggerRemaining = STAGGER_SECONDS;
                stance = "SHIELDED";
                stanceRemaining = STAGGER_SECONDS;
                chargedWindow = false;
              }
            } else {
              // Panic click that misses the parry point — NON-consuming (the window stays
              // open, a valid parry can still land before it closes).
              energyDelta += QTE_PANIC_SHOT;
            }
          } else {
            // Normal ring window — single V1 ring (phase 1) or two fixed rings (phase 2+).
            const zone = ringHitZone(qte, impactPoint);
            if (zone !== "none") {
              const dmg = bossColourDamage(zone);
              if (dmg > 0) {
                bossHp = qte.bossHp - dmg;
                windowChipped = true;
                if (bossHp <= 0) return toFinisher(qte);
                applyPhaseBreakIfCrossed();
              }
              // A `zone === "off"` single-ring hit chips 0 but still consumes the shot.
            } else {
              const zoneMiss = bossQteZoneAt(
                impactPoint.x - qte.anchor.x,
                impactPoint.y - qte.anchor.y,
              );
              if (zoneMiss === "body") energyDelta += QTE_BODY_HIT;
              // "miss": nothing.
            }
          }
        } else {
          // SHIELDED (not breaking / staggering): the ARMED décor prop, or an off-ring spray.
          if (
            qte.decorArmed &&
            decorProp !== null &&
            withinCatch(
              impactPoint.x,
              impactPoint.y,
              qte.anchor,
              decorProp.position.x,
              decorProp.position.y,
            )
          ) {
            // ADR-0052 lever 2 — pure upside: drop the prop for a single-use burst.
            bossHp = qte.bossHp - BOSS_DECOR_DAMAGE;
            decorConsumed = true;
            if (bossHp <= 0) return toFinisher(qte);
            applyPhaseBreakIfCrossed();
          } else {
            const zoneMiss = bossQteZoneAt(
              impactPoint.x - qte.anchor.x,
              impactPoint.y - qte.anchor.y,
            );
            if (zoneMiss === "body") energyDelta += QTE_BODY_HIT;
          }
        }
      }

      // (2) Tick the sub-machine over the FULL delta. Each iteration subtracts a strictly-
      // positive segment (lull > tell ≥ floor > 0, EXPOSED ≥ floor > 0, break / stagger > 0),
      // so `remaining` strictly decreases and the loop is provably bounded.
      let remaining = delta;
      let crossed = false;
      while (remaining >= stanceRemaining) {
        remaining -= stanceRemaining;
        crossed = true;
        if (phaseBreakRemaining > 0) {
          // The break ends → resume normal cycling at the (already-advanced) phase.
          phaseBreakRemaining = 0;
          stance = "SHIELDED";
          stanceRemaining = phaseTuning(phaseIndex).shieldedLullSeconds;
        } else if (staggerRemaining > 0) {
          // ADR-0052 lever 3 — the stagger ends → open a BONUS EXPOSED window (tempo flip).
          staggerRemaining = 0;
          const opened = openWindow(phaseIndex, windowOrdinal, phaseWindowIndex);
          stance = "EXPOSED";
          windowOrdinal = opened.windowOrdinal;
          phaseWindowIndex = opened.phaseWindowIndex;
          chargedWindow = opened.chargedWindow;
          stanceRemaining = opened.stanceRemaining;
          windowChipped = false;
        } else if (stance === "SHIELDED") {
          // Open a window at the CURRENT phase. Fresh window → not yet chipped.
          const opened = openWindow(phaseIndex, windowOrdinal, phaseWindowIndex);
          stance = "EXPOSED";
          windowOrdinal = opened.windowOrdinal;
          phaseWindowIndex = opened.phaseWindowIndex;
          chargedWindow = opened.chargedWindow;
          stanceRemaining = opened.stanceRemaining;
          windowChipped = false;
        } else {
          // Close a window. A "blown window" = an EXPOSED→SHIELDED close with the boss alive
          // AND unanswered — 0 HP chipped (normal), or a charged window whiffed (no parry).
          const closingCharged = chargedWindow;
          const closingRenfort = isRenfortWindow(phaseIndex, phaseWindowIndex);
          stance = "SHIELDED";
          stanceRemaining = phaseTuning(phaseIndex).shieldedLullSeconds;
          chargedWindow = false;
          if (bossHp > 0 && (closingCharged || !windowChipped)) {
            // ADR-0052 levers 3 & 4 — one blown window = ONE charge: the charged whiff (−10)
            // or the phase drain, then the renfort surge (−12) if flagged — whichever
            // magnitude is greater, never stacked. `blownWindows` still +1 exactly (the loss
            // clock is never accelerated by the surge).
            let drain = closingCharged ? QTE_CHARGED_WHIFF : phaseTuning(phaseIndex).shotDrain;
            if (closingRenfort) drain = Math.min(drain, QTE_RENFORT_DRAIN);
            blownWindows += 1;
            energyDelta += drain;
            if (blownWindows >= qte.maxBlownWindows) {
              return {
                qte: {
                  ...qte,
                  phase: "LOST",
                  stance,
                  stanceRemaining,
                  phaseBreakRemaining: 0,
                  staggerRemaining: 0,
                  bossHp,
                  phaseIndex,
                  windowChipped: false,
                  blownWindows,
                  windowOrdinal,
                  phaseWindowIndex,
                  chargedWindow: false,
                  telegraphActive: false,
                  targetOffset: BOSS_WANDER_CENTRE,
                  targetOffsetB: BOSS_WANDER_CENTRE,
                  ringZone: "off",
                  decorConsumed,
                  decorArmed: false,
                  smokeActive: false,
                  renfortActive: false,
                },
                energyDelta,
              };
            }
          }
        }
      }
      // Advance within the landed segment (on a crossing the segment was reset above — the
      // trailing overshoot is discarded, preserving small-delta behaviour). Count the OPEN
      // break / stagger DOWN in lockstep on non-crossing ticks (but not on the tick that
      // TRIGGERED it — so its render pulse plays under the clamped per-frame delta).
      if (!crossed) {
        stanceRemaining -= remaining;
        if (inBreakAtStart && phaseBreakRemaining > 0) {
          phaseBreakRemaining = Math.max(0, phaseBreakRemaining - remaining);
        }
        if (inStaggerAtStart && staggerRemaining > 0) {
          staggerRemaining = Math.max(0, staggerRemaining - remaining);
        }
      }

      // (3) Derive the tell + the ring / parry / flag reads for the RESULTING stance.
      const restingShield =
        stance === "SHIELDED" && phaseBreakRemaining <= 0 && staggerRemaining <= 0;
      const activeWindow =
        stance === "EXPOSED" && phaseBreakRemaining <= 0 && staggerRemaining <= 0;

      let telegraphActive = false;
      let renfortActive = false;
      if (restingShield) {
        // Reflect the UPCOMING window so the render can lead the distinct parry / renfort
        // tell during the lull; the tell shows in the last `lead` seconds of the beat.
        const upcomingCharged = isChargedWindow(phaseIndex, phaseWindowIndex + 1);
        chargedWindow = upcomingCharged;
        const row = phaseTuning(phaseIndex);
        const lead =
          upcomingCharged && row.parryLeadSeconds !== undefined
            ? row.parryLeadSeconds
            : row.telegraphLeadSeconds;
        telegraphActive = stanceRemaining <= lead;
        renfortActive = isRenfortWindow(phaseIndex, phaseWindowIndex + 1);
      } else if (activeWindow) {
        renfortActive = isRenfortWindow(phaseIndex, phaseWindowIndex);
        // `chargedWindow` already reflects the current open window (set at open).
      } else {
        // A break or stagger — no window imminent, no tell, no charge.
        chargedWindow = false;
      }

      // The OUTGOING ring offsets + cached zone. Rings show ONLY during a normal (non-charged)
      // EXPOSED window: single full-anatomy V1 ring (phase 1) or the two fixed sub-rings
      // (phase 2+). A charged window draws the parry point instead (no rings).
      let targetOffset: Vec2 = BOSS_WANDER_CENTRE;
      let targetOffsetB: Vec2 = BOSS_WANDER_CENTRE;
      let ringZone: BossRingZone = "off";
      if (activeWindow && !chargedWindow) {
        const row = phaseTuning(phaseIndex);
        const t = Math.max(0, row.exposedSeconds - stanceRemaining);
        if (phaseIndex >= 1) {
          const legA = bossWanderLegDuration(row.wanderSpeed * BOSS_VITAL_WANDER_SPEED_MULT);
          const legB = bossWanderLegDuration(row.wanderSpeed * BOSS_LIMB_WANDER_SPEED_MULT);
          const wa = bossWanderBox(
            qte.targetSeed,
            windowOrdinal,
            t,
            legA,
            BOSS_VITAL_WANDER_AMP_X,
            BOSS_VITAL_WANDER_AMP_Y,
          );
          const wb = bossWanderBox(
            (qte.targetSeed ^ BOSS_RING_B_SALT) >>> 0,
            windowOrdinal,
            t,
            legB,
            BOSS_LIMB_WANDER_AMP_X,
            BOSS_LIMB_WANDER_AMP_Y,
          );
          targetOffset = { x: BOSS_VITAL_WANDER_CENTRE.x + wa.x, y: BOSS_VITAL_WANDER_CENTRE.y + wa.y };
          targetOffsetB = { x: BOSS_LIMB_WANDER_CENTRE.x + wb.x, y: BOSS_LIMB_WANDER_CENTRE.y + wb.y };
          ringZone = "vital";
        } else {
          const legDuration = bossWanderLegDuration(row.wanderSpeed);
          const w = bossWander(qte.targetSeed, windowOrdinal, t, legDuration);
          targetOffset = { x: BOSS_WANDER_CENTRE.x + w.x, y: BOSS_WANDER_CENTRE.y + w.y };
          ringZone = bossRingZoneAt(targetOffset);
        }
      }

      // Scripted flags the render / audio read (game owns the boolean + the floor guarantee).
      const smokeActive = phaseIndex >= 2;
      const decorArmed =
        decorProp !== null &&
        !decorConsumed &&
        phaseIndex === decorProp.armPhaseIndex &&
        restingShield;

      return {
        qte: {
          ...qte,
          stance,
          stanceRemaining,
          phaseBreakRemaining,
          staggerRemaining,
          bossHp,
          phaseIndex,
          windowChipped,
          blownWindows,
          windowOrdinal,
          phaseWindowIndex,
          chargedWindow,
          telegraphActive,
          targetOffset,
          targetOffsetB,
          ringZone,
          decorConsumed,
          decorArmed,
          smokeActive,
          renfortActive,
        },
        energyDelta,
      };
    }
    case "FINISHER": {
      // ADR-0052 lever 5 — ceremonial, guaranteed-success, damage-free. A click OR a timeout
      // resolves it to WON, paying the +refill there (once). Zero failure surface.
      if (fire) {
        return {
          qte: { ...qte, phase: "WON", finisherRemaining: 0, resultRemaining: QTE_RESULT_HOLD },
          energyDelta: QTE_BOSS_REFILL,
        };
      }
      const finisherRemaining = qte.finisherRemaining - delta;
      if (finisherRemaining > 0) {
        return { qte: { ...qte, finisherRemaining }, ...NO_DELTA };
      }
      return {
        qte: { ...qte, phase: "WON", finisherRemaining: 0, resultRemaining: QTE_RESULT_HOLD },
        energyDelta: QTE_BOSS_REFILL,
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
