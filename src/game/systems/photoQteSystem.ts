import { hash32, smoothstep } from "@game/systems/hash";
import type {
  Box,
  CoverWindows,
  PhotoComposition,
  PhotoCta,
  PhotoFrameRecord,
  PhotoInput,
  PhotoInstant,
  PhotoQte,
  PhotoQtePhase,
  PhotoQteSpec,
  PhotoRejectReason,
  PhotoSceneView,
  PhotoSheetView,
  PhotoVerdict,
  SubjectKeyframe,
} from "@game/types/photoQte";
import type { PhotoLeverage } from "@game/types/photoLeverage";
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

// ─── The machine's own constants (spec §8) ───────────────────────────────────────────────

export const PHOTO_ESTABLISH_SECONDS = 2.0;
export const PHOTO_DEVELOP_SECONDS = 0.8;
/** Anti-exploit AND diegetic: a freshly-raised camera arms at u = 0.73 of the first sway
 *  leg — the fast part of the drift — so posture spam is strictly worse than committing. */
export const SHUTTER_ARM_SECONDS = 0.4;
export const FOCUS_HOLD = 0.35;
export const SUSPICION_MAX = 100;
export const SUSPICION_SHUTTER_EXPOSED = 34;
export const SUSPICION_SHUTTER_COVERED = 0;
/** One entry plus exactly one `[ RECOMMENCER ]`, MISSION-scoped (D-1, spec §1.3.a). A
 *  MODULE constant, never an authored field: one gated value, one source of truth. */
export const PHOTO_MAX_ATTEMPTS = 2;
/** DESIGN budgets measured at playtest — NOT timers. A verdict screen that closes itself
 *  is hostile and would defeat the two-beat feedback, so nothing in the tick reads these. */
export const CONTACT_SHEET_READ_BUDGET = 20.0;
export const CONTACT_SHEET_DECISION_BUDGET = 7.0;

// ─── Floors (spec §7) — asserted against authored data, never trusted ────────────────────

export const POSE_WINDOW_FLOOR = 1.6; // F1
export const TELEGRAPH_LEAD_FLOOR = 1.2; // F2
export const COVER_OVERLAP_FLOOR = 1.2; // F3
export const FOCAL_BAND_FLOOR = 1.1; // F4
export const F13_ATTEMPT_BUDGET_SECONDS = 90; // F13
export const F14_MISSION_BUDGET_SECONDS = 155; // F14a
/**
 * F12(1b)'s tolerance — `max(0.40 su, 5 % of the edge's own authored size)` per edge. ONE
 * exported object, imported by `scripts/check-photo-subject-boxes.mjs`: the tolerance is a
 * game value, so it lives here and is never re-typed (nor half re-typed) in a script.
 */
export const SUBJECT_BOX_TOLERANCE = {
  absoluteFloorSu: 0.4,
  fraction: 0.05,
} as const;

/** The per-edge tolerance for an authored edge size. The script calls THIS, not the numbers. */
export function subjectBoxEdgeTolerance(authoredSize: number): number {
  return Math.max(
    SUBJECT_BOX_TOLERANCE.absoluteFloorSu,
    SUBJECT_BOX_TOLERANCE.fraction * Math.abs(authoredSize),
  );
}

function fail(message: string): never {
  throw new Error(`photoQte: ${message}`);
}

/** The dominant span of a box in "frame width" terms — `max(w, h × aspect)`, i.e. the axis
 *  T4's `fill` is taken on. One helper so the fill maths never forks. */
function dominantSpan(b: Box): number {
  return Math.max(b.w, b.h * PLATE_ASPECT);
}

/**
 * The legal focal band of an instant (F4), DERIVED from the subject box rather than
 * authored: `fill(f) = f × dominantSpan / 3500 ∈ [FILL_MIN, FILL_MAX]`, intersected with
 * the lens. Returns the band and its geometric mid — the "sweet spot" F5 is evaluated at,
 * on purpose (§7.1).
 */
