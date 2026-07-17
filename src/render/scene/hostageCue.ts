// Presentation-only cues for the hostage-taker QTE (ADR-0034 / bestiary §3.5).
// PURE, DOM-free, no game rules: the game (qteSystem) decides WHEN the captor
// peeks and when the duel is lost; this module only decides how the discrete
// peek TELL and the execution flash LOOK. Kept out of the R3F components so the
// colour/intensity maths is unit-testable without a canvas.
//
// Rework note (ADR-0034 D1/D6): the old continuous rising-tension tint was
// driven by the deleted `windowRemaining` countdown. With distance-as-clock the
// countdown is gone, so the tell is now a DISCRETE "NOW" event keyed off the
// game's `telegraphActive` / `stance` (UX spec §2.3): a step-change the eye can
// time, carried by motion/shape/brightness — colour never the sole channel.

import type { CaptorStance } from "@game/types/hostageQte";

// Calm captor tint (acid neon pink), the alarm red the peek/execution reads, a
// distinct acid-yellow "NOW" tell that must out-read any residual mood, white.
const CALM = "#ff8ad8";
const ALARM = "#ff1e2d";
const TELL = "#fff27a";
const WHITE = "#ffffff";

/** Clamp to the unit interval. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
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
 * The discrete peek TELL / peek window visual (ADR-0034 D2/D3, UX spec §2). Not
 * a continuous tension ramp: it is OFF until the game raises `telegraphActive`
 * (the G4 wind-up, before the exposure) and then holds through the `PEEKING`
 * open window. `intensity` drives a localised brightness/scale pulse the render
 * lane also carries as motion/shape (never colour alone — a11y §4.2), `color`
 * only reinforces: acid `TELL` for the wind-up, `ALARM` for the open danger
 * window. Under `reducedMotion` the pulse is dropped for a STEADY appearing cue
 * (no strobe, WCAG 2.3.1) — the signal is preserved, only the animation degrades.
 */
export interface PeekTellVisual {
  /** Whether the tell is drawn at all this frame. */
  readonly active: boolean;
  /** [0,1] brightness/scale driver for the localised cue at the peek point. */
  readonly intensity: number;
  /** Reinforcing colour only — the tell is legible without it (form/position). */
  readonly color: string;
}

export function peekTellVisual(
  telegraphActive: boolean,
  stance: CaptorStance,
  pulse01: number,
  reducedMotion: boolean,
): PeekTellVisual {
  const peeking = stance === "PEEKING";
  if (!telegraphActive && !peeking) {
    return { active: false, intensity: 0, color: TELL };
  }
  const color = peeking ? ALARM : TELL;
  if (reducedMotion) {
    // Steady appearing cue — no pulse. Signal preserved: brighter for the open
    // window than for the wind-up, so the two beats are still distinguishable.
    return { active: true, intensity: peeking ? 1 : 0.6, color };
  }
  // Motion: a brightness pulse the eye can time. The open peek holds near full;
  // the wind-up sits lower and clearly quieter, so the exposure reads as louder.
  const p = clamp01(pulse01);
  const intensity = peeking ? 0.7 + 0.3 * p : 0.35 + 0.35 * p;
  return { active: true, intensity, color };
}

/**
 * The captor sprite's reinforcing tint given his `stance` and the pre-peek tell.
 * Calm pink while COVERED, warming as the wind-up shows, alarm-leaning during
 * the exposure — a REINFORCEMENT of the pose/head-emergence read (§4.2), not the
 * sole carrier of COVERED-vs-PEEKING.
 */
export function captorTint(stance: CaptorStance, telegraphActive: boolean): string {
  if (stance === "PEEKING") return lerpHex(CALM, ALARM, 0.65);
  if (telegraphActive) return lerpHex(CALM, ALARM, 0.3);
  return CALM;
}

/**
 * The LOST execution flash tint. Under motion it strobes ALARM↔WHITE on the
 * caller's `pulse01`; under `reducedMotion` it degrades to a STEADY alarm red
 * (no >3 Hz flash, WCAG 2.3.1) — the "she was executed" read is preserved, only
 * the strobe animation is removed.
 */
export function hostageAlarmColor(pulse01: number, reducedMotion: boolean): string {
  if (reducedMotion) return ALARM;
  return lerpHex(ALARM, WHITE, clamp01(pulse01));
}

/**
 * The floating label for a non-zero energy delta (ADR-0034 §D5 "energy is the
 * sole outcome currency"): e.g. "−25 ⚡" for a bavure, "+10 ⚡" for a rescue
 * refill. Returns null for a zero/absent delta so only the outcomes float a
 * number. Loss reads warm-red, gain reads acid-green — the house feedback palette.
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
