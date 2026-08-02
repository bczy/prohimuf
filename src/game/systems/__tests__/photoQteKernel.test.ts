import { describe, expect, it } from "vitest";
import {
  FOCAL_MAX,
  FOCAL_MIN,
  MAX_LEG_DISPLACEMENT,
  SWAY_AMP_X,
  SWAY_AMP_Y,
  SWAY_LEG_DURATION,
  SWAY_LEG_DURATION_RM,
  fovWidthAt,
  inCover,
  instantAt,
  subjectBoxAt,
  swayOffsetAt,
} from "@game/systems/photoQteSystem";
import { BELLIARD_PHOTO_QTE } from "@game/levels/photoQteBelliard";

const SPEC = BELLIARD_PHOTO_QTE;
const TRACK = SPEC.subjectTrack;

/**
 * A2 — the PURE kernel of the photo set-piece (techplan §2.3): the single subject
 * evaluator, the cover generator, the instant lookup and the closed-form sway. Everything
 * here is a total function of authored data plus a scalar clock: no state, no wall clock,
 * no `Math.random` (F11).
 */
describe("fovWidthAt — the magnification law (spec §0)", () => {
  it("is 3500 / f, so 35 mm frames the whole 100 su plate", () => {
    expect(fovWidthAt(FOCAL_MIN)).toBeCloseTo(100, 10);
  });

  it("gives 11.67 su at the 300 mm the fiction engraves on the lens", () => {
    expect(fovWidthAt(FOCAL_MAX)).toBeCloseTo(11.666667, 5);
  });

  it("reproduces the three sweet-spot fovW the F5 table is derived from", () => {
    expect(fovWidthAt(94)).toBeCloseTo(37.23, 2);
    expect(fovWidthAt(132)).toBeCloseTo(26.52, 2);
    expect(fovWidthAt(251)).toBeCloseTo(13.94, 2);
  });
});

describe("subjectBoxAt — THE single evaluator (D-C, F12(3))", () => {
  it("A-T5: is total, finite and inside the plate on the whole of [0, 60]", () => {
    for (let t = 0; t <= SPEC.sceneDuration; t += 0.05) {
      const b = subjectBoxAt(TRACK, t);
      for (const v of [b.cx, b.cy, b.w, b.h]) expect(Number.isFinite(v)).toBe(true);
      expect(b.w).toBeGreaterThan(0);
      expect(b.h).toBeGreaterThan(0);
      expect(b.cx - b.w / 2).toBeGreaterThanOrEqual(0);
      expect(b.cx + b.w / 2).toBeLessThanOrEqual(100);
      expect(b.cy - b.h / 2).toBeGreaterThanOrEqual(0);
      expect(b.cy + b.h / 2).toBeLessThanOrEqual(56.25);
    }
  });

  it("A-T5: the authored keyframes sit exactly on t = 0 and t = sceneDuration", () => {
    expect(TRACK[0]?.t).toBe(0);
    expect(TRACK[TRACK.length - 1]?.t).toBe(SPEC.sceneDuration);
  });

  it("returns each keyframe's own box AT that keyframe", () => {
    for (const k of TRACK) {
      expect(subjectBoxAt(TRACK, k.t)).toEqual({ cx: k.cx, cy: k.cy, w: k.w, h: k.h });
    }
  });

  it("interpolates linearly on all four components inside a transit", () => {
    // K6 (53.0) → K7 (55.9): the reverse-out, 9.00 su of pan in 2.90 s.
    const mid = subjectBoxAt(TRACK, 54.45);
    expect(mid.cx).toBeCloseTo(66.5, 10);
    expect(mid.cy).toBeCloseTo(9.0, 10);
    expect(mid.w).toBeCloseTo(7.5, 10);
    expect(mid.h).toBeCloseTo(4.22, 10);
  });

  it("pins the authored 3.103 su/s of the reverse-out (F5b/F5c's input)", () => {
    const a = subjectBoxAt(TRACK, 53.0);
    const b = subjectBoxAt(TRACK, 55.9);
    expect((b.cx - a.cx) / 2.9).toBeCloseTo(3.103, 3);
  });

  it("clamps outside the authored domain instead of extrapolating", () => {
    expect(subjectBoxAt(TRACK, -5)).toEqual(subjectBoxAt(TRACK, 0));
    expect(subjectBoxAt(TRACK, 999)).toEqual(subjectBoxAt(TRACK, SPEC.sceneDuration));
  });

  it("A-T4 (F12(2)): is byte-constant on both dead beats — no transit before a tell", () => {
    const DEAD_BEATS: readonly (readonly [number, number])[] = [
      [15.5, 34.7], // ARRIVEE closes → ECHANGE's tell
      [40.3, 51.2], // ECHANGE closes → PLAQUE's tell
    ];
    for (const [from, to] of DEAD_BEATS) {
      const ref = subjectBoxAt(TRACK, from);
      for (let t = from; t <= to; t += 0.05) {
        expect(subjectBoxAt(TRACK, t)).toEqual(ref);
      }
      expect(subjectBoxAt(TRACK, to)).toEqual(ref);
    }
  });

  it("A-T4: is also constant before the FIRST tell — no early travel, no retro-leak", () => {
    const ref = subjectBoxAt(TRACK, 0);
    for (let t = 0; t <= 9.2; t += 0.05) expect(subjectBoxAt(TRACK, t)).toEqual(ref);
  });

  it("is framerate-independent: sampling order and step never change the value", () => {
    expect(subjectBoxAt(TRACK, 37.13)).toEqual(subjectBoxAt(TRACK, 37.13));
  });
});

