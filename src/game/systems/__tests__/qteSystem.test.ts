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
  HOSTAGE_DY_MAX,
  wander,
  clampTargetOffsetG6,
  HEAD_NEUTRAL,
  HEAD_HALF_W,
  HEAD_HALF_H,
  WANDER_AMP_X,
  WANDER_AMP_Y,
  G6_MARGIN,
  LEG_DURATION,
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
  peekDurationSeconds: 1.4,
  targetSeed: 20260718,
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

describe("qteZoneAt — stance-aware bands, head centred on targetOffset", () => {
  it("returns head ONLY while PEEKING (the sole kill route)", () => {
    expect(qteZoneAt(HEAD_PT.x, HEAD_PT.y, "PEEKING", HEAD_NEUTRAL)).toBe("head");
    // Same point while COVERED is never a kill zone → body or miss, never head.
    expect(qteZoneAt(HEAD_PT.x, HEAD_PT.y, "COVERED", HEAD_NEUTRAL)).not.toBe("head");
  });

  it("classifies body, hostage and miss regardless of stance (offset moves only the head)", () => {
    for (const stance of ["COVERED", "PEEKING"] as const) {
      expect(qteZoneAt(BODY_PT.x, BODY_PT.y, stance, HEAD_NEUTRAL)).toBe("body");
      expect(qteZoneAt(HOSTAGE_PT.x, HOSTAGE_PT.y, stance, HEAD_NEUTRAL)).toBe("hostage");
      expect(qteZoneAt(3, 3, stance, HEAD_NEUTRAL)).toBe("miss");
      expect(qteZoneAt(0, 2.0, stance, HEAD_NEUTRAL)).toBe("miss");
    }
  });

  it("gives the hostage silhouette precedence over the captor body", () => {
    // A point inside both the hostage band and the body band resolves to hostage.
    expect(qteZoneAt(0.3, -0.4, "PEEKING", HEAD_NEUTRAL)).toBe("hostage");
  });

  it("the head band FOLLOWS targetOffset — a fixed point is head at one offset, not another", () => {
    // The band is centred on the supplied offset: the neutral centre is a head hit when the
    // target sits at neutral, and NOT a head hit when the target has slid a head-width away.
    const shifted = { x: HEAD_NEUTRAL.x + 2 * HEAD_HALF_W + 0.1, y: HEAD_NEUTRAL.y };
    expect(qteZoneAt(HEAD_NEUTRAL.x, HEAD_NEUTRAL.y, "PEEKING", HEAD_NEUTRAL)).toBe("head");
    expect(qteZoneAt(HEAD_NEUTRAL.x, HEAD_NEUTRAL.y, "PEEKING", shifted)).not.toBe("head");
  });
});

describe("wander — pure, deterministic, replay-safe head drift", () => {
  const SEED = SPEC.targetSeed;

  it("is a pure function: same (seed, peekIndex, t) → identical Vec2", () => {
    for (const t of [0, 0.13, LEG_DURATION, 0.7, 1.1, 1.4]) {
      expect(wander(SEED, 0, t)).toEqual(wander(SEED, 0, t));
    }
  });

  it("stays within the wander amplitude box for all t (convex blend of in-box waypoints)", () => {
    for (let t = 0; t <= 2; t += 0.017) {
      const w = wander(SEED, 1, t);
      expect(Math.abs(w.x)).toBeLessThanOrEqual(WANDER_AMP_X + 1e-9);
      expect(Math.abs(w.y)).toBeLessThanOrEqual(WANDER_AMP_Y + 1e-9);
    }
  });

  it("actually moves: differs across peek ordinals and across legs", () => {
    expect(wander(SEED, 0, 0)).not.toEqual(wander(SEED, 1, 0));
    // Two waypoints a full leg apart differ — the min-leg anti-jitter guarantees travel.
    expect(wander(SEED, 0, 0)).not.toEqual(wander(SEED, 0, LEG_DURATION));
  });

  it("framerate-independent: the same total elapsed re-chunked yields the SAME offset", () => {
    // The replay-safety property: wander is a function of `t` alone, never of delta chunking.
    let acc = 0;
    for (const d of [0.1, 0.05, 0.2, 0.03, 0.12, 0.4]) acc += d; // = 0.9
    const oneShot = wander(SEED, 2, 0.9);
    const chunked = wander(SEED, 2, acc);
    expect(chunked.x).toBeCloseTo(oneShot.x, 12);
    expect(chunked.y).toBeCloseTo(oneShot.y, 12);
  });

  it("tickQte: reaching the same peek-elapsed via different delta chunks → same targetOffset", () => {
    const base = active({ stance: "PEEKING", stanceRemaining: SPEC.peekDurationSeconds });
    // Path A: one 0.3 s tick. Path B: three 0.1 s ticks — same total peek-elapsed.
    const a = tickQte(base, false, NO_HIT, 0.3);
    let q = base;
    for (let i = 0; i < 3; i++) q = tickQte(q, false, NO_HIT, 0.1).qte;
    expect(a.qte.stance).toBe("PEEKING");
    expect(q.stance).toBe("PEEKING");
    expect(q.targetOffset.x).toBeCloseTo(a.qte.targetOffset.x, 12);
    expect(q.targetOffset.y).toBeCloseTo(a.qte.targetOffset.y, 12);
  });
});

