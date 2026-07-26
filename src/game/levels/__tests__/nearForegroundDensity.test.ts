import { describe, expect, it } from "vitest";
import { getNearForeground, LEVEL_ART_LIST } from "@game/levels/levelArt";
import type { NearForegroundObject } from "@game/levels/levelArt";

/**
 * Near-foreground DENSITY + PLACEMENT invariants for the panneau PARIS
 * (`streetSign`), added 2026-07-25 after belliard shipped a street with no
 * visible sign at all ("on ne voit plus le panneau Paris", Bertrand).
 *
 * Two independent causes were established in-browser (screenshots/probe/):
 *  1. `NearForeground.tsx` halves each kerb row on mobile with a KIND-BLIND
 *     parity filter — `.filter((_, i) => i % 2 === 0)` over the row's LIST
 *     ORDER. Belliard's single streetSign sat at near-row index 3 and stalingrad's
 *     two sat at 5 and 9, so EVERY sign vanished on any mobile UA.
 *  2. A sign can be listed but crowded by a neighbour of the same row.
 *
 * Belliard is back to a SINGLE sign (Bertrand, 2026-07-25: "ne garde qu'un seul
 * panneau, celui de droite" — x=0.885), i.e. back to the zero-margin setup where
 * one bad list index means zero panneau on mobile: that sign is listed BEFORE the
 * lamppost x=0.8 to take the EVEN near-row index 6. These tests are the guard —
 * they assert on the row ACTUALLY DRAWN in each mode, never on the declared array.
 *
 * 2026-07-26 (Bertrand: "sur mobile on voit pas le lampadaire"): the exact same
 * KIND-BLIND parity bug hit every `lamppost` in both levels — belliard's two
 * (x=0.495, x=0.8) sat at odd near-row indices 3 and 7, stalingrad's two (x=0.16,
 * x=0.6) at 3 and 7 too, so NEITHER level ever drew a lamppost on mobile; the
 * streetSign fix above only ever guarded the sign. One lamppost per level was
 * moved to an even index (belliard x=0.495 swapped ahead of the bench x=0.6;
 * stalingrad x=0.16 swapped ahead of the trafficLight x=0.05), mirroring the
 * streetSign trick exactly. The lamppost tests below are the guard for that.
 *
 * These tests re-derive the row split exactly as the render layer does (the
 * filter is duplicated here on purpose: this file lives in the game/data lane and
 * must not import a React component — keep the two in sync if the render lane
 * changes the density rule, ADR-0047).
 */

/** Minimum x separation, in full-street normalized units, for a sign to read. */
const MIN_SIGN_CLEARANCE = 0.06;

/** Mirrors NearForeground.tsx `split()`: row filter, then mobile parity halving. */
function drawnRow(
  objects: readonly NearForegroundObject[],
  row: "near" | "far",
  isMobile: boolean,
): NearForegroundObject[] {
  return objects
    .filter((obj) => (obj.row ?? "near") === row)
    .filter((_, i) => !isMobile || i % 2 === 0);
}

const LEVELS_WITH_SIGNS = LEVEL_ART_LIST.filter((level) =>
  (getNearForeground(level.id)?.objects ?? []).some((o) => o.kind === "streetSign"),
).map((level) => level.id);