describe("inCover — the cover generator (spec §4.1)", () => {
  const COVER = SPEC.cover;
  const inC = (t: number) => inCover(COVER, t, SPEC.sceneDuration);

  it("opens the three authored windows [10,17] [31,38] [52,59] and nothing else", () => {
    for (let i = 0; i <= 600; i++) {
      // Integer stepping: a `t += 0.1` accumulator drifts (16.999…) and would make the
      // expectation and the call disagree about which side of a boundary they are on.
      const t = i / 10;
      const expected = (t >= 10 && t < 17) || (t >= 31 && t < 38) || (t >= 52 && t < 59);
      expect(inC(t)).toBe(expected);
    }
  });

  it("silence is the DEFAULT state: the scene opens on 10 s of exposed street", () => {
    expect(inC(0)).toBe(false);
    expect(inC(9.99)).toBe(false);
    expect(inC(10)).toBe(true);
  });

  it("never opens a fourth window inside the scene (it would land at 73 s)", () => {
    expect(inC(59)).toBe(false);
    expect(inC(59.9)).toBe(false);
  });

  it("is a pure function of t — same t, same boolean, always", () => {
    for (const t of [3, 12.5, 33, 54.2]) expect(inC(t)).toBe(inC(t));
  });

  it("never contains the value 42 in the authored cadence (ruling R3-1)", () => {
    expect(COVER.periodSeconds).toBe(21.0);
    expect(Object.values(COVER)).not.toContain(42);
  });
});

describe("instantAt — the SECRET (T2, never surfaced live)", () => {
  const at = (t: number) => instantAt(SPEC.instants, t)?.id ?? null;

  it("answers only inside an authored [openAt, closeAt]", () => {
    expect(at(10.9)).toBeNull();
    expect(at(11.0)).toBe("ARRIVEE");
    expect(at(15.5)).toBe("ARRIVEE");
    expect(at(15.6)).toBeNull();
    expect(at(36.5)).toBe("ECHANGE");
    expect(at(40.3)).toBe("ECHANGE");
    expect(at(53.0)).toBe("PLAQUE");
    expect(at(55.9)).toBe("PLAQUE");
  });

  it("A-T6: is null through every one of the three transits", () => {
    const TRANSITS: readonly (readonly [number, number])[] = [
      [9.2, 11.0],
      [34.7, 36.5],
      [51.2, 53.0],
    ];
    for (const [tell, open] of TRANSITS) {
      for (let t = tell; t < open; t += 0.05) expect(at(t)).toBeNull();
    }
  });

  it("names exactly one master instant", () => {
    expect(SPEC.instants.filter((i) => i.role === "master").map((i) => i.id)).toEqual(["ECHANGE"]);
  });
});

