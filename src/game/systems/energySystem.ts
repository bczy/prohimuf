// Continuous `energy` stat (0–100), introduced by ADR-0004 D5 / ADR-0030 for the
// hostage-taker's "lose a lot / lose a little" magnitudes that the discrete lives
// counter cannot express. Pure arithmetic + clamp; the hostage taker is the first
// and only V1 consumer. Reaching 0 has NO special effect beyond the clamp (no
// death, no game-over — YAGNI, ADR-0004 D5 scope fence).
export const ENERGY_MAX = 100;
export const ENERGY_MIN = 0;
export const ENERGY_INITIAL = 100;

/** Apply an energy delta, clamped to [0, 100]. */
export function applyEnergy(current: number, delta: number): number {
  return Math.max(ENERGY_MIN, Math.min(ENERGY_MAX, current + delta));
}
