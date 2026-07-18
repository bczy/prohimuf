import { describe, it, expect } from "vitest";
import {
  qteZoneAt,
  ringZoneAt,
  colourDamage,
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
  RING_HIT_RADIUS,
  CAPTOR_DAMAGE_VITAL,
  CAPTOR_DAMAGE_LIMB,
  HOSTAGE_DX_MIN,
  HOSTAGE_DX_MAX,
  HOSTAGE_DY_MIN,
  HOSTAGE_DY_MAX,
  wander,
  clampTargetOffsetG6,
  WANDER_CENTRE,
  WANDER_AMP_X,
  WANDER_AMP_Y,
  MAX_LEG_DISPLACEMENT,
  LEG_DURATION,
  G6_MARGIN,
  G6_PAD,
} from "@game/systems/qteSystem";
import type { HostageQte, QteSpec, RingZone } from "@game/types/hostageQte";
import { LEVELS } from "@game/levels/levels";

// Belliard-shaped default (spec §5), the static duel — spatial-colour ring revision.
// Anchor at origin ⇒ impactPoint IS the (dx, dy) offset. `maxBlownPeeks` is the loss clock;
// `captorHp` is the kill currency (a ring hit chips it by the drawn colour).
const SPEC: QteSpec = {
  triggerAtElapsedSeconds: 12,
  zoomSeconds: 2,
  anchor: { x: 0, y: 0 },
  maxBlownPeeks: 4,
  peekCadenceSeconds: 1.5,
  peekDurationSeconds: 1.5,
  targetSeed: 20260718,
  captorHp: 3,
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
// A point inside each backdrop band (anchor at origin ⇒ world == offset).
const BODY_PT = { x: 0.5, y: 0.4 };
const HOSTAGE_PT = { x: 0.4, y: -0.5 };
// The ring centre when the ring rests (COVERED/ZOOMING) — the wander centre.
const REST = WANDER_CENTRE;

describe("ringZoneAt — captor anatomy under the ring centre (hitbox diagram; VITAL > LIMB > OFF)", () => {
  it("classifies each anatomy zone in its interior", () => {
    // VITAL = the head strip dx [−0.20,+0.20] × dy [+0.58,+1.00].
    expect(ringZoneAt({ x: 0, y: 0.8 })).toBe("vital");
    // LIMB = torso + two shoulders.
    expect(ringZoneAt({ x: 0, y: 0.2 })).toBe("limb"); // torso
    expect(ringZoneAt({ x: -0.4, y: 0.6 })).toBe("limb"); // left shoulder
    expect(ringZoneAt({ x: 0.4, y: 0.6 })).toBe("limb"); // right shoulder
    // OFF = the gun-arm, the legs, the free right arm and empty air.
    expect(ringZoneAt({ x: -0.9, y: 0.3 })).toBe("off"); // gun-arm
    expect(ringZoneAt({ x: 0, y: -0.6 })).toBe("off"); // legs (below the torso)
    expect(ringZoneAt({ x: 0.9, y: 0.5 })).toBe("off"); // free right arm
    expect(ringZoneAt({ x: -2, y: 2 })).toBe("off"); // empty air
  });

  it("VITAL (head) band edges are inclusive; just outside the head is not VITAL", () => {
    // Corners of dx [−0.20,+0.20] × dy [+0.58,+1.00].
    expect(ringZoneAt({ x: -0.2, y: 0.58 })).toBe("vital");
    expect(ringZoneAt({ x: 0.2, y: 1.0 })).toBe("vital");
    expect(ringZoneAt({ x: 0.2, y: 0.58 })).toBe("vital");
    expect(ringZoneAt({ x: -0.2, y: 1.0 })).toBe("vital");
    // Just above the head (dy > 1.00), clear of every band → OFF.
    expect(ringZoneAt({ x: 0, y: 1.01 })).toBe("off");
  });

  it("LIMB torso/shoulder band edges are inclusive", () => {
    // Torso dx [−0.32,+0.32] × dy [−0.05,+0.58].
    expect(ringZoneAt({ x: -0.32, y: -0.05 })).toBe("limb");
    expect(ringZoneAt({ x: 0.32, y: -0.05 })).toBe("limb");
    // Left shoulder dx [−0.58,−0.20] × dy [+0.46,+0.80].
    expect(ringZoneAt({ x: -0.58, y: 0.46 })).toBe("limb");
    expect(ringZoneAt({ x: -0.58, y: 0.8 })).toBe("limb");
    // Right shoulder dx [+0.20,+0.58] × dy [+0.46,+0.80].
    expect(ringZoneAt({ x: 0.58, y: 0.8 })).toBe("limb");
    // Just left of the left shoulder (dx < −0.58) → OFF.
    expect(ringZoneAt({ x: -0.59, y: 0.6 })).toBe("off");
    // Just below the torso (dy < −0.05) → OFF (the legs).
    expect(ringZoneAt({ x: 0, y: -0.06 })).toBe("off");
  });

  it("VITAL wins where the head abuts the torso/shoulders (precedence, not position)", () => {
    // dy = +0.58 sits in BOTH the torso (top edge) and the head (bottom edge) → VITAL.
    expect(ringZoneAt({ x: 0, y: 0.58 })).toBe("vital");
    // dx = −0.20 / dy = +0.60 sits in BOTH the left shoulder and the head → VITAL.
    expect(ringZoneAt({ x: -0.2, y: 0.6 })).toBe("vital");
    // dx = +0.20 / dy = +0.60 sits in BOTH the right shoulder and the head → VITAL.
    expect(ringZoneAt({ x: 0.2, y: 0.6 })).toBe("vital");
  });

  it("a point just below the head (dy +0.57) drops to the torso LIMB, not the head", () => {
    // dy +0.57 is out of the head [+0.58,…] but inside the torso [−0.05,+0.58] → LIMB.
    expect(ringZoneAt({ x: 0, y: 0.57 })).toBe("limb");
  });
});

describe("colourDamage — per-zone chip", () => {
  it("vital → 2, limb → 1, off → 0 (matching the exported constants)", () => {
    expect(colourDamage("vital")).toBe(CAPTOR_DAMAGE_VITAL);
    expect(colourDamage("limb")).toBe(CAPTOR_DAMAGE_LIMB);
    expect(colourDamage("off")).toBe(0);
    expect(CAPTOR_DAMAGE_VITAL).toBe(2);
    expect(CAPTOR_DAMAGE_LIMB).toBe(1);
  });
});

describe("qteZoneAt — off-ring backdrop only (head band retired, stance-free)", () => {
  it("classifies hostage, body and miss (two-arg signature)", () => {
    expect(qteZoneAt(BODY_PT.x, BODY_PT.y)).toBe("body");
    expect(qteZoneAt(HOSTAGE_PT.x, HOSTAGE_PT.y)).toBe("hostage");
    expect(qteZoneAt(3, 3)).toBe("miss");
    expect(qteZoneAt(0, 2.0)).toBe("miss");
    expect(qteZoneAt(NO_HIT.x, NO_HIT.y)).toBe("miss");
  });

  it("gives the hostage silhouette precedence over the captor body", () => {
    expect(qteZoneAt(0.3, -0.4)).toBe("hostage");
  });
});

describe("tickQte — RING hit resolution (spatial-colour)", () => {
  it("a shot inside RING_HIT_RADIUS while PEEKING chips HP by the drawn ringZone (no energy)", () => {
    // Ring centred at REST; a hit dead-centre.
    for (const [zone, dmg] of [
      ["vital", CAPTOR_DAMAGE_VITAL],
      ["limb", CAPTOR_DAMAGE_LIMB],
    ] as const) {
      const q = active({ stance: "PEEKING", captorHp: 10, ringZone: zone, targetOffset: REST });
      const r = tickQte(q, true, REST, 0.05);
      expect(r.qte.phase).toBe("ACTIVE");
      expect(r.qte.captorHp).toBe(10 - dmg);
      expect(r.energyDelta).toBe(0); // a chip charges NO energy
    }
  });

  it("a hit just OUTSIDE the ring radius falls through to qteZoneAt (no HP chip)", () => {
    const q = active({ stance: "PEEKING", captorHp: 5, ringZone: "vital", targetOffset: REST });
    // Just past the radius, still over the body band → a body bleed, HP untouched.
    const impact = { x: REST.x + RING_HIT_RADIUS + 0.01, y: REST.y };
    expect(Math.hypot(impact.x - REST.x, impact.y - REST.y)).toBeGreaterThan(RING_HIT_RADIUS);
    const r = tickQte(q, true, impact, 0.05);
    expect(r.qte.captorHp).toBe(5); // never chipped — the ring was missed
    expect(r.energyDelta).toBe(QTE_BODY_HIT);
  });

  it("a dead-centre hit while COVERED is NOT a ring hit — it falls to qteZoneAt", () => {
    const q = active({ stance: "COVERED", captorHp: 5, ringZone: "off", targetOffset: REST });
    const r = tickQte(q, true, REST, 0.05); // REST is over the captor body band
    expect(r.qte.captorHp).toBe(5); // covered never chips
    expect(r.energyDelta).toBe(QTE_BODY_HIT);
  });

  it("an OFF (red) ring hit chips 0 but STILL consumes the shot (no qteZoneAt fall-through)", () => {
    // REST is over the body band, so a fall-through would bleed −5; asserting 0 proves the
    // shot resolved as a (zero-damage) ring hit, not a backdrop hit.
    const q = active({ stance: "PEEKING", captorHp: 3, ringZone: "off", targetOffset: REST });
    const r = tickQte(q, true, REST, 0.05);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.captorHp).toBe(3);
    expect(r.energyDelta).toBe(0);
  });

  it("depleting captorHp to 0 or below → WON (+refill), captorHp pinned at 0", () => {
    // One VITAL chip is enough at 2 HP.
    const q2 = active({ stance: "PEEKING", captorHp: 2, ringZone: "vital", targetOffset: REST });
    const won = tickQte(q2, true, REST, 0.05);
    expect(won.qte.phase).toBe("WON");
    expect(won.qte.captorHp).toBe(0);
    expect(won.energyDelta).toBe(QTE_RESCUE_REFILL);
  });

  it("chip-to-kill across two peeks: first hit records HP (ACTIVE), second depletes → WON", () => {
    let q = active({ stance: "PEEKING", captorHp: 3, ringZone: "vital", targetOffset: REST });
    const first = tickQte(q, true, REST, 0.02); // 3 → 1, still alive
    expect(first.qte.phase).toBe("ACTIVE");
    expect(first.qte.captorHp).toBe(1);
    expect(first.energyDelta).toBe(0);
    // Re-arm a fresh vital peek (the wander would move it; we pin the cache for the assertion).
    q = { ...first.qte, stance: "PEEKING", ringZone: "vital", targetOffset: REST };
    const second = tickQte(q, true, REST, 0.02); // 1 → −1 → WON
    expect(second.qte.phase).toBe("WON");
    expect(second.qte.captorHp).toBe(0);
    expect(second.energyDelta).toBe(QTE_RESCUE_REFILL);
  });
});

