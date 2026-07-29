import { describe, expect, it } from "vitest";
import { NEAR_KIND_SPECS, nearKindSpec } from "../nearForegroundArt";
import { getNearForegroundTexture, warmNearForegroundTexture } from "../nearForegroundTextures";
import { getNearForeground } from "@game/levels/levelArt";
import { GENERATED_PLANS } from "@game/levels/generated";

/**
 * Generated-prop scoping, render side (spec-level-harness-sp1 §4.5, plan task 6,
 * panel findings on PR #149): a generated level's props resolve their sizing from
 * their OWN plan data, pass getNearForeground for their owner level only, and have
 * NO procedural fallback drawing — without their PNG they are simply absent.
 */
describe("generated near-foreground props", () => {
  const fixtureProp = GENERATED_PLANS.find((p) => p.id === "fixture")?.props[0];

  it("the fixture plan still declares the prop this suite is built on", () => {
    expect(fixtureProp).toBeDefined();
    expect(fixtureProp?.kind).toBe("fixture:kiosque");
  });

  it("nearKindSpec resolves a generated kind from its plan's own triplet", () => {
    expect(nearKindSpec("fixture:kiosque")).toEqual({
      aspect: fixtureProp?.aspect,
      heightFrac: fixtureProp?.heightFrac,
      footPadFrac: fixtureProp?.footPadFrac,
    });
  });

  it("nearKindSpec leaves the 8 pool kinds exactly on NEAR_KIND_SPECS", () => {
    for (const kind of Object.keys(NEAR_KIND_SPECS) as (keyof typeof NEAR_KIND_SPECS)[]) {
      expect(nearKindSpec(kind)).toBe(NEAR_KIND_SPECS[kind]);
    }
  });

  it("nearKindSpec degrades an unknown kind to the neutral bollard, never a crash", () => {
    expect(nearKindSpec("nulllevel:fantome")).toBe(NEAR_KIND_SPECS.bollard);
  });

  it("getNearForeground keeps a generated level's OWN props", () => {
    const layer = getNearForeground("fixture");
    expect(layer).not.toBeNull();
    expect(layer?.objects.map((o) => o.kind)).toContain("fixture:kiosque");
  });

  it("getNearForeground still hardens generated objects like pool ones", () => {
    const layer = getNearForeground("fixture");
    for (const obj of layer?.objects ?? []) {
      expect(Number.isFinite(obj.x)).toBe(true);
    }
  });

  it("a generated kind gets NO procedural texture: absent PNG ⇒ absent prop", async () => {
    await warmNearForegroundTexture("fixture:kiosque");
    // Non-DOM (vitest) short-circuits the PNG load entirely; either way the
    // contract is the same — no CanvasTexture fallback is ever built for it.
    expect(getNearForegroundTexture("fixture:kiosque")).toBeNull();
  });

  it("warming a generated kind never throws and resolves", async () => {
    await expect(warmNearForegroundTexture("fixture:kiosque")).resolves.toBeUndefined();
  });
});
