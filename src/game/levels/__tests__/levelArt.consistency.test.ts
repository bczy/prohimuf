import { describe, it, expect } from "vitest";
import { LEVELS } from "@game/levels/levels";
import { PRE_LEVEL_NARRATIVE, POST_LEVEL_NARRATIVE } from "@game/systems/narrativeSystem";
import { ARCHETYPES } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";
import manifest from "../levelArt.json";

/**
 * Cross-lane contract: keep the gameplay level list (levels.ts), the art
 * manifest (levelArt.json) and the narrative data (narrativeSystem.ts) in sync.
 * A level added to one but not the others — or a delivery pointing at a vehicle
 * archetype the manifest never declares — would break silently in the built
 * game; these assertions turn that into a failing unit test.
 */
describe("levelArt.json ↔ levels.ts ↔ narrative consistency", () => {
  it("declares the exact same level ids + names, in the same order", () => {
    // The tutorial stage (ADR-0012) has no backdrop art of its own — it is not in the
    // manifest by design. Compare only playable levels.
    const codeLevels = LEVELS.filter((l) => l.kind !== "tutorial").map((l) => ({
      id: l.id,
      name: l.name,
    }));
    const artLevels = manifest.levels.map((l) => ({ id: l.id, name: l.name }));
    expect(codeLevels).toEqual(artLevels);
  });

  it("only defines narrative for known level ids (keys ⊆ level ids)", () => {
    const levelIds = new Set(LEVELS.map((l) => l.id));
    for (const key of Object.keys(PRE_LEVEL_NARRATIVE)) {
      expect(levelIds.has(key)).toBe(true);
    }
    for (const key of Object.keys(POST_LEVEL_NARRATIVE)) {
      expect(levelIds.has(key)).toBe(true);
    }
  });

  it("every scripted delivery uses a vehicleType the manifest declares", () => {
    const vehicleTypes = new Set(Object.keys(manifest.vehicles.types));
    for (const level of LEVELS) {
      for (const delivery of level.deliveries) {
        expect(vehicleTypes.has(delivery.vehicleType)).toBe(true);
      }
    }
  });

  it("every vehicle asset path is non-empty and unique", () => {
    const assets = Object.values(manifest.vehicles.types).map((v) => v.asset);
    for (const asset of assets) {
      expect(asset.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(assets).size).toBe(assets.length);
  });
});

/**
 * Cross-lane contract: keep the enemy flipbook manifest (levelArt.json `enemies`
 * block) in sync with the sprite-key scheme the renderer computes in
 * `fileFor()` (src/render/scene/enemyTextures.ts). The manifest keys are the
 * exact base filenames (asset root + legacy variant suffix, no path/extension)
 * derived from ARCHETYPES. A key the renderer never asks for — or a
 * kind/variant/state the manifest forgets — would ship a broken or missing
 * flipbook; these assertions turn that into a failing unit test.
 *
 * The manifest is owned by another lane: these tests only *read* it. A failure
 * here is a contract mismatch to report, not a manifest to "fix".
 */
interface EnemyFlipbookEntry {
  readonly seed: number;
  readonly prompt: string;
  readonly frames: readonly string[];
}

// Mirror of enemyTextures.ts `fileFor()` root computation (kept in the render
// lane): idle root = spriteBase; shooting root = spriteBase + "_shooting",
// except the irregular legacy case spriteBase "enemy_sprite" -> "enemy_shooting".
function root(kind: EnemyKind, shooting: boolean): string {
  const base = ARCHETYPES[kind].spriteBase;
  if (!shooting) return base;
  return base === "enemy_sprite" ? "enemy_shooting" : `${base}_shooting`;
}

// The variant suffix scheme: variant 1 is the unsuffixed base, 2..N add `_v`.
function keysFor(kind: EnemyKind, shooting: boolean): string[] {
  const r = root(kind, shooting);
  const keys: string[] = [];
  for (let v = 1; v <= ARCHETYPES[kind].variants; v += 1) {
    keys.push(v > 1 ? `${r}_${String(v)}` : r);
  }
  return keys;
}

// Every legal base filename the renderer can request: idle for every variant,
// plus shooting for every variant of archetypes that shoot.
function allExpectedKeys(): string[] {
  const kinds = Object.keys(ARCHETYPES) as EnemyKind[];
  return kinds.flatMap((kind) => {
    const keys = keysFor(kind, false);
    if (ARCHETYPES[kind].shoots) keys.push(...keysFor(kind, true));
    return keys;
  });
}

describe("levelArt.json enemies flipbook ↔ ARCHETYPES sprite-key contract", () => {
  const enemies = manifest.enemies;
  const types = enemies.types as Record<string, EnemyFlipbookEntry>;

  it("has no orphan keys: every types key is a legal ARCHETYPES-derived base filename", () => {
    const legal = new Set(allExpectedKeys());
    for (const key of Object.keys(types)) {
      expect(legal.has(key), `unexpected enemy sprite key "${key}"`).toBe(true);
    }
  });

  it("is complete: idle (+ shooting where the archetype shoots) exists for every variant", () => {
    for (const key of allExpectedKeys()) {
      expect(types[key], `missing enemy sprite key "${key}"`).toBeDefined();
    }
  });

  it("every entry has a positive-integer seed, non-empty prompt and a valid frames flipbook", () => {
    for (const [key, entry] of Object.entries(types)) {
      expect(Number.isInteger(entry.seed), `${key}.seed integer`).toBe(true);
      expect(entry.seed, `${key}.seed positive`).toBeGreaterThan(0);
      expect(entry.prompt.trim().length, `${key}.prompt non-empty`).toBeGreaterThan(0);

      expect(Array.isArray(entry.frames), `${key}.frames array`).toBe(true);
      // Frame count is manifest-driven: only assert the 1..4 bound, never a
      // fixed 2 (shooters currently have 2, idles may have 1 — see scope guard).
      expect(entry.frames.length, `${key}.frames non-empty`).toBeGreaterThanOrEqual(1);
      expect(entry.frames.length, `${key}.frames <= 4`).toBeLessThanOrEqual(4);
      expect(entry.frames[0], `${key}.frames[0] is the committed unsuffixed base`).toBe("");
      for (const frame of entry.frames.slice(1)) {
        expect(frame.trim().length, `${key} extra frame non-empty`).toBeGreaterThan(0);
      }
    }
  });

  it("has sane block-level fps / size / style metadata", () => {
    expect(Number.isFinite(enemies.fps)).toBe(true);
    expect(enemies.fps).toBeGreaterThan(0);
    expect(Number.isInteger(enemies.size.width)).toBe(true);
    expect(enemies.size.width).toBeGreaterThan(0);
    expect(Number.isInteger(enemies.size.height)).toBe(true);
    expect(enemies.size.height).toBeGreaterThan(0);
    expect(enemies.style.trim().length).toBeGreaterThan(0);
  });

  it("permits single-frame flipbooks for non-shooting idle sprites (no hardcoded 2)", () => {
    // Scope guard: civilian/bonus are static poses; a 1-frame flipbook is valid
    // and completeness must NOT demand a second frame for them.
    for (const kind of ["civilian", "bonus"] as EnemyKind[]) {
      const key = root(kind, false); // variant 1, idle
      const entry = types[key];
      expect(entry, `missing idle sprite for ${kind}`).toBeDefined();
      if (!entry) continue;
      expect(entry.frames.length).toBeGreaterThanOrEqual(1);
    }
  });
});