describe("wander — pure, deterministic, replay-safe ring drift (wider box + speed cap)", () => {
  const SEED = SPEC.targetSeed;

  it("is a pure function: same (seed, peekIndex, t) → identical Vec2", () => {
    for (const t of [0, 0.13, LEG_DURATION, 0.7, 1.1, 1.5]) {
      expect(wander(SEED, 0, t)).toEqual(wander(SEED, 0, t));
    }
  });

  it("stays within the WIDER amplitude box for all t (convex blend of in-box waypoints)", () => {
    for (let t = 0; t <= 2; t += 0.017) {
      const w = wander(SEED, 1, t);
      expect(Math.abs(w.x)).toBeLessThanOrEqual(WANDER_AMP_X + 1e-9);
      expect(Math.abs(w.y)).toBeLessThanOrEqual(WANDER_AMP_Y + 1e-9);
    }
    // The hitbox-diagram roam box: wide across the shoulders, short in height.
    expect(WANDER_AMP_X).toBeCloseTo(0.78);
    expect(WANDER_AMP_Y).toBeCloseTo(0.4);
  });

  it("MAX_LEG_DISPLACEMENT caps each leg: adjacent decel waypoints are ≤ the cap apart", () => {
    for (let pi = 0; pi < 6; pi++) {
      for (let k = 0; k < 4; k++) {
        const a = wander(SEED, pi, k * LEG_DURATION);
        const b = wander(SEED, pi, (k + 1) * LEG_DURATION);
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(MAX_LEG_DISPLACEMENT + 1e-6);
      }
    }
  });

  it("framerate-independent: the same total elapsed re-chunked yields the SAME offset", () => {
    let acc = 0;
    for (const d of [0.1, 0.05, 0.2, 0.03, 0.12, 0.4]) acc += d; // = 0.9
    const oneShot = wander(SEED, 2, 0.9);
    const chunked = wander(SEED, 2, acc);
    expect(chunked.x).toBeCloseTo(oneShot.x, 12);
    expect(chunked.y).toBeCloseTo(oneShot.y, 12);
  });

  it("tickQte: reaching the same peek-elapsed via different delta chunks → same targetOffset", () => {
    const base = active({ stance: "PEEKING", stanceRemaining: SPEC.peekDurationSeconds });
    const a = tickQte(base, false, NO_HIT, 0.3);
    let q = base;
    for (let i = 0; i < 3; i++) q = tickQte(q, false, NO_HIT, 0.1).qte;
    expect(a.qte.stance).toBe("PEEKING");
    expect(q.stance).toBe("PEEKING");
    expect(q.targetOffset.x).toBeCloseTo(a.qte.targetOffset.x, 12);
    expect(q.targetOffset.y).toBeCloseTo(a.qte.targetOffset.y, 12);
  });
});

