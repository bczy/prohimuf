import { describe, it, expect } from "vitest";
import {
  qteZoneAt,
  isQteActive,
  shouldTriggerQte,
  createQte,
  tickQte,
  QTE_RESCUE_REFILL,
  QTE_HOSTAGE_HIT,
  QTE_UNANSWERED_PEEK,
  QTE_PANIC_SHOT,
  QTE_BODY_HIT,
  QTE_RESULT_HOLD,
  PEEK_EXPOSURE_FLOOR,
  TELEGRAPH_LEAD_SECONDS,
  HEAD_DX_MAX,
  HEAD_DY_MIN,
  HOSTAGE_DX_MIN,
  HOSTAGE_DY_MAX,
} from "@game/systems/qteSystem";
import type { HostageQte, QteSpec } from "@game/types/hostageQte";
import { LEVELS } from "@game/levels/levels";

// Belliard default (spec §5). Anchor at origin ⇒ impactPoint IS the (dx, dy) offset.
const SPEC: QteSpec = {
  triggerAtElapsedSeconds: 12,
  zoomSeconds: 2,
  anchor: { x: 0, y: 0 },
  porteCochere: { x: 7.2, y: 0 },
  retreatSpeed: 0.6,
  peekCadenceSeconds: 1.5,
  peekDurationSeconds: 1.2,
};

/** A fresh QTE already in the ACTIVE phase (zoom skipped), COVERED at t=0. */
function active(overrides: Partial<HostageQte> = {}): HostageQte {
  return {
    ...createQte(SPEC),
    phase: "ACTIVE",
    warning: false,
    zoomRemaining: 0,
    ...overrides,
  };
}
const NO_HIT = { x: -10, y: -10 }; // far outside every band → "miss"
// A point inside each band (anchor at origin ⇒ world == offset).
const HEAD_PT = { x: -0.3, y: 0.8 };
const BODY_PT = { x: 0.5, y: 0.4 };
const HOSTAGE_PT = { x: 0.4, y: -0.5 };

describe("qteZoneAt — stance-aware bands (ADR-0034 D4/D6)", () => {
  it("returns head ONLY while PEEKING (the sole kill route)", () => {
    expect(qteZoneAt(HEAD_PT.x, HEAD_PT.y, "PEEKING")).toBe("head");
    // Same point while COVERED is never a kill zone → body or miss, never head.
    expect(qteZoneAt(HEAD_PT.x, HEAD_PT.y, "COVERED")).not.toBe("head");
  });

  it("classifies body, hostage and miss regardless of stance", () => {
    for (const stance of ["COVERED", "PEEKING"] as const) {
      expect(qteZoneAt(BODY_PT.x, BODY_PT.y, stance)).toBe("body");
      expect(qteZoneAt(HOSTAGE_PT.x, HOSTAGE_PT.y, stance)).toBe("hostage");
      expect(qteZoneAt(3, 3, stance)).toBe("miss");
      expect(qteZoneAt(0, 2.0, stance)).toBe("miss");
    }
  });

  it("gives the hostage silhouette precedence over the captor body", () => {
    // A point inside both the hostage band and the body band resolves to hostage.
    expect(qteZoneAt(0.3, -0.4, "PEEKING")).toBe("hostage");
  });

  // G6 — the peeking head band and the hostage band are spatially DISJOINT with a
  // non-zero gap, asserted directly (never via draw order). No (dx,dy) is both.
  it("G6: no offset maps to both head and hostage (non-zero gap)", () => {
    // Band-constant gap: the head band is strictly left of and above the hostage.
    expect(HEAD_DX_MAX).toBeLessThan(HOSTAGE_DX_MIN); // x-gap
    expect(HEAD_DY_MIN).toBeGreaterThan(HOSTAGE_DY_MAX); // y-gap
    // Dense grid scan: never head-under-PEEKING and hostage at the same offset, and
    // every head point sits clear of every hostage point.
    const headPts: [number, number][] = [];
    const hostagePts: [number, number][] = [];
    for (let dx = -1.5; dx <= 1.5; dx += 0.05) {
      for (let dy = -1.5; dy <= 1.5; dy += 0.05) {
        const z = qteZoneAt(dx, dy, "PEEKING");
        if (z === "head") headPts.push([dx, dy]);
        if (z === "hostage") hostagePts.push([dx, dy]);
      }
    }
    expect(headPts.length).toBeGreaterThan(0);
    expect(hostagePts.length).toBeGreaterThan(0);
    let minGap = Infinity;
    for (const [hx, hy] of headPts) {
      for (const [gx, gy] of hostagePts) {
        minGap = Math.min(minGap, Math.hypot(hx - gx, hy - gy));
      }
    }
    expect(minGap).toBeGreaterThan(0);
  });
});

