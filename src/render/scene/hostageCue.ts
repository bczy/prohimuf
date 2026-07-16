// Presentation-only cues for the hostage-taker QTE (ADR-0030 / bestiary §3.5).
// PURE, DOM-free, no game rules: the game (qteSystem) decides WHEN the window
// runs out and the hostage is executed; this module only decides how the
// rising-tension countdown and the execution flash LOOK. Kept out of the R3F
// components so the colour maths is unit-testable without a canvas.

// Calm captor tint (acid neon pink) and the alarm red the cue climbs toward as
// the execution countdown runs down.
const CALM = "#ff8ad8";
const ALARM = "#ff1e2d";
const WHITE = "#ffffff";

/** Clamp to the unit interval. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Rising tension in [0,1] from the execution countdown: 0 at full time
 * remaining, 1 as it reaches zero. `reference` is the countdown's starting value
 * (the window archetype's `visibleDuration`, or the street entity's spawn timer
 * tracked render-side). A non-positive reference degrades to full tension so a
 * bad denominator never reads as "calm".
 */
export function hostageTension(remaining: number, reference: number): number {
  if (reference <= 0) return 1;
  return clamp01(1 - remaining / reference);
}

// Parse "#rrggbb" into [r,g,b] bytes.
function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number): string =>
    Math.round(clamp01(v / 255) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear interpolation between two "#rrggbb" colours (t clamped to [0,1]). */
export function lerpHex(a: string, b: string, t: number): string {
  const k = clamp01(t);
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k);
}

/**
 * The tint the QTE captor's sprite multiplies by, given the rising `tension`
 * (0 calm → 1 out-of-time, from `hostageTension`) and a [0,1] `pulse` phase (a
 * sine the caller advances each frame). It climbs from calm pink toward alarm
 * red as tension rises, the pulse brightening it more the tenser it gets. When
 * `alarm` is set (the hostage is being executed / the QTE is lost) it
 * hard-strobes red↔white — the distinct execution flash.
 */
export function hostageColor(tension: number, pulse01 = 0, alarm = false): string {
  if (alarm) return lerpHex(ALARM, WHITE, pulse01);
  const t = clamp01(tension);
  const base = lerpHex(CALM, ALARM, t);
  return lerpHex(base, WHITE, pulse01 * t * 0.5);
}

/**
 * The floating label for a non-zero energy delta (ADR-0030 §3.5 "feedback chiffré
 * … énergie"): e.g. "−25 ⚡" for a bavure, "+10 ⚡" for a recovery. Returns null
 * for a zero/absent delta so only the hostage outcomes float an energy number.
 * Loss reads warm-red, gain reads acid-green — the house feedback palette.
 */
export function energyFloater(
  energyDelta: number | undefined,
): { text: string; color: string } | null {
  if (energyDelta === undefined || energyDelta === 0) return null;
  const sign = energyDelta > 0 ? "+" : "−"; // U+2212 MINUS SIGN
  return {
    text: `${sign}${String(Math.abs(energyDelta))} ⚡`,
    color: energyDelta > 0 ? "#bfffd0" : "#ff6b6b",
  };
}
