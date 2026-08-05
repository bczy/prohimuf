import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { planRunTarget } from "../gen-street-paid.mjs";
import { seedFromLevelId, STYLE_BLOCK } from "../lib/paidPrompt.mjs";
import { loadPlan } from "../lib/loadPlan.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Pure wiring checks — no network. The fixture plan (checked in for the schema
// tests, spec-level-harness-sp1 §8) doubles as the "real generated plan" input
// here since it is a genuine `src/game/levels/generated/*.ts` module.
describe("planRunTarget (gen-street-paid.mjs --plan wiring)", () => {
  it("resolves the output path under public/assets/levels/<id>/<backdrop.file>.png", async () => {
    const plan = await loadPlan("fixture");
    const target = planRunTarget(plan);
    expect(target.outFile).toBe(
      path.resolve(REPO_ROOT, "public/assets/levels/fixture/street-wide.png"),
    );
  });

  it("pins the seed to the deterministic hash of the levelId (spec §2.2)", async () => {
    const plan = await loadPlan("fixture");
    const target = planRunTarget(plan);
    expect(target.seed).toBe(seedFromLevelId("fixture"));
  });

  it("carries the house STYLE_BLOCK verbatim in the built prompt", async () => {
    const plan = await loadPlan("fixture");
    const target = planRunTarget(plan);
    expect(target.prompt).toContain(STYLE_BLOCK);
  });
});
