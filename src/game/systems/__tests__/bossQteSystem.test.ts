import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BOSS_DECOR_DAMAGE,
  BOSS_LIMB_WANDER_AMP_X,
  BOSS_LIMB_WANDER_AMP_Y,
  BOSS_LIMB_WANDER_CENTRE,
  BOSS_PARRY_POINT,
  BOSS_PHASE_TABLE,
  BOSS_RING_B_SALT,
  BOSS_TELEGRAPH_LEAD_FLOOR,
  BOSS_VITAL_WANDER_AMP_X,
  BOSS_VITAL_WANDER_AMP_Y,
  BOSS_VITAL_WANDER_CENTRE,
  BOSS_WANDER_CENTRE,
  FINISHER_HOLD_SECONDS,
  PEEK_EXPOSURE_FLOOR,
  PHASE_BREAK_SECONDS,
  QTE_BODY_HIT,
  QTE_BOSS_REFILL,
  QTE_CHARGED_WHIFF,
  QTE_PANIC_SHOT,
  QTE_PARRY_CHIP,
  QTE_RENFORT_DRAIN,
  RENFORT_SURGE,
  RING_HIT_RADIUS,
  STAGGER_SECONDS,
  bossColourDamage,
  bossQteZoneAt,
  bossRingZoneAt,
  bossWander,
  bossWanderBox,
  bossWanderLegDuration,
  createBossQte,
  isBossQteActive,
  isChargedWindow,
  isRenfortWindow,
  phaseIndexAt,
  shouldTriggerBossQte,
  tickBossQte,
} from "../bossQteSystem";
import type { BossPhaseTuning } from "../bossQteSystem";
import type { BossQte, BossQteSpec } from "@game/types/bossQte";
import type { Vec2 } from "@game/types/vector";

/** Safe phase-table access (the codebase forbids non-null assertions). */
function phaseRow(i: number): BossPhaseTuning {
  const row = BOSS_PHASE_TABLE[i];
  if (row === undefined) throw new Error(`no escalation row for phase ${String(i)}`);
  return row;
}

// A canonical, valid authored spec: 3 phases, 24 HP (3×8), the harness defaults.
const SPEC: BossQteSpec = {
  zoomSeconds: 2,
  anchor: { x: 0, y: 0 },
  phaseCount: 3,
  bossHp: 24,
  maxBlownWindows: 10,
  targetSeed: 20260719,
};

/** Drive a fresh QTE past the 2 s zoom into ACTIVE, SHIELDED (phase 0). */
function toActive(): BossQte {
  const zooming = createBossQte(SPEC);
  const r = tickBossQte(zooming, false, { x: 0, y: 0 }, SPEC.zoomSeconds);
  return r.qte;
}

const NO_HIT: Vec2 = { x: 999, y: 999 };

describe("bossQteSystem — pure spatial helpers", () => {
  it("colourDamage grades the ring by zone (vital 2 / limb 1 / off 0)", () => {
    expect(bossColourDamage("vital")).toBe(2);
    expect(bossColourDamage("limb")).toBe(1);
    expect(bossColourDamage("off")).toBe(0);
  });

  it("bossRingZoneAt reads the full-figure anatomy, VITAL > LIMB > OFF", () => {
    expect(bossRingZoneAt({ x: 0, y: 0.8 })).toBe("vital"); // head
    expect(bossRingZoneAt({ x: 0, y: 0.2 })).toBe("limb"); // torso
    expect(bossRingZoneAt({ x: -0.4, y: 0.6 })).toBe("limb"); // left shoulder
    expect(bossRingZoneAt({ x: 0.4, y: 0.6 })).toBe("limb"); // right shoulder
    expect(bossRingZoneAt({ x: 2, y: 2 })).toBe("off"); // empty air
  });

  it("bossQteZoneAt has NO hostage bavure zone — body inside the silhouette, else miss", () => {
    expect(bossQteZoneAt(0, 0)).toBe("body");
    expect(bossQteZoneAt(5, 5)).toBe("miss");
  });
});

