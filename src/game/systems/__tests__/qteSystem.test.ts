import { describe, it, expect } from "vitest";
import {
  qteZoneAt,
  isQteActive,
  shouldTriggerQte,
  createQte,
  tickQte,
  PART_DAMAGE,
  QTE_SUCCESS,
  HOSTAGE_HIT_PENALTY,
  QTE_TIMEOUT_PENALTY,
} from "@game/systems/qteSystem";
import type { HostageQte, QteSpec } from "@game/types/hostageQte";

const SPEC: QteSpec = {
  triggerAtElapsedSeconds: 10,
  captorHp: 4,
  hostageHp: 3,
  zoomSeconds: 2,
  windowSeconds: 5,
  bonusScore: 8,
  bonusEnergy: 15,
  anchor: { x: 0, y: 0 }, // anchor at origin ⇒ impactPoint IS the (dx, dy) offset
};

/** A fresh QTE already in the shootable ACTIVE phase (zoom skipped). */
function active(overrides: Partial<HostageQte> = {}): HostageQte {
  return { ...createQte(SPEC), phase: "ACTIVE", warning: false, zoomRemaining: 0, ...overrides };
}
const NO_HIT = { x: 0, y: 0 };

describe("qteZoneAt — body-part sub-zones + hostage + miss", () => {
  it("classifies each captor body part", () => {
    expect(qteZoneAt(0, 1.0)).toBe("head");
    expect(qteZoneAt(0, 0.3)).toBe("torso");
    expect(qteZoneAt(0.7, 0.3)).toBe("arm");
    expect(qteZoneAt(-0.5, 0.3)).toBe("arm");
    expect(qteZoneAt(-0.5, -0.5)).toBe("legs"); // his visible leg, low-left of her
  });

  it("classifies the kneeling hostage (front band + her head strip)", () => {
    expect(qteZoneAt(0, -0.5)).toBe("hostage");
    expect(qteZoneAt(0.4, -0.8)).toBe("hostage");
    // Her head rises over his waistline: still hostage (anti-bullshit precedence).
    expect(qteZoneAt(0.3, 0.1)).toBe("hostage");
  });

  it("is a miss outside the tableau silhouette", () => {
    expect(qteZoneAt(1.5, 0)).toBe("miss");
    expect(qteZoneAt(0, 2.0)).toBe("miss");
    expect(qteZoneAt(0, -1.6)).toBe("miss");
    expect(qteZoneAt(0.95, 0.3)).toBe("miss"); // beyond his shoulder width
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
    expect(shouldTriggerQte(SPEC, null, 9.9)).toBe(false);
    expect(shouldTriggerQte(SPEC, null, 10)).toBe(true);
    expect(shouldTriggerQte(SPEC, createQte(SPEC), 20)).toBe(false); // already fired
    expect(shouldTriggerQte(null, null, 99)).toBe(false); // no QTE this level
  });

  it("createQte seeds ZOOMING with full timers/health and the warning up", () => {
    const q = createQte(SPEC);
    expect(q.phase).toBe("ZOOMING");
    expect(q.captorHp).toBe(4);
    expect(q.captorHpMax).toBe(4);
    expect(q.hostageHp).toBe(3);
    expect(q.zoomRemaining).toBe(2);
    expect(q.windowRemaining).toBe(5);
    expect(q.warning).toBe(true);
  });
});