describe("G6 — head band stays clear of the hostage band (asserted clamp, not trusted)", () => {
  it("clampTargetOffsetG6 forces the centre above the hostage top by the margin, x untouched", () => {
    const lifted = clampTargetOffsetG6({ x: -0.4, y: -5 });
    expect(lifted.y).toBe(HOSTAGE_DY_MAX + G6_MARGIN + HEAD_HALF_H);
    expect(lifted.x).toBe(-0.4);
    // An already-clear offset passes through unchanged.
    expect(clampTargetOffsetG6({ x: 0.1, y: 0.9 })).toEqual({ x: 0.1, y: 0.9 });
  });

  it("across the FULL wander amplitude box the head band never intersects the hostage band", () => {
    // Every reachable offset, densely sampled: the head band's bottom stays strictly above
    // the hostage band's top → the two rectangles are disjoint on Y (hence disjoint) for ANY x.
    let minGap = Infinity;
    for (let ox = -WANDER_AMP_X; ox <= WANDER_AMP_X + 1e-9; ox += WANDER_AMP_X / 24) {
      for (let oy = -WANDER_AMP_Y; oy <= WANDER_AMP_Y + 1e-9; oy += WANDER_AMP_Y / 24) {
        const off = clampTargetOffsetG6({ x: HEAD_NEUTRAL.x + ox, y: HEAD_NEUTRAL.y + oy });
        minGap = Math.min(minGap, off.y - HEAD_HALF_H - HOSTAGE_DY_MAX);
      }
    }
    expect(minGap).toBeGreaterThan(0);
  });

  it("classifier scan at the worst-case (lowest) offset: head and hostage stay disjoint", () => {
    // The lowest the head band can sit after clamping — the tightest G6 case.
    const off = clampTargetOffsetG6({ x: HEAD_NEUTRAL.x, y: HEAD_NEUTRAL.y - WANDER_AMP_Y });
    const headPts: [number, number][] = [];
    const hostagePts: [number, number][] = [];
    for (let dx = -1.5; dx <= 1.5; dx += 0.05) {
      for (let dy = -1.5; dy <= 1.5; dy += 0.05) {
        const z = qteZoneAt(dx, dy, "PEEKING", off);
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

describe("moving target — aim-honesty & the wandering peek", () => {
  const SEED = SPEC.targetSeed;

  it("a shot at HEAD_NEUTRAL + wander hits head only while PEEKING and only when aligned", () => {
    const w = wander(SEED, 0, 0.2);
    const target = clampTargetOffsetG6({ x: HEAD_NEUTRAL.x + w.x, y: HEAD_NEUTRAL.y + w.y });
    // Aligned shot (shoot exactly where the head is) during PEEKING → head.
    expect(qteZoneAt(target.x, target.y, "PEEKING", target)).toBe("head");
    // Same aligned shot while COVERED is never a kill zone.
    expect(qteZoneAt(target.x, target.y, "COVERED", target)).not.toBe("head");
  });

  it("a fixed aim MISSES the head once the target has wandered a head-width away", () => {
    // Find two peek positions (over the duel's peeks) whose x differs by more than a head
    // width — proof the target genuinely leaves the aim behind (difficulty is MOTION).
    let ta = { x: 0, y: 0 };
    let tb = { x: 0, y: 0 };
    let found = false;
    for (let pi = 0; pi <= SPEC.maxBlownPeeks && !found; pi++) {
      const offsets: { x: number; y: number }[] = [];
      for (let t = 0; t <= SPEC.peekDurationSeconds + 1e-9; t += 0.02) {
        const w = wander(SEED, pi, t);
        offsets.push(clampTargetOffsetG6({ x: HEAD_NEUTRAL.x + w.x, y: HEAD_NEUTRAL.y + w.y }));
      }
      for (let i = 0; i < offsets.length && !found; i++) {
        const oi = offsets[i];
        if (oi === undefined) continue;
        for (let j = i + 1; j < offsets.length; j++) {
          const oj = offsets[j];
          if (oj === undefined) continue;
          if (Math.abs(oi.x - oj.x) > HEAD_HALF_W + 1e-3) {
            ta = oi;
            tb = oj;
            found = true;
            break;
          }
        }
      }
    }
    expect(found).toBe(true); // the head wanders more than a head-width across the duel
    // Aim locked on where the head WAS (ta): a hit then, a miss after it moved to tb.
    expect(qteZoneAt(ta.x, ta.y, "PEEKING", ta)).toBe("head");
    expect(qteZoneAt(ta.x, ta.y, "PEEKING", tb)).not.toBe("head");
  });
});

describe("targetOffset resting position (COVERED / ZOOMING) & wander during PEEKING", () => {
  it("rests at HEAD_NEUTRAL when seeded (ZOOMING) and through a ZOOMING/COVERED tick", () => {
    const seeded = createQte(SPEC);
    expect(seeded.targetOffset).toEqual(HEAD_NEUTRAL);
    expect(tickQte(seeded, false, NO_HIT, 0.1).qte.targetOffset).toEqual(HEAD_NEUTRAL);
    const covered = tickQte(
      active({ stance: "COVERED", stanceRemaining: 1.0 }),
      false,
      NO_HIT,
      0.1,
    );
    expect(covered.qte.stance).toBe("COVERED");
    expect(covered.qte.targetOffset).toEqual(HEAD_NEUTRAL);
  });

  it("a peek CLOSE resets the head zone to HEAD_NEUTRAL", () => {
    const r = tickQte(active({ stance: "PEEKING", stanceRemaining: 0.05 }), false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.targetOffset).toEqual(HEAD_NEUTRAL);
  });

  it("during PEEKING the head zone wanders off neutral but stays G6-clear of the hostage", () => {
    const r = tickQte(
      active({ stance: "PEEKING", stanceRemaining: SPEC.peekDurationSeconds }),
      false,
      NO_HIT,
      0.3,
    );
    expect(r.qte.stance).toBe("PEEKING");
    // Clear of the hostage band top at all times (G6), for any x.
    expect(r.qte.targetOffset.y - HEAD_HALF_H).toBeGreaterThan(HOSTAGE_DY_MAX);
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
    expect(createQte(SPEC).peekDurationSeconds).toBe(1.4);
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
    // COVERED with 0.1 s left, then a single 4.6 s delta. Boundaries crossed
    // (peekDuration 1.4, cadence 1.5):
    //   0.1  COVERED→PEEKING (open, free)
    //   +1.4 PEEKING→COVERED (close #1, −8, blown 1)
    //   +1.5 COVERED→PEEKING (open, free)
    //   +1.4 PEEKING→COVERED (close #2, −8, blown 2)   [t = 4.4]
    // → lands 0.2 s into a fresh COVERED beat. blown 2 < cap 4 → still ACTIVE.
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 4.6);
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
      // The wander seed must be finite (C6) so the pure wander never emits NaN.
      expect(Number.isFinite(s.targetSeed)).toBe(true);
      // And the authored spec seeds without tripping any invariant (C6/G4/G5/count).
      expect(() => createQte(s)).not.toThrow();
    }
  });

  it("belliard pins: a finite targetSeed and the rebalanced 1.4 s peek exposure", () => {
    const belliard = LEVELS.find((l) => l.id === "belliard")?.hostageQte;
    expect(belliard).toBeDefined();
    expect(Number.isFinite(belliard?.targetSeed)).toBe(true);
    expect(belliard?.peekDurationSeconds).toBe(1.4);
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
