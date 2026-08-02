import { hash32, smoothstep } from "@game/systems/hash";
import type { Box, CoverWindows, PhotoInstant, SubjectKeyframe } from "@game/types/photoQte";
import type { Vec2 } from "@game/types/vector";

/**
 * The photo QTE "paparazzi" set-piece — PURE rules (spec-photo-qte-paparazzi Rev.5,
 * techplan §2.3). No React, no Three, no device vocabulary, no wall clock, no
 * `Math.random`, no `Date.now`, no per-tick PRNG cursor (F11). Everything is a function of
 * the authored spec, the runtime record and a scalar delta — which is what makes
 * `[ RECOMMENCER ]` byte-identical (AC10).
 *
 * Geometry lives on the `100 × 56.25` su scene plate (spec §0) and never touches world
 * coordinates.
 */

// ─── The plate and the lens (spec §0, §3.1) ──────────────────────────────────────────────

export const PLATE_WIDTH = 100.0;
export const PLATE_HEIGHT = 56.25;
/** 16:9. The plate, the viewfinder and all three instant boxes share it, which is what
 *  makes the sway ellipse isotropic in FRAME FRACTIONS and F5 identical on both axes. */
export const PLATE_ASPECT = 1.7778;

export const FOCAL_MIN = 35;
export const FOCAL_MAX = 300;
/** `fovW(f) = 3500 / f` su — `f = 35` frames the whole plate, `f = 300` frames 11.67 su. */
export function fovWidthAt(focalMm: number): number {
  return 3500 / focalMm;
}
/** Seconds for `u: 0 → 1` at max input rate. Sized against the 1.8 s telegraph budget. */
export const ZOOM_TRAVERSE_SECONDS = 2.2;

// ─── Composition (spec §3.2) ─────────────────────────────────────────────────────────────

/** 4 % of each axis clear around the subject box: the "must not touch the edge" rule AND
 *  the sway's working room — the two are ONE budget (K-1, §3.3.a). */
export const FRAME_MARGIN = 0.04;
export const FILL_MIN = 0.45;
/** DERIVED, never authored twice: at `FILL_MAX` the raw slack IS the margin, so `s_eff = 0`
 *  and any sway at all breaks the hold — greedy-tight framing is self-punishing by
 *  construction rather than by a rule. */
export const FILL_MAX = 1 - 2 * FRAME_MARGIN;

// ─── Sway (spec §3.3 / §3.4) ─────────────────────────────────────────────────────────────

/** Peak displacement of the viewfinder centre, in su. R2-1 CEILING: ≤ 2.10 su — above that
 *  F5a breaches on the MASTER instant. 2.00 keeps ≈ 5 pp of headroom on both binding cells
 *  (54.1 % master / 75.1 % plaque) instead of the 0.0 % a 2.131 su fit would leave. */
export const SWAY_AMP_X = 2.0;
/** DERIVED (`SWAY_AMP_X / PLATE_ASPECT`), never authored twice — isotropy in frame fractions. */
export const SWAY_AMP_Y = SWAY_AMP_X / PLATE_ASPECT;
export const SWAY_LEG_DURATION = 0.55;
/** Reduced motion: same amplitude, longer legs, LINEAR easing — so every §7 floor is
 *  byte-identical between the two modes and RM players inherit the same fairness. */
export const SWAY_LEG_DURATION_RM = 1.3;
export const MIN_LEG_DISPLACEMENT = 0.5;
export const MAX_LEG_DISPLACEMENT = 2.6;
/** Viewfinder pan authority at full input, both devices (D-I, ratified). F5c:
 *  `≥ 3.103 (fastest subject) + 7.09 (peak sway) = 10.19`, with 18 % headroom. */
export const PAN_RATE_MAX = 12.0;

// ─── The single subject evaluator (D-C, F12) ─────────────────────────────────────────────

/**
 * The subject box at scene time `t` — THE only evaluator (D-C). Linear on all four
 * components between consecutive keyframes, CLAMPED (never extrapolated) outside the
 * authored domain, so it is total and finite on `[0, sceneDuration]` (F12(3)).
 *
 * The AF brackets and the T3/T4 tests both read the value this returns, carried once per
 * tick on `PhotoQte.subjectBox`: there is no second place that CAN compute it, which is
 * what makes F12(1a) structural instead of a convention.
 */
export function subjectBoxAt(track: readonly SubjectKeyframe[], t: number): Box {
  const first = track[0];
  const last = track[track.length - 1];
  /* c8 ignore next */
  if (!first || !last) throw new Error("photoQte: subjectTrack is empty");
  if (t <= first.t) return { cx: first.cx, cy: first.cy, w: first.w, h: first.h };
  if (t >= last.t) return { cx: last.cx, cy: last.cy, w: last.w, h: last.h };
  for (let i = 1; i < track.length; i++) {
    const b = track[i];
    const a = track[i - 1];
    /* c8 ignore next */
    if (!a || !b) continue;
    if (t <= b.t) {
      const u = (t - a.t) / (b.t - a.t);
      return {
        cx: a.cx + (b.cx - a.cx) * u,
        cy: a.cy + (b.cy - a.cy) * u,
        w: a.w + (b.w - a.w) * u,
        h: a.h + (b.h - a.h) * u,
      };
    }
  }
  /* c8 ignore next 2 */
  return { cx: last.cx, cy: last.cy, w: last.w, h: last.h };
}

// ─── The authored cadence (spec §4.1, §4.2) ──────────────────────────────────────────────

