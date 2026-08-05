import { describe, it, expect } from "vitest";
import type { FaceCatalogue } from "@game/types/portraitRobot";
import { FACE_CATALOGUE } from "@game/portraits/faceCatalogue.data";
import { validatePortrait, SEED_SWEEP } from "@game/portraits/validatePortrait";
import type { PortraitPlateManifest } from "@game/portraits/validatePortrait";
import {
  correctCount,
  drawPortraitPuzzle,
  isEligibleTruth,
  PORTRAIT_BAND_ORDER,
} from "@game/systems/portraitRobotSystem";

/** The plate the tooling lane will emit — synthesised here from the shipped catalogue. */
function plateFor(catalogue: FaceCatalogue): PortraitPlateManifest {
  return {
    plateChecksum: catalogue.plateChecksum,
    assets: catalogue.bands.flatMap((b) => b.variants.map((v) => v.asset)),
  };
}

/** A structural clone with one band mutated — the catalogue is deeply readonly. */
function withBand(index: number, mutate: (band: FaceCatalogue["bands"][number]) => unknown) {
  const bands = FACE_CATALOGUE.bands.map((band, i) =>
    i === index ? (mutate(band) as FaceCatalogue["bands"][number]) : band,
  );
  return { ...FACE_CATALOGUE, bands };
}

const codes = (catalogue: FaceCatalogue, plate: PortraitPlateManifest | null = null) =>
  validatePortrait(catalogue, plate).map((i) => i.code);

describe("the shipped catalogue", () => {
  it("is clean against its own generated plate", () => {
    expect(validatePortrait(FACE_CATALOGUE, plateFor(FACE_CATALOGUE))).toEqual([]);
  });

  it("reports plate-missing (warning only) while the generated manifest is absent", () => {
    const issues = validatePortrait(FACE_CATALOGUE);
    expect(issues.map((i) => i.code)).toEqual(["plate-missing"]);
    expect(issues[0]?.severity).toBe("warning");
  });

  it("carries 4 bands x 6 variants, in draw order, with the canonical labels", () => {
    expect(FACE_CATALOGUE.bands.map((b) => b.id)).toEqual([...PORTRAIT_BAND_ORDER]);
    expect(FACE_CATALOGUE.bands.map((b) => b.label)).toEqual([
      "LA COUPE",
      "LE REGARD",
      "LE NEZ",
      "LA BOUCHE",
    ]);
    for (const band of FACE_CATALOGUE.bands) expect(band.variants).toHaveLength(6);
  });
});

describe("validatePortrait never throws and always returns issues", () => {
  it("survives an empty, a truncated and a nonsense catalogue", () => {
    const empty = { gabaritId: "", plateChecksum: "", bands: [] };
    expect(() => validatePortrait(empty)).not.toThrow();
    expect(codes(empty)).toContain("band-count");

    const truncated = { ...FACE_CATALOGUE, bands: FACE_CATALOGUE.bands.slice(0, 2) };
    expect(codes(truncated)).toContain("band-count");
  });

  it("issue order is deterministic — two calls compare verbatim", () => {
    const broken = withBand(0, (band) => ({ ...band, variants: band.variants.slice(0, 3) }));
    expect(validatePortrait(broken)).toEqual(validatePortrait(broken));
  });
});

