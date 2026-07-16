import type { HostageQte, QteSpec, QteZone, QteBodyPart } from "@game/types/hostageQte";
import type { Vec2 } from "@game/types/vector";

// Hostage-taker cinematic QTE (ADR-0030). Pure logic: zero React/Three,
// unit-tested. The scene freezes, the camera zooms onto the captor, then a timed
// window opens to shoot his body parts before he executes the hostage (the cartel
// boss's daughter). All magnitudes below are game-designer DEFAULTS — tunable.

export const QTE_ZOOM_SECONDS = 2;
export const QTE_WINDOW_SECONDS = 5;
// On-screen hold of the WON/LOST verdict before the scene resumes — long enough
// to actually read the stamped "OTAGE SAUVÉE / PERDUE" over the zoomed tableau.
export const QTE_RESULT_HOLD = 2.2;
export const CAPTOR_HP_MAX = 4;
export const HOSTAGE_HP_MAX = 3;

// Per-part lethality. Head is a one-shot kill (== CAPTOR_HP_MAX); torso medium;
// limbs merely chip — so precise aim is rewarded and body-shots take several hits.
export const PART_DAMAGE: Record<QteBodyPart, number> = { head: 4, torso: 2, arm: 1, legs: 1 };

interface QteOutcome {
  readonly scoreDelta: number;
  readonly energyDelta: number;
}

// Successful rescue: a SIDE-OBJECTIVE bonus (never advances the kill quota).
export const QTE_SUCCESS: QteOutcome = { scoreDelta: 8, energyDelta: 15 };
// Every stray hit on the hostage: "lose a lot" (energy), per bestiary §3.2.
export const HOSTAGE_HIT_PENALTY: QteOutcome = { scoreDelta: -3, energyDelta: -25 };
// Timeout: the window elapsed with the captor alive — he executes her.
export const QTE_TIMEOUT_PENALTY: QteOutcome = { scoreDelta: -2, energyDelta: -15 };

/**
 * Which zone a shot at world offset (dx, dy) from the captor anchor strikes.
 * Bands are world units (y up), traced against the street tableau the render
 * draws (HostageQteSprite): the captor on a square 2.0 plane centred on the
 * anchor (visible figure ≈1.9 tall), the kneeling daughter on a square 1.3
 * plane at anchor+(0.3, −0.35), held at his front-right. Outside the tableau
 * silhouette is a wasted shot.
 */
export function qteZoneAt(dx: number, dy: number): QteZone {
  if (Math.abs(dx) > 0.85 || dy < -1.05 || dy > 1.05) return "miss";
  // The kneeling daughter (structural hostage-PRECEDENCE): her body fills the
  // captor's lower-front (dx > −0.35 below his waistline), and her head strip
  // rises to dy ≈ 0.2 around dx 0.05..0.62 — both resolve to "hostage" first.
  if ((dy < -0.05 && dx > -0.35) || (dy < 0.2 && dx > 0.05 && dx < 0.62)) return "hostage";
  if (dy >= 0.6 && Math.abs(dx) <= 0.3) return "head";
  if (dy >= -0.05) return Math.abs(dx) >= 0.32 ? "arm" : "torso";
  return "legs"; // low-left of the tableau — his visible leg beside her
}

/** Damage dealt to the captor by a shot in `zone` (0 for hostage/miss). */
function damageForPart(zone: QteZone): number {
  return zone === "head" || zone === "torso" || zone === "arm" || zone === "legs"
    ? PART_DAMAGE[zone]
    : 0;
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

/** Seed a fresh QTE in the ZOOMING phase with full timers and health. */
export function createQte(spec: QteSpec): HostageQte {
  return {
    phase: "ZOOMING",
    captorHp: spec.captorHp,
    captorHpMax: spec.captorHp,
    hostageHp: spec.hostageHp,
    hostageHpMax: spec.hostageHp,
    zoomRemaining: spec.zoomSeconds,
    zoomSeconds: spec.zoomSeconds,
    windowRemaining: spec.windowSeconds,
    windowSeconds: spec.windowSeconds,
    resultRemaining: QTE_RESULT_HOLD,
    anchor: spec.anchor,
    warning: true,
  };
}

export interface QteTickResult {
  readonly qte: HostageQte;
  // Score/energy deltas from THIS tick (transition-only; never re-charged). The
  // caller folds them into GameState.score / energy.
  readonly scoreDelta: number;
  readonly energyDelta: number;
}

const NO_DELTA = { scoreDelta: 0, energyDelta: 0 } as const;

/**
 * Advance the QTE one tick. During ZOOMING no shots count; during ACTIVE a `fire`
 * resolves against the body-part zones (captor damage) or the hostage (penalty).
 * The captor dying → WON (one-time bonus); the hostage dying or the window
 * expiring → LOST (one-time penalty). WON/LOST hold briefly, then DONE.
 */
export function tickQte(
  qte: HostageQte,
  fire: boolean,
  impactPoint: Vec2,
  delta: number,
): QteTickResult {
  switch (qte.phase) {
    case "ZOOMING": {
      const zoomRemaining = qte.zoomRemaining - delta;
      if (zoomRemaining > 0) return { qte: { ...qte, zoomRemaining }, ...NO_DELTA };
      // Zoom finished → open the shootable window and drop the warning.
      return { qte: { ...qte, phase: "ACTIVE", zoomRemaining: 0, warning: false }, ...NO_DELTA };
    }
    case "ACTIVE": {
      let captorHp = qte.captorHp;
      let hostageHp = qte.hostageHp;
      let phase: HostageQte["phase"] = "ACTIVE";
      let scoreDelta = 0;
      let energyDelta = 0;

      if (fire) {
        const zone = qteZoneAt(impactPoint.x - qte.anchor.x, impactPoint.y - qte.anchor.y);
        if (zone === "hostage") {
          hostageHp = Math.max(0, hostageHp - 1);
          scoreDelta += HOSTAGE_HIT_PENALTY.scoreDelta;
          energyDelta += HOSTAGE_HIT_PENALTY.energyDelta;
          if (hostageHp <= 0) phase = "LOST"; // she died — the per-hit penalty stands
        } else {
          const dmg = damageForPart(zone);
          if (dmg > 0) {
            captorHp = Math.max(0, captorHp - dmg);
            if (captorHp <= 0) {
              phase = "WON";
              scoreDelta += QTE_SUCCESS.scoreDelta;
              energyDelta += QTE_SUCCESS.energyDelta;
            }
          }
        }
      }

      const windowRemaining = qte.windowRemaining - delta;
      // Timeout only if the shot did not already resolve the QTE this tick. The
      // once-only guarantee for every terminal outcome is STRUCTURAL: ACTIVE is
      // left exactly once (phase machine is forward-only), and the WON/LOST hold
      // and DONE branches below return NO_DELTA.
      if (phase === "ACTIVE" && windowRemaining <= 0) {
        phase = "LOST";
        scoreDelta += QTE_TIMEOUT_PENALTY.scoreDelta;
        energyDelta += QTE_TIMEOUT_PENALTY.energyDelta;
      }

      return {
        qte: {
          ...qte,
          phase,
          captorHp,
          hostageHp,
          windowRemaining: Math.max(0, windowRemaining),
        },
        scoreDelta,
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