describe("near-foreground streetSign (panneau PARIS) survives the mobile density filter", () => {
  it("at least one level declares a streetSign (guards against an empty matrix)", () => {
    expect(LEVELS_WITH_SIGNS.length).toBeGreaterThan(0);
  });

  it.each(LEVELS_WITH_SIGNS)(
    "%s keeps a streetSign on BOTH desktop and mobile",
    (id: string): void => {
      const objects = getNearForeground(id)?.objects ?? [];
      for (const isMobile of [false, true]) {
        const drawn = [
          ...drawnRow(objects, "near", isMobile),
          ...drawnRow(objects, "far", isMobile),
        ];
        const signs = drawn.filter((o) => o.kind === "streetSign");
        expect(
          signs.length,
          `${id}: no streetSign drawn on ${isMobile ? "mobile" : "desktop"} — the row-order parity ` +
            `filter dropped every sign; move a sign to an EVEN index of its row's list order`,
        ).toBeGreaterThan(0);
      }
    },
  );

  it.each(LEVELS_WITH_SIGNS)(
    "%s has, in both modes, a drawn streetSign clear of its row neighbours",
    (id: string): void => {
      const objects = getNearForeground(id)?.objects ?? [];
      for (const isMobile of [false, true]) {
        const clearances: number[] = [];
        for (const row of ["near", "far"] as const) {
          const drawn = drawnRow(objects, row, isMobile);
          for (const [i, obj] of drawn.entries()) {
            if (obj.kind !== "streetSign") continue;
            const gaps = drawn.filter((_, j) => j !== i).map((other) => Math.abs(other.x - obj.x));
            clearances.push(gaps.length === 0 ? 1 : Math.min(...gaps));
          }
        }
        expect(
          Math.max(...clearances),
          `${id}: every streetSign drawn on ${isMobile ? "mobile" : "desktop"} sits within ` +
            `${String(MIN_SIGN_CLEARANCE)} of another prop of the same row — none can read`,
        ).toBeGreaterThanOrEqual(MIN_SIGN_CLEARANCE);
      }
    },
  );

  it("belliard DRAWS a streetSign in the right half of the street, in both modes", () => {
    // The full right pan used to show no sign at all: every belliard sign lived
    // left of x=0.5 while the camera can pan to the far right end of the street.
    // Belliard now carries exactly ONE sign (Bertrand, 2026-07-25: "ne garde qu'un
    // seul panneau, celui de droite"), so "declared right of 0.5" is no longer
    // enough — that single sign must also SURVIVE the parity filter in each mode,
    // otherwise the right pan is empty again on mobile.
    const objects = getNearForeground("belliard")?.objects ?? [];
    for (const isMobile of [false, true]) {
      const drawn = [...drawnRow(objects, "near", isMobile), ...drawnRow(objects, "far", isMobile)];
      const right = drawn.filter((o) => o.kind === "streetSign" && o.x > 0.5);
      expect(
        right.length,
        `belliard: no panneau PARIS drawn right of x=0.5 on ${isMobile ? "mobile" : "desktop"}`,
      ).toBeGreaterThan(0);
    }
  });
});

const LEVELS_WITH_LAMPPOSTS = LEVEL_ART_LIST.filter((level) =>
  (getNearForeground(level.id)?.objects ?? []).some((o) => o.kind === "lamppost"),
).map((level) => level.id);

describe("near-foreground lamppost survives the mobile density filter", () => {
  it("at least one level declares a lamppost (guards against an empty matrix)", () => {
    expect(LEVELS_WITH_LAMPPOSTS.length).toBeGreaterThan(0);
  });

  it.each(LEVELS_WITH_LAMPPOSTS)(
    "%s keeps a lamppost on BOTH desktop and mobile",
    (id: string): void => {
      const objects = getNearForeground(id)?.objects ?? [];
      for (const isMobile of [false, true]) {
        const drawn = [
          ...drawnRow(objects, "near", isMobile),
          ...drawnRow(objects, "far", isMobile),
        ];
        const lampposts = drawn.filter((o) => o.kind === "lamppost");
        expect(
          lampposts.length,
          `${id}: no lamppost drawn on ${isMobile ? "mobile" : "desktop"} — the row-order parity ` +
            `filter dropped every lamppost; move one to an EVEN index of its row's list order`,
        ).toBeGreaterThan(0);
      }
    },
  );

  it.each(LEVELS_WITH_LAMPPOSTS)(
    "%s has, in both modes, a drawn lamppost clear of its row neighbours",
    (id: string): void => {
      const objects = getNearForeground(id)?.objects ?? [];
      for (const isMobile of [false, true]) {
        const clearances: number[] = [];
        for (const row of ["near", "far"] as const) {
          const drawn = drawnRow(objects, row, isMobile);
          for (const [i, obj] of drawn.entries()) {
            if (obj.kind !== "lamppost") continue;
            const gaps = drawn.filter((_, j) => j !== i).map((other) => Math.abs(other.x - obj.x));
            clearances.push(gaps.length === 0 ? 1 : Math.min(...gaps));
          }
        }
        expect(
          Math.max(...clearances),
          `${id}: every lamppost drawn on ${isMobile ? "mobile" : "desktop"} sits within ` +
            `${String(MIN_SIGN_CLEARANCE)} of another prop of the same row — none can read`,
        ).toBeGreaterThanOrEqual(MIN_SIGN_CLEARANCE);
      }
    },
  );
});
