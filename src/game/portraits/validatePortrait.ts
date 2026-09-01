import type { LevelIssue } from "@game/levels/validateLevel";
import type { FaceCatalogue, PortraitBandId } from "@game/types/portraitRobot";
import { PORTRAIT_ASSET_DIR } from "@game/types/portraitRobot";
import {
  correctCount,
  distanceKey,
  drawPortraitPuzzle,
  isEligibleTruth,
  PORTRAIT_BAND_ORDER,
  VARIANTS_PER_BAND,
} from "@game/systems/portraitRobotSystem";

/**
 * The single source of `FaceCatalogue` invariants (ADR-0080 D3, ADR-0074 §3 applied).
 *
 * Same contract as `validateLevel`: **never throws**, never mutates, no I/O, deterministic
 * issue order (checks in declaration order, bands in authoring order inside a check), and
 * it reuses `LevelIssue` so one reporting vocabulary serves both.
 *
 * It **imports no catalogue** — story ③'s pattern: it must be able to validate a candidate
 * that is not the shipped one. Importing `drawPortraitPuzzle` is not a breach of that rule:
 * the rule is about data, not functions (ADR-0080 D3).
 *
 * **There is no throw-at-load twin.** A malformed portrait catalogue must not brick the
 * app: `App.tsx` guards on a validated catalogue and SKIPS the phase — the scene is
 * optional, the level is not. Failing loud belongs in the test suite (`validatePortrait(
 * FACE_CATALOGUE)` returns `[]`), never in a player's browser.
 */

/**
 * What `scripts/slice-portrait-plate.mjs` ACTUALLY emits into
 * `portraitPlate.generated.json` (ADR-0080 D5).
 *
 * **The producer's shape makes law** (panel M9). This interface used to declare a
 * consumer-shaped `assets: string[]` the script never wrote: `new Set(plate.assets)` on
 * the real file was `new Set(undefined)` — a THROW, in the module whose whole contract is
 * that it never throws. It was invisible because the test built its own fixture in the
 * consumer's shape; the fixture is now the generated file itself, so the two shapes cannot
 * drift again without a red test.
 *
 * The asset list is DERIVED from `bands` here rather than authored twice.
 */
export interface PortraitPlateManifest {
  /** The gabarit the plate was drawn on — informational for this validator. */
  readonly gabaritId: string;
  /** Checksum of the plate the band PNGs were sliced from; must equal the catalogue's. */
  readonly plateChecksum: string;
  /** Portrait pixel size the bands were sliced at. */
  readonly portraitSize: { readonly width: number; readonly height: number };
  /** Normalised cut lines between the four bands. */
  readonly seams: readonly number[];
  /** Per band, in draw order, what the script wrote: the id and its BASE-relative path. */
  readonly bands: Readonly<
    Partial<Record<PortraitBandId, readonly { readonly id: string; readonly asset: string }[]>>
  >;
}

/**
 * Every asset path the plate claims to have written, read band by canonical band.
 *
 * Total on a partial manifest: a band the script did not write yields nothing and the
 * disagreement is REPORTED by `asset-in-plate` — it is never a throw (ADR-0080 D3). A
 * band id outside the canonical four is likewise ignored rather than trusted, so a plate
 * that invented a fifth band still fails the comparison instead of widening it.
 */
export function plateAssets(plate: PortraitPlateManifest): readonly string[] {
  return PORTRAIT_BAND_ORDER.flatMap((id) => (plate.bands[id] ?? []).map((entry) => entry.asset));
}

const CANONICAL_BAND_IDS: readonly PortraitBandId[] = PORTRAIT_BAND_ORDER;

function issue(
  code: string,
  severity: LevelIssue["severity"],
  field: string,
  message: string,
): LevelIssue {
  return { code, severity, field, message };
}

/**
 * The `?portraitSeed=` values QA pins, plus the boundary seeds, plus `0..999`
 * (ADR-0080 D3). Deterministic, ordered, no randomness in a validator.
 *
 * **This sweep is a regression guard, not a proof.** "For every seed" is established by
 * the arithmetic of the draw (D4.4); the sweep is what fires the day someone rewrites the
 * hash, "simplifies" the modular offset, or adds a seventh variant — the three edits that
 * would break the proof silently. Calling it a proof would be a lie the next reader
 * believes.
 */