describe("G6 — box-disjoint: the ring circle never touches the hostage AABB (asserted clamp)", () => {
  // The dilated hostage box (forbidden region for the ring CENTRE).
  const fxMin = HOSTAGE_DX_MIN - G6_PAD; // −0.40
  const fyMax = HOSTAGE_DY_MAX + G6_PAD; //  0.55

  it("G6_PAD is RING_HIT_RADIUS + G6_MARGIN", () => {
    expect(G6_PAD).toBeCloseTo(RING_HIT_RADIUS + G6_MARGIN);
    expect(G6_PAD).toBeCloseTo(0.4);
  });

  it("a centre inside the forbidden box is pushed LEFT off his flank when that is cheaper", () => {
    // {0, −0.5}: closer to the left edge (cost 0.40) than the top edge (cost 1.05) → push left.
    const clamped = clampTargetOffsetG6({ x: 0, y: -0.5 });
    expect(clamped.x).toBeCloseTo(fxMin);
    expect(clamped.y).toBe(-0.5); // y untouched on a left push
  });

  it("a centre inside the forbidden box is pushed UP above her head when that is cheaper", () => {
    // {0.5, 0.5}: closer to the top edge (cost 0.05) than the left edge (cost 0.90) → push up.
    const clamped = clampTargetOffsetG6({ x: 0.5, y: 0.5 });
    expect(clamped.y).toBeCloseTo(fyMax);
    expect(clamped.x).toBe(0.5); // x untouched on an up push
  });

  it("the centre-top strip is head-reachable: clampTargetOffsetG6({x:0,y:0.8}) is UNCLAMPED", () => {
    // The head kill zone sits ABOVE the forbidden box (y > fyMax) → passes through untouched.
    expect(clampTargetOffsetG6({ x: 0, y: 0.8 })).toEqual({ x: 0, y: 0.8 });
    // An already-clear offset off his left flank (x < fxMin) also passes through.
    expect(clampTargetOffsetG6({ x: -0.6, y: 0.6 })).toEqual({ x: -0.6, y: 0.6 });
  });

  it("is idempotent — clamping a clamped centre is a no-op", () => {
    for (const p of [
      { x: 0, y: -0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.9, y: 0.1 },
    ]) {
      const once = clampTargetOffsetG6(p);
      expect(clampTargetOffsetG6(once)).toEqual(once);
    }
  });

  it("dense raw-offset grid: the clamped ring circle stays clear of the hostage AABB (gap ≥ margin)", () => {
    // A dense grid well beyond the roam box exercises the clamp net on every side.
    let minDist = Infinity;
    for (let x = -1.5; x <= 1.5 + 1e-9; x += 0.01) {
      for (let y = -1.8; y <= 1.4 + 1e-9; y += 0.01) {
        const c = clampTargetOffsetG6({ x, y });
        const cx = Math.min(Math.max(c.x, HOSTAGE_DX_MIN), HOSTAGE_DX_MAX);
        const cy = Math.min(Math.max(c.y, HOSTAGE_DY_MIN), HOSTAGE_DY_MAX);
        minDist = Math.min(minDist, Math.hypot(c.x - cx, c.y - cy));
      }
    }
    // The circle of radius RING_HIT_RADIUS never reaches the band, with the G6_MARGIN gap.
    expect(minDist).toBeGreaterThan(RING_HIT_RADIUS);
    expect(minDist).toBeGreaterThanOrEqual(RING_HIT_RADIUS + G6_MARGIN - 1e-9);
  });

  it("dense sweep of the FULL new roam box: clamped wander centres stay clear of the hostage AABB", () => {
    // Roam box: dx [−0.98,+0.58], dy [+0.20,+1.00]. The over-hostage wedge is clamped out.
    let minDist = Infinity;
    for (let x = -0.98; x <= 0.58 + 1e-9; x += 0.01) {
      for (let y = 0.2; y <= 1.0 + 1e-9; y += 0.01) {
        const c = clampTargetOffsetG6({ x, y });
        const cx = Math.min(Math.max(c.x, HOSTAGE_DX_MIN), HOSTAGE_DX_MAX);
        const cy = Math.min(Math.max(c.y, HOSTAGE_DY_MIN), HOSTAGE_DY_MAX);
        minDist = Math.min(minDist, Math.hypot(c.x - cx, c.y - cy));
      }
    }
    expect(minDist).toBeGreaterThan(RING_HIT_RADIUS);
  });
});

