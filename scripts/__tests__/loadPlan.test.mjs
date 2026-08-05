import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPlan, planIdFromArgs } from "../lib/loadPlan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

describe("loadPlan — le verrou d'id (panel #156 run 3)", () => {
  it("refuse un module dont plan.id ne correspond pas au fichier (copy-paste leftover)", async () => {
    const dir = path.resolve(ROOT, "src/game/levels/generated");
    const file = path.join(dir, "mismatch.ts");
    fs.writeFileSync(
      file,
      'import type { LevelPlan } from "@game/levels/levelPlan";\n' +
        'export const plan = { id: "fixture" } as unknown as LevelPlan;\n',
    );
    try {
      await expect(loadPlan("mismatch")).rejects.toThrow(
        /plan\.id "fixture".*loaded as "mismatch"/s,
      );
    } finally {
      fs.rmSync(file);
    }
  });
});

describe("loadPlan — validation du plan (panel #156 run 4)", () => {
  it("refuse un brouillon invalide AVANT toute dépense (aspect 0)", async () => {
    const file = path.resolve(ROOT, "src/game/levels/generated/draft-invalid.ts");
    fs.writeFileSync(
      file,
      'import type { LevelPlan } from "@game/levels/levelPlan";\n' +
        "export const plan = {\n" +
        '  id: "draft-invalid",\n' +
        '  fiction: { name: "D", label: "D", district: "D", year: "1998" },\n' +
        '  backdrop: { mode: "single-wide", file: "street-wide", aspect: 0 },\n' +
        "  archetypes: [],\n  props: [],\n" +
        "  gameplay: { enemiesToWin: 5, timeSeconds: 60, enemySpeedMultiplier: 1, windowWeights: {} },\n" +
        "} as unknown as LevelPlan;\n",
    );
    try {
      await expect(loadPlan("draft-invalid")).rejects.toThrow(/not a valid LevelPlan|aspect/i);
    } finally {
      fs.rmSync(file);
    }
  });
});

describe("planIdFromArgs — l'unique lecture de --plan (panel #156 run 10)", () => {
  it("rend null quand le flag est absent (mode hérité)", () => {
    expect(planIdFromArgs(["--force"])).toBeNull();
  });

  it("rend l'id quand il est fourni", () => {
    expect(planIdFromArgs(["--plan", "fixture", "--force"])).toBe("fixture");
  });

  it.each([
    ["valeur manquante", ["--plan"]],
    ["suivi d'un autre flag", ["--plan", "--force"]],
  ])("jette quand le flag est %s", (_label, args) => {
    expect(() => planIdFromArgs(args)).toThrow(/--plan requires a level id/);
  });
});
