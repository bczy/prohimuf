/**
 * planCalibration.mjs — build align-windows.mjs's per-level detection config
 * FROM A PLAN's calibration point of departure (SP2 §2.3, T4), so a generated
 * level never needs a hand-written `LEVEL_CFG` entry.
 *
 * Pure and network/DOM-free: no facade image is read here, only the plan's own
 * `calibration` block. align-windows.mjs injects the returned cfg into its
 * `LEVEL_CFG` map for the generated level's id (the same pattern
 * align-troncon.mjs already uses to add its own namespaced ids) — this module
 * itself never touches that map.
 */

/** Same warm-glow test align-windows.mjs's DEFAULT_WARM uses (duplicated here
 * deliberately: a pure predicate, not worth threading a shared import for). */
export function defaultWarm(r, g, b) {
  return r > 78 && r - b > 12 && r + g + b > 120;
}

// A generic facade's column pitch, as an EXPECTED column count, calibrated off
// vitry's proven tuning (its most recent committed LEVEL_CFG entry) — the
// baseline this function scales from when a plan asks for a different count.
const BASELINE_EXPECTED_COLS = 13;
// Clamp the scale factor so an extreme expectedCols (very small or very large)
// can never collapse a tolerance to zero or blow it up past a sane facade.
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

/**
 * levelCfgFromPlan(plan) -> LEVEL_CFG-shaped detection config.
 *
 * Throws when the plan has no `calibration` — phase (b) refuses to run for a
 * level that hasn't declared its point of departure yet (spec §2.3: "pas de
 * LEVEL_CFG manuel de repli pour un level généré").
 */
export function levelCfgFromPlan(plan) {
  if (!plan.calibration) {
    throw new Error(
      `levelCfgFromPlan: plan "${plan.id}" has no "calibration" block — phase (b) ` +
        `exige calibration dans le plan (spec-level-harness-sp2 §2.3); a generated ` +
        `level with no calibration cannot run align-windows yet.`,
    );
  }
  const { windowBand, expectedCols } = plan.calibration;
  const scaleRaw = expectedCols ? BASELINE_EXPECTED_COLS / expectedCols : 1;
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRaw));
  return {
    rowMode: "runs",
    band: [windowBand.top, windowBand.bottom],
    rowSmooth: 0.005,
    rowDetrend: 0.04,
    rowThresh: 0.02,
    rowGapMerge: 0.008,
    rowMinH: 0.01,
    rowHalf: 0.028,
    colSmooth: 3,
    colThresh: 0.14,
    twinMerge: 0.025 * scale,
    minPitch: 0.07 * scale,
    splitPitch: 0.1 * scale,
    minRunW: 0.022 * scale,
    openingW: 0.065 * scale,
    openingH: 0.072,
    probeH: 0.08,
    warm: defaultWarm,
  };
}