export function focalBandOf(box: Box): { lo: number; hi: number; sweet: number } {
  const m = dominantSpan(box);
  const lo = Math.max(FOCAL_MIN, (3500 * FILL_MIN) / m);
  const hi = Math.min(FOCAL_MAX, (3500 * FILL_MAX) / m);
  return { lo, hi, sweet: Math.sqrt(lo * hi) };
}

/**
 * Effective containment slack per side, in su (K-1, §3.3.a). The `FRAME_MARGIN` T3 already
 * spends is SUBTRACTED here: it is not a rule that happens to sit nearby, it is a
 * subtraction from the very room the sway is allowed to use. Measuring against the raw
 * slack is the bug this function exists to make impossible.
 */
function effectiveSlack(box: Box, focalMm: number): number {
  const fovW = fovWidthAt(focalMm);
  return (fovW - box.w) / 2 - FRAME_MARGIN * fovW;
}

/** The subject's peak image-plane speed over an instant's window, in su/s. */
function subjectSpeedOver(
  track: readonly SubjectKeyframe[],
  openAt: number,
  closeAt: number,
): number {
  const a = subjectBoxAt(track, openAt);
  const b = subjectBoxAt(track, closeAt);
  const dt = closeAt - openAt;
  return dt <= 0 ? 0 : Math.hypot(b.cx - a.cx, b.cy - a.cy) / dt;
}

/** Seconds of `[openAt, closeAt]` that fall inside a cover window (F3). */
function coverOverlapSeconds(
  cover: CoverWindows,
  sceneDuration: number,
  openAt: number,
  closeAt: number,
): number {
  const step = 0.01;
  let n = 0;
  for (let t = openAt; t < closeAt; t += step) {
    if (inCover(cover, t, sceneDuration)) n++;
  }
  return n * step;
}

/**
 * Validate the authored set-piece against floors F1–F14 and throw, named, on the first
 * breach. House discipline (ADR-0035 D2, ADR-0034 G4/G5): a tuning floor is asserted in
 * code against the authored data, never trusted — including against a future difficulty
 * curve. F12(1b) (drawn == box) is not assertable here; it is a CI script (lane C).
 */