describe("swayOffsetAt — closed-form hashed waypoints (spec §3.3, F11)", () => {
  const SEED = SPEC.swaySeed;

  it("starts at ZERO offset and zero velocity, so a raise never snaps the frame", () => {
    expect(swayOffsetAt(SEED, 0, 0, false)).toEqual({ x: 0, y: 0 });
    expect(swayOffsetAt(SEED, 7, 0, false)).toEqual({ x: 0, y: 0 });
    const eps = swayOffsetAt(SEED, 0, 1e-4, false);
    expect(Math.hypot(eps.x, eps.y)).toBeLessThan(1e-3);
  });

  it("stays inside the authored amplitude box at every time, in BOTH motion modes", () => {
    for (const rm of [false, true]) {
      for (let t = 0; t <= 12; t += 0.017) {
        const o = swayOffsetAt(SEED, 3, t, rm);
        expect(Math.abs(o.x)).toBeLessThanOrEqual(SWAY_AMP_X + 1e-9);
        expect(Math.abs(o.y)).toBeLessThanOrEqual(SWAY_AMP_Y + 1e-9);
      }
    }
  });

  it("A-T10: is closed-form in t — re-chunking the delta gives the SAME offset", () => {
    // 1/60 vs 1/30 vs a jittered accumulation, all reaching the same total elapsed.
    const total = 2.5;
    const acc = (step: number) => {
      let t = 0;
      for (let i = 0; i < Math.round(total / step); i++) t += step;
      return swayOffsetAt(SEED, 1, t, false);
    };
    const a = acc(1 / 60);
    const b = acc(1 / 30);
    expect(a.x).toBeCloseTo(b.x, 9);
    expect(a.y).toBeCloseTo(b.y, 9);
  });

  it("A-T10: same seed + same raiseIndex ⇒ byte-identical path (retry N === retry 1)", () => {
    for (let t = 0; t <= 3; t += 0.13) {
      expect(swayOffsetAt(SEED, 2, t, false)).toEqual(swayOffsetAt(SEED, 2, t, false));
    }
  });

  it("gives each raise its OWN path — the anti-spam term of D1.b", () => {
    const a = swayOffsetAt(SEED, 0, 0.9, false);
    const b = swayOffsetAt(SEED, 1, 0.9, false);
    expect(a).not.toEqual(b);
  });

  it("caps a leg's travel at MAX_LEG_DISPLACEMENT (F5c's input)", () => {
    for (let k = 0; k < 12; k++) {
      const a = swayOffsetAt(SEED, 4, k * SWAY_LEG_DURATION, false);
      const b = swayOffsetAt(SEED, 4, (k + 1) * SWAY_LEG_DURATION, false);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(MAX_LEG_DISPLACEMENT + 1e-9);
    }
  });

  it("reduced motion keeps the AMPLITUDE and only stretches the leg (spec §3.4)", () => {
    // Same waypoints, walked 2.36× slower: the RM path at the stretched time equals the
    // standard path's waypoint at the matching leg boundary.
    for (let k = 1; k <= 4; k++) {
      const std = swayOffsetAt(SEED, 5, k * SWAY_LEG_DURATION, false);
      const rm = swayOffsetAt(SEED, 5, k * SWAY_LEG_DURATION_RM, true);
      expect(rm.x).toBeCloseTo(std.x, 9);
      expect(rm.y).toBeCloseTo(std.y, 9);
    }
  });

  it("reduced motion is LINEAR — no zero-velocity dwell at the waypoints", () => {
    // Mid-leg, linear interpolation sits exactly halfway between the two waypoints;
    // smoothstep also does at u = 0.5, so compare at u = 0.25 instead.
    const w0 = swayOffsetAt(SEED, 6, 0, true);
    const w1 = swayOffsetAt(SEED, 6, SWAY_LEG_DURATION_RM, true);
    const q = swayOffsetAt(SEED, 6, 0.25 * SWAY_LEG_DURATION_RM, true);
    expect(q.x).toBeCloseTo(w0.x + 0.25 * (w1.x - w0.x), 9);
    expect(q.y).toBeCloseTo(w0.y + 0.25 * (w1.y - w0.y), 9);
  });

  it("keeps the isotropy the 16:9 frame needs: AMP_Y = AMP_X / 1.7778", () => {
    expect(SWAY_AMP_Y).toBeCloseTo(SWAY_AMP_X / 1.7778, 6);
  });
});