describe("isQteActive / shouldTriggerQte", () => {
  it("is active for ZOOMING…LOST and inactive for DONE/null", () => {
    expect(isQteActive(null)).toBe(false);
    expect(isQteActive(createQte(SPEC))).toBe(true); // ZOOMING
    expect(isQteActive(active())).toBe(true);
    expect(isQteActive(active({ phase: "WON" }))).toBe(true);
    expect(isQteActive(active({ phase: "LOST" }))).toBe(true);
    expect(isQteActive(active({ phase: "DONE" }))).toBe(false);
  });

  it("triggers once: only with a spec, no live qte, and elapsed past the trigger", () => {
    expect(shouldTriggerQte(SPEC, null, 11.9)).toBe(false);
    expect(shouldTriggerQte(SPEC, null, 12)).toBe(true);
    expect(shouldTriggerQte(SPEC, createQte(SPEC), 20)).toBe(false); // already fired
    expect(shouldTriggerQte(null, null, 99)).toBe(false); // no QTE this level
  });
});

describe("createQte — seeding + safety invariants (asserted in code)", () => {
  it("seeds ZOOMING, COVERED, the retreat kinematics and the warning up", () => {
    const q = createQte(SPEC);
    expect(q.phase).toBe("ZOOMING");
    expect(q.stance).toBe("COVERED");
    expect(q.telegraphActive).toBe(false);
    expect(q.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(q.anchor).toEqual({ x: 0, y: 0 });
    expect(q.dir).toBe(1); // door is toward +x
    expect(q.speed).toBe(0.6);
    expect(q.porteCochere).toEqual({ x: 7.2, y: 0 });
    expect(q.zoomRemaining).toBe(2);
    expect(q.resultRemaining).toBe(QTE_RESULT_HOLD);
    expect(q.warning).toBe(true);
  });

  it("derives dir from the door side (sign of door − start)", () => {
    const left = createQte({ ...SPEC, anchor: { x: 0, y: 0 }, porteCochere: { x: -5, y: 0 } });
    expect(left.dir).toBe(-1);
  });

  // AC3 / G5 — the runtime exposure is clamped UP to the floor; assert the RUNTIME
  // value the tick uses, not just the authored field.
  it("G5: clamps a sub-floor authored exposure up to PEEK_EXPOSURE_FLOOR", () => {
    const q = createQte({ ...SPEC, peekDurationSeconds: 0.3 });
    expect(q.peekDurationSeconds).toBe(PEEK_EXPOSURE_FLOOR);
    // Belliard's authored exposure is already above the floor and passes through.
    expect(createQte(SPEC).peekDurationSeconds).toBe(1.2);
  });

  // AC4 / G4 — every peek must be telegraphed; the cadence must leave STRICT room for
  // the tell (C4). At equality the tell would be on for the whole COVERED beat.
  it("G4: throws unless peekCadenceSeconds is STRICTLY > TELEGRAPH_LEAD_SECONDS", () => {
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: 0.2 })).toThrow(/G4/);
    // Equality collapses the discrete wind-up (tell on for the entire beat) → rejected.
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: TELEGRAPH_LEAD_SECONDS })).toThrow(/G4/);
    // Belliard's cadence sits strictly above the lead and passes.
    expect(SPEC.peekCadenceSeconds).toBeGreaterThan(TELEGRAPH_LEAD_SECONDS);
  });

  it("D1: throws if the door is not strictly ahead or the retreat is non-positive", () => {
    expect(() => createQte({ ...SPEC, porteCochere: { x: 0, y: 0 } })).toThrow(/D1/);
    expect(() => createQte({ ...SPEC, retreatSpeed: 0 })).toThrow(/D1/);
  });

  // C3 — movement freezes y and the door test is x-only; a door off the anchor's
  // street would "arrive" on x while the camera leads toward a y never reached.
  it("C3: throws if the door is off the anchor's street (porteCochere.y !== anchor.y)", () => {
    expect(() => createQte({ ...SPEC, porteCochere: { x: 7.2, y: 1 } })).toThrow(/C3/);
  });

  // C6 — non-finite authored numerics slip past `=== 0`/`Math.max` and can wedge the
  // peek sub-machine open forever; they are rejected at seed time.
  it("C6: throws on a non-finite authored numeric (NaN/Infinity)", () => {
    expect(() => createQte({ ...SPEC, retreatSpeed: NaN })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, porteCochere: { x: Infinity, y: 0 } })).toThrow(/C6/);
  });
});