describe("bossQteSystem — phaseIndexAt (render derives phase without re-encoding 16/8)", () => {
  it("maps 24 HP / 3 phases to thresholds 16 and 8 (0-based index)", () => {
    expect(phaseIndexAt(24, 24, 3)).toBe(0);
    expect(phaseIndexAt(17, 24, 3)).toBe(0);
    expect(phaseIndexAt(16, 24, 3)).toBe(1); // ≤ 16 → phase 2 (index 1)
    expect(phaseIndexAt(9, 24, 3)).toBe(1);
    expect(phaseIndexAt(8, 24, 3)).toBe(2); // ≤ 8 → phase 3 (index 2)
    expect(phaseIndexAt(1, 24, 3)).toBe(2);
  });

  it("clamps into [0, phaseCount − 1] at the extremes", () => {
    expect(phaseIndexAt(0, 24, 3)).toBe(2);
    expect(phaseIndexAt(24, 24, 1)).toBe(0); // mini-boss (1 phase)
    expect(phaseIndexAt(1, 24, 1)).toBe(0);
  });
});

describe("bossQteSystem — createBossQte safety invariants (asserted vs. authored spec)", () => {
  it("seeds a valid spec into ZOOMING at full HP", () => {
    const qte = createBossQte(SPEC);
    expect(qte.phase).toBe("ZOOMING");
    expect(qte.stance).toBe("SHIELDED");
    expect(qte.bossHp).toBe(24);
    expect(qte.bossHpMax).toBe(24);
    expect(qte.phaseCount).toBe(3);
    expect(qte.phaseIndex).toBe(0);
    expect(qte.blownWindows).toBe(0);
    expect(qte.stanceRemaining).toBe(phaseRow(0).shieldedLullSeconds);
    expect(qte.targetOffset).toEqual(BOSS_WANDER_CENTRE);
    expect(qte.warning).toBe(true);
  });

  it("rejects non-finite authored numerics (C6)", () => {
    expect(() => createBossQte({ ...SPEC, bossHp: Number.NaN })).toThrow(/finite/);
    expect(() => createBossQte({ ...SPEC, targetSeed: Number.POSITIVE_INFINITY })).toThrow(
      /finite/,
    );
    expect(() => createBossQte({ ...SPEC, anchor: { x: 0, y: Number.NaN } })).toThrow(/finite/);
  });

  it("requires phaseCount an integer ≥ 1 and ≤ the escalation table length", () => {
    expect(() => createBossQte({ ...SPEC, phaseCount: 0 })).toThrow(/phaseCount/);
    expect(() => createBossQte({ ...SPEC, phaseCount: 2.5 })).toThrow(/phaseCount/);
    expect(() => createBossQte({ ...SPEC, phaseCount: BOSS_PHASE_TABLE.length + 1 })).toThrow(
      /phaseCount/,
    );
    // A mini-boss (1 phase) is valid.
    expect(() => createBossQte({ ...SPEC, phaseCount: 1 })).not.toThrow();
  });

  it("requires bossHp and maxBlownWindows integers ≥ 1 (kill currency + failure clock)", () => {
    expect(() => createBossQte({ ...SPEC, bossHp: 0 })).toThrow(/bossHp/);
    expect(() => createBossQte({ ...SPEC, bossHp: 3.5 })).toThrow(/bossHp/);
    expect(() => createBossQte({ ...SPEC, maxBlownWindows: 0 })).toThrow(/maxBlownWindows/);
    expect(() => createBossQte({ ...SPEC, maxBlownWindows: 2.5 })).toThrow(/maxBlownWindows/);
  });

  it("the authored escalation table honours every asserted floor for every USED phase", () => {
    // These are the invariants createBossQte enforces against BOSS_PHASE_TABLE — proving the
    // shipped constants themselves are legal (ADR-0051 D7). A structural cross-check so a future
    // tuning edit that breaks a floor fails loudly here, not silently in play.
    for (let i = 0; i < SPEC.phaseCount; i++) {
      const row = phaseRow(i);
      expect(row.exposedSeconds).toBeGreaterThanOrEqual(PEEK_EXPOSURE_FLOOR);
      expect(row.telegraphLeadSeconds).toBeGreaterThanOrEqual(BOSS_TELEGRAPH_LEAD_FLOOR);
      expect(row.shieldedLullSeconds).toBeGreaterThan(row.telegraphLeadSeconds);
    }
    expect(PHASE_BREAK_SECONDS).toBeGreaterThanOrEqual(BOSS_TELEGRAPH_LEAD_FLOOR);
    // The spec's authored escalation magnitudes (spec §4.3), pinned so a drift is caught.
    expect(BOSS_PHASE_TABLE.map((r) => r.exposedSeconds)).toEqual([1.6, 1.3, 1.0]);
    expect(BOSS_PHASE_TABLE.map((r) => r.shieldedLullSeconds)).toEqual([2.0, 1.6, 1.2]);
    expect(BOSS_PHASE_TABLE.map((r) => r.telegraphLeadSeconds)).toEqual([0.45, 0.4, 0.35]);
    expect(BOSS_PHASE_TABLE.map((r) => r.shotDrain)).toEqual([-5, -6, -8]);
  });
});

