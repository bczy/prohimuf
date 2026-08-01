import { describe, it, expect } from "vitest";
import { loadEnemiesFromPlan } from "../gen-enemy-types.mjs";
import { loadPlan } from "../lib/loadPlan.mjs";

describe("loadEnemiesFromPlan (gen-enemy-types.mjs --plan wiring, T5)", () => {
  it("maps the fixture plan's one archetype to one enemy descriptor", async () => {
    const plan = await loadPlan("fixture");
    const enemies = loadEnemiesFromPlan(plan, { style: " STYLE", width: 256, height: 256 });
    expect(enemies).toHaveLength(1);
    const [e] = enemies;
    expect(e.key).toBe("enemy_fixture_vigile"); // == plan.archetypes[0].spriteBase
    expect(e.style).toBe(" STYLE");
    expect(e.width).toBe(256);
    expect(e.height).toBe(256);
    expect(e.frames).toHaveLength(2);
    expect(e.frames[0]).toBe("");
  });

  it("strips the plan's own namespace out of the descriptor (never leaks 'fixture:' into the prompt)", async () => {
    const plan = await loadPlan("fixture");
    const [e] = loadEnemiesFromPlan(plan);
    expect(e.prompt).not.toContain("fixture:");
    expect(e.prompt).toContain("vigile");
  });

  it("gives a shooting archetype an aiming/firing pose clause, a non-shooter a neutral one", () => {
    const shooter = {
      id: "x",
      archetypes: [{ kind: "x:cop", spriteBase: "enemy_x_cop", shoots: true }],
    };
    const civilian = {
      id: "x",
      archetypes: [{ kind: "x:civ", spriteBase: "enemy_x_civ", shoots: false }],
    };
    expect(loadEnemiesFromPlan(shooter)[0].frames[1]).toMatch(/firing/);
    expect(loadEnemiesFromPlan(civilian)[0].frames[1]).not.toMatch(/firing/);
  });

  it("assigns a free (non-pinned) seed — different across two calls", () => {
    const plan = {
      id: "x",
      archetypes: [{ kind: "x:cop", spriteBase: "enemy_x_cop", shoots: true }],
    };
    const seeds = new Set(Array.from({ length: 20 }, () => loadEnemiesFromPlan(plan)[0].seed));
    // Overwhelmingly likely to see more than one distinct value in 20 rolls
    // over a [1, 99999] range if the seed is really randomized per call.
    expect(seeds.size).toBeGreaterThan(1);
  });
});