export const SEED_SWEEP: readonly number[] = [
  ...Array.from({ length: 1000 }, (_, i) => i),
  -1,
  2 ** 31 - 1,
  2 ** 31,
  2 ** 53 - 1,
];

export function validatePortrait(
  catalogue: FaceCatalogue,
  plate: PortraitPlateManifest | null = null,
): readonly LevelIssue[] {
  const issues: LevelIssue[] = [];
  const bands = catalogue.bands;

  // band-count — exactly 4, the four canonical ids, in draw order, no duplicate.
  const ids = bands.map((b) => b.id);
  if (
    ids.length !== CANONICAL_BAND_IDS.length ||
    CANONICAL_BAND_IDS.some((canonical, i) => ids[i] !== canonical)
  ) {
    issues.push(
      issue(
        "band-count",
        "error",
        "bands",
        `expected exactly the 4 bands ${CANONICAL_BAND_IDS.join(", ")} in draw order, got ${
          ids.length === 0 ? "none" : ids.join(", ")
        }`,
      ),
    );
  }

  // variant-count — EXACTLY `VARIANTS_PER_BAND` per band, neither a floor nor a
  // ceiling. The comment said "6" long after the constant moved to 10 (Copilot review,
  // 2026-08-11); naming the constant is what keeps it true through the next change.
  bands.forEach((band) => {
    if (band.variants.length !== VARIANTS_PER_BAND) {
      issues.push(
        issue(
          "variant-count",
          "error",
          `bands.${band.id}.variants`,
          `expected exactly ${String(VARIANTS_PER_BAND)} variants, got ${String(band.variants.length)}`,
        ),
      );
    }
  });

  // variant-id-unique — across the whole catalogue, not per band.
  const seen = new Set<string>();
  bands.forEach((band) => {
    band.variants.forEach((variant) => {
      if (seen.has(variant.id)) {
        issues.push(
          issue(
            "variant-id-unique",
            "error",
            `bands.${band.id}.variants.${variant.id}`,
            `duplicate variant id "${variant.id}"`,
          ),
        );
      }
      seen.add(variant.id);
    });
  });

  // distance-complete — the 15 upper-triangle pairs, no unknown key, no self-pair.
  bands.forEach((band) => {
    const n = band.variants.length;
    const expected = new Set<string>();
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) expected.add(distanceKey(i, j));
    }
    const missing = [...expected].filter((key) => band.distances[key] === undefined);
    const unknown = Object.keys(band.distances).filter((key) => !expected.has(key));
    if (missing.length > 0 || unknown.length > 0) {
      issues.push(
        issue(
          "distance-complete",
          "error",
          `bands.${band.id}.distances`,
          `expected the ${String(expected.size)} pairs "i:j" with i < j` +
            (missing.length > 0 ? `; missing ${missing.join(", ")}` : "") +
            (unknown.length > 0 ? `; unknown or self-pair ${unknown.join(", ")}` : ""),
        ),
      );
    }
  });

  // decoy-profile — at least one variant whose row is exactly 2 strong, 0 fine, and
  // medium everywhere else (`variantCount - 3` of them: 3 at six variants, 7 at ten).
  // This is the one that matters for difficulty: it turns gate §3's composition from an
  // intention into a CI-checkable property, and the draw picks only among those. The
  // count is DERIVED here too — the message said "3 medium" long after the constant moved
  // to 10, telling anyone debugging a failing catalogue to aim at the wrong composition.
  bands.forEach((band) => {
    const eligible = band.variants.filter((_, i) =>
      isEligibleTruth(band.distances, i, band.variants.length),
    );
    if (eligible.length === 0) {
      issues.push(
        issue(
          "decoy-profile",
          "error",
          `bands.${band.id}.distances`,
          `no variant has a row of exactly 2 strong + ${String(band.variants.length - 3)} medium + 0 fine — no eligible truth`,
        ),
      );
    }
  });

  // no-fine-pair — legal data, unusable in V1 (gate A5 forbids class-4 decoys).
  bands.forEach((band) => {
    const fine = Object.keys(band.distances).filter((key) => band.distances[key] === "fine");
    if (fine.length > 0) {
      issues.push(
        issue(
          "no-fine-pair",
          "warning",
          `bands.${band.id}.distances`,
          `fine pairs are unusable in V1 (gate A5): ${fine.join(", ")}`,
        ),
      );
    }
  });

  // trait-named — gate A5's rule of the named trait, made mechanical.
  bands.forEach((band) => {
    band.variants.forEach((variant) => {
      if (variant.trait.trim() === "") {
        issues.push(
          issue(
            "trait-named",
            "error",
            `bands.${band.id}.variants.${variant.id}.trait`,
            "every variant must carry a non-empty named trait",
          ),
        );
      }
    });
  });

  // asset-path — the `assets/portrait/<band>-<nn>.png` convention, and the id derived
  // from it, so a path and an id are never authored twice.
  bands.forEach((band) => {
    band.variants.forEach((variant, i) => {
      const expectedId = `${band.id}-${String(i + 1).padStart(2, "0")}`;
      const expectedAsset = `${PORTRAIT_ASSET_DIR}/${expectedId}.png`;
      if (variant.id !== expectedId || variant.asset !== expectedAsset) {
        issues.push(
          issue(
            "asset-path",
            "error",
            `bands.${band.id}.variants.${String(i)}`,
            `expected id "${expectedId}" and asset "${expectedAsset}", got "${variant.id}" / "${variant.asset}"`,
          ),
        );
      }
    });
  });

  if (plate === null) {
    issues.push(
      issue(
        "plate-missing",
        "warning",
        "plateChecksum",
        "no generated plate manifest supplied — asset-in-plate and plate-provenance not evaluated",
      ),
    );
  } else {
    // asset-in-plate — every catalogue path was written by the script, and vice versa.
    const written = new Set(plateAssets(plate));
    const authored = new Set(bands.flatMap((b) => b.variants.map((v) => v.asset)));
    const orphans = [...authored].filter((p) => !written.has(p));
    const unclaimed = [...written].filter((p) => !authored.has(p));
    if (orphans.length > 0 || unclaimed.length > 0) {
      issues.push(
        issue(
          "asset-in-plate",
          "error",
          "bands",
          `catalogue and generated plate disagree` +
            (orphans.length > 0 ? `; not in the plate: ${orphans.join(", ")}` : "") +
            (unclaimed.length > 0 ? `; not in the catalogue: ${unclaimed.join(", ")}` : ""),
        ),
      );
    }

    // plate-provenance — a hand-patched single band fails HERE, loudly, with a message
    // naming the rule. Not caught by eyes (ADR-0080 D5).
    if (catalogue.plateChecksum !== plate.plateChecksum) {
      issues.push(
        issue(
          "plate-provenance",
          "error",
          "plateChecksum",
          `catalogue checksum "${catalogue.plateChecksum}" does not match the generated plate "${plate.plateChecksum}" — every band must come from ONE slicing run`,
        ),
      );
    }
  }

  // seed-sweep — both canonical draw invariants, over a fixed deterministic seed set.
  const offenders: string[] = [];
  for (const seed of SEED_SWEEP) {
    const puzzle = drawPortraitPuzzle(catalogue, seed);
    if (correctCount(puzzle.initialSelection, puzzle.truth) !== 0) {
      offenders.push(`seed ${String(seed)}: initial board is not 0/4`);
      break;
    }
    const badBand = bands.findIndex((band, i) => {
      const slot = puzzle.truth[i];
      const bandOrder = puzzle.order[i];
      if (slot === undefined || bandOrder === undefined) return true;
      const variantIndex = bandOrder[slot];
      if (variantIndex === undefined) return true;
      return !isEligibleTruth(band.distances, variantIndex, band.variants.length);
    });
    if (badBand !== -1) {
      offenders.push(
        `seed ${String(seed)}: band ${String(bands[badBand]?.id ?? badBand)} drew an ineligible truth`,
      );
      break;
    }
  }
  if (offenders.length > 0) {
    issues.push(issue("seed-sweep", "error", "bands", offenders.join("; ")));
  }

  return issues;
}