export function assertPhotoQteFloors(spec: PhotoQteSpec): void {
  const track = spec.subjectTrack;
  if (track.length < 2) fail("F12(3): subjectTrack needs at least two keyframes");
  for (let i = 1; i < track.length; i++) {
    if ((track[i]?.t ?? 0) <= (track[i - 1]?.t ?? 0)) {
      fail("F12(3): subjectTrack keyframes must be strictly increasing in t");
    }
  }
  if (track[0]?.t !== 0) fail("F12(3): the first keyframe must sit exactly on t = 0");
  if (track[track.length - 1]?.t !== spec.sceneDuration) {
    fail("F12(3): the last keyframe must sit exactly on t = sceneDuration");
  }

  const masters = spec.instants.filter((i) => i.role === "master");
  if (masters.length !== 1) {
    fail(`exactly one instant must carry role "master" (found ${String(masters.length)})`);
  }

  for (const inst of spec.instants) {
    const window = inst.closeAt - inst.openAt;
    if (window < POSE_WINDOW_FLOOR) {
      fail(
        `F1: instant ${inst.id} window ${window.toFixed(2)} s < POSE_WINDOW_FLOOR ${String(POSE_WINDOW_FLOOR)} s`,
      );
    }
    const lead = inst.openAt - inst.tellAt;
    if (inst.tellAt >= inst.openAt || lead < TELEGRAPH_LEAD_FLOOR) {
      fail(
        `F2: instant ${inst.id} telegraph lead ${lead.toFixed(2)} s < TELEGRAPH_LEAD_FLOOR ${String(TELEGRAPH_LEAD_FLOOR)} s`,
      );
    }
    if (inst.closeAt > spec.sceneDuration) {
      fail(`F1: instant ${inst.id} closes after the scene ends`);
    }
    const overlap = coverOverlapSeconds(spec.cover, spec.sceneDuration, inst.openAt, inst.closeAt);
    if (overlap < COVER_OVERLAP_FLOOR) {
      fail(
        `F3: instant ${inst.id} overlaps a cover window by ${overlap.toFixed(2)} s < COVER_OVERLAP_FLOOR ${String(COVER_OVERLAP_FLOOR)} s — a zero-suspicion perfect run must always exist`,
      );
    }

    const box = subjectBoxAt(track, inst.openAt);
    const band = focalBandOf(box);
    if (band.hi <= band.lo || band.hi / band.lo < FOCAL_BAND_FLOOR) {
      fail(
        `F4: instant ${inst.id} focal band ratio ${(band.hi / band.lo).toFixed(3)} < FOCAL_BAND_FLOOR ${String(FOCAL_BAND_FLOOR)} — an instant you cannot legally frame is a bug shipped as difficulty`,
      );
    }

    // F5a / F5b, at the geometric mid-band focal (§7.1) and against the EFFECTIVE slack.
    const sEff = effectiveSlack(box, band.sweet);
    if (sEff <= 0) fail(`F5a: instant ${inst.id} has no effective containment slack`);
    const master = inst.role === "master";
    const shareA = SWAY_AMP_X / sEff;
    const ceilA = master ? 0.6 : 0.8;
    if (shareA > ceilA) {
      fail(
        `F5a: instant ${inst.id} sway share ${(shareA * 100).toFixed(1)} % > ${String(ceilA * 100)} % — the mandatory shot is never a coin flip`,
      );
    }
    const v = subjectSpeedOver(track, inst.openAt, inst.closeAt);
    const shareB = (SWAY_AMP_X + v * FOCUS_HOLD) / sEff;
    const ceilB = master ? 1.0 : 1.3;
    if (shareB > ceilB) {
      fail(
        `F5b: instant ${inst.id} untracked worst case ${(shareB * 100).toFixed(1)} % > ${String(ceilB * 100)} % — a bonus may be hard, it may not be secretly impossible`,
      );
    }
  }

  // F5c — the player can always out-run subject + worst tremor SIMULTANEOUSLY.
  const vMax = Math.max(...spec.instants.map((i) => subjectSpeedOver(track, i.openAt, i.closeAt)));
  const vSwayPeak = (1.5 * MAX_LEG_DISPLACEMENT) / SWAY_LEG_DURATION;
  if (PAN_RATE_MAX < vMax + vSwayPeak) {
    fail(
      `F5c: PAN_RATE_MAX ${String(PAN_RATE_MAX)} < ${(vMax + vSwayPeak).toFixed(2)} su/s — "hard" would mean "the input cannot physically produce the correction"`,
    );
  }

  // F6 — a single mistake is never fatal, and the contact sheet never needs pagination.
  if (spec.filmCount < spec.instants.length + 2 || spec.filmCount > 8) {
    fail(
      `F6: filmCount ${String(spec.filmCount)} outside [instants + 2, 8] = [${String(spec.instants.length + 2)}, 8]`,
    );
  }

  // F7 — never spotted by a single mistake (two silent frames must be survivable).
  if (SUSPICION_MAX / SUSPICION_SHUTTER_EXPOSED < 2) {
    fail("F7: silent-shutter headroom < 2");
  }

  // F9 — the arming rule must never eat the window it protects.
  const shortest = Math.min(...spec.instants.map((i) => i.closeAt - i.openAt));
  if (SHUTTER_ARM_SECONDS + FOCUS_HOLD > 0.5 * shortest) {
    fail(
      `F9: SHUTTER_ARM_SECONDS + FOCUS_HOLD (${String(SHUTTER_ARM_SECONDS + FOCUS_HOLD)} s) > half the shortest pose window (${(0.5 * shortest).toFixed(2)} s)`,
    );
  }

  // F12(2) — no transit before the tell, and no retro-leak after a close. The track must
  // be CONSTANT from one instant's close to the next one's tell.
  const sorted = [...spec.instants].sort((a, b) => a.openAt - b.openAt);
  for (let i = 0; i + 1 < sorted.length; i++) {
    const from = sorted[i]?.closeAt ?? 0;
    const to = sorted[i + 1]?.tellAt ?? 0;
    const ref = subjectBoxAt(track, from);
    for (const k of track) {
      if (k.t > from && k.t < to) {
        if (k.cx !== ref.cx || k.cy !== ref.cy || k.w !== ref.w || k.h !== ref.h) {
          fail(`F12(2): subjectTrack moves at t = ${String(k.t)}, before the next tell`);
        }
      }
    }
    const end = subjectBoxAt(track, to);
    if (end.cx !== ref.cx || end.cy !== ref.cy || end.w !== ref.w || end.h !== ref.h) {
      fail(
        `F12(2): subjectTrack is not constant on the dead beat [${String(from)}, ${String(to)}] — the brackets would leak the moment`,
      );
    }
  }

  // F13 — one un-skipped attempt's authored frozen time.
  const attempt1 =
    spec.briefingMaxSeconds + PHOTO_ESTABLISH_SECONDS + spec.sceneDuration + PHOTO_DEVELOP_SECONDS;
  if (attempt1 > F13_ATTEMPT_BUDGET_SECONDS) {
    fail(
      `F13: one attempt costs ${attempt1.toFixed(1)} s > ${String(F13_ATTEMPT_BUDGET_SECONDS)} s of authored frozen time`,
    );
  }

  // F14a — the whole mission-scoped budget, briefing played ONCE (spec §1.1).
  const mission =
    spec.briefingMaxSeconds +
    PHOTO_MAX_ATTEMPTS * (PHOTO_ESTABLISH_SECONDS + spec.sceneDuration + PHOTO_DEVELOP_SECONDS);
  if (mission > F14_MISSION_BUDGET_SECONDS) {
    fail(
      `F14: ${String(PHOTO_MAX_ATTEMPTS)} attempts cost ${mission.toFixed(1)} s > ${String(F14_MISSION_BUDGET_SECONDS)} s — an optional set-piece may never front an unbounded loop onto the 3-5 min mission promise`,
    );
  }
}

