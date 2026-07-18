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

// Belliard default (spec §5), the static duel. Anchor at origin ⇒ impactPoint IS the
// (dx, dy) offset. `maxBlownPeeks` is now the sole failure clock (no retreat/door).
const SPEC: QteSpec = {
  triggerAtElapsedSeconds: 12,
  zoomSeconds: 2,
  anchor: { x: 0, y: 0 },
  maxBlownPeeks: 4,
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
  it("seeds ZOOMING, COVERED, the STATIC anchor, a zeroed blown-peeks clock and the warning up", () => {
    const q = createQte(SPEC);
    expect(q.phase).toBe("ZOOMING");
    expect(q.stance).toBe("COVERED");
    expect(q.telegraphActive).toBe(false);
    expect(q.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(q.anchor).toEqual({ x: 0, y: 0 });
    expect(q.blownPeeks).toBe(0);
    expect(q.maxBlownPeeks).toBe(SPEC.maxBlownPeeks); // runtime mirror of the cap
    expect(q.peekCadenceSeconds).toBe(SPEC.peekCadenceSeconds);
    expect(q.zoomRemaining).toBe(2);
    expect(q.resultRemaining).toBe(QTE_RESULT_HOLD);
    expect(q.warning).toBe(true);
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

  it("throws unless maxBlownPeeks is an integer ≥ 1 (the failure clock must count)", () => {
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 0 })).toThrow(/maxBlownPeeks/);
    expect(() => createQte({ ...SPEC, maxBlownPeeks: -1 })).toThrow(/maxBlownPeeks/);
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 2.5 })).toThrow(/maxBlownPeeks/);
    // A whole, positive count passes.
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 1 })).not.toThrow();
  });

  // C6 — non-finite authored numerics slip past the integer/`Math.max` guards and can
  // wedge the peek sub-machine open forever; they are rejected at seed time.
  it("C6: throws on a non-finite authored numeric (NaN/Infinity)", () => {
    expect(() => createQte({ ...SPEC, maxBlownPeeks: NaN })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, anchor: { x: Infinity, y: 0 } })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: NaN })).toThrow(/C6/);
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

  it("opens the duel when the zoom elapses (ACTIVE, COVERED, static anchor held)", () => {
    const r = tickQte({ ...createQte(SPEC), zoomRemaining: 0.05 }, false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(r.qte.telegraphActive).toBe(false);
    expect(r.qte.warning).toBe(false);
    expect(r.qte.anchor).toEqual({ x: 0, y: 0 }); // static — nothing moves
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

describe("tickQte — the blown-peeks execution clock & tie-break (AC1)", () => {
  it("N (=maxBlownPeeks) blown peeks with no fire → LOST at exactly the Nth close", () => {
    let q = active();
    let closes = 0;
    let drain = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 60 && q.phase === "ACTIVE"; i++) {
      const prevStance = q.stance;
      const r = tickQte(q, false, NO_HIT, dt);
      if (prevStance === "PEEKING" && r.qte.stance === "COVERED") closes++;
      drain += r.energyDelta;
      q = r.qte;
    }
    expect(q.phase).toBe("LOST");
    expect(closes).toBe(SPEC.maxBlownPeeks); // 4 — not before
    expect(q.blownPeeks).toBe(SPEC.maxBlownPeeks);
    // Charge-once per blown peek: N × −8 over the whole run, nothing more.
    expect(drain).toBe(SPEC.maxBlownPeeks * QTE_UNANSWERED_PEEK);
  });

  it("a large delta HALTS at exactly the Nth (fatal) close — no overshoot", () => {
    // COVERED with 0.1 s left, then a single huge delta. It crosses many boundaries but
    // must stop dead at the 4th PEEKING→COVERED close (the execution), never past it.
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 100);
    expect(r.qte.phase).toBe("LOST");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks);
    // Exactly N unanswered-peek charges accrued before the halt — no extra loss charge.
    expect(r.energyDelta).toBe(SPEC.maxBlownPeeks * QTE_UNANSWERED_PEEK);
  });

  it("a close short of the cap stays ACTIVE (only the Nth close loses)", () => {
    const q = active({
      stance: "PEEKING",
      stanceRemaining: 0.05,
      blownPeeks: SPEC.maxBlownPeeks - 2,
    });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks - 1);
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK);
  });

  it("the Nth close executes the hostage → LOST, charging that close once (no extra)", () => {
    const q = active({
      stance: "PEEKING",
      stanceRemaining: 0.05,
      blownPeeks: SPEC.maxBlownPeeks - 1,
    });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("LOST");
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks);
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK); // the fatal close, once — no extra charge
  });

  it("tie-break: a winning headshot on the fatal peek tick → WON, not LOST", () => {
    // The peek WOULD close fatally this tick (blownPeeks one shy of the cap), but the
    // head hit is resolved FIRST and wins before the execution can fire.
    const q = active({
      stance: "PEEKING",
      stanceRemaining: 0.05,
      blownPeeks: SPEC.maxBlownPeeks - 1,
    });
    const r = tickQte(q, true, HEAD_PT, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.energyDelta).toBe(QTE_RESCUE_REFILL);
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks - 1); // never incremented — the shot won first
  });

  it("the anchor never mutates across ticks (static duel)", () => {
    let q = active();
    const anchor0 = q.anchor;
    const dt = 1 / 60;
    for (let i = 0; i < 300 && q.phase === "ACTIVE"; i++) {
      const r = tickQte(q, false, NO_HIT, dt);
      expect(r.qte.anchor).toEqual({ x: 0, y: 0 });
      expect(r.qte.anchor).toBe(anchor0); // copied once, never rebuilt — same reference
      q = r.qte;
    }
  });
});