describe("targetOffset & ringZone — rest OFF when covered, wander/classify when peeking", () => {
  it("seeds resting at WANDER_CENTRE with ringZone OFF", () => {
    const seeded = createQte(SPEC);
    expect(seeded.targetOffset).toEqual(WANDER_CENTRE);
    expect(seeded.ringZone).toBe<RingZone>("off");
  });

  it("stays OFF and resting through a ZOOMING and a COVERED tick", () => {
    const z = tickQte(createQte(SPEC), false, NO_HIT, 0.1);
    expect(z.qte.targetOffset).toEqual(WANDER_CENTRE);
    expect(z.qte.ringZone).toBe("off");
    const covered = tickQte(
      active({ stance: "COVERED", stanceRemaining: 1.0 }),
      false,
      NO_HIT,
      0.1,
    );
    expect(covered.qte.stance).toBe("COVERED");
    expect(covered.qte.targetOffset).toEqual(WANDER_CENTRE);
    expect(covered.qte.ringZone).toBe("off");
  });

  it("a peek CLOSE resets the ring to rest, OFF", () => {
    const r = tickQte(active({ stance: "PEEKING", stanceRemaining: 0.05 }), false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.targetOffset).toEqual(WANDER_CENTRE);
    expect(r.qte.ringZone).toBe("off");
  });

  it("during PEEKING the ring wanders off centre and ringZone = ringZoneAt(targetOffset)", () => {
    const r = tickQte(
      active({ stance: "PEEKING", stanceRemaining: SPEC.peekDurationSeconds }),
      false,
      NO_HIT,
      0.3,
    );
    expect(r.qte.stance).toBe("PEEKING");
    expect(r.qte.ringZone).toBe(ringZoneAt(r.qte.targetOffset));
    // The ring circle stays clear of the hostage AABB (box-disjoint G6).
    const c = r.qte.targetOffset;
    const cx = Math.min(Math.max(c.x, HOSTAGE_DX_MIN), HOSTAGE_DX_MAX);
    const cy = Math.min(Math.max(c.y, HOSTAGE_DY_MIN), HOSTAGE_DY_MAX);
    expect(Math.hypot(c.x - cx, c.y - cy)).toBeGreaterThan(RING_HIT_RADIUS);
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
  it("seeds ZOOMING, COVERED, static anchor, full captorHp, ring rest/OFF and the warning up", () => {
    const q = createQte(SPEC);
    expect(q.phase).toBe("ZOOMING");
    expect(q.stance).toBe("COVERED");
    expect(q.telegraphActive).toBe(false);
    expect(q.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(q.anchor).toEqual({ x: 0, y: 0 });
    expect(q.blownPeeks).toBe(0);
    expect(q.maxBlownPeeks).toBe(SPEC.maxBlownPeeks);
    expect(q.captorHp).toBe(SPEC.captorHp);
    expect(q.ringZone).toBe("off");
    expect(q.peekCadenceSeconds).toBe(SPEC.peekCadenceSeconds);
    expect(q.zoomRemaining).toBe(2);
    expect(q.resultRemaining).toBe(QTE_RESULT_HOLD);
    expect(q.warning).toBe(true);
  });

  it("G5: clamps a sub-floor authored exposure up to PEEK_EXPOSURE_FLOOR", () => {
    const q = createQte({ ...SPEC, peekDurationSeconds: 0.3 });
    expect(q.peekDurationSeconds).toBe(PEEK_EXPOSURE_FLOOR);
    expect(createQte(SPEC).peekDurationSeconds).toBe(1.5);
  });

  it("G4: throws unless peekCadenceSeconds is STRICTLY > TELEGRAPH_LEAD_SECONDS", () => {
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: 0.2 })).toThrow(/G4/);
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: TELEGRAPH_LEAD_SECONDS })).toThrow(/G4/);
    expect(SPEC.peekCadenceSeconds).toBeGreaterThan(TELEGRAPH_LEAD_SECONDS);
  });

  it("throws unless maxBlownPeeks is an integer ≥ 1 (the failure clock must count)", () => {
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 0 })).toThrow(/maxBlownPeeks/);
    expect(() => createQte({ ...SPEC, maxBlownPeeks: -1 })).toThrow(/maxBlownPeeks/);
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 2.5 })).toThrow(/maxBlownPeeks/);
    expect(() => createQte({ ...SPEC, maxBlownPeeks: 1 })).not.toThrow();
  });

  it("throws unless captorHp is an integer ≥ 1 (the kill currency must deplete)", () => {
    expect(() => createQte({ ...SPEC, captorHp: 0 })).toThrow(/captorHp/);
    expect(() => createQte({ ...SPEC, captorHp: -2 })).toThrow(/captorHp/);
    expect(() => createQte({ ...SPEC, captorHp: 1.5 })).toThrow(/captorHp/);
    expect(() => createQte({ ...SPEC, captorHp: 1 })).not.toThrow();
  });

  it("C6: throws on a non-finite authored numeric (NaN/Infinity), captorHp included", () => {
    expect(() => createQte({ ...SPEC, maxBlownPeeks: NaN })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, anchor: { x: Infinity, y: 0 } })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, peekCadenceSeconds: NaN })).toThrow(/C6/);
    expect(() => createQte({ ...SPEC, captorHp: Infinity })).toThrow(/C6/);
  });
});

