import { describe, it, expect } from "vitest";
import {
  CORE_ARCHETYPES,
  WEIGHTED,
  buildWeightedFrom,
  pickKind,
  pickKindFor,
} from "@game/types/enemyTypes";
import { spawnWave } from "@game/systems/enemySystem";
import { streetSpawnsCourier } from "@game/systems/courierSystem";
import { FACADE_01 } from "@game/maps/facade01";
import type { EnemyKind } from "@game/types/enemy";

// The default window pool, expressed as a weight map. This is the source of
// truth a level with no `roster` field implicitly uses.
const DEFAULT_WEIGHTS: Record<EnemyKind, number> = {
  normal: CORE_ARCHETYPES.normal.weight,
  riot: CORE_ARCHETYPES.riot.weight,
  biker: CORE_ARCHETYPES.biker.weight,
  bonus: CORE_ARCHETYPES.bonus.weight,
  civilian: CORE_ARCHETYPES.civilian.weight,
  hostage_taker: CORE_ARCHETYPES.hostage_taker.weight,
};

describe("AC1 — no roster ⇒ byte-for-byte identical window distribution", () => {
  it("pickKindFor over the default-built pool equals pickKind for the same seed", () => {
    const defaultPool = buildWeightedFrom(DEFAULT_WEIGHTS);
    for (let seed = -250; seed < 250; seed++) {
      expect(pickKindFor(seed, defaultPool)).toBe(pickKind(seed));
    }
  });

  it("buildWeightedFrom(defaults) reproduces the frozen WEIGHTED array exactly", () => {
    expect(buildWeightedFrom(DEFAULT_WEIGHTS)).toEqual(WEIGHTED);
  });

  it("spawnWave with no weights override is identical to spawnWave with the default pool", () => {
    const defaultPool = buildWeightedFrom(DEFAULT_WEIGHTS);
    for (let wave = 1; wave <= 8; wave++) {
      const legacy = spawnWave(wave, FACADE_01);
      const explicit = spawnWave(wave, FACADE_01, defaultPool);
      expect(explicit).toEqual(legacy);
    }
  });

  it("the spawned-kind sequence is a stable snapshot for a fixed seed set", () => {
    const kinds = Array.from({ length: 30 }, (_v, i) => pickKind(i * 31 + 7));
    expect(kinds).toMatchInlineSnapshot(`
      [
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
        "normal",
        "normal",
        "biker",
      ]
    `);
  });
});

describe("AC2 — roster.windowWeights override builds the pool from { ...defaults, ...override }", () => {
  it("an override merges on top of the defaults rather than replacing them", () => {
    // Bias heavily toward riot; biker keeps its default weight.
    const pool = buildWeightedFrom({ ...DEFAULT_WEIGHTS, riot: 200 });
    const riotCount = pool.filter((k) => k === "riot").length;
    const bikerCount = pool.filter((k) => k === "biker").length;
    expect(riotCount).toBe(200);
    expect(bikerCount).toBe(CORE_ARCHETYPES.biker.weight);
  });

  it("weight: 0 removes a kind from the pool entirely", () => {
    const pool = buildWeightedFrom({ ...DEFAULT_WEIGHTS, normal: 0 });
    expect(pool).not.toContain("normal");
    // The kinds that still carry weight remain present.
    expect(pool).toContain("riot");
  });

  it("pickKindFor never returns a kind whose override weight is 0", () => {
    const pool = buildWeightedFrom({ ...DEFAULT_WEIGHTS, normal: 0, bonus: 0 });
    for (let seed = 0; seed < 500; seed++) {
      const kind = pickKindFor(seed, pool);
      expect(kind).not.toBe("normal");
      expect(kind).not.toBe("bonus");
    }
  });

  it("an override that zeroes everything but one kind always picks that kind", () => {
    const pool = buildWeightedFrom({
      normal: 0,
      riot: 0,
      biker: 1,
      bonus: 0,
      civilian: 0,
    });
    for (let seed = -100; seed < 100; seed++) {
      expect(pickKindFor(seed, pool)).toBe("biker");
    }
  });

  it("buildWeightedFrom does not mutate the frozen WEIGHTED constant", () => {
    const before = [...WEIGHTED];
    buildWeightedFrom({ ...DEFAULT_WEIGHTS, riot: 999, normal: 0 });
    expect(WEIGHTED).toEqual(before);
  });
});

describe("AC3 — streetSpawns: ['courier'] ⇒ couriers spawn in the street", () => {
  it("an explicit ['courier'] roster keeps the courier spawn active", () => {
    expect(streetSpawnsCourier(["courier"])).toBe(true);
  });

  it("a roster that lists courier alongside future entities still spawns couriers", () => {
    expect(streetSpawnsCourier(["courier", "car", "hostage_taker"])).toBe(true);
  });

  it("absent streetSpawns ⇒ legacy courier-only behaviour is preserved", () => {
    expect(streetSpawnsCourier(undefined)).toBe(true);
  });
});

describe("AC4 — streetSpawns: [] ⇒ silent street, no spawn, no throw", () => {
  it("an empty roster suppresses courier spawning", () => {
    expect(streetSpawnsCourier([])).toBe(false);
  });

  it("a roster that omits courier (but lists others) suppresses courier spawning", () => {
    expect(streetSpawnsCourier(["car"])).toBe(false);
    expect(streetSpawnsCourier(["car", "hostage_taker"])).toBe(false);
  });

  it("the gate never throws for any street-spawn shape", () => {
    expect(() => streetSpawnsCourier([])).not.toThrow();
    expect(() => streetSpawnsCourier(undefined)).not.toThrow();
    expect(() => streetSpawnsCourier(["car", "hostage_taker"])).not.toThrow();
  });
});
