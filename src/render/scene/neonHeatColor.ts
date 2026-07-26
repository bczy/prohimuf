/**
 * Pure, DOM-free heat-ramp helpers for the enemy neon rim (ADR-0025).
 *
 * The rim colour is a gameplay feedback signal: the longer a hostile stays
 * exposed this appearance, the hotter its silhouette glows — green when it just
 * popped up, lingering through orange, to red as its window to be shot closes.
 * Both helpers are numeric-only so they unit-test without a browser or Three,
 * mirroring {@link ./haloFalloff}. The render layer feeds them the fields it
 * already holds (`enemy.state`, `enemy.timer`, `ARCHETYPES[kind].visibleDuration`)
 * — no game-logic change (boundary law, CLAUDE.md).
 */
import type { EnemyState } from "@game/types/enemy";

/** Normalized (0..1) RGB triple, three-friendly for a `Color`/uniform. */
export type Rgb = readonly [number, number, number];

/** Colour stop on the heat ramp: `at` is the progress it anchors, `rgb` is 0..1. */
interface Stop {
  readonly at: number;
  readonly rgb: Rgb;
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/**
 * The codebase's ONE green/amber/red state triple. Green and orange are bible
 * accents (docs/art-direction.md §2 law 1 / §2.1); the red is a deliberate
 * non-palette "time's up" urgency hue (see ADR-0025).
 *
 * Exported since the art gate's finding G5 — « green/amber/red as a state language
 * needs one anchored triple, or every feature will mint its own ». The energy aura
 * (`@render/effects/energyGlow`) consumes these exact three rather than inventing a
 * second ramp, so a future bible amendment moves both at once.
 *
 * The wide flat orange band (0.35→0.70) below is the ENEMY ramp's own shaping —
 * « passant par le orange plus longtemps » — not part of the shared anchors.
 */
export const STATE_GREEN = "#78FF3C";
export const STATE_AMBER = "#FF8C14";
export const STATE_RED = "#FF3030";

const GREEN = STATE_GREEN;
const ORANGE = STATE_AMBER;
const RED = STATE_RED;

const STOPS: readonly Stop[] = [
  { at: 0.0, rgb: hexToRgb(GREEN) },
  { at: 0.35, rgb: hexToRgb(ORANGE) },
  { at: 0.7, rgb: hexToRgb(ORANGE) },
  { at: 1.0, rgb: hexToRgb(RED) },
];

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Per-channel linear interpolation between two colour stops (fresh tuple). */
function lerp(a: Rgb, b: Rgb, f: number): Rgb {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/**
 * Map a 0..1 progress to a neon heat colour (normalized RGB): green → orange
 * (held) → red, piecewise-linear between {@link STOPS}. Progress is clamped, so
 * out-of-range inputs pin to the green/red ends.
 */
export function heatColor(progress: number): Rgb {
  const t = clamp01(progress);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (a === undefined || b === undefined) continue;
    if (t >= a.at && t <= b.at) {
      const span = b.at - a.at;
      return lerp(a.rgb, b.rgb, span > 0 ? (t - a.at) / span : 0);
    }
  }
  // t is clamped to [0,1] and STOPS spans 0..1, so a bracket always matches;
  // the last stop is the exhaustive fallback for the unreachable tail. Return a
  // copy so the module-level stop colour can never be mutated by a caller.
  const last = STOPS[STOPS.length - 1];
  return last === undefined ? [1, 1, 1] : [last.rgb[0], last.rgb[1], last.rgb[2]];
}

/**
 * Progress (0..1) of a hostile's CURRENT appearance, from render-available
 * fields. `timer` is a per-state COUNTDOWN (see enemySystem.tickEnemy), so
 * elapsed-in-VISIBLE = `visibleDuration − timer`. Green at pop-up, red as the
 * visible window expires / it starts shooting.
 */
export function heatProgress(state: EnemyState, timer: number, visibleDuration: number): number {
  switch (state) {
    case "APPEARING":
      return 0;
    case "VISIBLE":
      return visibleDuration > 0 ? clamp01(1 - timer / visibleDuration) : 0;
    case "SHOOTING":
    case "HIT":
      return 1;
    default:
      return 0;
  }
}