describe("tickQte — ZOOMING", () => {
  it("counts the zoom down and penalises a panic shot each beat", () => {
    const r = tickQte(createQte(SPEC), true, REST, 0.1);
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
    expect(r.qte.anchor).toEqual({ x: 0, y: 0 });
  });

  it("still penalises a panic shot on the tick the zoom elapses", () => {
    const r = tickQte({ ...createQte(SPEC), zoomRemaining: 0.05 }, true, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.energyDelta).toBe(QTE_PANIC_SHOT);
  });
});

describe("tickQte — off-ring shots bleed energy but never damage the captor", () => {
  it("body / hostage / miss (off ring) never chip HP", () => {
    const body = tickQte(active({ stance: "PEEKING", ringZone: "off" }), true, BODY_PT, 0.1);
    expect(body.qte.phase).toBe("ACTIVE");
    expect(body.qte.captorHp).toBe(SPEC.captorHp);
    expect(body.energyDelta).toBe(QTE_BODY_HIT);
    const hostage = tickQte(active({ stance: "PEEKING", ringZone: "off" }), true, HOSTAGE_PT, 0.1);
    expect(hostage.qte.captorHp).toBe(SPEC.captorHp);
    expect(hostage.energyDelta).toBe(QTE_HOSTAGE_HIT);
    const miss = tickQte(active({ stance: "PEEKING", ringZone: "off" }), true, NO_HIT, 0.1);
    expect(miss.qte.captorHp).toBe(SPEC.captorHp);
    expect(miss).toMatchObject({ energyDelta: 0 });
  });
});

