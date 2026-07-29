import { describe, expect, it } from "vitest";
import { resolveGeneratedPreviewLevel } from "../generatedHarness";

/**
 * `?preview=level&level=<id>` reachability seam (spec-level-harness-sp1 §8): boots a
 * GENERATED level for verification — and can never boot a shipped one, the exact
 * reachability discipline of `resolveBossPreviewLevel` (E9).
 */
describe("resolveGeneratedPreviewLevel", () => {
  it("resolves a generated level by id", () => {
    expect(resolveGeneratedPreviewLevel("?preview=level&level=fixture")?.id).toBe("fixture");
  });

  it("NEVER resolves a shipped level — the campaign is not URL-bootable", () => {
    expect(resolveGeneratedPreviewLevel("?preview=level&level=belliard")).toBeNull();
    expect(resolveGeneratedPreviewLevel("?preview=level&level=niveau-final")).toBeNull();
  });

  it("yields null for an unknown id or a missing param", () => {
    expect(resolveGeneratedPreviewLevel("?preview=level&level=nope")).toBeNull();
    expect(resolveGeneratedPreviewLevel("?preview=level")).toBeNull();
  });
});
