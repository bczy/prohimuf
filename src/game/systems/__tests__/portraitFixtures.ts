import type {
  FaceCatalogue,
  PortraitBand,
  PortraitBandId,
  VariantDistance,
} from "@game/types/portraitRobot";
import {
  distanceKey,
  PORTRAIT_BAND_ORDER,
  VARIANTS_PER_BAND,
} from "@game/systems/portraitRobotSystem";

/**
 * Synthetic catalogues for the pure tests. NOT the shipped catalogue: the rules must be
 * provable without the art data, and `validatePortrait` must be exercised on candidates
 * that are deliberately broken.
 */

/**
 * A distance matrix where EVERY variant is an eligible truth: the `strong` pairs form a
 * 6-cycle (so each variant has exactly 2 strong neighbours) and the remaining 9 pairs are
 * `medium` (3 each). 15 pairs, 0 `fine` — gate §3's composition, satisfied for every row.
 */
export function cyclicDistances(n = VARIANTS_PER_BAND): Record<string, VariantDistance> {
  const out: Record<string, VariantDistance> = {};
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      out[distanceKey(i, j)] = adjacent ? "strong" : "medium";
    }
  }
  return out;
}

export function testBand(id: PortraitBandId, overrides: Partial<PortraitBand> = {}): PortraitBand {
  return {
    id,
    label: id.toUpperCase(),
    variants: Array.from({ length: VARIANTS_PER_BAND }, (_, i) => ({
      id: `${id}-${String(i + 1).padStart(2, "0")}`,
      asset: `assets/portrait/${id}-${String(i + 1).padStart(2, "0")}.png`,
      trait: `trait ${String(i + 1)}`,
    })),
    distances: cyclicDistances(),
    ...overrides,
  };
}

export function testCatalogue(overrides: Partial<FaceCatalogue> = {}): FaceCatalogue {
  return {
    gabaritId: "test-gabarit",
    plateChecksum: "test-checksum",
    bands: PORTRAIT_BAND_ORDER.map((id) => testBand(id)),
    ...overrides,
  };
}

export const TEST_CATALOGUE: FaceCatalogue = testCatalogue();

/**
 * Read an index that the test's own construction proves is present.
 *
 * `noUncheckedIndexedAccess` widens every array read to `| undefined`, and both
 * `as number` and `!` are refused by lint (`non-nullable-type-assertion-style`
 * and `no-non-null-assertion` are each other's fix). This helper is the third
 * option, and the only honest one: an absent index FAILS the test loudly instead
 * of being asserted away — which is exactly the assertion family that hid two of
 * this story's blocking findings.
 */
export function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined) throw new Error(`fixture: no element at index ${String(i)}`);
  return v;
}
