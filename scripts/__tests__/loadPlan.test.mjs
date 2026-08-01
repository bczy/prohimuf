import { describe, it, expect } from "vitest";
import { loadPlan } from "../lib/loadPlan.mjs";

/**
 * The loader-side half of the level-id allowlist (panel run-2 on PR #156,
 * defense in depth behind the workflows' own validate step): loadPlan resolves
 * the id into a path that jiti TRANSPILES AND EXECUTES, so a malformed id must
 * die here, before any file is resolved — not surface as a confusing import
 * error (or worse, execute a file outside src/game/levels/generated/).
 */
describe("loadPlan — level id allowlist", () => {
  it("loads a well-formed existing id", async () => {
    const plan = await loadPlan("fixture");
    expect(plan.id).toBe("fixture");
  });

  it.each([
    ["path traversal", "../levelPlan"], // would resolve to a REAL module and execute it
    ["nested path", "generated/fixture"],
    ["absolute path", "/etc/passwd"],
    ["uppercase (not a plan id shape)", "Fixture"],
    ["embedded space", "fixture plan"],
    ["empty string", ""],
    ["non-string", undefined],
  ])("rejects %s BEFORE resolving any file", async (_label, id) => {
    await expect(loadPlan(id)).rejects.toThrow(/invalid level id/);
  });

  it("still rejects a well-formed id whose module does not exist under generated/", async () => {
    await expect(loadPlan("no-such-level")).rejects.toThrow(/no generated plan/);
  });
});