/**
 * Is the street loud at scene time `t`? A packet of vehicles released by the carrefour
 * absorbs the shutter completely (`SUSPICION_SHUTTER_COVERED = 0`), so this ONE boolean
 * classifies every release — no partial credit, which is what keeps the gauge countable.
 *
 * Windows are generated, never listed: `firstOpenAt + n × periodSeconds`, each
 * `coverSeconds` long. A window that would open after the scene ends does not exist.
 * `periodSeconds` is a WAVE INTERVAL — the 42 s junction cycle is fiction (ruling R3-1).
 */
export function inCover(cover: CoverWindows, t: number, sceneDuration: number): boolean {
  if (t < cover.firstOpenAt) return false;
  const n = Math.floor((t - cover.firstOpenAt) / cover.periodSeconds);
  const open = cover.firstOpenAt + n * cover.periodSeconds;
  if (open >= sceneDuration) return false;
  return t >= open && t < open + cover.coverSeconds;
}

/**
 * Is the cover's TELL running at `t` — the engines rising at the line, heard from the
 * lucarne? The render projects this as the packet's headlights swinging into the street;
 * nothing else on the plate may encode the cover state (R3-2 / N-1).
 */
export function coverTellAt(cover: CoverWindows, t: number, sceneDuration: number): boolean {
  const rel = t - cover.firstOpenAt + cover.tellSeconds;
  if (rel < 0) return false;
  const n = Math.floor(rel / cover.periodSeconds);
  const open = cover.firstOpenAt + n * cover.periodSeconds;
  if (open >= sceneDuration) return false;
  return t >= open - cover.tellSeconds && t < open;
}

/**
 * The candidate instant at `t` (T2) — the SECRET. It is read at the shutter and stamped on
 * the contact sheet; it is never projected into anything the player sees while the scene is
 * live (D8, and `PhotoSceneView` has no field that could carry it).
 */
export function instantAt(instants: readonly PhotoInstant[], t: number): PhotoInstant | null {
  for (const i of instants) {
    if (t >= i.openAt && t <= i.closeAt) return i;
  }
  return null;
}

// ─── The deterministic sway (spec §3.3, ADR-0034 Rev.3 model) ────────────────────────────

function rawWaypoint(seed: number, raiseIndex: number, k: number): Vec2 {
  // Waypoint 0 is the ORIGIN, always: a raise starts at zero offset AND zero velocity, so
  // it never snaps the frame (spec §3.3) — and D1.b's 0.40 s arm is what stops that from
  // being a free perfect shot.
  if (k === 0) return { x: 0, y: 0 };
  const h = hash32(seed, raiseIndex, k);
  const ux = (h >>> 16) / 0x10000;
  const uy = (h & 0xffff) / 0x10000;
  return { x: (ux * 2 - 1) * SWAY_AMP_X, y: (uy * 2 - 1) * SWAY_AMP_Y };
}

function clampToRange(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Anti-jitter: a leg shorter than `MIN_LEG_DISPLACEMENT` reads as a rendering glitch, so
 *  push it out to that floor and clamp back into the amplitude box. */
function antiJitter(raw: Vec2, prev: Vec2): Vec2 {
  const dx = raw.x - prev.x;
  const dy = raw.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d >= MIN_LEG_DISPLACEMENT) return raw;
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
    x: clampToRange(prev.x + ux * MIN_LEG_DISPLACEMENT, -SWAY_AMP_X, SWAY_AMP_X),
    y: clampToRange(prev.y + uy * MIN_LEG_DISPLACEMENT, -SWAY_AMP_Y, SWAY_AMP_Y),
  };
}

/** Speed cap: pull the waypoint in along the leg so a step is at most
 *  `MAX_LEG_DISPLACEMENT` — this is the term F5c sizes `PAN_RATE_MAX` against. */
function capLeg(p: Vec2, prev: Vec2): Vec2 {
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  const d = Math.hypot(dx, dy);
  if (d <= MAX_LEG_DISPLACEMENT) return p;
  const s = MAX_LEG_DISPLACEMENT / d;
  return { x: prev.x + dx * s, y: prev.y + dy * s };
}

/**
 * The viewfinder's tremor offset, in su, at `raisedElapsed` seconds of held posture.
 *
 * PURE and closed-form in `(swaySeed, raiseIndex, raisedElapsed)` — a function of the total
 * elapsed alone, never a stepped accumulator, so re-chunking the delta (1/60, 1/30,
 * jittered) yields the SAME offset and a retry replays the same scene (AC10, F11).
 *
 * Reduced motion swaps the easing to linear and stretches the leg to
 * `SWAY_LEG_DURATION_RM`; the AMPLITUDES are identical, so every fairness floor in §7 is
 * byte-identical between the two modes rather than re-derived (spec §3.4).
 */
export function swayOffsetAt(
  seed: number,
  raiseIndex: number,
  raisedElapsed: number,
  reducedMotion: boolean,
): Vec2 {
  const legDuration = reducedMotion ? SWAY_LEG_DURATION_RM : SWAY_LEG_DURATION;
  const leg = Math.max(0, raisedElapsed) / legDuration;
  const k = Math.floor(leg);
  const frac = leg - k;
  const s = reducedMotion ? frac : smoothstep(frac);
  let prev = rawWaypoint(seed, raiseIndex, 0);
  let wpK = prev;
  let wpK1 = prev;
  for (let i = 1; i <= k + 1; i++) {
    const next = capLeg(antiJitter(rawWaypoint(seed, raiseIndex, i), prev), prev);
    if (i === k) wpK = next;
    if (i === k + 1) wpK1 = next;
    prev = next;
  }
  return {
    x: wpK.x + (wpK1.x - wpK.x) * s,
    y: wpK.y + (wpK1.y - wpK.y) * s,
  };
}