describe("the invariants (ADR-0080 D3)", () => {
  it("variant-count — 6 is a hard ceiling, not a minimum", () => {
    const short = withBand(1, (band) => ({ ...band, variants: band.variants.slice(0, 5) }));
    expect(codes(short)).toContain("variant-count");

    const seventh = withBand(1, (band) => ({
      ...band,
      variants: [...band.variants, { ...band.variants[0], id: "eyes-07" }],
    }));
    expect(codes(seventh)).toContain("variant-count");
  });

  it("variant-id-unique — across the catalogue, not per band", () => {
    const dup = withBand(1, (band) => ({
      ...band,
      variants: band.variants.map((v, i) => (i === 5 ? { ...v, id: band.variants[0]?.id } : v)),
    }));
    expect(codes(dup)).toContain("variant-id-unique");
  });

  it("distance-complete — a missing pair, an unknown key and a self-pair all fail", () => {
    const { "2:4": _dropped, ...missing } = FACE_CATALOGUE.bands[0]?.distances ?? {};
    expect(codes(withBand(0, (band) => ({ ...band, distances: missing })))).toContain(
      "distance-complete",
    );

    const selfPair = { ...FACE_CATALOGUE.bands[0]?.distances, "3:3": "medium" };
    expect(codes(withBand(0, (band) => ({ ...band, distances: selfPair })))).toContain(
      "distance-complete",
    );

    const unknown = { ...FACE_CATALOGUE.bands[0]?.distances, "1:9": "strong" };
    expect(codes(withBand(0, (band) => ({ ...band, distances: unknown })))).toContain(
      "distance-complete",
    );
  });

  it("decoy-profile — a band with no 2-strong/3-medium row has no eligible truth", () => {
    const flat = Object.fromEntries(
      Object.keys(FACE_CATALOGUE.bands[0]?.distances ?? {}).map((k) => [k, "medium"]),
    );
    const issues = validatePortrait(withBand(2, (band) => ({ ...band, distances: flat })));
    expect(issues.map((i) => i.code)).toContain("decoy-profile");
    expect(issues.find((i) => i.code === "decoy-profile")?.severity).toBe("error");
  });

  it("no-fine-pair — legal data, warning only (gate A5 forbids class-4 decoys in V1)", () => {
    const withFine = { ...FACE_CATALOGUE.bands[3]?.distances, "1:3": "fine" };
    const issues = validatePortrait(withBand(3, (band) => ({ ...band, distances: withFine })));
    const fine = issues.find((i) => i.code === "no-fine-pair");
    expect(fine?.severity).toBe("warning");
  });

  it("trait-named — an empty or blank trait fails (gate A5, made mechanical)", () => {
    const blank = withBand(0, (band) => ({
      ...band,
      variants: band.variants.map((v, i) => (i === 2 ? { ...v, trait: "   " } : v)),
    }));
    expect(codes(blank)).toContain("trait-named");
  });

  it("asset-path — id and path are derivable from one another, never authored twice", () => {
    const renamed = withBand(2, (band) => ({
      ...band,
      variants: band.variants.map((v, i) => (i === 0 ? { ...v, asset: "assets/nose-1.png" } : v)),
    }));
    expect(codes(renamed)).toContain("asset-path");
  });
});

describe("the plate provenance (ADR-0080 D5)", () => {
  it("a hand-patched single band fails plate-provenance, not eyes", () => {
    const plate = { ...plateFor(FACE_CATALOGUE), plateChecksum: "sliced-from-another-run" };
    expect(codes(FACE_CATALOGUE, plate)).toContain("plate-provenance");
  });

  it("asset-in-plate — catalogue and generated manifest must agree both ways", () => {
    const plate = plateFor(FACE_CATALOGUE);
    expect(codes(FACE_CATALOGUE, { ...plate, assets: plate.assets.slice(1) })).toContain(
      "asset-in-plate",
    );
    expect(
      codes(FACE_CATALOGUE, { ...plate, assets: [...plate.assets, "assets/portrait/ears-01.png"] }),
    ).toContain("asset-in-plate");
  });
});

describe("seed-sweep — the regression guard on the arithmetic (ADR-0080 D3)", () => {
  it("passes on the shipped catalogue over the whole sweep", () => {
    expect(codes(FACE_CATALOGUE, plateFor(FACE_CATALOGUE))).not.toContain("seed-sweep");
    for (const seed of SEED_SWEEP) {
      const puzzle = drawPortraitPuzzle(FACE_CATALOGUE, seed);
      expect(correctCount(puzzle.initialSelection, puzzle.truth)).toBe(0);
    }
  });

  it("the sweep covers 0..999 plus the boundary seeds", () => {
    expect(SEED_SWEEP).toHaveLength(1004);
    expect(SEED_SWEEP).toContain(0);
    expect(SEED_SWEEP).toContain(-1);
    expect(SEED_SWEEP).toContain(2 ** 53 - 1);
  });

  it("fires when the draw stops restricting the truth to eligible variants", () => {
    // One band where exactly one variant is eligible and the others are not: any draw
    // that ignores eligibility lands on an ineligible truth for some seed of the sweep.
    const skewed = withBand(0, (band) => ({
      ...band,
      distances: Object.fromEntries(
        Object.keys(band.distances).map((k) => [k, k.startsWith("0:") ? "strong" : "fine"]),
      ),
    }));
    const issues = validatePortrait(skewed);
    // No variant can reach 2 strong + 3 medium here ⇒ decoy-profile fires, and the draw's
    // documented fallback (whole pool) is then reported by seed-sweep.
    expect(issues.map((i) => i.code)).toContain("decoy-profile");
    expect(issues.map((i) => i.code)).toContain("seed-sweep");
  });

  it("the draw only ever picks an eligible truth on a valid catalogue", () => {
    for (const seed of [0, 1, 17, 999, 2 ** 31]) {
      const puzzle = drawPortraitPuzzle(FACE_CATALOGUE, seed);
      FACE_CATALOGUE.bands.forEach((band, i) => {
        const slot = puzzle.truth[i]!;
        const variantIndex = (puzzle.order[i]!)[slot]!;
        expect(isEligibleTruth(band.distances, variantIndex, band.variants.length)).toBe(true);
      });
    }
  });
});