describe("tickQte — the blown-peeks execution clock & tie-break", () => {
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
    expect(closes).toBe(SPEC.maxBlownPeeks);
    expect(q.blownPeeks).toBe(SPEC.maxBlownPeeks);
    expect(drain).toBe(SPEC.maxBlownPeeks * QTE_UNANSWERED_PEEK);
  });

  it("a large delta HALTS at exactly the Nth (fatal) close — no overshoot", () => {
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 100);
    expect(r.qte.phase).toBe("LOST");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks);
    expect(r.qte.ringZone).toBe("off"); // the ring rests at the execution
    expect(r.energyDelta).toBe(SPEC.maxBlownPeeks * QTE_UNANSWERED_PEEK);
  });

  it("blown-peek redefined: a NON-killing chip on the fatal peek still LOSES (chip ≠ answer)", () => {
    // A limb chip drops HP 3→2 but leaves the captor alive, so the peek still blows → LOST.
    const q = active({
      stance: "PEEKING",
      stanceRemaining: 0.05,
      blownPeeks: SPEC.maxBlownPeeks - 1,
      captorHp: 3,
      ringZone: "limb",
    });
    const r = tickQte(q, true, REST, 0.1);
    expect(r.qte.phase).toBe("LOST");
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks);
    expect(r.qte.captorHp).toBe(2); // the chip landed…
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK); // …but only the close is charged
  });

  it("tie-break: a DEPLETING ring hit on the fatal peek → WON, not LOST", () => {
    const q = active({
      stance: "PEEKING",
      stanceRemaining: 0.05,
      blownPeeks: SPEC.maxBlownPeeks - 1,
      captorHp: 2,
      ringZone: "vital",
    });
    const r = tickQte(q, true, REST, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.qte.captorHp).toBe(0);
    expect(r.energyDelta).toBe(QTE_RESCUE_REFILL);
    expect(r.qte.blownPeeks).toBe(SPEC.maxBlownPeeks - 1); // the shot won before the close
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

  it("the anchor never mutates across ticks (static duel)", () => {
    let q = active();
    const anchor0 = q.anchor;
    const dt = 1 / 60;
    for (let i = 0; i < 300 && q.phase === "ACTIVE"; i++) {
      const r = tickQte(q, false, NO_HIT, dt);
      expect(r.qte.anchor).toBe(anchor0);
      q = r.qte;
    }
  });
});