describe("bossQteSystem — lifecycle predicates", () => {
  it("isBossQteActive freezes the scene while ZOOMING…LOST, resumes on DONE/null", () => {
    expect(isBossQteActive(null)).toBe(false);
    const base = createBossQte(SPEC);
    for (const phase of ["ZOOMING", "ACTIVE", "WON", "LOST"] as const) {
      expect(isBossQteActive({ ...base, phase })).toBe(true);
    }
    expect(isBossQteActive({ ...base, phase: "DONE" })).toBe(false);
  });

  it("shouldTriggerBossQte fires once, only at the kill quota, only with a spec", () => {
    expect(shouldTriggerBossQte(SPEC, null, 3, 3)).toBe(true);
    expect(shouldTriggerBossQte(SPEC, null, 2, 3)).toBe(false); // quota not reached
    expect(shouldTriggerBossQte(null, null, 3, 3)).toBe(false); // no boss authored
    expect(shouldTriggerBossQte(SPEC, createBossQte(SPEC), 3, 3)).toBe(false); // already fired
  });
});

describe("bossQteSystem — ZOOMING", () => {
  it("counts the zoom down, then opens the duel ACTIVE / SHIELDED", () => {
    let qte = createBossQte(SPEC);
    const r1 = tickBossQte(qte, false, NO_HIT, 0.5);
    expect(r1.qte.phase).toBe("ZOOMING");
    expect(r1.qte.zoomRemaining).toBeCloseTo(1.5);
    qte = tickBossQte(r1.qte, false, NO_HIT, 2).qte;
    expect(qte.phase).toBe("ACTIVE");
    expect(qte.stance).toBe("SHIELDED");
    expect(qte.stanceRemaining).toBe(phaseRow(0).shieldedLullSeconds);
    expect(qte.warning).toBe(false);
  });

  it("a shot during the zoom is a PANIC penalty (unreadable frame)", () => {
    const r = tickBossQte(createBossQte(SPEC), true, { x: 0, y: 0 }, 0.5);
    expect(r.energyDelta).toBe(QTE_PANIC_SHOT);
    expect(r.qte.phase).toBe("ZOOMING");
  });
});

