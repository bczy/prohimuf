// Presentation-only cues for the hostage-taker QTE (ADR-0034 / bestiary §3.5).
// PURE, DOM-free, no game rules: the game (qteSystem) decides WHEN the captor
// peeks and when the duel is lost; this module only decides how the discrete
// peek TELL and the execution flash LOOK. Kept out of the R3F components so the
// colour/intensity maths is unit-testable without a canvas.
//
// Rework note (the static duel, revises ADR-0034 D1/D6): the old continuous
// rising-tension tint was driven by the deleted `windowRemaining` countdown.
// With the blown-peeks count as the clock the countdown is gone, so the tell is
// now a DISCRETE "NOW" event keyed off the game's `telegraphActive` / `stance`
// (UX spec §2.3): a step-change the eye can time, carried by motion/shape/
// brightness — colour never the sole channel. The blown-peeks proximity is
// surfaced diegetically (Flag B) via `blownPeeksProximity`/`hostageDistressTint`
// below, NOT a HUD bar.

import type { CaptorStance, RingZone } from "@game/types/hostageQte";

// Calm captor tint (acid neon pink), the alarm red the peek/execution reads, a
// distinct acid-yellow "NOW" tell that must out-read any residual mood, white.
const CALM = "#ff8ad8";
const ALARM = "#ff1e2d";
const TELL = "#fff27a";
const WHITE = "#ffffff";

// The reticle-ring colours for the spatial-colour model (ADR-0034 revision). The
// GAME owns the anatomy `RingZone` under the ring; the RENDER owns this colour map
// — the game never names a colour. `vital` reads GREEN (lethal — "shoot now"),
// `limb` YELLOW (partial chip), `off` RED (over empty space — a wasted shot).
const RING_VITAL = "#39ff14"; // acid green — the lethal payoff zone
const RING_LIMB = "#ffe23d"; // acid yellow — a partial-damage limb hit
const RING_OFF = ALARM; // red — the ring is over empty space (0 damage)

/**
 * The captor's tint during the WON hold: a resolved acid-green, NOT the PEEKING
 * danger red (the tick keeps `stance: "PEEKING"` through the win, so the render
 * lane must not read it as an open danger window). Steady — reduced-motion-safe by
 * construction — and green-leaning so it echoes the "OTAGE SAUVÉE" verdict, clearly
 * disjoint from the ALARM red of the LOST strobe.
 */
export const CAPTOR_WON_TINT = "#7dffb0";

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
 * Flag B — the diegetic blown-peeks proximity in [0,1] (replaces the removed HUD
 * clock). As `blownPeeks` climbs toward `maxBlownPeeks` the captor nears executing
 * the hostage; the render lane uses this to escalate an in-world menace/distress
 * read so the player FEELS "he's about to do it" without a HUD bar. `maxBlownPeeks`
 * is asserted ≥ 1 in the game, but guarded here (≤ 0 ⇒ 0) so the render is total.
 */
export function blownPeeksProximity(blownPeeks: number, maxBlownPeeks: number): number {
  if (maxBlownPeeks <= 0) return 0;
  return clamp01(blownPeeks / maxBlownPeeks);
}

/**
 * Flag B — the hostage's distress tint given the blown-peeks `proximity`: untinted
 * white at 0 (art reads as authored), warming toward alarm red as the execution
 * nears. A STEADY escalation (no strobe, no pulse), so it is reduced-motion-safe
 * by construction — the tint IS the escalation channel, no motion required. Blends
 * only 70% of the way to full alarm so the LOST execution strobe still reads as a
 * distinct step beyond the build-up.
 */
export function hostageDistressTint(proximity: number): string {
  return lerpHex(WHITE, ALARM, clamp01(proximity) * 0.7);
}

/**
 * The reticle-ring colour for the anatomy `zone` under it (spatial-colour model).
 * The GAME classifies the zone (`qte.ringZone`); the RENDER maps it to a colour
 * here — `vital` GREEN (lethal payoff), `limb` YELLOW (partial), `off` RED (over
 * empty space, wasted). Colour is never the sole channel: it is paired with
 * `ringZoneEmphasis` (a brightness/size/thickness cue) so the read survives without
 * hue (a11y §4.2). Total over the closed `RingZone` union (no default needed).
 */
export function ringZoneColour(zone: RingZone): string {
  switch (zone) {
    case "vital":
      return RING_VITAL;
    case "limb":
      return RING_LIMB;
    case "off":
      return RING_OFF;
  }
}

/**
 * The NON-colour channel paired with `ringZoneColour` (a11y): a [0,1] emphasis the
 * render lane maps to the ring's brightness/opacity, radius and thickness. `vital`
 * reads brightest/largest (the payoff brightens/pulses), `off` dim/thin (a wasted
 * shot barely registers), `limb` between — so the vital/limb/off read is legible in
 * grayscale, colour only reinforcing it. Total over the closed `RingZone` union.
 */
export function ringZoneEmphasis(zone: RingZone): number {
  switch (zone) {
    case "vital":
      return 1;
    case "limb":
      return 0.6;
    case "off":
      return 0.28;
  }
}

/**
 * DIEGETIC captor-HP read (U-1, no HUD bar): whether the pip at `pipIndex` (0-based)
 * is lit for the current `captorHp`. A row of pips lights one per remaining HP and
 * depletes as the captor is chipped; depletion-by-presence is reduced-motion-safe by
 * construction (no strobe). Pure and total — negative indices/HP read unlit.
 */
export function captorHpPipLit(pipIndex: number, captorHp: number): boolean {
  return pipIndex >= 0 && pipIndex < captorHp;
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