describe("tickQte — peek sub-machine, telegraph & counter-fire", () => {
  it("a passive run surfaces exactly maxBlownPeeks fully-closed exposures before the loss", () => {
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
    expect(peekDrain).toBe(closes * QTE_UNANSWERED_PEEK);
  });

  it("the G4 tell shows in the last TELEGRAPH_LEAD_SECONDS of every COVERED beat", () => {
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
    expect(r.energyDelta).toBe(0);
    expect(r.qte.blownPeeks).toBe(0);
  });

  it("a PEEKING→COVERED close charges the unanswered-peek drain ONCE and counts one blown peek", () => {
    const q = active({ stance: "PEEKING", stanceRemaining: 0.05 });
    const r = tickQte(q, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.stanceRemaining).toBe(SPEC.peekCadenceSeconds);
    expect(r.qte.blownPeeks).toBe(1);
    expect(r.energyDelta).toBe(QTE_UNANSWERED_PEEK);
  });

  it("a long exposure is NOT over-billed — the drain fires only on the close tick", () => {
    const mid = active({ stance: "PEEKING", stanceRemaining: 1.0 });
    const r = tickQte(mid, false, NO_HIT, 0.1);
    expect(r.qte.stance).toBe("PEEKING");
    expect(r.energyDelta).toBe(0);
    expect(r.qte.blownPeeks).toBe(0);
  });

  it("C1: a large delta spanning ≥2 stance boundaries charges each closed peek once", () => {
    // COVERED with 0.1 s left, then a single 4.7 s delta (peekDuration 1.5, cadence 1.5):
    //   0.1  COVERED→PEEKING (open, free)
    //   +1.5 PEEKING→COVERED (close #1, −8, blown 1)
    //   +1.5 COVERED→PEEKING (open, free)
    //   +1.5 PEEKING→COVERED (close #2, −8, blown 2)   [t = 4.6]
    // → lands 0.1 s into a fresh COVERED beat. blown 2 < cap 4 → still ACTIVE.
    const q = active({ stance: "COVERED", stanceRemaining: 0.1 });
    const r = tickQte(q, false, NO_HIT, 4.7);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.stance).toBe("COVERED");
    expect(r.qte.blownPeeks).toBe(2);
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
      const after = tickQte(done.qte, true, REST, 0.1);
      expect(after.qte.phase).toBe("DONE");
      expect(after).toMatchObject({ energyDelta: 0 });
    }
  });

  it("holds while resultRemaining is positive, charging nothing", () => {
    const won = active({ phase: "WON", resultRemaining: 1.0 });
    const r = tickQte(won, true, REST, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.qte.resultRemaining).toBeCloseTo(0.9);
    expect(r).toMatchObject({ energyDelta: 0 });
  });
});

