/**
 * Pure, DOM-free energy → glow-colour ramp for the per-entity auras.
 *
 * The aura around the key sprites (hostage, captor, boss, crate) is a second,
 * peripheral read of the SAME number the HUD energy gauge shows: the player
 * should feel their state dropping without leaving the tableau to check a bar.
 * Green at full → yellow at half → red at empty, interpolated continuously so
 * the drift is felt before any threshold is crossed.
 *
 * Numeric-only, so it unit-tests without a browser or Three — same contract as
 * {@link ../scene/neonHeatColor} (which is a different signal: that one ramps on a
 * hostile's EXPOSURE timer, this one on the player's energy; they are deliberately
 * kept apart so re-tuning one never moves the other).
 */

/** Normalized (0..1) RGB triple, three-friendly for a `Color`/uniform. */
export type Rgb = readonly [number, number, number];

/** Full energy: the acid green of the signage triad. */
export const ENERGY_FULL = "#00FF64";
/** Half energy. */
export const ENERGY_HALF = "#FFD400";
/** Empty: the same urgency red the enemy heat ramp ends on. */
export const ENERGY_EMPTY = "#FF3030";

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

const EMPTY = hexToRgb(ENERGY_EMPTY);
const HALF = hexToRgb(ENERGY_HALF);
const FULL = hexToRgb(ENERGY_FULL);

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function lerp(a: Rgb, b: Rgb, f: number): Rgb {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/**
 * Glow colour for an energy percentage.
 *
 * @param energyPct `GameState.energy`, 0..100. Clamped, so an out-of-range or
 *                  non-finite value pins to the red/green ends rather than
 *                  producing a colour outside the ramp.
 * @returns A FRESH normalized RGB triple (never a shared module constant, so a
 *          caller writing into it cannot poison the ramp).
 */
export function energyGlowColor(energyPct: number): Rgb {
  const t = clamp01(energyPct / 100);
  // Two equal halves: red → yellow over 0–50%, yellow → green over 50–100%.
  return t <= 0.5 ? lerp(EMPTY, HALF, t / 0.5) : lerp(HALF, FULL, (t - 0.5) / 0.5);
}