describe("bossQteSystem — the SHIELDED↔EXPOSED window machine", () => {
  it("opens an EXPOSED window after the SHIELDED lull, resetting windowChipped", () => {
    const active = toActive(); // SHIELDED, lull 2.0
    const r = tickBossQte(active, false, NO_HIT, 2.0);
    expect(r.qte.stance).toBe("EXPOSED");
    expect(r.qte.stanceRemaining).toBeCloseTo(phaseRow(0).exposedSeconds);
    expect(r.qte.windowChipped).toBe(false);
    expect(r.qte.windowOrdinal).toBe(1);
  });

  it("shows the telegraph tell only in the last telegraphLeadSeconds of a SHIELDED beat", () => {
    const active = toActive(); // SHIELDED, stanceRemaining 2.0, lead 0.45
    const early = tickBossQte(active, false, NO_HIT, 1.0); // stanceRemaining 1.0 > 0.45
    expect(early.qte.telegraphActive).toBe(false);
    const late = tickBossQte(active, false, NO_HIT, 1.7); // stanceRemaining 0.3 ≤ 0.45
    expect(late.qte.stance).toBe("SHIELDED");
    expect(late.qte.telegraphActive).toBe(true);
  });

  it("charges the phase drain ONCE per blown (0-chip) window CLOSE, not per tick", () => {
    let qte = tickBossQte(toActive(), false, NO_HIT, 2.0).qte; // → EXPOSED, 1.6 s
    expect(qte.stance).toBe("EXPOSED");
    // Small ticks WITHIN the open window charge nothing.
    const mid = tickBossQte(qte, false, NO_HIT, 0.5);
    expect(mid.energyDelta).toBe(0);
    expect(mid.qte.blownWindows).toBe(0);
    // The tick that CLOSES the window (0 chips) charges the phase-1 drain ONCE.
    qte = mid.qte;
    const close = tickBossQte(qte, false, NO_HIT, 1.2); // remaining 1.1 → closes
    expect(close.qte.stance).toBe("SHIELDED");
    expect(close.qte.blownWindows).toBe(1);
    expect(close.energyDelta).toBe(phaseRow(0).shotDrain); // −5
  });

  it("a window that CHIPPED HP is answered — it does NOT blow on close", () => {
    // Hand-place an EXPOSED window with the ring on a VITAL centre, about to close.
    const active = toActive();
    const centre: Vec2 = { x: 0, y: 0.8 }; // vital
    const qte: BossQte = {
      ...active,
      stance: "EXPOSED",
      stanceRemaining: 0.1,
      windowChipped: false,
      windowOrdinal: 1,
      targetOffset: centre,
      ringZone: "vital",
    };
    // Fire dead-centre on the ring, with a delta that closes the window this tick.
    const r = tickBossQte(
      qte,
      true,
      { x: qte.anchor.x + centre.x, y: qte.anchor.y + centre.y },
      0.2,
    );
    expect(r.qte.bossHp).toBe(22); // 24 − 2 (vital)
    expect(r.qte.stance).toBe("SHIELDED"); // window closed
    expect(r.qte.blownWindows).toBe(0); // answered → not blown
    expect(r.energyDelta).toBe(0); // no drain (a ring chip charges no energy)
  });
});

describe("bossQteSystem — spatial-colour scoring", () => {
  function exposedWith(zone: "vital" | "limb" | "off", centre: Vec2): BossQte {
    return {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 1.0,
      windowChipped: false,
      windowOrdinal: 1,
      targetOffset: centre,
      ringZone: zone,
    };
  }

  it("a VITAL ring hit chips 2, a LIMB chips 1, an OFF-colour ring hit chips 0", () => {
    const vital = exposedWith("vital", { x: 0, y: 0.8 });
    expect(tickBossQte(vital, true, { x: 0, y: 0.8 }, 0.1).qte.bossHp).toBe(22);
    const limb = exposedWith("limb", { x: 0, y: 0.2 });
    expect(tickBossQte(limb, true, { x: 0, y: 0.2 }, 0.1).qte.bossHp).toBe(23);
    const off = exposedWith("off", { x: 2, y: 2 });
    const offRes = tickBossQte(off, true, { x: 2, y: 2 }, 0.1);
    expect(offRes.qte.bossHp).toBe(24); // 0 chip, shot consumed
    expect(offRes.energyDelta).toBe(0);
  });

  it("a shot that MISSES the ring bleeds −5 on the body, 0 in empty air", () => {
    const qte = exposedWith("vital", { x: 0, y: 0.8 });
    // Aim at the body silhouette but away from the ring (ring at (0,0.8), r 0.30).
    const bodyRes = tickBossQte(qte, true, { x: 0, y: -0.5 }, 0.1);
    expect(bodyRes.energyDelta).toBe(QTE_BODY_HIT);
    expect(bodyRes.qte.bossHp).toBe(24); // no ring chip
    const airRes = tickBossQte(qte, true, { x: 5, y: 5 }, 0.1);
    expect(airRes.energyDelta).toBe(0);
  });

  it("a shot while SHIELDED sprays the shield/body (−5) — never chips HP", () => {
    const active = toActive(); // SHIELDED
    const r = tickBossQte(active, true, { x: 0, y: 0 }, 0.1);
    expect(r.energyDelta).toBe(QTE_BODY_HIT);
    expect(r.qte.bossHp).toBe(24);
  });

  it("the ring hit tolerance is RING_HIT_RADIUS around the drawn centre", () => {
    const qte = exposedWith("vital", { x: 0, y: 0.8 });
    // Just inside the radius → hit (chips). Just outside → miss (body, no chip).
    const inside = tickBossQte(qte, true, { x: RING_HIT_RADIUS - 0.01, y: 0.8 }, 0.1);
    expect(inside.qte.bossHp).toBe(22);
    const outside = tickBossQte(qte, true, { x: 0, y: 0.8 + RING_HIT_RADIUS + 0.2 }, 0.1);
    expect(outside.qte.bossHp).toBe(24);
  });
});