describe("K-5 — the pinned belliard seed presents ≥1 on-captor decel window per peek", () => {
  const belliard = LEVELS.find((l) => l.id === "belliard")?.hostageQte;

  it("each of the 4 peeks has a vital∪limb decelerating waypoint (fair firing window)", () => {
    expect(belliard).toBeDefined();
    if (belliard === undefined) return;
    const seed = belliard.targetSeed;
    // Decel windows = the zero-velocity waypoints reached at t = k·LEG_DURATION, k = 0..maxLeg.
    const maxLeg = Math.floor((belliard.peekDurationSeconds - 1e-9) / LEG_DURATION);
    for (let pi = 0; pi < belliard.maxBlownPeeks; pi++) {
      let onCaptor = 0;
      for (let k = 0; k <= maxLeg; k++) {
        const w = wander(seed, pi, k * LEG_DURATION);
        const centre = clampTargetOffsetG6({ x: WANDER_CENTRE.x + w.x, y: WANDER_CENTRE.y + w.y });
        if (ringZoneAt(centre) !== "off") onCaptor++;
      }
      expect(onCaptor, `peek ${String(pi)} has no on-captor decel window`).toBeGreaterThanOrEqual(
        1,
      );
    }
  });
});

describe("real level data honours the safety floors", () => {
  it("every authored hostageQte clears the floors and seeds without tripping an invariant", () => {
    const specs = LEVELS.map((l) => l.hostageQte).filter((s): s is QteSpec => s !== undefined);
    expect(specs.length).toBeGreaterThan(0);
    for (const s of specs) {
      expect(s.peekDurationSeconds).toBeGreaterThanOrEqual(PEEK_EXPOSURE_FLOOR);
      expect(s.peekCadenceSeconds).toBeGreaterThan(TELEGRAPH_LEAD_SECONDS);
      expect(Number.isInteger(s.maxBlownPeeks)).toBe(true);
      expect(s.maxBlownPeeks).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(s.captorHp)).toBe(true);
      expect(s.captorHp).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(s.targetSeed)).toBe(true);
      expect(() => createQte(s)).not.toThrow();
    }
  });

  it("belliard pins: captorHp 3, a 1.5 s peek exposure and a finite seed", () => {
    const belliard = LEVELS.find((l) => l.id === "belliard")?.hostageQte;
    expect(belliard).toBeDefined();
    expect(belliard?.captorHp).toBe(3);
    expect(belliard?.peekDurationSeconds).toBe(1.5);
    expect(Number.isFinite(belliard?.targetSeed)).toBe(true);
  });
});

describe("severity order", () => {
  it("body < panic < unanswered peek ≪ hostage, and rescue dominates", () => {
    expect(Math.abs(QTE_BODY_HIT)).toBeLessThan(Math.abs(QTE_PANIC_SHOT));
    expect(Math.abs(QTE_PANIC_SHOT)).toBeLessThan(Math.abs(QTE_UNANSWERED_PEEK));
    expect(Math.abs(QTE_UNANSWERED_PEEK)).toBeLessThan(Math.abs(QTE_HOSTAGE_HIT));
    expect(QTE_RESCUE_REFILL).toBeGreaterThan(Math.abs(QTE_HOSTAGE_HIT));
  });
});