// ─── Composition, the mechanical read (spec §2.2, E-4b) ──────────────────────────────────

function viewfinderAt(centre: Vec2, focalMm: number): Box {
  const w = fovWidthAt(focalMm);
  const h = w / PLATE_ASPECT;
  // The viewfinder is always fully inside the plate.
  const cx = clampToRange(centre.x, w / 2, PLATE_WIDTH - w / 2);
  const cy = clampToRange(centre.y, h / 2, PLATE_HEIGHT - h / 2);
  return { cx, cy, w, h };
}

/** T3 — the subject box fully inside the viewfinder with `FRAME_MARGIN` clear on all four
 *  sides. The margin is a fraction of the FRAME, so it tightens with the focal exactly as
 *  the slack arithmetic of §3.3.a assumes. */
function containedIn(box: Box, view: Box): boolean {
  const mx = FRAME_MARGIN * view.w;
  const my = FRAME_MARGIN * view.h;
  return (
    box.cx - box.w / 2 >= view.cx - view.w / 2 + mx &&
    box.cx + box.w / 2 <= view.cx + view.w / 2 - mx &&
    box.cy - box.h / 2 >= view.cy - view.h / 2 + my &&
    box.cy + box.h / 2 <= view.cy + view.h / 2 - my
  );
}

/** T4's live ratio — the dominant axis, so a 16:9 subject reads the same on both. */
function fillOf(box: Box, view: Box): number {
  return Math.max(box.w / view.w, box.h / view.h);
}

function compositionOf(box: Box, view: Box, focusHeldSeconds: number): PhotoComposition {
  const contained = containedIn(box, view);
  const fill = fillOf(box, view);
  const fillValid = fill >= FILL_MIN && fill <= FILL_MAX;
  const valid = contained && fillValid;
  return {
    contained,
    fill,
    fillValid,
    focusHeldSeconds,
    // Three states, not two (spec §2.3): without `solid` the hold is an invisible rule the
    // player only discovers via a dull click after spending film.
    bracket: !valid ? "dashed" : focusHeldSeconds >= FOCUS_HOLD ? "locked" : "solid",
  };
}

/**
 * Open the set-piece. Asserts every floor first (F1–F14), then seeds the record.
 *
 * `attemptIndex` is a SNAPSHOT of `GameState.photoQteAttempts` (techplan Rev.5 T-2): the
 * authority is mission-scoped and lives on the level state, so `[ RECOMMENCER ]` cannot
 * hand itself a fresh budget by re-creating this object. `BRIEFING` is entered iff
 * `attemptIndex === 0` — a retry re-enters at `ESTABLISHING`, because replaying the ellipse
 * of a climb Muf has not undone is both fiction-wrong and the fattest block of frozen time
 * in the attempt (spec §1.1).
 */
