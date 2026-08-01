import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { join } from "node:path";

import { inspect, repoRoot, scaffold, validate } from "../mcp-level-editor/core.mjs";

/**
 * The pure core behind the MCP `validate`/`inspect`/`scaffold` tools
 * (spec-mcp-level-editor §3, ADR-0077 D3/D4). Loaded as a plain `.mjs` module
 * that imports TS from `src/game/**` — vitest resolves `@game/*` the same way
 * it resolves it for every `src/game` test (`vitest.config.ts`), which is what
 * lets this suite prove the "two surfaces, one core" claim (§6): this test
 * calls `core.mjs` IN LIBRARY FORM, with zero MCP server involved.
 */

/** A sound minimal plan — same shape as `generated/fixture.ts`. */
const soundPlan = (id = "mcptest") => ({
  id,
  fiction: { name: "MCP Test", label: "Test level", district: "Test", year: "1998" },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [
    {
      kind: `${id}:vigile`,
      hp: 2,
      bulletDamage: 0.5,
      hiddenDuration: 1.6,
      visibleDuration: 3.0,
      shoots: true,
      scoreDelta: 2,
      livesDelta: 0,
      timeDelta: 0,
      countsAsTarget: true,
      weight: 0,
      spriteBase: `enemy_${id}_vigile`,
      variants: 1,
      tint: "#ffffff",
      aspect: 1,
    },
  ],
  props: [
    {
      kind: `${id}:kiosque`,
      asset: `assets/nearfg/${id}/kiosque.png`,
      aspect: 0.6,
      heightFrac: 0.28,
      footPadFrac: 0.15,
      x: 0.22,
      row: "far",
    },
  ],
  gameplay: {
    enemiesToWin: 5,
    timeSeconds: 60,
    enemySpeedMultiplier: 1,
    windowWeights: { [`${id}:vigile`]: 20 },
  },
});

/** A deliberately broken plan (spec §6): non-zero weight + wrong namespace. */
const brokenPlan = () => ({
  ...soundPlan("broken"),
  archetypes: [{ ...soundPlan("broken").archetypes[0], weight: 3, kind: "autre:vigile" }],
});

describe("validate", () => {
  it("resolves a broken plan (given directly) to its expected plan/* issues", () => {
    const { issues } = validate({ plan: brokenPlan() });
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("plan/weight-nonzero");
    expect(codes).toContain("plan/namespace");
  });

  it("resolves a sound plan to no issues", () => {
    expect(validate({ plan: soundPlan("mcpvalidatesound") })).toEqual({ issues: [] });
  });

  it("resolves the fixture level by id, through the real catalogue", () => {
    expect(validate({ levelId: "fixture" })).toEqual({ issues: [] });
  });

  it("reports an unknown levelId as an issue rather than throwing", () => {
    const { issues } = validate({ levelId: "does-not-exist" });
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("plan/unknown-level-id");
  });

  it("catches an id collision between a fresh plan and the known catalogue", () => {
    const { issues } = validate(
      { plan: soundPlan("dup") },
      { plans: [soundPlan("dup")] },
    );
    expect(issues.map((i) => i.code)).toContain("plan/duplicate-id");
  });

  it("does not flag an already-registered levelId as its own duplicate", () => {
    const plan = soundPlan("already-in");
    expect(validate({ levelId: "already-in" }, { plans: [plan] })).toEqual({ issues: [] });
  });
});

describe("inspect", () => {
  it("reports every fixture asset as missing (no art committed for it, by design)", () => {
    const result = inspect({ levelId: "fixture" });
    expect(result.plan.id).toBe("fixture");
    expect(result.config.id).toBe("fixture");
    expect(result.art.id).toBe("fixture");
    expect(result.assets.present).toEqual([]);
    expect(result.assets.missing).toEqual(
      expect.arrayContaining([
        "assets/levels/fixture/street-wide.png",
        "assets/enemy_fixture_vigile.png",
        "assets/nearfg/fixture/kiosque.png",
      ]),
    );
  });

  it("throws on an unknown levelId", () => {
    expect(() => inspect({ levelId: "does-not-exist" })).toThrow(/does-not-exist/);
  });
});

describe("scaffold", () => {
  let dir;
  afterEach(() => {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  });

  const rootDirFor = () => {
    dir = mkdtempSync(join(tmpdir(), "mcp-scaffold-"));
    return dir;
  };

  it("refuses an id containing a path separator, before touching disk", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: soundPlan("evil/id") }, { rootDir });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("scaffold/invalid-id");
  });

  it("refuses an id containing '..'", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: soundPlan("../escape") }, { rootDir });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("scaffold/invalid-id");
  });

  it("refuses an id with a backslash", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: soundPlan("evil\\id") }, { rootDir });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("scaffold/invalid-id");
  });

  it("refuses a plan that validate rejects, before touching disk", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: brokenPlan() }, { rootDir });
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("plan/weight-nonzero");
    expect(existsSync(path.join(rootDir, "src"))).toBe(false);
  });

  it("writes a sound plan as a generated/<id>.ts module the schema accepts", () => {
    const rootDir = rootDirFor();
    const id = "scaffolded";
    const result = scaffold({ plan: soundPlan(id) }, { rootDir });
    expect(result.ok).toBe(true);
    expect(result.path).toBe(
      path.join(rootDir, "src", "game", "levels", "generated", `${id}.ts`),
    );
    expect(result.reminder).toMatch(/GENERATED_PLANS/);
    expect(result.reminder).toMatch(/index\.ts/);

    const source = readFileSync(result.path, "utf8");
    expect(source).toMatch(/^import type \{ LevelPlan \} from "@game\/levels\/levelPlan";/);
    expect(source).toContain("Generated by the MCP level-editor `scaffold` tool");
    expect(source).toMatch(/export const plan: LevelPlan = /);
    expect(source).toContain(`"id": "${id}"`);
  });

  it("never edits index.ts, never touches git", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: soundPlan("noindex") }, { rootDir });
    expect(result.ok).toBe(true);
    expect(existsSync(path.join(rootDir, "src/game/levels/generated/index.ts"))).toBe(false);
    expect(existsSync(path.join(rootDir, ".git"))).toBe(false);
  });

  it("refuses to overwrite an existing module without overwrite: true", () => {
    const rootDir = rootDirFor();
    const id = "onceonly";
    expect(scaffold({ plan: soundPlan(id) }, { rootDir }).ok).toBe(true);
    const second = scaffold({ plan: soundPlan(id) }, { rootDir });
    expect(second.ok).toBe(false);
    expect(second.issues[0].code).toBe("scaffold/exists");
  });

  it("overwrites when overwrite: true is explicit", () => {
    const rootDir = rootDirFor();
    const id = "replaceme";
    expect(scaffold({ plan: soundPlan(id) }, { rootDir }).ok).toBe(true);
    const second = scaffold({ plan: soundPlan(id), overwrite: true }, { rootDir });
    expect(second.ok).toBe(true);
  });
});

describe("repoRoot", () => {
  it("resolves to the real repo root (this file's own package.json)", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot(), "package.json"), "utf8"));
    expect(pkg.name).toBe("muf");
  });
});