describe("tickQte — ZOOMING", () => {
  it("counts the zoom down and penalises a panic shot each beat", () => {
    const r = tickQte(createQte(SPEC), true, HEAD_PT, 0.1);
    expect(r.qte.phase).toBe("ZOOMING");
    expect(r.qte.zoomRemaining).toBeCloseTo(1.9);
    expect(r.energyDelta).toBe(QTE_PANIC_SHOT);
  });

  it("no penalty when not firing during the zoom", () => {
    const r = tickQte(createQte(SPEC), false, NO_HIT, 0.1);
    expect(r).toMatchObject({ energyDelta: 0 });
  });

  it("opens the duel when the zoom elapses (ACTIVE, COVERED, retreat clock at start)", () => {
    const r = tickQte({ ...createQte(SPEC), zoomRemaining: 0.05 }, false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(r.qte.telegraphActive).toBe(false);
    expect(r.qte.warning).toBe(false);
    expect(r.qte.anchor.x).toBe(0); // retreat has not advanced yet
  });

  it("still penalises a panic shot on the tick the zoom elapses", () => {
    const r = tickQte({ ...createQte(SPEC), zoomRemaining: 0.05 }, true, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.energyDelta).toBe(QTE_PANIC_SHOT);
  });
});

describe("tickQte — the binary duel (AC6)", () => {
  it("head during PEEKING → WON: +refill energy (the sole win route)", () => {
    const r = tickQte(active({ stance: "PEEKING" }), true, HEAD_PT, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.energyDelta).toBe(QTE_RESCUE_REFILL);
  });

  it("head band while COVERED never wins — it bleeds as a body/miss shot", () => {
    const r = tickQte(active({ stance: "COVERED" }), true, HEAD_PT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    // The covered head region resolves as body here → the small drain, never a win.
    expect(r.energyDelta).toBe(QTE_BODY_HIT);
  });

  it("body / hostage / miss never win (no health bar, no chip-to-kill)", () => {
    const body = tickQte(active({ stance: "PEEKING" }), true, BODY_PT, 0.1);
    expect(body.qte.phase).toBe("ACTIVE");
    expect(body.energyDelta).toBe(QTE_BODY_HIT);
    const hostage = tickQte(active({ stance: "PEEKING" }), true, HOSTAGE_PT, 0.1);
    expect(hostage.qte.phase).toBe("ACTIVE");
    expect(hostage.energyDelta).toBe(QTE_HOSTAGE_HIT);
    const miss = tickQte(active({ stance: "PEEKING" }), true, NO_HIT, 0.1);
    expect(miss.qte.phase).toBe("ACTIVE");
    expect(miss).toMatchObject({ energyDelta: 0 });
  });

  it("spraying the body only compounds energy loss, never advances a kill", () => {
    let q = active({ stance: "PEEKING", stanceRemaining: 5 });
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const r = tickQte(q, true, BODY_PT, 0.01); // tiny delta keeps us ACTIVE/PEEKING
      total += r.energyDelta;
      q = r.qte;
      expect(r.qte.phase).toBe("ACTIVE");
    }
    expect(total).toBe(5 * QTE_BODY_HIT);
  });
});

describe("tickQte — retreat budget & tie-break (AC1)", () => {
  it("with no fire, the captor reaches the door in ~12 s of ACTIVE time → LOST", () => {
    let q = active();
    let t = 0;
    const dt = 1 / 60;
    while (q.phase === "ACTIVE" && t < 30) {
      const r = tickQte(q, false, NO_HIT, dt);
      q = r.qte;
      if (q.phase === "ACTIVE") t += dt;
      else t += dt; // the tick that crosses the door still consumed dt of ACTIVE time
    }
    expect(q.phase).toBe("LOST");
    // 7.2 / 0.6 = 12.0 s answerable budget.
    expect(t).toBeGreaterThan(11.8);
    expect(t).toBeLessThan(12.2);
  });

  it("reaching the door charges NO extra energy (the cost was paid peek-by-peek)", () => {
    // Anchor one sub-tick short of the door, COVERED so no peek closes this tick.
    const q = active({ anchor: { x: 7.15, y: 0 }, stance: "COVERED", stanceRemaining: 1.0 });
    const r = tickQte(q, false, NO_HIT, 0.1); // advances 0.06 → 7.21 ≥ 7.2
    expect(r.qte.phase).toBe("LOST");
    expect(r).toMatchObject({ energyDelta: 0 });
  });

  it("tie-break: a winning headshot beats the door reached on the SAME tick → WON", () => {
    // This tick's retreat WOULD reach the door, but fire is resolved first. Aim at
    // the head band relative to the LIVE anchor (7.15 + HEAD_PT offset).
    const q = active({ anchor: { x: 7.15, y: 0 }, stance: "PEEKING", stanceRemaining: 1.0 });
    const r = tickQte(q, true, { x: 7.15 + HEAD_PT.x, y: HEAD_PT.y }, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.energyDelta).toBe(QTE_RESCUE_REFILL);
  });
});

describe("tickQte — peek sub-machine, telegraph & counter-fire (AC2, AC4, AC5)", () => {
  it("AC2: a passive run surfaces ≥ 4 fully-closed exposures before the door", () => {
    let q = active();
    let closes = 0;
    let peekDrain = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 30 && q.phase === "ACTIVE"; i++) {
      const prevStance = q.stance;
      const r = tickQte(q, false, NO_HIT, dt);
      if (prevStance === "PEEKING" && r.qte.stance === "COVERED") closes++;
      peekDrain += r.energyDelta;
      q = r.qte;
    }
    expect(q.phase).toBe("LOST");
    expect(closes).toBeGreaterThanOrEqual(4);
    // AC5: each closed exposure charged exactly once → 4 × −8 = −32 over the run.
    expect(peekDrain).toBe(closes * QTE_UNANSWERED_PEEK);
  });

  it("AC4: the G4 tell shows in the last TELEGRAPH_LEAD_SECONDS of every COVERED beat", () => {
    // Just outside the tell window → false; just inside → true.
    const before = active({ stance: "COVERED", stanceRemaining: TELEGRAPH_LEAD_SECONDS + 0.2 });
    expect(tickQte(before, false, NO_HIT, 0.1).qte.telegraphActive).toBe(false);
    const inside = active({ stance: "COVERED", stanceRemaining: TELEGRAPH_LEAD_SECONDS + 0.05 });
    expect(tickQte(inside, false, NO_HIT, 0.1).qte.telegraphActive).toBe(true);
  });

  it("COVERED→PEEKING opens an exposure at the clamped floor, no charge, no tell", () => {
    const q = active({ stance: "COVERED", stanceRemaining: 0.05 });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("PEEKING");
    expect(r.qte.stanceRemaining).toBe(Math.max(SPEC.peekDurationSeconds, PEEK_EXPOSURE_FLOOR));
    expect(r.qte.telegraphActive).toBe(false);
    expect(r.energyDelta).toBe(0); // opening a peek is free
  });

  it("AC5: a PEEKING→COVERED close charges the unanswered-peek drain ONCE", () => {
    const q = active({ stance: "PEEKING", stanceRemaining: 0.05 });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK);
  });

  it("a long exposure is NOT over-billed — the drain fires only on the close tick", () => {
    // Mid-peek ticks that do not close charge nothing.
    const mid = active({ stance: "PEEKING", stanceRemaining: 1.0 });
    const r = tickQte(mid, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("PEEKING");
    expect(r.energyDelta).toBe(0);
  });

  // C1 — a delta larger than a stance segment must not silently swallow the skipped
  // peeks: the sub-machine consumes the FULL delta, charging each CLOSED peek once.
  it("C1: a large delta spanning ≥2 stance boundaries charges each closed peek once", () => {
    // COVERED with 0.1 s left, then a single 4.2 s delta. Boundaries crossed:
    //   0.1  COVERED→PEEKING (open, free)
    //   +1.2 PEEKING→COVERED (close #1, −8)
    //   +1.5 COVERED→PEEKING (open, free)
    //   +1.2 PEEKING→COVERED (close #2, −8)   [t = 4.0]
    // → lands 0.2 s into a fresh COVERED beat. Retreat 0.6 × 4.2 = 2.52 u < 7.2 → ACTIVE.
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 4.2);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.stance).toBe("COVERED");
    // Two full exposures closed within the tick → charged exactly twice, not once.
    expect(r.energyDelta).toBe(2 * QTE_UNANSWERED_PEEK);
  });
});

