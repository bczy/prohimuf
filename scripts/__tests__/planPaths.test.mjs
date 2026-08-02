import { describe, it, expect } from "vitest";
import path from "path";
import { resolveBackdropFile } from "../lib/planPaths.mjs";

/**
 * La moitié RUNTIME de la loi de containment sur backdrop.file (ADR-0078 §3,
 * panel #156 run 8) : validateLevelPlan garde la forme au CI, ce resolver garde
 * le resolve — parce que planRunTarget/align-windows sont appelables avec un plan
 * littéral qui n'est jamais passé par loadPlan.
 */
const plan = (file) => ({ id: "fixture", backdrop: { mode: "single-wide", file, aspect: 5.14 } });

describe("resolveBackdropFile", () => {
  it("résout un stem sous le dossier du level", () => {
    expect(resolveBackdropFile(plan("street-wide"))).toMatch(
      new RegExp(
        `public\\${path.sep}assets\\${path.sep}levels\\${path.sep}fixture\\${path.sep}street-wide\\.png$`,
      ),
    );
  });

  it.each([
    ["traversal", "../../../../tmp/pwned"],
    ["absolu", "/tmp/pwned"],
    ["remonte puis redescend", "../vitry/street-wide"],
  ])("refuse un backdrop.file %s", (_label, file) => {
    expect(() => resolveBackdropFile(plan(file))).toThrow(/escapes public\/assets\/levels/);
  });
});