describe("tickQte — peek sub-machine, telegraph & counter-fire (AC2, AC4, AC5)", () => {
  it("AC2: a passive run surfaces exactly maxBlownPeeks fully-closed exposures before the loss", () => {
    let q = active();
    let closes = 0;
    let peekDrain = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 60 && q.phase === "ACTIVE"; i++) {
      const prevStance = q.stance;
      const r = tickQte(q, false, NO_HIT, dt);
      if (prevStance === "PEEKING" && r.qte.stance === "COVERED") closes++;
      peekDrain += r.energyDelta;
      q = r.qte;
    }
    expect(q.phase).toBe("LOST");
    expect(closes).toBe(SPEC.maxBlownPeeks);
    // AC5: each closed exposure charged exactly once.
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
    expect(r.qte.blownPeeks).toBe(0); // an OPEN is not a blown peek
  });

  it("AC5: a PEEKING→COVERED close charges the unanswered-peek drain ONCE and counts one blown peek", () => {
    const q = active({ stance: "PEEKING", stanceRemaining: 0.05 });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(r.qte.blownPeeks).toBe(1);
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK);
  });

  it("a long exposure is NOT over-billed — the drain fires only on the close tick", () => {
    // Mid-peek ticks that do not close charge nothing and blow no peek.
    const mid = active({ stance: "PEEKING", stanceRemaining: 1.0 });
    const r = tickQte(mid, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("PEEKING");
    expect(r.energyDelta).toBe(0);
    expect(r.qte.blownPeeks).toBe(0);
  });

  // C1 — a delta larger than a stance segment must not silently swallow the skipped
  // peeks: the sub-machine consumes the FULL delta, charging each CLOSED peek once.
  it("C1: a large delta spanning ≥2 stance boundaries charges each closed peek once", () => {
    // COVERED with 0.1 s left, then a single 4.2 s delta. Boundaries crossed:
    //   0.1  COVERED→PEEKING (open, free)
    //   +1.2 PEEKING→COVERED (close #1, −8, blown 1)
    //   +1.5 COVERED→PEEKING (open, free)
    //   +1.2 PEEKING→COVERED (close #2, −8, blown 2)   [t = 4.0]
    // → lands 0.2 s into a fresh COVERED beat. blown 2 < cap 4 → still ACTIVE.
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 4.2);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.blownPeeks).toBe(2);
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
  it("every authored hostageQte clears the exposure floor, telegraph lead and blown-peeks clock", () => {
    const specs = LEVELS.map((l) => l.hostageQte).filter((s): s is QteSpec => s !== undefined);
    expect(specs.length).toBeGreaterThan(0); // Belliard opts in — the test has teeth.
    for (const s of specs) {
      // AC3 asks for a test on the actual level data, not just synthetic specs, so an
      // authoring regression in levels.ts surfaces here.
      expect(s.peekDurationSeconds).toBeGreaterThanOrEqual(PEEK_EXPOSURE_FLOOR);
      expect(s.peekCadenceSeconds).toBeGreaterThan(TELEGRAPH_LEAD_SECONDS);
      expect(Number.isInteger(s.maxBlownPeeks)).toBe(true);
      expect(s.maxBlownPeeks).toBeGreaterThanOrEqual(1);
      // And the authored spec seeds without tripping any invariant (C6/G4/G5/count).
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
