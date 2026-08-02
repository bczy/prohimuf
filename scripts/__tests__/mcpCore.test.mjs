import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { join } from "node:path";

import { inspect, repoRoot, scaffold, validate } from "../mcp-level-editor/core.mjs";

/**
 * The pure core behind the MCP `validate`/`inspect`/`scaffold` tools
 * (spec-mcp-level-editor §3, ADR-0081 D3/D4). Loaded as a plain `.mjs` module
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

  it("composes validateLevel too — a plan validateLevelPlan ACCEPTS can still be rejected (panel r5)", () => {
    // The only composition path the short-circuit ordering leaves reachable, and the
    // one the §5.2 evidence used to describe wrongly: an UNPREFIXED windowWeights key
    // skips every plan-level guard (`if (!kind.includes(":")) continue`), so
    // validateLevelPlan returns [] and only validateLevel knows the kind is unknown.
    // If someone reorders registerGeneratedArchetypes/validateLevel back before the
    // plan gate — or drops the composition — this goes red.
    const plan = soundPlan("composed");
    plan.gameplay.windowWeights = { gendarme: 20 };
    plan.archetypes = [];
    const { issues } = validate({ plan });
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("unknown-enemy-kind");
    expect(issues[0].code.startsWith("plan/")).toBe(false);
  });

  it("rejects a plan carrying an unknown extra key (tsc would reject the scaffolded module — panel r8)", () => {
    for (const mutate of [
      (pl) => ({ ...pl, extraNote: "reviewed" }),
      (pl) => ({ ...pl, fiction: { ...pl.fiction, mood: "tendu" } }),
      (pl) => ({ ...pl, archetypes: [{ ...pl.archetypes[0], nickname: "le gros" }] }),
      (pl) => ({ ...pl, props: [{ ...pl.props[0], zIndex: 3 }] }),
    ]) {
      const { issues } = validate({ plan: mutate(soundPlan("extrakey")) });
      expect(issues.map((i) => i.code)).toContain("plan/malformed");
    }
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

  it("catches a genuine id collision already aggregated in the catalogue (two DISTINCT entries sharing an id)", () => {
    // Resubmitting the SAME id (`{ plan }` upserting its own slot) is no longer a
    // collision (M1) — a real collision is two DIFFERENT catalogue entries sharing
    // an id, which can only happen upstream of this call (a corrupted aggregation
    // in generated/index.ts). `validateCatalogue` still catches it.
    const { issues } = validate(
      { plan: soundPlan("other") },
      { plans: [soundPlan("dup"), soundPlan("dup")] },
    );
    expect(issues.map((i) => i.code)).toContain("plan/duplicate-id");
  });

  it("does not flag an already-registered levelId as its own duplicate", () => {
    const plan = soundPlan("already-in");
    expect(validate({ levelId: "already-in" }, { plans: [plan] })).toEqual({ issues: [] });
  });

  it("does not flag a fresh { plan } re-submission of an id already in the catalogue (upsert, not concat — M1)", () => {
    const plan = soundPlan("already-in");
    const { issues } = validate({ plan }, { plans: [plan] });
    expect(issues.map((i) => i.code)).not.toContain("plan/duplicate-id");
  });

  it("reports plan/missing-input when neither { plan } nor { levelId } is given", () => {
    // Wire-reachable: the server's zod schema makes BOTH optional, so `validate {}`
    // is a shape the transport accepts and this branch must answer for.
    for (const input of [{}, { overwrite: true }, undefined]) {
      const { issues } = validate(input);
      expect(issues.map((i) => i.code)).toEqual(["plan/missing-input"]);
    }
  });

  it("refuses { plan } and { levelId } together instead of silently preferring one (panel r4)", () => {
    const plan = soundPlan("ambig");
    const { issues } = validate({ plan, levelId: "fixture" }, { plans: [plan] });
    expect(issues.map((i) => i.code)).toEqual(["plan/ambiguous-input"]);
  });

  it("rends des issues sans throw pour un plan malformé (M2)", () => {
    expect(() => validate({ plan: { id: "safe" } })).not.toThrow();
    const { issues } = validate({ plan: { id: "safe" } });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("cumule les issues plan-level ET catalogue en un seul appel (feedback one-shot, §6.7)", () => {
    const broken = soundPlan("oneshot");
    broken.archetypes[0].weight = 3;
    const dupA = soundPlan("twice");
    const dupB = soundPlan("twice");
    const { issues } = validate({ plan: broken }, { plans: [dupA, dupB] });
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("plan/weight-nonzero");
    expect(codes).toContain("plan/duplicate-id");
  });

  it("rends des issues sans throw pour un plan null ou non-objet (R1 — malformed avant l'upsert)", () => {
    for (const plan of [null, 42, "plan", [], true]) {
      expect(() => validate({ plan })).not.toThrow();
      const { issues } = validate({ plan });
      expect(issues.map((i) => i.code)).toContain("plan/malformed");
    }
  });

  it("does not pollute the archetype registry when validating a rejected plan (m3)", async () => {
    const { archetype, registerGeneratedArchetypes } = await import("@game/types/enemyTypes");
    const id = "regcheck";
    const original = { ...soundPlan(id).archetypes[0], hp: 2 };
    registerGeneratedArchetypes([original]);
    expect(archetype(original.kind).hp).toBe(2);

    // Same kind, but weight-nonzero ⇒ rejected by validateLevelPlan before the
    // registry is ever touched — the process's registered entry must stay hp: 2,
    // not silently become hp: -99.
    const rejected = { ...soundPlan(id), archetypes: [{ ...original, hp: -99, weight: 3 }] };
    const { issues } = validate({ plan: rejected });
    expect(issues.map((i) => i.code)).toContain("plan/weight-nonzero");

    expect(archetype(original.kind).hp).toBe(2);
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

  it("refuses to scaffold over generated/index.ts even with overwrite: true (panel r8)", () => {
    const rootDir = rootDirFor();
    const result = scaffold({ plan: soundPlan("index"), overwrite: true }, { rootDir });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("scaffold/reserved-id");
  });

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
    expect(result.path).toBe(path.join(rootDir, "src", "game", "levels", "generated", `${id}.ts`));
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

  it("refuses to re-scaffold a level ALREADY in the catalogue with scaffold/exists, not plan/duplicate-id (M1)", () => {
    const rootDir = rootDirFor();
    const plan = soundPlan("cataloged");
    expect(scaffold({ plan }, { rootDir, plans: [plan] }).ok).toBe(true);
    const second = scaffold({ plan }, { rootDir, plans: [plan] });
    expect(second.ok).toBe(false);
    expect(second.issues[0].code).toBe("scaffold/exists");
  });

  it("re-scaffolds a level already in the catalogue when overwrite: true is explicit (M1)", () => {
    const rootDir = rootDirFor();
    const plan = soundPlan("cataloged2");
    expect(scaffold({ plan }, { rootDir, plans: [plan] }).ok).toBe(true);
    const second = scaffold({ plan, overwrite: true }, { rootDir, plans: [plan] });
    expect(second.ok).toBe(true);
  });
});

describe("repoRoot", () => {
  it("resolves to the real repo root (this file's own package.json)", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot(), "package.json"), "utf8"));
    expect(pkg.name).toBe("muf");
  });
});