export function createPhotoQte(spec: PhotoQteSpec, attemptIndex = 0): PhotoQte {
  assertPhotoQteFloors(spec);
  if (!Number.isInteger(attemptIndex) || attemptIndex < 0) {
    fail(`attemptIndex must be a non-negative integer (got ${String(attemptIndex)})`);
  }
  if (attemptIndex >= PHOTO_MAX_ATTEMPTS) {
    fail(
      `D-1: attempt ${String(attemptIndex + 1)} exceeds PHOTO_MAX_ATTEMPTS ${String(PHOTO_MAX_ATTEMPTS)} — the retry budget is mission-scoped and it is spent`,
    );
  }
  const briefing = attemptIndex === 0;
  const focal = FOCAL_MIN;
  const viewfinder = viewfinderAt({ x: PLATE_WIDTH / 2, y: PLATE_HEIGHT / 2 }, focal);
  const subjectBox = subjectBoxAt(spec.subjectTrack, 0);
  return {
    phase: briefing ? "BRIEFING" : "ESTABLISHING",
    posture: "LOWERED",
    phaseRemaining: briefing ? spec.briefingMaxSeconds : PHOTO_ESTABLISH_SECONDS,
    sceneClock: 0,
    raisedElapsed: 0,
    raiseIndex: 0,
    focal,
    viewfinder,
    subjectBox,
    composition: compositionOf(subjectBox, viewfinder, 0),
    film: spec.filmCount,
    suspicion: 0,
    frames: [],
    attemptIndex,
    outcome: "none",
    spec,
  };
}

/** The set-piece holds the scene while this is true (techplan §2.6 block 1a). */
export function isPhotoQteActive(qte: PhotoQte | null): boolean {
  return qte !== null && qte.phase !== "DONE" && qte.phase !== "EXITED";
}

/**
 * The scripted trigger. Fires ONCE — `qte !== null` (even spent) closes it for the level,
 * so a set-piece can never re-open behind the player's back. The serialisation against the
 * other frozen-scene blocks (D-K) is the CALLER's guard in `stateMachine`, where the other
 * sub-records live.
 */
export function shouldTriggerPhotoQte(
  spec: PhotoQteSpec | null,
  qte: PhotoQte | null,
  elapsedSeconds: number,
): boolean {
  if (spec === null || qte !== null) return false;
  return elapsedSeconds >= spec.triggerAtElapsedSeconds;
}

/** R2-4: DERIVED from the frame records, never a stored flag and never a tier change. */
export function hasPlaqueBonus(frames: readonly PhotoFrameRecord[]): boolean {
  return frames.some((f) => f.verdict === "BONUS" && f.instantId === "PLAQUE");
}

/** What the roll bought (spec §1.3). A roll with no MASTER frame carries nothing — the
 *  bonuses are a multiplier ON the proof, never a substitute for it. */
export function photoOutcomeOf(frames: readonly PhotoFrameRecord[]): PhotoLeverage {
  if (!frames.some((f) => f.verdict === "MASTER")) return "none";
  return frames.some((f) => f.verdict === "BONUS") ? "master-bonus" : "master";
}

export interface PhotoQteTickResult {
  readonly qte: PhotoQte;
  /** Set on the tick the player LEAVES; the bridge persists it (ADR-0080). The photograph
   *  exists the moment it is in the box — the leverage is not contingent on surviving. */
  readonly settled: PhotoLeverage | null;
  /** Set on the tick a shutter actually exposed a frame. `focusHeld` is the SOLE signal for
   *  the crisp-vs-dull click, so the audio channel and the visual flash cannot disagree. */
  readonly exposed: { readonly focusHeld: boolean } | null;
  /** The CTA the player pressed on the sheet, on the tick they pressed it. `"retry"` asks
   *  `stateMachine` for a new attempt; the other two leave the set-piece. */
  readonly exit: PhotoCta | null;
}

