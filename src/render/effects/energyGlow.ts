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
 * {@link ../scene/neonHeatColor}. That module carries a DIFFERENT signal (a
 * hostile's exposure timer, not the player's energy) but the two now share their
 * colour ANCHORS on purpose: one green/amber/red state language, not two (art gate
 * finding G5). The shaping stays per-feature — the enemy ramp lingers in orange,
 * this one is two even halves.
 */

import { STATE_AMBER, STATE_GREEN, STATE_RED } from "@render/scene/neonHeatColor";

/** Normalized (0..1) RGB triple, three-friendly for a `Color`/uniform. */
export type Rgb = readonly [number, number, number];

/**
 * Anchors, re-pointed at the shared state triple after the art gate's finding G5
 * (2026-07-25): the first cut minted `#00FF64 / #FFD400 / #FF3030` locally, and
 * `#FF3030` in particular is a red that exists nowhere in the palette. There is now
 * exactly ONE green/amber/red ramp in the codebase — the enemy heat ramp's anchors,
 * two of which are bible accents (§2 law 1) — and both features import it, so a
 * bible amendment moves them together instead of one drifting from the other.
 */
export const ENERGY_FULL = STATE_GREEN;
export const ENERGY_HALF = STATE_AMBER;
export const ENERGY_EMPTY = STATE_RED;

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