describe("bossQteSystem — phase break (damage-free, telegraphed ACTIVE sub-state)", () => {
  it("crossing an HP threshold forces a re-SHIELD break, no damage, advances the phase", () => {
    // bossHp 17, a VITAL chip of 2 → 15, which crosses 16 into phase index 1.
    const qte: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 1.0,
      bossHp: 17,
      phaseIndex: 0,
      windowChipped: false,
      windowOrdinal: 1,
      targetOffset: { x: 0, y: 0.8 },
      ringZone: "vital",
    };
    const r = tickBossQte(qte, true, { x: 0, y: 0.8 }, 0.01);
    expect(r.qte.bossHp).toBe(15);
    expect(r.qte.phaseIndex).toBe(1);
    expect(r.qte.phaseBreakRemaining).toBeCloseTo(PHASE_BREAK_SECONDS);
    expect(r.qte.stance).toBe("SHIELDED");
    expect(r.energyDelta).toBe(0); // the crossing chip charges no energy
  });

  it("firing DURING a phase break is a PANIC shot and never chips HP (unreadable frame)", () => {
    const qte: BossQte = {
      ...toActive(),
      stance: "SHIELDED",
      phaseBreakRemaining: 0.5,
      bossHp: 15,
      phaseIndex: 1,
      targetOffset: { x: 0, y: 0.8 },
      ringZone: "vital",
    };
    const r = tickBossQte(qte, true, { x: 0, y: 0.8 }, 0.1);
    expect(r.energyDelta).toBe(QTE_PANIC_SHOT);
    expect(r.qte.bossHp).toBe(15); // damage-free
  });

  it("counts phaseBreakRemaining DOWN tick-by-tick under real clamped per-frame deltas", () => {
    // REGRESSION (code-review panel, PR #112): the real loop clamps delta to MAX_DELTA (0.1 s,
    // useGameLoop) and PHASE_BREAK_SECONDS is 1.0, so a break is NEVER crossed whole in a single
    // tick. phaseBreakRemaining must decrement every frame — else the render's brace pulse
    // (`1 − phaseBreakRemaining / PHASE_BREAK_SECONDS`) stays pinned at 0 and only snaps to 1 the
    // frame the break ends (when breakActive also flips false), so the animation never plays.
    const seed: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 1.0,
      bossHp: 17, // a VITAL chip of 2 → 15 crosses 16 into phase 1, opening the break
      phaseIndex: 0,
      windowChipped: false,
      windowOrdinal: 1,
      targetOffset: { x: 0, y: 0.8 },
      ringZone: "vital",
    };
    // The chip opens the break at its FULL duration on the trigger tick (small delta 0.01).
    let qte = tickBossQte(seed, true, { x: 0, y: 0.8 }, 0.01).qte;
    expect(qte.phaseBreakRemaining).toBeCloseTo(PHASE_BREAK_SECONDS);
    expect(qte.stance).toBe("SHIELDED");
    // Now drive the break down in 0.1 s frames (the clamped real delta). It must STRICTLY
    // decrease every frame until it reaches 0 (the break's end) — never stuck at the full value.
    let prev = qte.phaseBreakRemaining; // the full trigger value
    let frames = 0;
    let last = prev;
    for (let i = 0; i < 15; i++) {
      qte = tickBossQte(qte, false, NO_HIT, 0.1).qte;
      const now = qte.phaseBreakRemaining;
      expect(now).toBeLessThan(prev); // strictly decreasing every frame — no plateau
      prev = now;
      last = now;
      frames += 1;
      if (now <= 0) break;
    }
    expect(frames).toBeGreaterThan(5); // many frames of visible descent, not one snap
    expect(last).toBe(0); // reaches 0 → the brace pulse had time to play
  });

  it("the break ends into a fresh SHIELDED lull at the NEW phase (tighter cadence)", () => {
    const qte: BossQte = {
      ...toActive(),
      stance: "SHIELDED",
      phaseBreakRemaining: PHASE_BREAK_SECONDS,
      stanceRemaining: PHASE_BREAK_SECONDS,
      bossHp: 15,
      phaseIndex: 1,
    };
    const r = tickBossQte(qte, false, NO_HIT, PHASE_BREAK_SECONDS);
    expect(r.qte.phaseBreakRemaining).toBe(0);
    expect(r.qte.stance).toBe("SHIELDED");
    expect(r.qte.stanceRemaining).toBe(phaseRow(1).shieldedLullSeconds); // 1.6 (phase 2)
  });
});

