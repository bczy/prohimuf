import { describe, it, expect } from "vitest";
import { getBackdropLayout } from "@game/levels/levelArt";
import { LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";
import { ASSAULT_RADIUS, DELIVERY_ASSAILANTS } from "@game/systems/deliveryAssault";
import { VIEW_W } from "@game/systems/crosshairSystem";
import { levelFacade } from "./levelFacade";

/**
 * Two guards on the REAL runtime slot geometry of the shipped levels (the facade
 * `GameScene` composes and the tick receives — see `levelFacade`).
 *
 * Both are load-bearing for gameplay and invisible from the data they guard: a
 * window-zone retouch is an art/tooling change that can silently gut a core-loop
 * objective (AC12.1) or strand an enemy out of reach forever (ADR-0071). They fail
 * CI instead.
 */

const DELIVERY_LEVELS = LEVELS.flatMap((l) => {
  const spec = l.deliveries[0];
  return spec === undefined ? [] : [[l.id, spec] as const];
});

describe("AC12.1 — every delivery level can host its assault (the authoring guard)", () => {
  it.each(DELIVERY_LEVELS)(
    "%s has at least DELIVERY_ASSAILANTS slots within ASSAULT_RADIUS of the stop",
    (id, spec) => {
      const candidates = levelFacade(id).slots.filter(
        (s) => Math.abs(s.screenPosition.x - spec.stopPosition.x) <= ASSAULT_RADIUS,
      );
      // Measured today: belliard 10, stalingrad 7, vitry 28, niveau-final **2** —
      // the finale is AT the floor, so any window-zone retouch that moves one of
      // its two candidate windows out of range reddens here instead of silently
      // shipping a delivery the player cannot lose.
      expect(candidates.length).toBeGreaterThanOrEqual(DELIVERY_ASSAILANTS);
    },
  );

  it.each(DELIVERY_LEVELS)("%s frames the van and both assailants together", (id, spec) => {
    // §4.1's one-frame guarantee: with the camera centred on the stop position,
    // every reserved slot centre is inside the half-frame, with room for the
    // ≈2.1-wide enemy plane.
    const candidates = levelFacade(id)
      .slots.map((s) => Math.abs(s.screenPosition.x - spec.stopPosition.x))
      .filter((d) => d <= ASSAULT_RADIUS)
      .sort((a, b) => a - b)
      .slice(0, DELIVERY_ASSAILANTS);
    for (const distance of candidates) {
      expect(distance + 2.1 / 2).toBeLessThan(VIEW_W / 2);
    }
  });
});

describe("ADR-0071 — every window slot stays reachable by the camera pan", () => {
  // The ADR self-commits to this test (`0069:119`) and no test pinned it: the pan
  // clamp is `rangeX = fullW/2 − viewW/2` and the camera rect reaches `viewW/2`
  // past its centre, so the furthest reachable slot centre is exactly `fullW/2`.
  // Since ADR-0071 an unreachable slot is not a cosmetic wart but a HARD
  // progression stall: a frozen enemy there can never be killed, `allDead` never
  // turns true and the wave stops rolling over. The assault reservation makes slot
  // geometry MORE load-bearing, not less — it removes two slots per delivery level.
  const ALL = [...LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL];

  it.each(ALL.map((l) => [l.id] as const))("%s: max |slotX| <= fullW/2", (id) => {
    const facade = levelFacade(id);
    const bound = getBackdropLayout(id).fullW / 2;
    expect(facade.slots.length).toBeGreaterThan(0);
    const worst = Math.max(...facade.slots.map((s) => Math.abs(s.screenPosition.x)));
    expect(worst).toBeLessThanOrEqual(bound);
  });

  it("the thinnest margin is vitry's, and it is still positive (ADR-0071 measured 39.4586 / 40)", () => {
    const margins = LEVELS.map((l) => {
      const worst = Math.max(...levelFacade(l.id).slots.map((s) => Math.abs(s.screenPosition.x)));
      return { id: l.id, margin: getBackdropLayout(l.id).fullW / 2 - worst };
    });
    const tightest = margins.reduce((a, b) => (b.margin < a.margin ? b : a));
    expect(tightest.id).toBe("vitry");
    expect(tightest.margin).toBeGreaterThan(0);
    expect(tightest.margin).toBeCloseTo(0.54, 2);
  });
});