describe("tickQte — result hold → DONE (once per level)", () => {
  it("WON/LOST hold briefly then go DONE, and DONE is a no-op", () => {
    for (const phase of ["WON", "LOST"] as const) {
      const held = active({ phase, resultRemaining: 0.05 });
      const done = tickQte(held, false, NO_HIT, 0.1);
      expect(done.qte.phase).toBe("DONE");
      expect(done).toMatchObject({ energyDelta: 0 });
      const after = tickQte(done.qte, true, HEAD_PT, 0.1);
      expect(after.qte.phase).toBe("DONE");
      expect(after).toMatchObject({ energyDelta: 0 });
    }
  });

  it("holds while resultRemaining is positive, charging nothing", () => {
    const won = active({ phase: "WON", resultRemaining: 1.0 });
    const r = tickQte(won, true, HEAD_PT, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.qte.resultRemaining).toBeCloseTo(0.9);
    expect(r).toMatchObject({ energyDelta: 0 });
  });
});

describe("real level data honours the safety floors (B1 / AC3)", () => {
  it("every authored hostageQte clears the exposure floor and telegraph lead", () => {
    const specs = LEVELS.map((l) => l.hostageQte).filter((s): s is QteSpec => s !== undefined);
    expect(specs.length).toBeGreaterThan(0); // Belliard opts in — the test has teeth.
    for (const s of specs) {
      // AC3 asks for a test on the actual level data, not just synthetic specs, so an
      // authoring regression in levels.ts surfaces here.
      expect(s.peekDurationSeconds).toBeGreaterThanOrEqual(PEEK_EXPOSURE_FLOOR);
      expect(s.peekCadenceSeconds).toBeGreaterThan(TELEGRAPH_LEAD_SECONDS);
      // And the authored spec seeds without tripping any invariant (D1/C3/C6/G4).
      expect(() => createQte(s)).not.toThrow();
    }
  });
});

describe("severity order (AC5)", () => {
  it("body < panic < unanswered peek ≪ hostage, and rescue dominates", () => {
    expect(Math.abs(QTE_BODY_HIT)).toBeLessThan(Math.abs(QTE_PANIC_SHOT));
    expect(Math.abs(QTE_PANIC_SHOT)).toBeLessThan(Math.abs(QTE_UNANSWERED_PEEK));
    expect(Math.abs(QTE_UNANSWERED_PEEK)).toBeLessThan(Math.abs(QTE_HOSTAGE_HIT));
    expect(QTE_RESCUE_REFILL).toBeGreaterThan(Math.abs(QTE_HOSTAGE_HIT));
  });
});