describe("bossQteSystem — win / loss + deterministic tie-break", () => {
  it("depleting bossHp to 0 opens the FINISHER (lever 5), then resolves to WON (+refill)", () => {
    // ADR-0052 lever 5 CHANGE vs. V1: a depleting chip no longer returns WON directly — it
    // opens the ceremonial FINISHER beat first (energyDelta 0), which a click OR timeout
    // resolves to WON, paying QTE_BOSS_REFILL there (once).
    const qte: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 1.0,
      bossHp: 2,
      targetOffset: { x: 0, y: 0.8 },
      ringZone: "vital",
    };
    const r = tickBossQte(qte, true, { x: 0, y: 0.8 }, 0.1);
    expect(r.qte.phase).toBe("FINISHER");
    expect(r.qte.bossHp).toBe(0);
    expect(r.qte.finisherRemaining).toBeCloseTo(FINISHER_HOLD_SECONDS);
    expect(r.energyDelta).toBe(0); // no refill yet — the finisher is ceremonial
    const won = tickBossQte(r.qte, true, NO_HIT, 0.01);
    expect(won.qte.phase).toBe("WON");
    expect(won.energyDelta).toBe(QTE_BOSS_REFILL);
  });

  it("reaching maxBlownWindows via a 0-chip close LOSES (level fails)", () => {
    const qte: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 0.2,
      bossHp: 24,
      windowChipped: false,
      blownWindows: 9,
      maxBlownWindows: 10,
    };
    const r = tickBossQte(qte, false, NO_HIT, 0.5); // closes the fatal 10th blown window
    expect(r.qte.phase).toBe("LOST");
    expect(r.qte.blownWindows).toBe(10);
    expect(r.energyDelta).toBe(phaseRow(0).shotDrain); // the drain still charges once
  });

  it("a same-tick DEPLETING hit BEATS a same-tick fatal window → FINISHER (fire resolves first)", () => {
    const qte: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 0.05, // would close (fatally) this tick
      bossHp: 2,
      windowChipped: false,
      blownWindows: 9,
      maxBlownWindows: 10,
      targetOffset: { x: 0, y: 0.8 },
      ringZone: "vital",
    };
    const r = tickBossQte(qte, true, { x: 0, y: 0.8 }, 0.5);
    expect(r.qte.phase).toBe("FINISHER"); // NOT LOST — the shot resolved first (lever 5)
    expect(r.qte.bossHp).toBe(0);
    expect(r.energyDelta).toBe(0); // refill is paid on the FINISHER → WON resolution
  });

  it("a chipping-but-NOT-depleting hit does not avert a later fatal window in the same tick", () => {
    // Window A (open, ring limb) is chipped (→ answered, not blown), but a big delta then opens
    // and closes window B with 0 chips → the 10th blown window fires → LOST.
    const qte: BossQte = {
      ...toActive(),
      stance: "EXPOSED",
      stanceRemaining: 0.1, // window A closes almost immediately
      bossHp: 5,
      windowChipped: false,
      blownWindows: 9,
      maxBlownWindows: 10,
      phaseIndex: 0,
      targetOffset: { x: 0, y: 0.2 },
      ringZone: "limb",
    };
    // delta spans: A close (chipped→saved) + SHIELDED lull + B open + B close (blown 10th).
    const bigDelta = 0.1 + phaseRow(0).shieldedLullSeconds + phaseRow(0).exposedSeconds + 0.1;
    const r = tickBossQte(qte, true, { x: 0, y: 0.2 }, bigDelta);
    expect(r.qte.bossHp).toBe(4); // the limb chip landed
    expect(r.qte.phase).toBe("LOST"); // the chip did not save the fatal window B
  });

  it("WON/LOST hold for QTE_RESULT_HOLD, then resolve to DONE", () => {
    const won: BossQte = { ...toActive(), phase: "WON", resultRemaining: 2.2 };
    const held = tickBossQte(won, false, NO_HIT, 1.0);
    expect(held.qte.phase).toBe("WON");
    const done = tickBossQte(held.qte, false, NO_HIT, 2.0);
    expect(done.qte.phase).toBe("DONE");
  });
});