describe("tickQte — ZOOMING", () => {
  it("counts the zoom down and IGNORES fire", () => {
    const r = tickQte(createQte(SPEC), true, { x: 0, y: 1 }, 0.1);
    expect(r.qte.phase).toBe("ZOOMING");
    expect(r.qte.zoomRemaining).toBeCloseTo(1.9);
    expect(r.qte.captorHp).toBe(4); // no damage during the zoom
    expect(r).toMatchObject({ scoreDelta: 0, energyDelta: 0 });
  });

  it("opens the window when the zoom elapses", () => {
    const r = tickQte({ ...createQte(SPEC), zoomRemaining: 0.05 }, false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("ACTIVE");
    expect(r.qte.warning).toBe(false);
    expect(r.qte.windowRemaining).toBe(5);
  });
});

describe("tickQte — ACTIVE body-part resolution", () => {
  it("a head shot is a one-shot kill → WON with the success bonus (once)", () => {
    const r = tickQte(active(), true, { x: 0, y: 1 }, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.qte.captorHp).toBe(0);
    expect(r.scoreDelta).toBe(QTE_SUCCESS.scoreDelta);
    expect(r.energyDelta).toBe(QTE_SUCCESS.energyDelta);
  });

  it("body shots chip the captor by their per-part damage and accumulate to WON", () => {
    const r1 = tickQte(active(), true, { x: 0, y: 0.3 }, 0.1); // torso −2
    expect(r1.qte.phase).toBe("ACTIVE");
    expect(r1.qte.captorHp).toBe(4 - PART_DAMAGE.torso);
    const r2 = tickQte(r1.qte, true, { x: 0, y: 0.3 }, 0.1); // torso −2 → 0
    expect(r2.qte.phase).toBe("WON");
    expect(r2.qte.captorHp).toBe(0);
  });

  it("an arm shot only chips (limb) and a miss does nothing", () => {
    expect(tickQte(active(), true, { x: 0.7, y: 0.3 }, 0.1).qte.captorHp).toBe(4 - PART_DAMAGE.arm);
    const miss = tickQte(active(), true, { x: 1.5, y: 0 }, 0.1);
    expect(miss.qte.captorHp).toBe(4);
    expect(miss.qte.phase).toBe("ACTIVE");
    expect(miss).toMatchObject({ scoreDelta: 0, energyDelta: 0 });
  });
});

describe("tickQte — hostage & timeout losses", () => {
  it("hitting the hostage penalises and chips her hp; 3 hits kill her → LOST", () => {
    const r1 = tickQte(active(), true, { x: 0, y: -0.5 }, 0.1);
    expect(r1.qte.hostageHp).toBe(2);
    expect(r1.qte.phase).toBe("ACTIVE");
    expect(r1.scoreDelta).toBe(HOSTAGE_HIT_PENALTY.scoreDelta);
    expect(r1.energyDelta).toBe(HOSTAGE_HIT_PENALTY.energyDelta);
    const r2 = tickQte(r1.qte, true, { x: 0, y: -0.5 }, 0.1);
    const r3 = tickQte(r2.qte, true, { x: 0, y: -0.5 }, 0.1);
    expect(r3.qte.hostageHp).toBe(0);
    expect(r3.qte.phase).toBe("LOST");
    // The killing hit charges ONLY the per-hit hostage penalty — the timeout
    // penalty must never stack onto a hostage-death LOST.
    expect(r3.scoreDelta).toBe(HOSTAGE_HIT_PENALTY.scoreDelta);
    expect(r3.energyDelta).toBe(HOSTAGE_HIT_PENALTY.energyDelta);
  });

  it("the window expiring with the captor alive → LOST + timeout penalty (charged once)", () => {
    const r = tickQte(active({ windowRemaining: 0.05 }), false, NO_HIT, 0.1);
    expect(r.qte.phase).toBe("LOST");
    expect(r.scoreDelta).toBe(QTE_TIMEOUT_PENALTY.scoreDelta);
    expect(r.energyDelta).toBe(QTE_TIMEOUT_PENALTY.energyDelta);
    // No second charge while LOST holds, then DONE.
    const hold = tickQte(r.qte, false, NO_HIT, 0.1);
    expect(hold).toMatchObject({ scoreDelta: 0, energyDelta: 0 });
  });

  it("a kill on the same tick the window expires still WINS (no double outcome)", () => {
    const r = tickQte(active({ windowRemaining: 0.05 }), true, { x: 0, y: 1 }, 0.1);
    expect(r.qte.phase).toBe("WON");
    expect(r.scoreDelta).toBe(QTE_SUCCESS.scoreDelta); // not WON+timeout
  });
});

describe("tickQte — result hold → DONE (once per level)", () => {
  it("WON/LOST hold briefly then go DONE, and DONE is a no-op", () => {
    const won = active({ phase: "WON", resultRemaining: 0.05 });
    const done = tickQte(won, false, NO_HIT, 0.1);
    expect(done.qte.phase).toBe("DONE");
    const after = tickQte(done.qte, true, { x: 0, y: 1 }, 0.1);
    expect(after.qte.phase).toBe("DONE");
    expect(after).toMatchObject({ scoreDelta: 0, energyDelta: 0 });
  });
});