function rejectReasonOf(candidate: PhotoInstant | null, comp: PhotoComposition): PhotoRejectReason {
  // T2 first, and it wins outright: a release fired mid-transit is `no-subject` whatever
  // the brackets say (A-T6). The brackets are a composition read, never a validation claim.
  if (candidate === null) return "no-subject";
  if (!comp.contained) return "out-of-frame";
  if (comp.fill < FILL_MIN) return "too-wide";
  if (comp.fill > FILL_MAX) return "too-tight";
  return "blurred";
}

/**
 * One tick of the set-piece.
 *
 * WYSIWYG classify order — the house rule, same as the hostage duel: the shutter is
 * resolved against the state the render DREW (last frame's posture, viewfinder,
 * composition and scene clock), and only then does the sim advance. Anything else would
 * classify a photograph the player never saw.
 */
export function tickPhotoQte(qte: PhotoQte, input: PhotoInput, delta: number): PhotoQteTickResult {
  const spec = qte.spec;
  const still = (patch: Partial<PhotoQte>): PhotoQteTickResult => ({
    qte: { ...qte, ...patch },
    settled: null,
    exposed: null,
    exit: null,
  });

  switch (qte.phase) {
    case "BRIEFING": {
      const remaining = qte.phaseRemaining - delta;
      if (input.skipBriefing || remaining <= 0) {
        return still({ phase: "ESTABLISHING", phaseRemaining: PHOTO_ESTABLISH_SECONDS });
      }
      return still({ phaseRemaining: remaining });
    }

    case "ESTABLISHING": {
      // Forced LOWERED, shutter inert, `sceneClock` frozen at 0: the player gets the wide
      // read before any commitment, and sees the needle and the film dial at rest.
      const remaining = qte.phaseRemaining - delta;
      if (remaining <= 0) return still({ phase: "ACTIVE", phaseRemaining: 0 });
      return still({ phaseRemaining: remaining });
    }

    case "SPOTTED":
    case "ROLL_END":
    case "SCENE_END": {
      // The terminals are one-tick markers the render reads (targets scatter / the roll is
      // finished / the berline is gone); the verdict is frozen on the way into DEVELOPING.
      return still({
        phase: "DEVELOPING",
        phaseRemaining: PHOTO_DEVELOP_SECONDS,
        outcome: photoOutcomeOf(qte.frames),
      });
    }

    case "DEVELOPING": {
      const remaining = qte.phaseRemaining - delta;
      if (remaining <= 0) return still({ phase: "CONTACT_SHEET", phaseRemaining: 0 });
      return still({ phaseRemaining: remaining });
    }

    case "CONTACT_SHEET": {
      if (input.cta === null) return still({});
      const retry = input.cta === "retry" && qte.attemptIndex + 1 < PHOTO_MAX_ATTEMPTS;
      if (retry) {
        // `stateMachine` re-creates the record at `attemptIndex + 1`; the budget authority
        // stays on `GameState`, so a retry can never mint itself a fresh one.
        return { qte: { ...qte, phase: "DONE" }, settled: null, exposed: null, exit: "retry" };
      }
      return {
        qte: { ...qte, phase: "EXITED" },
        // Written whatever the exit: the roll is what it is, and declining is a legal way
        // to play (spec §1.3). `"none"` is a legitimate settled value.
        settled: qte.outcome,
        exposed: null,
        exit: input.cta === "retry" ? "decline" : input.cta,
      };
    }

    case "ACTIVE":
      break;

    /* c8 ignore next 2 */
    default:
      return still({});
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────────────────
  // 1) The shutter, resolved against the DRAWN state (WYSIWYG).
  let film = qte.film;
  let suspicion = qte.suspicion;
  let frames = qte.frames;
  let exposed: { readonly focusHeld: boolean } | null = null;

  const armed = qte.posture === "RAISED" && qte.raisedElapsed >= SHUTTER_ARM_SECONDS;
  if (input.shutter && armed) {
    // T1 passed ⇒ exactly one frame of film, whatever the verdict (ADR-0077 D6).
    const candidate = instantAt(spec.instants, qte.sceneClock);
    const covered = inCover(spec.cover, qte.sceneClock, spec.sceneDuration);
    const comp = qte.composition;
    const sharp = comp.focusHeldSeconds >= FOCUS_HOLD;
    const composed = comp.contained && comp.fillValid && sharp;
    const verdict: PhotoVerdict =
      candidate === null || !composed
        ? "REJECTED"
        : candidate.role === "master"
          ? "MASTER"
          : "BONUS";
    film = qte.film - 1;
    suspicion = Math.min(
      SUSPICION_MAX,
      qte.suspicion + (covered ? SUSPICION_SHUTTER_COVERED : SUSPICION_SHUTTER_EXPOSED),
    );
    frames = [
      ...qte.frames,
      {
        ordinal: qte.frames.length + 1,
        verdict,
        instantId: candidate?.id ?? null,
        rejectReason: verdict === "REJECTED" ? rejectReasonOf(candidate, comp) : null,
        inCover: covered,
      },
    ];
    exposed = { focusHeld: sharp };
  }
  // T1 failing swallows the input entirely: no film, no noise, no suspicion, no record and
  // no `exposed` event (spec §2.2 / UX §1.3).

  // 2) Posture. The pure layer reads the INTENT, never the device that produced it (D-B).
  let posture = qte.posture;
  let raiseIndex = qte.raiseIndex;
  let raisedElapsed = qte.raisedElapsed;
  if (input.raiseIntent && qte.posture === "LOWERED") {
    posture = "RAISED";
    raiseIndex = qte.raiseIndex + 1;
    raisedElapsed = 0;
  } else if (!input.raiseIntent && qte.posture === "RAISED") {
    posture = "LOWERED";
    raisedElapsed = 0;
  } else if (posture === "RAISED") {
    raisedElapsed = qte.raisedElapsed + delta;
  }

  // 3) The clock. It runs whatever the posture — the street does not wait for you.
  const sceneClock = qte.sceneClock + delta;

  // 4) Focal: logarithmic, so the ratio per unit of input is constant and the long end
  //    (where the bonus lives) stays controllable. RETAINED across posture changes (D1.a).
  const span = Math.log(FOCAL_MAX / FOCAL_MIN);
  const u = clampToRange(
    Math.log(qte.focal / FOCAL_MIN) / span + (input.focalDelta * delta) / ZOOM_TRAVERSE_SECONDS,
    0,
    1,
  );
  const focal = FOCAL_MIN * Math.exp(u * span);

  // 5) The viewfinder. The sway is a pure function of `(seed, raiseIndex, raisedElapsed)`,
  //    so the player-owned centre is recovered by subtracting the offset that was applied
  //    last tick — one source of truth for the drift, no second stored centre to drift out
  //    of sync with it.
  const prevSway = swayOffsetAt(
    spec.swaySeed,
    qte.raiseIndex,
    qte.raisedElapsed,
    input.reducedMotion,
  );
  let baseX = qte.viewfinder.cx - prevSway.x;
  let baseY = qte.viewfinder.cy - prevSway.y;
  const maxStep = PAN_RATE_MAX * delta;
  if (input.aim) {
    // Desktop: the pointer is a TARGET the frame moves toward at up to PAN_RATE_MAX (D-I,
    // ratified). At 251 mm that is ≈ 86 % of the frame width per second — indistinguishable
    // from an absolute mapping at human speeds, and ONE fairness model on both devices.
    const tx = input.aim.x * PLATE_WIDTH;
    const ty = input.aim.y * PLATE_HEIGHT;
    const dx = tx - baseX;
    const dy = ty - baseY;
    const d = Math.hypot(dx, dy);
    if (d > maxStep && d > 0) {
      baseX += (dx / d) * maxStep;
      baseY += (dy / d) * maxStep;
    } else {
      baseX = tx;
      baseY = ty;
    }
  } else {
    const dx = input.panDx * PLATE_WIDTH;
    const dy = input.panDy * PLATE_HEIGHT;
    const d = Math.hypot(dx, dy);
    const s = d > maxStep && d > 0 ? maxStep / d : 1;
    baseX += dx * s;
    baseY += dy * s;
  }
  const sway =
    posture === "RAISED"
      ? swayOffsetAt(spec.swaySeed, raiseIndex, raisedElapsed, input.reducedMotion)
      : { x: 0, y: 0 }; // LOWERED: zero sway, path reset (spec §1.2).
  const viewfinder = viewfinderAt({ x: baseX + sway.x, y: baseY + sway.y }, focal);

  // 6) The subject box — evaluated ONCE, here, and carried (D-C).
  const subjectBox = subjectBoxAt(spec.subjectTrack, sceneClock);
  const preview = compositionOf(subjectBox, viewfinder, 0);
  // T5 is a HOLD: T3 ∧ T4 continuously true for FOCUS_HOLD, reset to zero on ANY break.
  const held =
    preview.contained && preview.fillValid ? qte.composition.focusHeldSeconds + delta : 0;
  const composition = compositionOf(subjectBox, viewfinder, held);

  // 7) The three terminals. Film first: `film === 0` after a decrement ends the roll, and a
  //    finished roll is a finished roll whatever is happening in the passage.
  let phase: PhotoQtePhase = "ACTIVE";
  if (film === 0) phase = "ROLL_END";
  else if (suspicion >= SUSPICION_MAX) phase = "SPOTTED";
  else if (sceneClock >= spec.sceneDuration) phase = "SCENE_END";

  return {
    qte: {
      ...qte,
      phase,
      posture,
      phaseRemaining: 0,
      sceneClock,
      raisedElapsed,
      raiseIndex,
      focal,
      viewfinder,
      subjectBox,
      composition,
      film,
      suspicion,
      frames,
    },
    settled: null,
    exposed,
    exit: null,
  };
}

// ─── The two projections (D-D) — the type-level guarantee of the two-beat feedback ───────

/**
 * What the render may draw while the scene is live. It carries NO verdict, NO instant and
 * NO role: a render lane cannot leak the secret because the secret is not in scope (A-T2).
 */
export function photoSceneView(qte: PhotoQte): PhotoSceneView {
  return {
    phase: qte.phase,
    posture: qte.posture,
    viewfinder: qte.viewfinder,
    // The SAME carried value T3/T4 consumed — the brackets and the tests read one object
    // (F12(1a)), not two agreeing computations.
    subjectBox: qte.subjectBox,
    bracket: qte.composition.bracket,
    focalMm: qte.focal,
    film: qte.film,
    suspicion: qte.suspicion,
    // The ONLY projection of the cover state (D-J / R3-2): the packet's headlights raking
    // the mouth of the passage. The plate's traffic light is decor and is never read.
    headlightsLit:
      qte.phase === "ACTIVE" && inCover(qte.spec.cover, qte.sceneClock, qte.spec.sceneDuration),
    // The tell's VISUAL channel: the headlights swinging into the street 1.8 s before the
    // cover opens. Its twin is the audio channel (engines rising at the line) — both read the
    // same authored generator, so the two cues can never disagree.
    headlightsApproaching:
      qte.phase === "ACTIVE" && coverTellAt(qte.spec.cover, qte.sceneClock, qte.spec.sceneDuration),
    plate: qte.spec.plate,
  };
}

/**
 * The verdict surface. `null` before the sheet exists, so no semantic bit can reach the
 * render one beat early (D8).
 */
export function photoSheetView(qte: PhotoQte): PhotoSheetView | null {
  if (qte.phase !== "CONTACT_SHEET" && qte.phase !== "DONE") return null;
  const master = qte.frames.some((f) => f.verdict === "MASTER");
  return {
    frames: qte.frames,
    outcome: qte.outcome,
    // The leaving control is the primary one on BOTH branches — retry is offered, never
    // imposed (K-4). Declining is a legal way to play the game.
    leavingCta: master ? "continue" : "decline",
    retryOffered: qte.attemptIndex + 1 < PHOTO_MAX_ATTEMPTS,
    // R2-4: DERIVED from the frames on the sheet, in scene, with the roll still in hand —
    // never a carried fact, which is why `PhotoLeverage` stays 3-valued today.
    hasPlaque: hasPlaqueBonus(qte.frames),
  };
}