describe("bossQteSystem — seeded-pure determinism (ADR-0051 D7 / spec AC8)", () => {
  it("bossWander is a pure closed-form function of its inputs (no hidden state)", () => {
    const leg = bossWanderLegDuration(phaseRow(0).wanderSpeed);
    const a = bossWander(SPEC.targetSeed, 0, 0.4, leg);
    const b = bossWander(SPEC.targetSeed, 0, 0.4, leg);
    expect(a).toEqual(b);
    // Faster wander speed → shorter leg → the ring covers more ground per second.
    expect(bossWanderLegDuration(1.6)).toBeLessThan(bossWanderLegDuration(1.0));
  });

  it("a full duel driven twice with the same delta sequence is byte-identical (replay-safe)", () => {
    const run = (): BossQte => {
      let qte = toActive();
      for (let i = 0; i < 300; i++) {
        const fire = qte.stance === "EXPOSED" && qte.ringZone !== "off";
        const impact = {
          x: qte.anchor.x + qte.targetOffset.x,
          y: qte.anchor.y + qte.targetOffset.y,
        };
        qte = tickBossQte(qte, fire, impact, 1 / 60).qte;
        if (qte.phase !== "ACTIVE") break;
      }
      return qte;
    };
    expect(run()).toEqual(run());
  });

  it("the source uses NO Math.random / Date.now / performance.now (seeded-pure law)", () => {
    // Strip comments so the determinism-law prose ("NO Math.random / Date.now") in the source
    // docs doesn't self-trip; then assert no actual CALL site of a non-deterministic API exists.
    const src = readFileSync(resolve(process.cwd(), "src/game/systems/bossQteSystem.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/Math\.random\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
    expect(src).not.toMatch(/performance\.now\s*\(/);
  });
});

describe("bossQteSystem — winnability (K-5 discipline, harness seed)", () => {
  it("a competent player (rings + parry) clears 24 HP before the blown-window clock trips", () => {
    // A competent player who fires whenever the reticle sits on vital/limb AND parries every
    // charged window clears with margin (ADR-0051 gotcha / spec AC6, extended for the ADR-0052
    // full kit). Confirms the pinned seed presents landable windows/parries in each phase — a
    // structural stand-in for the stage-5 empirical seed pin.
    let qte = toActive();
    let won = false;
    for (let i = 0; i < 60 * 90; i++) {
      const canAct =
        qte.stance === "EXPOSED" && qte.phaseBreakRemaining <= 0 && qte.staggerRemaining <= 0;
      const parry = canAct && qte.chargedWindow;
      const onRing = canAct && !qte.chargedWindow && qte.ringZone !== "off";
      const fire = parry || onRing || qte.phase === "FINISHER";
      const impact = parry
        ? { x: qte.anchor.x + BOSS_PARRY_POINT.x, y: qte.anchor.y + BOSS_PARRY_POINT.y }
        : { x: qte.anchor.x + qte.targetOffset.x, y: qte.anchor.y + qte.targetOffset.y };
      qte = tickBossQte(qte, fire, impact, 1 / 60).qte;
      if (qte.phase === "WON") {
        won = true;
        break;
      }
      expect(qte.phase).not.toBe("LOST");
    }
    expect(won).toBe(true);
  });
});
